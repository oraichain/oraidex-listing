import { compare } from '@oraichain/cosmwasm-vm-js';
import { SimulateCosmWasmClient } from '@oraichain/cw-simulate';
import { OraiswapLimitOrderClient } from '@oraichain/oraidex-contracts-sdk';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { SortedMap } from '@oraichain/immutable';

if (typeof __dirname === 'undefined') {
  const __filename = fileURLToPath(import.meta.url);
  globalThis.__dirname = path.dirname(__filename);
}

export class BufferStream {
  constructor(filePath) {
    if (!fs.existsSync(filePath)) {
      this.sizeBuf = Buffer.alloc(4);
      fs.writeFileSync(filePath, this.sizeBuf);
      this.fd = fs.openSync(filePath, 'r+');
    } else {
      this.fd = fs.openSync(filePath, 'r+');
      this.sizeBuf = Buffer.allocUnsafe(4);
      fs.readSync(this.fd, this.sizeBuf, 0, 4, 0);
    }
  }

  increaseSize() {
    for (let i = this.sizeBuf.length - 1; i >= 0; --i) {
      if (this.sizeBuf[i] === 255) {
        this.sizeBuf[i] = 0;
      } else {
        this.sizeBuf[i]++;
        break;
      }
    }
  }

  get size() {
    return this.sizeBuf.readUInt32BE();
  }

  close() {
    fs.closeSync(this.fd);
  }

  write(entries) {
    let n = 0;
    for (const [k, v] of entries) {
      n += k.length + v.length + 3;
    }
    const outputBuffer = Buffer.allocUnsafe(n);
    let ind = 0;
    for (const [k, v] of entries) {
      outputBuffer[ind++] = k.length;
      outputBuffer.set(k, ind);
      ind += k.length;
      outputBuffer[ind++] = (v.length >> 8) & 0b11111111;
      outputBuffer[ind++] = v.length & 0b11111111;
      outputBuffer.set(v, ind);
      ind += v.length;
      this.increaseSize();
    }
    // update size
    fs.writeSync(this.fd, this.sizeBuf, 0, 4, 0);
    // append item
    fs.appendFileSync(this.fd, outputBuffer);
  }
}

class BufferIter {
  constructor(buf, size) {
    this.buf = buf;
    this.size = size;
    this.ind = 0;
    this.bufInd = 0;
  }

  next() {
    if (this.ind === this.size) {
      return {
        done: true
      };
    }

    const keyLength = this.buf[this.bufInd++];
    const k = this.buf.subarray(this.bufInd, (this.bufInd += keyLength));
    const valueLength = (this.buf[this.bufInd++] << 8) | this.buf[this.bufInd++];
    const v = this.buf.subarray(this.bufInd, (this.bufInd += valueLength));
    this.ind++;
    return {
      value: [k, v]
    };
  }
}

class BufferCollection {
  constructor(buf) {
    this.size = buf.readUInt32BE();
    this.buf = buf.subarray(4);
  }

  entries() {
    return new BufferIter(this.buf, this.size);
  }
}

BufferCollection.prototype['@@__IMMUTABLE_KEYED__@@'] = true;

const downloadState = async (contractAddress, writeCallback, endCallback, startAfter, limit = 1000) => {
  let nextKey = startAfter;

  while (true) {
    const url = new URL(`https://lcd.orai.io/cosmwasm/wasm/v1/contract/${contractAddress}/state`);
    url.searchParams.append('pagination.limit', limit.toString());
    if (nextKey) {
      url.searchParams.append('pagination.key', nextKey);
      console.log('nextKey', nextKey);
    }
    try {
      const { models, pagination } = await fetch(url.toString(), { signal: AbortSignal.timeout(30000) }).then((res) =>
        res.json()
      );
      writeCallback(models);
      if (!(nextKey = pagination.next_key)) {
        return endCallback();
      }
    } catch (ex) {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
};

const saveState = async (contractAddress, nextKey) => {
  const contractState = path.resolve(__dirname, `${contractAddress}.state`);
  await new Promise((resolve) => {
    downloadState(
      contractAddress,
      (chunks) => {
        const entries = chunks.map(({ key, value }) => [Buffer.from(key, 'hex'), Buffer.from(value, 'base64')]);
        bufStream.write(entries);
      },
      resolve,
      nextKey
    );
  });

  const contractFile = path.resolve(__dirname, contractAddress);
  if (!fs.existsSync(contractFile)) {
    const {
      contract_info: { code_id }
    } = await fetch(`https://lcd.orai.io/cosmwasm/wasm/v1/contract/${contractAddress}`).then((res) => res.json());
    const { data } = await fetch(`https://lcd.orai.io/cosmwasm/wasm/v1/code/${code_id}`).then((res) => res.json());
    fs.writeFileSync(contractFile, Buffer.from(data, 'base64'));
  }
  console.log('done');
};

/**
 * @param {SimulateCosmWasmClient} client
 */
const loadState = async (contractAddress, client, label) => {
  const buffer = fs.readFileSync(path.resolve(__dirname, `${contractAddress}.state`));
  // console.time('rawpack ' + contractAddress);
  const data = SortedMap.rawPack(new BufferCollection(buffer), compare);
  // console.timeLog('rawpack ' + contractAddress, data.size);

  const { codeId } = await client.upload(
    senderAddress,
    fs.readFileSync(path.resolve(__dirname, contractAddress)),
    'auto'
  );

  await client.loadContract(
    contractAddress,
    {
      codeId,
      admin: senderAddress,
      label: label ?? contractAddress,
      creator: senderAddress,
      created: 1
    },
    data
  );
};

const senderAddress = 'orai14vcw5qk0tdvknpa38wz46js5g7vrvut8lk0lk6';

(async () => {
  const client = new SimulateCosmWasmClient({
    chainId: 'Oraichain',
    bech32Prefix: 'orai'
    // metering: true
  });

  const storages = {
    auction: 'orai1u8r0kkmevkgjkeacfgh0jv268kap82af937pwz',
    offering: 'orai15cmdgfph74uahck6edl6zz5mg5z7gwxyehyggm',
    ai_royalty: 'orai1s5jlhcnqc00hqmldhts5jtd7f3tfwmr4lfheg8',
    offering_v2: 'orai107ku785v2e52e9kxe26kaguene3re7cy396uq6',
    'offering_v1.1': 'orai1hur7m6wu7v79t6m3qal6qe0ufklw8uckrxk5lt',
    datahub_storage: 'orai1mlslct409ztn96j4zrywg9l26xr8gpwe2npdv4',
    '1155_storage': 'orai1v2psavrxwgh39v0ead7z4rcn4qq2cfnast98m9',
    auction_extend: 'orai1c5eftzwqqsth437uemx45qgyr38djhkde7t2as',
    rejected_storage: 'orai1fp9lernzdwkg5z9l9ejrwjmjvezzypacspmw27',
    whitelist_storage: 'orai1u4zqgyt8adq45a8xffc356dr8dqsny6merh0h0',
    market_721_payment_storage: 'orai1ynvtgqffwgcxxx0hnehj4t7gsmv25nrr770s83',
    market_1155_payment_storage: 'orai1l783x7q0yvr9aklr2zkpkpspq7vmxmfnndgl7c',
    governance: 'orai14tqq093nu88tzs7ryyslr78sm3tzrmnpem6fak',
    implementation: 'orai1yngprf4w3s0hvgslr2txntk5kwrkp8kcqv2n3ceqy7xrazqx8nasp6xkff',
    orderbook: 'orai1nt58gcu4e63v7k55phnr3gaym9tvk3q4apqzqccjuwppgjuyjy6sxk8yzp'
  };

  for (const [label, addr] of Object.entries(storages)) await loadState(addr, client, label);

  console.log(await client.queryContractSmart(storages.implementation, { offering: { get_offerings: { limit: 1 } } }));

  const orderbookContract = new OraiswapLimitOrderClient(client, senderAddress, storages.orderbook);
  const start = performance.now();
  const ret = await orderbookContract.orders({
    filter: { bidder: 'orai1g4s5qdw54wdj6ggukfdr59j4uv82asczunxpj7' },
    assetInfos: [
      {
        native_token: { denom: 'orai' }
      },
      {
        token: {
          contract_addr: 'orai12hzjxfh77wl572gdzct2fxv2arxcwh6gykc7qh'
        }
      }
    ]
  });
  console.dir(ret, { depth: null });
  console.log('Took', performance.now() - start, 'ms');
})();

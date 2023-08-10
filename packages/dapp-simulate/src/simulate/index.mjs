import { SimulateCosmWasmClient } from '@oraichain/cw-simulate';
import { BinaryKVIterStorage, BasicKVIterStorage } from '@oraichain/cosmwasm-vm-js';
import { OraiswapLimitOrderClient } from '@oraichain/oraidex-contracts-sdk';
import path from 'path';
import fsPromise from 'fs/promises';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { deserialize } from 'v8';

if (typeof __dirname === 'undefined') {
  const __filename = fileURLToPath(import.meta.url);
  globalThis.__dirname = path.dirname(__filename);
}

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
  await new Promise((resolve) => {
    downloadState(
      contractAddress,
      (chunks) => {
        const data = chunks.map(({ key, value }) => `${Buffer.from(key, 'hex').toString('base64')},${value}`);
        fs.appendFileSync(path.resolve(__dirname, `${contractAddress}.csv`), data.join('\n') + '\n');
      },
      resolve,
      nextKey
    );
  });

  const {
    contract_info: { code_id }
  } = await fetch(`https://lcd.orai.io/cosmwasm/wasm/v1/contract/${contractAddress}`).then((res) => res.json());
  const { data } = await fetch(`https://lcd.orai.io/cosmwasm/wasm/v1/code/${code_id}`).then((res) => res.json());
  fs.writeFileSync(path.resolve(__dirname, contractAddress), Buffer.from(data, 'base64'));

  console.log('done');
};

/**
 * @param {SimulateCosmWasmClient} client
 */
const loadState = async (contractAddress, client, label) => {
  let data;
  if (client.app.kvIterStorageRegistry === BinaryKVIterStorage) {
    const buffer = await fsPromise.readFile(path.resolve(__dirname, `${contractAddress}.state`));
    data = deserialize(buffer);
  } else {
    const buffer = await fsPromise.readFile(path.resolve(__dirname, `${contractAddress}.csv`));
    data = [];
    for (const line of buffer.toString().trim().split('\n')) {
      const [k, v] = line.split(',', 2);
      data.push([k, v]);
    }
  }

  const { codeId } = await client.upload(
    senderAddress,
    await fsPromise.readFile(path.resolve(__dirname, contractAddress)),
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
  });

  const storages = {
    auction: 'orai1u8r0kkmevkgjkeacfgh0jv268kap82af937pwz',
    offering: 'orai15cmdgfph74uahck6edl6zz5mg5z7gwxyehyggm',
    ai_royalty: 'orai1s5jlhcnqc00hqmldhts5jtd7f3tfwmr4lfheg8',
    offering_v2: 'orai107ku785v2e52e9kxe26kaguene3re7cy396uq6',
    'offering_v1.1': 'orai1hur7m6wu7v79t6m3qal6qe0ufklw8uckrxk5lt',
    datahub_storage: 'orai1mlslct409ztn96j4zrywg9l26xr8gpwe2npdv4',
    ai_royalty_temp: 'orai1s5jlhcnqc00hqmldhts5jtd7f3tfwmr4lfheg8',
    '1155_storage': 'orai1v2psavrxwgh39v0ead7z4rcn4qq2cfnast98m9',
    auction_extend: 'orai1c5eftzwqqsth437uemx45qgyr38djhkde7t2as',
    rejected_storage: 'orai1fp9lernzdwkg5z9l9ejrwjmjvezzypacspmw27',
    whitelist_storage: 'orai1u4zqgyt8adq45a8xffc356dr8dqsny6merh0h0',
    market_721_payment_storage: 'orai1ynvtgqffwgcxxx0hnehj4t7gsmv25nrr770s83',
    market_1155_payment_storage: 'orai1l783x7q0yvr9aklr2zkpkpspq7vmxmfnndgl7c',
    governance: 'orai14tqq093nu88tzs7ryyslr78sm3tzrmnpem6fak',
    implementation: 'orai1yngprf4w3s0hvgslr2txntk5kwrkp8kcqv2n3ceqy7xrazqx8nasp6xkff'
  };

  await Promise.all(Object.entries(storages).map(([label, addr]) => loadState(addr, client, label)));
  console.log(await client.queryContractSmart(storages.implementation, { offering: { get_offerings: {} } }));

  const contractAddress = 'orai1nt58gcu4e63v7k55phnr3gaym9tvk3q4apqzqccjuwppgjuyjy6sxk8yzp';
  await loadState(contractAddress, client, 'orderbook');

  const orderbook = new OraiswapLimitOrderClient(client, senderAddress, contractAddress);
  console.time('search');
  console.dir(
    await orderbook.orders({
      filter: {
        bidder: 'orai1kq0vsru8ufey2pduv7yn4ppp3h8k028tqmgpfw'
      },
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
    }),
    { depth: null }
  );
  console.timeEnd('search');
})();

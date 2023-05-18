import { Coin } from '@cosmjs/amino';
import { CwIcs20LatestTypes } from '@oraichain/common-contracts-sdk';
import { OraiswapPairTypes, OraiswapStakingTypes, OraiswapTokenTypes, Asset } from '@oraichain/oraidex-contracts-sdk';

async function httpGet(url: string) {
  const data = await fetch(url).then((data) => data.json());
  return data;
}

async function getPrice(url: string): Promise<number> {
  const fetchData = await httpGet(url);
  const price = (Object.values(fetchData) as any)[0].usd;
  return price;
}

async function getTokenAmount(oraiAmount: string, tokenCoingeckoId: string): Promise<string> {
  const urls = [
    'https://api.coingecko.com/api/v3/simple/price?ids=oraichain-token&vs_currencies=usd',
    `https://api.coingecko.com/api/v3/simple/price?ids=${tokenCoingeckoId}&vs_currencies=usd`
  ];
  const prices = await Promise.all(urls.map((url) => getPrice(url)));
  const tokenAmount = ((prices[0] / prices[1]) * parseFloat(oraiAmount)).toFixed(0);
  return tokenAmount;
}

function buildExecuteWasmMessage(contract_addr: string, msg: Object, funds?: Coin[]) {
  // TODO: need to hardcode this part because the old structure of wasm message is execute.send, not funds
  if (process.env.MULTISIG_ADDRESS === 'orai1fs25usz65tsryf0f8d5cpfmqgr0xwup4kjqpa0') {
    return {
      wasm: {
        execute: {
          contract_addr,
          msg,
          send: funds ? funds : []
        }
      }
    };
  }
  return {
    wasm: {
      execute: {
        contract_addr,
        msg,
        funds: funds ? funds : []
      }
    }
  };
}

export async function buildMultisigMessages(data: {
  cw20ContractAddress: string;
  remoteDenom: string;
  remoteDecimals: string;
  ibcWasmAddress: string;
  pairAddress: string;
  lpAddress: string;
  localChannelId: string;
  stakingContract: string;
  tokenCoingeckoId: string;
}): Promise<any[]> {
  const {
    cw20ContractAddress,
    remoteDecimals,
    remoteDenom,
    ibcWasmAddress,
    stakingContract,
    pairAddress,
    lpAddress,
    localChannelId,
    tokenCoingeckoId
  } = data;
  // update mapping converter
  let msgs: any[] = [];
  if (Object.values(data).filter((value) => !value).length > 0) {
    console.log(data);
    throw new Error('Invalid params');
  }
  const asset_info = { token: { contract_addr: cw20ContractAddress } };
  msgs.push(
    buildExecuteWasmMessage(ibcWasmAddress, {
      update_mapping_pair: {
        asset_info,
        asset_info_decimals: 6,
        denom: remoteDenom,
        local_channel_id: localChannelId,
        remote_decimals: parseInt(remoteDecimals)
      }
    } as CwIcs20LatestTypes.ExecuteMsg)
  );

  // create mining pool
  msgs.push(
    buildExecuteWasmMessage(stakingContract, {
      register_asset: {
        asset_info,
        staking_token: lpAddress
      }
    } as OraiswapStakingTypes.ExecuteMsg)
  );

  // add reward per second for the mining pool
  msgs.push(
    buildExecuteWasmMessage(stakingContract, {
      update_rewards_per_sec: {
        asset_info,
        assets: [
          { info: { native_token: { denom: constants.oraiDenom } }, amount: '1' },
          { info: { token: { contract_addr: cw20ContractAddress } }, amount: '1' }
        ] as Asset[]
      }
    } as OraiswapStakingTypes.ExecuteMsg)
  );

  // add increase allowance msg for the pair contract to provide lp later
  msgs.push(
    buildExecuteWasmMessage(cw20ContractAddress, {
      increase_allowance: {
        amount: '100000000000', // hard-coded 10k amount allowance. Not high but not low, just to be safe
        spender: pairAddress
      }
    } as OraiswapTokenTypes.ExecuteMsg)
  );

  // provide liquidity
  const oraiAmount = '1000000'; // hard-code for simplicity, can be an user input
  const tokenAmount = await getTokenAmount(oraiAmount, tokenCoingeckoId);
  msgs.push(
    buildExecuteWasmMessage(
      pairAddress,
      {
        provide_liquidity: {
          assets: [
            { info: asset_info, amount: tokenAmount },
            { info: { native_token: { denom: constants.oraiDenom } }, amount: oraiAmount }
          ]
        }
      } as OraiswapPairTypes.ExecuteMsg,
      [{ denom: constants.oraiDenom, amount: oraiAmount }]
    )
  );
  return msgs;
}

export function buildMultisigProposeMsg(title: string, msgs: any[]) {
  const proposeMsg = {
    propose: {
      title,
      description: title,
      msgs: msgs.map((msg) => ({
        wasm: {
          execute: { ...msg.wasm.execute, msg: Buffer.from(JSON.stringify(msg.wasm.execute.msg)).toString('base64') }
        }
      }))
    }
  };
  return proposeMsg;
}

export const constants = {
  codeId: 761,
  adminInitialBalances: '10000000000',
  devInitialBalances: '20000000',
  ibcWasmInitialBalances: '1000000000',
  cw20Decimals: 6,
  devAddress: 'orai1g4h64yjt0fvzv5v2j8tyfnpe5kmnetejvfgs7g',
  oraiDenom: 'orai'
};

import { Coin } from "@cosmjs/amino";
import { ExecuteMsg as ExecuteIbcWasmMsg } from "./contracts/Cw20Ics20.types";
import { ExecuteMsg as ExecutePairMsg } from "./contracts/OraiswapPair.types";
import { ExecuteMsg as ExecuteStakingMsg } from "./contracts/OraiswapStaking.types";

async function httpGet(url: string) {
    const data = await fetch(url).then(data => data.json());
    return data;
}

async function getPrice(url: string): Promise<number> {
    const fetchData = await httpGet(url);
    const price = (Object.values(fetchData) as any)[0].usd;
    return price;
};

async function getTokenAmount(oraiAmount: string, tokenCoingeckoId: string): Promise<string> {
    const urls = ['https://api.coingecko.com/api/v3/simple/price?ids=oraichain-token&vs_currencies=usd', `https://api.coingecko.com/api/v3/simple/price?ids=${tokenCoingeckoId}&vs_currencies=usd`];
    const prices = await Promise.all(urls.map(url => getPrice(url)));
    const tokenAmount = (prices[0] / prices[1] * parseFloat(oraiAmount)).toFixed(0);
    return tokenAmount;
};

function buildExecuteWasmMessage(contract_addr: string, msg: Object, funds?: Coin[]) {
    return {
        wasm: {
            execute: {
                contract_addr,
                msg,
                send: funds ? funds : []
            }
        }
    }
}

export async function buildMultisigMessages(data: { cw20ContractAddress: string, remoteDenom: string, remoteDecimals: string, ibcWasmAddress: string, pairAddress: string, lpAddress: string, localChannelId: string, stakingContract: string, tokenCoingeckoId: string }): Promise<any[]> {
    const { cw20ContractAddress, remoteDecimals, remoteDenom, ibcWasmAddress, stakingContract, pairAddress, lpAddress, localChannelId, tokenCoingeckoId } = data;
    // update mapping converter 
    let msgs: any[] = [];
    const updateMappingMsg: ExecuteIbcWasmMsg = {
        update_mapping_pair: {
            asset_info: { token: { contract_addr: cw20ContractAddress } },
            asset_info_decimals: 6,
            denom: remoteDenom,
            local_channel_id: localChannelId,
            remote_decimals: parseInt(remoteDecimals),
        }
    }
    msgs.push(buildExecuteWasmMessage(ibcWasmAddress, updateMappingMsg));

    // create mining pool
    const createMiningPoolMsg: ExecuteStakingMsg = {
        register_asset: {
            asset_info: { token: { contract_addr: cw20ContractAddress } },
            staking_token: lpAddress
        }
    }
    msgs.push(buildExecuteWasmMessage(stakingContract, createMiningPoolMsg));

    // provide liquidity
    const oraiAmount = "1000000";
    const tokenAmount = await getTokenAmount(oraiAmount, tokenCoingeckoId);
    const provideLpMsg: ExecutePairMsg = {
        provide_liquidity: {
            assets: [{ info: { token: { contract_addr: cw20ContractAddress } }, amount: tokenAmount }, { info: { native_token: { denom: "orai" } }, amount: "1000000" }]
        }
    }
    msgs.push(buildExecuteWasmMessage(pairAddress, provideLpMsg, [{ denom: "orai", amount: oraiAmount }]));
    return msgs;
}

export function buildMultisigProposeMsg(title: string, msgs: any[]) {
    const proposeMsg = {
        propose: {
            title,
            description: title,
            msgs: msgs.map(msg => ({ wasm: { execute: { ...msg.wasm.execute, msg: Buffer.from(JSON.stringify(msg.wasm.execute.msg)).toString('base64') } } })),
        }
    }
    return proposeMsg
}
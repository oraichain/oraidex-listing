import { Coin } from "@cosmjs/amino";
import { ExecuteMsg as ExecuteIbcWasmMsg } from "./contracts/Cw20Ics20.types";
import { ExecuteMsg as ExecutePairMsg } from "./contracts/OraiswapPair.types";
import { ExecuteMsg as ExecuteStakingMsg } from "./contracts/OraiswapStaking.types";
import { ExecuteMsg as ExecuteTokenMsg } from "./contracts/OraiswapToken.types";

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
    // TODO: need to hardcode this part because the old structure of wasm message is execute.send, not funds
    if (process.env.MULTISIG_ADDRESS === "orai1fs25usz65tsryf0f8d5cpfmqgr0xwup4kjqpa0") {
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
    return {
        wasm: {
            execute: {
                contract_addr,
                msg,
                funds: funds ? funds : []
            }
        }
    }
}

export async function buildMultisigMessages(data: { cw20ContractAddress: string, remoteDenom: string, remoteDecimals: string, ibcWasmAddress: string, pairAddress: string, lpAddress: string, localChannelId: string, stakingContract: string, tokenCoingeckoId: string }): Promise<any[]> {
    const { cw20ContractAddress, remoteDecimals, remoteDenom, ibcWasmAddress, stakingContract, pairAddress, lpAddress, localChannelId, tokenCoingeckoId } = data;
    // update mapping converter 
    let msgs: any[] = [];
    if (Object.values(data).filter(value => !value).length > 0) {
        throw new Error("Invalid params");
    }
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

    // add increase allowance msg for the pair contract to provide lp later
    const increaseAllowanceMsg: ExecuteTokenMsg = {
        increase_allowance: {
            amount: "100000000000", // hard-coded 10k amount allowance. Not high but not low, just to be safe
            spender: pairAddress
        }
    }
    msgs.push(buildExecuteWasmMessage(cw20ContractAddress, increaseAllowanceMsg));

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

export const constants = {
    codeId: 761,
    adminInitialBalances: "10000000000",
    devInitialBalances: "20000000",
    ibcWasmInitialBalances: "1000000000",
    cw20Decimals: 6,
    devAddress: "orai1g4h64yjt0fvzv5v2j8tyfnpe5kmnetejvfgs7g"
};
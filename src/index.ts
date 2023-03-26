import * as dotenv from 'dotenv' // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
import { OraiswapFactoryClient } from './contracts/OraiswapFactory.client';
dotenv.config()
import { getCosmWasmClient } from "./cosmjs";
import { buildMultisigMessages, buildMultisigProposeMsg } from './helpers';

const envVariables = {
    admin: process.env.MULTISIG_ADDRESS,
    ibcWasmAddress: "orai195269awwnt5m6c843q6w7hp8rt0k7syfu9de4h0wz384slshuzps8y7ccm",
    localChannelId: "channel-29",
    factory: process.env.FACTORY_CONTRACT,
    staking: process.env.STAKING_CONTRACT,
    tokenSymbol: process.env.TOKEN_SYMBOL,
    remoteDenom: process.env.REMOTE_DENOM, // denom of the token on OraiBridge
    remoteDecimals: process.env.REMOTE_DECIMALS, // deciamsl of the token on OraiBridge
    tokenCoingeckoId: process.env.COINGECKO_ID,
}

async function deployCw20Token(tokenSymbol: string) {
    const codeId = 761;
    const { admin, ibcWasmAddress } = envVariables;
    const { client, defaultAddress } = await getCosmWasmClient();
    const instantiateResult = await client.instantiate(defaultAddress, codeId, { "mint": { "minter": admin }, "name": `${tokenSymbol} token`, "symbol": tokenSymbol, "decimals": 6, "initial_balances": [{ "amount": "10000000000", "address": admin }, { "amount": "20000000", "address": "orai1g4h64yjt0fvzv5v2j8tyfnpe5kmnetejvfgs7g" }, { "amount": "1000000000", "address": ibcWasmAddress }] }, `Production CW20 ${tokenSymbol} token`, 'auto', { admin });
    return instantiateResult.contractAddress;
}

async function addPairAndLpToken(cw20ContractAddress: string) {
    const { client, defaultAddress } = await getCosmWasmClient();
    const factoryContract = new OraiswapFactoryClient(client, defaultAddress, envVariables.factory as string);

    const result = await factoryContract.createPair({ assetInfos: [{ native_token: { denom: "orai" } }, { token: { contract_addr: cw20ContractAddress } }] });
    const wasmAttributes = result.logs[0].events.find(event => event.type === "wasm")?.attributes;
    const pairAddress = wasmAttributes?.find(attr => attr.key === "pair_contract_address")?.value;
    const lpAddress = wasmAttributes?.find(attr => attr.key === "liquidity_token_address")?.value;
    console.log("pair address: ", pairAddress);
    console.log("lp address: ", lpAddress);
    return { pairAddress, lpAddress };
}

async function listingMultisig(cw20ContractAddress: string) {
    const { client, defaultAddress } = await getCosmWasmClient();
    const { remoteDecimals, remoteDenom, localChannelId, ibcWasmAddress, staking, tokenCoingeckoId, tokenSymbol } = envVariables;

    // we dont use the pair & lp address from the arguments because they can be passed incorrectly. Instead, its easier to query and get the right pair info
    const factory = new OraiswapFactoryClient(client, defaultAddress, envVariables.factory as string);
    const pairInfo = await factory.pair({ assetInfos: [{ native_token: { denom: "orai" } }, { token: { contract_addr: cw20ContractAddress } }] });

    // build multiple wasm msgs for multisig 
    const msgs = await buildMultisigMessages({ cw20ContractAddress, remoteDecimals: remoteDecimals as string, remoteDenom: remoteDenom as string, ibcWasmAddress, pairAddress: pairInfo.contract_addr, localChannelId, lpAddress: pairInfo.liquidity_token, stakingContract: staking as string, tokenCoingeckoId: tokenCoingeckoId as string });

    // build propose msg for multisig
    const title = `Update mapping converter, create mining pool & provide initial liquidity for token with symbol ${tokenSymbol}`;
    const proposeMsg = buildMultisigProposeMsg(title, msgs);
    const result = await client.execute(defaultAddress, envVariables.admin as string, proposeMsg, 'auto');
    console.log("result: ", result);
}

async function run() {
    try {
        // in the case we have created a new token & created its pair and LP, then we can pass it through the env var to list it using the multisig transaction
        let cw20ContractAddress = process.env.CW20_CONTRACT_ADDRESS;
        if (envVariables.tokenSymbol) {
            cw20ContractAddress = await deployCw20Token(envVariables.tokenSymbol);
            await addPairAndLpToken(cw20ContractAddress);
        }
        console.log("deployed cw20 token address: ", cw20ContractAddress);
        if (cw20ContractAddress)
            await listingMultisig(cw20ContractAddress);
    } catch (error) {
        console.log("error running the listing script: ", error);
    }
}

run();
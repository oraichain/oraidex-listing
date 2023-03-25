import * as dotenv from 'dotenv' // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
import { OraiswapFactoryClient } from './contracts/OraiswapFactory.client';
dotenv.config()
import { getCosmWasmClient } from "./cosmjs";
const admin = "orai1fs25usz65tsryf0f8d5cpfmqgr0xwup4kjqpa0"; // multi-sig address
const ibcWasmAddress = "orai195269awwnt5m6c843q6w7hp8rt0k7syfu9de4h0wz384slshuzps8y7ccm";

async function deployCw20Token(tokenSymbol: string) {
    const codeId = 761;
    const { client, defaultAddress } = await getCosmWasmClient();
    const instantiateResult = await client.instantiate(defaultAddress, codeId, { "mint": { "minter": admin }, "name": `${tokenSymbol} token`, "symbol": tokenSymbol, "decimals": 6, "initial_balances": [{ "amount": "10000000000", "address": admin }, { "amount": "20000000", "address": "orai1g4h64yjt0fvzv5v2j8tyfnpe5kmnetejvfgs7g" }, { "amount": "1000000000", "address": ibcWasmAddress }] }, `Production CW20 ${tokenSymbol} token`, 'auto', { admin });
    console.log("instantiate result: ", instantiateResult);
    return instantiateResult.contractAddress;
}

async function addPairAndLpToken(cw20ContractAddress: string) {
    const { client, defaultAddress } = await getCosmWasmClient();
    const factoryContract = new OraiswapFactoryClient(client, defaultAddress, process.env.FACTORY_CONTRACT as string);
    const result = await factoryContract.createPair({ assetInfos: [{ native_token: { denom: "orai" } }, { token: { contract_addr: cw20ContractAddress } }] });
    console.log("result: ", result.logs);
    return result.logs;
}

async function run() {
    try {
        if (process.env.TOKEN_SYMBOL) {
            const contractAddress = await deployCw20Token(process.env.TOKEN_SYMBOL);
            const createPairResult = await addPairAndLpToken(contractAddress);
        }
    } catch (error) {
        console.log("error running the listing script: ", error);
    }
}

run();
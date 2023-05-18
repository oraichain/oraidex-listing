import * as dotenv from 'dotenv'; // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
import { OraiswapFactoryClient } from '@oraichain/oraidex-contracts-sdk/build/OraiswapFactory.client';
import { InstantiateMsg as Cw20InstantiateMsg } from '@oraichain/oraidex-contracts-sdk/build/OraiswapToken.types';
dotenv.config();
import { getCosmWasmClient, getSigningStargateClient } from './cosmjs';
import { TextProposal } from "cosmjs-types/cosmos/gov/v1beta1/gov";
import { Any } from "cosmjs-types/google/protobuf/any";

export const constants = {
    codeId: 761,
    cw20Decimals: 6,
    oraiDenom: 'orai',
    factory: "orai167r4ut7avvgpp3rlzksz6vw5spmykluzagvmj3ht845fjschwugqjsqhst",
};

const envVariables = {
    tokenSymbol: process.env.TOKEN_SYMBOL,
    orai_reward_per_sec: process.env.ORAI_REWARD_PER_SEC_AMOUNT,
    oraix_preward_per_sec: process.env.ORAIX_REWARD_PER_SEC_AMOUNT,
};

async function deployCw20Token(tokenSymbol: string, cap?: string) {
    const { client, defaultAddress } = await getCosmWasmClient();
    const instantiateResult = await client.instantiate(
        defaultAddress,
        constants.codeId,
        {
            mint: { minter: defaultAddress, cap },
            name: `${tokenSymbol} token`,
            symbol: tokenSymbol,
            decimals: constants.cw20Decimals,
            initial_balances: []
        } as Cw20InstantiateMsg,
        `Production CW20 ${tokenSymbol} token`,
        'auto',
        { admin: defaultAddress }
    );
    return instantiateResult.contractAddress;
}

async function addPairAndLpToken(cw20ContractAddress: string) {
    const { client, defaultAddress } = await getCosmWasmClient();
    const factoryContract = new OraiswapFactoryClient(client, defaultAddress, constants.factory as string);

    const result = await factoryContract.createPair({
        assetInfos: [{ native_token: { denom: 'orai' } }, { token: { contract_addr: cw20ContractAddress } }]
    });
    const wasmAttributes = result.logs[0].events.find((event) => event.type === 'wasm')?.attributes;
    const pairAddress = wasmAttributes?.find((attr) => attr.key === 'pair_contract_address')?.value;
    const lpAddress = wasmAttributes?.find((attr) => attr.key === 'liquidity_token_address')?.value;
    console.log('pair address: ', pairAddress);
    console.log('lp address: ', lpAddress);
    return { pairAddress, lpAddress };
}

async function createTextProposal(cw20ContractAddress: string, lpAddress: string, rewardPerSecOrai: number, rewardPerSecOraiX: number) {
    const title = `OraiDEX frontier - Listing new LP mining pool of token ${cw20ContractAddress}`;
    const description = `Create a new liquidity mining pool for CW20 token ${cw20ContractAddress} with LP Address: ${lpAddress}. Total rewards per second for the liquidity mining pool: ${rewardPerSecOrai} orai & ${rewardPerSecOraiX} uORAIX`;
    const { client, defaultAddress } = await getSigningStargateClient();
    const initial_deposit = [];
    const message = {
        typeUrl: "/cosmos.gov.v1beta1.MsgSubmitProposal",
        value: {
            content: Any.fromPartial({
                typeUrl: "/cosmos.gov.v1beta1.TextProposal",
                value: TextProposal.encode({
                    title,
                    description,
                }).finish()
            }),
            proposer: defaultAddress,
            initialDeposit: initial_deposit,
        }
    }
    return client.simulate(defaultAddress, [message], 'auto');
}

async function run() {
    try {
        // in the case we have created a new token & created its pair and LP, then we can pass it through the env var to list it using the multisig transaction
        let cw20ContractAddress = process.env.CW20_CONTRACT_ADDRESS;
        let lpAddress: string;
        if (envVariables.tokenSymbol) {
            cw20ContractAddress = await deployCw20Token(envVariables.tokenSymbol);
            const result = await addPairAndLpToken(cw20ContractAddress);
            lpAddress = result.lpAddress;
        }
        console.log('deployed cw20 token address: ', cw20ContractAddress);
        const simulateResult = await createTextProposal(cw20ContractAddress, lpAddress, parseInt(envVariables.orai_reward_per_sec), parseInt(envVariables.oraix_preward_per_sec)); // in minimal denom aka in 10^6 denom
        console.log("simulate result: ", simulateResult);
    } catch (error) {
        console.log('error running the listing script: ', error);
    }
}

run();

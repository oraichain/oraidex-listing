import * as dotenv from 'dotenv'; // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
import * as contractBuild from '@oraichain/oraidex-contracts-build/build'
import { InstantiateMsg as OraiSwapFactoryInstantiateMsg } from '@oraichain/oraidex-contracts-sdk/build/OraiswapFactory.types';
import { InstantiateMsg } from '@oraichain/oraidex-listing-contracts-sdk/src/OraidexListingContract.types';
import { OraidexListingContractClient } from '@oraichain/oraidex-listing-contracts-sdk/src/OraidexListingContract.client';
import { SimulateCosmWasmClient } from '@terran-one/cw-simulate/src';
import { readFileSync } from 'fs';
import path from 'path';
dotenv.config();

const devAddress = "orai14n3tx8s5ftzhlxvq0w5962v60vd82h30rha573";

async function simulate() {
    const client = new SimulateCosmWasmClient({ chainId: "Oraichain-testnet", bech32Prefix: "orai" });
    const { codeId: pairCodeId } = await client.upload(
        devAddress,
        readFileSync(contractBuild.getContractDir('oraiswap_pair')),
        'auto'
    );
    const { codeId: lpCodeId } = await client.upload(
        devAddress,
        readFileSync(contractBuild.getContractDir('oraiswap_token')),
        'auto'
    );

    // deploy oracle addr
    const oracle = await contractBuild.deployContract(client, devAddress, {}, "oracle", 'oraiswap_oracle');
    // deploy factory contract
    const factory = await contractBuild.deployContract(
        client,
        devAddress,
        {
            oracle_addr: oracle.contractAddress,
            pair_code_id: pairCodeId,
            token_code_id: lpCodeId
        } as OraiSwapFactoryInstantiateMsg,
        'factory',
        'oraiswap_factory',
    );

    const oraidexListing = await client.deploy(devAddress, path.join(__dirname, '../../contracts-build/data/oraidex-listing-contract.wasm'), { cw20_code_id: lpCodeId, factory_addr: factory.contractAddress } as InstantiateMsg, "oraidex-listing");

    const oraidexListingContract = new OraidexListingContractClient(client, devAddress, oraidexListing.contractAddress);
    const result = await oraidexListingContract.listToken({ label: "foobar", liquidityPoolRewardAssets: [{ amount: "100", info: { native_token: { denom: "orai" } } }], symbol: "FOOBAR" });
    console.log("result: ", result);
}

simulate();

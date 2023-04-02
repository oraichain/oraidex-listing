import * as dotenv from 'dotenv'; // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
dotenv.config();
import { getSimulateCosmWasmClient } from './cosmjs';
import { buildMultisigMessages, buildMultisigProposeMsg, constants } from './helpers';
import { InstantiateMsg as IbcWasmInstantiateMsg } from './contracts/Cw20Ics20.types';
import { InstantiateMsg as FactoryInstantiateMsg } from './contracts/OraiswapFactory.types';
import { InstantiateMsg as StakingInstantiateMsg } from './contracts/OraiswapStaking.types';
import { InstantiateMsg as OraiswapTokenInstantiateMsg } from './contracts/OraiswapToken.types';
import { readFileSync } from 'fs';
import path from 'path';
import { OraiswapFactoryClient } from './contracts/OraiswapFactory.client';

const client = getSimulateCosmWasmClient();
const envVariables = {
  localChannelId: 'channel-29',
  tokenSymbol: process.env.TOKEN_SYMBOL || 'FOOBAR',
  remoteDenom: process.env.REMOTE_DENOM, // denom of the token on OraiBridge
  remoteDecimals: process.env.REMOTE_DECIMALS, // deciamsl of the token on OraiBridge
  tokenCoingeckoId: process.env.COINGECKO_ID
};

async function deployOraiDexContracts(): Promise<{
  multisig: string;
  ibcWasmAddress: string;
  factory: string;
  staking: string;
  tokenCodeId: number;
}> {
  const { devAddress } = constants;
  // deploy fixed multisig
  const multisig = await client.deploy(
    devAddress,
    path.join(__dirname, 'wasm/cw3-fixed-multisig.wasm'),
    {
      voters: [{ addr: constants.devAddress, weight: 1 }],
      threshold: { absolute_count: { weight: 1 } },
      max_voting_period: { height: 1000 }
    },
    'cw3-fixed-multisig'
  );
  // deploy ibc wasm
  const ibcWasm = await client.deploy(
    devAddress,
    path.join(__dirname, 'wasm/cw-ics20-latest.wasm'),
    {
      allowlist: [],
      default_gas_limit: undefined,
      default_timeout: 1800,
      gov_contract: devAddress
    } as IbcWasmInstantiateMsg,
    'cw-ics20'
  );
  // upload pair & lp token code id
  const pairCodeId = (await client.upload(devAddress, readFileSync(path.join(__dirname, 'wasm/oraiswap_pair.wasm'))))
    .codeId;
  const lpCodeId = (await client.upload(devAddress, readFileSync(path.join(__dirname, 'wasm/oraiswap_token.wasm'))))
    .codeId;

  // deploy oracle addr
  const oracle = await client.deploy(devAddress, path.join(__dirname, 'wasm/oraiswap_oracle.wasm'), {}, 'oracle');
  // deploy factory contract
  const factory = await client.deploy(
    devAddress,
    path.join(__dirname, 'wasm/oraiswap_factory.wasm'),
    {
      commission_rate: null,
      oracle_addr: oracle.contractAddress,
      pair_code_id: pairCodeId,
      token_code_id: lpCodeId
    } as FactoryInstantiateMsg,
    'factory'
  );
  // deploy staking contract address
  const staking = await client.deploy(
    devAddress,
    path.join(__dirname, 'wasm/oraiswap_staking.wasm'),
    {
      base_denom: 'orai',
      factory_addr: factory.contractAddress,
      minter: null,
      oracle_addr: oracle.contractAddress,
      owner: devAddress,
      rewarder: devAddress
    } as StakingInstantiateMsg,
    'staking'
  );

  return {
    multisig: multisig.contractAddress,
    ibcWasmAddress: ibcWasm.contractAddress,
    factory: factory.contractAddress,
    staking: staking.contractAddress,
    tokenCodeId: lpCodeId
  };
}

async function instantiateCw20Token(
  admin: string,
  ibcWasmAddress: string,
  tokenSymbol: string,
  codeId: number
): Promise<string> {
  const result = await client.instantiate(
    constants.devAddress,
    codeId,
    {
      mint: { minter: admin },
      name: `${tokenSymbol} token`,
      symbol: tokenSymbol,
      decimals: constants.cw20Decimals,
      initial_balances: [
        { amount: constants.adminInitialBalances, address: admin },
        { amount: constants.devInitialBalances, address: constants.devAddress },
        { amount: constants.ibcWasmInitialBalances, address: ibcWasmAddress }
      ],
      marketing: null
    } as OraiswapTokenInstantiateMsg,
    'cw20'
  );
  return result.contractAddress;
}

async function addPairAndLpToken(factory: string, cw20ContractAddress: string) {
  const factoryContract = new OraiswapFactoryClient(client, constants.devAddress, factory);
  const assetInfos = [{ native_token: { denom: 'orai' } }, { token: { contract_addr: cw20ContractAddress } }];
  const result = await factoryContract.createPair(
    {
      assetInfos
    },
    'auto'
  );
  console.log('result: ', result);
  const pair = await factoryContract.pair({
    assetInfos
  });
  console.log('pair: ', pair);
}

async function run() {
  try {
    const { multisig, ibcWasmAddress, factory, staking, tokenCodeId } = await deployOraiDexContracts();
    const result = await instantiateCw20Token(
      multisig,
      ibcWasmAddress,
      envVariables.tokenSymbol as string,
      tokenCodeId
    );
    console.log('cw20 result: ', result);
    await addPairAndLpToken(factory, result);
  } catch (error) {
    console.log('error running the listing script: ', error);
  }
}

run();

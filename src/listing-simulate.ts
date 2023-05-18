import * as dotenv from 'dotenv'; // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
import { getSimulateCosmWasmClient } from './cosmjs';
import { buildMultisigMessages, constants } from './helpers';
dotenv.config();

import { Cw3FixedMultisigClient, Cw3FixedMultisigTypes, CwIcs20LatestTypes } from '@oraichain/common-contracts-sdk';
import {
  OraiswapFactoryClient,
  OraiswapFactoryTypes,
  OraiswapOracleTypes,
  OraiswapRouterTypes,
  OraiswapStakingTypes,
  OraiswapTokenTypes
} from '@oraichain/oraidex-contracts-sdk';

import * as commonArtifacts from '@oraichain/common-contracts-build';
import * as oraidexArtifacts from '@oraichain/oraidex-contracts-build';

import { readFileSync } from 'fs';

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
  const multisig = await commonArtifacts.deployContract<Cw3FixedMultisigTypes.InstantiateMsg>(
    client,
    devAddress,
    {
      voters: [{ addr: constants.devAddress, weight: 1 }],
      threshold: { absolute_count: { weight: 1 } },
      max_voting_period: { height: 1000 }
    },
    'cw3-fixed-multisig',
    'cw3-fixed-multisig'
  );

  // upload pair & lp token code id
  const { codeId: pairCodeId } = await client.upload(
    devAddress,
    readFileSync(oraidexArtifacts.getContractDir('oraiswap_pair')),
    'auto'
  );
  const { codeId: lpCodeId } = await client.upload(
    devAddress,
    readFileSync(oraidexArtifacts.getContractDir('oraiswap_token')),
    'auto'
  );
  // deploy oracle addr
  const oracle = await oraidexArtifacts.deployContract<OraiswapOracleTypes.InstantiateMsg>(
    client,
    devAddress,
    {},
    'oracle',
    'oraiswap_oracle'
  );
  // deploy factory contract
  const factory = await oraidexArtifacts.deployContract<OraiswapFactoryTypes.InstantiateMsg>(
    client,
    devAddress,

    {
      commission_rate: null,
      oracle_addr: oracle.contractAddress,
      pair_code_id: pairCodeId,
      token_code_id: lpCodeId
    },
    'factory',
    'oraiswap_factory'
  );
  // deploy staking contract address
  const staking = await oraidexArtifacts.deployContract<OraiswapStakingTypes.InstantiateMsg>(
    client,
    devAddress,

    {
      base_denom: constants.oraiDenom,
      factory_addr: factory.contractAddress,
      minter: null,
      oracle_addr: oracle.contractAddress,
      owner: devAddress,
      rewarder: devAddress
    },
    'staking',
    'oraiswap_staking'
  );

  // deploy staking contract address
  const router = await oraidexArtifacts.deployContract<OraiswapRouterTypes.InstantiateMsg>(
    client,
    devAddress,
    {
      factory_addr: factory.contractAddress,
      factory_addr_v2: factory.contractAddress
    },
    'router',
    'oraiswap_router'
  );

  // deploy ibc wasm
  const ibcWasm = await commonArtifacts.deployContract<CwIcs20LatestTypes.InstantiateMsg>(
    client,
    devAddress,
    {
      allowlist: [],
      default_gas_limit: undefined,
      default_timeout: 1800,
      gov_contract: devAddress,
      swap_router_contract: router.contractAddress
    },
    'cw-ics20',
    'cw-ics20-latest'
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
    } as OraiswapTokenTypes.InstantiateMsg,
    'cw20',
    'auto'
  );
  return result.contractAddress;
}

async function addPairAndLpToken(factory: string, cw20ContractAddress: string) {
  const factoryContract = new OraiswapFactoryClient(client, constants.devAddress, factory);
  const assetInfos = [
    { native_token: { denom: constants.oraiDenom } },
    { token: { contract_addr: cw20ContractAddress } }
  ];
  await factoryContract.createPair(
    {
      assetInfos
    },
    'auto'
  );
}

async function listingMultisig(
  cw20ContractAddress: string,
  ibcWasmAddress: string,
  multisig: string,
  factory: string,
  staking: string
) {
  const { remoteDecimals, remoteDenom, localChannelId, tokenCoingeckoId, tokenSymbol } = envVariables;

  // we dont use the pair & lp address from the arguments because they can be passed incorrectly. Instead, its easier to query and get the right pair info
  const factoryContract = new OraiswapFactoryClient(client, constants.devAddress, factory);
  const pairInfo = await factoryContract.pair({
    assetInfos: [{ native_token: { denom: constants.oraiDenom } }, { token: { contract_addr: cw20ContractAddress } }]
  });

  // build multiple wasm msgs for multisig
  const msgs = await buildMultisigMessages({
    cw20ContractAddress,
    remoteDecimals: remoteDecimals,
    remoteDenom: remoteDenom,
    ibcWasmAddress,
    pairAddress: pairInfo.contract_addr,
    localChannelId,
    lpAddress: pairInfo.liquidity_token,
    stakingContract: staking,
    tokenCoingeckoId: tokenCoingeckoId
  });

  // build propose msg for multisig
  const title = `Update mapping converter, create mining pool & provide initial liquidity for token with symbol ${tokenSymbol}`;
  const multisigContract = new Cw3FixedMultisigClient(client, constants.devAddress, multisig);
  await multisigContract.propose({
    title,
    description: title,
    msgs: msgs.map((msg) => ({
      wasm: {
        execute: { ...msg.wasm.execute, msg: Buffer.from(JSON.stringify(msg.wasm.execute.msg)).toString('base64') }
      }
    }))
  });
  // has to split two types of clients because if using the same interface, there will be conflict on the 'vote' entrypoint of execute & query
  const queryResult = await multisigContract.listProposals({});
  console.dir(queryResult.proposals[0].msgs, { depth: null });
}

async function run() {
  try {
    const { multisig, ibcWasmAddress, factory, staking, tokenCodeId } = await deployOraiDexContracts();
    const cw20ContractAddress = await instantiateCw20Token(
      multisig,
      ibcWasmAddress,
      envVariables.tokenSymbol as string,
      tokenCodeId
    );
    await addPairAndLpToken(factory, cw20ContractAddress);
    await listingMultisig(cw20ContractAddress, ibcWasmAddress, multisig, factory, staking);
  } catch (error) {
    console.log('error running the listing script: ', error);
  }
}

run();

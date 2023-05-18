import { SigningCosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { readFileSync } from 'fs';
import path from 'path';
import { OraidexListingContractTypes } from '@oraichain/oraidex-listing-contracts-sdk';

export type ContractName = 'oraidex-listing-contract';
export type InstantiateMsg = OraidexListingContractTypes.InstantiateMsg;
export type MigrateMsg = OraidexListingContractTypes.MigrateMsg;

const contractDir = path.join(path.dirname(module.filename), '..', 'data');

export const getContractDir = (name: ContractName = 'oraidex-listing-contract') => {
  return path.join(contractDir, name + '.wasm');
};

export const deployContract = async (
  client: SigningCosmWasmClient,
  senderAddress: string,
  msg: InstantiateMsg,
  label: string,
  contractName?: ContractName
) => {
  // upload and instantiate the contract
  const wasmBytecode = readFileSync(getContractDir(contractName));
  const uploadRes = await client.upload(senderAddress, wasmBytecode, 'auto');
  const initRes = await client.instantiate(senderAddress, uploadRes.codeId, msg, label, 'auto');
  return { ...uploadRes, ...initRes };
};

export const migrateContract = async (
  client: SigningCosmWasmClient,
  senderAddress: string,
  contractAddress: string,
  msg: MigrateMsg,
  contractName?: ContractName
) => {
  // upload and instantiate the contract
  const wasmBytecode = readFileSync(getContractDir(contractName));
  const uploadRes = await client.upload(senderAddress, wasmBytecode, 'auto');
  const migrateRes = await client.migrate(senderAddress, contractAddress, uploadRes.codeId, msg, 'auto');
  return { ...uploadRes, ...migrateRes };
};

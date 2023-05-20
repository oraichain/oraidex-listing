import { SigningCosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { readFileSync } from 'fs';
import path from 'path';
import { OraidexListingContractTypes } from '@oraichain/oraidex-listing-contracts-sdk';

export type ContractName = 'oraidex-listing-contract';
export type InstantiateMsg = OraidexListingContractTypes.InstantiateMsg;

const contractDir = path.join(path.dirname(module.filename), '..', 'data');

export const getContractDir = (name: ContractName = 'oraidex-listing-contract') => {
  return path.join(contractDir, name + '.wasm');
};

export const deployContract = async (
  client: SigningCosmWasmClient,
  senderAddress: string,
  contractName?: ContractName,
  msg?: InstantiateMsg,
  label?: string
) => {
  // upload and instantiate the contract
  const wasmBytecode = readFileSync(getContractDir(contractName));
  const uploadRes = await client.upload(senderAddress, wasmBytecode, 'auto');
  const initRes = await client.instantiate(senderAddress, uploadRes.codeId, msg ?? {}, label ?? contractName, 'auto');
  return { ...uploadRes, ...initRes };
};

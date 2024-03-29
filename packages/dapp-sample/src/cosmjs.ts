import { AccountData } from '@cosmjs/amino';
import { SigningCosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { SigningStargateClient } from '@cosmjs/stargate';
import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing';
import { GasPrice } from '@cosmjs/stargate';
import { SimulateCosmWasmClient } from '@oraichain/cw-simulate';

async function collectWallet(): Promise<DirectSecp256k1HdWallet> {
  // use keplr instead
  return await DirectSecp256k1HdWallet.fromMnemonic(process.env.MNEMONIC as string, { prefix: 'orai' });
}

export async function getWallet(): Promise<{ accounts: readonly AccountData[]; wallet: DirectSecp256k1HdWallet }> {
  const wallet = await collectWallet();
  const accounts = await wallet.getAccounts();
  return { accounts, wallet };
}

export async function getCosmWasmClient() {
  const { accounts, wallet } = await getWallet();
  const defaultAddress = accounts[0].address;
  const client = await SigningCosmWasmClient.connectWithSigner(process.env.RPC_URL as string, wallet, {
    gasPrice: GasPrice.fromString(process.env.GAS_PRICES as string)
  });
  return { client, defaultAddress, wallet };
}

export async function getSigningStargateClient() {
  const { accounts, wallet } = await getWallet();
  const defaultAddress = accounts[0].address;
  const client = await SigningStargateClient.connectWithSigner(process.env.RPC_URL as string, wallet, {
    gasPrice: GasPrice.fromString(process.env.GAS_PRICES as string)
  });
  return { client, defaultAddress, wallet };
}

export function getSimulateCosmWasmClient() {
  const client = new SimulateCosmWasmClient({ chainId: 'Oraichain', bech32Prefix: 'orai' });
  return client;
}

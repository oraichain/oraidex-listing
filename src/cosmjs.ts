import { AccountData } from "@cosmjs/amino";
import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";

async function collectWallet(): Promise<DirectSecp256k1HdWallet> {
    // use keplr instead
    return await DirectSecp256k1HdWallet.fromMnemonic(process.env.MNEMONIC as string, { prefix: "orai" });
};

export async function getWallet(): Promise<{ accounts: readonly AccountData[], wallet: DirectSecp256k1HdWallet }> {
    const wallet = await collectWallet();
    const accounts = await wallet.getAccounts();
    return { accounts, wallet };
}
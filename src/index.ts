import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { GasPrice } from "@cosmjs/stargate";
import { OraiswapTokenClient } from "./contracts/OraiswapToken.client";
import * as dotenv from 'dotenv' // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
dotenv.config()
import { getWallet } from "./cosmjs";

async function demo() {
    const { accounts, wallet } = await getWallet();
    const defaultAddress = accounts[0].address;
    const client = await SigningCosmWasmClient.connectWithSigner(process.env.RPC_URL as string, wallet, { gasPrice: GasPrice.fromString(process.env.GAS_PRICES as string) });
    const oraiswapToken = new OraiswapTokenClient(client, defaultAddress, "orai12hzjxfh77wl572gdzct2fxv2arxcwh6gykc7qh");
    const balances = await oraiswapToken.balance({ address: defaultAddress });
    console.log("balances: ", balances);
}

demo();
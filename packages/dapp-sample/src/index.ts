import * as dotenv from 'dotenv'; // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
import { OraidexListingContractClient } from '@oraichain/oraidex-listing-contracts-sdk/src/OraidexListingContract.client';
import { getCosmWasmClient } from './cosmjs';
dotenv.config();

const envVariables = {
  tokenSymbol: process.env.TOKEN_SYMBOL,
  orai_reward_per_sec: process.env.ORAI_REWARD_PER_SEC_AMOUNT,
  oraix_preward_per_sec: process.env.ORAIX_REWARD_PER_SEC_AMOUNT,
  listing_token_contract: process.env.LISTING_TOKEN_CONTRACT
};

async function run() {
  try {
    const { client, defaultAddress } = await getCosmWasmClient();
    const listingClient = new OraidexListingContractClient(client, defaultAddress, envVariables.listing_token_contract);
    const result = await listingClient.listToken({
      targetedAssetInfo: { native_token: { denom: 'orai' } },
      pairAssetInfo: { token: { contract_addr: 'orai1dqa52a7hxxuv8ghe7q5v0s36ra0cthea960q2cukznleqhk0wpnshfegez' } },
      symbol: '',
      liquidityPoolRewardAssets: []
    });
    console.log('listing result: ', result);
  } catch (error) {
    console.log('error running the listing script: ', error);
  }
}

run();

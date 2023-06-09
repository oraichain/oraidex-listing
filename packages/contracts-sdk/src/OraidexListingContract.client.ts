/**
* This file was automatically generated by @cosmwasm/ts-codegen@0.28.0.
* DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema file,
* and run the @cosmwasm/ts-codegen generate command to regenerate this file.
*/

import { CosmWasmClient, SigningCosmWasmClient, ExecuteResult } from "@cosmjs/cosmwasm-stargate";
import { Coin, StdFee } from "@cosmjs/amino";
import {Uint128, AssetInfo, Addr, Logo, EmbeddedLogo, Binary, Cw20Coin, Asset, InstantiateMarketingInfo, Config} from "./types";
import {InstantiateMsg, ExecuteMsg, ListTokenMsg, MinterResponse, QueryMsg, MigrateMsg} from "./OraidexListingContract.types";
export interface OraidexListingContractReadOnlyInterface {
  contractAddress: string;
  config: () => Promise<Config>;
}
export class OraidexListingContractQueryClient implements OraidexListingContractReadOnlyInterface {
  client: CosmWasmClient;
  contractAddress: string;

  constructor(client: CosmWasmClient, contractAddress: string) {
    this.client = client;
    this.contractAddress = contractAddress;
    this.config = this.config.bind(this);
  }

  config = async (): Promise<Config> => {
    return this.client.queryContractSmart(this.contractAddress, {
      config: {}
    });
  };
}
export interface OraidexListingContractInterface extends OraidexListingContractReadOnlyInterface {
  contractAddress: string;
  sender: string;
  listToken: ({
    initialBalances,
    label,
    liquidityPoolRewardAssets,
    marketing,
    mint,
    name,
    pairAssetInfo,
    symbol,
    targetedAssetInfo
  }: {
    initialBalances?: Cw20Coin[];
    label?: string;
    liquidityPoolRewardAssets: Asset[];
    marketing?: InstantiateMarketingInfo;
    mint?: MinterResponse;
    name?: string;
    pairAssetInfo: AssetInfo;
    symbol?: string;
    targetedAssetInfo?: AssetInfo;
  }, $fee?: number | StdFee | "auto", $memo?: string, $funds?: Coin[]) => Promise<ExecuteResult>;
}
export class OraidexListingContractClient extends OraidexListingContractQueryClient implements OraidexListingContractInterface {
  client: SigningCosmWasmClient;
  sender: string;
  contractAddress: string;

  constructor(client: SigningCosmWasmClient, sender: string, contractAddress: string) {
    super(client, contractAddress);
    this.client = client;
    this.sender = sender;
    this.contractAddress = contractAddress;
    this.listToken = this.listToken.bind(this);
  }

  listToken = async ({
    initialBalances,
    label,
    liquidityPoolRewardAssets,
    marketing,
    mint,
    name,
    pairAssetInfo,
    symbol,
    targetedAssetInfo
  }: {
    initialBalances?: Cw20Coin[];
    label?: string;
    liquidityPoolRewardAssets: Asset[];
    marketing?: InstantiateMarketingInfo;
    mint?: MinterResponse;
    name?: string;
    pairAssetInfo: AssetInfo;
    symbol?: string;
    targetedAssetInfo?: AssetInfo;
  }, $fee: number | StdFee | "auto" = "auto", $memo?: string, $funds?: Coin[]): Promise<ExecuteResult> => {
    return await this.client.execute(this.sender, this.contractAddress, {
      list_token: {
        initial_balances: initialBalances,
        label,
        liquidity_pool_reward_assets: liquidityPoolRewardAssets,
        marketing,
        mint,
        name,
        pair_asset_info: pairAssetInfo,
        symbol,
        targeted_asset_info: targetedAssetInfo
      }
    }, $fee, $memo, $funds);
  };
}
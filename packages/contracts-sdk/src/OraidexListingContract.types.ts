export interface InstantiateMsg {
  cw20_code_id: number;
  factory_addr: string;
}
export type ExecuteMsg = {
  list_token: ListTokenMsg;
};
export type Uint128 = string;
export type AssetInfo = {
  token: {
    contract_addr: Addr;
  };
} | {
  native_token: {
    denom: string;
  };
};
export type Addr = string;
export type Logo = {
  url: string;
} | {
  embedded: EmbeddedLogo;
};
export type EmbeddedLogo = {
  svg: Binary;
} | {
  png: Binary;
};
export type Binary = string;
export interface ListTokenMsg {
  initial_balances?: Cw20Coin[] | null;
  label?: string | null;
  liquidity_pool_reward_assets: Asset[];
  marketing?: InstantiateMarketingInfo | null;
  mint?: MinterResponse | null;
  name?: string | null;
  pair_asset_info: AssetInfo;
  symbol?: string | null;
  targeted_asset_info?: AssetInfo | null;
}
export interface Cw20Coin {
  address: string;
  amount: Uint128;
}
export interface Asset {
  amount: Uint128;
  info: AssetInfo;
}
export interface InstantiateMarketingInfo {
  description?: string | null;
  logo?: Logo | null;
  marketing?: string | null;
  project?: string | null;
}
export interface MinterResponse {
  cap?: Uint128 | null;
  minter: string;
}
export type QueryMsg = {
  config: {};
};
export interface MigrateMsg {}
export interface Config {
  cw20_code_id: number;
  factory_addr: Addr;
  owner: Addr;
}
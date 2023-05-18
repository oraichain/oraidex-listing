import { MinterResponse } from "./OraidexListingContract.types";

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
  label?: string | null;
  liquidity_pool_reward_assets: Asset[];
  marketing?: InstantiateMarketingInfo | null;
  mint?: MinterResponse | null;
  symbol: string;
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
export interface Config {
  cw20_code_id: number;
  factory_addr: Addr;
  owner: Addr;
}
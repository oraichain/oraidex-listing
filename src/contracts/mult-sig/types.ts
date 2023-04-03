export type CosmosMsgForEmpty = {
  bank: BankMsg;
} | {
  custom: Empty;
} | {
  staking: StakingMsg;
} | {
  distribution: DistributionMsg;
} | {
  wasm: WasmMsg;
};
export type BankMsg = {
  send: {
    amount: Coin[];
    to_address: string;
    [k: string]: unknown;
  };
} | {
  burn: {
    amount: Coin[];
    [k: string]: unknown;
  };
};
export type Uint128 = string;
export type StakingMsg = {
  delegate: {
    amount: Coin;
    validator: string;
    [k: string]: unknown;
  };
} | {
  undelegate: {
    amount: Coin;
    validator: string;
    [k: string]: unknown;
  };
} | {
  redelegate: {
    amount: Coin;
    dst_validator: string;
    src_validator: string;
    [k: string]: unknown;
  };
};
export type DistributionMsg = {
  set_withdraw_address: {
    address: string;
    [k: string]: unknown;
  };
} | {
  withdraw_delegator_reward: {
    validator: string;
    [k: string]: unknown;
  };
};
export type WasmMsg = {
  execute: {
    contract_addr: string;
    funds: Coin[];
    msg: Binary;
    [k: string]: unknown;
  };
} | {
  instantiate: {
    admin?: string | null;
    code_id: number;
    funds: Coin[];
    label: string;
    msg: Binary;
    [k: string]: unknown;
  };
} | {
  migrate: {
    contract_addr: string;
    msg: Binary;
    new_code_id: number;
    [k: string]: unknown;
  };
} | {
  update_admin: {
    admin: string;
    contract_addr: string;
    [k: string]: unknown;
  };
} | {
  clear_admin: {
    contract_addr: string;
    [k: string]: unknown;
  };
};
export type Binary = string;
export type Expiration = {
  at_height: number;
} | {
  at_time: Timestamp;
} | {
  never: {};
};
export type Timestamp = Uint64;
export type Uint64 = string;
export interface Coin {
  amount: Uint128;
  denom: string;
  [k: string]: unknown;
}
export interface Empty {
  [k: string]: unknown;
}
export interface Permissions {
  delegate: boolean;
  redelegate: boolean;
  undelegate: boolean;
  withdraw: boolean;
  [k: string]: unknown;
}
export type NativeBalance = Coin[];
export interface AllowanceInfo {
  balance: NativeBalance;
  expires: Expiration;
  spender: string;
}
export interface PermissionsInfo {
  permissions: Permissions;
  spender: string;
}
export interface Allowance {
  balance: NativeBalance;
  expires: Expiration;
  [k: string]: unknown;
}
export interface AllowMsg {
  contract: string;
  gas_limit?: number | null;
}
export interface Cw20ReceiveMsg {
  amount: Uint128;
  msg: Binary;
  sender: string;
}
export interface TransferMsg {
  channel: string;
  remote_address: string;
  timeout?: number | null;
}
export type Amount = {
  native: Coin;
} | {
  cw20: Cw20Coin;
};
export interface Cw20Coin {
  address: string;
  amount: Uint128;
}
export interface ChannelInfo {
  connection_id: string;
  counterparty_endpoint: IbcEndpoint;
  id: string;
}
export interface IbcEndpoint {
  channel_id: string;
  port_id: string;
  [k: string]: unknown;
}
export interface AllowedInfo {
  contract: string;
  gas_limit?: number | null;
}
export type IbcMsg = {
  transfer: {
    amount: Coin;
    channel_id: string;
    timeout: IbcTimeout;
    to_address: string;
    [k: string]: unknown;
  };
} | {
  send_packet: {
    channel_id: string;
    data: Binary;
    timeout: IbcTimeout;
    [k: string]: unknown;
  };
} | {
  close_channel: {
    channel_id: string;
    [k: string]: unknown;
  };
};
export type GovMsg = {
  vote: {
    proposal_id: number;
    vote: VoteOption;
    [k: string]: unknown;
  };
};
export type VoteOption = "yes" | "no" | "abstain" | "no_with_veto";
export interface IbcTimeout {
  block?: IbcTimeoutBlock | null;
  timestamp?: Timestamp | null;
  [k: string]: unknown;
}
export interface IbcTimeoutBlock {
  height: number;
  revision: number;
  [k: string]: unknown;
}
export type Duration = {
  height: number;
} | {
  time: number;
};
export type Threshold = {
  absolute_count: {
    weight: number;
  };
} | {
  absolute_percentage: {
    percentage: Decimal;
  };
} | {
  threshold_quorum: {
    quorum: Decimal;
    threshold: Decimal;
  };
};
export type Decimal = string;
export interface Voter {
  addr: string;
  weight: number;
}
export type Vote = "yes" | "no" | "abstain" | "veto";
export type Denom = {
  native: string;
} | {
  cw20: Addr;
};
export type Addr = string;
export type Status = "pending" | "open" | "rejected" | "passed" | "executed";
export interface ProposalListResponseForEmpty {
  proposals: ProposalResponseForEmpty[];
}
export interface ProposalResponseForEmpty {
  deposit?: DepositInfo | null;
  description: string;
  expires: Expiration;
  id: number;
  msgs: CosmosMsgForEmpty[];
  proposer: Addr;
  status: Status;
  threshold: ThresholdResponse;
  title: string;
}
export interface DepositInfo {
  amount: Uint128;
  denom: Denom;
  refund_failed_proposals: boolean;
}
export interface VoterDetail {
  addr: string;
  weight: number;
}
export interface VoteInfo {
  proposal_id: number;
  vote: Vote;
  voter: string;
  weight: number;
}
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
export interface InstantiateMarketingInfo {
  description?: string | null;
  logo?: Logo | null;
  marketing?: string | null;
  project?: string | null;
}
export interface SpenderAllowanceInfo {
  allowance: Uint128;
  expires: Expiration;
  owner: string;
}
export type LogoInfo = {
  url: string;
} | "embedded";
export interface Member {
  addr: string;
  weight: number;
}
export type Executor = "member" | {
  only: Addr;
};
export type UncheckedDenom = {
  native: string;
} | {
  cw20: string;
};
export interface UncheckedDepositInfo {
  amount: Uint128;
  denom: UncheckedDenom;
  refund_failed_proposals: boolean;
}
export interface MemberChangedHookMsg {
  diffs: MemberDiff[];
}
export interface MemberDiff {
  key: string;
  new?: number | null;
  old?: number | null;
}
export type Cw4Contract = Addr;
export interface Config {
  executor?: Executor | null;
  group_addr: Cw4Contract;
  max_voting_period: Duration;
  proposal_deposit?: DepositInfo | null;
  threshold: Threshold;
}
export interface Claim {
  amount: Uint128;
  release_at: Expiration;
}
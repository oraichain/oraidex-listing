/**
* This file was automatically generated by @cosmwasm/ts-codegen@0.20.0.
* DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema file,
* and run the @cosmwasm/ts-codegen generate command to regenerate this file.
*/

import { CosmWasmClient, SigningCosmWasmClient, ExecuteResult } from "@cosmjs/cosmwasm-stargate";
import { StdFee } from "@cosmjs/amino";
import {Addr, Decimal, Uint128, OracleTreasuryQuery, OracleExchangeQuery, OracleContractQuery, ExchangeRateItem, Coin} from "./types";
import {InstantiateMsg, ExecuteMsg, QueryMsg, MigrateMsg, ContractInfoResponse, ExchangeRateResponse, ExchangeRatesResponse, TaxCapResponse, TaxRateResponse, TreasuryResponse, ExchangeResponse, ContractResponse} from "./OraiswapOracle.types";
export interface OraiswapOracleReadOnlyInterface {
  contractAddress: string;
  treasury: (input: OracleTreasuryQuery) => Promise<TreasuryResponse>;
  exchange: (input: OracleExchangeQuery) => Promise<ExchangeResponse>;
  contract: (input: OracleContractQuery) => Promise<ContractResponse>;
}
export class OraiswapOracleQueryClient implements OraiswapOracleReadOnlyInterface {
  client: CosmWasmClient;
  contractAddress: string;

  constructor(client: CosmWasmClient, contractAddress: string) {
    this.client = client;
    this.contractAddress = contractAddress;
    this.treasury = this.treasury.bind(this);
    this.exchange = this.exchange.bind(this);
    this.contract = this.contract.bind(this);
  }

  treasury = async (input:OracleTreasuryQuery): Promise<TreasuryResponse> => {
    return this.client.queryContractSmart(this.contractAddress, {
      treasury: input
    });
  };
  exchange = async (input:OracleExchangeQuery): Promise<ExchangeResponse> => {
    return this.client.queryContractSmart(this.contractAddress, {
      exchange: input
    });
  };
  contract = async (input:OracleContractQuery): Promise<ContractResponse> => {
    return this.client.queryContractSmart(this.contractAddress, {
      contract: input
    });
  };
}
export interface OraiswapOracleInterface extends OraiswapOracleReadOnlyInterface {
  contractAddress: string;
  sender: string;
  updateAdmin: ({
    admin
  }: {
    admin: Addr;
  }, $fee?: number | StdFee | "auto", $memo?: string, $funds?: Coin[]) => Promise<ExecuteResult>;
  updateExchangeRate: ({
    denom,
    exchangeRate
  }: {
    denom: string;
    exchangeRate: Decimal;
  }, $fee?: number | StdFee | "auto", $memo?: string, $funds?: Coin[]) => Promise<ExecuteResult>;
  deleteExchangeRate: ({
    denom
  }: {
    denom: string;
  }, $fee?: number | StdFee | "auto", $memo?: string, $funds?: Coin[]) => Promise<ExecuteResult>;
  updateTaxCap: ({
    cap,
    denom
  }: {
    cap: Uint128;
    denom: string;
  }, $fee?: number | StdFee | "auto", $memo?: string, $funds?: Coin[]) => Promise<ExecuteResult>;
  updateTaxRate: ({
    rate
  }: {
    rate: Decimal;
  }, $fee?: number | StdFee | "auto", $memo?: string, $funds?: Coin[]) => Promise<ExecuteResult>;
}
export class OraiswapOracleClient extends OraiswapOracleQueryClient implements OraiswapOracleInterface {
  client: SigningCosmWasmClient;
  sender: string;
  contractAddress: string;

  constructor(client: SigningCosmWasmClient, sender: string, contractAddress: string) {
    super(client, contractAddress);
    this.client = client;
    this.sender = sender;
    this.contractAddress = contractAddress;
    this.updateAdmin = this.updateAdmin.bind(this);
    this.updateExchangeRate = this.updateExchangeRate.bind(this);
    this.deleteExchangeRate = this.deleteExchangeRate.bind(this);
    this.updateTaxCap = this.updateTaxCap.bind(this);
    this.updateTaxRate = this.updateTaxRate.bind(this);
  }

  updateAdmin = async ({
    admin
  }: {
    admin: Addr;
  }, $fee: number | StdFee | "auto" = "auto", $memo?: string, $funds?: Coin[]): Promise<ExecuteResult> => {
    return await this.client.execute(this.sender, this.contractAddress, {
      update_admin: {
        admin
      }
    }, $fee, $memo, $funds);
  };
  updateExchangeRate = async ({
    denom,
    exchangeRate
  }: {
    denom: string;
    exchangeRate: Decimal;
  }, $fee: number | StdFee | "auto" = "auto", $memo?: string, $funds?: Coin[]): Promise<ExecuteResult> => {
    return await this.client.execute(this.sender, this.contractAddress, {
      update_exchange_rate: {
        denom,
        exchange_rate: exchangeRate
      }
    }, $fee, $memo, $funds);
  };
  deleteExchangeRate = async ({
    denom
  }: {
    denom: string;
  }, $fee: number | StdFee | "auto" = "auto", $memo?: string, $funds?: Coin[]): Promise<ExecuteResult> => {
    return await this.client.execute(this.sender, this.contractAddress, {
      delete_exchange_rate: {
        denom
      }
    }, $fee, $memo, $funds);
  };
  updateTaxCap = async ({
    cap,
    denom
  }: {
    cap: Uint128;
    denom: string;
  }, $fee: number | StdFee | "auto" = "auto", $memo?: string, $funds?: Coin[]): Promise<ExecuteResult> => {
    return await this.client.execute(this.sender, this.contractAddress, {
      update_tax_cap: {
        cap,
        denom
      }
    }, $fee, $memo, $funds);
  };
  updateTaxRate = async ({
    rate
  }: {
    rate: Decimal;
  }, $fee: number | StdFee | "auto" = "auto", $memo?: string, $funds?: Coin[]): Promise<ExecuteResult> => {
    return await this.client.execute(this.sender, this.contractAddress, {
      update_tax_rate: {
        rate
      }
    }, $fee, $memo, $funds);
  };
}
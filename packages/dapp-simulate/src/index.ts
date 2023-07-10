import * as oraidexArtifacts from '@oraichain/oraidex-contracts-build';
import * as oraidexListingArtifacts from '@oraichain/oraidex-listing-contracts-build/src';
import { OraidexListingContractClient } from '@oraichain/oraidex-listing-contracts-sdk';
import { SimulateCosmWasmClient } from '@terran-one/cw-simulate';
import { readFileSync } from 'fs';

const devAddress = 'orai14n3tx8s5ftzhlxvq0w5962v60vd82h30rha573';

async function simulate() {
  const client = new SimulateCosmWasmClient({ chainId: 'Oraichain-testnet', bech32Prefix: 'orai' });
  const { codeId: pairCodeId } = await client.upload(
    devAddress,
    readFileSync(oraidexArtifacts.getContractDir('oraiswap_pair')),
    'auto'
  );
  const { codeId: lpCodeId } = await client.upload(
    devAddress,
    readFileSync(oraidexArtifacts.getContractDir('oraiswap_token')),
    'auto'
  );

  // deploy oracle addr
  const oracle = await oraidexArtifacts.deployContract(client, devAddress, 'oraiswap_oracle');
  // deploy factory contract
  const factory = await oraidexArtifacts.deployContract(client, devAddress, 'oraiswap_factory', {
    oracle_addr: oracle.contractAddress,
    pair_code_id: pairCodeId,
    token_code_id: lpCodeId
  });

  const oraidexListing = await oraidexListingArtifacts.deployContract(client, devAddress, 'oraidex-listing-contract', {
    cw20_code_id: lpCodeId,
    factory_addr: factory.contractAddress
  });

  const oraidexListingContract = new OraidexListingContractClient(client, devAddress, oraidexListing.contractAddress);
  const result = await oraidexListingContract.listToken({
    pairAssetInfo: { native_token: { denom: 'orai' } },
    label: 'foobar',
    liquidityPoolRewardAssets: [{ amount: '100', info: { native_token: { denom: 'orai' } } }],
    symbol: 'FOOBAR'
  });
  console.dir(result, { depth: null });
}

simulate();

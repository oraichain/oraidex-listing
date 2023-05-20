# oraidex-listing

Note: has to use node >= 16.8.0 to get node::crypto module for typescript

To list a CW20 token & create a text proposal, one needs to fill:

- CW20 Token Symbol. Eg: USDT
- ORAI Reward per second for the mining pool. Eg: 10^6 (= 1 ORAI)
- ORAIX Reward per second for the mining pool. Eg: 10^6 (= 1 ORAIX)

# Command

TOKEN_SYMBOL=foobar yarn start

## Generate code and docs

```bash
# build code:
cwtools build ../oraidex-listing-contract -o packages/contracts-build/data
# gen code:
cwtools gents ../oraidex-listing-contract -o packages/contracts-sdk/src
# gen doc:
yarn docs

# update comments:
git apply patches/contracts-sdk.patch
# edit contracts-sdk
git diff packages/contracts-sdk > patches/contracts-sdk.patch
# rollback
git checkout packages/contracts-sdk
```

# oraidex-listing

Note: has to use node >= 16.8.0 to get node::crypto module for typescript

To list a CW20 token & create a text proposal, one needs to fill:

- CW20 Token Symbol. Eg: USDT
- ORAI Reward per second for the mining pool. Eg: 10^6 (= 1 ORAI)
- ORAIX Reward per second for the mining pool. Eg: 10^6 (= 1 ORAIX)

# Command

TOKEN_SYMBOL=foobar yarn start

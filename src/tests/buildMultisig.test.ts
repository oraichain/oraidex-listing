import { buildMultisigMessages, buildMultisigProposeMsg } from '../helpers';

test('build-multisig', async () => {
  const ibcWasmAddress = 'orai195269awwnt5m6c843q6w7hp8rt0k7syfu9de4h0wz384slshuzps8y7ccm';
  const pairAddress = 'orai1f2cytz7v27v38kdcffeapge9rmud6ms20t4y5pzlfy6c9awyx5zs90aejc';
  const lpAddress = 'orai1q3xnvm08htfzl9schn5wspw7390qdkn2p7n0mdc8ulsjukc2gk2sh8tnxy';
  const stakingAddress = 'orai19p43y0tqnr5qlhfwnxft2u5unph5yn60y7tuvu';
  const cw20ContractAddress = 'orai1m94vru6wmurnlzvh3syzpll4m4l4526v9amzh7udcnc8rpw0znyquh5ezd';
  const msgs = await buildMultisigMessages({
    cw20ContractAddress,
    remoteDenom: 'foobar',
    remoteDecimals: '18',
    ibcWasmAddress: ibcWasmAddress,
    pairAddress: pairAddress,
    lpAddress,
    localChannelId: 'channel-29',
    stakingContract: stakingAddress,
    tokenCoingeckoId: 'tron'
  });

  expect(msgs.length).toBe(4);
  expect(msgs[0].wasm.execute.contract_addr).toBe(ibcWasmAddress);
  expect(Object.keys(msgs[0].wasm.execute.msg)[0]).toBe('update_mapping_pair');
  expect(Object.keys(msgs[1].wasm.execute.msg)[0]).toBe('register_asset');
  expect(Object.keys(msgs[2].wasm.execute.msg)[0]).toBe('increase_allowance');
  expect(Object.keys(msgs[3].wasm.execute.msg)[0]).toBe('provide_liquidity');
  expect(JSON.stringify(msgs[0].wasm.execute.msg.update_mapping_pair.asset_info)).toBe(
    JSON.stringify({ token: { contract_addr: cw20ContractAddress } })
  );
  expect(JSON.stringify(msgs[1].wasm.execute.msg.register_asset.asset_info)).toBe(
    JSON.stringify({ token: { contract_addr: cw20ContractAddress } })
  );

  // failed case, when one of the params is null or empty
  await expect(
    buildMultisigMessages({
      cw20ContractAddress,
      remoteDenom: 'foobar',
      remoteDecimals: '',
      ibcWasmAddress: ibcWasmAddress,
      pairAddress: pairAddress,
      lpAddress,
      localChannelId: 'channel-29',
      stakingContract: stakingAddress,
      tokenCoingeckoId: 'tron'
    })
  ).rejects.toThrow();
});

test('build-multisig-propose-msg', async () => {
  const ibcWasmAddress = 'orai195269awwnt5m6c843q6w7hp8rt0k7syfu9de4h0wz384slshuzps8y7ccm';
  const pairAddress = 'orai1f2cytz7v27v38kdcffeapge9rmud6ms20t4y5pzlfy6c9awyx5zs90aejc';
  const lpAddress = 'orai1q3xnvm08htfzl9schn5wspw7390qdkn2p7n0mdc8ulsjukc2gk2sh8tnxy';
  const stakingAddress = 'orai19p43y0tqnr5qlhfwnxft2u5unph5yn60y7tuvu';
  const cw20ContractAddress = 'orai1m94vru6wmurnlzvh3syzpll4m4l4526v9amzh7udcnc8rpw0znyquh5ezd';
  const msgs = await buildMultisigMessages({
    cw20ContractAddress,
    remoteDenom: 'foobar',
    remoteDecimals: '18',
    ibcWasmAddress: ibcWasmAddress,
    pairAddress: pairAddress,
    lpAddress,
    localChannelId: 'channel-29',
    stakingContract: stakingAddress,
    tokenCoingeckoId: 'tron'
  });

  const title = 'this is a test proposal';
  const proposeMsg = buildMultisigProposeMsg(title, msgs);
  expect(proposeMsg.propose.title).toBe(title);
  expect(proposeMsg.propose.msgs.length).toBe(4);
  expect(proposeMsg.propose.msgs[1].wasm.execute.msg).toBe(
    Buffer.from(
      JSON.stringify({
        register_asset: {
          asset_info: { token: { contract_addr: cw20ContractAddress } },
          staking_token: lpAddress
        }
      })
    ).toString('base64')
  );
});

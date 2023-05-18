import { fromBech32, normalizeBech32 } from '@cosmjs/encoding';
import { bech32 } from 'bech32';

test('cannonicalize-test', async () => {
    const address = "orai1k5e8a99zfp45378wr5ewn2fe8lkyuw4l40n53x";
    const normalized = normalizeBech32(address);
    const cannonicalAddr = fromBech32(normalized);
    console.log(cannonicalAddr.prefix)
    console.log(cannonicalAddr.data.length);

    console.log(bech32.encode(cannonicalAddr.prefix, bech32.toWords(cannonicalAddr.data)));
});
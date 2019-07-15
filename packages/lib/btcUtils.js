import crypto from 'crypto';
import bip39 from 'bip39';
import bip32 from 'bip32';

const ethUtils = {
    getBitcoinAccountAtIndex(mnemonic, index = 0) {
        const seed = bip39.mnemonicToSeed(mnemonic);
        const node = bip32.fromSeed(seed);
        const child = node.derivePath(`m/44'/195'/${ index }'/0/0`);
        const privateKey = child.privateKey.toString('hex');
        const privateKeyHex = privateKey.substring(2)

        return {
            privateKey: account.privateKey,
            address: account.address
        };
    }
};

export default ethUtils;

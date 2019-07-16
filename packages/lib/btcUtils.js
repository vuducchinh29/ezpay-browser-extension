import crypto from 'crypto';
import bip39 from 'bip39';
import bip32 from 'bip32';
import CoinKey from 'coinkey';
import ci from 'coininfo';
import Btc from 'bitcoinjs-lib';

const ethUtils = {
    getBitcoinAccountAtIndex(mnemonic, typeCoinInfo, index = 0) {
        const seed = bip39.mnemonicToSeed(mnemonic);
        const node = bip32.fromSeed(seed);
        const child = node.derivePath(`m/44'/195'/${ index }'/0/0`);
        const privateKey = child.privateKey.toString('hex');
        // const privateKeyHex = privateKey.substring(2)

        const coinInfo = ci(typeCoinInfo)

        const key = new CoinKey(new Buffer(privateKey, 'hex'), {
            private: coinInfo.versions.private,
            public: coinInfo.versions.public
        })

        return {
            privateKey: privateKey,
            address: key.publicAddress
        };
    }
};

export default ethUtils;

import crypto from 'crypto';
import bip39 from 'bip39';
import bip32 from 'bip32';
import Web3 from 'web3';
import { ethers } from 'ethers';

const web3 = new Web3()

const ethUtils = {
    getEthereumAccountAtIndex(mnemonic, index = 0) {
        const seed = bip39.mnemonicToSeed(mnemonic);
        const node = bip32.fromSeed(seed);
        const child = node.derivePath(`m/44'/60'/0'/0/0`);

        const account = new ethers.Wallet(child.privateKey)

        return {
            privateKey: account.privateKey,
            address: account.address
        };
    },

    isValidAddress(address) {
        var prefixed = ethUtil.addHexPrefix(address)
        if (address === '0x0000000000000000000000000000000000000000') return false
        return (isAllOneCase(prefixed) && ethUtil.isValidAddress(prefixed)) || ethUtil.isValidChecksumAddress(prefixed)
    }
};

export default ethUtils;

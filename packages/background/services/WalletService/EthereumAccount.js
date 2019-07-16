import Logger from '@ezpay/lib/logger';
import Utils from '@ezpay/lib/utils';
import ethUtils from '@ezpay/lib/ethUtils';
import axios from 'axios';
import { BigNumber } from 'bignumber.js';
import TronWeb from 'tronweb';
import Account from './Account';

const logger = new Logger('WalletService/EthereumAccount');
import {
    ACCOUNT_TYPE,
    CONTRACT_ADDRESS
} from '@ezpay/lib/constants';

class EthereumAccount extends Account {
    constructor(chain, accountType, importData, name, symbol, decimal, logo, accountIndex = 0) {
        super(chain, accountType, importData, name, symbol, decimal, logo, accountIndex);

        if(accountType == ACCOUNT_TYPE.MNEMONIC)
            this._importMnemonic(importData);
        else this._importPrivateKey(importData);
    }

    _importMnemonic(mnemonic) {
        if(!Utils.validateMnemonic(mnemonic))
            throw new Error('INVALID_MNEMONIC');

        this.mnemonic = mnemonic;

        const {
            privateKey,
            address
        } = this.getAccountAtIndex(this.accountIndex);

        this.privateKey = privateKey;
        this.address = address;
    }

    getAccountAtIndex(index = 0) {
        if(this.type !== ACCOUNT_TYPE.MNEMONIC)
            throw new Error('Deriving account keys at a specific index requires a mnemonic account');

        return ethUtils.getEthereumAccountAtIndex(
            this.mnemonic,
            index
        );
    }

    _importPrivateKey(privateKey) {
        try {
            this.privateKey = privateKey;
            this.address = TronWeb.address.fromPrivateKey(privateKey);
        } catch (ex) { // eslint-disable-line
            throw new Error('INVALID_PRIVATE_KEY');
        }
    }
}

export default EthereumAccount;

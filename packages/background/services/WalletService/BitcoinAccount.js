import Logger from '@ezpay/lib/logger';
import Utils from '@ezpay/lib/utils';
import btcUtils from '@ezpay/lib/btcUtils';
import axios from 'axios';
import { BigNumber } from 'bignumber.js';
import Account from './Account';

const logger = new Logger('WalletService/BitcoinAccount');

import {
    ACCOUNT_TYPE,
    CONTRACT_ADDRESS
} from '@ezpay/lib/constants';

class BitcoinAccount extends Account {
    constructor(id, chain, token, accountType, importData, name, symbol, decimal, logo, typeCoinInfo, accountIndex = 0) {
        super(id, chain, token, accountType, importData, name, symbol, decimal, logo, accountIndex);

        this.typeCoinInfo = typeCoinInfo

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

        return btcUtils.getBitcoinAccountAtIndex(
            this.mnemonic,
            this.typeCoinInfo,
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

    getDetails() {
        return {
            id: this.id,
            chain: this.chain,
            token: this.token,
            symbol: this.symbol,
            decimal: this.decimal,
            logo: this.logo,
            tokens: this.tokens,
            type: this.type,
            name: this.name,
            address: this.address,
            balance: this.balance,
            transactions: this.transactions,
            lastUpdated: this.lastUpdated
        };
    }
}

export default BitcoinAccount;

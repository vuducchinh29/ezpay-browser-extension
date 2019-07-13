import Logger from '@ezpay/lib/logger';
import Utils from '@ezpay/lib/utils';
import axios from 'axios';
import { BigNumber } from 'bignumber.js';

const logger = new Logger('WalletService/EthereumAccount');

class EthereumAccount {
    constructor(chain, type, importData, accountIndex = 0) {
        this.chain = chain;
        this.type = type;
        this.accountIndex = accountIndex;

        this.address = false;
        this.name = false;
        this.transactions = {};
        this.ignoredTransactions = [];
        this.tokens = {};
    }
}

export default EthereumAccount;

import Logger from '@ezpay/lib/logger';
import Utils from '@ezpay/lib/utils';
import axios from 'axios';
import { BigNumber } from 'bignumber.js';
import randomUUID from 'uuid/v4';

const logger = new Logger('WalletService/Account');

class Account {
    constructor(id, chain, token, accountType, importData, name, symbol, decimal, logo, accountIndex = 0) {
        this.id = id;
        this.chain = chain;
        this.token = token;
        this.type = accountType;
        this.accountIndex = accountIndex;

        this.address = false;
        this.name = name;
        this.symbol = symbol;
        this.decimal = decimal;
        this.logo = logo;
        this.transactions = {};
        this.ignoredTransactions = [];
        this.tokens = {};
        this.updatingTransactions = false;
        this.balance = 0;
    }
}

export default Account;

import StorageService from '../StorageService';
import Logger from '@ezpay/lib/logger';
import Utils from '@ezpay/lib/utils';
import ethUtils from '@ezpay/lib/ethUtils';
import axios from 'axios';
import { BigNumber } from 'bignumber.js';
import Account from './Account';
import Web3 from 'web3';
import NodeService from '../NodeService';

const logger = new Logger('WalletService/EthereumAccount');
import {
    ACCOUNT_TYPE,
    CONTRACT_ADDRESS
} from '@ezpay/lib/constants';

class EthereumAccount extends Account {
    constructor(chain, token, accountType, importData, name, symbol, decimal, logo, accountIndex = 0) {
        super(chain, token, accountType, importData, name, symbol, decimal, logo, accountIndex);

        const nodes = NodeService.getNodes().nodes
        const node = nodes[chain]

        if(accountType == ACCOUNT_TYPE.MNEMONIC)
            this._importMnemonic(importData);
        else this._importPrivateKey(importData);

        this.web3 = new Web3(node.endPoint);
        this.loadCache();
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

    getDetails() {
        return {
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

    async update() {
         this.balance = await this.web3.eth.getBalance(this.address)
    }

    loadCache() {
        if(!StorageService.hasAccount(this.address))
            return logger.warn('Attempted to load cache for an account that does not exist');

        const {
            chain,
            token,
            symbol,
            decimal,
            logo,
            type,
            name,
            balance,
            transactions,
            tokens,
        } = StorageService.getAccount(this.address);

        // Old TRC10 structure are no longer compatible
        //tokens.basic = {};

        // Remove old token transfers so they can be fetched again
        Object.keys(this.transactions).forEach(txID => {
            const transaction = this.transactions[ txID ];

            if(transaction.type !== 'TransferAssetContract')
                return;

            if(transaction.tokenID)
                return;

            delete this.transactions[ txID ];
        });

        this.chain = chain;
        this.token = token;
        this.symbol = symbol;
        this.decimal = decimal;
        this.logo = logo;

        this.type = type;
        this.name = name;
        this.balance = balance;
        this.transactions = transactions;
        this.tokens = tokens;
    }
}

export default EthereumAccount;

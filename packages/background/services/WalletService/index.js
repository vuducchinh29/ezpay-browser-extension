import Logger from '@ezpay/lib/logger';
import EventEmitter from 'eventemitter3';
import TronAccount from './TronAccount';
import axios from 'axios';
import extensionizer from 'extensionizer';
import Utils from '@ezpay/lib/utils';
import StorageService from '../StorageService';
import NodeService from '../NodeService';
import Chain from './Chain';
import TronWeb from 'tronweb';
import Web3 from 'web3';

import {
    APP_STATE,
    ACCOUNT_TYPE,
    CHAIN_TYPE,
    CONTRACT_ADDRESS
} from '@ezpay/lib/constants';

const logger = new Logger('WalletService');

class Wallet extends EventEmitter {
    constructor() {
        super();

        this.state = APP_STATE.UNINITIALISED;
        this.selectedChain = false;
        this.chains = {};
        this.accounts = {};

        this._start()
    }

    async _start() {
        await this._checkStorage();
        await this._initChains();
        this._loadAccounts();
    }

    async _checkStorage() {
        if(await StorageService.dataExists() || StorageService.needsMigrating)
            this._setState(APP_STATE.PASSWORD_SET); // initstatus APP_STATE.PASSWORD_SET
    }

    _initChains() {
        const nodes = NodeService.getNodes().nodes;

        Object.entries(nodes).forEach(([key, node]) => {
            let ezWeb;

            if (node.type === CHAIN_TYPE.TRON) {
                ezWeb = new TronWeb(
                    node.endPoint,
                    node.endPoint,
                    node.endPoint
                );
            } else if (node.type === CHAIN_TYPE.ETH) {
                ezWeb = new Web3(node.endPoint)
            }

            const chain = new Chain({
                type: node.type,
                endPoint: node.endPoint,
                decimal: node.decimal,
                logo: node.logo,
                ezWeb: ezWeb
            });

            this.chains[ key ] = chain;
        });
    }

    setLanguage(language) {
        StorageService.setLanguage(language);
        this.emit('setLanguage', language);
    }

    getSetting() {
        return StorageService.getSetting();
    }

    getLanguage() {
        return StorageService.language;
    }

    async resetState() {
        logger.info('Resetting app state');

        return this._setState(APP_STATE.UNINITIALISED);
    }

    _setState(appState) {
        if(this.state === appState)
            return;

        logger.info(`Setting app state to ${ appState }`);

        this.state = appState;
        this.emit('newState', appState);

        return appState;
    }

    setPassword(password) {
        if(this.state !== APP_STATE.UNINITIALISED)
            return Promise.reject('ERRORS.ALREADY_INITIALISED');

        StorageService.authenticate(password);
        StorageService.save();

        logger.info('User has set a password');
        this._setState(APP_STATE.READY);
    }

    _loadAccounts() {
        const accounts = StorageService.getAccounts();
        const nodes = NodeService.getNodes().nodes;

        Object.entries(accounts).forEach(([ address, account ]) => {
            let node = nodes[account.chain]
            let accountObj

            if (node.type === CHAIN_TYPE.TRON) {
                accountObj = new TronAccount(
                    account.chain,
                    account.type,
                    account.mnemonic || account.privateKey,
                    account.symbol,
                    account.accountIndex
                );

                accountObj.loadCache();
                accountObj.update([], [], 0);
            }

            this.accounts[ address ] = accountObj;
        });
    }

    async unlockWallet(password) {
        if(this.state !== APP_STATE.PASSWORD_SET) {
            logger.error('Attempted to unlock wallet whilst not in PASSWORD_SET state');
            return Promise.reject('ERRORS.NOT_LOCKED');
        }

        if(StorageService.needsMigrating) {
            const success = this.migrate(password);

            if(!success)
                return Promise.reject('ERRORS.INVALID_PASSWORD');

            return;
        }

        const unlockFailed = await StorageService.unlock(password);
        if(unlockFailed) {
            logger.error(`Failed to unlock wallet: ${ unlockFailed }`);
            return Promise.reject(unlockFailed);
        }

        if(!StorageService.hasAccounts) {
            this._createDefaultAccount()
            logger.info('Wallet does not have any accounts');
            return this._setState(APP_STATE.READY);
        }

        this._loadAccounts()
        this._setState(APP_STATE.READY);
    }

    _createDefaultAccount() {
        this.addAccount({
            chain: 'f0b1e38e-7bee-485e-9d3f-69410bf30681',
            mnemonic: Utils.generateMnemonic(),
            name: 'Account 1'
        })
    }

    async addAccount({chain, mnemonic, name}) {
        const nodes = NodeService.getNodes().nodes;
        const node = nodes[chain]

        if (node.type === CHAIN_TYPE.TRON) {
            this.addTronAccount(chain, mnemonic, name)
        }
    }

    async addTronAccount(chain, mnemonic, name, symbol) {
        logger.info(`Adding Tron account '${ name }' from popup`);

        const trc10tokens = axios.get('https://apilist.tronscan.org/api/token?showAll=1&limit=4000',{ timeout: 10000 });
        const trc20tokens = axios.get('https://apilist.tronscan.org/api/tokens/overview?start=0&limit=1000&filter=trc20',{ timeout: 10000 });
        await Promise.all([trc10tokens, trc20tokens]).then(res => {
            let t = [];
            res[ 0 ].data.data.concat( res[ 1 ].data.tokens).forEach(({ abbr, name, imgUrl = false, tokenID = false, contractAddress = false, decimal = false, precision = false }) => {
                if(contractAddress && contractAddress === CONTRACT_ADDRESS.USDT)return;
                t.push({ tokenId: tokenID ? tokenID.toString() : contractAddress, abbr, name, imgUrl, decimals: precision || decimal || 0 });
            });
            StorageService.saveAllTokens(t);
        });

        const account = new TronAccount(
            chain,
            ACCOUNT_TYPE.MNEMONIC,
            mnemonic
        );
        logger.info(`Add account '${ account }'`);

        const {
            address
        } = account;
        account.name = name;
        this.accounts[ address ] = account;
        StorageService.saveAccount(account);

        // this.emit('setAccounts', this.getAccounts());
        return true;
    }

    getAccounts() {
        const nodes = NodeService.getNodes().nodes;
        const accounts = Object.entries(this.accounts).reduce((accounts, [ address, account ]) => {
            accounts[ address ] = {
                name: account.name,
                chain: nodes[account.chain],
                balance: account.balance + account.frozenBalance,
                energyUsed: account.energyUsed,
                totalEnergyWeight: account.totalEnergyWeight,
                TotalEnergyLimit: account.TotalEnergyLimit,
                energy: account.energy,
                netUsed: account.netUsed,
                netLimit: account.netLimit,
                tokenCount: Object.keys(account.tokens.basic).length + Object.keys(account.tokens.smart).length,
                asset: account.asset
            };

            return accounts;
        }, {});

        this.emit('setAccounts', accounts);
        return accounts;
    }
}

export default Wallet;

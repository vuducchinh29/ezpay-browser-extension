import Logger from '@ezpay/lib/logger';
import EventEmitter from 'eventemitter3';
import TronAccount from './TronAccount';
import EthereumAccount from './EthereumAccount';
import BitcoinAccount from './BitcoinAccount';
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
        this.tokens = {};
        this.selectedAccount = false;

        this._start()
    }

    async _start() {
        await this._checkStorage();
        await this._saveTokens();
        this._loadData();
        // await this._initChains();
        this._loadAccounts();
    }

    async _checkStorage() {
        if(await StorageService.dataExists() || StorageService.needsMigrating)
            this._setState(APP_STATE.PASSWORD_SET); // initstatus APP_STATE.PASSWORD_SET
    }

    _saveTokens() {
        const tokensConfig = NodeService.getTokens();
        const tokensStorage = StorageService.getTokens();

        Object.entries(tokensConfig).forEach(([ tokenId, token ]) => {
            if (!tokensStorage[tokenId]) {
                StorageService.saveToken(tokenId, token)
            }
        })
    }

    _loadData() {
        const tokens = StorageService.getTokens();
        this.selectAccount(StorageService.selectedAccount);

        Object.entries(tokens).forEach(([ tokenId, token ]) => {
            this.tokens[tokenId] = token
        })

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
                    account.token,
                    account.type,
                    account.mnemonic || account.privateKey,
                    account.name,
                    account.symbol,
                    account.decimal,
                    account.logo,
                    account.accountIndex
                );

                accountObj.loadCache();
                accountObj.update([], [], 0);
            } else if (node.type === CHAIN_TYPE.NTY || node.type === CHAIN_TYPE.ETH) {
                accountObj = new EthereumAccount(
                    account.chain,
                    account.token,
                    account.type,
                    account.mnemonic || account.privateKey,
                    account.name,
                    account.symbol,
                    account.decimal,
                    account.logo,
                    account.accountIndex
                );
            } else if (node.type === CHAIN_TYPE.BTC) {
                accountObj = new BitcoinAccount(
                    account.chain,
                    account.token,
                    account.type,
                    account.mnemonic || account.privateKey,
                    account.name,
                    account.symbol,
                    account.decimal,
                    account.logo,
                    account.typeCoinInfo,
                    account.accountIndex
                );
            }

            this.accounts[ address ] = accountObj;
        });
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

        if(!StorageService.hasAccounts) {
            logger.info('Wallet does not have any accounts');
            this._createDefaultAccount()
        }
    }

    migrate(password) {
        if(!StorageService.needsMigrating) {
            logger.info('No migration required');
            return false;
        }

        StorageService.authenticate(password);

        const {
            error = false,
            accounts,
            selectedAccount
        } = StorageService.migrate();

        if(error)
            return false;

        localStorage.setItem('EZPAY_WALLET.bak', localStorage.getItem('EZPAY_WALLET'));
        localStorage.removeItem('EZPAY_WALLET');

        // accounts.forEach(account => (
        //     this.importAccount(account)
        // ));

        this.selectAccount(selectedAccount);

        // Force "Reboot" TronLink
        this.state = APP_STATE.PASSWORD_SET;
        StorageService.ready = false;

        this.unlockWallet(StorageService.password);

        return true;
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
        await this._saveTokens();
        this._loadData();
        this._setState(APP_STATE.READY);
    }

    createAccount(params) {
        const tokens = NodeService.getTokens()
        const token = tokens[ params.tokenId ]

        this._addAccount({
            ...token,
            token: params.tokenId,
            mnemonic: params.mnemonic,
            accountName: params.name
        })
    }

    _createDefaultAccount() {
        const tokens = NodeService.getTokens()
        const id = 'f0b1e38e-7bee-485e-9d3f-69410bf30686'
        const id1 = 'f0b1e38e-7bee-485e-9d3f-69410bf30683'
        const id2 = 'f0b1e38e-7bee-485e-9d3f-69410bf30687'
        const id3 = 'f0b1e38e-7bee-485e-9d3f-69410bf30685'

        const token = tokens[id]
        const token1 = tokens[id1]
        const token2 = tokens[id2]
        const token3 = tokens[id3]

        this._addAccount({
            ...token,
            token: id,
            mnemonic: Utils.generateMnemonic(),
            accountName: 'Nexty Account 1'
        })
        this._addAccount({
            ...token1,
            token: id1,
            mnemonic: Utils.generateMnemonic(),
            accountName: 'Tron Account 1'
        })

        this._addAccount({
            ...token2,
            token: id2,
            mnemonic: Utils.generateMnemonic(),
            accountName: 'Bitcoin Account 1'
        })

        this._addAccount({
            ...token3,
            token: id3,
            mnemonic: Utils.generateMnemonic(),
            accountName: 'Ethereum Account 1'
        })
    }

    async _addAccount(params) {
        const nodes = NodeService.getNodes().nodes;
        const node = nodes[params.node]

        if (node.type === CHAIN_TYPE.TRON) {
            this.addTronAccount(params)
        } else if (node.type === CHAIN_TYPE.NTY || node.type === CHAIN_TYPE.ETH || node.type === CHAIN_TYPE.ETH_RINKEBY) {
            this.addEthereumAccount(params)
        } else if (node.type === CHAIN_TYPE.BTC) {
            this.addBitcoinAccount(params)
        }
    }

    async addTronAccount(params) {
        logger.info(`Adding Tron account '${ params.accountName }' from popup`);

        // const trc10tokens = axios.get('https://apilist.tronscan.org/api/token?showAll=1&limit=4000',{ timeout: 10000 });
        // const trc20tokens = axios.get('https://apilist.tronscan.org/api/tokens/overview?start=0&limit=1000&filter=trc20',{ timeout: 10000 });
        // await Promise.all([trc10tokens, trc20tokens]).then(res => {
        //     let t = [];
        //     res[ 0 ].data.data.concat( res[ 1 ].data.tokens).forEach(({ abbr, name, imgUrl = false, tokenID = false, contractAddress = false, decimal = false, precision = false }) => {
        //         if(contractAddress && contractAddress === CONTRACT_ADDRESS.USDT)return;
        //         t.push({ tokenId: tokenID ? tokenID.toString() : contractAddress, abbr, name, imgUrl, decimals: precision || decimal || 0 });
        //     });
        //     StorageService.saveAllTokens(t);
        // });

        const account = new TronAccount(
            params.node,
            params.token,
            ACCOUNT_TYPE.MNEMONIC,
            params.mnemonic,
            params.accountName,
            params.symbol,
            params.decimal,
            params.logo
        );
        logger.info(`Add account '${ account }'`);

        const {
            address
        } = account;

        this.accounts[ address ] = account;
        StorageService.saveAccount(account);

        this.emit('setAccounts', this.getAccounts());
        return true;
    }

    async addEthereumAccount(params) {
        logger.info(`Adding Ethereum account '${ params.accountName }' from popup`);

        const account = new EthereumAccount(
            params.node,
            params.token,
            ACCOUNT_TYPE.MNEMONIC,
            params.mnemonic,
            params.accountName,
            params.symbol,
            params.decimal,
            params.logo
        );
        logger.info(`Add account '${ account }'`);

        const {
            address
        } = account;

        this.accounts[ address ] = account;
        StorageService.saveAccount(account);

        this.emit('setAccounts', this.getAccounts());
        return true;
    }

    async addBitcoinAccount(params) {
        logger.info(`Adding Bitcoin account '${ params.accountName }' from popup`);

        const account = new BitcoinAccount(
            params.node,
            params.token,
            ACCOUNT_TYPE.MNEMONIC,
            params.mnemonic,
            params.accountName,
            params.symbol,
            params.decimal,
            params.logo,
            params.typeCoinInfo
        );
        logger.info(`Add account '${ account }'`);

        const {
            address
        } = account;

        this.accounts[ address ] = account;
        StorageService.saveAccount(account);

        this.emit('setAccounts', this.getAccounts());
        return true;
    }

    getTokens() {
        return this.tokens
    }

    getAccounts() {
        const nodes = NodeService.getNodes().nodes;
        const tokens = NodeService.getTokens()

        const accounts = Object.entries(this.accounts).reduce((accounts, [ address, account ]) => {
            let token = tokens[account.token]
            token.id = account.token

            accounts[ address ] = {
                name: account.name,
                logo: account.logo,
                decimal: account.decimal,
                symbol: account.symbol,
                chain: nodes[account.chain],
                token: token,
                balance: account.balance + account.frozenBalance || 0,
                // energyUsed: account.energyUsed,
                // totalEnergyWeight: account.totalEnergyWeight,
                // TotalEnergyLimit: account.TotalEnergyLimit,
                // energy: account.energy,
                // netUsed: account.netUsed,
                // netLimit: account.netLimit,
                // tokenCount: Object.keys(account.tokens.basic).length + Object.keys(account.tokens.smart).length,
                // asset: account.asset
            };

            return accounts;
        }, {});

        this.emit('setAccounts', accounts);
        return accounts;
    }

    changeState(appState) {
        const stateAry = [
            APP_STATE.PASSWORD_SET,
            APP_STATE.RESTORING,
            APP_STATE.CREATING_TOKEN,
            APP_STATE.RECEIVE,
            APP_STATE.SEND,
            APP_STATE.TRANSACTIONS,
            APP_STATE.SETTING,
            APP_STATE.ADD_TRC20_TOKEN,
            APP_STATE.READY,
            APP_STATE.TRONBANK,
            APP_STATE.TRONBANK_RECORD,
            APP_STATE.TRONBANK_DETAIL,
            APP_STATE.TRONBANK_HELP,
            APP_STATE.USDT_INCOME_RECORD,
            APP_STATE.USDT_ACTIVITY_DETAIL,
            APP_STATE.DAPP_LIST,
            APP_STATE.ASSET_MANAGE,
            APP_STATE.TRANSACTION_DETAIL,
            APP_STATE.DAPP_WHITELIST,
            APP_STATE.ACCOUNTS,
            APP_STATE.CREATING_ACCOUNT,
            APP_STATE.ACCOUNT_DETAIL
        ];
        if(!stateAry.includes(appState))
            return logger.error(`Attempted to change app state to ${ appState }. Only 'restoring' and 'creating' is permitted`);

        this._setState(appState);
    }

    selectToken(tokenId) {
        const token = this.tokens[ tokenId ]
        token.id = tokenId

        StorageService.setSelectedToken(token)
        this.emit('selectToken', token)
    }

    getSelectedToken() {
        return StorageService.getSelectedToken();
    }

    async toggleSelectToken(tokenId) {
        const token = this.tokens[tokenId]
        token.isShow = !token.isShow
        this.tokens[tokenId] = token

        this.emit('setSelectedTokens', this.tokens)
        StorageService.saveToken(tokenId, token)
    }

    selectAccount(address) {
        StorageService.selectAccount(address);
        // NodeService.setAddress();
        this.selectedAccount = address;
        this.emit('setAccount', address);
    }

    getAccountDetails(address) {
        if(!address) {
            return {
                tokens: {
                },
                type: false,
                name: false,
                address: false,
                balance: 0,
                transactions: {
                    cached: [],
                    uncached: 0
                }
            };
        }

        return this.accounts[ address ].getDetails();
    }

     getSelectedAccount() {
        if(!this.selectedAccount)
            return false;

        return this.getAccountDetails(this.selectedAccount);
    }

    exportAccount() {
        const {
            mnemonic,
            privateKey
        } = this.accounts[ this.selectedAccount ];

        return {
            mnemonic: mnemonic || false,
            privateKey
        };
    }

    deleteAccount() {
        delete this.accounts[ this.selectedAccount ];
        StorageService.deleteAccount(this.selectedAccount);

        this.emit('setAccounts', this.getAccounts());
    }
}

export default Wallet;

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

        this.timer = {};
        this.isPolling = false;
        this.shouldPoll = false;
        this.popup = false;
        this.contractWhitelist = {};
        this.confirmations = [];

        this._start()
    }

    async _start() {
        await this._checkStorage();
        await this._saveTokens();
        this._loadData();
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

    startPolling() {
        if(this.isPolling && this.shouldPoll)
            return;

        if(this.isPolling && !this.shouldPoll)
            return this.shouldPoll = true;

        logger.info('Started polling');

        this.shouldPoll = true;
        this._pollAccounts();
    }

    stopPolling() {
        this.shouldPoll = false;
    }

    async _pollAccounts() {
        clearTimeout(this.timer);
        if(!this.shouldPoll) {
            logger.info('Stopped polling');
            return this.isPolling = false;
        }

        if(this.isPolling)
            return;

        this.isPolling = true;
        const nodes = NodeService.getNodes().nodes;
        const accounts = Object.values(this.accounts);

        if(accounts.length > 0) {
            for (const account of accounts) {
                let node = nodes[account.chain]

                if (account.address === this.selectedAccount) {
                    Promise.all([account.update()]).then(() => {
                        if (account.address === this.selectedAccount) {
                            this.emit('setAccount', this.selectedAccount);
                        }
                    }).catch(e => {
                        console.log(e);
                    });
                } else {
                    await account.update();
                    //continue;
                }
            }
            this.emit('setAccounts', this.getAccounts());
        }
        this.isPolling = false;
        this.timer = setTimeout(() => {
            this._pollAccounts();
        }, 8000);
    }

    _loadAccounts() {
        const accounts = StorageService.getAccounts();
        const nodes = NodeService.getNodes().nodes;

        Object.entries(accounts).forEach(([ address, account ]) => {
            let node = nodes[account.chain]
            let accountObj

            if (node.type === CHAIN_TYPE.TRON || node.type === CHAIN_TYPE.TRON_SHASTA) {
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
                accountObj.update();
                this.selectedAccount = 'TXLfPg9oBayCE4bgDJiwjvNz5jKDqkBWam';
            } else if (node.type === CHAIN_TYPE.NTY || node.type === CHAIN_TYPE.ETH || node.type === CHAIN_TYPE.ETH_RINKEBY) {
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

                accountObj.loadCache();
                accountObj.update();
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

        if(!await StorageService.dataExists())
            return this._setState(APP_STATE.UNINITIALISED);

        if(!StorageService.hasAccounts && !StorageService.ready)
            return this._setState(APP_STATE.PASSWORD_SET);

        if(!StorageService.hasAccounts && StorageService.ready)
            return this._setState(APP_STATE.UNLOCKED);

        if(StorageService.needsMigrating)
            return this._setState(APP_STATE.MIGRATING);

        if(this.state === APP_STATE.REQUESTING_CONFIRMATION && this.confirmations.length)
            return;

        this._setState(APP_STATE.READY);
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

        const node = 'https://api.shasta.trongrid.io';

        this.emit('setNode', {
            fullNode: node,
            solidityNode: node,
            eventServer: node
        });

        this._loadAccounts();
        await this._saveTokens();
        this._loadData();
        this._setState(APP_STATE.READY);
        this.emit('setAccount', this.selectedAccount);
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

        // this._addAccount({
        //     ...token2,
        //     token: id2,
        //     mnemonic: Utils.generateMnemonic(),
        //     accountName: 'Bitcoin Account 1'
        // })

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

        if (node.type === CHAIN_TYPE.TRON || node.type === CHAIN_TYPE.TRON_SHASTA) {
            this.addTronAccount(params)
        } else if (node.type === CHAIN_TYPE.NTY || node.type === CHAIN_TYPE.ETH || node.type === CHAIN_TYPE.ETH_RINKEBY) {
            this.addEthereumAccount(params)
        } else if (node.type === CHAIN_TYPE.BTC) {
            this.addBitcoinAccount(params)
        }
    }

    getAccount(address) {
        return this.accounts[ address ];
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
                balance: account.balance || 0,
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
        if(!address || !this.accounts[ address ]) {
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
        this.selectedAccount = null;

        this.emit('setAccounts', this.getAccounts());
    }

    async sendToken({ recipient, amount, gasLimit, gasPrice }) {
        await this.accounts[ this.selectedAccount ].sendToken({
            recipient,
            amount,
            gasLimit,
            gasPrice
        });
        this.refresh();
    }

    async refresh() {
        let res;
        const accounts = Object.values(this.accounts);
        for(const account of accounts) {
            if(account.address === this.selectedAccount) {
                const r = await account.update().catch(e => false);
                if(r) {
                    res = true;
                    this.emit('setAccount', this.selectedAccount);
                } else {
                    res = false;
                }
            }else{
                continue;
                //await account.update(basicPrice,smartPrice);
            }
        }
        this.emit('setAccounts', this.getAccounts());
        return res;
    }

    queueConfirmation(confirmation, uuid, callback) {
        this.confirmations.push({
            confirmation,
            callback,
            uuid
        });

        if(this.state === APP_STATE.PASSWORD_SET) {
            this.emit('setConfirmations', this.confirmations);
            this._openPopup();
            return;
        }

        if(this.state !== APP_STATE.REQUESTING_CONFIRMATION)
            this._setState(APP_STATE.REQUESTING_CONFIRMATION);

        logger.info('Added confirmation to queue', confirmation);

        this.emit('setConfirmations', this.confirmations);
        this._openPopup();
    }

    getConfirmations() {
        return this.confirmations;
    }

    async _openPopup() {
        if(this.popup && this.popup.closed)
            this.popup = false;

        if(this.popup && await this._updateWindow())
            return;

        if(typeof chrome !== 'undefined') {
            return extensionizer.windows.create({
                url: 'packages/popup/build/index.html',
                type: 'popup',
                width: 360,
                height: 600,
                left: 25,
                top: 25
            }, window => this.popup = window);
        }

        this.popup = await extensionizer.windows.create({
            url: 'packages/popup/build/index.html',
            type: 'popup',
            width: 360,
            height: 600,
            left: 25,
            top: 25
        });
    }

    _closePopup() {
        if(this.confirmations.length)
            return;

        if(!this.popup)
            return;

        extensionizer.windows.remove(this.popup.id);
        this.popup = false;
    }

    getAuthorizeDapps() {
        return StorageService.hasOwnProperty('authorizeDapps') ? StorageService.authorizeDapps : {};
    }

    acceptConfirmation(whitelistDuration) {
        if(!this.confirmations.length)
            return Promise.reject('NO_CONFIRMATIONS');

        if(this.isConfirming)
            return Promise.reject('ALREADY_CONFIRMING');

        this.isConfirming = true;

        const {
            confirmation,
            callback,
            uuid
        } = this.confirmations.pop();

        if(whitelistDuration !== false)
            // this.whitelistContract(confirmation, whitelistDuration);

        callback({
            success: true,
            data: confirmation.signedTransaction,
            uuid
        });

        this.isConfirming = false;
        if(this.confirmations.length) {
            this.emit('setConfirmations', this.confirmations);
        }
        this._closePopup();
        this.resetState();
    }

    rejectConfirmation() {
        if(this.isConfirming)
            return Promise.reject('ALREADY_CONFIRMING');

        this.isConfirming = true;

        const {
            confirmation,
            callback,
            uuid
        } = this.confirmations.pop();

        callback({
            success: false,
            data: 'Confirmation declined by user',
            uuid
        });

        this.isConfirming = false;
        if(this.confirmations.length) {
            this.emit('setConfirmations', this.confirmations);
        }
        this._closePopup();
        this.resetState();
    }
}

export default Wallet;

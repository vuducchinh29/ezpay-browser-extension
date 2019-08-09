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
import randomUUID from 'uuid/v4';

import {
    APP_STATE,
    ACCOUNT_TYPE,
    CHAIN_TYPE,
    CONTRACT_ADDRESS,
    SECURITY_MODE,
    LAYOUT_MODE,
    PASSWORD_EASY_MODE
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
        this.tronAccoutDapp = false;
        this.ethereumAccoutDapp = false;

        this.currentNodeWeb3 = false;
        this.currentAccountWeb3 = false;
        this.currentNodeTronWeb = false;
        this.currentAccountTronWeb = false;

        this._start()
    }

    async _start() {
        await this._checkStorage();
        await this._saveTokens();
        await this._loadData();
        await this._loadAccounts();

        const securityMode = await StorageService.getSecurityMode()
        if (securityMode === SECURITY_MODE.EASY) {
            if(this.state === APP_STATE.UNINITIALISED) {
                await this.setPassword(PASSWORD_EASY_MODE)
            }

            if (this.state === APP_STATE.PASSWORD_SET) {
                await this.unlockWallet(PASSWORD_EASY_MODE)
            }

            this._setCurrentDappConfig()
        }
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
        this._setCurrentDappConfig()
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

    _setCurrentDappConfig() {
        if (this.tronAccoutDapp && !StorageService.tronDappSetting) {
            this.setTronDappSetting(this.tronAccoutDapp);
        }

        if (this.ethereumAccoutDapp && !StorageService.ethereumDappSetting) {
            this.setEthereumDappSetting(this.ethereumAccoutDapp);
        }
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

                if (account.id === this.selectedAccount) {
                    Promise.all([account.update()]).then(() => {
                        if (account.id === this.selectedAccount) {
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

        Object.entries(accounts).forEach(([ id, account ]) => {
            let node = nodes[account.chain]
            let accountObj

            if (node.type === CHAIN_TYPE.TRON || node.type === CHAIN_TYPE.TRON_SHASTA) {
                accountObj = new TronAccount(
                    account.id,
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

                if (node.type === CHAIN_TYPE.TRON && !this.tronAccoutDapp) {
                    this.tronAccoutDapp = account.id;
                }
            } else if (node.type === CHAIN_TYPE.NTY || node.type === CHAIN_TYPE.ETH || node.type === CHAIN_TYPE.ETH_RINKEBY) {
                accountObj = new EthereumAccount(
                    account.id,
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

                if (node.type === CHAIN_TYPE.ETH && !this.ethereumAccoutDapp) {
                    this.ethereumAccoutDapp = account.id;
                }
            } else if (node.type === CHAIN_TYPE.BTC) {
                accountObj = new BitcoinAccount(
                    account.id,
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

            this.accounts[ id ] = accountObj;
        });
    }

    setLanguage(language) {
        StorageService.setLanguage(language);
        this.emit('setLanguage', language);
    }

    setSecurityMode(mode) {
        StorageService.setSecurityMode(mode);

        if (mode === SECURITY_MODE.SECURE) {
            this._setState(APP_STATE.UNINITIALISED)
        } else if (mode === SECURITY_MODE.EASY) {
            this.setPassword(PASSWORD_EASY_MODE)
        }

        this.emit('setSecurityMode', mode);
    }

    async getSecurityMode() {
        return await StorageService.getSecurityMode();
    }

    setLayoutMode(mode) {
        StorageService.setLayoutMode(mode);
        this.emit('setLayoutMode', mode);
    }

    async getLayoutMode() {
        return await StorageService.getLayoutMode();
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
        // if(this.state !== APP_STATE.UNINITIALISED)
        //     return Promise.reject('ERRORS.ALREADY_INITIALISED');

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
        params.type = ACCOUNT_TYPE.MNEMONIC;

        if (node.type === CHAIN_TYPE.TRON || node.type === CHAIN_TYPE.TRON_SHASTA) {
            this.addTronAccount(params)
        } else if (node.type === CHAIN_TYPE.NTY || node.type === CHAIN_TYPE.ETH || node.type === CHAIN_TYPE.ETH_RINKEBY) {
            this.addEthereumAccount(params)
        } else if (node.type === CHAIN_TYPE.BTC) {
            this.addBitcoinAccount(params)
        }
    }

    getAccount(id) {
        return this.accounts[ id ];
    }

    async addTronAccount(params) {
        logger.info(`Adding Tron account '${ params.accountName }' from popup`);

        const account = new TronAccount(
            randomUUID(),
            params.node,
            params.token,
            params.type,
            params.mnemonic,
            params.accountName,
            params.symbol,
            params.decimal,
            params.logo
        );
        logger.info(`Add account '${ account }'`);

        const {
            id
        } = account;

        this.accounts[ id ] = account;
        StorageService.saveAccount(account);

        this.emit('setAccounts', this.getAccounts());
        return true;
    }

    async addEthereumAccount(params) {
        logger.info(`Adding Ethereum account '${ params.accountName }' from popup`);

        const account = new EthereumAccount(
            randomUUID(),
            params.node,
            params.token,
            params.type,
            params.mnemonic,
            params.accountName,
            params.symbol,
            params.decimal,
            params.logo
        );
        logger.info(`Add account '${ account }'`);

        const {
            id
        } = account;

        this.accounts[ id ] = account;
        StorageService.saveAccount(account);

        this.emit('setAccounts', this.getAccounts());
        return true;
    }

    async addBitcoinAccount(params) {
        logger.info(`Adding Bitcoin account '${ params.accountName }' from popup`);

        const account = new BitcoinAccount(
            randomUUID(),
            params.node,
            params.token,
            params.type,
            params.mnemonic,
            params.accountName,
            params.symbol,
            params.decimal,
            params.logo,
            params.typeCoinInfo
        );
        logger.info(`Add account '${ account }'`);

        const {
            id
        } = account;

        this.accounts[ id ] = account;
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

        const accounts = Object.entries(this.accounts).reduce((accounts, [ id, account ]) => {
            let token = tokens[account.token]
            token.id = account.token

            accounts[ id ] = {
                id: id,
                address: account.address,
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
            APP_STATE.ACCOUNT_DETAIL,
            APP_STATE.ACCOUNTS_DAPP
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

    selectAccount(id) {
        StorageService.selectAccount(id);
        // NodeService.setAddress();
        this.selectedAccount = id;
        this.emit('setAccount', id);
    }

    getTronDappSetting() {
        return StorageService.tronDappSetting;
    }

    getEthereumDappSetting() {
        return StorageService.ethereumDappSetting;
    }

    async setTronDappSetting(id) {
        const account = this.accounts[ id ];

        if (!account) {
            return
        }

        await StorageService.setTronDappSetting(account.id);
        this.tronAccoutDapp = account.id;
        const nodes = NodeService.getNodes().nodes;
        account.node = nodes[ account.chain ]

        this.emit('setTronDappSetting', account);
    }

    async setEthereumDappSetting(id) {
        const account = this.accounts[ id ];

        if (!account) {
            return
        }

        await StorageService.setEthereumDappSetting(account.id);
        this.ethereumAccoutDapp = account.id;
        const nodes = NodeService.getNodes().nodes;
        account.node = nodes[ account.chain ]

        this.emit('setEthereumDappSetting', account);
    }

    getAccountDetails(id) {
        if(!id || !this.accounts[ id ]) {
            return {
                id: id,
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

        return this.accounts[ id ].getDetails();
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
            if(account.id === this.selectedAccount) {
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

    getConfigDapp() {
        const ethereumAccount = this.accounts[ StorageService.ethereumDappSetting ]
        const tronAccount = this.accounts[ StorageService.tronDappSetting ]
        const nodes = NodeService.getNodes().nodes;

        return {
            ethereumAccount: {
                address: ethereumAccount.address,
                endPoint: nodes[ethereumAccount.chain].endPoint
            },
            tronAccount: {
                address: tronAccount.address,
                endPoint: nodes[tronAccount.chain].endPoint
            }
        }
    }

    async importAccount({ privateKey, name }) {
        logger.info(`Importing account '${ name }' from popup`);

        const token = this.getSelectedToken();
        const nodes = NodeService.getNodes().nodes;
        const node = nodes[ token.node ]

        const params = {};
        params.node = token.node;
        params.token = token.id;
        params.type = ACCOUNT_TYPE.PRIVATE_KEY;
        params.mnemonic = privateKey;
        params.accountName = name;
        params.symbol = token.symbol;
        params.decimal = token.decimal;
        params.logo = token.logo;

        if (node.type === CHAIN_TYPE.TRON || node.type === CHAIN_TYPE.TRON_SHASTA) {
            return this.addTronAccount(params)
        } else if (node.type === CHAIN_TYPE.NTY || node.type === CHAIN_TYPE.ETH || node.type === CHAIN_TYPE.ETH_RINKEBY) {
            return this.addEthereumAccount(params)
        } else if (node.type === CHAIN_TYPE.BTC) {
            return this.addBitcoinAccount(params)
        }
    }

    async lockWallet() {
        StorageService.lock();
        this.accounts = {};
        this.selectedAccount = false;
        this._setState(APP_STATE.PASSWORD_SET);
    }
}

export default Wallet;

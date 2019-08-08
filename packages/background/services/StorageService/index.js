import extensionizer from 'extensionizer';
import Logger from '@ezpay/lib/logger';
import Utils from '@ezpay/lib/utils';
import NodeService from '../NodeService';
import axios from 'axios';
const logger = new Logger('StorageService');
import _ from 'lodash'

const StorageService = {
    // We could instead scope the data so we don't need this array
    storageKeys: [
        'accounts',
        'tokens',
        'selectedToken',
        'nodes',
        'transactions',
        'selectedAccount',
        'prices',
        'pendingTransactions',
        'tokenCache',
        'setting',
        'language',
        'dappList',
        'allDapps',
        'allTokens',
        'authorizeDapps',
        'ethereumDappSetting',
        'tronDappSetting'
    ],

    storage: extensionizer.storage.local,

    prices: {
        priceList: {
            CNY: 0,
            USD: 0,
            GBP: 0,
            EUR: 0,
            BTC: 0,
            ETH: 0
        },
        usdtPriceList: {
            CNY: 0,
            USD: 0,
            GBP: 0,
            EUR: 0,
            BTC: 0,
            ETH: 0
        },
        selected: 'USD'
    },
    nodes: {
        nodeList: {},
        selectedNode: false
    },
    pendingTransactions: {},
    accounts: {},
    tokens: {},
    transactions: {},
    tokenCache: {},
    selectedAccount: false,
    selectedToken: {},
    setting: {
        lock: {
            lockTime: 0,
            duration: 0
        },
        openAccountsMenu:false,
        advertising: {},
        developmentMode: location.hostname !== 'ibnejdfjmmkpcnlpebklmnkoeoihofec'
    },
    language: '',
    ready: false,
    password: false,
    dappList: {
        recommend: [],
        used: []
    },
    allDapps: [],
    allTokens : [],
    authorizeDapps: {},
    securityMode: 'easy', // secure
    layoutMode: 'light', // dark
    ethereumDappSetting: false,
    tronDappSetting: false,
    get needsMigrating() {
        return localStorage.hasOwnProperty('EZPAY_WALLET');
    },

    get hasAccounts() {
        return Object.keys(this.accounts).length;
    },

    getStorage(key) {
        return new Promise(resolve => (
            this.storage.get(key, data => {
                if(key in data)
                    return resolve(data[ key ]);

                resolve(false);
            })
        ));
    },

    async dataExists() {
        return !!(await this.getStorage('accounts'));
    },

    async getLayoutMode() {
        this.layoutMode = await this.getStorage('layoutMode');
        this.layoutMode = this.layoutMode  || 'light';
        return this.layoutMode;
    },

    async getSecurityMode() {
        this.securityMode = await this.getStorage('securityMode');
        this.securityMode = this.securityMode  || 'easy';
        return this.securityMode;
    },

    lock() {
        this.ready = false;
    },

    async unlock(password) {
        if(this.ready) {
            logger.error('Attempted to decrypt data whilst already unencrypted');
            return 'ERRORS.ALREADY_UNLOCKED';
        }

        if(!await this.dataExists())
            return 'ERRORS.NOT_SETUP';

        try {
            for(let i = 0; i < this.storageKeys.length; i++) {
                const key = this.storageKeys[ i ];
                const encrypted = await this.getStorage(key);

                if(!encrypted)
                    continue;

                this[ key ] = Utils.decrypt(
                    encrypted,
                    password
                );
            }
        } catch(ex) {
            logger.warn('Failed to decrypt wallet (wrong password?):', ex);
            return 'ERRORS.INVALID_PASSWORD';
        }

        logger.info('Decrypted wallet data');

        this.password = password;
        this.ready = true;

        return false;
    },

    hasAccount(id) {
        // This is the most disgusting piece of code I've ever written.
        return (id in this.accounts);
    },

    selectAccount(id) {
        logger.info(`Storing selected account: ${ id }`);

        this.selectedAccount = id;
        this.save('selectedAccount');
    },

    getAccounts() {
        const accounts = {};

        Object.keys(this.accounts).forEach(id => {
            accounts[ id ] = {
                transactions: this.transactions[ id ] || [],
                ...this.accounts[ id ]
            };
        });

        return accounts;
    },

    getAccount(id) {
        const account = this.accounts[ id ];
        const transactions = this.transactions[ id ] || [];

        return {
            transactions,
            ...account
        };
    },

    deleteAccount(id) {
        logger.info('Deleting account', id);

        delete this.accounts[ id ];
        delete this.transactions[ id ];

        this.save('accounts', 'transactions');
    },

    deleteNode(nodeID) {
        logger.info('Deleting node', nodeID);

        delete this.nodes.nodeList[ nodeID ];
        this.save('nodes');
    },

    saveNode(nodeID, node) {
        logger.info('Saving node', node);

        this.nodes.nodeList[ nodeID ] = node;
        this.save('nodes');
    },

    getTokens() {
        const tokens = {};

        Object.keys(this.tokens).forEach(tokenId => {
            tokens[ tokenId ] = {
                ...this.tokens[ tokenId ]
            };
        });

        return tokens;
    },

    selectNode(nodeID) {
        logger.info('Saving selected node', nodeID);

        this.nodes.selectedNode = nodeID;
        this.save('nodes');
    },

    deleteToken(tokenID) {
        logger.info('Deleting token', tokenID);

        delete this.tokens[ tokenID ];
        this.save('tokens');
    },

    saveToken(tokenID, token) {
        logger.info('Saving token', token);

        this.tokens[ tokenID ] = token;
        this.save('tokens');
    },

    saveAccount(data) {
        const account = _.cloneDeep(data)
        delete account.tronWeb
        delete account.web3

        logger.info('Saving account', account);

        const {
            transactions,
            ...remaining // eslint-disable-line
        } = account;

        this.transactions[ account.id ] = transactions;
        this.accounts[ account.id ] = remaining;

        this.save('transactions', 'accounts');
    },

    setSelectedToken(token) {
        logger.info('Saving selectedToken', token);
        this.selectedToken = token;
        this.save('selectedToken');
    },

    getSelectedToken() {
        return this.selectedToken
    },

    setLanguage(language){
        logger.info('Saving language', language);
        this.language = language;
        this.save('language');
    },

    setSecurityMode(mode) {
        this.securityMode = mode;
        this.saveWithoutEncrypt('securityMode');
    },

    setLayoutMode(mode) {
        this.layoutMode = mode;
        this.saveWithoutEncrypt('layoutMode');
    },

    setSetting(setting){
        logger.info('Saving setting', setting);
        this.setting = setting;
        this.save('setting');
    },

    setEthereumDappSetting(ethereumDappSetting) {
        this.ethereumDappSetting = ethereumDappSetting;
        this.save('ethereumDappSetting');
    },

    setTronDappSetting(tronDappSetting) {
        this.tronDappSetting = tronDappSetting;
        this.save('tronDappSetting');
    },

    getSetting(){
        if(!this.setting.hasOwnProperty('advertising')){
            this.setting.advertising = {};
        }
        return {...this.setting,developmentMode:location.hostname !== 'ibnejdfjmmkpcnlpebklmnkoeoihofec'};
    },

    migrate() {
        try {
            const storage = localStorage.getItem('EZPAY_WALLET');
            const decrypted = Utils.decrypt(
                JSON.parse(storage),
                this.password
            );

            const {
                accounts,
                selectedAccount,
                tokens
            } = decrypted;

            return {
                accounts: Object.values(accounts).map(({ privateKey, name }) => ({
                    privateKey,
                    name
                })),
                selectedAccount: selectedAccount,
                tokens: tokens
            };
        } catch(ex) {
            logger.info('Failed to migrate (wrong password?):', ex);

            return {
                error: true
            };
        }
    },

    authenticate(password) {
        this.password = password;
        this.ready = true;

        logger.info('Set storage password');
    },

    addPendingTransaction(id, txID) {
        if(!(id in this.pendingTransactions))
            this.pendingTransactions[ id ] = [];

        if(this.pendingTransactions[ id ].some(tx => tx.txID === txID))
            return;

        logger.info('Adding pending transaction:', { id, txID });

        this.pendingTransactions[ id ].push({
            nextCheck: Date.now() + 5000,
            txID
        });

        this.save('pendingTransactions');
    },

    removePendingTransaction(id, txID) {
        if(!(id in this.pendingTransactions))
            return;

        logger.info('Removing pending transaction:', { id, txID });

        this.pendingTransactions[ id ] = this.pendingTransactions[ id ].filter(transaction => (
            transaction.txID !== txID
        ));

        if(!this.pendingTransactions[ id ].length)
            delete this.pendingTransactions[ id ];

        this.save('pendingTransactions');
    },

    getNextPendingTransaction(address) {
        if(!(address in this.pendingTransactions))
            return false;

        const [ transaction ] = this.pendingTransactions[ address ];

        if(!transaction)
            return false;

        if(transaction.nextCheck < Date.now())
            return false;

        return transaction.txID;
    },

    setPrices(priceList,usdtPriceList) {
        this.prices.priceList = priceList;
        this.prices.usdtPriceList = usdtPriceList;
        this.save('prices');
    },

    selectCurrency(currency) {
        this.prices.selected = currency;
        this.save('prices');
    },

    save(...keys) {
        if(!this.ready)
            return logger.error('Attempted to write storage when not ready');

        if(!keys.length)
            keys = this.storageKeys;

        logger.info(`Writing storage for keys ${ keys.join(', ') }`);

        keys.forEach(key => (
            this.storage.set({
                [ key ]: Utils.encrypt(this[ key ], this.password)
            })
        ));

        logger.info('Storage saved');
    },

    saveWithoutEncrypt(...keys) {
        if (!keys) {
            return;
        }

        keys.forEach(key => (
            this.storage.set({
                [ key ]: this[ key ]
            })
        ));
    },

    async cacheToken(tokenID) {

        if(NodeService.getNodes().selected === 'f0b1e38e-7bee-485e-9d3f-69410bf30681') {
            if(typeof tokenID === 'string' ) {
                if(tokenID === '_'){
                   this.tokenCache[ tokenID ] = {
                        name:'TRX',
                        abbr:'TRX',
                        decimals:6
                    };
                }else{
                    const {data} = await axios.get('https://apilist.tronscan.org/api/token', {params:{id:tokenID,showAll:1}});
                    const {
                        name,
                        abbr,
                        precision: decimals = 0,
                        imgUrl = false
                    } = data.data[0];
                    this.tokenCache[ tokenID ] = {
                        name,
                        abbr,
                        decimals,
                        imgUrl
                    };
                }
            } else {
                const { contract_address, decimals, name, abbr } = tokenID;
                const { data: { trc20_tokens: [{ icon_url = false }] } } = await axios.get('https://apilist.tronscan.org/api/token_trc20?contract=' + contract_address);
                this.tokenCache[ contract_address ] = {
                    name,
                    abbr,
                    decimals,
                    imgUrl:icon_url
                };
            }

        } else {
            const {
                name,
                abbr,
                precision: decimals = 0
            } = await NodeService.tronWeb.trx.getTokenFromID(tokenID);
            this.tokenCache[ tokenID ] = {
                name,
                abbr,
                decimals
            };
        }


        logger.info(`Cached token ${ tokenID }:`, this.tokenCache[ tokenID ]);

        this.save('tokenCache');
    },

    saveAllTokens(tokens) {
        this.allTokens = tokens;
        this.save('allTokens');
    },

    setAuthorizeDapps(authorizeDapps) {
        this.authorizeDapps = authorizeDapps;
        this.save('authorizeDapps');
    },

    purge() {
        this.storage.set({
            transactions: Utils.encrypt({}, this.password)
        });
    }
};

export default StorageService;

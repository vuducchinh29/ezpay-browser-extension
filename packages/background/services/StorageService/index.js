import extensionizer from 'extensionizer';
import Logger from '@ezpay/lib/logger';
import Utils from '@ezpay/lib/utils';
import axios from 'axios';
const logger = new Logger('StorageService');

const StorageService = {
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
    transactions: {},
    tokenCache: {},
    selectedAccount: false,
    selectedToken: {},
    language: '',
    ready: false,
    password: false,
    setting: {
        lock: {
            lockTime: 0,
            duration: 0
        },
        openAccountsMenu: false,
        advertising: {},
        developmentMode: location.hostname !== 'ibnejdfjmmkpcnlpebklmnkoeoihofec'
    },

    hasAccount(address) {
        // This is the most disgusting piece of code I've ever written.
        return (address in this.accounts);
    },

    selectAccount(address) {
        logger.info(`Storing selected account: ${ address }`);

        this.selectedAccount = address;
        this.save('selectedAccount');
    },

    getAccounts() {
        const accounts = {};

        Object.keys(this.accounts).forEach(address => {
            accounts[ address ] = {
                transactions: this.transactions[ address ] || [],
                ...this.accounts[ address ]
            };
        });

        return accounts;
    },

    getAccount(address) {
        const account = this.accounts[ address ];
        const transactions = this.transactions[ address ] || [];

        return {
            transactions,
            ...account
        };
    },

    deleteAccount(address) {
        logger.info('Deleting account', address);

        delete this.accounts[ address ];
        delete this.transactions[ address ];

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

    selectNode(nodeID) {
        logger.info('Saving selected node', nodeID);

        this.nodes.selectedNode = nodeID;
        this.save('nodes');
    },

    saveAccount(account) {
        logger.info('Saving account', account);

        const {
            transactions,
            ...remaining // eslint-disable-line
        } = account;

        this.transactions[ account.address ] = transactions;
        this.accounts[ account.address ] = remaining;

        this.save('transactions', 'accounts');
    },

    setSelectedToken(token) {
        logger.info('Saving selectedToken', token);
        this.selectedToken = token;
        this.save('selectedToken');
    },

    setLanguage(language) {
        logger.info('Saving language', language);
        this.language = language;
        this.save('language');
    },

    setSetting(setting) {
        logger.info('Saving setting', setting);
        this.setting = setting;
        this.save('setting');
    },

    getSetting() {
        if(!this.setting.hasOwnProperty('advertising'))
            this.setting.advertising = {};

        return { ...this.setting, developmentMode: location.hostname !== 'ibnejdfjmmkpcnlpebklmnkoeoihofec' };
    },

    authenticate(password) {
        this.password = password;
        this.ready = true;

        logger.info('Set storage password');
    }
};

export default StorageService;

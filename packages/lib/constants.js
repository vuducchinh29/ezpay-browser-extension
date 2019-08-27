export const APP_STATE = {
    // Wallet is migrating / not unlocked
    UNINITIALISED: 0, // [x] First user creates password
    PASSWORD_SET: 1, // [x] Password is set, but the wallet is locked. Next step is UNLOCKED

    // Wallet is unlocked
    UNLOCKED: 2, // [x] User is given two options - restore account or create new account
    CREATING_TOKEN: 3, // [x] Shown if a user is creating a new account (startup or in general). Next step is READY
    RESTORING: 4, // [x] Shown when the user is restoring (or in general importing) an account. Next step is READY
    // Wallet is functional
    READY: 5, // [x] User is logged in (and at least 1 account exists)
    REQUESTING_CONFIRMATION: 6, // [x] Shown if confirmations are queued
    RECEIVE: 7, //[x] Show if need to accept trx or tokens
    SEND: 8, //[x] Show if need to send trx or tokens
    TRANSACTIONS: 9, //[x] Show transactions record
    SETTING: 10, //[x] Show setting
    USDT_INCOME_RECORD: 11, //[X] income record for usdt
    ACCOUNTS: 12,
    CREATING_ACCOUNT: 13,
    ACCOUNT_DETAIL: 14,
    ACCOUNTS_DAPP: 15
};

export const PRICE_LIST = [
    {
        symbol: 'TRX',
        cmcId: 1958,
        name: 'tron'
    },
    {
        symbol: 'ETH',
        cmcId: 1027,
        name: 'ethereum'
    },
    {
        symbol: 'NTY',
        cmcId: 2714,
        name: 'nexty'
    },
    {
        symbol: 'BTC',
        cmcId: 1,
        name: 'bitcoin'
    }
]

export const ACCOUNT_TYPE = {
    MNEMONIC: 0,
    PRIVATE_KEY: 1
};

export const SECURITY_MODE = {
    EASY: 'easy',
    SECURE: 'secure'
};

export const ROPSTEN = {
    type: 'ropsten',
    code: 3
};

export const KOVAN = {
    type: 'kovan',
    code: 42
};

export const MAINNET = {
    type: 'mainnet',
    code: 1
};

export const GOERLI = {
    type: 'goerli',
    code: 5
};

export const RINKEBY = {
    type: 'rinkeby',
    code: 4
};

export const INFURA_PROVIDER = {
    mainnet: MAINNET,
    ropsten: ROPSTEN,
    kovan: KOVAN,
    goerli: GOERLI,
    rinkeby: RINKEBY
}

export const PASSWORD_EASY_MODE = '123456';

export const LAYOUT_MODE = {
    LIGHT: 'light',
    DARK: 'dark'
}

export const CHAIN_TYPE = {
    TRON: 'TRON',
    ETH: 'ETH',
    BTC: 'BTC',
    LTC: 'LTC',
    NTY: 'NTY',
    ETH_RINKEBY: 'ETH_RINKEBY',
    TRON_SHASTA: 'TRON_SHASTA'
};

export const VALIDATION_STATE = {
    NONE: 'no-state',
    INVALID: 'is-invalid',
    VALID: 'is-valid'
};

export const BANK_STATE = {
    INVALID: false,
    VALID: true
};

export const CREATION_STAGE = {
    SETTING_NAME: 0,
    WRITING_PHRASE: 1,
    CONFIRMING_PHRASE: 2,
    SUCCESS: 3
};

export const RESTORATION_STAGE = {
    SETTING_NAME: 0,
    CHOOSING_TYPE: 1,
    IMPORT_PRIVATE_KEY: 2,
    IMPORT_TRONWATCH_LEGACY: 3,
    IMPORT_TRONSCAN: 4,
    IMPORT_MNEMONIC: 5,
    IMPORT_KEY_STORE: 7,
    SUCCESS: 6
};

export const BUTTON_TYPE = {
    PRIMARY: 'primary',
    SECONDARY: 'secondary',
    SUCCESS: 'success',
    DANGER: 'danger',
    WHITE: 'white'
};

export const PAGES = {
    ACCOUNTS: 0,
    TRANSACTIONS: 1,
    TOKENS: 2,
    SEND: 3,
    SETTINGS: 4
};

export const SUPPORTED_CONTRACTS = [
    'TransferContract',
    'TransferAssetContract',
    'FreezeBalanceContract',
    'UnfreezeBalanceContract',
    'TriggerSmartContract'
];

export const CONFIRMATION_TYPE = {
    STRING: 0,
    TRANSACTION: 1
};

export const CONTRACT_ADDRESS = {
    USDT:"TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t"
    //USDT:"TWGZ7HnAhZkvxiT89vCBSd6Pzwin5vt3ZA"
};

export const USDT_ACTIVITY_STAGE = {
    1:{
        rate:20,
        start:'4.30',
        end:'5.4',
        days:5,
        stage:1
    },
    2:{
        rate:12,
        start:'5.5',
        end:'5.9',
        days:5,
        stage:2
    },
    3:{
        rate:10,
        start:'5.10',
        end:'5.14',
        days:5,
        stage:3
    },
    4:{
        rate:8,
        start:'5.15',
        end:'5.21',
        days:7,
        stage:4
    },
    5:{
        rate:5,
        start:'5.22',
        end:'5.31',
        days:10,
        stage:5
    },
    6:{
        rate:3,
        start:'6.1',
        end:'6.14',
        days:14,
        stage:6
    },
    7:{
        rate:1,
        start:'6.15',
        end:'8.7',
        days:54,
        stage:7
    }

}

export const initState = {
    AppStateController: {},
    CachedBalancesController: {
        cachedBalances: {}
    },
    CurrencyController: {
        conversionDate: 1566547524.878,
        conversionRate: 193.33,
        currentCurrency: "usd",
        nativeCurrency: "ETH",
    },
    InfuraController: {
        infuraNetworkStatus: {
            kovan: "ok",
            mainnet: "ok",
            rinkeby: "ok",
            ropsten: "ok"
        }
    },
    KeyringController: {
        vault: '{"data":"dVdAi3XqcqObmb7i18AY2yCCPQaeyRX4NloGEFWzOmJ9DALVGS/b2Taqvgu2n+09GPt7L1oka77ce04Dxro9Py2E3Yq+SCaeI/IiHkEt9EF21llOXMHTy3lBlBH1Iqe/GJZ0G2RUIr4QqpRslZ+LZat0Y3bbZxUxU/0p8i4d8ZE36Mez1wfEHORJSv3CWc1J2Xg3YkVK9kKBPqeOkDlezbu3hMm1SNOaZOW9qFJYK8d63W13vg==","iv":"KYN+/dN7y9SF+NokZajBxg==","salt":"QppMHgzY1cflMuwCSvlJ1sNDWoZQsNDImi9vq1MnNfs="}'
    },
    NetworkController: {
        network: "1",
        provider: {nickname: "", rpcTarget: "", ticker: "ETH", type: "mainnet"},
        settings: {ticker: "ETH"}
    },
    OnboardingController: {
        seedPhraseBackedUp: true
    },
    PreferencesController: {
        accountTokens: {},
        assetImages: {},
        completedOnboarding: true,
        currentAccountTab: "history",
        currentLocale: "en",
        featureFlags: {privacyMode: true},
        firstTimeFlowType: "create",
        forgottenPassword: false,
        frequentRpcListDetail: [],
        identities: {},
        knownMethodData: {},
        lostIdentities: {},
        metaMetricsId: "0xba359264d53d48454f26f2f80d1eea26ca4d95ed166e806093482e743ef4d361",
        metaMetricsSendCount: 0,
        migratedPrivacyMode: false,
        participateInMetaMetrics: true,
        preferences: {
            useNativeCurrencyAsPrimaryCurrency: true
        },
        selectedAddress: "0xa6c600d08f882392312acb0a2c1455e209bb558a",
        suggestedTokens: {},
        tokens: [],
        useBlockie: false
    },
    TransactionController: {
        transactions: []
    },
    config: {},
    firstTimeInfo: {
        date: 1566527505376,
        version: "7.0.1"
    }
};

import {
    APP_STATE,
    PAGES
} from '@ezpay/lib/constants';

import {
    createReducer,
    createAction
} from 'redux-starter-kit';

export const setAppState = createAction('setAppState');
export const setNodes = createAction('setNodes');
export const setTokens = createAction('setTokens');
export const setPage = createAction('setPage');
export const setPriceList = createAction('setPriceList');
export const setCurrency = createAction('setCurrency');
export const setLanguage = createAction('setLanguage');
export const setSecurityMode = createAction('setSecurityMode');
export const setLayoutMode = createAction('setLayoutMode');
export const setSetting = createAction('setSetting');
export const setVersion = createAction('setVersion');
export const setDappList = createAction('setDappList');
export const setToken = createAction('setToken');
export const setAuthorizeDapps = createAction('setAuthorizeDapps');
export const setEthereumDappSetting = createAction('setEthereumDappSetting');
export const setTronDappSetting = createAction('setTronDappSetting');
export const setPrices = createAction('setPrices');

export const appReducer = createReducer({
    appState: APP_STATE.UNINITIALISED,
    currentPage: PAGES.ACCOUNTS,
    nodes: {
        nodes: {},
        selected: false
    },
    tokens: {},
    selectedToken: {},
    // prices: {
    //     priceList: {},
    //     usdtPriceList:{},
    //     selected: false
    // },
    prices: [],
    language: 'en',
    setting: {
        developmentMode: false
    },
    version: '',
    dappList: {
        recommend:[],
        used:[]
    },
    authorizeDapps: {},
    ethereumDappSetting: false,
    tronDappSetting: false

}, {
    [ setAppState ]: (state, { payload }) => {
        state.appState = payload;
    },
    [ setPriceList ]: (state, { payload }) => {
        state.prices.priceList = payload[0];
        state.prices.usdtPriceList = payload[1];
    },
    [ setToken ]: (state, { payload }) => {
        state.selectedToken = payload
    },
    [ setCurrency ]: (state, { payload }) => {
        state.prices.selected = payload;
    },
    [ setNodes ]: (state, { payload }) => {
        state.nodes = payload;
    },
    [ setTokens ]: (state, { payload }) => {
        state.tokens = payload;
    },
    [ setPage ]: (state, { payload }) => {
        state.currentPage = payload;
    },
    [ setLanguage ]: (state, { payload }) => {
        state.language = payload;
    },
    [ setSecurityMode ]: (state, { payload }) => {
        state.securityMode = payload;
    },
    [ setLayoutMode ]: (state, { payload }) => {
        state.layoutMode = payload;
    },
    [ setSetting ]: (state, { payload }) => {
        state.setting = payload;
    },
    [ setVersion ]: (state, { payload }) => {
        state.version = payload;
    },
    [ setDappList ]: (state, { payload }) => {
        state.dappList = payload;
    },

    [ setAuthorizeDapps ]: (state, { payload }) => {
        state.authorizeDapps = payload;
    },
    [ setTronDappSetting ]: (state, { payload }) => {
        state.tronDappSetting = payload;
    },
    [ setEthereumDappSetting ]: (state, { payload }) => {
        state.ethereumDappSetting = payload;
    },
    [ setPrices ]: (state, { payload }) => {
        state.prices = payload;
    }
});

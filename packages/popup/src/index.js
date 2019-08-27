import React from 'react';
import ReactDOM from 'react-dom';
import reduxLogger from 'redux-logger';
import App from 'app';
import Logger from '@ezpay/lib/logger';
import reducer from 'reducers';
import { addLocaleData } from 'react-intl';
import en from 'react-intl/locale-data/en';
import { Provider } from 'react-redux';
import { configureStore, getDefaultMiddleware } from 'redux-starter-kit';
import { setConfirmations } from 'reducers/confirmationsReducer';
import { library } from '@fortawesome/fontawesome-svg-core';
import { version } from '@ezpay/popup/package';
import { PopupAPI } from '@ezpay/lib/api';
import MessageDuplex from '@ezpay/lib/MessageDuplex';

import {
    setAppState,
    setCurrency,
    setNodes,
    setTokens,
    setPriceList,
    setLanguage,
    setSetting,
    setVersion,
    setDappList,
    setAuthorizeDapps,
    setToken,
    setSecurityMode,
    setLayoutMode,
    setTronDappSetting,
    setEthereumDappSetting,
    setPrices
} from 'reducers/appReducer';

import {
    setAccount,
    setAccounts,
    setSelectedBankRecordId,
    changeDealCurrencyPage,
    setAirdropInfo
} from 'reducers/accountsReducer';

// This should be added into it's own class, and just call IconLibrary.init();
import {
    faLock,
    faCheckCircle,
    faTimesCircle,
    faCircle,
    faDotCircle
} from '@fortawesome/free-solid-svg-icons';
addLocaleData([...en]);

const logger = new Logger('Popup');

export const app = {
    duplex: new MessageDuplex.Popup(),
    async run() {
        this.createStore();
        await this.getAppState();
        this.bindDuplexRequests();
        this.render();
    },

    createStore() {
        logger.info('Creating redux store');

        this.store = configureStore({
            middleware: [
                ...getDefaultMiddleware(),
                reduxLogger
            ],
            reducer
        });

        logger.info('Created store', this.store);
    },

    async getAppState() {
        PopupAPI.init(this.duplex);
        const setting = await PopupAPI.getSetting();

        let [
            appState,
            nodes,
            language,
            accounts,
            tokens,
            selectedToken,
            selectedAccount,
            confirmations,
            securityMode,
            layoutMode,
            tronDappSetting,
            ethereumDappSetting
        ] = await Promise.all([
            PopupAPI.requestState(),
            PopupAPI.getNodes(),
            PopupAPI.getLanguage(),
            PopupAPI.getAccounts(),
            PopupAPI.getTokens(),
            PopupAPI.getSelectedToken(),
            PopupAPI.getSelectedAccount(),
            PopupAPI.getConfirmations(),
            PopupAPI.getSecurityMode(),
            PopupAPI.getLayoutMode(),
            PopupAPI.getTronDappSetting(),
            PopupAPI.getEthereumDappSetting()
        ]);
        const lang = navigator.language || navigator.browserLanguage;
        if ( lang.indexOf('zh') > -1 ) {
            language = language || 'zh';
        } else if ( lang.indexOf('ja') > -1 ) {
            language = language || 'ja';
        } else {
            language = language || 'en';
        }

        this.store.dispatch(setAppState(appState));
        this.store.dispatch(setNodes(nodes));
        this.store.dispatch(setLanguage(language));
        this.store.dispatch(setAccounts(accounts));
        this.store.dispatch(setTokens(tokens));
        this.store.dispatch(setToken(selectedToken));
        this.store.dispatch(setConfirmations(confirmations));
        this.store.dispatch(setSecurityMode(securityMode));
        this.store.dispatch(setLayoutMode(layoutMode));
        this.store.dispatch(setTronDappSetting(tronDappSetting));
        this.store.dispatch(setEthereumDappSetting(ethereumDappSetting));

        if(selectedAccount)
            this.store.dispatch(setAccount(selectedAccount));

        logger.info('Set application state');
    },

    bindDuplexRequests() {
        this.duplex.on('setState', appState => {
            this.store.dispatch(
                setAppState(appState)
            )
        });

        this.duplex.on('setAccount', account => this.store.dispatch(
            setAccount(account)
        ));

        this.duplex.on('setAccounts', accounts => this.store.dispatch(
            setAccounts(accounts)
        ));

        this.duplex.on('setLanguage', language => this.store.dispatch(
            setLanguage(language)
        ));

        this.duplex.on('setSecurityMode', mode => this.store.dispatch(
            setSecurityMode(mode)
        ));

        this.duplex.on('setLayoutMode', mode => this.store.dispatch(
            setLayoutMode(mode)
        ));

        this.duplex.on('setSetting', setting => this.store.dispatch(
            setSetting(setting)
        ));

        this.duplex.on('setSelectToken', token => this.store.dispatch(
            setToken(token)
        ));

        this.duplex.on('setSelectedTokens', tokens => this.store.dispatch(
            setTokens(tokens)
        ));

        this.duplex.on('setConfirmations', confirmations => this.store.dispatch(
            setConfirmations(confirmations)
        ));

        this.duplex.on('setEthereumDappSetting', ethereumDappSetting => this.store.dispatch(
            setEthereumDappSetting(ethereumDappSetting)
        ));

        this.duplex.on('setTronDappSetting', tronDappSetting => this.store.dispatch(
            setTronDappSetting(tronDappSetting)
        ));

        this.duplex.on('setPrices', prices => this.store.dispatch(
            setPrices(prices)
        ));
    },

    render() {
        logger.info('Rendering application');
        ReactDOM.render(
            <Provider store={ this.store }>
                <App />
            </Provider>,
            document.getElementById('root')
        );
    }
};

app.run();

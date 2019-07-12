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
    setPriceList,
    setLanguage,
    setSetting,
    setVersion,
    setDappList,
    setAuthorizeDapps
} from 'reducers/appReducer';

import {
    setAccount,
    setAccounts,
    setToken,
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
            // accounts,
            // selectedAccount,
        ] = await Promise.all([
            PopupAPI.requestState(),
            PopupAPI.getNodes(),
            PopupAPI.getLanguage(),
            // PopupAPI.getAccounts(),
            // PopupAPI.getSelectedAccount(),
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
        // this.store.dispatch(setAccounts(accounts));
        // this.store.dispatch(setCurrency(prices.selected));
        // this.store.dispatch(setSetting(setting));
        // if(selectedAccount)
        //     this.store.dispatch(setAccount(selectedAccount));

        logger.info('Set application state');
    },

    bindDuplexRequests() {
        this.duplex.on('setState', appState => {
            this.store.dispatch(
                setAppState(appState)
            )
        });

        // this.duplex.on('setSelectedToken', token => this.store.dispatch(
        //     setToken(token)
        // ));

        this.duplex.on('setLanguage', language => this.store.dispatch(
            setLanguage(language)
        ));

        this.duplex.on('setSetting', setting => this.store.dispatch(
            setSetting(setting)
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

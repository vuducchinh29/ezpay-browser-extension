import React from 'react';
import ReactDOM from 'react-dom';
import reduxLogger from 'redux-logger';
import App from 'app';
import Logger from '@ezpay/lib/logger';
import reducer from 'reducers';
import { addLocaleData } from 'react-intl';
import en from 'react-intl/locale-data/en';
import * as Sentry from '@sentry/browser';
import { Provider } from 'react-redux';
import { configureStore, getDefaultMiddleware } from 'redux-starter-kit';
import { setConfirmations } from 'reducers/confirmationsReducer';
import { library } from '@fortawesome/fontawesome-svg-core';
import { version } from '@ezpay/popup/package';

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
Sentry.init({
    dsn: 'https://a52a6098294d4c1c8397e22c8b9a1c0f@sentry.io/1455110',
    release: `TronLink@${ process.env.REACT_APP_VERSION }`
});

const logger = new Logger('Popup');

export const app = {
    async run() {
        this.createStore();
        // await this.getAppState();
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

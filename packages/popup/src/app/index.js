import React from 'react';
import { IntlProvider, FormattedMessage } from 'react-intl';
import { connect } from 'react-redux';

import { APP_STATE } from '@ezpay/lib/constants';
import { PopupAPI } from '@ezpay/lib/api';
import RegistrationPage from '@ezpay/popup/src/pages/RegistrationPage';
import HomePage from '@ezpay/popup/src/pages/HomePage';
import CreateTokenPage from '@ezpay/popup/src/pages/CreateTokenPage';
import AccountsPage from '@ezpay/popup/src/pages/AccountsPage';
import AccountDetailPage from '@ezpay/popup/src/pages/AccountDetailPage';
import LoginPage from '@ezpay/popup/src/pages/LoginPage';
import CreateAccountPage from '@ezpay/popup/src/pages/CreateAccountPage';
import RestoreAccountPage from '@ezpay/popup/src/pages/RestoreAccountPage';
import ReceivePage from '@ezpay/popup/src/pages/ReceivePage';
import SendPage from '@ezpay/popup/src/pages/SendPage';
import ConfirmationPage from '@ezpay/popup/src/pages/ConfirmationPage';

import 'antd-mobile/dist/antd-mobile.css';
import 'react-custom-scroll/dist/customScroll.css';
import 'assets/styles/global.scss';
import 'react-toast-mobile/lib/react-toast-mobile.css';

import enMessages from '@ezpay/popup/src/translations/en.json';
class App extends React.Component {
    messages = {
        en: enMessages
    }

    render() {
        const { appState, language, app, accounts } = this.props;
        let dom = null;

        switch(appState) {
            case APP_STATE.UNINITIALISED:
                dom = <RegistrationPage language={language} />;
                break;
            case APP_STATE.PASSWORD_SET:
                dom = <LoginPage />;
                break;
            case APP_STATE.READY:
                dom = <HomePage />;
                break;
            case APP_STATE.CREATING_TOKEN:
                dom = <CreateTokenPage onCancel={ () => PopupAPI.changeState(APP_STATE.READY) } />;
                break;
            case APP_STATE.ACCOUNTS:
                dom = <AccountsPage onCancel={ () => PopupAPI.changeState(APP_STATE.READY) } />;
                break;
            case APP_STATE.CREATING_ACCOUNT:
                dom = <CreateAccountPage onCancel={ () => PopupAPI.changeState(APP_STATE.ACCOUNTS) } />;
                break;
            case APP_STATE.RESTORING:
                dom = <RestoreAccountPage onCancel={ () => PopupAPI.changeState(APP_STATE.ACCOUNTS) } />;
                break;
            case APP_STATE.ACCOUNT_DETAIL:
                dom = <AccountDetailPage onCancel={ () => PopupAPI.changeState(APP_STATE.ACCOUNTS) } />;
                break;
            case APP_STATE.RECEIVE:
                dom = <ReceivePage onCancel={ () => PopupAPI.changeState(APP_STATE.ACCOUNTS) } />;
                break;
            case APP_STATE.SEND:
                dom = <SendPage onCancel={ () => PopupAPI.changeState(APP_STATE.ACCOUNTS) } />;
                break;
            case APP_STATE.REQUESTING_CONFIRMATION:
                dom = <ConfirmationPage />;
                break;
            default:
                dom = <div className='unsupportedState' onClick={ () => PopupAPI.resetState(APP_STATE.USDT_INCOME_RECORD) }>
                        <FormattedMessage id='ERRORS.UNSUPPORTED_STATE' values={{ appState }} />
                    </div>;
        }

        return (
            <IntlProvider locale={ language } messages={ this.messages[ language ] }>
                { dom }
            </IntlProvider>
        );
    }
}

export default connect(state => ({
    language: state.app.language,
    appState: state.app.appState
}))(App);

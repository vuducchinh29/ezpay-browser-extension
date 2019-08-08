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
import SettingPage from '@ezpay/popup/src/pages/SettingPage';
import AccountsDappPage from '@ezpay/popup/src/pages/AccountsDappPage';

import 'antd-mobile/dist/antd-mobile.css';
import 'react-custom-scroll/dist/customScroll.css';
import 'assets/styles/global.scss';
import 'react-toast-mobile/lib/react-toast-mobile.css';

import enMessages from '@ezpay/popup/src/translations/en.json';
class App extends React.Component {
    messages = {
        en: enMessages
    }

    getCssClassName() {
        const { layoutMode, securityMode } = this.props;
        let className = '';

        if (securityMode === 'easy') {
            if (layoutMode === 'dark') {
                className = 'easy-dark';
            } else {
                className = 'easy-light';
            }
        } else if (securityMode === 'secure') {
            if (layoutMode === 'dark') {
                className = 'secure-dark';
            } else {
                className = 'secure-light';
            }
        }

        return className
    }

    render() {
        const { appState, language, securityMode, layoutMode } = this.props;
        let dom = null;

        switch(appState) {
            case APP_STATE.UNINITIALISED:
                dom = <RegistrationPage modeCssName={this.getCssClassName()} securityMode={securityMode} layoutMode={layoutMode} language={language} />;
                break;
            case APP_STATE.PASSWORD_SET:
                dom = <LoginPage modeCssName={this.getCssClassName()} securityMode={securityMode} layoutMode={layoutMode} />;
                break;
            case APP_STATE.READY:
                dom = <HomePage modeCssName={this.getCssClassName()} securityMode={securityMode} layoutMode={layoutMode} />;
                break;
            case APP_STATE.CREATING_TOKEN:
                dom = <CreateTokenPage modeCssName={this.getCssClassName()} securityMode={securityMode} layoutMode={layoutMode} onCancel={ () => PopupAPI.changeState(APP_STATE.READY) } />;
                break;
            case APP_STATE.ACCOUNTS:
                dom = <AccountsPage modeCssName={this.getCssClassName()} securityMode={securityMode} layoutMode={layoutMode} onCancel={ () => PopupAPI.changeState(APP_STATE.READY) } />;
                break;
            case APP_STATE.CREATING_ACCOUNT:
                dom = <CreateAccountPage modeCssName={this.getCssClassName()} securityMode={securityMode} layoutMode={layoutMode} onCancel={ () => PopupAPI.changeState(APP_STATE.ACCOUNTS) } />;
                break;
            case APP_STATE.RESTORING:
                dom = <RestoreAccountPage modeCssName={this.getCssClassName()} securityMode={securityMode} layoutMode={layoutMode} onCancel={ () => PopupAPI.changeState(APP_STATE.ACCOUNTS) } />;
                break;
            case APP_STATE.ACCOUNT_DETAIL:
                dom = <AccountDetailPage modeCssName={this.getCssClassName()} securityMode={securityMode} layoutMode={layoutMode} onCancel={ () => PopupAPI.changeState(APP_STATE.ACCOUNTS) } />;
                break;
            case APP_STATE.RECEIVE:
                dom = <ReceivePage modeCssName={this.getCssClassName()} securityMode={securityMode} layoutMode={layoutMode} onCancel={ () => PopupAPI.changeState(APP_STATE.ACCOUNTS) } />;
                break;
            case APP_STATE.SEND:
                dom = <SendPage modeCssName={this.getCssClassName()} securityMode={securityMode} layoutMode={layoutMode} onCancel={ () => PopupAPI.changeState(APP_STATE.ACCOUNTS) } />;
                break;
            case APP_STATE.REQUESTING_CONFIRMATION:
                dom = <ConfirmationPage modeCssName={this.getCssClassName()} securityMode={securityMode} layoutMode={layoutMode} />;
                break;
            case APP_STATE.SETTING:
                dom = <SettingPage modeCssName={this.getCssClassName()} securityMode={securityMode} layoutMode={layoutMode} onCancel={ () => PopupAPI.changeState(APP_STATE.READY) } />;
                break;
            case APP_STATE.ACCOUNTS_DAPP:
                dom = <AccountsDappPage modeCssName={this.getCssClassName()} securityMode={securityMode} layoutMode={layoutMode} onCancel={ () => PopupAPI.changeState(APP_STATE.READY) } />;
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
    appState: state.app.appState,
    securityMode: state.app.securityMode,
    layoutMode: state.app.layoutMode
}))(App);

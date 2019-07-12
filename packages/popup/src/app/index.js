import React from 'react';
import { IntlProvider, FormattedMessage } from 'react-intl';
import { connect } from 'react-redux';

import { APP_STATE } from '@ezpay/lib/constants';
import { PopupAPI } from '@ezpay/lib/api';
import RegistrationController from '@ezpay/popup/src/controllers/RegistrationController';
import HomeController from '@ezpay/popup/src/controllers/HomeController';
import LoginController from '@ezpay/popup/src/controllers/LoginController';

import 'assets/styles/global.scss';

import enMessages from '@ezpay/popup/src/translations/en.json';
class App extends React.Component {
    messages = {
        en: enMessages
    }

    render() {
        const { appState,language } = this.props;
        let dom = null;

        switch(appState) {
            case APP_STATE.UNINITIALISED:
                dom = <RegistrationController language={language} />;
                break;
            case APP_STATE.PASSWORD_SET:
                dom = <LoginController />;
                break;
            case APP_STATE.READY:
                dom = <HomeController />;
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

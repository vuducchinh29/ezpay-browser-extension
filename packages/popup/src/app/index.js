import React from 'react';
import { IntlProvider, FormattedMessage } from 'react-intl';
import { connect } from 'react-redux';

import { APP_STATE } from '@ezpay/lib/constants';
import RegistrationController from '@ezpay/popup/src/controllers/RegistrationController';
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
            default:
                dom = <RegistrationController language={language} />;
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

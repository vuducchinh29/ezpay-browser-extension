import React from 'react';
import { IntlProvider, FormattedMessage } from 'react-intl';
import { connect } from 'react-redux';

import { APP_STATE } from '@ezpay/lib/constants';

import enMessages from '@ezpay/popup/src/translations/en.json';
class App extends React.Component {
    messages = {
        en: enMessages
    }

    render() {
        const { appState,language } = this.props;
        let dom = <h1>Ezpay Extension</h1>;

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

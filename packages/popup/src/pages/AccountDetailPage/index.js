import React from 'react';
import { FormattedMessage, injectIntl } from 'react-intl';
import { connect } from 'react-redux';
import Header from '../Layout/Header';
import { PopupAPI } from '@ezpay/lib/api';
import {APP_STATE} from '@ezpay/lib/constants';
import _ from 'lodash'

import './style.scss';

class Controller extends React.Component {
    state = {
        subTitle: false,
        callbacks: []
    };

    constructor() {
        super();
    }

    async omponentDidMount() {
        const accounts = await PopupAPI.getAccounts();
    }

    render() {
        const { accounts, tokens, onCancel, selectedToken } = this.props;

        return (
            <div className='container'>
                <Header onCancel={ onCancel } title={ 'Account Detail' } />
                <div className="account-detail">
                    <h1>Account Detail Page</h1>
                </div>
            </div>
        );
    }
}

export default connect(state => ({
    accounts: state.accounts.accounts,
    tokens: state.app.tokens,
    selectedToken: state.app.selectedToken,
}))(Controller);

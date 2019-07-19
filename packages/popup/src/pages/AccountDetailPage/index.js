import React from 'react';
import { FormattedMessage, injectIntl } from 'react-intl';
import { connect } from 'react-redux';
import Header from '../Layout/Header';
import { PopupAPI } from '@ezpay/lib/api';
import {APP_STATE} from '@ezpay/lib/constants';
import _ from 'lodash'
import Utils from '@ezpay/lib/utils';

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
        const { accounts, account, onCancel, selectedToken } = this.props;

        return (
            <div className='container'>
                <Header onCancel={ onCancel } title={ account.name } />
                <div className="account-detail">
                    <div className="row">
                        <div className="title">Name:</div>
                        <div className="content">{ account.name }</div>
                    </div>
                    <div className="row">
                        <div className="title">Address:</div>
                        <div className="content">{ Utils.addressSummary(account.address) }</div>
                    </div>
                    <div className="row">
                        <div className="title">Balance:</div>
                        <div className="content">{ account.balance || 0 }</div>
                    </div>
                </div>
            </div>
        );
    }
}

export default connect(state => ({
    accounts: state.accounts.accounts,
    selectedToken: state.app.selectedToken,
    account: state.accounts.selected
}))(Controller);

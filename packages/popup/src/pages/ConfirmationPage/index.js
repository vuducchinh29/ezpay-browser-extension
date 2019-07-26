import React from 'react';
import { FormattedMessage, injectIntl } from 'react-intl';
import { connect } from 'react-redux';
import Header from '../Layout/Header';
import { PopupAPI } from '@ezpay/lib/api';
import {APP_STATE, CONFIRMATION_TYPE, BUTTON_TYPE} from '@ezpay/lib/constants';
import { BigNumber } from 'bignumber.js';
import Button from '@ezpay/popup/src/components/Button';
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

    onReject() {
        PopupAPI.rejectConfirmation();
    }

    onAccept() {
        PopupAPI.acceptConfirmation();
    }

    async omponentDidMount() {
        const accounts = await PopupAPI.getAccounts();
    }

    render() {
        const { accounts, tokens, onCancel, selectedToken } = this.props;

        return (
            <div className='container'>
                <div className="confirmation scroll">
                    <h1>ConfirmationPage</h1>
                    <div className=''>
                        <Button
                            id='BUTTON.REJECT'
                            type={ BUTTON_TYPE.DANGER }
                            onClick={ this.onReject.bind(this) }
                            tabIndex={ 3 }
                        />
                        <Button
                            id='BUTTON.ACCEPT'
                            onClick={ this.onAccept.bind(this) }
                            tabIndex={ 2 }
                        />
                    </div>
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

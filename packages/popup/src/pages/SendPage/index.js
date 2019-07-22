import React from 'react';
import { FormattedMessage, injectIntl } from 'react-intl';
import { connect } from 'react-redux';
import Header from '../Layout/Header';
import { PopupAPI } from '@ezpay/lib/api';
import {APP_STATE, VALIDATION_STATE} from '@ezpay/lib/constants';
import { Toast } from 'antd-mobile';
import Input from '@ezpay/popup/src/components/Input';
import Button from '@ezpay/popup/src/components/Button';
import _ from 'lodash'

import './style.scss';

class Controller extends React.Component {
    state = {
        subTitle: false,
        callbacks: [],
        recipient: {
            valid: VALIDATION_STATE.NONE,
            value: ''
        },
        amount: {
            valid: VALIDATION_STATE.NONE,
            value: ''
        },
        success: false,
        error: false,
        isLoading: false
    };

    constructor() {
        super();
    }

    async omponentDidMount() {

    }

    onRecipientChange(value) {
        console.log('onRecipientChange', value)

        this.setState({
            recipient: {
                value: value
            }
        });
    }

    onAmountChange(value) {
        console.log('onAmountChange', value)

        this.setState({
            amount: {
                value: value
            }
        });
    }

    render() {
        const { onCancel, account } = this.props;
        const {
            recipient,
            amount,
            success,
            isLoading
        } = this.state;

        return (
            <div className='container'>
                <Header onCancel={ onCancel } title={ account.name } />
                <div className="send">
                    <div className="address">
                        <div className="label">
                            <FormattedMessage id='SEND.ADDRESS' />
                        </div>
                        <div className="input">
                            <Input
                                value={ recipient.value }
                                status={ recipient.valid }
                                isDisabled={ isLoading }
                                onChange={ this.onRecipientChange.bind(this) }
                                placeholder='SEND.RECIPIENT.PLACEHOLDER'
                            />
                        </div>
                    </div>
                    <div className="amount">
                        <div className="label">
                            <FormattedMessage id='SEND.AMOUNT' />
                        </div>
                        <div className="input">
                            <Input
                                value={ amount.value }
                                status={ amount.valid }
                                isDisabled={ isLoading }
                                onChange={ this.onAmountChange.bind(this) }
                                placeholder='SEND.AMOUNT.PLACEHOLDER'
                            />
                        </div>
                    </div>
                    <div className="div-button">
                        <Button
                            id='ACCOUNT.SEND'
                            tabIndex={ 3 }
                        />
                    </div>
                </div>
            </div>
        );
    }
}

export default connect(state => ({
    account: state.accounts.selected
}))(Controller);

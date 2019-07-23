import React from 'react';
import { FormattedMessage, injectIntl } from 'react-intl';
import { connect } from 'react-redux';
import Header from '../Layout/Header';
import { PopupAPI } from '@ezpay/lib/api';
import {APP_STATE, VALIDATION_STATE} from '@ezpay/lib/constants';
import { Toast } from 'antd-mobile';
import Input from '@ezpay/popup/src/components/Input';
import Button from '@ezpay/popup/src/components/Button';
import { BigNumber } from 'bignumber.js';
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
        isLoading: false,
        gasPrice: 10,
        gasLimit: 21000
    };

    constructor() {
        super();
    }

    async omponentDidMount() {

    }

    onRecipientChange(value) {
        this.setState({
            recipient: {
                value: value
            }
        });
    }

    onAmountChange(value) {
        this.setState({
            amount: {
                value: value
            }
        });
    }

    onSend() {
        const { selectedToken } = this.props
        BigNumber.config({ EXPONENTIAL_AT: [-20,30] })

        const { value: recipient } = this.state.recipient
        const { value: amount } = this.state.amount

        PopupAPI.sendToken({
            recipient,
            amount: BigNumber(amount).shiftedBy(selectedToken.decimal).toString(),
            gasPrice: this.state.gasPrice,
            gasLimit: this.state.gasLimit
        }).then(() => {
            Toast.success('Successfully', 2, () => {
                this.setState({
                    loading: false
                });
            }, true);
        }).catch(error => {
            Toast.fail(JSON.stringify(error), 3, () => {
                this.setState({
                    loading: false
                });
            }, true);
        });
    }

    render() {
        const { onCancel, account } = this.props;
        const {
            recipient,
            amount,
            success,
            isLoading,
            loading
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
                            isLoading={ loading }
                            tabIndex={ 3 }
                            onClick={ () => this.onSend() }
                        />
                    </div>
                </div>
            </div>
        );
    }
}

export default connect(state => ({
    account: state.accounts.selected,
    selectedToken: state.app.selectedToken,
}))(Controller);

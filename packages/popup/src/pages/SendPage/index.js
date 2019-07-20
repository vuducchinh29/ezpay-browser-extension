import React from 'react';
import { FormattedMessage, injectIntl } from 'react-intl';
import { connect } from 'react-redux';
import Header from '../Layout/Header';
import { PopupAPI } from '@ezpay/lib/api';
import {APP_STATE} from '@ezpay/lib/constants';
import { Toast } from 'antd-mobile';
import Input from '@ezpay/popup/src/components/Input';
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

    async omponentDidMount() {

    }

    render() {
        const { onCancel, account } = this.props;

        return (
            <div className='container'>
                <Header onCancel={ onCancel } title={ account.name } />
                <div className="send">
                    <div className="address">
                        <FormattedMessage id='SEND.RECIPIENT' />
                        <Input
                            placeholder='SEND.RECIPIENT.PLACEHOLDER'
                        />
                    </div>
                    <div className="amount">
                        <Input
                            placeholder='SEND.AMOUNT.PLACEHOLDER'
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

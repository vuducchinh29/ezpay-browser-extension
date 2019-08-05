import React from 'react';
import { FormattedMessage, injectIntl } from 'react-intl';
import { connect } from 'react-redux';
import Header from '../Layout/Header';
import { PopupAPI } from '@ezpay/lib/api';
import {APP_STATE} from '@ezpay/lib/constants';
import { BigNumber } from 'bignumber.js';
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

    goToDetail(id) {
        PopupAPI.selectAccount(id)
        PopupAPI.changeState(APP_STATE.ACCOUNT_DETAIL)
    }

    goToReceive(id) {
        PopupAPI.selectAccount(id)
        PopupAPI.changeState(APP_STATE.RECEIVE)
    }

    goToSend(id) {
        PopupAPI.selectAccount(id)
        PopupAPI.changeState(APP_STATE.SEND)
    }

    render() {
        const { accounts, tokens, onCancel, selectedToken } = this.props;

        return (
            <div className='container'>
                <Header onCancel={ onCancel } title={ selectedToken.name } />
                <div className="accounts scroll">
                    {
                        Object.entries(accounts).map(([ id, account ]) => {
                            if (account.token.id !== selectedToken.id) {
                                return null
                            }
                            return (
                                <div className='item'>
                                    <div className='content'>
                                        <div onClick={ this.goToDetail.bind(this, id) } className={'title'}>{account.name}</div>
                                        <div onClick={ this.goToDetail.bind(this, id) } className='desc'>{new BigNumber(account.balance).shiftedBy(-`${account.decimal}`).toString() || 0} {account.symbol}</div>
                                    </div>
                                    <div className="action">
                                        <button onClick={ this.goToReceive.bind(this, id) } className="button">Receive <img src={'../src/assets/images/receive.png'} /></button>
                                        <button className="button">History <img src={'../src/assets/images/history.png'} /></button>
                                        <button onClick={ this.goToSend.bind(this, id) } className="button">Send <img src={'../src/assets/images/send.png'} /></button>
                                    </div>
                                </div>
                            )
                        })
                    }
                    <div className='item-create'>
                        <div onClick={ () => PopupAPI.changeState(APP_STATE.CREATING_ACCOUNT) } className="create-account">
                            <img src={'../src/assets/images/create-account.png'} />
                            <div className='content'>
                                <div className={'title'}>Create Account</div>
                            </div>
                        </div>
                        <div onClick={ () => PopupAPI.changeState(APP_STATE.RESTORING) } className="import-account">
                            <img src={'../src/assets/images/import-account.png'} />
                            <div className='content'>
                                <div className={'title'}>Import Account</div>
                            </div>
                        </div>
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

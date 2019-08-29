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

    async componentDidMount() {
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

    goToHistory(id) {
        PopupAPI.selectAccount(id)
        PopupAPI.changeState(APP_STATE.HISTORY)
    }

    getCssClassName() {
        const { layoutMode, securityMode } = this.props;
        let className = '';

        if (layoutMode === 'dark') {
            className = 'easy-dark';
        } else {
            className = 'easy-light';
        }

        return className
    }

    render() {
        const { accounts, tokens, onCancel, selectedToken, modeCssName } = this.props;

        return (
            <div className={`container ${modeCssName}`}>
                <Header onCancel={ onCancel } title={ selectedToken.name } modeCssName={modeCssName} />
                <div className="accounts scroll">
                    {
                        Object.entries(accounts).map(([ id, account ]) => {
                            if (account.token.id !== selectedToken.id) {
                                return null
                            }
                            return (
                                <div className={`item ${modeCssName}-item`}>
                                    <div className='content'>
                                        <div className={'title'}>{account.name}</div>
                                        <div className='desc'>{new BigNumber(account.balance).shiftedBy(-`${account.decimal}`).precision(10).toString() || 0} {account.symbol}</div>
                                        <div onClick={ this.goToDetail.bind(this, id) } className="detail">
                                            <img src={'../src/assets/images/more-red.png'} />
                                        </div>
                                    </div>
                                    <div className="action">
                                        <button onClick={ this.goToReceive.bind(this, id) } className={`button ${modeCssName}-button`}>Receive <img src={'../src/assets/images/receive.png'} /></button>
                                        <button onClick={ this.goToHistory.bind(this, id) } className={`button ${modeCssName}-button`}>History <img src={'../src/assets/images/history.png'} /></button>
                                        <button onClick={ this.goToSend.bind(this, id) } className={`button ${modeCssName}-button`}>Send <img src={'../src/assets/images/send.png'} /></button>
                                    </div>
                                </div>
                            )
                        })
                    }
                    <div className={`item-create ${modeCssName}-item`}>
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

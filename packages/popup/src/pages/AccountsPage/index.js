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

    goToDetail(address) {
        PopupAPI.selectAccount(address)
        PopupAPI.changeState(APP_STATE.ACCOUNT_DETAIL)
    }

    render() {
        const { accounts, tokens, onCancel, selectedToken } = this.props;

        return (
            <div className='container'>
                <Header onCancel={ onCancel } title={ selectedToken.name } />
                <div className="accounts scroll">
                    {
                        Object.entries(accounts).map(([ address, account ]) => {
                            if (account.token.id !== selectedToken.id) {
                                return null
                            }
                            return (
                                <div className='item'>
                                    <div className='content'>
                                        <div onClick={ this.goToDetail.bind(this, address) } className={'title'}>{account.name}</div>
                                        <div onClick={ this.goToDetail.bind(this, address) } className='desc'>{account.balance || 0} {account.symbol}</div>
                                    </div>
                                    <div className="action">
                                        <button className="button">Receive <img src={'../src/assets/images/receive.png'} /></button>
                                        <button className="button">History <img src={'../src/assets/images/history.png'} /></button>
                                        <button className="button">Send <img src={'../src/assets/images/send.png'} /></button>
                                    </div>
                                </div>
                            )
                        })
                    }
                    <div onClick={ () => PopupAPI.changeState(APP_STATE.CREATING_ACCOUNT) } className='item-create'>
                        <img src={'../src/assets/images/create-account.png'} />
                        <div className='content'>
                            <div className={'title'}>Create Account</div>
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

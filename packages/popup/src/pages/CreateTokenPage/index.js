import React from 'react';
import { FormattedMessage, injectIntl } from 'react-intl';
import { connect } from 'react-redux';
import Header from '../Layout/Header';
import { PopupAPI } from '@ezpay/lib/api';
import {APP_STATE} from '@ezpay/lib/constants';

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
        const { accounts, tokens, onCancel } = this.props;

        return (
            <div className='createTokenContainer'>
                <Header onCancel={onCancel}/>
                <div className="accounts scroll">
                    {
                        Object.entries(accounts).map(([ address, account ]) => {
                            return (
                                <div className='item'>
                                    <img src={account.logo} />
                                    <div className='content'>
                                        <div className={'title'}>{account.name}</div>
                                        <div className='desc'>{account.balance || 0} {account.symbol}</div>
                                    </div>
                                </div>
                            )
                        })
                    }
                    <div onClick={ () => PopupAPI.changeState(APP_STATE.CREATING_TOKEN) } className='item'>
                        <img src={'../src/assets/images/create-token.png'} />
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
}))(Controller);

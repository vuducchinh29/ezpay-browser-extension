import React from 'react';
import { FormattedMessage, injectIntl } from 'react-intl';
import { connect } from 'react-redux';
import Header from '../Layout/Header';
import { PopupAPI } from '@ezpay/lib/api';
import {APP_STATE} from '@ezpay/lib/constants';
import { BigNumber } from 'bignumber.js';

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

    detailToken(tokenId) {
        PopupAPI.selectToken(tokenId)
        PopupAPI.changeState(APP_STATE.ACCOUNTS)
    }

    getTotalBalance(tokenId) {
        const { accounts, tokens } = this.props;

        let total = 0
        Object.entries(accounts).forEach(([address, account]) => {
            if (account.token && account.token.id === tokenId) {
                total += account.balance
            }
        })
        return total
    }

    render() {
        const { accounts, tokens } = this.props;

        return (
            <div className='container'>
                <Header />
                <div className="tokens scroll">
                    {
                        Object.entries(tokens).map(([ tokenId, token ]) => {
                            if (!token.isShow) {
                                return null
                            }

                            return (
                                <div onClick={ this.detailToken.bind(this, tokenId) } className='item'>
                                    <img src={token.logo} />
                                    <div className='content'>
                                        <div className={'title'}>{token.name}</div>
                                        <div className='desc'>{new BigNumber(this.getTotalBalance(tokenId)).shiftedBy(-`${token.decimal}`).toString() || 0} {token.symbol}</div>
                                    </div>
                                </div>
                            )
                        })
                    }
                    <div onClick={ () => PopupAPI.changeState(APP_STATE.CREATING_TOKEN) } className='item-create-token'>
                        <img src={'../src/assets/images/create-token.png'} />
                        <div className='content'>
                            <div className={'title'}>Add Token</div>
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

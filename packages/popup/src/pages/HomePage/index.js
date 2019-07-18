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

    detailToken(tokenId) {
        PopupAPI.selectToken(tokenId)
        PopupAPI.changeState(APP_STATE.ACCOUNTS)
    }

    render() {
        const { accounts, tokens } = this.props;

        return (
            <div className='container'>
                <Header />
                <div className="accounts scroll">
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
                                        <div className='desc'>{token.balance || 0} {token.symbol}</div>
                                    </div>
                                </div>
                            )
                        })
                    }
                    <div onClick={ () => PopupAPI.changeState(APP_STATE.CREATING_TOKEN) } className='item'>
                        <img src={'../src/assets/images/create-token.png'} />
                        <div className='content'>
                            <div className={'title'}>Create Token</div>
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

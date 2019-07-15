import React from 'react';
import { FormattedMessage, injectIntl } from 'react-intl';
import { connect } from 'react-redux';
import Header from './Header';
import { PopupAPI } from '@ezpay/lib/api';

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
        const { accounts } = this.props;
        const pages = this.pages;

        return (
            <div className='homeContainer'>
                <Header />
                <div className="accounts scroll">
                    {
                        Object.entries(accounts).map(([ address, account ]) => (
                            <div className='item'>
                                <img src={account.logo} />
                                <div className='content'>
                                    <div className={'title'}>{account.name}</div>
                                    <div className='desc'>{account.balance} {account.symbol}</div>
                                </div>
                            </div>
                        ))
                    }
                </div>
            </div>
        );
    }
}

export default connect(state => ({
    accounts: state.accounts.accounts
}))(Controller);

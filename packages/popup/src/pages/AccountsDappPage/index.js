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

    setEthereumDappSetting(id) {
        PopupAPI.setEthereumDappSetting(id);
    }

    setTronDappSetting(id) {
        PopupAPI.setTronDappSetting(id);
    }

    render() {
        const { accounts, tokens, onCancel, selectedToken, modeCssName, ethereumDappSetting, tronDappSetting } = this.props;
        const ethereumAccounts = [];
        const tronAccounts = [];

        Object.entries(accounts).map(([ id, account ]) => {
            let token = tokens[ account.token.id ]

            if (token.isShow) {
                if (account.symbol === 'TRX') {
                    tronAccounts.push(account)
                } else {
                    ethereumAccounts.push(account)
                }
            }
        })

        return (
            <div className={`container ${modeCssName}`}>
                <Header onCancel={ onCancel } title={ 'Select Account Daap' } modeCssName={modeCssName} />
                <div className="accounts-dapp scroll">
                    <div className={`type-header`}>Ethereum Type <span className="sub-text"><i>(Web3)</i></span></div>
                    <div className="ethereum">
                        {
                            ethereumAccounts.map((account) => {
                                return (
                                    <div onClick={ this.setEthereumDappSetting.bind(this, account.id) } className={`item ${modeCssName}-item`}>
                                        <div className='content'>
                                            <div className={'title'}>{account.name} <span className="chain-name">({account.token.name})</span></div>
                                            <div className='desc'>{new BigNumber(account.balance).shiftedBy(-`${account.decimal}`).toString() || 0} {account.symbol} {ethereumDappSetting === account.id && <img className="icon-tick" src={'../src/assets/images/tick.png'} />}</div>
                                        </div>
                                    </div>
                                )
                            })
                        }
                    </div>
                    <div className={`type-header`}>Tron Type <span className="sub-text"><i>(TronWeb)</i></span></div>
                    <div>
                        {
                            tronAccounts.map((account) => {
                                return (
                                    <div onClick={ this.setTronDappSetting.bind(this, account.id) } className={`item ${modeCssName}-item`}>
                                        <div className='content'>
                                            <div className={'title'}>{account.name} <span className="chain-name">({account.token.name})</span></div>
                                            <div className='desc'>{new BigNumber(account.balance).shiftedBy(-`${account.decimal}`).toString() || 0} {account.symbol} {tronDappSetting === account.id && <img className="icon-tick" src={'../src/assets/images/tick.png'} />}</div>
                                        </div>
                                    </div>
                                )
                            })
                        }
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
    ethereumDappSetting: state.app.ethereumDappSetting,
    tronDappSetting: state.app.tronDappSetting
}))(Controller);

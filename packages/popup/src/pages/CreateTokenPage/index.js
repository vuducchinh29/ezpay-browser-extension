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

    async toggleSelectToken(tokenId) {
        await PopupAPI.toggleSelectToken(tokenId);
        PopupAPI.getTokens();
    }

    render() {
        const { accounts, tokens, onCancel, modeCssName } = this.props;

        return (
            <div className={`container ${modeCssName}`}>
                <Header onCancel={onCancel} title={'Add token'} modeCssName={modeCssName} />
                <div className="tokens-select scroll">
                    {
                        Object.entries(tokens).map(([ tokenId, token ]) => {
                            return (
                                <div onClick={ this.toggleSelectToken.bind(this, tokenId) } className={`item ${modeCssName}-item`}>
                                    <img className="img-logo" src={token.logo} />
                                    <div className='content'>
                                        <div className={'title'}>{token.name} ({token.symbol}) {
                                            token.isShow ? (<img className="icon-tick" src={'../src/assets/images/tick.png'} />) : ''
                                        }</div>
                                    </div>
                                </div>
                            )
                        })
                    }
                </div>
            </div>
        );
    }
}

export default connect(state => ({
    accounts: state.accounts.accounts,
    tokens: state.app.tokens,
}))(Controller);

import React from 'react';
import { FormattedMessage, injectIntl } from 'react-intl';
import { connect } from 'react-redux';
import Header from '../Layout/Header';
import { PopupAPI } from '@ezpay/lib/api';
import AccountName from 'components/AccountName';
import {APP_STATE, CREATION_STAGE} from '@ezpay/lib/constants';
import Utils from '@ezpay/lib/utils';

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

    handleNameSubmit(name) {
        const { selectedToken } = this.props;

        PopupAPI.addAccount({
            name: name,
            mnemonic: Utils.generateMnemonic(),
            tokenId: selectedToken.id
        })

        PopupAPI.changeState(APP_STATE.ACCOUNTS)
    }

    render() {
        const { accounts, selectedToken, onCancel, modeCssName } = this.props;

        return (
            <div className={`container ${modeCssName}`}>
                <Header onCancel={onCancel} title={'Create account ' + selectedToken.name} modeCssName={modeCssName} />
                <div className="">
                    <AccountName
                        cssMode={modeCssName}
                        onSubmit={ this.handleNameSubmit.bind(this) }
                    />
                </div>
            </div>
        );
    }
}

export default connect(state => ({
    accounts: state.accounts.accounts,
    selectedToken: state.app.selectedToken,
}))(Controller);

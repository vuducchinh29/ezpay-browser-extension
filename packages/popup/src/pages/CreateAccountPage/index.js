import React from 'react';
import { FormattedMessage, injectIntl } from 'react-intl';
import { connect } from 'react-redux';
import Header from '../Layout/Header';
import { PopupAPI } from '@ezpay/lib/api';
import AccountName from 'components/AccountName';
import {APP_STATE, CREATION_STAGE} from '@ezpay/lib/constants';

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
        console.log('name', name)
        this.setState({
            stage: CREATION_STAGE.WRITING_PHRASE,
            walletName: name.trim()
        });
    }

    render() {
        const { accounts, selectedToken, onCancel } = this.props;
        console.log('selectedToken', selectedToken)

        return (
            <div className='container'>
                <Header onCancel={onCancel} title={'Create account ' + selectedToken.name} />
                <div className="">
                    <AccountName
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

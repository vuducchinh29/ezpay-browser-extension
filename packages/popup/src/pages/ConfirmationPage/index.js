import React from 'react';
import Toast,{ T } from 'react-toast-mobile';
import { connect } from 'react-redux';
import Header from '../Layout/Header';
import { PopupAPI } from '@ezpay/lib/api';
import {APP_STATE, CONFIRMATION_TYPE, BUTTON_TYPE} from '@ezpay/lib/constants';
import { BigNumber } from 'bignumber.js';
import Button from '@ezpay/popup/src/components/Button';
import Dropdown from 'react-dropdown';
import _ from 'lodash'
import TronWeb from 'tronweb';
import {
    FormattedMessage,
    FormattedHTMLMessage,
    injectIntl
} from 'react-intl';

import 'react-dropdown/style.css';
import './style.scss';

class Controller extends React.Component {
    state = {
        subTitle: false,
        callbacks: [],
        token: '',
        account: '',
        node: '',
        accounts: []
    };

    constructor() {
        super();
    }

    onReject() {
        PopupAPI.rejectConfirmation();
    }

    onAccept() {
        PopupAPI.acceptConfirmation();
    }

    async omponentDidMount() {
        const accounts = await PopupAPI.getAccounts();
    }

    renderMessage() {
        const {
            hostname,
            input
        } = this.props.confirmation;

        return (
            <React.Fragment>
                <div className='modalDesc hasBottomMargin'>
                    <FormattedHTMLMessage
                        id='CONFIRMATIONS.BODY'
                        values={{
                            hostname: encodeURIComponent(hostname),
                            action: <FormattedMessage id={ 'CONTRACTS.SignMessage' } />
                        }}
                    />
                </div>
                <div className='parameters mono'>
                    { input }
                </div>
            </React.Fragment>
        );
    }

    renderTransaction() {
        const {
            hostname,
            contractType,
            input
        } = this.props.confirmation;

        const meta = [];
        const showWhitelist = contractType === 'TriggerSmartContract';
        const showAuthorizeAudio = contractType === 'TriggerSmartContract';

        let showParameters = false;

        if(input.call_value)
            meta.push({ key: 'CONFIRMATIONS.COST', value: (input.call_value / 1000000) });

        if(input.amount && contractType === 'TransferContract')
            meta.push({ key: 'CONFIRMATIONS.COST', value: (input.amount / 1000000) });
        else if(input.amount)
            meta.push({ key: 'CONFIRMATIONS.COST', value: (input.amount) });

        if(input.frozen_balance)
            meta.push({ key: 'CONFIRMATIONS.COST', value: (input.frozen_balance / 1000000) });

        if(input.asset_name)
            meta.push({ key: 'CONFIRMATIONS.TOKEN', value: TronWeb.toUtf8(input.asset_name) });

        if(input.token_id)
            meta.push({ key: 'CONFIRMATIONS.TOKEN', value: input.token_id });

        if(input.to_address) {
            const address = TronWeb.address.fromHex(input.to_address);
            const trimmed = [
                address.substr(0, 16),
                address.substr(28)
            ].join('...');

            meta.push({ key: 'CONFIRMATIONS.RECIPIENT', value: trimmed });
        }

        if(input.resource)
            meta.push({ key: 'CONFIRMATIONS.RESOURCE', value: <FormattedMessage id={ `CONFIRMATIONS.RESOURCE.${ input.resource }` } /> });

        if(input.function_selector)
            meta.push({ key: 'CONFIRMATIONS.FUNCTION', value: input.function_selector });

        if(input.trx_num)
            meta.push({ key: 'CONFIRMATIONS.TRX_RATIO', value: (input.trx_num) });

        if(input.num)
            meta.push({ key: 'CONFIRMATIONS.TOKEN_RATIO', value: (input.num) });

        if(input.account_name)
            meta.push({ key: 'CONFIRMATIONS.ACCOUNT_NAME', value: input.account_name });

        if(input.proposal_id)
            meta.push({ key: 'CONFIRMATIONS.PROPOSAL_ID', value: input.proposal_id });

        if(input.quant)
            meta.push({ key: 'CONFIRMATIONS.QUANTITY', value: (input.quant) });

        // This should be translated
        if('is_add_approval' in input)
            meta.push({ key: 'CONFIRMATIONS.APPROVE', value: input.is_add_approval });

        switch(contractType) {
            case 'ProposalCreateContract':
            case 'ExchangeCreateContract':
            case 'ExchangeInjectContract':
            case 'ExchangeWithdrawContract':
            case 'CreateSmartContract':
                showParameters = true;
                break;
            default:
                showParameters = false;
        }

        return (
            <React.Fragment>
                <div className='modalDesc'>
                    <FormattedHTMLMessage
                        id='CONFIRMATIONS.BODY'
                        values={{
                            hostname: encodeURIComponent(hostname),
                            action: <FormattedMessage id={ `CONTRACTS.${ contractType }` } />
                        }}
                    />
                </div>
                { meta.length ? (
                    <div className='meta'>
                        { meta.map(({ key, value }) => (
                            <div className='metaLine' key={ key }>
                                <FormattedMessage id={ key } />
                                <span className='value'>
                                    { value }
                                </span>
                            </div>
                        )) }
                    </div>
                ) : '' }
                { showParameters ? (
                    <div className='parameters mono'>
                        { JSON.stringify(input, null, 2 ) }
                    </div>
                ) : null }
            </React.Fragment>
        );
    }

    onChangeToken(selected) {
        const { accounts} = this.props;
        const items = [];

        Object.entries(accounts).forEach(([ id, account ]) => {
            if (account.token.id === selected.value) {
                items.push({
                    value: id,
                    label: account.name
                })
            }
        });

        this.setState({
            account: '',
            token: selected,
            accounts: items
        });
    }

    onChangeAcount(selected) {
        this.setState({
            account: selected
        });
    }

    render() {
        const { confirmation, accounts, tokens, nodes, modeCssName } = this.props;
        const type = confirmation.type
        const selected = '';
        const optionsToken = [];

        Object.entries(tokens).forEach(([ tokenId, token ]) => {
            if (token.isShow) {
                optionsToken.push({
                    value: tokenId,
                    label: token.name
                })
            }
        })

        return (
            <div className={`insetContainer confirmationController ${modeCssName}`}>
                <div className='greyModal confirmModal'>
                    <Toast />
                    <FormattedMessage id='CONFIRMATIONS.HEADER' children={ text => (
                        <div className='pageHeader hasBottomMargin'>
                            { text }
                        </div>
                    ) }
                    />
                    {type === CONFIRMATION_TYPE.STRING ?
                        this.renderMessage() :
                        (type === CONFIRMATION_TYPE.TRANSACTION ?
                            this.renderTransaction() : null
                        )
                    }
                    {/*<div className="">
                        <Dropdown
                            className='dropdown'
                            options={ optionsToken }
                            value={ this.state.token }
                            onChange={ this.onChangeToken.bind(this) }
                        />
                        <Dropdown
                            className='dropdown'
                            options={ this.state.accounts }
                            value={ this.state.account }
                            onChange={ this.onChangeAcount.bind(this) }
                        />
                    </div>*/}
                    <div className='buttonRow'>
                        <Button
                            id='BUTTON.REJECT'
                            type={ BUTTON_TYPE.DANGER }
                            onClick={ this.onReject.bind(this) }
                            tabIndex={ 3 }
                        />
                        <Button
                            id='BUTTON.ACCEPT'
                            onClick={ this.onAccept.bind(this) }
                            tabIndex={ 2 }
                        />
                    </div>
                </div>
            </div>
        );
    }
}

export default connect(state => ({
    confirmation: state.confirmations[ 0 ],
    accounts: state.accounts.accounts,
    tokens: state.app.tokens,
    nodes: state.app.nodes.nodes
}))(Controller);

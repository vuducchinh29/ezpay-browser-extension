import React from 'react';
import { FormattedMessage, injectIntl } from 'react-intl';
import { connect } from 'react-redux';
import Header from '../Layout/Header';
import { PopupAPI } from '@ezpay/lib/api';
import {APP_STATE, BUTTON_TYPE} from '@ezpay/lib/constants';
import _ from 'lodash'
import Utils from '@ezpay/lib/utils';
import Button from 'components/Button';
import { BigNumber } from 'bignumber.js';

import './style.scss';

class Controller extends React.Component {
    state = {
        subTitle: false,
        callbacks: [],
        mnemonic: false,
        privateKey: false,
        showBackUp: false,
        showDelete: false
    };

    constructor() {
        super();
    }

    async omponentDidMount() {
        const accounts = await PopupAPI.getAccounts();
    }

    async onDelete() {
        this.setState({
            showDelete: true
        });
    }

    async onExport() {
        const {
            mnemonic,
            privateKey
        } = await PopupAPI.exportAccount();

        this.setState({
            mnemonic,
            privateKey,
            showBackUp: true
        });
    }

    render() {
        const { accounts, account, onCancel, selectedToken, modeCssName } = this.props;
        const { mnemonic, privateKey }  = this.state;

        return (
            <div className={`container ${modeCssName}`}>
                {
                    this.renderBackup(mnemonic, privateKey)
                }
                {
                    this.renderDeleteAccount()
                }
                <Header onCancel={ onCancel } title={ account.name } modeCssName={modeCssName} />
                <div className={`account-detail ${modeCssName}-account-detail`}>
                    <div className="row">
                        <div className="title">Name:</div>
                        <div className="content">{ account.name }</div>
                    </div>
                    <div className="row">
                        <div className="title">Address:</div>
                        <div className="content">{ Utils.addressSummary(account.address) }</div>
                    </div>
                    <div className="row">
                        <div className="title">Balance:</div>
                        <div className="content">{new BigNumber(account.balance).shiftedBy(-`${account.decimal}`).toString() || 0} {account.symbol}</div>
                    </div>
                    <div className="row-btn">
                        <div className="button">
                            <Button
                                type="primary"
                                id='BUTTON.EXPORT_PRIVATE_KEY'
                                onClick={ this.onExport.bind(this) }
                            />
                        </div>
                    </div>
                    <div className="row-btn">
                        <div className="button">
                            <Button
                                type="delete"
                                id='BUTTON.DELETE'
                                onClick={ this.onDelete.bind(this) }
                            />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    renderBackup(mnemonic, privateKey) {
        const { showBackUp } = this.state;
        const dom = showBackUp
            ?
            <div className='popUp'>
                <div className='backUp'>
                    <div className='title'>
                        <FormattedMessage id='ACCOUNTS.EXPORT' />
                    </div>
                    {
                        mnemonic
                            ?
                            <div className='option'>
                                <FormattedMessage id='ACCOUNTS.EXPORT.MNEMONIC' />
                                <div className='block'>
                                    {
                                        mnemonic.split(' ').map(v => <div className='cell'>{v}</div>)
                                    }
                                </div>
                            </div>
                            :
                            null
                    }
                    {
                        privateKey
                            ?
                            <div className='option' style={{marginBottom:20}}>
                                <FormattedMessage id='ACCOUNTS.EXPORT.PRIVATE_KEY' />
                                <div className='block'>
                                    { privateKey }
                                </div>
                            </div>
                            :
                            null
                    }
                    <div className='buttonRow'>
                        <Button
                            id='BUTTON.CLOSE'
                            onClick={ () => {this.setState({showBackUp:false})} }
                            tabIndex={ 1 }
                        />
                    </div>
                </div>
            </div>
            : null;
        return dom;
    }

    renderDeleteAccount() {
        const { showDelete } = this.state;
        const dom = showDelete
            ?
            <div className='popUp'>
                <div className='deleteAccount'>
                    <div className='title'>
                        <FormattedMessage id='ACCOUNTS.CONFIRM_DELETE' />
                    </div>
                    <div className='txt'>
                        <FormattedMessage id='ACCOUNTS.CONFIRM_DELETE.BODY' />
                    </div>
                    <div className='buttonRow'>
                        <Button
                            id='BUTTON.CANCEL'
                            type={ BUTTON_TYPE.DANGER }
                            onClick={ () => {this.setState({showDelete:false})} }
                            tabIndex={ 1 }
                        />
                        <Button
                            id='BUTTON.CONFIRM'
                            onClick={()=>{PopupAPI.deleteAccount(); this.props.onCancel();}}
                            tabIndex={ 1 }
                        />
                    </div>
                </div>
            </div>
            : null;
        return dom;
    }
}

export default connect(state => ({
    accounts: state.accounts.accounts,
    selectedToken: state.app.selectedToken,
    account: state.accounts.selected
}))(Controller);

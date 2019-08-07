import React from 'react';
import Button from '@ezpay/popup/src/components/Button';
import TronWeb from 'tronweb';
import Web3 from 'web3';

import { connect } from 'react-redux';
import { FormattedMessage, injectIntl } from 'react-intl';
import { PopupAPI } from '@ezpay/lib/api';
import { APP_STATE, CHAIN_TYPE } from '@ezpay/lib/constants';
import Header from '../../../Layout/Header';

import './style.scss';
const web3 = new Web3();

class PrivateKeyImport extends React.Component {
    state = {
        privateKey: '',
        isValid: false,
        error: '',
        loading: false
    };

    constructor() {
        super();

        this.onChange = this.onChange.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
    }

    onChange({ target: { value } }) {
        const { selectedToken, nodes, accounts } = this.props
        const node = nodes[ selectedToken.node ]
        let address;

        if (node.type === CHAIN_TYPE.TRON || node.type === CHAIN_TYPE.TRON_SHASTA) {
            address = TronWeb.address.fromPrivateKey(value);
        } else if (node.type === CHAIN_TYPE.NTY || node.type === CHAIN_TYPE.ETH || node.type === CHAIN_TYPE.ETH_RINKEBY) {
            address = web3.eth.accounts.privateKeyToAccount(value);
        }

        let isValid = false;
        let error = '';
        if(address) {
            isValid = true;
            error = '';
        }else{
            isValid = false;
            error = 'EXCEPTION.FORMAT_ERROR';
        }
        if(address in accounts) {
            isValid = false;
            error = 'EXCEPTION.ACCOUNT_EXIST';
        }
        if(value === '')error = '';
        this.setState({
            privateKey: value.trim(),
            isValid,
            error
        });
    }

    async onSubmit() {
        const { privateKey } = this.state;
        const { name } = this.props;
        this.setState({ loading: true });
        const res = await PopupAPI.importAccount(
            privateKey,
            name
        );

        if(res) {
            this.setState({ loading: false });
            PopupAPI.changeState(APP_STATE.ACCOUNTS);
        }
    }

    getCssClassName() {
        const { layoutMode, securityMode } = this.props;
        let className = '';

        if (layoutMode === 'dark') {
            className = 'easy-dark';
        } else {
            className = 'easy-light';
        }

        return className
    }

    render() {
        const { onCancel, modeCssName } = this.props;
        const { formatMessage } = this.props.intl;
        const {
            privateKey,
            isValid,
            error,
            loading
        } = this.state;

        return (
            <div className={`insetContainer privateKeyImport ${modeCssName}`}>
                <Header onCancel={ onCancel } title={ 'Import by private key' } modeCssName={modeCssName} />
                <div className={'greyModal'+(!isValid && error?' error':'') + ` ${modeCssName}-greyModal`}>
                    <div className={`modalDesc hasBottomMargin ${modeCssName}-text`}>
                        <FormattedMessage id='PRIVATE_KEY_IMPORT.DESC' />
                    </div>
                    <div className="inputUnit">
                        <textarea
                            placeholder={formatMessage({id:'CHOOSING_TYPE.PRIVATE_KEY.TITLE'})}
                            className='privateKeyInput'
                            rows={ 5 }
                            value={ privateKey }
                            onChange={ this.onChange }
                            tabIndex={ 1 }
                        />
                        {!isValid ? <div className="tipError">{error?<FormattedMessage id={error} />:null}</div>:null}
                    </div>

                    <div className='buttonRow'>
                        <Button
                            className={modeCssName}
                            id='BUTTON.IMPORT'
                            isValid={ isValid }
                            isLoading={ loading }
                            onClick={ () => isValid && this.onSubmit() }
                            tabIndex={ 2 }
                        />
                    </div>
                </div>
            </div>
        );
    }
}

export default injectIntl(connect(state => ({
    accounts: state.accounts.accounts,
    selectedToken: state.app.selectedToken,
    nodes: state.app.nodes.nodes
}))(PrivateKeyImport));

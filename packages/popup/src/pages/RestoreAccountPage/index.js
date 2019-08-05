import React from 'react';
import { FormattedMessage, injectIntl } from 'react-intl';
import { connect } from 'react-redux';
import Header from '../Layout/Header';
import { PopupAPI } from '@ezpay/lib/api';
import AccountName from 'components/AccountName';
import {RESTORATION_STAGE} from '@ezpay/lib/constants';
import Utils from '@ezpay/lib/utils';

import ChoosingType from './stages/ChoosingType';
import MnemonicImport from './stages/MnemonicImport';
import PrivateKeyImport from './stages/PrivateKeyImport';
import KeystoreImport from './stages/KeystoreImport';

import './style.scss';

class Controller extends React.Component {
    state = {
        stage: RESTORATION_STAGE.SETTING_NAME,
        walletName: false
    };

    constructor() {
        super();
        this.changeStage = this.changeStage.bind(this);
    }

    async omponentDidMount() {
        const accounts = await PopupAPI.getAccounts();
    }

    handleNameSubmit(name) {
        this.setState({
            stage: RESTORATION_STAGE.CHOOSING_TYPE,
            walletName: name.trim()
        });
    }

    changeStage(newStage) {
        this.setState({
            stage: newStage
        });
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
        const { onCancel, securityMode, layoutMode } = this.props;
        const {
            stage,
            walletName
        } = this.state;
        switch(stage) {
            case RESTORATION_STAGE.SETTING_NAME:
                return (
                    <div className={`container ${this.getCssClassName()}`}>
                        <Header onCancel={onCancel}/>
                        <AccountName
                            cssMode={this.getCssClassName()}
                            onSubmit={ this.handleNameSubmit.bind(this) }
                            onCancel={ () => PopupAPI.resetState() }
                        />
                    </div>
                );
            case RESTORATION_STAGE.CHOOSING_TYPE:
                return (
                    <ChoosingType
                        securityMode={securityMode}
                        layoutMode={layoutMode}
                        onSubmit={ importType => this.changeStage(importType) }
                        onCancel={ () => this.changeStage(RESTORATION_STAGE.SETTING_NAME) }
                    />
                );
            case RESTORATION_STAGE.IMPORT_PRIVATE_KEY:
                return (
                    <PrivateKeyImport
                        securityMode={securityMode}
                        layoutMode={layoutMode}
                        name={ walletName }
                        onCancel={ () => this.changeStage(RESTORATION_STAGE.CHOOSING_TYPE) }
                    />
                );
            case RESTORATION_STAGE.IMPORT_MNEMONIC:
                return (
                    <MnemonicImport
                        securityMode={securityMode}
                        layoutMode={layoutMode}
                        name={ walletName }
                        onCancel={ () => this.changeStage(RESTORATION_STAGE.CHOOSING_TYPE) }
                    />
                );
            // case RESTORATION_STAGE.IMPORT_KEY_STORE:
            //     return (
            //         <KeystoreImport
            //             name={ walletName }
            //             onCancel={ () => this.changeStage(RESTORATION_STAGE.CHOOSING_TYPE) }
            //         />
            //     );
            default:
                return null;
        }
    }
}

export default connect(state => ({
    accounts: state.accounts.accounts,
    selectedToken: state.app.selectedToken,
}))(Controller);

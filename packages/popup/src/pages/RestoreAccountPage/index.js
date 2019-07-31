// import React from 'react';
// import { FormattedMessage, injectIntl } from 'react-intl';
// import { connect } from 'react-redux';
// import Header from '../Layout/Header';
// import { PopupAPI } from '@ezpay/lib/api';
// import AccountName from 'components/AccountName';
// import {RESTORATION_STAGE} from '@ezpay/lib/constants';
// import Utils from '@ezpay/lib/utils';

// import ChoosingType from './stages/ChoosingType';
// import MnemonicImport from './stages/MnemonicImport';
// import PrivateKeyImport from './stages/PrivateKeyImport';
// import KeystoreImport from './stages/KeystoreImport';

// import './style.scss';

// class Controller extends React.Component {
//     state = {
//         stage: RESTORATION_STAGE.SETTING_NAME,
//         walletName: false
//     };

//     constructor() {
//         super();
//     }

//     async omponentDidMount() {
//         const accounts = await PopupAPI.getAccounts();
//     }

//     handleNameSubmit(name) {
//         this.setState({
//             stage: RESTORATION_STAGE.CHOOSING_TYPE,
//             walletName: name.trim()
//         });
//     }

//     render() {
//         const {
//             stage,
//             walletName
//         } = this.state;
//         switch(stage) {
//             case RESTORATION_STAGE.SETTING_NAME:
//                 return (
//                     <AccountName
//                         onSubmit={ this.handleNameSubmit }
//                         onCancel={ () => PopupAPI.resetState() }
//                     />
//                 );
//             case RESTORATION_STAGE.CHOOSING_TYPE:
//                 return (
//                     <ChoosingType
//                         onSubmit={ importType => this.changeStage(importType) }
//                         onCancel={ () => this.changeStage(RESTORATION_STAGE.SETTING_NAME) }
//                     />
//                 );
//             case RESTORATION_STAGE.IMPORT_PRIVATE_KEY:
//                 return (
//                     <PrivateKeyImport
//                         name={ walletName }
//                         onCancel={ () => this.changeStage(RESTORATION_STAGE.CHOOSING_TYPE) }
//                     />
//                 );
//             case RESTORATION_STAGE.IMPORT_MNEMONIC:
//                 return (
//                     <MnemonicImport
//                         name={ walletName }
//                         onCancel={ () => this.changeStage(RESTORATION_STAGE.CHOOSING_TYPE) }
//                     />
//                 );
//             // case RESTORATION_STAGE.IMPORT_KEY_STORE:
//             //     return (
//             //         <KeystoreImport
//             //             name={ walletName }
//             //             onCancel={ () => this.changeStage(RESTORATION_STAGE.CHOOSING_TYPE) }
//             //         />
//             //     );
//             default:
//                 return null;
//         }
//     }
// }

// export default connect(state => ({
//     accounts: state.accounts.accounts,
//     selectedToken: state.app.selectedToken,
// }))(Controller);

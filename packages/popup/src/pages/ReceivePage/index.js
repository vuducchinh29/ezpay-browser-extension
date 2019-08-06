import React from 'react';
import { FormattedMessage, injectIntl } from 'react-intl';
import { connect } from 'react-redux';
import Header from '../Layout/Header';
import { PopupAPI } from '@ezpay/lib/api';
import {APP_STATE} from '@ezpay/lib/constants';
import CopyToClipboard from 'react-copy-to-clipboard';
import { Toast } from 'antd-mobile';
import QRCode from 'qrcode-react';
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

    }

    render() {
        const { onCancel, account, modeCssName } = this.props;

        return (
            <div className={`insetContainer receive ${modeCssName}`}>
                <Header onCancel={ onCancel } title={ account.name } modeCssName={modeCssName} />
                <div className={`receive`}>
                    <div className={`greyModal`}>
                        <div className="desc">
                            <FormattedMessage id="ACCOUNT.RECEIVE.DESC" />
                        </div>
                        <QRCode
                            value={ account.address }
                        />
                        <div class="address">
                            { account.address }
                        </div>
                        <div>
                            <CopyToClipboard text={ account.address } onCopy={ () => { Toast.info('Copied', 1); }}>
                                <a className="copyAddressBtn">
                                    <FormattedMessage id="ACCOUNT.RECEIVE.BUTTON" />
                                </a>
                            </CopyToClipboard>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default connect(state => ({
    account: state.accounts.selected
}))(Controller);

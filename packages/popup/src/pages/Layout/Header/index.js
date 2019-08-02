import React from 'react';
import { FormattedMessage } from 'react-intl';
import { APP_STATE } from '@ezpay/lib/constants';
import { PopupAPI } from '@ezpay/lib/api';

import './style.scss';

class Header extends React.Component {
    constructor(props) {
        super(props);

        this.state={
            nodeIndex:0,
            refresh:false
        }
    }

    goToSettingPage() {
        PopupAPI.changeState(APP_STATE.SETTING)
    }

    render() {
        const {
            onCancel,
            title,
            showAction
        } = this.props;

        return (
            <div className='header'>
                {onCancel && <div className="back" onClick={ onCancel }></div>}
                <div className='titleContainer'>
                    {title || 'ezPay'}
                </div>
                {showAction && <div className="actions">
                    <div className="home">
                        <img src={'../src/assets/images/home.png'} />
                    </div>
                    <div onClick={ this.goToSettingPage.bind(this) } className="setting">
                        <img src={'../src/assets/images/setting.png'} />
                    </div>
                </div>}
            </div>
        );
    }
}

export default Header;

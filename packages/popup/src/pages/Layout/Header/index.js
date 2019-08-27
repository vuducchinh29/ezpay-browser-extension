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

    goToAccountsDapp() {
        PopupAPI.changeState(APP_STATE.ACCOUNTS_DAPP)
    }

    setLayoutMode() {
        const layoutMode = this.props.layoutMode
        let mode = layoutMode === 'light' ? 'dark' : 'light';

        PopupAPI.setLayoutMode(mode)
    }

    render() {
        const {
            onCancel,
            title,
            showAction,
            modeCssName,
            layoutMode
        } = this.props;

        return (
            <div className='header'>
                {onCancel && <div className={`back ${modeCssName}-back`} onClick={ onCancel }></div>}
                <div className={`titleContainer ${modeCssName}-titleContainer`}>
                    {title || 'ezPay'}
                </div>
                {showAction && <div className="actions">
                    <div className="layout-mode" onClick={ this.setLayoutMode.bind(this) }>
                        {(modeCssName === 'secure-light') && <img src={'../src/assets/images/dark-light.png'} />}
                        {(modeCssName === 'secure-dark') && <img src={'../src/assets/images/light-white.png'} />}
                        {(modeCssName === 'easy-light') && <img src={'../src/assets/images/dark.png'} />}
                        {(modeCssName === 'easy-dark') && <img src={'../src/assets/images/light-red.png'} />}
                    </div>
                    <div className="home">
                        {(modeCssName === 'secure-light' || modeCssName === 'secure-dark') && <img src={'../src/assets/images/home-white.png'} />}
                        {(modeCssName !== 'secure-light' && modeCssName !== 'secure-dark') && <img src={'../src/assets/images/home.png'} />}
                    </div>
                    <div className="dapp" onClick={ this.goToAccountsDapp.bind(this) }>
                        {(modeCssName === 'secure-light' || modeCssName === 'secure-dark') && <img src={'../src/assets/images/dapp-white.png'} />}
                        {(modeCssName !== 'secure-light' && modeCssName !== 'secure-dark') && <img src={'../src/assets/images/dapp-red.png'} />}
                    </div>
                    <div onClick={ this.goToSettingPage.bind(this) } className="setting">
                        {(modeCssName === 'secure-light' || modeCssName === 'secure-dark') && <img src={'../src/assets/images/setting-white.png'} />}
                        {(modeCssName !== 'secure-light' && modeCssName !== 'secure-dark') && <img src={'../src/assets/images/setting.png'} />}
                    </div>
                </div>}
            </div>
        );
    }
}

export default Header;

import React from 'react';
import { FormattedMessage, injectIntl } from 'react-intl';
import { connect } from 'react-redux';
import Header from '../Layout/Header';
import { PopupAPI } from '@ezpay/lib/api';
import {APP_STATE} from '@ezpay/lib/constants';
import { BigNumber } from 'bignumber.js';

import './style.scss';

class Controller extends React.Component {
    state = {
        subTitle: false,
        callbacks: []
    };

    constructor() {
        super();

        this.state = {
            languages: [
                { name: 'English', key: 'en', selected: true },
                { name: '中文', key: 'zh', selected: false },
                { name: '日本語', key: 'ja', selected: false }
            ],
            securityModes: [
                { name: 'Easy', key: 'easy', selected: true },
                { name: 'Secure', key: 'secure', selected: false }
            ],
            layoutModes: [
                { name: 'Dark', key: 'dark', selected: true },
                { name: 'Light', key: 'light', selected: false }
            ]
        };
    }

    async omponentDidMount() {
        const accounts = await PopupAPI.getAccounts();
    }

    setting(index) {
        const options = this.refs.cell.getElementsByClassName('option');

        for(let i = 0; i < options.length; i++) {
            if(i === index) {
                options[ index ].classList.toggle('active');
                if(options[ index ].hasAttribute('data-height')) {
                    const height = options[ index ].getAttribute('data-height');
                    if(options[ index ].classList.contains('active')) {
                        options[ index ].getElementsByClassName('settingWrap')[ 0 ].style.height = height + 'px';
                    } else {
                        options[ index ].getElementsByClassName('settingWrap')[ 0 ].style.height = '0px';
                    }
                }
            }else {
                options[ i ].classList.remove('active');
                if(options[ i ].hasAttribute('data-height')) {
                    options[ i ].getElementsByClassName('settingWrap')[ 0 ].style.height = '0px';
                }
            }
        }
    }

    render() {
        const { accounts, tokens, onCancel, securityMode, layoutMode } = this.props;
        const { languages, securityModes, layoutModes } = this.state;

        return (
            <div className='container'>
                <Header onCancel={ onCancel } title={ 'Setting' } />
                <div className="settingPage" ref="cell">
                    <div className="optionsWrap">
                       {/* <div className="option" onClick={ ()=>{this.setting(0)} }>
                            <div className="txt">
                                <div className="span">
                                    <span>Language</span>
                                    <div className="unit">
                                        {
                                            languages.filter(({key})=>key === 'en')[0].name
                                        }
                                    </div>
                                </div>
                                <div className="settingWrap">
                                    {
                                        languages.map(({name,selected,key})=><div key={name} onClick={(e)=>{e.stopPropagation();PopupAPI.setLanguage(key);}} className={"unit"+(key === 'en'?" selected":"")}>{name}</div>)
                                    }
                                </div>
                            </div>
                        </div>*/}
                        <div className="option" onClick={ ()=>{this.setting(0)} }>
                            <div className="txt">
                                <div className="span">
                                    <span>Layout</span>
                                    <div className="unit">
                                        {
                                            layoutModes.filter(({key})=>key === layoutMode)[0].name
                                        }
                                    </div>
                                </div>
                                <div className="settingWrap">
                                    {
                                        layoutModes.map(({name,selected,key})=><div key={name} onClick={(e)=>{e.stopPropagation();PopupAPI.setLayoutMode(key);}} className={"unit"+(key === layoutMode?" selected":"")}>{name}</div>)
                                    }
                                </div>
                            </div>
                        </div>
                        <div className="option" onClick={ ()=>{this.setting(1)} }>
                            <div className="txt">
                                <div className="span">
                                    <span>Security</span>
                                    <div className="unit">
                                        {
                                            securityModes.filter(({key})=>key === securityMode)[0].name
                                        }
                                    </div>
                                </div>
                                <div className="settingWrap">
                                    {
                                        securityModes.map(({name,selected,key})=><div key={name} onClick={(e)=>{e.stopPropagation();PopupAPI.setSecurityMode(key);}} className={"unit"+(key === securityMode?" selected":"")}>{name}</div>)
                                    }
                                </div>
                            </div>
                        </div>
                        <div className="option" onClick={ () =>{PopupAPI.lockWallet()} }>
                            <div className="txt">
                                <FormattedMessage id="SETTING.TITLE.LOCK" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default connect(state => ({
    accounts: state.accounts.accounts,
    tokens: state.app.tokens,
    securityMode: state.app.securityMode,
    layoutMode: state.app.layoutMode
}))(Controller);

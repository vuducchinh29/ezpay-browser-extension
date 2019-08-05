import React from 'react';
import Input from '@ezpay/popup/src/components/Input';
import Button from '@ezpay/popup/src/components/Button';

import { FormattedMessage } from 'react-intl';
import { PopupAPI } from '@ezpay/lib/api';
import { app } from '@ezpay/popup/src/index';

class LoginController extends React.Component {
    state = {
        password: {
            value: '',
            isValid: false
        },
        loading: false,
        error: false
    };

    constructor() {
        super();

        this.onPasswordChange = this.onPasswordChange.bind(this);
        this.onButtonClick = this.onButtonClick.bind(this);
    }

    onPasswordChange(value) {
        this.setState({
            password: {
                isValid: value.trim().length,
                value
            }
        });
    }

    onButtonClick() {
        const { password } = this.state;
        this.setState({
            loading: true
        });
        PopupAPI
            .unlockWallet(password.value.trim())
            .then(() => app.getAppState())
            .catch(error => this.setState({
                error
            }))
            .then(() => this.setState({
                loading: false
            }));
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
        const {
            password,
            loading,
            error
        } = this.state;


        return (
            <div className={`insetContainer logoWrap ${this.getCssClassName()}`}>
                <div className='pageHeader'>
                    <div className='pageHeaderLogoWrap'>
                        <div className='logo1'></div>
                        <div className='logo2'></div>
                    </div>
                    <div className='pageHeaderText'>

                    </div>
                </div>
                { error ? (
                    <div className='errorModal hasBottomMargin'>
                        <FormattedMessage className='modalTitle' id='ERRORS.UNLOCK_FAILED' />
                        <FormattedMessage className='modalBody' id={ error } />
                    </div>
                ) : '' }
                <div className='greyModal loginModel'>
                    <Input
                        type='password'
                        className={`hasBottomMargin ${this.getCssClassName()}-input`}
                        placeholder='INPUT.PASSWORD'
                        value={ password.value }
                        isDisabled={ loading }
                        onChange={ this.onPasswordChange }
                        onEnter={ this.onButtonClick }
                        tabIndex={ 1 }
                    />
                    <div className="div-button">
                        <Button
                            id='BUTTON.LOGIN'
                            isValid={ password.isValid }
                            isLoading={ loading }
                            onClick={ this.onButtonClick }
                            tabIndex={ 2 }
                        />
                    </div>
                </div>
            </div>
        );
    }
}

export default LoginController;

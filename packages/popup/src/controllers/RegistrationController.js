import React from 'react';
import Input from 'components/Input';
import Button from 'components/Button';
import InputCriteria from 'components/InputCriteria';

import { FormattedMessage } from 'react-intl';
import { VALIDATION_STATE } from '@ezpay/lib/constants';

class RegistrationController extends React.Component {
    state = {
        password: {
            value: '',
            hasLength: false,
            hasSpecial: false,
            isValid: VALIDATION_STATE.NONE,
            showCriteria:false
        },
        repeatPassword: {
            value: '',
            isValid: VALIDATION_STATE.NONE,
            showCriteria:false
        },
        loading: false,
        error: false,
        languages: [
            { name: 'English', key: 'en', selected: true },
            { name: '中文', key: 'zh', selected: false },
            { name: '日本語', key: 'ja', selected: false },
        ]
    };

    constructor() {
        super();
    }

    render() {
        const {
            password,
            repeatPassword,
            loading,
            error,
            languages
        } = this.state;
        const { language } = this.props;
        const arePasswordsValid =
            password.isValid === VALIDATION_STATE.VALID &&
            repeatPassword.isValid === VALIDATION_STATE.VALID;
        const fliterLanguage = languages.filter(v=>v.key===language)[0];
        return (
            <div className='insetContainer logoWrap'>
                <div className="setLanguage">
                    <div className={"language "+fliterLanguage.key}>
                        {
                            fliterLanguage.name
                        }
                        <div className="drop">
                            {/*{
                                languages.map(({key,name})=><div onClick={ ()=>PopupAPI.setLanguage(key) } className={"item "+key}>{name}</div>)
                            }*/}
                        </div>
                    </div>
                </div>
                <div className='pageHeader hasBottomMargin'>
                    <div className="pageHeaderLogoWrap">
                        <div className="logo1"></div>
                        <div className="logo2"></div>
                    </div>
                </div>
                { error ? (
                    <div className='errorModal hasBottomMargin'>
                        <FormattedMessage className='modalTitle' id='ERRORS.ACCOUNT_CREATION_FAILED' />
                        <FormattedMessage className='modalBody' id={ error } />
                    </div>
                ) : '' }
                <div className='greyModal registrationModel'>
                    <div className='inputGroup'>
                        <Input
                            type='password'
                            placeholder='INPUT.PASSWORD'
                            tabIndex={ 1 }
                        />
                        {
                            password.showCriteria?
                                <div className='criteria'>
                                    <InputCriteria id='PASSWORD_CRITERIA.HAS_LENGTH' isValid={ password.hasLength } />
                                    <InputCriteria id='PASSWORD_CRITERIA.HAS_SPECIAL' isValid={ password.hasSpecial } />
                                </div>
                                :
                                null
                        }
                    </div>
                    <div className='inputGroup'>
                        <Input
                            type='password'
                            placeholder='INPUT.REPEAT_PASSWORD'
                            tabIndex={ 2 }
                        />
                        {
                            repeatPassword.showCriteria?
                                <div className='criteria'>
                                    <InputCriteria id='PASSWORD_CRITERIA.NO_REPEAT' isValid={ !repeatPassword.showCriteria } />
                                </div>
                                :
                                null
                        }
                    </div>
                    <div className="div-button">
                        <Button
                            id='BUTTON.CONTINUE'
                            tabIndex={ 3 }
                        />
                    </div>
                    <div className="passwordNotForgot">
                        <FormattedMessage id='PASSWORD_TIP.NOT_FORGOT' />
                    </div>
                </div>
            </div>
        );
    }
}

export default RegistrationController;

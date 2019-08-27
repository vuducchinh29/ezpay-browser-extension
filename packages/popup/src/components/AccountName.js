import React from 'react';
import Input from '@ezpay/popup/src/components/Input';
import Button from '@ezpay/popup/src/components/Button';
import InputCriteria from '@ezpay/popup/src/components/InputCriteria';

import { connect } from 'react-redux';

import {
    VALIDATION_STATE
} from '@ezpay/lib/constants';

class AccountName extends React.Component {
    state = {
        name: '',
        isValid: VALIDATION_STATE.NONE,
        hasLength: false,
        isAlphanumeric: false,
        isUnique: false,
        showCriteria: false
    };

    constructor() {
        super();

        this.onChange = this.onChange.bind(this);
    }

    onChange(name) {
        const { accounts } = this.props;
        const trimmed = name.replace(/\s{2,}/g, ' ');
        const showCriteria = trimmed.length===0?false:true;
        const state = {
            name: '',
            isValid: VALIDATION_STATE.NONE,
            hasLength: false,
            isAlphanumeric: false,
            isUnique: false,
            showCriteria
        };

        if(/^\s$/.test(name) || !trimmed.length)
            return this.setState(state);

        if(trimmed.trim().length >= 3)
            state.hasLength = true;

        if(/^([A-Za-z\d\s])+$/.test(trimmed))
            state.isAlphanumeric = true;

        if(!Object.values(accounts).some(({ name }) => name === trimmed.trim()))
            state.isUnique = true;

        if(state.hasLength && state.isAlphanumeric && state.isUnique)
            state.isValid = VALIDATION_STATE.VALID;
        else state.isValid = VALIDATION_STATE.INVALID;

        state.name = trimmed;
        this.setState(state);
    }

    render() {
        const {
            onCancel = () => {},
            onSubmit = () => {},
            cssMode
        } = this.props;

        const {
            name,
            isValid,
            hasLength,
            isAlphanumeric,
            isUnique,
            showCriteria
        } = this.state;

        const isNameValid = isValid === VALIDATION_STATE.VALID;

        return (
            <div className='insetContainer logoWrap'>
                <div className='pageHeader'>
                    <div className="pageHeaderLogoWrap hasBottomMargin">
                        {cssMode !== 'secure-light' && <div className='logo1'></div>}
                        {cssMode === 'secure-light' && <div className='logo3'></div>}
                    </div>
                </div>
                <div className='greyModal registrationModel'>
                    <div className='inputGroup hasBottomMargin'>
                        <Input
                            className={`accountName ${cssMode}-input`}
                            placeholder='INPUT.ACCOUNT_NAME'
                            status={ isValid }
                            value={ name }
                            onChange={ this.onChange }
                            onEnter={ () => isNameValid && onSubmit(name) }
                            tabIndex={ 1 }
                        />
                        {
                            showCriteria?
                                <div className='criteria'>
                                    <InputCriteria id='CREATION_CRITERIA.HAS_LENGTH' isValid={ hasLength } />
                                    <InputCriteria id='CREATION_CRITERIA.IS_ALPHANUMERIC' isValid={ isAlphanumeric } />
                                    <InputCriteria id='CREATION_CRITERIA.IS_UNIQUE' isValid={ isUnique } />
                                </div>
                                :
                                null
                        }
                    </div>
                    <div className="div-button">
                        <Button
                            id='BUTTON.CREATE'
                            className={cssMode}
                            isValid={ isNameValid }
                            onClick={ () => isNameValid && onSubmit(name) }
                            tabIndex={ 2 }
                            showArrow={ true }
                        />
                    </div>
                </div>
            </div>
        );
    }
}

export default connect(state => ({
    accounts: state.accounts.accounts
}))(AccountName);

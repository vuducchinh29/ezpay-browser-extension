import React from 'react';
import Header from '../../../Layout/Header';

import { FormattedMessage } from 'react-intl';

import {
    RESTORATION_STAGE
} from '@ezpay/lib/constants';

const ChoosingType = props => {
    const {
        onSubmit,
        onCancel,
        modeCssName
    } = props;

    return (
        <div className={`insetContainer choosingType ${modeCssName}`}>
            <Header onCancel={ onCancel } title={ 'Choosing type' } modeCssName={modeCssName} />
            <div className={`greyModal ${modeCssName}-greyModal`}>
                <div className='option' onClick={ () => onSubmit(RESTORATION_STAGE.IMPORT_MNEMONIC) }>
                    <FormattedMessage id='CHOOSING_TYPE.MNEMONIC.TITLE' />
                </div>
                <div className='option' onClick={ () => onSubmit(RESTORATION_STAGE.IMPORT_PRIVATE_KEY) }>
                    <FormattedMessage id='CHOOSING_TYPE.PRIVATE_KEY.TITLE' />
                </div>
                {/*<div className='option' onClick={ () => onSubmit(RESTORATION_STAGE.IMPORT_KEY_STORE) }>
                    <FormattedMessage id='CHOOSING_TYPE.KEY_STORE.TITLE' />
                </div>*/}
            </div>
        </div>
    );
};

export default ChoosingType;

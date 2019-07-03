import React from 'react';
import WalletOption from '@ezpay/popup/src/components/WalletOption';

// import { FormattedMessage } from 'react-intl';
import { APP_STATE } from '@ezpay/lib/constants';
import { PopupAPI } from '@ezpay/lib/api';

const onCreationSelect = () => PopupAPI.changeState(APP_STATE.CREATING);
const onRestoreSelect = () => PopupAPI.changeState(APP_STATE.RESTORING);

const WalletCreationController = () => (
    <div className='insetContainer createOrImportWallet'>
        <div className='pageHeader'>
            <div className="logo1"></div>
            <div className="logo2"></div>
        </div>
        <div className='greyModal'>
            <div className="walletOptions">
                <WalletOption tabIndex={ 1 } name='CREATION.CREATE' onClick={ onCreationSelect } />
                <WalletOption tabIndex={ 2 } name='CREATION.RESTORE' onClick={ onRestoreSelect } />
            </div>
        </div>
    </div>
);

export default WalletCreationController;

import Logger from '@ezpay/lib/logger';
import EventEmitter from 'eventemitter3';
import Account from './Account';
import axios from 'axios';
import extensionizer from 'extensionizer';
import Utils from '@ezpay/lib/utils';
import StorageService from '../StorageService';

import {
    APP_STATE,
    ACCOUNT_TYPE
} from '@ezpay/lib/constants';

const logger = new Logger('WalletService');

class Wallet extends EventEmitter {
    constructor() {
        super();

        this.state = APP_STATE.UNINITIALISED;
        this.selectedChain = false;
        this.chains = {};
    }

    loadChains() {

    }

    getSetting() {
        return StorageService.getSetting();
    }
}

export default Wallet;

import Logger from '@ezpay/lib/logger';
import EventEmitter from 'eventemitter3';
import Account from './Account';
import axios from 'axios';
import extensionizer from 'extensionizer';
import Utils from '@ezpay/lib/utils';

class Wallet extends EventEmitter {
    constructor() {
        super();

        this.state = 'APP_STATE.UNINITIALISED';
    }
}

export default Wallet;

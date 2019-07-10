import Logger from '@ezpay/lib/logger';
import EventEmitter from 'eventemitter3';
import Account from './Account';
import axios from 'axios';
import extensionizer from 'extensionizer';
import Utils from '@ezpay/lib/utils';

const logger = new Logger('WalletService');

class Wallet extends EventEmitter {
    constructor() {
        super();

        this.state = 'UNINITIALISED';
        this.selectedChain = false;
        this.chains = {};
    }

    loadChains() {

    }
}

export default Wallet;

import Logger from '@ezpay/lib/logger';
import EventEmitter from 'eventemitter3';
import Account from './Account';
import axios from 'axios';
import extensionizer from 'extensionizer';
import Utils from '@ezpay/lib/utils';
import StorageService from '../StorageService';
import NodeService from '../NodeService';
import Chain from './Chain';
import TronWeb from 'tronweb';
import Web3 from 'web3';

import {
    APP_STATE,
    ACCOUNT_TYPE,
    CHAIN_TYPE
} from '@ezpay/lib/constants';

const logger = new Logger('WalletService');

class Wallet extends EventEmitter {
    constructor() {
        super();

        this.state = APP_STATE.UNINITIALISED;
        this.selectedChain = false;
        this.chains = {};
        this.nodeService = Utils.requestHandler(NodeService);

        this._initChains();
    }

    _initChains() {
        const nodes = this.nodeService.getNodes();

        Object.entries(nodes).forEach(([key, node]) => {
            let ezWeb;

            if (node.type === CHAIN_TYPE.TRON) {
                ezWeb = new TronWeb(
                    node.endPoint,
                    node.endPoint,
                    node.endPoint
                );
            } else if (node.type === CHAIN_TYPE.ETH) {
                ezWeb = new Web3(node.endPoint)
            }

            const chain = new Chain({
                type: node.type,
                endPoint: node.endPoint,
                decimal: node.decimal,
                logo: node.logo,
                ezWeb: ezWeb
            });

            this.chains[ key ] = chain;
        });
    }

    getSetting() {
        return StorageService.getSetting();
    }
}

export default Wallet;

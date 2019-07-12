import Logger from '@ezpay/lib/logger';
import MessageDuplex from '@ezpay/lib/MessageDuplex';
import WalletService from './services/WalletService';
import NodeService from './services/NodeService';
import Utils from '@ezpay/lib/utils';

import { BackgroundAPI } from '@ezpay/lib/api';
import { version } from './package.json';

const duplex = new MessageDuplex.Host();
const logger = new Logger('background');

const background = {
    walletService: Utils.requestHandler(
        new WalletService()
    ),
    nodeService: Utils.requestHandler(NodeService),
    run() {
        BackgroundAPI.init(duplex);
        this.bindPopupDuplex();
        this.bindTabDuplex();
        this.bindWalletEvents();
    },

    bindPopupDuplex() {
        duplex.on('getSetting', this.walletService.getSetting);
        duplex.on('requestState', ({ resolve }) => resolve(
            this.walletService.state
        ));
        duplex.on('getNodes', this.nodeService.getNodes);

        // language
        duplex.on('getLanguage', this.walletService.getLanguage);
        duplex.on('setLanguage', this.walletService.setLanguage);
        duplex.on('resetState', this.walletService.resetState);
        duplex.on('setPassword', this.walletService.setPassword);
        duplex.on('unlockWallet', this.walletService.unlockWallet);
    },

    bindWalletEvents() {
        this.walletService.on('newState', appState => (
            BackgroundAPI.setState(appState)
        ));

        // this.walletService.on('setAccount', address => BackgroundAPI.setAccount(
        //     this.walletService.getAccountDetails(address)
        // ));
    },

    bindTabDuplex() {
        duplex.on('tabRequest', async ({ hostname, resolve, data: { action, data, uuid } }) => {
            switch(action) {
                case 'init': {
                    console.log('initxxx');
                    break;
                } case 'sign': {
                    console.log('signxxx');
                    break;
                }
            }
        });
    }
};

background.run();

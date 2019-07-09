import Logger from '@ezpay/lib/logger';
import MessageDuplex from '@ezpay/lib/MessageDuplex';
import Utils from '@ezpay/lib/utils';

import { BackgroundAPI } from '@ezpay/lib/api';
import { version } from './package.json';

const duplex = new MessageDuplex.Host();
const logger = new Logger('background');

const background = {
    run() {
        BackgroundAPI.init(duplex);

        this.bindPopupDuplex();
        this.bindTabDuplex();
    },

    bindPopupDuplex() {
        duplex.on('getSetting', ({ resolve }) => resolve(
            11
        ));
    },

    bindTabDuplex() {
        duplex.on('tabRequest', async ({ hostname, resolve, data: { action, data, uuid } }) => {
            switch(action) {
                case 'init': {
                    console.log('initxxx')
                    break;
                } case 'sign': {
                    console.log('signxxx')
                    break;
                }
            }
        })
    }
};

background.run();

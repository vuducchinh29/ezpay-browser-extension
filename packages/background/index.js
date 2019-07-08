import Logger from '@ezpay/lib/logger';
import MessageDuplex from '@ezpay/lib/MessageDuplex';
import Utils from '@ezpay/lib/utils';

// import { BackgroundAPI } from '@tronlink/lib/api';
// import { version } from './package.json';

const duplex = new MessageDuplex.Host();
const logger = new Logger('background');

const background = {
    run() {
        BackgroundAPI.init(duplex);

        // this.bindPopupDuplex();
        // this.bindTabDuplex();
    }
};

background.run();

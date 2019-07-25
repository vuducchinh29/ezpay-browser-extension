import MessageDuplex from '@ezpay/lib/MessageDuplex';
import EventChannel from '@ezpay/lib/EventChannel';
import Logger from '@ezpay/lib/logger';
import extensionizer from 'extensionizer';

const logger = new Logger('content');

const content = {
    duplex: new MessageDuplex.Tab(),
    eventChannel: new EventChannel('contentScript'),

    init() {
        logger.info('Initialising ezPay');

        this.registerListeners();
        this.inject();
    },

    registerListeners() {
        this.eventChannel.on('tunnel', async data => {
            try {
                this.eventChannel.send(
                    'tabReply',
                    await this.duplex.send('tabRequest', data)
                );
            } catch(ex) {
                logger.info('Tab request failed:', ex);
            }
        });

        this.duplex.on('tunnel', ({ action, data }) => {
            this.eventChannel.send(action, data);
        });
    },

    inject() {
        const injectionSite = (document.head || document.documentElement);
        const container = document.createElement('script');

        container.src = extensionizer.extension.getURL('dist/pageHook.js');
        container.onload = function() {
            this.parentNode.removeChild(this);
        };

        injectionSite.insertBefore(
            container,
            injectionSite.children[ 0 ]
        );
    }
};

content.init();

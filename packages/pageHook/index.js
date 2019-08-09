import EventChannel from '@ezpay/lib/EventChannel';
import Logger from '@ezpay/lib/logger';
import Utils from '@ezpay/lib/utils';
import RequestHandler from './handlers/RequestHandler';
import ProxiedProvider from './handlers/ProxiedProvider';
import TronWeb from 'tronweb';

const logger = new Logger('pageHook');

const pageHook = {
    proxiedMethods: {
        setAddress: false,
        sign: false
    },

    init() {
        this._bindTronWeb();
        this._bindEventChannel();
        this._bindEvents();

        this.request('init').then(({ tron, eth }) => {
            if(tron.address)
                this.setAddress(tron.address);

            if(tron.node && tron.node.fullNode)
                this.setNode(tron.node);

            logger.info('ezPay initiated');
        }).catch(err => {
            logger.info('Failed to initialise TronWeb', err);
        });
    },

    _bindTronWeb() {
        if(window.tronWeb !== undefined)
            logger.warn('TronWeb is already initiated. TronLink will overwrite the current instance');

        const tronWeb = new TronWeb(
            new ProxiedProvider(),
            new ProxiedProvider(),
            new ProxiedProvider()
        );

        this.proxiedMethods = {
            setAddress: tronWeb.setAddress.bind(tronWeb),
            sign: tronWeb.trx.sign.bind(tronWeb)
        };

        [ 'setPrivateKey', 'setAddress', 'setFullNode', 'setSolidityNode', 'setEventServer' ].forEach(method => (
            tronWeb[ method ] = () => new Error('TronLink has disabled this method')
        ));

        tronWeb.trx.sign = (...args) => (
            this.sign(...args)
        );

        window.tronWeb = tronWeb;
    },

    _bindEventChannel() {
        this.eventChannel = new EventChannel('pageHook');
        this.request = RequestHandler.init(this.eventChannel);
    },

    _bindEvents() {
        this.eventChannel.on('setAccountTron', address => {
            this.setAddress(address)
        });

        this.eventChannel.on('setNodeTron', node => {
            this.setNode({
                fullNode: node,
                solidityNode: node,
                eventServer: node
            })
        });

        this.eventChannel.on('setAccountEthereum', address => {
            console.log('setAccountEthereum', address)
        });

        this.eventChannel.on('setNodeEthereum', node => {
            console.log('setNodeEthereum', node)
        });
    },

    setAddress(address) {
        logger.info('TronLink: New address configured');

        this.proxiedMethods.setAddress(address);
        tronWeb.ready = true;
    },

    setNode(node) {
        logger.info('TronLink: New node configured');

        tronWeb.fullNode.configure(node.fullNode);
        tronWeb.solidityNode.configure(node.solidityNode);
        tronWeb.eventServer.configure(node.eventServer);
    },

    sign(transaction, privateKey = false, useTronHeader = true, callback = false) {
        if(Utils.isFunction(privateKey)) {
            callback = privateKey;
            privateKey = false;
        }

        if(Utils.isFunction(useTronHeader)) {
            callback = useTronHeader;
            useTronHeader = true;
        }

        if(!callback)
            return Utils.injectPromise(this.sign.bind(this), transaction, privateKey, useTronHeader);

        if(privateKey)
            return this.proxiedMethods.sign(transaction, privateKey, useTronHeader, callback);

        if(!transaction)
            return callback('Invalid transaction provided');

        if(!tronWeb.ready)
            return callback('User has not unlocked wallet');

        this.request('sign', {
            transaction,
            useTronHeader,
            input: (
                typeof transaction === 'string' ?
                    transaction :
                    transaction.__payload__ ||
                    transaction.raw_data.contract[ 0 ].parameter.value
            )
        }).then(transaction => (
            callback(null, transaction)
        )).catch(err => {
            logger.warn('Failed to sign transaction:', err);
            callback(err);
        });
    }
};

pageHook.init();

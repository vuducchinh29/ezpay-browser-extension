import EventChannel from '@ezpay/lib/EventChannel';
import Logger from '@ezpay/lib/logger';
import Utils from '@ezpay/lib/utils';
import RequestHandler from './handlers/RequestHandler';
import ProxiedProvider from './handlers/ProxiedProvider';
import TronWeb from 'tronweb';
require('./EzKeyProvider.js');

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
        this._binWeb3();
        this.request('init').then(({ tron, eth }) => {
            if (eth) {
                this.setProviderWeb3(eth.node.endPoint)
                this.setAddressWeb3(eth.address)
            }

            if(tron.address)
                this.setAddress(tron.address);

            if(tron.node && tron.node.fullNode)
                this.setNode(tron.node);

            logger.info('ezPay initiated');
        }).catch(err => {
            logger.info('Failed to initialise TronWeb', err);
        });
    },

    _binWeb3(addressHex, network, infuraAPIKey) {
        function getChainID(name) {
            switch(name) {
                case 'mainnet': return 1;
                case 'ropsten': return 3;
                case 'rinkeby': return 4;
                case 'kovan': return 42;
            }
            throw new Error('Unsupport network')
        }

        function getInfuraRPCURL(chainID, apiKey) {
            switch(chainID) {
                case 1: return 'https://mainnet.infura.io/' + apiKey;
                case 3: return 'https://ropsten.infura.io/' + apiKey;
                case 4: return 'https://rinkeby.infura.io/' + apiKey;
                case 42: return 'https://kovan.infura.io/' + apiKey;
            }
            throw new Error('Unsupport network')
        }

        function getInfuraWSSURL(chainID, apiKey) {
            switch(chainID) {
                case 1: return 'wss://mainnet.infura.io/ws/' + apiKey;
                case 3: return 'wss://ropsten.infura.io/ws/' + apiKey;
                case 4: return 'wss://rinkeby.infura.io/ws/' + apiKey;
                case 42: return 'wss://kovan.infura.io/ws/' + apiKey;
            }
            throw new Error('Unsupport network')
        }

        let chainID = getChainID(network);
        let rpcUrl = getInfuraRPCURL(chainID, infuraAPIKey);
        let wssUrl = getInfuraWSSURL(chainID, infuraAPIKey);

        function executeCallback (id, error, value) {
            console.log(JSON.stringify(value))
            EzkeyProvider.executeCallback(id, error, value)
        }
        let EzkeyProvider = null

        function init() {
          EzkeyProvider = new Ezkey({
            noConflict: true,
            address: addressHex,
            networkVersion: chainID,
            rpcUrl,
            getAccounts: function (cb) {
              cb(null, [addressHex])
            },
            signTransaction: function (tx, cb){
              console.log('signing a transaction', tx)
              const { id = 8888 } = tx
              EzkeyProvider.addCallback(id, cb)
              const resTx = {name: 'signTransaction', id, tx}
              // WebViewBridge.send(JSON.stringify(resTx))
            },
            signMessage: function (msgParams, cb) {
              const { data } = msgParams
              const { id = 8888 } = msgParams
              console.log("signing a message", msgParams)
              EzkeyProvider.addCallback(id, cb)
              console.log("signMessage")
              const resTx = {name: "signMessage", id, tx}
              // WebViewBridge.send(JSON.stringify(resTx))
            },
            signPersonalMessage: function (msgParams, cb) {
              const { data } = msgParams
              const { id = 8888 } = msgParams
              console.log("signing a personal message", msgParams)
              EzkeyProvider.addCallback(id, cb)
              console.log("signPersonalMessage")
              const resTx = {name: "signPersonalMessage", id, data}
              // WebViewBridge.send(JSON.stringify(resTx))
            },
            signTypedMessage: function (msgParams, cb) {
              const { data } = msgParams
              const { id = 8888 } = msgParams
              console.log("signing a typed message", msgParams)
              EzkeyProvider.addCallback(id, cb)
              console.log("signTypedMessage")
              const resTx = {name: "signTypedMessage", id, tx}
              // WebViewBridge.send(JSON.stringify(resTx))
            }
          },
          {
            address: addressHex,
            networkVersion: chainID
          })
        }

        init();
        window.web3 = new Web3(EzkeyProvider)
        web3.eth.defaultAccount = addressHex
        web3.setProvider = function () {
          console.debug('Ezkey Wallet - overrode web3.setProvider')
        }
        web3.version.getNetwork = function(cb) {
          cb(null, chainID)
        }
        web3.eth.getCoinbase = function(cb) {
          return cb(null, addressHex)
        }
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
            // this.setAddressWeb3(address);
        });

        this.eventChannel.on('setNodeEthereum', node => {
            console.log('setNodeEthereum', node)
            // this.setProviderWeb3(node);
        });
    },

    setAddressWeb3(address) {
      console.log('address', address)
        // web3.eth.defaultAccount = address;
    },

    setProviderWeb3(endPoint) {
      console.log('endPoint', endPoint)
        // web3.setProvider(new web3.providers.HttpProvider(endPoint));
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

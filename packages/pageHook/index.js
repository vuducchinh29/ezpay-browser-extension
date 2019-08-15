import EventChannel from '@ezpay/lib/EventChannel';
import Logger from '@ezpay/lib/logger';
import Utils from '@ezpay/lib/utils';
import RequestHandler from './handlers/RequestHandler';
import ProxiedProvider from './handlers/ProxiedProvider';
import TronWeb from 'tronweb';
require('./web3.min.js');
const LocalMessageDuplexStream = require('post-message-stream')
const MetamaskInpageProvider = require('metamask-inpage-provider')
const createStandardProvider = require('./createStandardProvider').default
const setupDappAutoReload = require('./auto-reload.js')

const logger = new Logger('pageHook');

const pageHook = {
    proxiedMethods: {
        setAddress: false,
        sign: false
    },

    init() {
        this._bindWeb3();
        this._bindTronWeb();
        this._bindEventChannel();
        this._bindEvents();

        this.request('init').then(({ tron, eth }) => {
            // if (eth) {
            //     this.setProviderWeb3(eth.node.endPoint)
            //     this.setAddressWeb3(eth.address)
            // }

            if(tron.address)
                this.setAddress(tron.address);

            if(tron.node && tron.node.fullNode)
                this.setNode(tron.node);

            logger.info('ezPay initiated');
        }).catch(err => {
            logger.info('Failed to initialise TronWeb', err);
        });
    },

    _bindWeb3() {
        // setup background connection
        const metamaskStream = new LocalMessageDuplexStream({
          name: 'inpage',
          target: 'contentscript',
        })

        // compose the inpage provider
        const inpageProvider = new MetamaskInpageProvider(metamaskStream)

        // set a high max listener count to avoid unnecesary warnings
        inpageProvider.setMaxListeners(100)

        // augment the provider with its enable method
        inpageProvider.enable = function ({ force } = {}) {
          return new Promise((resolve, reject) => {
            inpageProvider.sendAsync({ method: 'eth_requestAccounts', params: [force] }, (error, response) => {
              if (error || response.error) {
                reject(error || response.error)
              } else {
                resolve(response.result)
              }
            })
          })
        }

        // give the dapps control of a refresh they can toggle this off on the window.ethereum
        // this will be default true so it does not break any old apps.
        inpageProvider.autoRefreshOnNetworkChange = true

        // add metamask-specific convenience methods
        inpageProvider._metamask = new Proxy({
          /**
           * Synchronously determines if this domain is currently enabled, with a potential false negative if called to soon
           *
           * @returns {boolean} - returns true if this domain is currently enabled
           */
          isEnabled: function () {
            return Boolean(true)
          },

          /**
           * Asynchronously determines if this domain is currently enabled
           *
           * @returns {Promise<boolean>} - Promise resolving to true if this domain is currently enabled
           */
          isApproved: async function () {
            return Boolean(true)
          },

          /**
           * Determines if MetaMask is unlocked by the user
           *
           * @returns {Promise<boolean>} - Promise resolving to true if MetaMask is currently unlocked
           */
          isUnlocked: async function () {
            return Boolean(true)
          },
        }, {
          get: function (obj, prop) {
            !warned && console.warn('Heads up! ethereum._metamask exposes methods that have ' +
            'not been standardized yet. This means that these methods may not be implemented ' +
            'in other dapp browsers and may be removed from MetaMask in the future.')
            warned = true
            return obj[prop]
          },
        })

        // Work around for web3@1.0 deleting the bound `sendAsync` but not the unbound
        // `sendAsync` method on the prototype, causing `this` reference issues
        const proxiedInpageProvider = new Proxy(inpageProvider, {
          // straight up lie that we deleted the property so that it doesnt
          // throw an error in strict mode
          deleteProperty: () => true,
        })

        window.ethereum = createStandardProvider(proxiedInpageProvider)

        if (typeof window.web3 !== 'undefined') {
          throw new Error(`ezPay detected another web3.
             ezPay will not work reliably with another web3 extension.
             This usually happens if you have two ezPays installed,
             or ezPay and another web3 extension. Please remove one
             and try again.`)
        }

        const web3 = new Web3(proxiedInpageProvider)
        web3.setProvider = function () {
          logger.info('ezPay - overrode web3.setProvider')
        }
        logger.info('ezPay - injected web3')

        setupDappAutoReload(web3, inpageProvider.publicConfigStore)

        // set web3 defaultAccount
        inpageProvider.publicConfigStore.subscribe(function (state) {
          web3.eth.defaultAccount = state.selectedAddress
        })

        inpageProvider.publicConfigStore.subscribe(function (state) {
          if (state.onboardingcomplete) {
            window.postMessage('onboardingcomplete', '*')
          }
        })
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

    // setAddressWeb3(address) {
    //     web3.eth.defaultAccount = address;
    // },

    // setProviderWeb3(endPoint) {
    //     web3.setProvider(new web3.providers.HttpProvider(endPoint));
    // },

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

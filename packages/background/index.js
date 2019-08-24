import Logger from '@ezpay/lib/logger';
import MessageDuplex from '@ezpay/lib/MessageDuplex';
import WalletService from './services/WalletService';
import NodeService from './services/NodeService';
import StorageService from './services/StorageService';
import Utils from '@ezpay/lib/utils';
import TronWeb from 'tronweb';
import transactionBuilder from '@ezpay/lib/transactionBuilder';

import { BackgroundAPI } from '@ezpay/lib/api';
import { version } from './package.json';
import { CONFIRMATION_TYPE } from '@ezpay/lib/constants';

const ComposableObservableStore = require('./lib/ComposableObservableStore')
const NetworkController = require('./controllers/network');
const TransactionController = require('./controllers/transactions');
const extension = require('extensionizer');
const {setupMultiplex} = require('./lib/stream-utils.js');
const pump = require('pump');
const createDnodeRemoteGetter = require('./lib/createDnodeRemoteGetter');
const pify = require('pify');
const Dnode = require('dnode');
const urlUtil = require('url');
const PortStream = require('extension-port-stream');
const RpcEngine = require('json-rpc-engine');
const createFilterMiddleware = require('eth-json-rpc-filters');
const createSubscriptionManager = require('eth-json-rpc-filters/subscriptionManager');
const createOriginMiddleware = require('./lib/createOriginMiddleware');
const createLoggerMiddleware = require('./lib/createLoggerMiddleware');
const providerAsMiddleware = require('eth-json-rpc-middleware/providerAsMiddleware');
const createEngineStream = require('json-rpc-middleware-stream/engineStream');
const ObservableStore = require('obs-store');
const asStream = require('obs-store/lib/asStream');
const PreferencesController = require('./controllers/preferences');
const AppStateController = require('./controllers/app-state');
const InfuraController = require('./controllers/infura');
const RecentBlocksController = require('./controllers/recent-blocks');
const AccountTracker = require('./lib/account-tracker');
const OnboardingController = require('./controllers/onboarding');
const TrezorKeyring = require('eth-trezor-keyring')
const LedgerBridgeKeyring = require('eth-ledger-bridge-keyring')
const HW_WALLETS_KEYRINGS = [TrezorKeyring.type, LedgerBridgeKeyring.type]
const KeyringController = require('eth-keyring-controller')
const TokenRatesController = require('./controllers/token-rates');
const {Mutex} = require('await-semaphore');
const BalancesController = require('./controllers/computed-balances');
const MessageManager = require('./lib/message-manager')
const PersonalMessageManager = require('./lib/personal-message-manager')
const TypedMessageManager = require('./lib/typed-message-manager')
const ProviderApprovalController = require('./controllers/provider-approval')
const nodeify = require('./lib/nodeify')

const {
  AddressBookController,
  CurrencyRateController,
  ShapeShiftController,
  PhishingController,
} = require('gaba')

const {
    ENVIRONMENT_TYPE_POPUP,
    ENVIRONMENT_TYPE_NOTIFICATION,
    ENVIRONMENT_TYPE_FULLSCREEN,
} = require('./lib/enums')

const metamaskInternalProcessHash = {
    [ENVIRONMENT_TYPE_POPUP]: true,
    [ENVIRONMENT_TYPE_NOTIFICATION]: true,
    [ENVIRONMENT_TYPE_FULLSCREEN]: true,
}

const duplex = new MessageDuplex.Host();
const logger = new Logger('background');

const initState = {
    AppStateController: {},
    CachedBalancesController: {
        cachedBalances: {}
    },
    CurrencyController: {
        conversionDate: 1566547524.878,
        conversionRate: 193.33,
        currentCurrency: "usd",
        nativeCurrency: "ETH",
    },
    InfuraController: {
        infuraNetworkStatus: {
            kovan: "ok",
            mainnet: "ok",
            rinkeby: "ok",
            ropsten: "ok"
        }
    },
    KeyringController: {
        vault: '{"data":"dVdAi3XqcqObmb7i18AY2yCCPQaeyRX4NloGEFWzOmJ9DALVGS/b2Taqvgu2n+09GPt7L1oka77ce04Dxro9Py2E3Yq+SCaeI/IiHkEt9EF21llOXMHTy3lBlBH1Iqe/GJZ0G2RUIr4QqpRslZ+LZat0Y3bbZxUxU/0p8i4d8ZE36Mez1wfEHORJSv3CWc1J2Xg3YkVK9kKBPqeOkDlezbu3hMm1SNOaZOW9qFJYK8d63W13vg==","iv":"KYN+/dN7y9SF+NokZajBxg==","salt":"QppMHgzY1cflMuwCSvlJ1sNDWoZQsNDImi9vq1MnNfs="}'
    },
    NetworkController: {
        network: "1",
        provider: {nickname: "", rpcTarget: "", ticker: "ETH", type: "mainnet"},
        settings: {ticker: "ETH"}
    },
    OnboardingController: {
        seedPhraseBackedUp: true
    },
    PreferencesController: {
        accountTokens: {
            '0xa6c600d08f882392312acb0a2c1455e209bb558a': {
                mainnet: [],
                rinkeby: []
            },
            '0x89abefd605e171cc5b6eb4aa9b9b7b4983f30a87': {
                mainnet: [],
                rinkeby: []
            }
        },
        assetImages: {},
        completedOnboarding: true,
        currentAccountTab: "history",
        currentLocale: "en",
        featureFlags: {privacyMode: true},
        firstTimeFlowType: "create",
        forgottenPassword: false,
        frequentRpcListDetail: [],
        identities: {
            '0xa6c600d08f882392312acb0a2c1455e209bb558a': {
                address: "0xa6c600d08f882392312acb0a2c1455e209bb558a",
                name: "Account 1"
            },
            '0x89abefd605e171cc5b6eb4aa9b9b7b4983f30a87': {
                address: "0x89abefd605e171cc5b6eb4aa9b9b7b4983f30a87",
                name: "Account 2"
            }
        },
        knownMethodData: {},
        lostIdentities: {},
        metaMetricsId: "0xba359264d53d48454f26f2f80d1eea26ca4d95ed166e806093482e743ef4d361",
        metaMetricsSendCount: 0,
        migratedPrivacyMode: false,
        participateInMetaMetrics: true,
        preferences: {
            useNativeCurrencyAsPrimaryCurrency: true
        },
        selectedAddress: "0x89abefd605e171cc5b6eb4aa9b9b7b4983f30a87",
        suggestedTokens: {},
        tokens: [],
        useBlockie: false
    },
    TransactionController: {
        transactions: []
    },
    config: {},
    firstTimeInfo: {
        date: 1566527505376,
        version: "7.0.1"
    }
};

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
        this.setupController();
    },

    setupController() {
        const self = this;

        this.activeControllerConnections = 0

        // observable state store
        this.store = new ComposableObservableStore(initState)

        // lock to ensure only one vault created at once
        this.createVaultMutex = new Mutex()

        this.networkController = new NetworkController(initState.NetworkController);

         // preferences controller
        this.preferencesController = new PreferencesController({
          initState: initState.PreferencesController,
          initLangCode: 'en',
          openPopup: this.newUnapprovedTransaction.bind(this),
          network: this.networkController,
        })

        // app-state controller
        this.appStateController = new AppStateController({
            preferencesStore: this.preferencesController.store,
            onInactiveTimeout: () => this.setLocked(),
        })

        this.currencyRateController = new CurrencyRateController(undefined, initState.CurrencyController)

        // infura controller
        this.infuraController = new InfuraController({
            initState: initState.InfuraController,
        })
        this.infuraController.scheduleInfuraNetworkCheck()

        this.phishingController = new PhishingController()

        this.initializeProvider()
        this.provider = this.networkController.getProviderAndBlockTracker().provider
        this.blockTracker = this.networkController.getProviderAndBlockTracker().blockTracker

        // token exchange rate tracker
        this.tokenRatesController = new TokenRatesController({
          currency: this.currencyRateController,
          preferences: this.preferencesController.store,
        })

        this.recentBlocksController = new RecentBlocksController({
          blockTracker: this.blockTracker,
          provider: this.provider,
          networkController: this.networkController,
        })

        // account tracker watches balances, nonces, and any code at their address.
        this.accountTracker = new AccountTracker({
          provider: this.provider,
          blockTracker: this.blockTracker,
          network: this.networkController,
        })

        // start and stop polling for balances based on activeControllerConnections
        // this.on('controllerConnectionChanged', (activeControllerConnections) => {
        //   if (activeControllerConnections > 0) {
        //     this.accountTracker.start()
        //   } else {
        //     this.accountTracker.stop()
        //   }
        // })

        this.onboardingController = new OnboardingController({
          initState: initState.OnboardingController,
        })

        // ensure accountTracker updates balances after network change
        this.networkController.on('networkDidChange', () => {
          this.accountTracker._updateAccounts()
        })

        // key mgmt
        const additionalKeyrings = [TrezorKeyring, LedgerBridgeKeyring]
        this.keyringController = new KeyringController({
          keyringTypes: additionalKeyrings,
          initState: initState.KeyringController,
          getNetwork: this.networkController.getNetworkState.bind(this.networkController),
          encryptor: undefined,
        })

        this.keyringController.memStore.subscribe((s) => this._onKeyringControllerUpdate(s))

        this.txController = new TransactionController({
            initState: initState.TransactionController || initState.TransactionManager,
            networkStore: this.networkController.networkStore,
            preferencesStore: this.preferencesController.store,
            txHistoryLimit: 40,
            getNetwork: this.networkController.getNetworkState.bind(this),
            signTransaction: this.keyringController.signTransaction.bind(this.keyringController),
            provider: this.provider,
            blockTracker: this.blockTracker,
            // getGasPrice: this.getGasPrice.bind(this),
        })
        this.txController.on('newUnapprovedTx', this.showUnapprovedTx.bind(this))

        // computed balances (accounting for pending transactions)
        this.balancesController = new BalancesController({
          accountTracker: this.accountTracker,
          txController: this.txController,
          blockTracker: this.blockTracker,
        })

        this.networkController.on('networkDidChange', () => {
          this.balancesController.updateAllBalances()
          this.setCurrentCurrency(this.currencyRateController.state.currentCurrency, function () {})
        })
        this.balancesController.updateAllBalances()

        this.shapeshiftController = new ShapeShiftController(undefined, initState.ShapeShiftController)

        this.networkController.lookupNetwork()
        this.messageManager = new MessageManager()
        this.personalMessageManager = new PersonalMessageManager()
        this.typedMessageManager = new TypedMessageManager({ networkController: this.networkController })

        this.providerApprovalController = new ProviderApprovalController({
          closePopup: this.closePopup.bind(this),
          keyringController: this.keyringController,
          openPopup: this.openPopup.bind(this),
          preferencesController: this.preferencesController,
        })

        this.memStore = new ComposableObservableStore(null, {
          AppStateController: this.appStateController.store,
          NetworkController: this.networkController.store,
          AccountTracker: this.accountTracker.store,
          TxController: this.txController.memStore,
          BalancesController: this.balancesController.store,
          // CachedBalancesController: this.cachedBalancesController.store,
          TokenRatesController: this.tokenRatesController.store,
          MessageManager: this.messageManager.memStore,
          PersonalMessageManager: this.personalMessageManager.memStore,
          TypesMessageManager: this.typedMessageManager.memStore,
          KeyringController: this.keyringController.memStore,
          PreferencesController: this.preferencesController.store,
          RecentBlocksController: this.recentBlocksController.store,
          AddressBookController: this.addressBookController,
          CurrencyController: this.currencyRateController,
          ShapeshiftController: this.shapeshiftController,
          InfuraController: this.infuraController.store,
          ProviderApprovalController: this.providerApprovalController.store,
          OnboardingController: this.onboardingController.store,
        })

        extension.runtime.onConnect.addListener(connectRemote)
        extension.runtime.onConnectExternal.addListener(connectExternal)

        function connectRemote (remotePort) {
            const processName = remotePort.name
            const isMetaMaskInternalProcess = metamaskInternalProcessHash[processName]

            if (!isMetaMaskInternalProcess) {
              connectExternal(remotePort)
            }
        }

        // communication with page or other extension
        function connectExternal (remotePort) {
            const originDomain = urlUtil.parse(remotePort.sender.url).hostname
            const portStream = new PortStream(remotePort)

            self.setupUntrustedCommunication(portStream, originDomain)
        }
    },

    async _onKeyringControllerUpdate (state) {
        const {isUnlocked, keyrings} = state
        const addresses = keyrings.reduce((acc, {accounts}) => acc.concat(accounts), [])

        if (!addresses.length) {
          return
        }

        // Ensure preferences + identities controller know about all addresses
        this.preferencesController.addAddresses(addresses)
        this.accountTracker.syncWithAddresses(addresses)

        const wasLocked = !isUnlocked
        if (wasLocked) {
          const oldSelectedAddress = this.preferencesController.getSelectedAddress()
          if (!addresses.includes(oldSelectedAddress)) {
            const address = addresses[0]
            await this.preferencesController.setSelectedAddress(address)
          }
        }
    },

    setCurrentCurrency (currencyCode, cb) {
        const { ticker } = this.networkController.getNetworkConfig()
        try {
          const currencyState = {
            nativeCurrency: ticker,
            currentCurrency: currencyCode,
          }
          this.currencyRateController.update(currencyState)
          this.currencyRateController.configure(currencyState)
          cb(null, this.currencyRateController.state)
        } catch (err) {
          cb(err)
        }
    },

    setLocked () {
        return this.keyringController.setLocked()
    },

    setupUntrustedCommunication(connectionStream, originDomain) {
        // setup multiplexing
        const mux = setupMultiplex(connectionStream)
        // connect features
        const publicApi = this.setupPublicApi(mux.createStream('publicApi'), originDomain)
        this.setupProviderConnection(mux.createStream('provider'), originDomain, publicApi)
        this.setupPublicConfig(mux.createStream('publicConfig'), originDomain)
    },

    setupPublicConfig (outStream, originDomain) {
        const configStore = this.createPublicConfigStore({
            // check the providerApprovalController's approvedOrigins
            checkIsEnabled: () => {return true},
        })

        const configStream = asStream(configStore)

        pump(
            configStream,
            outStream,
            (err) => {
                configStore.destroy()
                configStream.destroy()
                if (err) log.error(err)
            }
        )
    },

    createPublicConfigStore ({ checkIsEnabled }) {
        // subset of state for metamask inpage provider
        this.publicConfigStore = new ObservableStore()

        // setup memStore subscription hooks
        // this.on('update', updatePublicConfigStore)

        this.updatePublicConfigStore(this.getState())

        this.publicConfigStore.destroy = () => {
            this.removeEventListener && this.removeEventListener('update', updatePublicConfigStore)
        }

        return this.publicConfigStore
    },

    updatePublicConfigStore(memState) {
        console.log('memState', memState)
        const publicState = this.selectPublicState(memState)
        this.publicConfigStore.putState(publicState)
    },

    selectPublicState({ isUnlocked, selectedAddress, network, completedOnboarding }) {
        const result = {
            isUnlocked,
            selectedAddress,
            isEnabled: true,
            networkVersion: network,
            onboardingcomplete: completedOnboarding,
        }

        return result
    },

    closePopup() {

    },

    openPopup() {

    },

    getState() {
        const vault = this.keyringController.store.getState().vault
        const isInitialized = !!vault

        return {
          ...{ isInitialized },
          ...this.memStore.getFlatState(),
        }
    },

    setupProviderConnection(outStream, origin, publicApi) {
        const getSiteMetadata = publicApi && publicApi.getSiteMetadata
        const engine = this.setupProviderEngine(origin, getSiteMetadata)

        // setup connection
        const providerStream = createEngineStream({ engine })

        pump(
            outStream,
            providerStream,
            outStream,
            (err) => {
            // cleanup filter polyfill middleware
                engine._middleware.forEach((mid) => {
                    if (mid.destroy && typeof mid.destroy === 'function') {
                        mid.destroy()
                    }
                })
                if (err) log.error(err)
            }
        )
    },

    /**
    * A method for creating a provider that is safely restricted for the requesting domain.
    **/
    setupProviderEngine(origin, getSiteMetadata) {
        // setup json rpc engine stack
        const engine = new RpcEngine()
        const provider = this.provider
        const blockTracker = this.blockTracker

        // create filter polyfill middleware
        const filterMiddleware = createFilterMiddleware({ provider, blockTracker })

        // create subscription polyfill middleware
        const subscriptionManager = createSubscriptionManager({ provider, blockTracker })
        subscriptionManager.events.on('notification', (message) => engine.emit('notification', message))

        // metadata
        engine.push(createOriginMiddleware({ origin }))
        engine.push(createLoggerMiddleware({ origin }))
        // filter and subscription polyfills
        engine.push(filterMiddleware)
        engine.push(subscriptionManager.middleware)
        // watch asset
        engine.push(this.preferencesController.requestWatchAsset.bind(this.preferencesController))
        // requestAccounts
        engine.push(this.providerApprovalController.createMiddleware({
            origin,
            getSiteMetadata,
        }))
        // forward to metamask primary provider
        engine.push(providerAsMiddleware(provider))

        return engine
    },

    setupPublicApi (outStream) {
        const dnode = Dnode()
        // connect dnode api to remote connection
        pump(
            outStream,
            dnode,
            outStream,
            (err) => {
                // report any error
                if (err) log.error(err)
            }
        )

        const getRemote = createDnodeRemoteGetter(dnode)

        const publicApi = {
            // wrap with an await remote
            getSiteMetadata: async () => {
                const remote = await getRemote()
                return await pify(remote.getSiteMetadata)()
            },
        }

        return publicApi
    },

    showUnapprovedTx() {
        console.log('showUnapprovedTx')
    },

    async newUnapprovedTransaction (txParams, req) {
        return await this.txController.newUnapprovedTransaction(txParams, req)
    },

    newUnsignedMessage (msgParams, req) {

    },

    newUnsignedTypedMessage (msgParams, req, version) {

    },

    async newUnsignedPersonalMessage (msgParams, req) {

    },

    async getPendingNonce (address) {
        const { nonceDetails, releaseLock} = await this.txController.nonceTracker.getNonceLock(address)
        const pendingNonce = nonceDetails.params.highestSuggested

        releaseLock()
        return pendingNonce
    },

    initializeProvider () {
        const providerOpts = {
            static: {
                eth_syncing: false,
                web3_clientVersion: `MetaMask/v${version}`,
            },
            version,
            // account mgmt
            getAccounts: async ({ origin }) => {
                // Expose no accounts if this origin has not been approved, preventing
                // account-requring RPC methods from completing successfully
                const exposeAccounts = this.providerApprovalController.shouldExposeAccounts(origin)
                if (origin !== 'MetaMask' && !exposeAccounts) { return [] }
                const isUnlocked = this.keyringController.memStore.getState().isUnlocked
                const selectedAddress = this.preferencesController.getSelectedAddress()
                // only show address if account is unlocked
                if (isUnlocked && selectedAddress) {
                    return [selectedAddress]
                } else {
                    return []
                }
              },
              // tx signing
              processTransaction: this.newUnapprovedTransaction.bind(this),
              // msg signing
              processEthSignMessage: this.newUnsignedMessage.bind(this),
              processTypedMessage: this.newUnsignedTypedMessage.bind(this),
              processTypedMessageV3: this.newUnsignedTypedMessage.bind(this),
              processPersonalMessage: this.newUnsignedPersonalMessage.bind(this),
              getPendingNonce: this.getPendingNonce.bind(this),
        }
        const providerProxy = this.networkController.initializeProvider(providerOpts)
        return providerProxy
    },

    bindPopupDuplex() {
        duplex.on('popup:connect', () => (
            this.walletService.startPolling()
        ));
        duplex.on('popup:disconnect', () => (
            this.walletService.stopPolling()
        ));
        duplex.on('getSetting', this.walletService.getSetting);
        duplex.on('requestState', ({ resolve }) => resolve(
            this.walletService.state
        ));
        duplex.on('getNodes', this.nodeService.getNodes);

        // language
        duplex.on('getLanguage', this.walletService.getLanguage);
        duplex.on('setLanguage', this.walletService.setLanguage);
        duplex.on('getSecurityMode', this.walletService.getSecurityMode);
        duplex.on('setSecurityMode', this.walletService.setSecurityMode);
        duplex.on('getLayoutMode', this.walletService.getLayoutMode);
        duplex.on('setLayoutMode', this.walletService.setLayoutMode);

        duplex.on('resetState', this.walletService.resetState);
        duplex.on('setPassword', this.walletService.setPassword);
        duplex.on('unlockWallet', this.walletService.unlockWallet);
        duplex.on('lockWallet', this.walletService.lockWallet);
        duplex.on('getAccounts', this.walletService.getAccounts);
        duplex.on('getTokens', this.walletService.getTokens);

        duplex.on('changeState', this.walletService.changeState);
        duplex.on('resetState', this.walletService.resetState);
        duplex.on('selectToken', this.walletService.selectToken);
        duplex.on('getSelectedToken', this.walletService.getSelectedToken);

        duplex.on('toggleSelectToken', this.walletService.toggleSelectToken);
        duplex.on('addAccount', this.walletService.createAccount);
        duplex.on('selectAccount', this.walletService.selectAccount);
        duplex.on('getSelectedAccount', this.walletService.getSelectedAccount);
        duplex.on('exportAccount', this.walletService.exportAccount);
        duplex.on('deleteAccount', this.walletService.deleteAccount);

        duplex.on('sendToken', this.walletService.sendToken);
        duplex.on('getConfirmations', this.walletService.getConfirmations);
        duplex.on('acceptConfirmation', this.walletService.acceptConfirmation);
        duplex.on('rejectConfirmation', this.walletService.rejectConfirmation);

        duplex.on('setEthereumDappSetting', this.walletService.setEthereumDappSetting);
        duplex.on('setTronDappSetting', this.walletService.setTronDappSetting);

        duplex.on('getEthereumDappSetting', this.walletService.getEthereumDappSetting);
        duplex.on('getTronDappSetting', this.walletService.getTronDappSetting);

        duplex.on('importAccount', this.walletService.importAccount);
    },

    bindWalletEvents() {
        this.walletService.on('newState', appState => (
            BackgroundAPI.setState(appState)
        ));

        this.walletService.on('setAccount', address => BackgroundAPI.setAccount(
            this.walletService.getAccountDetails(address)
        ));

        this.walletService.on('setNode', node => (
            BackgroundAPI.setNode(node)
        ));

        this.walletService.on('setAccounts', accounts => (
            BackgroundAPI.setAccounts(accounts)
        ));

        this.walletService.on('selectToken', token => (
            BackgroundAPI.selectToken(token)
        ));

        this.walletService.on('setSelectedTokens', tokens => (
            BackgroundAPI.setSelectedTokens(tokens)
        ));

        this.walletService.on('setConfirmations', confirmations => (
            BackgroundAPI.setConfirmations(confirmations)
        ));

        this.walletService.on('setSecurityMode', mode => (
            BackgroundAPI.setSecurityMode(mode)
        ));

        this.walletService.on('setLayoutMode', mode => (
            BackgroundAPI.setLayoutMode(mode)
        ));

        this.walletService.on('setEthereumDappSetting', async (ethereumDappSetting) => {
            BackgroundAPI.setEthereumDappSetting(ethereumDappSetting)
            const setSelectedAddress = nodeify(this.preferencesController.setSelectedAddress, this.preferencesController)
            await setSelectedAddress(ethereumDappSetting.address)
            this.updatePublicConfigStore(this.getState())
        });

        this.walletService.on('setTronDappSetting', tronDappSetting => (
            BackgroundAPI.setTronDappSetting(tronDappSetting)
        ));
    },

    bindTabDuplex() {
        duplex.on('tabRequest', async ({ hostname, resolve, data: { action, data, uuid } }) => {
            // Abstract this so we can just do resolve(data) or reject(data)
            // and it will map to { success, data, uuid }

            switch(action) {
                case 'init': {
                    const response = {
                        tron: {
                            address: false,
                            node: {
                                fullNode: false,
                                solidityNode: false,
                                eventServer: false
                            }
                        },
                        eth: {
                            address: false,
                            node: {
                                endPoint: null
                            }
                        }
                    };

                    if(StorageService.ready) {
                        const config = this.walletService.getConfigDapp();

                        response.tron.address = config.tronAccount.address;
                        response.tron.node = {
                            fullNode: config.tronAccount.endPoint,
                            solidityNode: config.tronAccount.endPoint,
                            eventServer: config.tronAccount.endPoint
                        };

                        response.eth.address = config.ethereumAccount.address;
                        response.eth.node.endPoint = config.ethereumAccount.endPoint;
                    }

                    resolve({
                        success: true,
                        data: response,
                        uuid
                    });

                    break;
                } case 'sign': {
                    if(!StorageService.tronDappSetting) {
                        return resolve({
                            success: false,
                            data: 'User has not unlocked wallet',
                            uuid
                        });
                    }

                    try {
                        const {
                            transaction,
                            input
                        } = data;

                        const {
                            tronDappSetting
                        } = StorageService;

                        const account = this.walletService.getAccount(tronDappSetting);
                        const tronWeb = account.tronWeb;

                        if(typeof input === 'string') {
                            const signedTransaction = await account.sign(input);

                            return this.walletService.queueConfirmation({
                                type: CONFIRMATION_TYPE.STRING,
                                hostname,
                                signedTransaction,
                                input
                            }, uuid, resolve);
                        }

                        const contractType = transaction.raw_data.contract[ 0 ].type;
                        const contractAddress = TronWeb.address.fromHex(input.contract_address);
                        const {
                            mapped,
                            error
                        } = await transactionBuilder(tronWeb, contractType, input); // NodeService.getCurrentNode()

                        if(error) {
                            return resolve({
                                success: false,
                                data: 'Invalid transaction provided',
                                uuid
                            });
                        }

                        const signedTransaction = await account.sign(
                            mapped.transaction ||
                            mapped
                        );

                        const whitelist = this.walletService.contractWhitelist[ input.contract_address ];

                        if(contractType === 'TriggerSmartContract') {
                            const value = input.call_value || 0;

                            // ga('send', 'event', {
                            //     eventCategory: 'Smart Contract',
                            //     eventAction: 'Used Smart Contract',
                            //     eventLabel: contractAddress,
                            //     eventValue: value,
                            //     referrer: hostname,
                            //     userId: Utils.hash(input.owner_address)
                            // });
                        }

                        if(contractType === 'TriggerSmartContract' && whitelist) {
                            const expiration = whitelist[ hostname ];

                            if(expiration === -1 || expiration >= Date.now()) {
                                logger.info('Automatically signing transaction', signedTransaction);

                                return resolve({
                                    success: true,
                                    data: signedTransaction,
                                    uuid
                                });
                            }
                        }

                        const authorizeDapps = this.walletService.getAuthorizeDapps();
                        if( contractType === 'TriggerSmartContract' && authorizeDapps.hasOwnProperty(contractAddress)){
                            logger.info('Automatically signing transaction', signedTransaction);

                            return resolve({
                                success: true,
                                data: signedTransaction,
                                uuid
                            });
                        }

                        this.walletService.queueConfirmation({
                            type: CONFIRMATION_TYPE.TRANSACTION,
                            hostname,
                            signedTransaction,
                            contractType,
                            input
                        }, uuid, resolve);
                    } catch(ex) {
                        logger.error('Failed to sign transaction:', ex);

                        return resolve({
                            success: false,
                            data: 'Invalid transaction provided',
                            uuid
                        });
                    }
                    break;
                } default:
                    resolve({
                        success: false,
                        data: 'Unknown method called',
                        uuid
                    });
                    break;
            }
        });
    }
};

background.run();

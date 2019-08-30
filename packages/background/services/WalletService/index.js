import Logger from '@ezpay/lib/logger';
import EventEmitter from 'eventemitter3';
import TronAccount from './TronAccount';
import EthereumAccount from './EthereumAccount';
import BitcoinAccount from './BitcoinAccount';
import axios from 'axios';
import extensionizer from 'extensionizer';
import Utils from '@ezpay/lib/utils';
import StorageService from '../StorageService';
import NodeService from '../NodeService';
import TronWeb from 'tronweb';
import randomUUID from 'uuid/v4';

const ComposableObservableStore = require('../../lib/ComposableObservableStore')
const NetworkController = require('../../controllers/network');
const TransactionController = require('../../controllers/transactions');
const extension = require('extensionizer');
const {setupMultiplex} = require('../../lib/stream-utils.js');
const pump = require('pump');
const createDnodeRemoteGetter = require('../../lib/createDnodeRemoteGetter');
const pify = require('pify');
const Dnode = require('dnode');
const urlUtil = require('url');
const PortStream = require('extension-port-stream');
const RpcEngine = require('json-rpc-engine');
const createFilterMiddleware = require('eth-json-rpc-filters');
const createSubscriptionManager = require('eth-json-rpc-filters/subscriptionManager');
const createOriginMiddleware = require('../../lib/createOriginMiddleware');
const createLoggerMiddleware = require('../../lib/createLoggerMiddleware');
const providerAsMiddleware = require('eth-json-rpc-middleware/providerAsMiddleware');
const createEngineStream = require('json-rpc-middleware-stream/engineStream');
const ObservableStore = require('obs-store');
const asStream = require('obs-store/lib/asStream');
const PreferencesController = require('../../controllers/preferences');
const AppStateController = require('../../controllers/app-state');
const InfuraController = require('../../controllers/infura');
const RecentBlocksController = require('../../controllers/recent-blocks');
const AccountTracker = require('../../lib/account-tracker');
const OnboardingController = require('../../controllers/onboarding');
const TrezorKeyring = require('eth-trezor-keyring')
const LedgerBridgeKeyring = require('eth-ledger-bridge-keyring')
const HW_WALLETS_KEYRINGS = [TrezorKeyring.type, LedgerBridgeKeyring.type]
const KeyringController = require('eth-keyring-controller')
const TokenRatesController = require('../../controllers/token-rates');
const {Mutex} = require('await-semaphore');
const BalancesController = require('../../controllers/computed-balances');
const MessageManager = require('../../lib/message-manager')
const PersonalMessageManager = require('../../lib/personal-message-manager')
const TypedMessageManager = require('../../lib/typed-message-manager')
const ProviderApprovalController = require('../../controllers/provider-approval')
const nodeify = require('../../lib/nodeify')
const debounce = require('debounce')
const {requestPriceCMC, requestPriceCoinGecko} = require('../../lib/util.js');

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
} = require('../../lib/enums')

const metamaskInternalProcessHash = {
    [ENVIRONMENT_TYPE_POPUP]: true,
    [ENVIRONMENT_TYPE_NOTIFICATION]: true,
    [ENVIRONMENT_TYPE_FULLSCREEN]: true,
}

import {
    APP_STATE,
    ACCOUNT_TYPE,
    CHAIN_TYPE,
    CONTRACT_ADDRESS,
    SECURITY_MODE,
    LAYOUT_MODE,
    PASSWORD_EASY_MODE,
    initState,
    ROPSTEN,
    RINKEBY,
    KOVAN,
    MAINNET,
    LOCALHOST,
    GOERLI,
    INFURA_PROVIDER,
    PRICE_LIST
} from '@ezpay/lib/constants';

const INFURA_PROVIDER_TYPES = [ROPSTEN.type, RINKEBY.type, KOVAN.type, MAINNET.type, GOERLI.type]

const logger = new Logger('WalletService');

class Wallet extends EventEmitter {
    constructor() {
        super();

        this.state = APP_STATE.UNINITIALISED;
        this.selectedChain = false;
        this.chains = {};
        this.accounts = {};
        this.tokens = {};
        this.selectedAccount = false;

        this.timer = {};
        this.isPolling = false;
        this.shouldPoll = false;
        this.popup = false;
        this.contractWhitelist = {};
        this.confirmations = [];
        this.tronAccoutDapp = false;
        this.ethereumAccoutDapp = false;

        this.currentNodeWeb3 = false;
        this.currentAccountWeb3 = false;
        this.currentNodeTronWeb = false;
        this.currentAccountTronWeb = false;

        this.activeControllerConnections = 0;
        this.prices = {};

        this._start()
    }

    async _start() {
        await this._checkStorage();

        const securityMode = await StorageService.getSecurityMode()
        if (securityMode === SECURITY_MODE.EASY) {
            if(this.state === APP_STATE.UNINITIALISED) {
                await this.setPassword(PASSWORD_EASY_MODE)
            }

            if (this.state === APP_STATE.PASSWORD_SET) {
                await this.unlockWallet(PASSWORD_EASY_MODE)
            }

            this._setCurrentDappConfig()
        }

        if (this.state === APP_STATE.READY && StorageService.ethereumDappSetting) {
            this.setupProvider();
        }
    }

    setupProvider() {
        const nodes = NodeService.getNodes().nodes;
        const selectedAccount = this.getAccount(StorageService.ethereumDappSetting);
        const defaultNode = selectedAccount.chain

        const isInfura = INFURA_PROVIDER_TYPES.includes(defaultNode.rpc)

        const networkDefault = {}
        if (isInfura) {
            networkDefault.network = INFURA_PROVIDER[defaultNode.rpc].code
            networkDefault.provider = {
                nickname: '',
                rpcTarget: "",
                ticker: selectedAccount.symbol,
                type: INFURA_PROVIDER[defaultNode.rpc].type
            }
            networkDefault.settings = {
                ticker: selectedAccount.symbol
            }
        } else {
            networkDefault.network = '';
            networkDefault.provider = {
                nickname: '',
                rpcTarget: defaultNode.endPoint,
                ticker: selectedAccount.symbol,
                type: 'rpc'
            }
            networkDefault.settings = {
                ticker: selectedAccount.symbol
            }
        }

        initState.PreferencesController.selectedAddress = selectedAccount.address

        this.sendUpdate = debounce(this.privateSendUpdate.bind(this), 200)
        // observable state store
        this.store = new ComposableObservableStore(initState)

        // lock to ensure only one vault created at once
        this.createVaultMutex = new Mutex()

        this.networkController = new NetworkController(networkDefault);

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
        this.on('controllerConnectionChanged', (activeControllerConnections) => {
          if (activeControllerConnections > 0) {
            this.accountTracker.start()
          } else {
            this.accountTracker.stop()
          }
        })

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
            signTransaction: this.signTransaction.bind(this),
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
        this.memStore.subscribe(this.sendUpdate.bind(this))

        extension.runtime.onConnect.addListener(connectRemote)
        extension.runtime.onConnectExternal.addListener(connectExternal)
        const self = this;

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

        this.preferencesController.setSelectedAddress(selectedAccount.address)
    }

    privateSendUpdate() {
      this.emit('update', this.getState())
    }

    signTransaction(tx, address) {
        const account = this.accounts[ StorageService.ethereumDappSetting ]

        if (!account || account.address.toLowerCase() !== address.toLowerCase()) {
            return Promise.reject()
        }

        const privKey = account.getPrivateKey()

        tx.sign(privKey)
        return Promise.resolve(tx)
    }


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
    }

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
    }

    setLocked () {
        return this.keyringController.setLocked()
    }

    setupUntrustedCommunication(connectionStream, originDomain) {
        // setup multiplexing
        const mux = setupMultiplex(connectionStream)

        // connect features
        const publicApi = this.setupPublicApi(mux.createStream('publicApi'), originDomain)
        this.setupProviderConnection(mux.createStream('provider'), originDomain, publicApi)
        this.setupPublicConfig(mux.createStream('publicConfig'), originDomain)
    }

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
    }

    createPublicConfigStore ({ checkIsEnabled }) {
        // subset of state for metamask inpage provider
        const publicConfigStore = new ObservableStore()

        // setup memStore subscription hooks
        this.on('update', (memState) => {
            updatePublicConfigStore(memState)
        })

        updatePublicConfigStore(this.getState())

        publicConfigStore.destroy = () => {
            this.removeEventListener && this.removeEventListener('update', updatePublicConfigStore)
        }

        function updatePublicConfigStore(memState) {
            const publicState = selectPublicState(memState)
            publicConfigStore.putState(publicState)
        }

        function selectPublicState({ isUnlocked, selectedAddress, network, completedOnboarding }) {
            const result = {
                isUnlocked,
                selectedAddress,
                isEnabled: true,
                networkVersion: network,
                onboardingcomplete: completedOnboarding,
            }
            return result
        }

        return publicConfigStore
    }

    closePopup() {

    }

    openPopup() {

    }

    getState() {
        const vault = this.keyringController.store.getState().vault
        const isInitialized = !!vault

        return {
          ...{ isInitialized },
          ...this.memStore.getFlatState(),
        }
    }

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
    }

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
    }

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
    }

    async newUnapprovedTransaction (txParams, req) {
        return await this.txController.newUnapprovedTransaction(txParams, req)
    }

    newUnsignedMessage (msgParams, req) {

    }

    newUnsignedTypedMessage (msgParams, req, version) {

    }

    async newUnsignedPersonalMessage (msgParams, req) {

    }

    async getPendingNonce (address) {
        const { nonceDetails, releaseLock} = await this.txController.nonceTracker.getNonceLock(address)
        const pendingNonce = nonceDetails.params.highestSuggested

        releaseLock()
        return pendingNonce
    }

    initializeProvider () {
        const version = '1.0';

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
                // const exposeAccounts = this.providerApprovalController.shouldExposeAccounts(origin)

                // if (origin !== 'MetaMask' && !exposeAccounts) { return [] }
                // const isUnlocked = await this.keyringController.memStore.getState().isUnlocked
                const selectedAddress = await this.preferencesController.getSelectedAddress()
                return [selectedAddress]
                // only show address if account is unlocked
                // console.log('selectedAccount', selectedAccount)
                // if (isUnlocked && selectedAddress) {
                //     return [selectedAddress]
                // } else {
                //     return []
                // }
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
    }

    async unlockWallet(password) {
        if(this.state !== APP_STATE.PASSWORD_SET) {
            logger.error('Attempted to unlock wallet whilst not in PASSWORD_SET state');
            return Promise.reject('ERRORS.NOT_LOCKED');
        }

        if(StorageService.needsMigrating) {
            const success = this.migrate(password);

            if(!success)
                return Promise.reject('ERRORS.INVALID_PASSWORD');

            return;
        }

        const unlockFailed = await StorageService.unlock(password);
        if(unlockFailed) {
            logger.error(`Failed to unlock wallet: ${ unlockFailed }`);
            return Promise.reject(unlockFailed);
        }

        if(!StorageService.hasAccounts) {
            await this._createDefaultAccount()
            logger.info('Wallet does not have any accounts');
            return this._setState(APP_STATE.READY);
        }

        this._loadAccounts();
        await this._saveTokens();
        this._loadData();
        this._setState(APP_STATE.READY);
        this.emit('setAccount', this.selectedAccount);
        await this._setCurrentDappConfig()

        if (this.state === APP_STATE.READY && StorageService.ethereumDappSetting) {
            this.setupProvider();
        }
    }

    async _checkStorage() {
        if(await StorageService.dataExists() || StorageService.needsMigrating)
            this._setState(APP_STATE.PASSWORD_SET); // initstatus APP_STATE.PASSWORD_SET
    }

    _saveTokens() {
        const tokensConfig = NodeService.getTokens();
        const tokensStorage = StorageService.getTokens();

        Object.entries(tokensConfig).forEach(([ tokenId, token ]) => {
            if (!tokensStorage[tokenId]) {
                StorageService.saveToken(tokenId, token)
            }
        })
    }

    _loadData() {
        const tokens = StorageService.getTokens();
        this.selectAccount(StorageService.selectedAccount);

        Object.entries(tokens).forEach(([ tokenId, token ]) => {
            this.tokens[tokenId] = token
        })

    }

    _setCurrentDappConfig() {
        const accounts = this.accounts;
        if (this.tronAccoutDapp && !accounts[ StorageService.tronDappSetting ]) {
            this.setTronDappSetting(this.tronAccoutDapp);
        }

        if (this.ethereumAccoutDapp && !accounts[StorageService.ethereumDappSetting]) {
            this.setEthereumDappSetting(this.ethereumAccoutDapp);
        }
    }

    async updatePrice() {
        for (let item of PRICE_LIST) {
            let res = await requestPriceCoinGecko(item.name)
            if (!res) {
              return
            }

            this.prices[item.symbol] = {
                value: res[0].current_price || 0,
                symbol: item.symbol
            }
        }

        this.emit('setPrices', this.prices)
    }

    startPolling() {
        this.updatePrice()

        if(this.isPolling && this.shouldPoll)
            return;

        if(this.isPolling && !this.shouldPoll)
            return this.shouldPoll = true;

        logger.info('Started polling');

        this.shouldPoll = true;
        this._pollAccounts();
    }

    stopPolling() {
        this.shouldPoll = false;
    }

    async _pollAccounts() {
        clearTimeout(this.timer);

        if(!this.shouldPoll) {
            logger.info('Stopped polling');
            return this.isPolling = false;
        }

        if(this.isPolling)
            return;

        this.isPolling = true;
        const nodes = NodeService.getNodes().nodes;
        const accounts = Object.values(this.accounts);

        if(accounts.length > 0) {
            for (const account of accounts) {
                let node = nodes[account.chain]

                if (account.id === this.selectedAccount) {
                    Promise.all([account.update()]).then(() => {
                        if (account.id === this.selectedAccount) {
                            this.emit('setAccount', this.selectedAccount);
                        }
                    }).catch(e => {
                        console.log(e);
                    });
                } else {
                    await account.update();
                    //continue;
                }
            }
            this.emit('setAccounts', this.getAccounts());
        }
        this.isPolling = false;
        this.timer = setTimeout(() => {
            this._pollAccounts();
        }, 8000);
    }

    _loadAccounts() {
        const accounts = StorageService.getAccounts();
        const nodes = NodeService.getNodes().nodes;
        const tokens = NodeService.getTokens();

        Object.entries(accounts).forEach(([ id, account ]) => {
            let token = tokens[ account.token ]
            let node = nodes[ token.node ]
            let accountObj

            if (node) {
                if (node.type === CHAIN_TYPE.TRON || node.type === CHAIN_TYPE.TRON_SHASTA) {
                    accountObj = new TronAccount(
                        account.id,
                        token.node,
                        account.token,
                        account.type,
                        account.mnemonic || account.privateKey,
                        account.name,
                        account.symbol,
                        account.decimal,
                        account.logo,
                        account.accountIndex
                    );

                    accountObj.loadCache();
                    accountObj.update();

                    if (node.type === CHAIN_TYPE.TRON && !this.tronAccoutDapp) {
                        this.tronAccoutDapp = account.id;
                    }
                } else if (node.type === CHAIN_TYPE.NTY || node.type === CHAIN_TYPE.ETH || node.type === CHAIN_TYPE.ETH_RINKEBY) {
                    accountObj = new EthereumAccount(
                        account.id,
                        token.node,
                        account.token,
                        account.type,
                        account.mnemonic || account.privateKey,
                        account.name,
                        account.symbol,
                        account.decimal,
                        account.logo,
                        account.accountIndex
                    );

                    accountObj.loadCache();
                    accountObj.update();

                    if (node.type === CHAIN_TYPE.ETH && !this.ethereumAccoutDapp) {
                        this.ethereumAccoutDapp = account.id;
                    }
                } else if (node.type === CHAIN_TYPE.BTC) {
                    accountObj = new BitcoinAccount(
                        account.id,
                        token.node,
                        account.token,
                        account.type,
                        account.mnemonic || account.privateKey,
                        account.name,
                        account.symbol,
                        account.decimal,
                        account.logo,
                        account.typeCoinInfo,
                        account.accountIndex
                    );
                }

                this.accounts[ id ] = accountObj;
            }
        });
    }

    setLanguage(language) {
        StorageService.setLanguage(language);
        this.emit('setLanguage', language);
    }

    setSecurityMode(mode) {
        StorageService.setSecurityMode(mode);

        if (mode === SECURITY_MODE.EASY) {
            this.setPassword(PASSWORD_EASY_MODE);
            this.emit('setSecurityMode', mode);
            return;
        } else if (mode === SECURITY_MODE.SECURE) {
            this._setState(APP_STATE.UNINITIALISED);
            this.emit('setSecurityMode', mode);
            return;
        }

    }

    async getSecurityMode() {
        return await StorageService.getSecurityMode();
    }

    setLayoutMode(mode) {
        StorageService.setLayoutMode(mode);
        this.emit('setLayoutMode', mode);
    }

    async getLayoutMode() {
        return await StorageService.getLayoutMode();
    }

    getSetting() {
        return StorageService.getSetting();
    }

    getLanguage() {
        return StorageService.language;
    }

    async resetState() {
        logger.info('Resetting app state');

        if(!await StorageService.dataExists())
            return this._setState(APP_STATE.UNINITIALISED);

        if(!StorageService.hasAccounts && !StorageService.ready)
            return this._setState(APP_STATE.PASSWORD_SET);

        if(!StorageService.hasAccounts && StorageService.ready)
            return this._setState(APP_STATE.UNLOCKED);

        if(StorageService.needsMigrating)
            return this._setState(APP_STATE.MIGRATING);

        if(this.state === APP_STATE.REQUESTING_CONFIRMATION && this.confirmations.length)
            return;

        this._setState(APP_STATE.READY);
    }

    _setState(appState) {
        if(this.state === appState)
            return;

        logger.info(`Setting app state to ${ appState }`);

        this.state = appState;
        this.emit('newState', appState);

        return appState;
    }

    setPassword(password) {
        // if(this.state !== APP_STATE.UNINITIALISED)
        //     return Promise.reject('ERRORS.ALREADY_INITIALISED');

        StorageService.authenticate(password);
        StorageService.save();

        logger.info('User has set a password');
        this._setState(APP_STATE.READY);

        if(!StorageService.hasAccounts) {
            logger.info('Wallet does not have any accounts');
            this._createDefaultAccount()
        }
    }

    migrate(password) {
        if(!StorageService.needsMigrating) {
            logger.info('No migration required');
            return false;
        }

        StorageService.authenticate(password);

        const {
            error = false,
            accounts,
            selectedAccount
        } = StorageService.migrate();

        if(error)
            return false;

        localStorage.setItem('EZPAY_WALLET.bak', localStorage.getItem('EZPAY_WALLET'));
        localStorage.removeItem('EZPAY_WALLET');

        // accounts.forEach(account => (
        //     this.importAccount(account)
        // ));

        this.selectAccount(selectedAccount);

        // Force "Reboot" TronLink
        this.state = APP_STATE.PASSWORD_SET;
        StorageService.ready = false;

        this.unlockWallet(StorageService.password);

        return true;
    }

    createAccount(params) {
        const tokens = NodeService.getTokens()
        const token = tokens[ params.tokenId ]

        this._addAccount({
            ...token,
            token: params.tokenId,
            mnemonic: params.mnemonic,
            accountName: params.name
        })
    }

    async _createDefaultAccount() {
        const tokens = NodeService.getTokens()
        const id = 'f0b1e38e-7bee-485e-9d3f-69410bf30686'
        const id1 = 'f0b1e38e-7bee-485e-9d3f-69410bf30683'
        const id2 = 'f0b1e38e-7bee-485e-9d3f-69410bf30687'
        const id3 = 'f0b1e38e-7bee-485e-9d3f-69410bf30685'

        const token = tokens[id]
        const token1 = tokens[id1]
        const token2 = tokens[id2]
        const token3 = tokens[id3]

        await this._addAccount({
            ...token,
            token: id,
            mnemonic: Utils.generateMnemonic(),
            accountName: 'Nexty Account 1'
        })
        await this._addAccount({
            ...token1,
            token: id1,
            mnemonic: Utils.generateMnemonic(),
            accountName: 'Tron Account 1'
        })

        // this._addAccount({
        //     ...token2,
        //     token: id2,
        //     mnemonic: Utils.generateMnemonic(),
        //     accountName: 'Bitcoin Account 1'
        // })

        await this._addAccount({
            ...token3,
            token: id3,
            mnemonic: Utils.generateMnemonic(),
            accountName: 'Ethereum Account 1'
        })

        await this._loadAccounts();
        await this._saveTokens();
        this._loadData();
        this.emit('setAccount', this.selectedAccount);
        this._setCurrentDappConfig();

        if (this.state === APP_STATE.READY && StorageService.ethereumDappSetting) {
            this.setupProvider();
        }
    }

    async _addAccount(params) {
        const nodes = NodeService.getNodes().nodes;
        const node = nodes[params.node]
        params.type = ACCOUNT_TYPE.MNEMONIC;

        if (node.type === CHAIN_TYPE.TRON || node.type === CHAIN_TYPE.TRON_SHASTA) {
            this.addTronAccount(params)
        } else if (node.type === CHAIN_TYPE.NTY || node.type === CHAIN_TYPE.ETH || node.type === CHAIN_TYPE.ETH_RINKEBY) {
            this.addEthereumAccount(params)
        } else if (node.type === CHAIN_TYPE.BTC) {
            this.addBitcoinAccount(params)
        }
    }

    getAccount(id) {
        if (!id) {
            return
        }

        const nodes = NodeService.getNodes().nodes;
        const tokens = NodeService.getTokens();
        const account = this.accounts[ id ];
        const token = tokens[ account.token ]
        account.chain = nodes[ token.node ];

        return account;
    }

    async addTronAccount(params) {
        logger.info(`Adding Tron account '${ params.accountName }' from popup`);

        const account = new TronAccount(
            randomUUID(),
            params.node,
            params.token,
            params.type,
            params.mnemonic,
            params.accountName,
            params.symbol,
            params.decimal,
            params.logo
        );
        logger.info(`Add account '${ account }'`);

        const {
            id
        } = account;

        this.accounts[ id ] = account;
        StorageService.saveAccount(account);

        this.emit('setAccounts', this.getAccounts());
        return true;
    }

    async addEthereumAccount(params) {
        logger.info(`Adding Ethereum account '${ params.accountName }' from popup`);

        const account = new EthereumAccount(
            randomUUID(),
            params.node,
            params.token,
            params.type,
            params.mnemonic,
            params.accountName,
            params.symbol,
            params.decimal,
            params.logo
        );
        logger.info(`Add account '${ account }'`);

        const {
            id
        } = account;

        this.accounts[ id ] = account;
        StorageService.saveAccount(account);

        this.emit('setAccounts', this.getAccounts());
        return true;
    }

    async addBitcoinAccount(params) {
        logger.info(`Adding Bitcoin account '${ params.accountName }' from popup`);

        const account = new BitcoinAccount(
            randomUUID(),
            params.node,
            params.token,
            params.type,
            params.mnemonic,
            params.accountName,
            params.symbol,
            params.decimal,
            params.logo,
            params.typeCoinInfo
        );
        logger.info(`Add account '${ account }'`);

        const {
            id
        } = account;

        this.accounts[ id ] = account;
        StorageService.saveAccount(account);

        this.emit('setAccounts', this.getAccounts());
        return true;
    }

    getTokens() {
        return this.tokens
    }

    getAccounts() {
        const nodes = NodeService.getNodes().nodes;
        const tokens = NodeService.getTokens()

        const accounts = Object.entries(this.accounts).reduce((accounts, [ id, account ]) => {
            let token = tokens[account.token]
            token.id = account.token

            accounts[ id ] = {
                id: id,
                address: account.address,
                name: account.name,
                logo: account.logo,
                decimal: account.decimal,
                symbol: account.symbol,
                chain: nodes[account.chain],
                token: token,
                balance: account.balance || 0,
                // energyUsed: account.energyUsed,
                // totalEnergyWeight: account.totalEnergyWeight,
                // TotalEnergyLimit: account.TotalEnergyLimit,
                // energy: account.energy,
                // netUsed: account.netUsed,
                // netLimit: account.netLimit,
                // tokenCount: Object.keys(account.tokens.basic).length + Object.keys(account.tokens.smart).length,
                // asset: account.asset
            };

            return accounts;
        }, {});

        this.emit('setAccounts', accounts);
        return accounts;
    }

    changeState(appState) {
        const stateAry = [
            APP_STATE.PASSWORD_SET,
            APP_STATE.RESTORING,
            APP_STATE.CREATING_TOKEN,
            APP_STATE.RECEIVE,
            APP_STATE.SEND,
            APP_STATE.TRANSACTIONS,
            APP_STATE.SETTING,
            APP_STATE.ADD_TRC20_TOKEN,
            APP_STATE.READY,
            APP_STATE.TRONBANK,
            APP_STATE.TRONBANK_RECORD,
            APP_STATE.TRONBANK_DETAIL,
            APP_STATE.TRONBANK_HELP,
            APP_STATE.USDT_INCOME_RECORD,
            APP_STATE.USDT_ACTIVITY_DETAIL,
            APP_STATE.DAPP_LIST,
            APP_STATE.ASSET_MANAGE,
            APP_STATE.TRANSACTION_DETAIL,
            APP_STATE.DAPP_WHITELIST,
            APP_STATE.ACCOUNTS,
            APP_STATE.CREATING_ACCOUNT,
            APP_STATE.ACCOUNT_DETAIL,
            APP_STATE.ACCOUNTS_DAPP,
            APP_STATE.HISTORY
        ];
        if(!stateAry.includes(appState))
            return logger.error(`Attempted to change app state to ${ appState }. Only 'restoring' and 'creating' is permitted`);

        this._setState(appState);
    }

    selectToken(tokenId) {
        const token = this.tokens[ tokenId ]
        token.id = tokenId

        StorageService.setSelectedToken(token)
        this.emit('selectToken', token)
    }

    getSelectedToken() {
        return StorageService.getSelectedToken();
    }

    async toggleSelectToken(tokenId) {
        const token = this.tokens[tokenId]
        token.isShow = !token.isShow
        this.tokens[tokenId] = token

        this.emit('setSelectedTokens', this.tokens)
        StorageService.saveToken(tokenId, token)
    }

    selectAccount(id) {
        StorageService.selectAccount(id);
        // NodeService.setAddress();
        this.selectedAccount = id;
        this.emit('setAccount', id);
    }

    async getHistory(accountId) {
        const id = accountId || this.selectedAccount.id;
        this.emit('setHistory', 'loading');
        const account = this.getAccount(id);

        if (account.chain.txUlr) {
            const histories = await account.getHistory(account.chain.txUlr);
            this.emit('setHistory', histories);
        } else {
            this.emit('setHistory', 'nodata');
        }
    }

    getTronDappSetting() {
        return StorageService.tronDappSetting;
    }

    getEthereumDappSetting() {
        return StorageService.ethereumDappSetting;
    }

    async setTronDappSetting(id) {
        const account = this.getAccount(id);

        if (!account) {
            return
        }

        await StorageService.setTronDappSetting(account.id);
        this.tronAccoutDapp = account.id;

        this.emit('setTronDappSetting', account);
    }

    async setEthereumDappSetting(id) {
        const account = this.getAccount(id);

        if (!account) {
            return
        }

        await StorageService.setEthereumDappSetting(account.id);
        this.ethereumAccoutDapp = account.id;

        this.preferencesController.setSelectedAddress(account.address)
        this.setProviderType(account)

        this.emit('setEthereumDappSetting', account);
    }

    setProviderType(account) {
        const node = account.chain;
        const isInfura = INFURA_PROVIDER_TYPES.includes(node.rpc)

        if (isInfura) {
            this.networkController.setProviderType(node.rpc, null, null, null)
        } else {
            this.setCustomRpc(node.endPoint, null, account.symbol, null)
        }
    }

    async setCustomRpc (rpcTarget, chainId, ticker, nickname = '', rpcPrefs = {}) {
        const frequentRpcListDetail = this.preferencesController.getFrequentRpcListDetail()
        const rpcSettings = frequentRpcListDetail.find((rpc) => rpcTarget === rpc.rpcUrl)

        if (rpcSettings) {
            this.networkController.setRpcTarget(rpcSettings.rpcUrl, rpcSettings.chainId, rpcSettings.ticker, rpcSettings.nickname, rpcPrefs)
        } else {
            this.networkController.setRpcTarget(rpcTarget, chainId, ticker, nickname, rpcPrefs)
            await this.preferencesController.addToFrequentRpcList(rpcTarget, chainId, ticker, nickname, rpcPrefs)
        }
        return rpcTarget
    }

    getAccountDetails(id) {
        if(!id || !this.accounts[ id ]) {
            return {
                id: id,
                tokens: {
                },
                type: false,
                name: false,
                address: false,
                balance: 0,
                transactions: {
                    cached: [],
                    uncached: 0
                }
            };
        }

        const account = this.accounts[ id ].getDetails();
        const nodes = NodeService.getNodes().nodes;
        const tokens = NodeService.getTokens();
        const token = tokens[ account.token ];
        account.chain = nodes[ token.node ];

        return account;
    }

    getSelectedAccount() {
        if(!this.selectedAccount)
            return false;

        return this.getAccountDetails(this.selectedAccount);
    }

    exportAccount() {
        const {
            mnemonic,
            privateKey
        } = this.accounts[ this.selectedAccount ];

        return {
            mnemonic: mnemonic || false,
            privateKey
        };
    }

    deleteAccount() {
        delete this.accounts[ this.selectedAccount ];
        StorageService.deleteAccount(this.selectedAccount);
        this.selectedAccount = null;

        this.emit('setAccounts', this.getAccounts());
    }

    async sendToken({ recipient, amount, gasLimit, gasPrice }) {
        await this.accounts[ this.selectedAccount ].sendToken({
            recipient,
            amount,
            gasLimit,
            gasPrice
        });
        this.refresh();
    }

    async refresh() {
        let res;
        const accounts = Object.values(this.accounts);
        for(const account of accounts) {
            if(account.id === this.selectedAccount) {
                const r = await account.update().catch(e => false);
                if(r) {
                    res = true;
                    this.emit('setAccount', this.selectedAccount);
                } else {
                    res = false;
                }
            }else{
                continue;
                //await account.update(basicPrice,smartPrice);
            }
        }
        this.emit('setAccounts', this.getAccounts());
        return res;
    }

    queueConfirmation(confirmation, uuid, callback) {
        this.confirmations.push({
            confirmation,
            callback,
            uuid
        });

        if(this.state === APP_STATE.PASSWORD_SET) {
            this.emit('setConfirmations', this.confirmations);
            this._openPopup();
            return;
        }

        if(this.state !== APP_STATE.REQUESTING_CONFIRMATION)
            this._setState(APP_STATE.REQUESTING_CONFIRMATION);

        logger.info('Added confirmation to queue', confirmation);

        this.emit('setConfirmations', this.confirmations);
        this._openPopup();
    }

    getConfirmations() {
        return this.confirmations;
    }

    async _updateWindow() {
        return new Promise(resolve => {
            if(typeof chrome !== 'undefined') {
                return extensionizer.windows.update(this.popup.id, { focused: true }, window => {
                    resolve(!!window);
                });
            }

            extensionizer.windows.update(this.popup.id, {
                focused: true
            }).then(resolve).catch(() => resolve(false));
        });
    }

    async _openPopup() {
        if(this.popup && this.popup.closed)
            this.popup = false;

        if(this.popup && await this._updateWindow())
            return;

        if(typeof chrome !== 'undefined') {
            return extensionizer.windows.create({
                url: 'packages/popup/build/index.html',
                type: 'popup',
                width: 360,
                height: 600,
                left: 25,
                top: 25
            }, window => this.popup = window);
        }

        this.popup = await extensionizer.windows.create({
            url: 'packages/popup/build/index.html',
            type: 'popup',
            width: 360,
            height: 600,
            left: 25,
            top: 25
        });
    }

    _closePopup() {
        if(this.confirmations.length)
            return;

        if(!this.popup)
            return;

        extensionizer.windows.remove(this.popup.id);
        this.popup = false;
    }

    getAuthorizeDapps() {
        return StorageService.hasOwnProperty('authorizeDapps') ? StorageService.authorizeDapps : {};
    }

    showUnapprovedTx(tx) {
        this.queueConfirmation({
            type: 'ETHEREUM_TX',
            id: tx.id,
            txMeta: tx,
            hostname: tx.origin,
            txParams: tx.txParams,
            contractType: tx.transactionCategory,
            input: null
        }, randomUUID(), null)
    }

    acceptConfirmation(whitelistDuration) {
        if(!this.confirmations.length)
            return Promise.reject('NO_CONFIRMATIONS');

        if(this.isConfirming)
            return Promise.reject('ALREADY_CONFIRMING');

        this.isConfirming = true;

        const {
            confirmation,
            callback,
            uuid
        } = this.confirmations.pop();

        if(whitelistDuration !== false)
            // this.whitelistContract(confirmation, whitelistDuration);

        if (confirmation.type !== 'ETHEREUM_TX') {
            callback({
                success: true,
                data: confirmation.signedTransaction,
                uuid
            });

            this.isConfirming = false;
            if(this.confirmations.length) {
                this.emit('setConfirmations', this.confirmations);
            }
            this._closePopup();
            this.resetState();
        } else {
            this.txController.updateAndApproveTransaction(confirmation.txMeta)
        }

        this.isConfirming = false;
        this._closePopup();
        this.resetState();
    }

    rejectConfirmation() {
        if(this.isConfirming)
            return Promise.reject('ALREADY_CONFIRMING');

        this.isConfirming = true;

        const {
            confirmation,
            callback,
            uuid
        } = this.confirmations.pop();

        if (confirmation.type !== 'ETHEREUM_TX') {
            callback({
                success: false,
                data: 'Confirmation declined by user',
                uuid
            });

            this.isConfirming = false;
            if(this.confirmations.length) {
                this.emit('setConfirmations', this.confirmations);
            }
            this._closePopup();
            this.resetState();
        } else {
            this.txController.cancelTransaction(confirmation.id)
        }

        this.isConfirming = false;
        this._closePopup();
        this.resetState();
    }

    getConfigDapp() {
        const tronAccount = this.getAccount(StorageService.tronDappSetting)

        return {
            tronAccount: {
                address: tronAccount && tronAccount.address,
                endPoint: tronAccount.chain && tronAccount.chain.endPoint
            }
        }
    }

    async importAccount({ privateKey, name }) {
        logger.info(`Importing account '${ name }' from popup`);

        const token = this.getSelectedToken();
        const nodes = NodeService.getNodes().nodes;
        const node = nodes[ token.node ]

        const params = {};
        params.node = token.node;
        params.token = token.id;
        params.type = ACCOUNT_TYPE.PRIVATE_KEY;
        params.mnemonic = privateKey;
        params.accountName = name;
        params.symbol = token.symbol;
        params.decimal = token.decimal;
        params.logo = token.logo;

        if (node.type === CHAIN_TYPE.TRON || node.type === CHAIN_TYPE.TRON_SHASTA) {
            return this.addTronAccount(params)
        } else if (node.type === CHAIN_TYPE.NTY || node.type === CHAIN_TYPE.ETH || node.type === CHAIN_TYPE.ETH_RINKEBY) {
            return this.addEthereumAccount(params)
        } else if (node.type === CHAIN_TYPE.BTC) {
            return this.addBitcoinAccount(params)
        }
    }

    async lockWallet() {
        StorageService.lock();
        this.accounts = {};
        this.selectedAccount = false;
        this._setState(APP_STATE.PASSWORD_SET);
    }
}

export default Wallet;

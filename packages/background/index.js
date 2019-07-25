import Logger from '@ezpay/lib/logger';
import MessageDuplex from '@ezpay/lib/MessageDuplex';
import WalletService from './services/WalletService';
import NodeService from './services/NodeService';
import Utils from '@ezpay/lib/utils';

import { BackgroundAPI } from '@ezpay/lib/api';
import { version } from './package.json';
import { CONFIRMATION_TYPE } from '@ezpay/lib/constants';

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
        duplex.on('resetState', this.walletService.resetState);
        duplex.on('setPassword', this.walletService.setPassword);
        duplex.on('unlockWallet', this.walletService.unlockWallet);
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
    },

    bindTabDuplex() {
        duplex.on('tabRequest', async ({ hostname, resolve, data: { action, data, uuid } }) => {
            // Abstract this so we can just do resolve(data) or reject(data)
            // and it will map to { success, data, uuid }

            switch(action) {
                case 'init': {
                    const response = {
                        address: false,
                        node: {
                            fullNode: false,
                            solidityNode: false,
                            eventServer: false
                        }
                    };

                    if(StorageService.ready) {
                        // const node = NodeService.getCurrentNode();
                        const node = 'https://api.shasta.trongrid.io';

                        response.address = this.walletService.selectedAccount;
                        response.node = {
                            fullNode: node,
                            solidityNode: node,
                            eventServer: node
                        };
                    }

                    resolve({
                        success: true,
                        data: response,
                        uuid
                    });

                    break;
                } case 'sign': {
                    if(!this.walletService.selectedAccount) {
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
                            selectedAccount
                        } = this.walletService;

                        const tronWeb = NodeService.tronWeb;
                        const account = this.walletService.getAccount(selectedAccount);

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

                            ga('send', 'event', {
                                eventCategory: 'Smart Contract',
                                eventAction: 'Used Smart Contract',
                                eventLabel: contractAddress,
                                eventValue: value,
                                referrer: hostname,
                                userId: Utils.hash(input.owner_address)
                            });
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

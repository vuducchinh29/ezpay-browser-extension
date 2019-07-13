import StorageService from '../StorageService';
import randomUUID from 'uuid/v4';
import TronWeb from 'tronweb';
import Logger from '@ezpay/lib/logger';

import { BigNumber } from 'bignumber.js';

const logger = new Logger('NodeService');

const NodeService = {
    _nodes: {
        'f0b1e38e-7bee-485e-9d3f-69410bf30681': {
            type: 'TRON',
            name: 'Mainnet',
            symbol: 'TRX',
            decimal: 6,
            logo: '',
            endPoint: 'https://api.trongrid.io',
            default: true // false
        },
        '0f22e40f-a004-4c5a-99ef-004c8e6769bf': {
            type: 'TRON',
            name: 'Shasta Testnet',
            symbol: 'STRX',
            decimal: 6,
            logo: '',
            endPoint: 'https://api.shasta.trongrid.io',
            default: true
        },
        '6739be94-ee43-46af-9a62-690cf0947280': {
            type: 'ETH',
            name: 'Ethereum',
            symbol: 'ETH',
            decimal: 18,
            logo: '',
            endPoint: 'https://mainnet.infura.io/v3/9a150d3a322645268224160ebf5b8599',
            default: true
        },
        '6739be94-ee43-46af-9a62-690cf0947281': {
            type: 'ETH',
            name: 'Rinkeby',
            symbol: 'RETH',
            decimal: 18,
            logo: '',
            endPoint: 'https://rinkeby.infura.io/v3/9a150d3a322645268224160ebf5b8599',
            default: true
        }
    },

    _selectedNode: 'f0b1e38e-7bee-485e-9d3f-69410bf30681',

    _read() {
        logger.info('Reading nodes from storage');

        const {
            nodeList = {},
            selectedNode = false
        } = StorageService.nodes;

        this._nodes = {
            ...this._nodes,
            ...nodeList
        };

        if(selectedNode)
            this._selectedNode = selectedNode;
    },

    init() {
        this._read();
        this._updateTronWeb();
    },

    _updateTronWeb(skipAddress = false) {
        const {
            fullNode,
            solidityNode,
            eventServer
        } = this.getCurrentNode();

        this.tronWeb = new TronWeb(
            fullNode,
            solidityNode,
            eventServer
        );

        if(!skipAddress)
            this.setAddress();
    },

    setAddress() {
        if(!this.tronWeb)
            this._updateTronWeb();

        if(!StorageService.selectedAccount)
            return this._updateTronWeb(true);

        this.tronWeb.setAddress(
            StorageService.selectedAccount
        );
    },

    save() {
        Object.entries(this._nodes).forEach(([ nodeID, node ]) => (
            StorageService.saveNode(nodeID, node)
        ));

        StorageService.selectNode(this._selectedNode);
        this._updateTronWeb();
    },

    getNodes() {
        return {
            nodes: this._nodes,
            selected: this._selectedNode
        };
    },

    getCurrentNode() {
        return this._nodes[ this._selectedNode ];
    },

    selectNode(nodeID) {
        StorageService.selectNode(nodeID);

        this._selectedNode = nodeID;
        this._updateTronWeb();
    },

    addNode(node) {
        const nodeID = randomUUID();

        this._nodes[ nodeID ] = {
            ...node,
            default: false
        };

        this.save();
        return nodeID;
    },

    async getSmartToken(address) {
        try {
            let balance;
            const contract = await this.tronWeb.contract().at(address);
            if(!contract.name && !contract.symbol && !contract.decimals)
                return false;
            const d = await contract.decimals().call();
            const name = await contract.name().call();
            const symbol = await contract.symbol().call();
            const decimals = typeof d === 'object' && d._decimals ? d : new BigNumber(d).toNumber();
            const number = await contract.balanceOf(address).call();
            if (number.balance) {
                balance = new BigNumber(number.balance).toString();
            } else {
                balance = new BigNumber(number).toString();
            }

            return {
                name: typeof name === 'object' ? name._name: name,
                symbol: typeof symbol === 'object' ? symbol._symbol: symbol,
                decimals: typeof decimals === 'object' ? decimals._decimals: decimals,
                balance
            };
        } catch(ex) {
            logger.error(`Failed to fetch token ${ address }:`, ex);
            return false;
        }
    }
};

export default NodeService;

import randomUUID from 'uuid/v4';

const NodeService = {
    _nodes: {
        'f0b1e38e-7bee-485e-9d3f-69410bf30681': {
            type: 'TRON',
            name: 'Mainnet',
            decimal: 6,
            logo: '',
            apiUrl: '',
            apiKey: '',
            endPoint: 'https://api.trongrid.io',
            default: true // false
        },
        '6739be94-ee43-46af-9a62-690cf0947269': {
            type: 'TRON',
            name: 'Shasta Testnet',
            decimal: 6,
            logo: '',
            apiUrl: '',
            apiKey: '',
            endPoint: 'https://api.shasta.trongrid.io',
            default: true
        },
        '6739be94-ee43-46af-9a62-690cf0947280': {
            type: 'ETH',
            name: 'Ethereum',
            decimal: 18,
            logo: '',
            apiUrl: '',
            apiKey: 'BGEU4V19ZPHVJSHUM3UDFXZ9BSBQM2FM88',
            endPoint: 'https://mainnet.infura.io/v3/9a150d3a322645268224160ebf5b8599',
            default: true
        },
        '6739be94-ee43-46af-9a62-690cf0947281': {
            type: 'ETH_RINKEBY',
            name: 'Rinkeby',
            decimal: 18,
            logo: '',
            apiUrl: '',
            apiKey: 'BGEU4V19ZPHVJSHUM3UDFXZ9BSBQM2FM88',
            endPoint: 'https://rinkeby.infura.io/v3/9a150d3a322645268224160ebf5b8599',
            default: true
        }
    },

    _selectedNode: '6739be94-ee43-46af-9a62-690cf0947269',

    _read() {
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
    },

    getNodes() {
        return {
            nodes: this._nodes,
            selected: this._selectedNode
        };
    },

    addNode(node) {
        const nodeID = randomUUID();

        this._nodes[ nodeID ] = {
            ...node,
            default: false
        };

        return nodeID;
    }
}

export default NodeService;

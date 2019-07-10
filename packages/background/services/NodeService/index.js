import randomUUID from 'uuid/v4';

const NodeService = {
    _nodes: {
        'f0b1e38e-7bee-485e-9d3f-69410bf30681': {
            type: 'TRON',
            name: 'Mainnet',
            fullNode: 'https://api.trongrid.io',
            solidityNode: 'https://api.trongrid.io',
            eventServer: 'https://api.trongrid.io',
            default: true // false
        },
        '6739be94-ee43-46af-9a62-690cf0947269': {
            type: 'TRON',
            name: 'Shasta Testnet',
            fullNode: 'https://api.shasta.trongrid.io',
            solidityNode: 'https://api.shasta.trongrid.io',
            eventServer: 'https://api.shasta.trongrid.io',
            default: true
        }
    },

    _selectedNode: 'f0b1e38e-7bee-485e-9d3f-69410bf30681',

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

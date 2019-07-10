import Utils from '@tronlink/lib/utils';

class Chain {
    constructor(type, endPoint, decimal, apiUrl, apiKey) {
        this.type = type;
        this.endpoint = endPoint;
        this.decimal = decimal;
        this.apiUrl = apiUrl;
        this.apiKey = apiKey;

        this.accounts = {};
        this.selectedAccount = false;
    }
}

export default Chain

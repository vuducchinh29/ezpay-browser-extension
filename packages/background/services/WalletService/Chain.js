import Utils from '@ezpay/lib/utils';

class Chain {
    constructor(params) {
        this.type = params.type;
        this.endPoint = params.endPoint;
        this.decimal = params.decimal;
        this.ezWeb = params.ezWeb;

        this.accounts = {};
        this.selectedAccount = false;
    }
}

export default Chain;

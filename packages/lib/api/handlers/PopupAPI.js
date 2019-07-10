import { setRecommendDappList } from '@ezpay/popup/src/reducers/appReducer';

export default {
    init(duplex) {
        this.duplex = duplex;
    },

    //Data refresh
    refresh() {
        return this.duplex.send('refresh');
    },
    // Data requesting

    requestState() {
        return this.duplex.send('requestState');
    },

    getNodes() {
        return this.duplex.send('getNodes');
    },

    changeState(appState) {
        return this.duplex.send('changeState', appState, false);
    },

    resetState() {
        return this.duplex.send('resetState', {}, false);
    },

    getPrices() {
        return this.duplex.send('getPrices');
    },

    getConfirmations() {
        return this.duplex.send('getConfirmations');
    },

    // Confirmation actions

    acceptConfirmation(whitelistDuration) {
        return this.duplex.send('acceptConfirmation', whitelistDuration, false);
    },

    rejectConfirmation() {
        return this.duplex.send('rejectConfirmation', {}, false);
    },

    // Account control

    importAccount(privateKey, name) {
        return this.duplex.send('importAccount', { privateKey, name });
    },

    addAccount(mnemonic, name) {
        return this.duplex.send('addAccount', { mnemonic, name });
    },

    selectAccount(address) {
        this.duplex.send('selectAccount', address, false);
    },

    deleteAccount() {
        this.duplex.send('deleteAccount', {}, false);
    },

    getAccounts() {
        return this.duplex.send('getAccounts');
    },

    exportAccount() {
        return this.duplex.send('exportAccount');
    },

    getSelectedAccount() {
        return this.duplex.send('getSelectedAccount');
    },

    getAccountDetails(address) {
        return this.duplex.send('getAccountDetails', address);
    },

    getSetting() {
        return this.duplex.send('getSetting');
    },

    setSetting(setting) {
        this.duplex.send('setSetting', setting, false);
    }
}

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

    resetState(state) {
        return this.duplex.send('resetState', {}, false);
    },

    getPrices() {
        return this.duplex.send('getPrices');
    },

    getConfirmations() {
        return this.duplex.send('getConfirmations');
    },

    // Wallet authentication
    setPassword(password) {
        return this.duplex.send('setPassword', password);
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

    addAccount(params) {
        return this.duplex.send('addAccount', params, false);
    },

    selectAccount(address) {
        this.duplex.send('selectAccount', address, false);
    },

    selectToken(tokenId) {
        this.duplex.send('selectToken', tokenId, false);
    },

    deleteAccount() {
        this.duplex.send('deleteAccount', {}, false);
    },

    getAccounts() {
        return this.duplex.send('getAccounts');
    },

    getTokens() {
        return this.duplex.send('getTokens');
    },

    exportAccount() {
        return this.duplex.send('exportAccount');
    },

    getSelectedAccount() {
        return this.duplex.send('getSelectedAccount');
    },

    getSelectedToken() {
        return this.duplex.send('getSelectedToken');
    },

    getAccountDetails(address) {
        return this.duplex.send('getAccountDetails', address);
    },

    getSetting() {
        return this.duplex.send('getSetting');
    },

    setSetting(setting) {
        this.duplex.send('setSetting', setting, false);
    },

    getLanguage() {
        return this.duplex.send('getLanguage');
    },

    setLanguage(language) {
        this.duplex.send('setLanguage', language, false);
    },

    getSecurityMode() {
        return this.duplex.send('getSecurityMode');
    },

    setSecurityMode(mode) {
        this.duplex.send('setSecurityMode', mode, false);
    },

    getLayoutMode() {
        return this.duplex.send('getLayoutMode');
    },

    setLayoutMode(mode) {
        this.duplex.send('setLayoutMode', mode, false);
    },

    unlockWallet(password) {
        return this.duplex.send('unlockWallet', password);
    },

    toggleSelectToken(tokenId) {
        return this.duplex.send('toggleSelectToken', tokenId);
    },

    sendToken(params) {
        return this.duplex.send('sendToken', params);
    }
}

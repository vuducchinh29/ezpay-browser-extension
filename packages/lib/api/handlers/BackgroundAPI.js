export default {
    currentAccount: false,

    init(duplex) {
        this.duplex = duplex;
    },

    setState(appState) {
        this.duplex.send('popup', 'setState', appState, false);
    },

    setAccount(account) {
        this.duplex.send('popup', 'setAccount', account, false);
    },

    setNode(node) {

    },

    setAccounts(accounts) {
        this.duplex.send('popup', 'setAccounts', accounts, false);
    },

    setPriceList(priceList) {
        this.duplex.send('popup', 'setPriceList', priceList, false);
    },

    setConfirmations(confirmationList) {
        this.duplex.send('popup', 'setConfirmations', confirmationList, false);
    },

    setCurrency(currency) {
        this.duplex.send('popup', 'setCurrency', currency, false);
    },

    setSelectedToken(token) {
        this.duplex.send('popup', 'setSelectedToken', token, false);
    },

    selectToken(token) {
        this.duplex.send('popup', 'setSelectToken', token, false);
    },

    setLanguage(language) {
        this.duplex.send('popup', 'setLanguage', language, false);
    },

    setSetting(setting) {
        this.duplex.send('popup', 'setSetting', setting, false);
    },
    setSelectedBankRecordId(id) {
        this.duplex.send('popup', 'setSelectedBankRecordId', id, false);
    },

    changeDealCurrencyPage(status) {
        this.duplex.send('popup', 'changeDealCurrencyPage', status, false);
    },

    setAirdropInfo(airdropInfo) {
        this.duplex.send('popup', 'setAirdropInfo', airdropInfo, false);
    },

    setDappList(dappList) {
        this.duplex.send('popup', 'setDappList',dappList ,false);
    },

    setAuthorizeDapps(dappList) {
        this.duplex.send('popup', 'setAuthorizeDapps',dappList ,false);
    },

    setSelectedTokens(tokens) {
        this.duplex.send('popup', 'setSelectedTokens',tokens ,false);
    },

    setSecurityMode(mode) {
        this.duplex.send('popup', 'setSecurityMode', mode ,false);
    },

    setPrices(prices) {
        this.duplex.send('popup', 'setPrices', prices ,false);
    },

    setLayoutMode(mode) {
        this.duplex.send('popup', 'setLayoutMode', mode ,false);
    },

    setTronDappSetting(tronDappSetting) {
        this.duplex.send('popup', 'setTronDappSetting', tronDappSetting.id ,false);

        this.duplex.send('tab', 'tunnel', {
            action: 'setNodeTron',
            data: tronDappSetting.node.endPoint
        }, false);

        this.duplex.send('tab', 'tunnel', {
            action: 'setAccountTron',
            data: tronDappSetting.address
        }, false);
    },

    setEthereumDappSetting(ethereumDappSetting) {
        this.duplex.send('popup', 'setEthereumDappSetting', ethereumDappSetting.id ,false);

        this.duplex.send('tab', 'tunnel', {
            action: 'setNodeEthereum',
            data: ethereumDappSetting.node.endPoint
        }, false);

        this.duplex.send('tab', 'tunnel', {
            action: 'setAccountEthereum',
            data: ethereumDappSetting.address
        }, false);
    }
};

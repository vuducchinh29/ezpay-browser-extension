import {
    createReducer,
    createAction
} from 'redux-starter-kit';

export const setAccount = createAction('setAccount');
export const setToken = createAction('setToken');
export const setAccounts = createAction('setAccounts');
export const setSelectedBankRecordId = createAction('setSelectedBankRecordId');
export const changeDealCurrencyPage = createAction('changeDealCurrencyPage');
export const setAirdropInfo = createAction('setAirdropInfo');

export const accountsReducer = createReducer({
    selected: {
        id: false,
        tokens: {
            basic: {},
            smart: {}
        },
        type: false,
        name: false,
        address: false,
        balance: 0,
        transactions: {
            // cached: [],
            // uncached: 0
        },
        selectedBankRecordId: 0,
        dealCurrencyPage: 0,
        airdropInfo: {},
        hash: ''
    },
    accounts: { },
    selectedToken: { id: '_', name: 'TRX', decimals: 6, amount: 0 }
}, {
    [ setAccount ]: (state, { payload: { transactions, ...account } }) => {
        state.selected = account;
        state.selected.transactions = transactions;
    },
    [ setAccounts ]: (state, { payload }) => {
        state.accounts = payload;
    },
    [ setSelectedBankRecordId ]: (state, { payload }) => {
        state.selected.setSelectedBankRecordId = payload;
    },
    [ changeDealCurrencyPage ]: (state, { payload }) => {
        state.selected.changeDealCurrencyPage = payload;
    },
    [ setAirdropInfo ]: (state, { payload } ) => {
        state.selected.airdropInfo = payload;
    }
});

import {
    createReducer,
    createAction
} from 'redux-starter-kit';

export const setChain = createAction('setChain');
export const setChains = createAction('setChains');

export const accountsReducer = createReducer({
    selected: {
        accounts: {},
        type: false,
        name: false
    },
    chains: { }
}, {
    [ setChain ]: (state, { payload: { ...chain } }) => {
        state.selected = chain;
    },
    [ setChains ]: (state, { payload }) => {
        state.chains = payload;
    }
});

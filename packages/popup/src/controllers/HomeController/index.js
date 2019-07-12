import React from 'react';
import { FormattedMessage, injectIntl } from 'react-intl';
import Header from './Header';

import './style.scss';

class Controller extends React.Component {
    state = {
        subTitle: false,
        callbacks: []
    };

    constructor() {
        super();
    }

    componentDidMount() {

    }

    render() {
        const { currentPage } = this.props;
        const pages = this.pages;

        return (
            <div className='homeContainer'>
                <Header />
                <div className="accounts scroll">
                    <div className='item'>
                        <img src={'https://s2.coinmarketcap.com/static/img/coins/64x64/1.png'} />
                        <div className='content'>
                            <div className={'title'}>{'Ethereum wallet'}</div>
                            <div className='desc'>20 ETH</div>
                        </div>
                    </div>
                    <div className='item'>
                        <img src={'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png'} />
                        <div className='content'>
                            <div className={'title'}>{'Bitcoin wallet'}</div>
                            <div className='desc'>20 BTC</div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default injectIntl(Controller);

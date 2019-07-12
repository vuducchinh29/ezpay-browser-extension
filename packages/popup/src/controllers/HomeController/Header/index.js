import React from 'react';
import { FormattedMessage } from 'react-intl';

import './style.scss';

class Header extends React.Component {
    constructor(props) {
        super(props);

        this.state={
            nodeIndex:0,
            refresh:false
        }
    }

    render() {

        return (
            <div className='header'>
                <div className='titleContainer'>
                    EZpay
                </div>
            </div>
        );
    }
}

export default Header;

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
        const {
            onCancel,
            title
        } = this.props;

        return (
            <div className='header'>
                {onCancel && <div className="back" onClick={ onCancel }></div>}
                <div className='titleContainer'>
                    {title || 'EZpay'}
                </div>
            </div>
        );
    }
}

export default Header;

import React from 'react';
import { FormattedMessage } from 'react-intl';

import './style.scss';

class Header extends React.Component {
    constructor(props) {
        super(props);

        this.state={

        }
    }

    render() {
        const {
            onCancel,
            title
        } = this.props;

        return (
            <div className='footer'>
                <div className='titleContainer'>
                    Footer
                </div>
            </div>
        );
    }
}

export default Header;

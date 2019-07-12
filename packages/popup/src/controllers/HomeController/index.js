import React from 'react';
import { FormattedMessage, injectIntl } from 'react-intl';

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
                <h1>Home Page</h1>
            </div>
        );
    }
}

export default injectIntl(Controller);

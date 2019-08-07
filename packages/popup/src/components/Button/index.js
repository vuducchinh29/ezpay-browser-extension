import React from 'react';
import LoadingIndicator from 'assets/images/loader.svg';
import arrowIcon from 'assets/images/arrow.png';
import arrowRedIcon from 'assets/images/arrow-red.png';

import { BUTTON_TYPE } from '@ezpay/lib/constants';
import { FormattedMessage } from 'react-intl';

import './Button.scss';

const Button = props => {
    const {
        type = BUTTON_TYPE.PRIMARY,
        isLoading = false,
        isValid = true,
        onClick = () => {},
        id,
        className,
        showArrow = false
    } = props;

    const classes = [
        'customButton',
        type
    ];

    if(isValid && !isLoading)
        classes.push('is-valid');
    else classes.push('is-invalid');

    if(isLoading)
        classes.push('is-loading');

    let hashArrow = '';

    if (showArrow) {
        hashArrow = 'hashArrow'
    }

    let icon = arrowIcon;
    if (className === 'secure-light') {
        icon = arrowRedIcon;
    }

    return (
        <button className={ `${classes.join(' ')} ${className}-btn ${hashArrow}` } onClick={ isValid && !isLoading && onClick }>
            { isLoading ?
                <img className='loadingIndicator' src={ LoadingIndicator } alt='Loading indicator' /> :
                <FormattedMessage id={ id } />
            }
            { (showArrow && !isLoading) &&
                <img className='arrow-icon' src={ icon } />
            }
        </button>
    );
};

export default Button;

import React from 'react';
import moment from 'moment';
import { FormattedMessage, injectIntl } from 'react-intl';
import { connect } from 'react-redux';
import Header from '../Layout/Header';
import { PopupAPI } from '@ezpay/lib/api';
import {APP_STATE, VALIDATION_STATE} from '@ezpay/lib/constants';
import { Toast } from 'antd-mobile';
import Input from '@ezpay/popup/src/components/Input';
import Button from '@ezpay/popup/src/components/Button';
import { BigNumber } from 'bignumber.js';
import _ from 'lodash';
import { Accordion, List } from 'antd-mobile';
import NumberFormat from 'react-number-format';

import './style.scss';

class Controller extends React.Component {
    state = {
    };

    constructor() {
        super();
    }

    async componentDidMount() {
        PopupAPI.getHistory(this.props.account.id);
    }

    onRecipientChange(value) {
        this.setState({
            recipient: {
                value: value
            }
        });
    }

    onAmountChange(value) {
        this.setState({
            amount: {
                value: value
            }
        });
    }

    onClickFee(value, fee) {
        this.setState({
            selectedFee: value,
            fee: fee
        })
    }

    onChange = (key) => {
        console.log(key);
    }

    renderLoading() {
        const histories = this.props.histories;
        const modeCssName = this.props.modeCssName;

        if (histories === 'loading') {
            return <div className={`loading ${modeCssName}-loading`}>Loading...</div>
        }

        if (histories === 'nodata' || histories.length === 0) {
            return <div className={`nodata ${modeCssName}-nodata`}>No Data</div>
        }
    }

    render() {
        const { onCancel, account, modeCssName, histories } = this.props;
        const {
            recipient,
            amount,
            success,
            isLoading,
            loading
        } = this.state;

        if (!histories) {
            return (<div className={`container ${modeCssName}`}>
                    <Header onCancel={ onCancel } title={ account.name } modeCssName={modeCssName} />
                        <div className="history scroll">
                            <div className={`loading ${modeCssName}-loading`}>Loading...</div>
                        </div>
                    </div>)
        }

        return (
            <div className={`container ${modeCssName}`}>
                <Header onCancel={ onCancel } title={ account.name } modeCssName={modeCssName} />
                <div className="history scroll">
                    {this.renderLoading()}
                    {(histories !== 'loading' && histories && histories !== 'nodata' && histories.length > 0) && <Accordion className="my-accordion" onChange={this.onChange}>
                        {histories.map((tx) => (
                            <Accordion.Panel accordion={true} header={
                                <div className={`header-item ${modeCssName}-history-title`}>
                                    <div className="img-in-out">
                                        {tx.from.toLowerCase() === account.address.toLowerCase() && <img src={'../src/assets/images/out.png'} />}
                                        {tx.from.toLowerCase() !== account.address.toLowerCase() && <img src={'../src/assets/images/in.png'} />}
                                    </div>
                                    <div>{moment.unix(tx.timeStamp).format('MMMM Do YYYY, hh:mm')}</div>
                                    <div className="value"><NumberFormat value={tx.value} thousandSeparator={true} displayType={'text'}/> {account.symbol}</div>
                                </div>}>
                                <div className={`content ${modeCssName}-content`}>
                                    <List.Item>
                                        <div>From</div>
                                        <div>{tx.from}</div>
                                    </List.Item>
                                    <List.Item>
                                        <div>To</div>
                                        <div>{tx.to}</div>
                                    </List.Item>
                                    <List.Item>
                                        <div>Transaction #</div>
                                        <div>{tx.hash}</div>
                                    </List.Item>
                                    <List.Item>
                                        <div>Transaction time</div>
                                        <div>{moment.unix(tx.timeStamp).format('MMMM Do YYYY, hh:mm')}</div>
                                    </List.Item>
                                    <List.Item>
                                        <div className="view-more">
                                            <a href={`${account.chain.exploreUlr}${tx.hash}`} target="_blank" className="more-text" >MORE DETAIL</a>
                                        </div>
                                    </List.Item>
                                </div>
                            </Accordion.Panel>
                        ))}
                    </Accordion>}
                </div>
            </div>
        );
    }
}

export default connect(state => ({
    histories: state.app.histories,
    account: state.accounts.selected,
    selectedToken: state.app.selectedToken,
}))(Controller);

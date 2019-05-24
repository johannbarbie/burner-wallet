import React from 'react';
import {CopyToClipboard} from "react-copy-to-clipboard";
import i18n from '../i18n';
import RecentTransactions from './RecentTransactions';
// const QRCode = require('qrcode.react');

import {
  Flex,
  Box,
  Input,
  Field,
  Button,
  QR as QRCode
} from 'rimble-ui'

export default class RequestFunds extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      message: "",
      amount: "",
      canRequest: false,
      requested: false
    }
  }

  updateState = (key, value) => {
    this.setState({ [key]: value },()=>{
      this.setState({ canRequest: (this.state.amount > 0) })
    });
  };

  request = () => {
    if(this.state.canRequest){
      this.setState({requested:true})
    }else{
      this.props.changeAlert({type: 'warning', message: 'Please enter a valid amount'})
    }
  };

  render() {
    let { canRequest, message, amount, requested } = this.state;
    let {dollarDisplay,view,buttonStyle,ERC20TOKEN,address, changeView} = this.props
    if(requested){

      let url = window.location.protocol+"//"+window.location.hostname
      if(window.location.port&&window.location.port!==80&&window.location.port!==443){
        url = url+":"+window.location.port
      }
      let qrValue = url+"/"+this.props.address+";"+amount+";"+encodeURI(message).replaceAll("#","%23").replaceAll(";","%3B").replaceAll(":","%3A").replaceAll("/","%2F")

      return (
        <div>
          <CopyToClipboard text={qrValue} onCopy={() => {
            this.props.changeAlert({type: 'success', message: 'Request link copied to clipboard'})
          }}>
          <div style={{width:"100%",textAlign:'center'}}>
            <div style={{fontSize:30,cursor:"pointer",textAlign:"center",width:"100%"}}>
              {dollarDisplay(amount)}
            </div>

            <div style={{cursor:"pointer",textAlign:"center",width:"100%"}}>
              {message}
            </div>

            <Flex flexDirection={'column'} alignItems={'center'} p={3} border={1} borderColor={'grey'} borderRadius={1}>
              <QRCode value={qrValue} size={'100%'} renderAs={'svg'} />
            </Flex>
            <Box mt={3}>
              <Input type='url' readOnly value={qrValue} width={1} />
            </Box>

            {/* <div className="input-group">
              <input type="text" className="form-control" value={qrValue} disabled/>
              <div className="input-group-append">
                <span className="input-group-text"><i className="fas fa-copy"/></span>
              </div>
            </div> */}

            </div>
          </CopyToClipboard>
          <RecentTransactions
            dollarDisplay={dollarDisplay}
            view={view}
            max={5}
            buttonStyle={buttonStyle}
            ERC20TOKEN={ERC20TOKEN}
            transactionsByAddress={ERC20TOKEN?this.props.fullTransactionsByAddress:this.props.transactionsByAddress}
            changeView={changeView}
            address={address}
            block={this.props.block}
            recentTxs={ERC20TOKEN?this.props.fullRecentTxs:this.props.recentTxs}
          />
        </div>
      )
    }else{
      return (
        <div>
          <Field label={i18n.t('request_funds.amount')}>
            <Input
              type="number"
              width={1}
              placeholder="$0.00"
              value={this.state.amount}
              onChange={event => this.updateState('amount', event.target.value)}
            />
          </Field>

          <Field label={i18n.t('request_funds.item_message')}>
            <Input
              type="text"
              width={1}
              placeholder="Hot Dogs"
              value={this.state.message}
              onChange={event => this.updateState('message', event.target.value)}
            />
          </Field>

          <Button
            size={'large'}
            width={1}
            disabled={(canRequest ? false : true)}
            onClick={this.request}
          >
            {i18n.t('request_funds.button')}
          </Button>
        </div>
      )
    }

  }
}

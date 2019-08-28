import React from 'react';
import {CopyToClipboard} from "react-copy-to-clipboard";
import { withTranslation } from 'react-i18next';
import RecentTransactions from './RecentTransactions';
import {
  Flex,
  Box,
  Input,
  Field,
  QR as QRCode
} from 'rimble-ui'
import { PrimaryButton } from "./Buttons";
import { getStoredValue } from "../services/localStorage";

class RequestFunds extends React.Component {

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
    const { changeAlert } = this.props;
    const { amount, canRequest } = this.state;

    if(canRequest){
      this.setState({
        requested: true,
        amount
      })
    }else{
      changeAlert({type: 'warning', message: 'Please enter a valid amount'})
    }
  };

  render() {
    let { canRequest, message, amount, requested } = this.state;
    let {
      currencyDisplay,
      view,
      buttonStyle,
      address,
	  changeView,
	  t
    } = this.props
    if(requested){

      let url = window.location.protocol+"//"+window.location.hostname
      if(window.location.port&&window.location.port!==80&&window.location.port!==443){
        url = url+":"+window.location.port
      }

      // TODO: Understand why these `replaceAll`s are used here.
      const encodedMessage = encodeURI(message).replaceAll("#","%23").replaceAll(";","%3B").replaceAll(":","%3A").replaceAll("/","%2F");
      const currency = getStoredValue("currency", address);

      const qrValue = `${url}/${address};${amount};${encodedMessage};${currency}`;

      return (
        <div>
          <CopyToClipboard text={qrValue} onCopy={() => {
            this.props.changeAlert({type: 'success', message: 'Request link copied to clipboard'})
          }}>
          <div style={{width:"100%",textAlign:'center'}}>
            <div style={{fontSize:30,cursor:"pointer",textAlign:"center",width:"100%"}}>
              {/* NOTE: We don't need to convert here, as the user already put
                * in the amount in their local currency.
                */}
              {currencyDisplay(amount, false, false)}
            </div>

            <div style={{cursor:"pointer",textAlign:"center",width:"100%"}}>
              {message}
            </div>


            <Flex flexDirection={'column'} alignItems={'center'} p={3} border={1} borderColor={'grey'} borderRadius={1}>
              <QRCode className="qr-code" value={qrValue} size={'100%'} renderAs={'svg'} />
            </Flex>
            <Box mt={3}>
              <Input type='url' readOnly value={qrValue} width={1} />
            </Box>

            </div>
          </CopyToClipboard>
          <RecentTransactions
            currencyDisplay={currencyDisplay}
            view={view}
            max={5}
            buttonStyle={buttonStyle}
            transactionsByAddress={this.props.transactionsByAddress}
            changeView={changeView}
            address={address}
            block={this.props.block}
            recentTxs={this.props.recentTxs}
          />
        </div>
      )
    }else{
      return (
        <div>
          <Field label={t('request_funds.amount')}>
            <Input
              type="number"
              width={1}
              placeholder={this.props.currencyDisplay(0)}
              value={this.state.amount}
              onChange={event => this.updateState('amount', event.target.value)}
            />
          </Field>

          <Field label={t('request_funds.item_message')}>
            <Input
              type="text"
              width={1}
              placeholder="Hot Dogs"
              value={this.state.message}
              onChange={event => this.updateState('message', event.target.value)}
            />
          </Field>

          <PrimaryButton
            size={'large'}
            width={1}
            disabled={(canRequest ? false : true)}
            onClick={this.request}
          >
            {t('request_funds.button')}
          </PrimaryButton>
        </div>
      )
    }

  }
}

export default withTranslation()(RequestFunds);
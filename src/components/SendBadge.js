import React from 'react';
import Ruler from "./Ruler";
import Balance from "./Balance";
import cookie from 'react-cookies'
import {CopyToClipboard} from "react-copy-to-clipboard";
import Blockies from 'react-blockies';
import { scroller } from 'react-scroll'
import Badge from './Badge';
import i18n from '../i18n';
import {
  Box,
  Field,
  Input,
  Button,
  OutlineButton
} from "rimble-ui";

export default class SendBadge extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      canSend: false
    };
  }
  componentDidMount = () => {
    window.addEventListener('scroll', this.handleOnScroll.bind(this))
  }
  componentWillUnmount = () => {
    window.removeEventListener('scroll', this.handleOnScroll.bind(this))
  }
  handleOnScroll = () => {
      this.forceUpdate()
  }
  componentWillReceiveProps(newProps) {
    if (this.props.scannerState !== newProps.scannerState) {
        this.setState(Object.assign(this.state, newProps.scannerState), () => {
          this.setState({canSend: this.canSend()});	
	});
    }
  }
  updateState = async (key, value) => {
    if(key=="toAddress"){
      cookie.save('sendBadgeToAddress', value, { path: '/', maxAge: 60 })
    }
    this.setState({ [key]: value },()=>{
      this.setState({ canSend: this.canSend() })
    });
    if(key=="toAddress"){
      this.setState({fromEns:""})
      setTimeout(()=>{
        this.scrollToBottom()
      },30)
    }
    if(key=="toAddress"&&value.indexOf(".eth")>=0){
      console.log("Attempting to look up ",value)
      let addr = await this.props.ensLookup(value)
      console.log("Resolved:",addr)
      if(addr!="0x0000000000000000000000000000000000000000"){
        this.setState({toAddress:addr,fromEns:value},()=>{
          this.setState({ canSend: this.canSend() })
        })
      }
    }
  };
  scrollToBottom(){
    console.log("scrolling to bottom")
    scroller.scrollTo('theVeryBottom', {
      duration: 500,
      delay: 30,
      smooth: "easeInOutCubic",
    })
  }
  canSend() {
    //console.log("CAN SEND?",this.state.toAddress,this.state.toAddress.length)
    return (this.state.toAddress && this.state.toAddress.length === 42)
  }
  send = async () => {
    let { toAddress, amount } = this.state;
    let {
      ERC20TOKEN,
      address,
      badge,
      tokenSendV2,
      metaAccount,
      xdaiweb3,
      web3,
      goBack,
      changeAlert,
      setReceipt,
      changeView,
      clearBadges
    } = this.props

    if(this.state.canSend){

      console.log("SWITCH TO LOADER VIEW...",amount)
      this.props.changeView('loader')
      setTimeout(()=>{window.scrollTo(0,0)},60)

      const color = 49156;
      let receipt;
      try {
        receipt = await tokenSendV2(
          address,
          toAddress,
          badge.id,
          color,
          xdaiweb3,
          web3,
          metaAccount && metaAccount.privateKey
        )
      } catch(err) {
        console.log(err);
        goBack();
        changeAlert({
          type: 'warning',
          message: "Couldn't send token",
        });
        return;
      }
      console.log("SEND BADGE COMPLETE?!?",receipt)
      goBack();
      window.history.pushState({},"", "/");
      setReceipt({to:toAddress,from:receipt.from,badge:badge,result:receipt})
      changeView("receipt");
      clearBadges();
    }
  };

  render() {
    let { canSend, toAddress } = this.state;
    return (
      <Box mb={4}>
        <Badge
          large={true}
          key={this.props.badge.id}
          badge={this.props.badge}
        />
        <Ruler />
        <Field mb={3} label="To Address">
          <Input
            width={1}
            type="text"
            placeholder="0x..."
            value={toAddress}
            ref={(input) => { this.addressInput = input; }}
            onChange={event => this.updateState('toAddress', event.target.value)} />
          <OutlineButton icon={'CenterFocusWeak'} mb={4} width={1} onClick={() => {this.props.openScanner({view:"send_badge", goBackView:"send_badge"})}}>
            Scan QR Code
          </OutlineButton>
        </Field>
        <Button
          size="large"
          width={1}
          name="theVeryBottom"
          disabled={!canSend}
          onClick={this.send}>
          Send
        </Button>
      </Box>
    )
  }
}

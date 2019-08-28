import React from 'react';
import { Scaler } from "dapparatus";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { withTranslation } from 'react-i18next';
import {
  Input,
  QR as QRCode,
  Text,
  Select,
  Flex,
  Checkbox
} from 'rimble-ui'
import { PrimaryButton, BorderButton } from '../components/Buttons'
import getConfig from '../config'
import { getStoredValue, storeValues } from "../services/localStorage";

const { CURRENCY, LINKS } = getConfig()

class Advanced extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      privateKeyQr:false,
      seedPhraseHidden:true,
      privateKeyHidden:true,
      currency: '',
      expertMode:false
    }
    this.updateCurrency = this.updateCurrency.bind(this)
  }

  componentDidMount() {
    const { address } = this.props;
    const currency = getStoredValue('currency', address) || CURRENCY.DEFAULT_CURRENCY;
    const expertMode = getStoredValue("expertMode") === "true"
      // Right now "expertMode" is enabled by default. To disable it by default, remove the following line.
      || getStoredValue("expertMode") === null;
    this.setState({ currency, expertMode })
  }

  updateCurrency = e => {
    const { address } = this.props;
    let { value } = e.target
    this.setState({ currency: value })
    storeValues({ currency: value }, address)
  }

  updateAdvancedBalance= e => {
    let { checked } = e.target
    this.setState({ expertMode: checked })
    storeValues({ expertMode: checked })
  }

  render(){
    let {isVendor, balance, privateKey, changeAlert, changeView, setPossibleNewPrivateKey, t} = this.props
    let { currency, expertMode } = this.state

    let url = window.location.protocol+"//"+window.location.hostname
    if(window.location.port&&window.location.port!==80&&window.location.port!==443){
      url = url+":"+window.location.port
    }
    let qrSize = Math.min(document.documentElement.clientWidth,512)-90
    let qrValue = url+"/#"+privateKey
    let privateKeyQrDisplay = ""
    if(this.state.privateKeyQr){
      privateKeyQrDisplay = (
        <div className="main-card card w-100">
          <div className="content qr row">
            <QRCode className="qr-code" value={qrValue} size={qrSize}/>
          </div>
        </div>
      )
    }


    let inputPrivateEyeButton = ""

    if(this.state.newPrivateKey){
      inputPrivateEyeButton = (
        <PrimaryButton className="show-toggle" onClick={()=>{this.setState({privateKeyHidden:!this.state.privateKeyHidden})}}>
          <i className="fas fa-eye"></i>
        </PrimaryButton>
      )
    }

    let inputPrivateKeyRow = (
      <div className="content ops row settings-row">
        <div className="input-with-toggle">
          <Input
            type={this.state.privateKeyHidden?"password":"text"}
            autocorrect="off"
            autocapitalize="none"
            className="form-control settings-input"
            placeholder="private key"
            value={this.state.newPrivateKey}
            onChange={event => this.setState({newPrivateKey:event.target.value})}
          />
          {inputPrivateEyeButton}
        </div>
        <PrimaryButton onClick={()=>{
          console.log(this.state.newPrivateKey)
          if(this.state && this.state.newPrivateKey && this.state.newPrivateKey.length>=64&&this.state.newPrivateKey.length<=66){
            //let pkutils = require("ethereum-mnemonic-privatekey-utils")
            //const newPrivateKey = pkutils.getPrivateKeyFromMnemonic(newPrivateKey)
            changeView('main')
            let possibleNewPrivateKey = this.state.newPrivateKey
            if(possibleNewPrivateKey.indexOf("0x")!==0){
              possibleNewPrivateKey = "0x"+possibleNewPrivateKey
            }
            setPossibleNewPrivateKey(possibleNewPrivateKey)
          }else{
            changeAlert({type: 'warning', message: 'Invalid private key.'})
          }
        }}>
          <i className="fas fa-plus-square"/> {t('create')}
        </PrimaryButton>
      </div>
    )


    let inputSeedEyeButton = ""

    if(this.state.newSeedPhrase){
      inputSeedEyeButton = (
        <PrimaryButton width={1} onClick={()=>{this.setState({seedPhraseHidden:!this.state.seedPhraseHidden})}}>
          <i className="fas fa-eye"></i>
        </PrimaryButton>
      )
    }

    let inputSeedRow = (
      <div className="content ops row settings-row" style={{paddingTop:10}}>
        <Input
          type={this.state.seedPhraseHidden?"password":"text"}
          autocorrect="off"
          autocapitalize="none"
          className="form-control"
          placeholder="seed phrase"
          value={this.state.newSeedPhrase}
          onChange={event => this.setState({newSeedPhrase:event.target.value})}
        />
        {inputSeedEyeButton}
        <PrimaryButton width={1} onClick={()=>{
          if(!this.state.newSeedPhrase){
            changeAlert({type: 'warning', message: 'Invalid seed phrase.'})
          }else{
            import('ethereum-mnemonic-privatekey-utils').then(pkutils => {
              console.log(pkutils);
              const newPrivateKey = pkutils.getPrivateKeyFromMnemonic(this.state.newSeedPhrase)
              changeView('main')
              setPossibleNewPrivateKey("0x"+newPrivateKey)
            });
          }
        }}>
          <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
            <i className="fas fa-plus-square"/> {t('create')}
          </Scaler>
        </PrimaryButton>
      </div>
    )

    return (
      <div style={{marginTop:20}}>
        <Flex py={3} alignItems='center' justifyContent='space-between'>
          <Text>{t('currency.label')}</Text>
          <Select items={CURRENCY.CURRENCY_LIST} onChange={this.updateCurrency} value={currency}/>
        </Flex>
        <Flex py={3} alignItems='center' justifyContent='space-between'>
          <Text>Enable advanced features</Text>
          <Checkbox onChange={this.updateAdvancedBalance} checked={expertMode} />
        </Flex>

        <hr style={{paddingTop:20}}/>

        <div>
          <div style={{width:"100%",textAlign:"center"}}><h5>Learn More</h5></div>
          <div className="content ops row settings-row" style={{marginBottom:10}}>
            <a href={LINKS.CODE} style={{color:"#FFFFFF"}} target="_blank" rel="noopener noreferrer">
              <BorderButton width={1}>
                <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
                  <i className="fas fa-code"/> {t('code')}
                </Scaler>
              </BorderButton>
            </a>
            <a href={LINKS.ABOUT} style={{color:"#FFFFFF"}} target="_blank" rel="noopener noreferrer">
              <BorderButton width={1}>
                <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
                  <i className="fas fa-info"/> {t('about')}
                </Scaler>
              </BorderButton>
            </a>
          </div>
        </div>

        <hr style={{paddingTop:20}}/>

        {privateKey && !isVendor &&
        <div>
          <div style={{width:"100%",textAlign:"center"}}>
            <h5>Private Key</h5>
          </div>
          <div className="content ops row settings-row" style={{marginBottom:10}}>
            <PrimaryButton width={1} onClick={()=>{
              this.setState({privateKeyQr:!this.state.privateKeyQr})
            }}>
              <i className="fas fa-key"/> {t('show')}
            </PrimaryButton>

            <CopyToClipboard text={privateKey}>
              <PrimaryButton width={1} onClick={() => changeAlert({type: 'success', message: 'Private Key copied to clipboard'})}>
                <i className="fas fa-key"/> {t('copy')}
              </PrimaryButton>
            </CopyToClipboard>

          </div>
          {privateKeyQrDisplay}

        </div>
        }

        {privateKey &&
        <div>
          <div className="content ops row settings-row" >
            <PrimaryButton width={1} onClick={()=>{
              console.log("BALANCE",balance)
              changeView('burn-wallet')
            }}>
              <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
                <i className="fas fa-fire"/> {t('burn')}
              </Scaler>
            </PrimaryButton>
          </div>
          <hr style={{paddingTop:20}}/>
        </div>}


        <div style={{width:"100%",textAlign:"center"}}><h5>Create Account</h5></div>

        {inputPrivateKeyRow}

        {inputSeedRow}

        {isVendor &&
        <div>
          <div className="content ops row settings-row" style={{marginBottom:10}}>
            <PrimaryButton width={1} onClick={()=>{
              this.props.changeView("exchange")
            }}>
              <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
                <i className="fas fa-key"/> {"Exchange"}
              </Scaler>
            </PrimaryButton>
          </div>
        </div>
        }

      </div>
    )
  }
}

export default withTranslation()(Advanced);
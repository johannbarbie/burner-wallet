/* eslint-disable jsx-a11y/anchor-is-valid */

import React from 'react';
import { Blockie } from "dapparatus";
import { withTranslation } from 'react-i18next';
import bityLogo from '../assets/bity.png';
import { Image } from "rimble-ui";

const BockieSize = 12

class Receipt extends React.Component {

  componentDidMount(){
    console.log("RECEIPT LOADED",this.props)
    if(this.props.receipt && this.props.receipt.daiposOrderId){
      console.log("This was a daipos Order... ping their server for them...")
      // https://us-central1-daipos.cloudfunctions.net/transactionBuffer?orderId=0JFmycULnk9kAboK5ESg&txHash=0x8c831cd5cbc8786982817e43a0a77627ad0b12eaa92feff97fb3b7e91c263b1c&networkId=100
      let url = "https://us-central1-daipos.cloudfunctions.net/transactionBuffer?orderId="+this.props.receipt.daiposOrderId+"&txHash="+this.props.receipt.result.transactionHash+"&networkId=100"
      console.log("url:",url)
      fetch(url).then(r => r.json()).then((response)=>{
         console.log("Finished hitting the Ching servers:",response)
       })
    }
    console.log("CHECKING PARAMS:",this.props.receipt.params)
    if(this.props.receipt && this.props.receipt.params && this.props.receipt.params.callback){
      console.log("Redirecting to ",this.props.receipt.params.callback,"with data:",this.props.receipt)
      let returnObject = {
        to: this.props.receipt.to,
        from: this.props.receipt.from,
        amount: this.props.receipt.amount,
        transactionHash: this.props.receipt.result.transactionHash,
        status: this.props.receipt.result.status,
        data: this.props.receipt.result.v,
      }
      console.log("returnObject",returnObject)
      setTimeout(()=>{
        window.location = this.props.receipt.params.callback+"?receipt="+(encodeURI(JSON.stringify(returnObject)))
      },2500)
    }
  }
  render() {
    let { receipt, currencyDisplay, t } = this.props

    let message = ""

    let sendAmount = (
      <div>
        <span style={{opacity:0.15}}>-</span>{currencyDisplay(receipt.amount)}<span style={{opacity:0.15}}>-></span>
      </div>
    )

    if(receipt.message){
      message = (
        <div className="row" style={{cursor:"pointer",width:"100%",marginTop:20,marginBottom:-30}}>
          <div className="col-12" style={{textAlign:'center',whiteSpace:"nowrap",letterSpacing:-1,padddingTop:30,fontSize:20}}>
            {receipt.message}
          </div>
        </div>
      )
    }

    return (
      <div>
        <div className="send-to-address w-100">
            <div className="row" style={{cursor:"pointer",width:"100%"}}>
              <div className="col-12" style={{textAlign:'center',whiteSpace:"nowrap",letterSpacing:-1}}>
                {!receipt.result.error &&
                  <i className="fas fa-check-circle" style={{color:"#39e917",fontSize:180,opacity:.7}} />
                }
                {receipt.result.error &&
                  <i className="fas fa-times-circle" style={{color:"rgb(233, 23, 23)",fontSize:180,opacity:.7}} />
                }
              </div>
            </div>

            <div className="row" style={{cursor:"pointer",width:"100%"}}>
              <div className="col-4" style={{textAlign:'center',whiteSpace:"nowrap",letterSpacing:-1}}>
                <Blockie
                  address={receipt.from}
                  config={{size:BockieSize}}
                />
              </div>
              <div className="col-4" style={{textAlign:'center',whiteSpace:"nowrap",letterSpacing:-1,fontSize:25,paddingTop:28}}>
                {sendAmount}
              </div>
              <div className="col-4" style={{textAlign:'center',whiteSpace:"nowrap",letterSpacing:-1}}>
                {receipt.to === "bity.com" ?
                  <Image style={{marginTop: "20px"}} src={bityLogo} height="auto" width={"100px"} mr={3} bg="transparent" /> :
                  <Blockie
                    address={receipt.to}
                    config={{size:BockieSize}}
                    />
                }
              </div>
            </div>
            {message}

        </div>
        <div name="theVeryBottom" className="text-center bottom-text">
          <span style={{padding:10}}>
            <a href="#" style={{color:"#FFFFFF"}} onClick={()=>{this.props.goBack()}}>
              <i className="fas fa-times"/> {t('done')}
            </a>
          </span>
        </div>
      </div>
    )
  }
}

export default withTranslation()(Receipt);
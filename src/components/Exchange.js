/* eslint-disable jsx-a11y/anchor-is-valid */
import React from 'react';
import Ruler from "./Ruler";
import Blockies from 'react-blockies';
import { Scaler } from "dapparatus";
import Web3 from 'web3';
import { withTranslation } from 'react-i18next';
import {
  Flex,
  Box,
  OutlineButton,
  Input as RInput,
  Field
} from 'rimble-ui'

import { Exit } from 'leap-core';
import { fromRpcSig } from 'ethereumjs-util';
import { bi, add, divide } from 'jsbi-utils';
import getConfig from "../config";
import { PrimaryButton, BorderButton } from "./Buttons";
import bityLogo from '../assets/bity.png';
import { price } from "../services/ethgasstation";
import { getStoredValue } from "../services/localStorage";

const CONFIG = getConfig();
const BN = Web3.utils.BN

// TODO: Move logoStyle and colStyle into e.g. SCSS file
const logoStyle = {
  maxWidth:50,
  maxHeight:50,
}

const uniswapContractObject = {
  address: CONFIG.ROOTCHAIN.UNISWAP.DAI_ETH_ADDRESS,
  abi: require("../contracts/Exchange.abi.js"),
  blocknumber: 6627956,
}

let metaReceiptTracker = {}

class Exchange extends React.Component {

  constructor(props) {
    super(props);

    let xdaiweb3 = this.props.xdaiweb3
    //let mainnetweb3 = new Web3("https://mainnet.infura.io/v3/e0ea6e73570246bbb3d4bd042c4b5dac")
    let mainnetweb3 = props.mainnetweb3
    let pk = getStoredValue('metaPrivateKey')
    let mainnetMetaAccount = false
    let xdaiMetaAccount = false
    let daiAddress = false
    let xdaiAddress = false
    if(pk&&pk!=="0"){
      mainnetMetaAccount = mainnetweb3.eth.accounts.privateKeyToAccount(pk)
      daiAddress = mainnetMetaAccount.address.toLowerCase();
      xdaiMetaAccount = xdaiweb3.eth.accounts.privateKeyToAccount(pk)
      xdaiAddress = xdaiMetaAccount.address.toLowerCase();
    }else{
      daiAddress = this.props.address
      xdaiAddress = this.props.address
    }


    this.state = {
      daiAddress: daiAddress,
      xdaiAddress: xdaiAddress,
      xdaiSendToAddress: "",
      denDaiBalance:0,
      mainnetweb3: mainnetweb3,
      mainnetMetaAccount: mainnetMetaAccount,
      xdaiweb3:xdaiweb3,
      xdaiMetaAccount: xdaiMetaAccount,
      daiToXdaiMode: false,
      ethToDaiMode: false,
      loaderBarStatusText: props.t('loading'),
      loaderBarStartTime:Date.now(),
      loaderBarPercent: 2,
      loaderBarColor: "#aaaaaa",
      gwei: 5,
      maxWithdrawlAmount: 0.00,
      withdrawalExplanation: props.t('exchange.withdrawal_explanation'),
      gettingGas:false,
    }

    setInterval(() => this.updatePendingExits(daiAddress, xdaiweb3), 5000);
  }

  updatePendingExits(daiAddress, xdaiweb3) {
    const account = daiAddress;
    const tokenAddr = this.props.daiContract._address;

    xdaiweb3.getColor(tokenAddr)
    .then(color => {
      return fetch(
      `${CONFIG.SIDECHAIN.MARKET_MAKER}/exits/${account}/${color}`,
      { method: "GET", mode: "cors" }
      );
    })
    .then(response => response.json())
    .then(rsp => {
      const pendingValue = rsp.reduce((sum, v) => add(sum, bi(v.value)), bi(0));
      const pendingTokens = parseInt(String(divide(pendingValue, bi(10 ** 16)))) / 100;
      if (pendingTokens > 0) {
        const pendingMsg = "Pending exits of " + pendingTokens.toString() + " PDAI";
        this.setState({
          pendingMsg
        });
      }
    });
  };


  updateState = (key, value) => {
    this.setState({ [key]: value },()=>{
      this.setState({ canSendDai: this.canSendDai(), canSendEth: this.canSendEth(), canSendXdai: this.canSendXdai() })
    });
  };
  async componentDidMount(){
    this.setState({ canSendDai: this.canSendDai(), canSendEth: this.canSendEth(), canSendXdai: this.canSendXdai() })
    this.interval = setInterval(this.poll.bind(this),1500)
    setTimeout(this.poll.bind(this),250)
  }
  async poll(){
	let { xdaiweb3 } = this.state
	let { t } = this.props
    /*let { daiContract } = this.props
    if(daiContract){
      let daiBalance = await daiContract.methods.balanceOf(this.state.daiAddress).call()
      daiBalance = mainnetweb3.utils.fromWei(daiBalance,"ether")
      if(daiBalance!==this.state.daiBalance){
        this.setState({daiBalance})
      }
    }*/


    if(this.state.gettingGas){
      if(this.state.ethBalanceShouldBe){
        console.log("ethBalanceShouldBe:",parseFloat(this.state.ethBalanceShouldBe)," needs to be less than ",parseFloat(this.props.ethBalance))
        if(parseFloat(this.state.ethBalanceShouldBe)<parseFloat(this.props.ethBalance)){
          this.setState({gettingGas:false,ethBalanceShouldBe:false})
        }
      }
    }
    this.updatePendingExits(this.state.daiAddress, xdaiweb3)

    /*
    console.log("SETTING ETH BALANCE OF "+this.state.daiAddress)
    this.setState({ethBalance:mainnetweb3.utils.fromWei(await mainnetweb3.eth.getBalance(this.state.daiAddress),'ether') })
    if(xdaiweb3){
      //console.log("xdaiweb3:",xdaiweb3,"xdaiAddress",xdaiAddress)
      let xdaiBalance = await xdaiweb3.eth.getBalance(this.state.daiAddress)
      //console.log("!! xdaiBalance:",xdaiBalance)
      this.setState({xdaiBalance:xdaiweb3.utils.fromWei(xdaiBalance,'ether')})
    }*/
    if(this.state.daiToXdaiMode==="withdrawing"){
      let txAge = Date.now() - this.state.loaderBarStartTime
      let percentDone = Math.min(100,((txAge * 100) / CONFIG.SIDECHAIN.TIME_ESTIMATES.EXIT)+5)

      console.log("watching for ",this.props.daiBalance,"to be ",this.state.daiBalanceShouldBe-0.0005)
      if(this.props.daiBalance>=(this.state.daiBalanceShouldBe-0.0005)){
        this.setState({loaderBarPercent:100,loaderBarStatusText: t('exchange.funds_bridged'),loaderBarColor:"#62f54a"})
        setTimeout(()=>{
          this.setState({
            daiToXdaiMode: false,
            loaderBarStatusText: t('loading'),
            loaderBarStartTime:0,
            loaderBarPercent: 1,
            loaderBarColor: "#FFFFFF"
          })
        },3500)
      }else{
        this.setState({loaderBarPercent:percentDone})
      }

    }else if(this.state.daiToXdaiMode==="depositing"){
      let txAge = Date.now() - this.state.loaderBarStartTime
      let percentDone = Math.min(100,((txAge * 100) / CONFIG.SIDECHAIN.TIME_ESTIMATES.DEPOSIT)+5)

      //console.log("watching for ",this.state.xdaiBalance,"to be ",this.state.xdaiBalanceShouldBe-0.0005)
      if(this.props.xdaiBalance>=(this.state.xdaiBalanceShouldBe-0.0005)){
        this.setState({loaderBarPercent:100,loaderBarStatusText: t('exchange.funds_bridged'),loaderBarColor:"#62f54a"})
        setTimeout(()=>{
          this.setState({
            daiToXdaiMode: false,
            loaderBarStatusText: t('loading'),
            loaderBarStartTime:0,
            loaderBarPercent: 1,
            loaderBarColor: "#FFFFFF"
          })
        },3500)
      }else{
        this.setState({loaderBarPercent:percentDone})
      }
    }else if(this.state.daiToXdaiMode==="sending"){
      let txAge = Date.now() - this.state.loaderBarStartTime
      let percentDone = Math.min(100,((txAge * 100) / CONFIG.ROOTCHAIN.TIME_ESTIMATES.SEND)+5)

      console.log("watching for ",this.props.daiBalance,"to be ",this.state.daiBalanceShouldBe-0.0005)
      if(this.props.daiBalance<=(this.state.daiBalanceShouldBe-0.0005)){
        this.setState({loaderBarPercent:100,loaderBarStatusText: t('exchange.funds_bridged'),loaderBarColor:"#62f54a"})
        setTimeout(()=>{
          this.setState({
            daiToXdaiMode: false,
            loaderBarStatusText: t('loading'),
            loaderBarStartTime:0,
            loaderBarPercent: 1,
            loaderBarColor: "#FFFFFF"
          })
        },3500)
      }else{
        this.setState({loaderBarPercent:percentDone})
      }
    }


    if(this.state.ethToDaiMode==="withdrawing"){
      let txAge = Date.now() - this.state.loaderBarStartTime
      let percentDone = Math.min(100,((txAge * 100) / CONFIG.ROOTCHAIN.TIME_ESTIMATES.SEND) + 5)
      //ethBalanceAtStart:this.state.ethBalance,
      //ethBalanceShouldBe:this.state.ethBalance+amountOfChange,
      console.log("watching for ",this.props.ethBalance,"to be ",this.state.ethBalanceShouldBe-0.001)
      if(parseFloat(this.props.ethBalance)>=(this.state.ethBalanceShouldBe-0.001)){
        this.setState({loaderBarPercent:100,loaderBarStatusText: t('exchange.funds_bridged'),loaderBarColor:"#62f54a"})
        setTimeout(()=>{
          this.setState({
            ethToDaiMode: false,
            loaderBarStatusText: t('loading'),
            loaderBarStartTime:0,
            loaderBarPercent: 1,
            loaderBarColor: "#FFFFFF"
          })
        },3500)
      }else{
        this.setState({loaderBarPercent:percentDone})
      }

    }else if(this.state.ethToDaiMode==="depositing"){
      let txAge = Date.now() - this.state.loaderBarStartTime
      let percentDone = Math.min(100,((txAge * 100) / CONFIG.ROOTCHAIN.TIME_ESTIMATES.SEND)+5)

      //console.log("watching for ",this.state.xdaiBalance,"to be ",this.state.xdaiBalanceShouldBe-0.0005)
      if(this.props.daiBalance>=(this.state.daiBalanceShouldBe-0.0005)){
        this.setState({loaderBarPercent:100,loaderBarStatusText: t('exchange.funds_bridged'),loaderBarColor:"#62f54a"})
        setTimeout(()=>{
          this.setState({
            ethToDaiMode: false,
            loaderBarStatusText: t('loading'),
            loaderBarStartTime:0,
            loaderBarPercent: 1,
            loaderBarColor: "#FFFFFF"
          })
        },3500)
      }else{
        this.setState({loaderBarPercent:percentDone})
      }
    }else if(this.state.ethToDaiMode==="sending"){
      let txAge = Date.now() - this.state.loaderBarStartTime
      let percentDone = Math.min(100,((txAge * 100) / CONFIG.ROOTCHAIN.TIME_ESTIMATES.SEND) + 5)
      //ethBalanceAtStart:this.state.ethBalance,
      //ethBalanceShouldBe:this.state.ethBalance+amountOfChange,
      console.log("watching for ",this.props.ethBalance,"to be ",this.state.ethBalanceShouldBe-0.001)
      if(parseFloat(this.props.ethBalance)<=(this.state.ethBalanceShouldBe-0.001)){
        this.setState({loaderBarPercent:100,loaderBarStatusText: t('exchange.funds_bridged'),loaderBarColor:"#62f54a"})
        setTimeout(()=>{
          this.setState({
            ethToDaiMode: false,
            loaderBarStatusText: t('loading'),
            loaderBarStartTime:0,
            loaderBarPercent: 1,
            loaderBarColor: "#FFFFFF"
          })
        },3500)
      }else{
        this.setState({loaderBarPercent:percentDone})
      }

    }

  }
  async sendDai(){
    let { daiContract, address } = this.props;
    const { pTx, changeAlert, daiBalance, web3, convertCurrency, t} = this.props;
    const {
      daiAddress,
      daiSendToAddress,
      mainnetMetaAccount,
      mainnetweb3,
    } = this.state;
    let { daiSendAmount } = this.state;

    const displayCurrency = getStoredValue("currency", address);
    // NOTE: daiSendAmount needs to be a string!
    daiSendAmount = `${convertCurrency(daiSendAmount, `USD/${displayCurrency}`)}`;

    if(parseFloat(daiBalance)<parseFloat(daiSendAmount)){
      changeAlert({type: 'warning',message: t('exchange.insufficient_funds')});
    }else if(!daiSendToAddress || !daiSendToAddress.length === 42){
      changeAlert({type: 'warning',message: t('exchange.invalid_to_address')});
    }else if(!(parseFloat(daiSendAmount) > 0)){
      changeAlert({type: 'warning',message: t('exchange.invalid_to_amount')});
    }else{
      this.setState({
        daiToXdaiMode:"sending",
        daiBalanceAtStart:daiBalance,
        daiBalanceShouldBe:parseFloat(daiBalance) - parseFloat(daiSendAmount),
        loaderBarColor:"#f5eb4a",
        loaderBarStatusText: t('exchange.calculate_gas_price'),
        loaderBarPercent:0,
        loaderBarStartTime: Date.now(),
        loaderBarClick:()=>{
          alert(t('exchange.go_to_etherscan'))
        }
      })
      this.setState({sendDai:false})

      let gwei;
      try {
        gwei = await price();
      } catch(err) {
        console.log("Error getting gas price",err)
      }

      if(gwei !== undefined){
        if (mainnetMetaAccount) {

          let paramsObject = {
            from: daiAddress,
            value: 0,
            gas: 240000,
            gasPrice: Math.round(gwei * 1000000000)
          }
          console.log("====================== >>>>>>>>> paramsObject!!!!!!!",paramsObject)

          paramsObject.to = daiContract._address;
          paramsObject.data = daiContract.methods.transfer(daiSendToAddress, mainnetweb3.utils.toWei(daiSendAmount, "ether")).encodeABI()

          console.log("TTTTTTTTTTTTTTTTTTTTTX",paramsObject)

          let signed = await mainnetweb3.eth.accounts.signTransaction(paramsObject, mainnetMetaAccount.privateKey)

          try {
            await mainnetweb3.eth.sendSignedTransaction(signed.rawTransaction)
          } catch(err) {
            console.log("EEEERRRRRRRROOOOORRRRR ======== >>>>>",err)
            changeAlert({type: 'danger',message: err.toString()});
          }
        } else {
            // NOTE: For some reason it's important that we reinitialize
            // the daiContract at this point with this.props.web3.
            daiContract = new web3.eth.Contract(daiContract._jsonInterface, daiContract._address)
            await pTx(
              daiContract.methods.transfer(
                daiSendToAddress,
                web3.utils.toWei(daiSendAmount, "ether")
              ),
              150000,
              0,
              0
            )
        }
        changeAlert({type: "success", message: `Sent ${daiSendAmount} DAI to ${daiSendToAddress}...`});
        this.setState({
          daiToXdaiMode:false,
          daiSendAmount:"",
          daiSendToAddress:"",
          loaderBarColor:"#FFFFFF",
          loaderBarStatusText:"",
        })
      } else {
        // TODO: Propagate this error to the user
        console.log("Couldn't get gas price");
      }
    }
  }
  canSendDai() {
    return (this.state.daiSendToAddress && this.state.daiSendToAddress.length === 42 && parseFloat(this.state.daiSendAmount)>0 && parseFloat(this.state.daiSendAmount) <= parseFloat(this.props.daiBalance))
  }

  async depositDai(destination, amount, message, cb) {
    let gwei
    try {
      gwei = await price();
    } catch(err) {
      console.log("Error getting gas price",err)
    }

    if(gwei !== undefined){
      const color = await this.state.xdaiweb3.getColor(this.props.xdaiContract._address);
      if(this.state.mainnetMetaAccount){
        //send funds using metaaccount on mainnet
        const amountWei = this.state.mainnetweb3.utils.toWei(""+amount,"ether")

        let paramsObject
        if (this.props.network === "LeapTestnet" || this.props.network === "LeapMainnet") {
          const allowance = await this.props.daiContract.methods.allowance(
            this.state.daiAddress,
            this.props.bridgeContract._address
          ).call({from: this.state.daiAddress})

          // Only trigger allowance dialogue when amount is more than allowance
          if (new BN(allowance).lt(new BN(amountWei))) {
            this.setState({
              loaderBarColor:"#f5eb4a",
              loaderBarStatusText: "Approving token amount for Plasma bridge"
            })
            paramsObject = {
              from: this.state.daiAddress,
              value: 0,
              // TODO: Calculate gas estimate appropriately
              gas: 100000,
              gasPrice: Math.round(gwei * 1000000000)
            }
            console.log("====================== >>>>>>>>> paramsObject!!!!!!!",paramsObject)

            paramsObject.to = this.props.daiContract._address
            paramsObject.data = this.props.daiContract.methods.approve(
              this.props.bridgeContract._address,
              amountWei
            ).encodeABI()

            const signedApprove = await this.state.mainnetweb3.eth.accounts.signTransaction(paramsObject, this.state.mainnetMetaAccount.privateKey)
            console.log("========= >>> SIGNED",signedApprove)
            let receiptApprove
            try {
              // Here we send the approve transaction to the network
              receiptApprove = await this.state.mainnetweb3.eth.sendSignedTransaction(signedApprove.rawTransaction)
            } catch(err) {
              console.log("EEEERRRRRRRROOOOORRRRR ======== >>>>>",err)
              this.props.changeAlert({type: 'danger',message: err.toString()});
            }
            console.log("META RECEIPT Approve",receiptApprove)
            if(receiptApprove&&receiptApprove.transactionHash&&!metaReceiptTracker[receiptApprove.transactionHash]){
              metaReceiptTracker[receiptApprove.transactionHash] = true
            }
          }
        }

        this.setState({
          loaderBarColor:"#f5eb4a",
          loaderBarStatusText:message,
        })

        paramsObject = {
          from: this.state.daiAddress,
          value: 0,
          // TODO: I guess this should be calculated by web3's gas
          // estimate?
          gas: 200000,
          gasPrice: Math.round(gwei * 1000000000)
        }
        paramsObject.to = this.props.bridgeContract._address
        paramsObject.data = this.props.bridgeContract.methods.deposit(
          this.state.daiAddress,
          amountWei,
          color,
        ).encodeABI()
        console.log("====================== >>>>>>>>> paramsObject!!!!!!!",paramsObject)

        const signedDeposit = await this.state.mainnetweb3.eth.accounts.signTransaction(paramsObject, this.state.mainnetMetaAccount.privateKey)
        console.log("========= >>> SIGNED",signedDeposit)

        let receiptDeposit
        try {
          receiptDeposit = await this.state.mainnetweb3.eth.sendSignedTransaction(signedDeposit.rawTransaction)
        } catch(err) {
          console.log("EEEERRRRRRRROOOOORRRRR ======== >>>>>",err)
          this.props.changeAlert({type: 'danger',message: err.toString()});
        }
        if(receiptDeposit&&receiptDeposit.transactionHash&&!metaReceiptTracker[receiptDeposit.transactionHash]){
          metaReceiptTracker[receiptDeposit.transactionHash] = true
          console.log("receipt", receiptDeposit)
          cb(receiptDeposit)
        }
      }else{
        //send funds using metamask (or other injected web3 ... should be checked and on mainnet)
        const { pTx, web3 } = this.props
        let bridgeContract = new web3.eth.Contract(this.props.bridgeContract._jsonInterface,this.props.bridgeContract._address)
        console.log("CURRENT BRIDGE CONTRACT YOU NEED TO GET ABI FROM:",this.props.bridgeContract, this.state.daiAddress)
        let daiContract = new web3.eth.Contract(this.props.daiContract._jsonInterface,this.props.daiContract._address)
        console.log("CURRENT BRIDGE CONTRACT YOU NEED TO GET ABI FROM:",this.props.bridgeContract, this.state.daiAddress)
        const amountWei =  web3.utils.toWei(""+amount,"ether")

        if (this.props.network === "LeapTestnet" || this.props.network === "LeapMainnet") {
          const allowance = await daiContract.methods.allowance(
            this.state.daiAddress,
            bridgeContract._address
          ).call({from: this.state.daiAddress})

          if (new BN(allowance).lt(new BN(amountWei))) {
            this.setState({
              loaderBarColor:"#f5eb4a",
              loaderBarStatusText: "Approving token amount for Plasma bridge"
            })
            await pTx(
              daiContract.methods.approve(
                bridgeContract._address,
                amountWei
              ),
              ///TODO LET ME PASS IN A CERTAIN AMOUNT OF GAS INSTEAD OF LEANING BACK ON THE <GAS> COMPONENT!!!!!
              150000,
              0,
              0
            )
          }
        }

        this.setState({
          loaderBarColor:"#f5eb4a",
          loaderBarStatusText:message,
        })

        const depositReceipt = await pTx(
          bridgeContract.methods.deposit(
            this.state.daiAddress,
            amountWei,
            color,
          ),
          ///TODO LET ME PASS IN A CERTAIN AMOUNT OF GAS INSTEAD OF LEANING BACK ON THE <GAS> COMPONENT!!!!!
          200000,
          0,
          0
        )
        if (depositReceipt) {
          console.log("SESSION WITHDRAWN:",depositReceipt)
          cb(depositReceipt)
        }
      }
    }
  }
  canSendXdai() {
    console.log("canSendXdai",this.state.xdaiSendToAddress,this.state.xdaiSendToAddress.length,parseFloat(this.state.xdaiSendAmount),parseFloat(this.props.xdaiBalance))
    return (this.state.xdaiSendToAddress && this.state.xdaiSendToAddress.length === 42 && parseFloat(this.state.xdaiSendAmount)>0 && parseFloat(this.state.xdaiSendAmount) <= parseFloat(this.props.xdaiBalance))
  }

  async sendEth(){
    const {
      ethSendToAddress,
      mainnetMetaAccount,
      mainnetweb3,
      daiAddress
    } = this.state;
    const {
      address,
      ethprice,
      ethBalance,
      changeAlert,
      web3,
	  convertCurrency,
	  t
    } = this.props;
    let { ethSendAmount } = this.state;

    const displayCurrency = getStoredValue("currency", address);
    ethSendAmount = convertCurrency(ethSendAmount, `USD/${displayCurrency}`);
    let actualEthSendAmount = parseFloat(ethSendAmount)/parseFloat(ethprice)

    if(parseFloat(ethBalance)<actualEthSendAmount){
      changeAlert({type: 'warning',message: t('exchange.insufficient_funds')});
    }else if(!this.state.ethSendToAddress || !ethSendToAddress.length === 42){
      changeAlert({type: 'warning',message: t('exchange.invalid_to_address')});
    }else if(!(actualEthSendAmount>0)){
      changeAlert({type: 'warning',message: t('exchange.invalid_to_amount')});
    }else{
      this.setState({
        ethToDaiMode:"sending",
        ethBalanceAtStart:ethBalance,
        ethBalanceShouldBe:parseFloat(ethBalance)-actualEthSendAmount,
        loaderBarColor:"#f5eb4a",
        loaderBarStatusText: t('exchange.calculate_gas_price'),
        loaderBarPercent:0,
        loaderBarStartTime: Date.now(),
        loaderBarClick:()=>{
          alert(t('exchange.go_to_etherscan'))
        },
        sendEth: false
      })

      actualEthSendAmount = mainnetweb3.utils.toWei(""+Math.round(actualEthSendAmount*10000)/10000,'ether')

      let gwei;
      try {
        gwei = await price();
      } catch(err) {
        // TODO: Propagate error to user
        console.log("Error getting gas price",err)
      }

      if(gwei !== undefined){
        if (mainnetMetaAccount) {

          let paramsObject = {
            from: daiAddress,
            value: actualEthSendAmount,
            gas: 240000,
            gasPrice: Math.round(gwei * 1000000000),
            to: ethSendToAddress
          }
          console.log("====================== >>>>>>>>> paramsObject!!!!!!!",paramsObject)

          let signed = await mainnetweb3.eth.accounts.signTransaction(paramsObject, mainnetMetaAccount.privateKey)

          this.setState({
            ethToDaiMode:"sending",
            loaderBarStatusText: "Sending funds",
          })
          let receipt;
          try {
            receipt = await mainnetweb3.eth.sendSignedTransaction(signed.rawTransaction)
          } catch(err) {
            console.log("EEEERRRRRRRROOOOORRRRR ======== >>>>>",err)
            changeAlert({type: 'danger',message: err.toString()});
          }
          console.log(receipt);
        } else {
          this.setState({
            ethToDaiMode:"sending",
            loaderBarStatusText: "Sending funds",
          })
          await web3.eth.sendTransaction({
            from: daiAddress ,
            to: ethSendToAddress,
            value: actualEthSendAmount,
          })
        }
        changeAlert({type: "success", message: `Sent ${ethSendAmount} ETH to ${ethSendToAddress}...`});
        this.setState({
          ethToDaiMode:false,
          ethSendAmount:"",
          ethSendToAddress:"",
          loaderBarColor:"#FFFFFF",
          loaderBarStatusText:"",
        })
      } else {
        // TODO: Propagate this error to the user
        console.log("Couldn't get gas price");
      }
    }
  }
  canSendEth() {
    let actualEthSendAmount = parseFloat(this.state.ethSendAmount)/parseFloat(this.props.ethprice)
    return (this.state.ethSendToAddress && this.state.ethSendToAddress.length === 42 && actualEthSendAmount>0 && actualEthSendAmount <= parseFloat(this.props.ethBalance))
  }
  swapEth(destination,call,amount,message,cb){
    if(this.state.mainnetMetaAccount){
      //send funds using metaaccount on mainnet

      price()
      .catch((err)=>{
        console.log("Error getting gas price",err)
      })
      .then(gwei => {
        this.setState({
          loaderBarColor:"#f5eb4a",
          loaderBarStatusText:message,
        });

        let paramsObject = {
          from: this.state.daiAddress,
          value: amount,
          gas: 240000,
          gasPrice: Math.round(gwei * 1000000000)
        }
        console.log("====================== >>>>>>>>> paramsObject!!!!!!!",paramsObject)

        paramsObject.to = destination
        if(call){
          paramsObject.data = call.encodeABI()
        }else{
          paramsObject.data = "0x00"
        }

        console.log("TTTTTTTTTTTTTTTTTTTTTX",paramsObject)

        this.state.mainnetweb3.eth.accounts.signTransaction(paramsObject, this.state.mainnetMetaAccount.privateKey).then(signed => {
          console.log("========= >>> SIGNED",signed)
            this.state.mainnetweb3.eth.sendSignedTransaction(signed.rawTransaction).on('receipt', (receipt)=>{
              console.log("META RECEIPT",receipt)
              if(receipt&&receipt.transactionHash&&!metaReceiptTracker[receipt.transactionHash]){
                metaReceiptTracker[receipt.transactionHash] = true
                cb(receipt)
              }
            }).on('error', (err)=>{
              console.log("EEEERRRRRRRROOOOORRRRR ======== >>>>>",err)
              this.props.changeAlert({type: 'danger',message: err.toString()});
            }).then(console.log)
        });
      });
    }else{
      console.log("Using uniswap exchange to move ETH to DAI")


      //send funds using metamask (or other injected web3 ... should be checked and on mainnet)
      this.setState({
        amount:"",
        loaderBarColor:"#4ab3f5",
        loaderBarStatusText:message,
        loaderBarClick:()=>{
          alert(this.props.t('exchange.idk'));
        }
      })
      if(call){
        this.props.tx(
          call
        ,240000,0,amount,(receipt)=>{
          if(receipt){
            console.log("EXCHANGE COMPLETE?!?",receipt)
            cb(receipt)
          }
        })
      }else{
        this.props.send(
          destination,
          amount,
          240000,
          (err, receipt)=>{
          if(receipt){
            console.log("SEND COMPLETE?!?",receipt)
            cb(receipt)
          }
        })
      }

    }
  }
  render() {
    const { address, t } = this.props;
    let {daiToXdaiMode,ethToDaiMode } = this.state

    let ethCancelButton = <BorderButton className="btn-cancel" onClick={()=>{
          this.setState({ethToDaiAmount:"",ethToDaiMode:false})
        }}>
      <i className="fas fa-times"/> {t('cancel')}
    </BorderButton>

    let daiCancelButton =
      <BorderButton className="btn-cancel" onClick={()=>{
        this.setState({daiToXdaiAmount:"",daiToXdaiMode:false})
      }}>
        <i className="fas fa-times"/> {t('cancel')}
      </BorderButton>

    let buttonsDisabled = (
      daiToXdaiMode==="sending" || daiToXdaiMode==="withdrawing" || daiToXdaiMode==="depositing" ||
      ethToDaiMode==="sending" || ethToDaiMode==="depositing" || ethToDaiMode==="withdrawing"
    )

    let adjustedFontSize = Math.round((Math.min(document.documentElement.clientWidth,600)/600)*24)
    let adjustedTop = Math.round((Math.min(document.documentElement.clientWidth,600)/600)*-20)+9

    let daiToXdaiDisplay =  t('loading')

    //console.log("daiToXdaiMode",daiToXdaiMode)
    if(daiToXdaiMode==="sending" || daiToXdaiMode==="withdrawing" || daiToXdaiMode==="depositing"){
      daiToXdaiDisplay = (
        <div className="content ops row" style={{position:"relative"}}>
          <button style={{width:Math.min(100,this.state.loaderBarPercent)+"%",backgroundColor:this.state.loaderBarColor,color:"#000000"}}
            className="btn btn-large"
          >
          </button>
          <div style={{position:'absolute',left:"50%",width:"100%",marginLeft:"-50%",fontSize:adjustedFontSize,top:adjustedTop,opacity:0.95,textAlign:"center"}}>
            {this.state.loaderBarStatusText}
          </div>
        </div>
      )

    }else if(daiToXdaiMode==="deposit"){
      // if(!this.state.mainnetMetaAccount && this.props.network!==="Mainnet"){
      //   daiToXdaiDisplay = (
      //     <div className="content ops row" style={{textAlign:'center'}}>
      //       <div className="col-12 p-1">
      //         Error: MetaMask network must be: <span style={{fontWeight:"bold",marginLeft:5}}>Mainnet</span>
      //         <a href="#" onClick={()=>{this.setState({daiToXdaiMode:false})}} style={{marginLeft:40,color:"#666666"}}>
      //           <i className="fas fa-times"/> dismiss
      //         </a>
      //       </div>
      //     </div>
      //   )
      //}else
      if(this.props.ethBalance<=0){
        daiToXdaiDisplay = (
          <div className="content ops row" style={{textAlign:'center'}}>
            <div className="col-12 p-1">
              Error: You must have ETH to send DAI.
              <a href="#" onClick={()=>{this.setState({daiToXdaiMode:false})}} style={{marginLeft:40,color:"#666666"}}>
                <i className="fas fa-times"/> dismiss
              </a>
            </div>
          </div>
        )
      }else{
        daiToXdaiDisplay = (
          <div className="content ops row transfer-row">
            <div className="input-with-arrow">
              <i className="fas fa-arrow-up"  />
              <div className="input-group">
                <RInput
                  width={1}
                  type="number"
                  step="0.1"
                  placeholder={this.props.currencyDisplay(0)}
                  value={this.state.daiToXdaiAmount}
                  onChange={event => this.updateState('daiToXdaiAmount', event.target.value)} />
              </div>
            </div>
            {daiCancelButton}
            <PrimaryButton
              className={"btn-send"}
              disabled={buttonsDisabled}
              onClick={()=>{
                let { daiToXdaiAmount } = this.state;
                const { convertCurrency } = this.props;
                console.log("AMOUNT:", daiToXdaiAmount,"DAI BALANCE:",this.props.daiBalance)

                this.setState({
                  daiToXdaiMode:"depositing",
                  xdaiBalanceAtStart:this.props.xdaiBalance,
                  xdaiBalanceShouldBe:parseFloat(this.props.xdaiBalance)+parseFloat(this.state.daiToXdaiAmount),
                  loaderBarColor:"#3efff8",
                  loaderBarStatusText: t('exchange.calculate_gas_price'),
                  loaderBarPercent:0,
                  loaderBarStartTime: Date.now(),
                  loaderBarClick:()=>{
                    alert(t('exchange.go_to_etherscan'))
                  }
                })

                const displayCurrency = getStoredValue("currency", address);
                let amount = convertCurrency(daiToXdaiAmount, `USD/${displayCurrency}`);
                // TODO: depositDai doesn't use the destination parameter anymore
                // Remove it.
                this.depositDai(null, amount, "Sending funds to bridge...", () => {
                  this.setState({
                    daiToXdaiAmount:"",
                    loaderBarColor:"#4ab3f5",
                    loaderBarStatusText:"Waiting for bridge...",
                    loaderBarClick:()=>{
                      alert(t('exchange.idk'))
                    }
                  })
                })
              }}>
              <i className="fas fa-arrow-up" /> Send
            </PrimaryButton>
          </div>
        )
      }
    } else if(daiToXdaiMode==="withdraw"){
      console.log("CHECKING META ACCOUNT ",this.state.xdaiMetaAccount,this.props.network)
      if(!this.state.xdaiMetaAccount && this.props.network!=="LeapTestnet"){
        daiToXdaiDisplay = (
          <div className="content ops row" style={{textAlign:'center'}}>
            <div className="col-12 p-1">
              Error: MetaMask network must be: <span style={{fontWeight:"bold",marginLeft:5}}>dai.poa.network</span>
              <a href="#" onClick={()=>{this.setState({daiToXdaiMode:false})}} style={{marginLeft:40,color:"#666666"}}>
                <i className="fas fa-times"/> dismiss
              </a>
            </div>
          </div>
        )
      }else{
        // TODO: Isn't this exactly the wrong name?
        daiToXdaiDisplay = (
          <div className="content ops row transfer-row">
            <div className="input-with-arrow">
              <i className="fas fa-arrow-down"  />
              <div className="input-group">
                <RInput
                  width={1}
                  type="number"
                  step="0.1"
                  placeholder={this.props.currencyDisplay(0)}
                  value={this.state.daiToXdaiAmount}
                  onChange={event => this.updateState('daiToXdaiAmount', event.target.value)} />
              </div>
            </div>
            {daiCancelButton}
            <PrimaryButton className={"btn-send"} disabled={buttonsDisabled} onClick={async ()=>{
                const { convertCurrency } = this.props;
                let { daiToXdaiAmount } = this.state;

                // First we convert from the current display value and
                const displayCurrency = getStoredValue("currency", address);
                let amount = convertCurrency(daiToXdaiAmount, `USD/${displayCurrency}`);

                // Then we convert that value to wei
                amount = bi(amount * 10 ** 18);

                 this.setState({
                  // NOTE: Technically we're not "depositing" but that was the
                  // only way I was able to make the loading bar show up...
                  daiToXdaiMode:"depositing",
                  loaderBarStatusText: t('exchange.fast_exit_swap'),
                  loaderBarColor:"#3efff8",
                  loaderBarPercent:30,
                  loaderBarStartTime: Date.now(),
                  loaderBarClick:()=>{
                    // noop
                  }
                })
                if(this.state.xdaiMetaAccount){
                  //send funds using metaaccount on xdai
                  const signer = {
                    signTx: (tx) => {
                      const privKeys = tx.inputs.map(_ => this.state.xdaiMetaAccount.privateKey);
                      return Promise.resolve(tx.sign(privKeys));
                    },
                    signMessage: (msg) => {
                      const { signature } = this.state.xdaiweb3.eth.accounts.sign(msg, this.state.xdaiMetaAccount.privateKey);
                      const { r, s, v } = fromRpcSig(signature);
                      return Promise.resolve(
                        { r, s, v, signer: this.state.daiAddress }
                      );
                    }
                  };

                  const tokenAddr = this.props.pdaiContract._address;
                  const color = await this.state.xdaiweb3.getColor(tokenAddr);

                  Exit.fastSellAmount(
                    this.state.daiAddress,
                    amount,
                    color,
                    this.state.xdaiweb3,
                    this.props.web3,
                    `${CONFIG.SIDECHAIN.MARKET_MAKER}/sellExit`,
                    signer,
                  ).then(rsp => {
                    console.log(rsp);
                    this.updatePendingExits(this.state.daiAddress, this.state.xdaiweb3);
                    this.setState({
                      loaderBarStatusText: t('exchange.fast_exit_patience'),
                      loaderBarPercent:75,
                      loaderBarStartTime: Date.now(),
                      loaderBarClick:()=>{
                        // noop
                      }
                    })
                    this.setState({ daiToXdaiAmount: "", daiToXdaiMode: false });
                    this.props.changeAlert({
                      type: "success",
                      message: t("exchange.fast_exit_patience")
                    });
                  }).catch(err => {
                    console.log(err);
                    this.props.changeAlert({
                      type: 'warning',
                      message: 'Failed to exit PDAI'
                    });
                  });
                }else{
                  const tokenAddr = this.props.daiContract._address;

                  this.state.xdaiweb3.getColor(tokenAddr)
                    .then(color =>
                      Exit.fastSellAmount(
                        this.state.daiAddress,
                        amount,
                        color,
                        this.state.xdaiweb3,
                        this.props.web3,
                        `${CONFIG.SIDECHAIN.MARKET_MAKER}/sellExit`
                      )
                    ).then(rsp => {
                      console.log(rsp);
                      this.updatePendingExits(this.state.daiAddress, this.state.xdaiweb3);
                      this.props.changeAlert({
                        type: "success",
                        message: t("exchange.fast_exit_patience")
                      });
                      this.setState({
                        daiToXdaiAmount: "",
                        daiToXdaiMode: false
                      });
                    }).catch(err => {
                      console.log(err);
                    });
                  }
                }
              }>
              <i className="fas fa-arrow-down" /> Send
            </PrimaryButton>
          </div>
        )
      }
    } else {
      daiToXdaiDisplay = (
        <Flex width={1} px={3}>
          <PrimaryButton width={1} mr={2} icon={'ArrowUpward'} disabled={buttonsDisabled} onClick={()=>{
            this.setState({daiToXdaiMode:"deposit"})
          }} >
            <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
              DAI to PDAI
            </Scaler>
          </PrimaryButton>

          <PrimaryButton width={1}
            icon={'ArrowDownward'}
            disabled={
              buttonsDisabled ||
              parseFloat(this.props.xdaiBalance) === 0
            }
            onClick={()=>{
            this.setState({daiToXdaiMode:"withdraw"})
          }} >
            <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
              PDAI to DAI
            </Scaler>
          </PrimaryButton>
        </Flex>
      )
    }

    let ethToDaiDisplay =  t('loading')

    if(ethToDaiMode==="sending" || ethToDaiMode==="depositing" || ethToDaiMode==="withdrawing"){
      ethToDaiDisplay = (
        <div className="content ops row" style={{position:"relative"}}>
          <button style={{width:Math.min(100,this.state.loaderBarPercent)+"%",backgroundColor:this.state.loaderBarColor,color:"#000000"}}
            className="btn btn-large"
          >
          </button>
          <div style={{position:'absolute',left:"50%",width:"100%",marginLeft:"-50%",fontSize:adjustedFontSize,top:adjustedTop,opacity:0.95,textAlign:"center"}}>
            {this.state.loaderBarStatusText}
          </div>
        </div>
      )

    }else if(ethToDaiMode==="deposit"){

      if(this.props.ethBalance<=0){
        ethToDaiDisplay = (
          <div className="content ops row" style={{textAlign:'center'}}>
            <div className="col-12 p-1">
              Error: You don't have any ether
              <a href="#" onClick={()=>{this.setState({ethToDaiMode:false})}} style={{marginLeft:40,color:"#666666"}}>
                <i className="fas fa-times"/> dismiss
              </a>
            </div>
          </div>
        );
      }else {
        ethToDaiDisplay = (
          <div className="content ops row transfer-row">
            <div className="input-with-arrow">
              <i className="fas fa-arrow-up"  />
              <div className="input-group">
                <RInput
                  width={1}
                  type="number"
                  step="0.1"
                  placeholder={this.props.currencyDisplay(0)}
                  value={this.state.ethToDaiAmount}
                  onChange={event => this.updateState('ethToDaiAmount', event.target.value)} />
              </div>
            </div>
            {ethCancelButton}
            <PrimaryButton disabled={buttonsDisabled} onClick={async ()=>{
              console.log("Using uniswap exchange to move ETH to DAI")
              const { convertCurrency } = this.props;
              let { ethToDaiAmount } = this.state;

              let webToUse = this.props.web3
              if(this.state.mainnetMetaAccount){
                webToUse = this.state.mainnetweb3
              }

              // TODO: Error: Returned values aren't valid, did it run Out of Gas?
              const displayCurrency = getStoredValue("currency", address);
              let amount = convertCurrency(ethToDaiAmount, `USD/${displayCurrency}`);

              console.log("AMOUNT:", amount, "DAI BALANCE:", this.props.daiBalance)

              let uniswapContract = new webToUse.eth.Contract(uniswapContractObject.abi,uniswapContractObject.address)
              console.log(uniswapContract)

              let amountOfEth = amount / this.props.ethprice
              amountOfEth = webToUse.utils.toWei(""+Math.round(amountOfEth*10000)/10000,'ether')
              console.log("amountOfEth",amountOfEth)

              let output = await uniswapContract.methods.getTokenToEthOutputPrice(amountOfEth).call()
              output = parseFloat(output)
              output = output - (output*0.0333)
              console.log("Expected amount of DAI: ",webToUse.utils.fromWei(""+Math.round(output),'ether'))

              let currentBlockNumber = await webToUse.eth.getBlockNumber()
              let currentBlock = await webToUse.eth.getBlock(currentBlockNumber)
              let timestamp = currentBlock.timestamp
              console.log("timestamp",timestamp)

              let deadline = timestamp+600
              let mintokens = output
              console.log("ethToTokenSwapInput",mintokens,deadline)

              let amountOfChange = parseFloat(webToUse.utils.fromWei(""+mintokens,'ether'))

              this.setState({
                ethToDaiMode:"depositing",
                loaderBarColor:"#3efff8",
                loaderBarStatusText: t('exchange.calculate_gas_price'),
                loaderBarPercent:0,
                loaderBarStartTime: Date.now(),
                loaderBarClick:()=>{
                  alert(t('exchange.go_to_etherscan'))
                }
              })

              this.setState({
                daiBalanceAtStart:this.props.daiBalance,
                daiBalanceShouldBe:parseFloat(this.props.daiBalance)+amountOfChange,
              })


              ///TRANSFER ETH
              this.swapEth(
                uniswapContract._address,
                uniswapContract.methods.ethToTokenSwapInput(""+mintokens,""+deadline),
                amountOfEth,
                "Sending funds to 🦄 exchange...",
                (receipt)=>{
                  this.setState({
                    ethToDaiAmount:"",
                    loaderBarColor:"#4ab3f5",
                    loaderBarStatusText:"Waiting for 🦄 exchange...",
                    loaderBarClick:()=>{
                      alert(t('exchange.idk'))
                    }
                  })
                }
              )
            }}>
              <i className="fas fa-arrow-up" /> Send
            </PrimaryButton>
          </div>
        )
      }

    }else if(ethToDaiMode==="withdraw"){
      if(this.props.ethBalance<=0){
        ethToDaiDisplay = (
          <div className="content ops row" style={{textAlign:'center'}}>
            <div className="col-12 p-1">
              Error: You must have ETH to send DAI.
              <a href="#" onClick={()=>{this.setState({ethToDaiMode:false})}} style={{marginLeft:40,color:"#666666"}}>
                <i className="fas fa-times"/> dismiss
              </a>
            </div>
          </div>
        )
      }else{
        ethToDaiDisplay = (
          <div className="content ops row transfer-row">
            <div className="input-with-arrow">
            <i className="fas fa-arrow-down"  />
              <div className="input-group">
                <RInput
                  width={1}
                  type="number"
                  step="0.1"
                  placeholder={this.props.currencyDisplay(0)}
                  value={this.state.ethToDaiAmount}
                  onChange={event => this.updateState('ethToDaiAmount', event.target.value)} />
              </div>
            </div>
            {ethCancelButton}
            <PrimaryButton className="btn-send" disabled={buttonsDisabled} onClick={async ()=>{
              console.log("Using uniswap exchange to move DAI to ETH")
              const { convertCurrency } = this.props;
              let { ethToDaiAmount } = this.state;

              let webToUse = this.props.web3
              if(this.state.mainnetMetaAccount){
                webToUse = this.state.mainnetweb3
              }

              const displayCurrency = getStoredValue("currency", address);
              let amount = convertCurrency(ethToDaiAmount, `USD/${displayCurrency}`);

              console.log("AMOUNT:", amount, "ETH BALANCE:", this.props.ethBalance)

              let uniswapContract = new webToUse.eth.Contract(uniswapContractObject.abi,uniswapContractObject.address)
              console.log(uniswapContract)

              let amountOfDai = webToUse.utils.toWei(""+amount,'ether')
              console.log("amountOfDai",amountOfDai)

              let output = await uniswapContract.methods.getEthToTokenOutputPrice(amountOfDai).call()
              output = parseFloat(output)
              output = output - (output*0.0333)
              console.log("Expected amount of ETH: ",output,webToUse.utils.fromWei(""+Math.round(output),'ether'))

              let currentBlockNumber = await webToUse.eth.getBlockNumber()
              let currentBlock = await webToUse.eth.getBlock(currentBlockNumber)
              let timestamp = currentBlock.timestamp
              console.log("timestamp",timestamp)

              let deadline = timestamp+600
              let mineth = parseInt(output);
              console.log("tokenToEthSwapInput",amountOfDai,mineth,deadline)

              let amountOfChange = parseFloat(webToUse.utils.fromWei(""+mineth,'ether'))
              console.log("ETH should change by ",amountOfChange)

              let eventualEthBalance = parseFloat(this.props.ethBalance)+parseFloat(amountOfChange)
              console.log("----- WATCH FOR ETH BALANCE TO BE ",eventualEthBalance)

              this.setState({
                ethToDaiMode:"withdrawing",
                loaderBarColor:"#3efff8",
                loaderBarStatusText: t('exchange.calculate_gas_price'),
                loaderBarPercent:0,
                loaderBarStartTime: Date.now(),
                loaderBarClick:()=>{
                  alert(t('exchange.go_to_etherscan'))
                }
              })

              let approval = await this.props.daiContract.methods.allowance(this.state.daiAddress,CONFIG.ROOTCHAIN.UNISWAP.DAI_ETH_ADDRESS).call()

              if(this.state.mainnetMetaAccount){
                //send funds using metaaccount on mainnet

                price()
                  .catch((err)=>{
                    console.log("Error getting gas price",err)
                  })
                  .then(gwei => {
                    if(approval<amountOfDai){
                      console.log("approval",approval)
                      this.setState({
                        loaderBarColor:"#f5eb4a",
                        loaderBarStatusText:"Approving 🦄 exchange...",
                      })

                      let paramsObject = {
                        from: this.state.daiAddress,
                        value: 0,
                        gas: 100000,
                        gasPrice: Math.round(gwei * 1000000000)
                      }
                      console.log("====================== >>>>>>>>> paramsObject!!!!!!!",paramsObject)

                      paramsObject.to = this.props.daiContract._address
                      paramsObject.data = this.props.daiContract.methods.approve(CONFIG.ROOTCHAIN.UNISWAP.DAI_ETH_ADDRESS,""+(amountOfDai)).encodeABI()

                      console.log("APPROVE TTTTTTTTTTTTTTTTTTTTTX",paramsObject)

                      this.state.mainnetweb3.eth.accounts.signTransaction(paramsObject, this.state.mainnetMetaAccount.privateKey).then(signed => {
                        console.log("========= >>> SIGNED",signed)
                        this.state.mainnetweb3.eth.sendSignedTransaction(signed.rawTransaction).on('receipt', async (receipt)=>{
                          console.log("META RECEIPT",receipt)
                          if(receipt&&receipt.transactionHash&&!metaReceiptTracker[receipt.transactionHash]){
                            metaReceiptTracker[receipt.transactionHash] = true
                            this.setState({
                              loaderBarColor:"#4ab3f5",
                              loaderBarStatusText:"Waiting for 🦄 exchange...",
                              ethBalanceAtStart:this.props.ethBalance,
                              ethBalanceShouldBe:eventualEthBalance,
                            })

                            let manualNonce = await this.state.mainnetweb3.eth.getTransactionCount(this.state.daiAddress)
                            console.log("manually grabbed nonce as ",manualNonce)
                            paramsObject = {
                              nonce: manualNonce,
                              from: this.state.daiAddress,
                              value: 0,
                              gas: 240000,
                              gasPrice: Math.round(gwei * 1000000000)
                            }
                            console.log("====================== >>>>>>>>> paramsObject!!!!!!!",paramsObject)

                            paramsObject.to = uniswapContract._address
                            paramsObject.data = uniswapContract.methods.tokenToEthSwapInput(""+amountOfDai,""+mineth,""+deadline).encodeABI()

                            console.log("TTTTTTTTTTTTTTTTTTTTTX",paramsObject)

                            this.state.mainnetweb3.eth.accounts.signTransaction(paramsObject, this.state.mainnetMetaAccount.privateKey).then(signed => {
                              console.log("========= >>> SIGNED",signed)
                              this.state.mainnetweb3.eth.sendSignedTransaction(signed.rawTransaction).on('receipt', (receipt)=>{
                                console.log("META RECEIPT",receipt)
                                if(receipt&&receipt.transactionHash&&!metaReceiptTracker[receipt.transactionHash]){
                                  metaReceiptTracker[receipt.transactionHash] = true
                                  this.setState({
                                    ethToDaiAmount:"",
                                  })
                                }
                              }).on('error', (err)=>{
                                console.log("EEEERRRRRRRROOOOORRRRR ======== >>>>>",err)
                                this.props.changeAlert({type: 'danger',message: err.toString()});
                              }).then(console.log)
                            });
                          }
                        }).on('error', (err)=>{
                          this.props.changeAlert({type: 'danger',message: err.toString()});
                          console.log("EEEERRRRRRRROOOOORRRRR ======== >>>>>",err)
                        }).then(console.log)
                      });

                    }else{
                      this.setState({
                        loaderBarColor:"#f5eb4a",
                        loaderBarStatusText:"Waiting for 🦄 exchange...",
                        ethBalanceAtStart:this.props.ethBalance,
                        ethBalanceShouldBe:eventualEthBalance,
                      })

                      let paramsObject = {
                        from: this.state.daiAddress,
                        value: 0,
                        gas: 240000,
                        gasPrice: Math.round(gwei * 1000000000)
                      }
                      console.log("====================== >>>>>>>>> paramsObject!!!!!!!",paramsObject)

                      paramsObject.to = uniswapContract._address
                      paramsObject.data = uniswapContract.methods.tokenToEthSwapInput(""+amountOfDai,""+mineth,""+deadline).encodeABI()

                      console.log("TTTTTTTTTTTTTTTTTTTTTX",paramsObject)

                      this.state.mainnetweb3.eth.accounts.signTransaction(paramsObject, this.state.mainnetMetaAccount.privateKey).then(signed => {
                        console.log("========= >>> SIGNED",signed)
                        this.state.mainnetweb3.eth.sendSignedTransaction(signed.rawTransaction).on('receipt', (receipt)=>{
                          console.log("META RECEIPT",receipt)
                          if(receipt&&receipt.transactionHash&&!metaReceiptTracker[receipt.transactionHash]){
                            metaReceiptTracker[receipt.transactionHash] = true
                            this.setState({
                              ethToDaiAmount:"",
                              loaderBarColor:"#4ab3f5",
                            })
                          }
                        }).on('error', (err)=>{
                          console.log("EEEERRRRRRRROOOOORRRRR ======== >>>>>",err)
                          this.props.changeAlert({type: 'danger',message: err.toString()});
                        }).then(console.log)
                      });

                    }
                  });
              }else{
                console.log("Using uniswap exchange to move ETH to DAI")



                if(approval<amountOfDai){
                  console.log("approval",approval)

                  //send funds using metamask (or other injected web3 ... should be checked and on mainnet)
                  this.setState({
                    ethToDaiAmount:"",
                    loaderBarColor:"#42ceb2",
                    loaderBarStatusText:"Approving 🦄 exchange...",
                    loaderBarClick:()=>{
                      alert(t('exchange.idk'))
                    }
                  })

                  let metaMaskDaiContract = new this.props.web3.eth.Contract(this.props.daiContract._jsonInterface,this.props.daiContract._address)

                  this.props.tx(
                    metaMaskDaiContract.methods.approve(CONFIG.ROOTCHAIN.UNISWAP.DAI_ETH_ADDRESS,""+(amountOfDai))//do 1000x so we don't have to waste gas doing it again
                    ,100000,0,0,(receipt)=>{
                      if(receipt){
                        console.log("APPROVE COMPLETE?!?",receipt)
                        this.setState({
                          ethToDaiAmount:"",
                          ethBalanceAtStart:this.props.ethBalance,
                          ethBalanceShouldBe:eventualEthBalance,
                          loaderBarColor:"#4ab3f5",
                          loaderBarStatusText:"Sending funds to 🦄 Exchange...",
                          loaderBarClick:()=>{
                            alert(t('exchange.idk'))
                          }
                        })

                        this.props.tx(
                          uniswapContract.methods.tokenToEthSwapInput(""+amountOfDai,""+mineth,""+deadline)
                          ,240000,0,0,(receipt)=>{
                            if(receipt){
                              console.log("EXCHANGE COMPLETE?!?",receipt)
                              //window.location = "/"+receipt.contractAddress
                            }
                          })
                        //window.location = "/"+receipt.contractAddress
                      }
                    })
                }else{
                  this.setState({
                    ethToDaiAmount:"",
                    ethBalanceAtStart:this.props.ethBalance,
                    ethBalanceShouldBe:eventualEthBalance,
                    loaderBarColor:"#4ab3f5",
                    loaderBarStatusText:"Sending funds to 🦄 Exchange...",
                    loaderBarClick:()=>{
                      alert(t('exchange.idk'))
                    }
                  })

                  this.props.tx(
                    uniswapContract.methods.tokenToEthSwapInput(""+amountOfDai,""+mineth,""+deadline)
                    ,240000,0,0,(receipt)=>{
                      if(receipt){
                        console.log("EXCHANGE COMPLETE?!?",receipt)
                        //window.location = "/"+receipt.contractAddress
                      }
                    })
                }



                //(0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359).approve(address guy, uint256 wad)
                //tokenToEthSwapInput(uint256 tokens_sold, uint256 min_eth, uint256 deadline)
                /*this.props.tx(
                  uniswapContract.methods.tokenToEthSwapInput(""+amountOfDai,""+mineth,""+deadline)
                ,240000,0,0,(receipt)=>{
                  if(receipt){
                    console.log("EXCHANGE COMPLETE?!?",receipt)
                    //window.location = "/"+receipt.contractAddress
                  }
                })*/
              }


            }}>
              <i className="fas fa-arrow-down" /> Send
            </PrimaryButton>
          </div>
        )
      }

    }else{
      ethToDaiDisplay = (
        <Flex width={1} px={3}>
          <PrimaryButton width={1} mr={2} icon={'ArrowUpward'} disabled={buttonsDisabled} onClick={()=>{
            this.setState({ethToDaiMode:"deposit"})
          }}>
            <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
              ETH to DAI
            </Scaler>
          </PrimaryButton>
          <PrimaryButton width={1} icon={'ArrowDownward'} disabled={buttonsDisabled} onClick={()=>{
           this.setState({ethToDaiMode:"withdraw"})
          }}>
            <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
              DAI to ETH
            </Scaler>
        </PrimaryButton>
        </Flex>
       )

    }

    let sendDaiButton = (
      <OutlineButton
        width={1}
        icon={'ArrowForward'}
        icononly
        disabled={buttonsDisabled}
        onClick={()=>{
        this.setState({sendDai:true})}}
      />
    )

    //style={{marginTop:40,backgroundColor:this.props.mainStyle.mainColor}}
    let sendDaiRow = ""
    if(this.state.sendDai){
      sendDaiRow = (
        <Box
          border={1}
          borderColor={'grey'}
          borderRadius={1}
          my={3}
          p={3}
        >
          <Field label={'To Address'} mb={3}>
            <RInput
              type="text"
              placeholder="0x..."
              value={this.state.daiSendToAddress}
              onChange={event => this.updateState('daiSendToAddress', event.target.value)}
              width={1}
            />
          </Field>
          <div>
            { this.state.daiSendToAddress && this.state.daiSendToAddress.length===42 && <Blockies seed={this.state.daiSendToAddress.toLowerCase()} scale={10} /> }
          </div>
          <Field label={'Send Amount'} mb={3}>
            <Flex>
              <RInput
                type="number"
                step="0.1"
                placeholder={this.props.currencyDisplay(0)}
                value={this.state.daiSendAmount}
                onChange={event => this.updateState('daiSendAmount', event.target.value)}
                width={1}
              />
              <OutlineButton
                ml={2}
                onClick={() => {
                  this.setState({
                    daiSendAmount: Math.floor((this.props.daiBalance)*100)/100
                  },
                  () => {
                    this.setState({
                      canSendDai: this.canSendDai(),
                      canSendEth: this.canSendEth(),
                      canSendXdai: this.canSendXdai()
                    })
                  })
                }}
              >
                max
              </OutlineButton>
            </Flex>
          </Field>
          <PrimaryButton width={1} disabled={buttonsDisabled} onClick={this.sendDai.bind(this)}>
            Send
          </PrimaryButton>
        </Box>
      )
      sendDaiButton = (
        <button className="btn btn-large w-100" style={{backgroundColor:"#888888",whiteSpace:"nowrap"}} onClick={()=>{
          this.setState({sendDai:false})
        }}>
          <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
            <i className="fas fa-times"></i>
          </Scaler>
        </button>
      )
    }

    let sendEthButton = (
      <OutlineButton
        width={1}
        icon={'ArrowForward'}
        icononly
        disabled={buttonsDisabled}
        onClick={()=>{this.setState({sendEth:true})}}
      />
    )


    let sendEthRow = ""
    if(this.state.sendEth){
      sendEthRow = (
        <Box
          border={1}
          borderColor={'grey'}
          borderRadius={1}
          my={3}
          p={3}
        >
          <Field label={'To Address'} mb={3}>
            <RInput
              type="text"
              placeholder="0x..."
              value={this.state.ethSendToAddress}
              onChange={event => this.updateState('ethSendToAddress', event.target.value)}
              width={1}
            />
          </Field>
          <div>
            { this.state.ethSendToAddress && this.state.ethSendToAddress.length===42 && <Blockies seed={this.state.ethSendToAddress.toLowerCase()} scale={10} /> }
          </div>
          <Field label={'Send Amount'} mb={3}>
            <Flex>
              <RInput
                type="number"
                step="0.1"
                placeholder={this.props.currencyDisplay(0)}
                value={this.state.ethSendAmount}
                onChange={event => this.updateState('ethSendAmount', event.target.value)}
                width={1}
              />
              <OutlineButton
                ml={2}
                onClick={() => {
                  console.log("Getting gas price...")
                  price()
                  .catch((err)=>{
                    console.log("Error getting gas price",err)
                  })
                  .then(gwei => {
                     console.log(gwei)

                     // TODO: Rewrite this...
                     let IDKAMOUNTTOLEAVE = gwei*(1111000000*2) * 201000 // idk maybe enough for a couple transactions?

                     console.log("let's leave ",IDKAMOUNTTOLEAVE,this.props.ethBalance)

                     let gasInEth = this.props.web3.utils.fromWei(""+IDKAMOUNTTOLEAVE,'ether')
                     console.log("gasInEth",gasInEth)

                     let adjustedEthBalance = (parseFloat(this.props.ethBalance) - parseFloat(gasInEth))
                     console.log(adjustedEthBalance)

                     this.setState({ethSendAmount: Math.floor(this.props.ethprice*adjustedEthBalance*100)/100 },()=>{
                       this.setState({ canSendDai: this.canSendDai(), canSendEth: this.canSendEth(), canSendXdai: this.canSendXdai() })
                     })
                  })
              }}
              >
                max
              </OutlineButton>
            </Flex>
          </Field>
          <PrimaryButton width={1} disabled={buttonsDisabled} onClick={this.sendEth.bind(this)}>
            Send
          </PrimaryButton>
        </Box>
      )
      sendEthButton = (
        <button className="btn btn-large w-100" style={{backgroundColor:"#888888",whiteSpace:"nowrap"}} onClick={()=>{
          this.setState({sendEth:false})
        }}>
          <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
            <i className="fas fa-times"></i>
          </Scaler>
        </button>
      )
    }


    let sendXdaiButton = (
      <OutlineButton
        width={1}
        icon={'ArrowForward'}
        icononly
        disabled={buttonsDisabled}
        onClick={() => this.props.goBack("send_to_address")}
      />
    )

    let sendXdaiRow = ""
    if(this.state.sendXdai){
      sendXdaiRow = (
        <Box
          border={1}
          borderColor={'grey'}
          borderRadius={1}
          my={3}
          p={3}
        >
          <Field label={'To Address'} mb={3}>
            <RInput
              type="text"
              className="form-control"
              placeholder="0x..."
              value={this.state.xdaiSendToAddress}
              onChange={event => this.updateState('xdaiSendToAddress', event.target.value)}
            />
          </Field>
          <div>
            { this.state.xdaiSendToAddress && this.state.xdaiSendToAddress.length===42 && <Blockies seed={this.state.xdaiSendToAddress.toLowerCase()} scale={10} /> }
          </div>
          <Field label={'Send Amount'} mb={3}>
            <Flex>
              <RInput
                type="number"
                step="0.1"
                className="form-control"
                placeholder={this.props.currencyDisplay(0)}
                value={this.state.xdaiSendAmount}
                onChange={event => this.updateState('xdaiSendAmount', event.target.value)}
              />
              <OutlineButton
                ml={2}
                onClick={() => {
                  this.setState({xdaiSendAmount: Math.floor((this.props.xdaiBalance-0.01)*100)/100 },()=>{
                    this.setState({ canSendDai: this.canSendDai(), canSendEth: this.canSendEth(), canSendXdai: this.canSendXdai() })
                  })
                }}
              >
                max
              </OutlineButton>
            </Flex>
          </Field>

          <PrimaryButton width={1} disabled={buttonsDisabled} onClick={this.sendXdai.bind(this)}>
            Send
          </PrimaryButton>
        </Box>
      )
      sendXdaiButton = (
        <button className="btn btn-large w-100" style={{backgroundColor:"#888888",whiteSpace:"nowrap"}} onClick={()=>{
          this.setState({sendXdai:false})
        }}>
          <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
            <i className="fas fa-times"></i>
          </Scaler>
        </button>
      )
    }

    //console.log("eth price ",this.props.ethBalance,this.props.ethprice)
    return (
      <Box mt={4}>
        {this.state.pendingMsg && <div style={{
          padding: '10px', backgroundColor: 'orange', textAlign: 'center'
        }}>{this.state.pendingMsg}</div> }


          <div className="content ops row" style={{paddingBottom:20}}>
            <div className="col-2 p-1">
              <img style={logoStyle} src={this.props.xdai} alt="" />
            </div>
            <div className="col-3 p-1" style={{marginTop:8}}>
              PDAI
            </div>
            <div className="col-4 p-1" style={{marginTop:8,whiteSpace:"nowrap"}}>
                <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
                  {this.props.currencyDisplay(this.props.xdaiBalance)}
                </Scaler>
            </div>
            <div className="col-3 p-1" style={{marginTop:8}}>
              {sendXdaiButton}
            </div>

          </div>
          {sendXdaiRow}

        <div className="main-card card w-100">
          {daiToXdaiDisplay}
        </div>



          <div className="content ops row" style={{paddingBottom:20}}>
            <div className="col-2 p-1">
              <img style={logoStyle} src={this.props.dai} alt="dai" />
            </div>
            <div className="col-3 p-1" style={{marginTop:9}}>
              DAI
            </div>
            <div className="col-4 p-1" style={{marginTop:9,whiteSpace:"nowrap"}}>
              <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
                {this.props.currencyDisplay(this.props.daiBalance)}
              </Scaler>
            </div>
            <div className="col-3 p-1" style={{marginTop:8}}>
              {sendDaiButton}
            </div>
          </div>
          {sendDaiRow}


        <div className="main-card card w-100">
          {ethToDaiDisplay}
        </div>


          <div className="content ops row" style={{paddingBottom:20}}>
            <div className="col-2 p-1">
              <img style={logoStyle} src={this.props.eth} alt="eth" />
            </div>
            <div className="col-3 p-1" style={{marginTop:10}}>
              ETH
            </div>
            <div className="col-4 p-1" style={{marginTop:10,whiteSpace:"nowrap"}}>
              <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
                {this.props.currencyDisplay(this.props.ethBalance*this.props.ethprice)}
              </Scaler>
            </div>
            <div className="col-3 p-1" style={{marginTop:8}}>
              {sendEthButton}
            </div>
          </div>

          {sendEthRow}

          <Ruler />

          <div className="content ops row" style={{paddingBottom:20}}>
            <div className="col-2 p-1">
              <img style={logoStyle} src={bityLogo} alt="bity logo" />
            </div>
            <div className="col-10 p-1" style={{marginTop:10}}>
            <PrimaryButton
              width={1}
              mr={2}
              icon={'ArrowForward'}
              disabled={buttonsDisabled}
              onClick={()=>{
                this.props.changeView("cashout");
            }}>
              <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
              {t("offramp.account")}
              </Scaler>
            </PrimaryButton>
           </div>
        </div>
      </Box>
    )
  }
}
export default withTranslation()(Exchange);
/* eslint-disable jsx-a11y/anchor-is-valid */

import React from 'react';
import {CopyToClipboard} from "react-copy-to-clipboard";
import RecentTransactions from './RecentTransactions';
import i18n from '../i18n';
import config from "../config.json";

import {
  Flex,
  Box,
  PublicAddress,
  QR as QRCode
} from 'rimble-ui'

export default class Receive extends React.Component {

  render() {
    let {
      view,
      buttonStyle,
      ERC20TOKEN,
      address,
      changeAlert,
      changeView,
      dollarDisplay,
    } = this.props

    return (
      <div>
        <div>
          <CopyToClipboard text={address} onCopy={() => {
            changeAlert({type: 'success', message: i18n.t('receive.address_copied')})
          }}>
            <Box>
              <Flex flexDirection={'column'} alignItems={'center'} p={3} border={1} borderColor={'grey'} borderRadius={1}>
                <QRCode value={address} size={'100%'} renderAs={'svg'} />
              </Flex>
              <Box mt={3}>
                <PublicAddress address={address} />
              </Box>
            </Box>
          </CopyToClipboard>
          <div style={{width:"100%",textAlign:'center',padding:20}}>
            <a href={config.explorer.url + "address/" + address} target="_blank" rel="noopener noreferrer">
              View on {config.explorer.name}
            </a>
          </div>

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
        <div name="theVeryBottom" className="text-center bottom-text">
          <span style={{padding:10}}>
            <a href="#" style={{color:"#FFFFFF"}} onClick={()=>{this.props.goBack()}}>
              <i className="fas fa-times"/> {i18n.t('cancel')}
            </a>
          </span>
        </div>
      </div>
    )
  }
}

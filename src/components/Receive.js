/* eslint-disable jsx-a11y/anchor-is-valid */

import React from 'react';
import {CopyToClipboard} from "react-copy-to-clipboard";
import RecentTransactions from './RecentTransactions';
import { withTranslation, Trans } from 'react-i18next';
import getConfig from "../config";
import {
  Flex,
  Box,
  PublicAddress,
  QR as QRCode
} from 'rimble-ui'

const CONFIG = getConfig();

class Receive extends React.Component {

  render() {
    let {
      view,
      buttonStyle,
      address,
      changeAlert,
      changeView,
	  currencyDisplay,
	  t
    } = this.props

    return (
      <div>
        <div>
          <CopyToClipboard text={address} onCopy={() => {
            changeAlert({type: 'success', message: t('receive.address_copied')})
          }}>
            <Box>
              <Flex flexDirection={'column'} alignItems={'center'} p={3} border={1} borderColor={'grey'} borderRadius={1}>
                <QRCode className="qr-code" value={address} size={'100%'} renderAs={'svg'} />
              </Flex>
              <Box mt={3}>
                <PublicAddress address={address} />
              </Box>
            </Box>
          </CopyToClipboard>
          <div style={{width:"100%",textAlign:'center',padding:20}}>
			<Trans i18nKey="receive.view_link">
				<a href={CONFIG.SIDECHAIN.EXPLORER.URL + "address/" + address} target="_blank" rel="noopener noreferrer">
					View on {CONFIG.SIDECHAIN.EXPLORER.NAME}
				</a>
			</Trans>
          </div>

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
        <div name="theVeryBottom" className="text-center bottom-text">
          <span style={{padding:10}}>
            <a href="#" style={{color:"#FFFFFF"}} onClick={()=>{this.props.goBack()}}>
              <i className="fas fa-times"/> {t('cancel')}
            </a>
          </span>
        </div>
      </div>
    )
  }
}

export default withTranslation()(Receive);
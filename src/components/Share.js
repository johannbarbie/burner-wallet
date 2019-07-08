import React from 'react';
import { CopyToClipboard } from "react-copy-to-clipboard";
import { withTranslation } from 'react-i18next';
import {
  Flex,
  Box,
  Input,
  QR as QRCode
} from 'rimble-ui'

class Receive extends React.Component {

  render() {
    let {
      changeAlert,
      url,
      t
    } = this.props

    return (
      <div>
        <CopyToClipboard text={url} onCopy={() => {
          changeAlert({type: 'success', message: t('share.copied')})
        }}>
          <Box>
            <Flex flexDirection={'column'} alignItems={'center'} p={3} border={1} borderColor={'grey'} borderRadius={1}>
              <QRCode className="qr-code" value={url} size={'100%'} renderAs={'svg'} />
            </Flex>
            <Box mt={3}>
              <Input type='url' readOnly value={url} width={1} />
            </Box>
          </Box>
        </CopyToClipboard>
      </div>
    )
  }
}

export default withTranslation()(Receive)

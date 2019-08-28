// @format

import React, { Component } from "react";
import { withTranslation } from 'react-i18next';
import { Flex, Box, Image, Icon } from "rimble-ui";
import { getOrder } from "../services/bity";
import Blockies from "react-blockies";
import bityLogo from "../assets/bity.png";
import Ruler from "./Ruler";
import Loader from "./Loader";
import burnerlogo from "../assets/burnerwallet.png";

class BityHistory extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  async componentDidMount() {
    const { orderId } = this.props;
    const order = await getOrder(orderId);
    this.setState({ order });
  }

  render() {
    const { address, orderId, t } = this.props;
    const { order } = this.state;

    if (order) {
      return (
        <div>
          <Flex>
            <Box width={1 / 5}>
              <Blockies seed={address} scale={4} />
            </Box>
            <Box pl="55px" width={1 / 5}>
              <Icon name="ArrowForward" />
            </Box>
            <Box style={{ textAlign: "center" }} width={1 / 5}>
              {order.output.amount}
              €*
            </Box>
            <Box pl="55px" width={1 / 5}>
              <Icon name="ArrowForward" />
            </Box>
            <Box width={1 / 5}>
              <Image
                src={bityLogo}
                height={"30px"}
                ml="3em"
                width="auto"
                bg="transparent"
              />
            </Box>
          </Flex>
          <Ruler />
          <h5>{t("offramp.history.status_title")}</h5>
          <ul style={{ listStyle: "none", paddingLeft: 0 }}>
            {order.timestamp_created && (
              <li>✓ {t("offramp.history.status.created")+orderId}</li>
            )}
            {order.timestamp_payment_received && (
              <li>✓ {t("offramp.history.status.received")}</li>
            )}
            {order.timestamp_executed && (
              <li>✓ {t("offramp.history.status.executed")}</li>
            )}
          </ul>
          <Ruler />
          <p style={{ color: "grey" }}>
            *{t("offramp.history.disclaimer")}
            <a
              href="https://github.com/leapdao/burner-wallet/issues/169"
              rel="noopener noreferrer"
              target="_blank"
            >
            {t("offramp.history.click")}
            </a>
            .
          </p>
        </div>
      );
    } else {
      return <Loader loaderImage={burnerlogo} />;
    }
  }
}

export default withTranslation()(BityHistory);
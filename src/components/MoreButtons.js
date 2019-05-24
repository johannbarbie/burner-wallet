import React from "react";
import i18n from "../i18n";
import { OutlineButton, Flex, Icon, Box } from "rimble-ui";

export default ({
  isVendor,
  changeView,
}) => {
  let exchangeButton;

  if (!isVendor) {
    exchangeButton = (
      <OutlineButton
        fullWidth
        onClick={() => {
          changeView("exchange");
        }}
      >
        <Flex mx={-2} alignItems="center">
          <Icon name="Shuffle" mr={2} />
          {i18n.t("more_buttons.exchange")}
        </Flex>
      </OutlineButton>
    );
  } else {
    exchangeButton = (
      <OutlineButton
        fullWidth
        onClick={() => {
          changeView("cash_out");
        }}
      >
        <Flex mx={-2} alignItems="center">
          <Icon name="CreditCard" mr={2} />
          {"Cash Out"}
        </Flex>
      </OutlineButton>
    );
  }

  return (
    <Flex mx={-2}>
      <Box width={[1, 1/2, 1/2]} m={2}>
        <OutlineButton
          fullWidth
          onClick={() => {
            changeView("request_funds");
          }}
        >
          <Flex alignItems="center">
            <Icon name="AttachMoney" mr={2} />
            {i18n.t("more_buttons.request")}
          </Flex>
        </OutlineButton>
      </Box>
      <Box width={[1, 1/2, 1/2]} m={2}>{exchangeButton}</Box>
    </Flex>
  );
};

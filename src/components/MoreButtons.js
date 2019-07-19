import React from "react";
import { Flex, Icon, Box } from "rimble-ui";
import { BorderButton } from "./Buttons";
import { withTranslation } from "react-i18next";

const MoreButtons = ({
  isVendor,
  changeView,
  expertMode,
  t
}) => {
  let exchangeButton;

  if (!isVendor) {
    exchangeButton = (
      <BorderButton
        fullWidth
        onClick={() => {
          changeView("exchange");
        }}
      >
        <Flex mx={-2} alignItems="center">
          <Icon name="Shuffle" mr={2} />
          {t("more_buttons.exchange")}
        </Flex>
      </BorderButton>
    );
  } else {
    exchangeButton = (
      <BorderButton
        fullWidth
        onClick={() => {
          changeView("cash_out");
        }}
      >
        <Flex mx={-2} alignItems="center">
          <Icon name="CreditCard" mr={2} />
          {"Cash Out"}
        </Flex>
      </BorderButton>
    );
  }

  return (
    <Flex mx={-2}>
      <Box flex={1} m={2}>
        <BorderButton
          fullWidth
          onClick={() => {
            changeView("request_funds");
          }}
        >
          <Flex alignItems="center">
            <Icon name="AttachMoney" mr={2} />
            {t("more_buttons.request")}
          </Flex>
        </BorderButton>
      </Box>
      {isVendor || expertMode ? <Box flex={1} m={2}>{exchangeButton}</Box> : null}
    </Flex>
  );
};

export default withTranslation()(MoreButtons)
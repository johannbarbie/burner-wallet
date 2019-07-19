import React from "react";
import { Flex, Icon, Box } from "rimble-ui";
import { withTranslation } from "react-i18next";
import { PrimaryButton } from "./Buttons";

const MainCard = ({ changeView, t }) => (
  <Box>
    <Flex mx={-2}>
      <Box width={[1, 1 / 2, 1 / 2]} m={2}>
        <PrimaryButton width={1} onClick={() => changeView("receive")}>
          <Flex alignItems="center">
            <Icon name="CenterFocusWeak" mr={2} />
            {t("main_card.receive")}
          </Flex>
        </PrimaryButton>
      </Box>
      <Box width={[1, 1 / 2, 1 / 2]} m={2}>
        <PrimaryButton width={1} onClick={() => changeView("send_to_address")}>
          <Flex alignItems="center">
            <Icon name="Send" mr={2} />
            {t("main_card.send")}
          </Flex>
        </PrimaryButton>
      </Box>
    </Flex>
  </Box>
);

export default withTranslation()(MainCard);

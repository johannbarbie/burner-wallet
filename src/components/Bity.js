//@format
import React, { Component } from "react";
import { Trans, withTranslation } from 'react-i18next';
import { Box, Field, Input } from "rimble-ui";
import { PrimaryButton } from "./Buttons";
import { format } from "@tammo/react-iban";
import styled from "styled-components";
import { isValid } from "iban";
import { placeOrder, getOrder, getEstimate } from "../services/bity";
import { price } from "../services/ethgasstation";
import InputInfo from "./InputInfo";
import { getStoredValue, storeValues } from "../services/localStorage";

const P = styled.p`
  color: ${props => (props.color ? props.color : "grey")};
`;

// See: https://doc.bity.com/exchange/v2.html#place-an-order
const SUPPORTED_COUNTRIES = [
  "AT",
  "BE",
  "BG",
  "HR",
  "CY",
  "CZ",
  "DK",
  "EE",
  "FI",
  "FR",
  "DE",
  "GR",
  "HU",
  "IS",
  "IE",
  "IT",
  "LV",
  "LI",
  "LT",
  "LU",
  "MT",
  "MC",
  "NL",
  "NO",
  "PL",
  "PT",
  "RO",
  "SM",
  "ES",
  "SK",
  "SI",
  "SE",
  "CH",
  "GB"
];

let MIN_AMOUNT_DOLLARS = 15;

let prevFormattedIBAN;

class Bity extends Component {
  constructor(props) {
    super(props);

    const pk = getStoredValue("metaPrivateKey");
    let metaAccount;
    if (pk && pk !== "0") {
      metaAccount = props.mainnetweb3.eth.accounts.privateKeyToAccount(pk);
    }

    this.state = {
      fields: {
        name: {
          value: null,
          valid: null
        },
        IBAN: {
          value: null,
          valid: null
        },
        amount: {
          value: null,
          valid: null
        }
      },
      metaAccount
    };

    this.validate = this.validate.bind(this);
    this.formatIBAN = this.formatIBAN.bind(this);
    this.cashout = this.cashout.bind(this);
  }

  async componentDidMount() {
    const { changeAlert } = this.props;

    this.refs.name.focus();
    try {
      await this.getMinAmount();
    } catch (err) {
      changeAlert("warning", this.props.t("offramp.errors.bity_connection"));
    }
  }

  async getMinAmount() {
    const { ethPrice } = this.props;
    const estimate = await getEstimate("1");

    MIN_AMOUNT_DOLLARS = Math.ceil(estimate.input.minimum_amount * ethPrice);
  }

  async cashout() {
    const { IBAN } = this.validate("IBAN")();
    const {
      metaAccount,
      fields: { name }
    } = this.state;
    const {
      address,
      ethPrice,
      mainnetweb3,
      web3,
      changeView,
      setReceipt,
      changeAlert
    } = this.props;
    let { amount } = this.state.fields;

    if (IBAN.valid) {
      changeView("loader_ROOTCHAIN");

      let order;

      // NOTE: We've converted amount while the user was typing already to USD.
      // Hence, there's not need to do anything here!
      const amountInEth = (amount.value / ethPrice).toString();
      try {
        order = await placeOrder(
          name.value,
          IBAN.value.replace(/\s/g, ""),
          amountInEth,
          address
        );
      } catch (err) {
        changeAlert("warning", this.props.t("offramp.errors.bity_connection"));
        return;
      }

      const orderURI = order.headers.get("Location").split("/");
      const orderId = orderURI[orderURI.length - 1];
      const {
        payment_details: { crypto_address }
      } = await getOrder(orderId);

      let receipt;
      if (metaAccount) {
        let gwei;
        try {
          gwei = await price();
        } catch (err) {
          changeAlert(
            "warning",
            this.props.t("offramp.errors.ethgasstation_connection")
          );
          return;
        }
        const tx = {
          from: address,
          value: mainnetweb3.utils.toWei(amountInEth, "ether"),
          gas: 240000,
          gasPrice: Math.round(gwei * 1000000000),
          to: crypto_address
        };

        const signed = await mainnetweb3.eth.accounts.signTransaction(
          tx,
          metaAccount.privateKey
        );

        receipt = await mainnetweb3.eth.sendSignedTransaction(
          signed.rawTransaction
        );
      } else {
        receipt = await web3.eth.sendTransaction({
          from: address,
          to: crypto_address,
          value: mainnetweb3.utils.toWei(amountInEth, "ether")
        });
      }

      const recentTxs = JSON.parse(getStoredValue("recentTxs", address));
      recentTxs.push({
        blockNumber: receipt.blockNumber,
        from: address,
        to: "bity.com",
        hash: receipt.transactionHash,
        value: amount.value,
        orderId
      });

      storeValues({recentTxs: JSON.stringify(recentTxs)}, address);

      const receiptObj = {
        to: "bity.com",
        from: address,
        amount: amount.value,
        result: receipt,
        message: this.props.t("offramp.success")
      };
      setReceipt(receiptObj);
      changeView("receipt");
    }
  }

  customIsValid(IBAN) {
    // https://en.wikipedia.org/wiki/International_Bank_Account_Number#IBAN_formats_by_country
    const countryCode = IBAN.slice(0, 2);
    const supportedCountry = SUPPORTED_COUNTRIES.includes(countryCode);
    if (supportedCountry) {
      if (isValid(IBAN)) {
        return "valid";
      } else {
        return "invalid";
      }
    } else {
      return "country";
    }
  }

  setCaretPosition(ctrl, pos) {
    // Modern browsers
    if (ctrl.setSelectionRange) {
      ctrl.focus();
      ctrl.setSelectionRange(pos, pos);

      // IE8 and below
    } else if (ctrl.createTextRange) {
      var range = ctrl.createTextRange();
      range.collapse(true);
      range.moveEnd("character", pos);
      range.moveStart("character", pos);
      range.select();
    }
  }

  formatIBAN(e) {
    const cursorPosition = e.target.selectionStart;
    const { fields } = this.state;
    const IBAN = this.refs.IBAN.value;
    const formattedIBAN = format(IBAN);

    const newFields = Object.assign(fields, {
      IBAN: {
        value: formattedIBAN,
        valid: fields.IBAN.valid
      }
    });
    this.setState(newFields, () => {
      // All IBANs are grouped in digits and letters of four
      // e.g. AEkk bbbc cccc cccc cccc ccc
      // NOTE: The author isn't very proud of the solution below :D
      let adjustedPosition = cursorPosition;
      if (
        prevFormattedIBAN &&
        prevFormattedIBAN.length > formattedIBAN.length &&
        cursorPosition % 5 === 0 &&
        cursorPosition !== 0
      ) {
        adjustedPosition--;
      } else if (
        prevFormattedIBAN &&
        prevFormattedIBAN.length < formattedIBAN.length &&
        cursorPosition % 5 === 0 &&
        cursorPosition !== 0
      ) {
        adjustedPosition++;
      }
      this.setCaretPosition(this.refs.IBAN, adjustedPosition);
      prevFormattedIBAN = formattedIBAN;
    });
  }

  validate(input) {
    const { address } = this.props;
    return () => {
      const { fields } = this.state;
      let newFields;
      if (input === "name") {
        const name = this.refs.name.value;
        newFields = Object.assign(fields, {
          name: {
            value: name,
            valid: name !== "",
            message: name === "" ? this.props.t("offramp.required") : null
          }
        });
      } else if (input === "IBAN") {
        const IBAN = this.refs.IBAN.value;
        const validReason = this.customIsValid(IBAN);
        let valid, message;

        if (validReason === "valid") {
          valid = true;
        } else if (validReason === "country") {
          valid = false;
          message = this.props.t("offramp.country_not_supported");
        } else {
          valid = false;
          message = this.props.t("offramp.iban_incorrect");
        }
        newFields = Object.assign(fields, {
          IBAN: {
            value: format(IBAN),
            valid,
            message
          }
        });
      } else if (input === "amount") {
        const {
          ethPrice,
          ethBalance,
          currencyDisplay,
          convertCurrency
        } = this.props;

        const displayCurrency = getStoredValue("currency", address);
        const amount = convertCurrency(
          parseFloat(this.refs.amount.value),
          `USD/${displayCurrency}`
        );

        const min = MIN_AMOUNT_DOLLARS;
        const max = parseFloat(ethPrice) * parseFloat(ethBalance);

        let valid, message;
        if (amount < min) {
          valid = false;
          message = `${this.props.t(
            "offramp.amount_too_small"
          )} $${MIN_AMOUNT_DOLLARS}.`;
        } else if (amount > max) {
          valid = false;
          message = this.props.t("offramp.amount_too_big");
        } else {
          valid = true;
        }

        newFields = Object.assign(fields, {
          amount: {
            value: amount,
            valid,
            message
          }
        });
      }
      this.setState(newFields);
      return newFields;
    };
  }

  render() {
    const { fields } = this.state;
    let { t } = this.props;
    return (
      <div>
        <Box mb={4}>
          <P>
            <Trans i18nKey="offramp.heading">
              Transfer your ether directly to your bank account with just one
              click using 
              <a
                href="https://bity.com/"
                target="_blank"
                rel="noopener noreferrer"
              >
                bity.com
              </a>
              , the secure swiss crypto gateway. No KYC is required within
              bity.com's 5000 CHF (~4500 EUR) annual limit.
              </Trans>
            </P>
          <Field mb={3} label={t("offramp.form.owner")}>
            <Input
              width={1}
              type="text"
              ref="name"
              placeholder="Satoshi Nakamoto"
              onChange={this.validate("name")}
              borderColor={
                fields.name.valid === null || fields.name.valid ? "grey" : "red"
              }
            />
            {fields.name.message ? (
              <InputInfo color="red">{fields.name.message}</InputInfo>
            ) : null}
          </Field>
          <Field mb={3} label="IBAN">
            <Input
              width={1}
              type="text"
              placeholder="DE89 3704 0044 0532 0130 00"
              ref="IBAN"
              value={fields.IBAN.value}
              onChange={this.formatIBAN}
              borderColor={
                fields.IBAN.valid === null || fields.IBAN.valid ? "grey" : "red"
              }
            />
            {fields.IBAN.message ? (
              <InputInfo color="red">{fields.IBAN.message}</InputInfo>
            ) : null}
          </Field>
          <Field mb={3} label={t("offramp.form.amount")}>
            <Input
              ref="amount"
              width={1}
              type="number"
              onChange={this.validate("amount")}
              borderColor={
                fields.amount.valid === null || fields.amount.valid
                  ? "grey"
                  : "red"
              }
              placeholder={currencyDisplay(0)}
            />
            {fields.amount.message ? (
              <InputInfo color="red">{fields.amount.message}</InputInfo>
            ) : null}
          </Field>
        </Box>
        <P color="red">
          You're using an early alpha product! The following loading dialogue is
          unfortunately really fragile and needs to remain uninterrupted for the
          whole process. So, please don't close it abruptly. If you need help,
          please reach out to someone at leapdao.org. We're working on a much
          better and more reliable cashout dialogue!
        </P>
        <PrimaryButton
          size={"large"}
          width={1}
          disabled={!(fields.name.valid && fields.amount.valid)}
          onClick={this.cashout}
        >
          {t("offramp.form.submit")}
        </PrimaryButton>
      </div>
    );
  }
}

export default withTranslation()(Bity);

import React from "react";
import Ruler from "./Ruler";
import { Translation } from "react-i18next";

export default ({ mainStyle, burnWallet, goBack }) => {
  return (
    <Translation>
      {(t) => (
        // eslint-disable-next-line no-unused-expressions
        <>
          <div
            style={{
              textAlign: "center",
              width: "100%",
              fontWeight: "bold",
              fontSize: 30
            }}
          >
            {t("burn_wallet.burn_private_key_question")}
          </div>
          <div
            style={{
              textAlign: "center",
              marginTop: 20,
              width: "100%",
              fontWeight: "bold",
              fontSize: 20
            }}
          >
            {t("burn_wallet.disclaimer")}
          </div>
          <div>
            <Ruler />
            <div className="content ops row">
              <div className="col-6 p-1">
                <button
                  className="btn btn-large w-100"
                  style={{ backgroundColor: mainStyle.mainColor }}
                  onClick={goBack}
                >
                  <i className="fas fa-arrow-left" />{" "}
                  {t("burn_wallet.cancel")}
                </button>
              </div>

              <div className="col-6 p-1">
                <button
                  className="btn btn-large w-100"
                  style={{ backgroundColor: "#c53838" }}
                  onClick={burnWallet}
                >
                  <i className="fas fa-fire" /> {t("burn_wallet.burn")}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </Translation>
  );
};

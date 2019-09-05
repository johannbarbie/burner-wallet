// @format
import getConfig from "../config";
import { greaterThan, bi } from "jsbi-utils";

const CONFIG = getConfig();

async function getDeals(url) {
  const request = await fetch(`${url}/deals`, {
    mode: "cors"
  });
  const deals = await request.json();
  deals.url = url;
  return deals;
}

async function getAllDeals() {
  const marketMakers = CONFIG.SIDECHAIN.MARKET_MAKERS;
  const dealRequests = [];
  for (let i = 0; i < marketMakers.length; i++) {
    const { URL } = marketMakers[i];
    dealRequests.push(getDeals(URL));
  }
  const deals = await Promise.all(dealRequests);
  return reorgDeals(deals);
}

// NOTE: The deals we get from the maker maker are not formatted ideally
// for this module, so we re-organize them here.
function reorgDeals(unformattedDeals) {
  const fDeals = [];
  for (let i = 0; i < unformattedDeals.length; i++) {
    const { address, deals, url } = unformattedDeals[i];
    for (let j = 0; j < deals.length; j++) {
      fDeals.push({
        meta: {
          address,
          url
        },
        deal: deals[j]
      });
    }
  }
  return fDeals;
}

function sortByRate(a, b) {
  if (a.deal.rate > b.deal.rate) {
    return 1;
  }
  if (a.deal.rate < b.deal.rate) {
    return -1;
  }
  return 0;
}

// NOTE: `max` is the decimals value of a contract.
export async function getBestDeal(tokenAddr, color, max) {
  const deals = await getAllDeals();
  const filteredDeals = deals.filter(({ deal }) => {
    return (
      // NOTE: According to @troggy, rate should never be smaller than 0 and
      // never bigger than 1000.
      deal.rate > 0 &&
      deal.rate <= 1000 &&
      deal.tokenAddr === tokenAddr &&
      deal.color === color &&
      (greaterThan(bi(deal.balance), bi(max)) || !max)
    );
  });
  if (filteredDeals.length === 0) {
    throw new Error("No matching deals for exiting your position found!");
  }

  return filteredDeals.sort(sortByRate)[0];
}

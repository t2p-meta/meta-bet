import { BigNumber, utils } from "ethers";

const defaultToken = "0x444838C1f0a0e86114DE6d481c5dde98c4ba75FD";

export const defaultTokenAddress = function () {
  return Promise.resolve(defaultToken);
};

export const toWei = function (value) {
  return utils.parseEther(value.toString()).toString();
};

export const fromWei = function (value) {
  return utils.formatEther(
    typeof value === "string" ? value : value.toString()
  );
};
/**
 * 计算赔率:
 *  A赔率=（O总金额+B总金额）/A总金额 + 1
 *  B赔率=（O总金额+A总金额）/B总金额 + 1
 *  O赔率=（A总金额+B总金额）/O总金额 + 1
 */
export const calculateOdds = function (
  totalPayoutTeamA,
  totalPayoutTeamB,
  totalPayoutDraw
) {
  if (!totalPayoutTeamA || !totalPayoutTeamB || !totalPayoutDraw) {
    return { oddsA: 0, oddsB: 0, oddsDraw: 0 };
  }
  let _a = fromWei(totalPayoutTeamA) * 1;
  let _b = fromWei(totalPayoutTeamB) * 1;
  let _d = fromWei(totalPayoutDraw) * 1;

  let oddsA = ((_b + _d) / _a).toFixed(2) * 100 + 100;
  let oddsB = ((_a + _d) / _b).toFixed(2) * 100 + 100;
  let oddsDraw = ((_b + _a) / _d).toFixed(2) * 100 + 100;
  return {
    oddsA: oddsA,
    oddsB: oddsB.toFixed(2),
    oddsDraw: oddsDraw.toFixed(2),
  };
};

/**
 * 押注项目总资金数
 */
export const matchTotalOdds = function (
  totalPayoutTeamA,
  totalPayoutTeamB,
  totalPayoutDraw
) {
  if (!totalPayoutTeamA || !totalPayoutTeamB || !totalPayoutDraw) {
    return { poolSize: 0 };
  }
  let _a = fromWei(totalPayoutTeamA) * 1;
  let _b = fromWei(totalPayoutTeamB) * 1;
  let _d = fromWei(totalPayoutDraw) * 1;

  let poolSize = _a + _b + _d;
  return {
    poolSize,
  };
};

/**
 * 获取区块链事件数据
 */
export const getPastEvents = function (web3, initBlockNumber, events) {
  web3.eth.getBlockNumber().then((bolckNumber) => {
    let blockCount = bolckNumber - initBlockNumber;
    console.log(
      "blockCount:",
      blockCount,
      bolckNumber,
      "web3 bolckNumber======"
    );
    let pages = 1;
    let blockAlloweHeight = 1000; // Blockheight too far in the past: eth_getLogs. Range of blocks allowed for your plan: 1000
    let rateLimitPage = 1;
    let rateLimits = 20; // Rate limit exceeded: 40 per 1 second. Check respon…ticvigil.com/ to avoid hitting public ratelimits.
    if (blockCount % blockAlloweHeight == 0) {
      pages = parseInt(blockCount / blockAlloweHeight);
    } else {
      pages = parseInt(blockCount / blockAlloweHeight) + 1;
    }
    if (pages % rateLimits == 0) {
      rateLimitPage = parseInt(pages / rateLimits);
    } else {
      rateLimitPage = parseInt(pages / rateLimits) + 1;
    }

    let _from = initBlockNumber;
    let _to = _from + blockAlloweHeight;
    for (let rpage = 0; rpage < rateLimitPage; rpage++) {
      let time = rpage * 1000 + 1000;
      setTimeout(() => {
        let fpage = rateLimits * rpage;
        let tpage = rateLimits * rpage + rateLimits;
        if (tpage > pages) {
          tpage = pages;
        }
        for (fpage; fpage < tpage; fpage++) {
          if (_to > bolckNumber) _to = bolckNumber;
          console.log(
            "pages:",
            rpage,
            fpage,
            tpage,
            _from,
            _to,
            "web3 bolckNumber======"
          );
          events(_from, _to);
          _to += blockAlloweHeight;
          _from += blockAlloweHeight;
        }
      }, time);
    }
  });
};

export default {
  toWei,
  fromWei,
  defaultTokenAddress,
  calculateOdds,
  getPastEvents,
};

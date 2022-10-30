const hre = require("hardhat");
const fs = require("fs");
const { BigNumber, utils } = require("ethers");
const toWei = (value) => utils.parseEther(value.toString());
const fromWei = (value) =>
  utils.formatEther(typeof value === "string" ? value : value.toString());

const tokenAbi = getAbi(
  "./artifacts/@openzeppelin/contracts/token/ERC20/IERC20.sol/IERC20.json"
);
const metaBetAbi = getAbi("./artifacts/contracts/MetaBet.sol/MetaBet.json");

/**
 * 0. 部署合约
 */
async function deploySmartBet() {
  const _SmartBet = await ethers.getContractFactory("SmartBet");
  let SmartBet = await _SmartBet.deploy();
  await SmartBet.deployed();
  console.log("SmartBet deployed to:", SmartBet.address);

  const _SmartInvestV1 = await ethers.getContractFactory("SmartInvestV1");
  let SmartInvestV1 = await _SmartInvestV1.deploy();
  await SmartInvestV1.deployed();
  console.log("SmartInvestV1 deployed to:", SmartInvestV1.address);
}

/**
 * 1. 部署合约
 */
async function deployMetaBet() {
  const _MetaBet = await ethers.getContractFactory("MetaBet");
  let MetaBet = await _MetaBet.deploy(tokenAddress, {
    gasLimit: BigNumber.from("8000000"),
  });
  await MetaBet.deployed();
  console.log("MetaBet deployed to:", MetaBet.address);
}

/**
 * 1-1. 蓝钻充值
 */
async function deposit() {
  const accounts = await hre.ethers.getSigners();
  let token = new ethers.Contract(tokenAddress, tokenAbi, accounts[1]);
  let metabet = new ethers.Contract(metaBetAddress, metaBetAbi, accounts[1]);

  let tbalance = await token.balanceOf(accounts[1].address);
  console.log(accounts[1].address, "token balance:", tbalance);

  let totalOdds = toWei(100);

  await token.approve(metabet.address, totalOdds, {
    gasLimit: b("8000000"),
  });
  let ret = await metabet.deposit(totalOdds, {
    gasLimit: BigNumber.from("8000000"),
  });

  // tbalance = await token.balanceOf(accounts[1].address);
  // console.log(accounts[1].address, "token balance:", tbalance);

  console.log("MetaBet deposit:", ret);
}

/**
 * 1-2. 蓝钻提取
 */
async function withdraw() {
  const accounts = await hre.ethers.getSigners();
  const _MetaBet = await ethers.getContractFactory("MetaBet");
  let MetaBet = await _MetaBet.deploy(tokenAddress, {
    gasLimit: BigNumber.from("8000000"),
  });
  await MetaBet.deployed();
  console.log("MetaBet deployed to:", MetaBet.address);
}
/**
 * 2. 创建世界杯比赛
 */
async function createMatch() {
  const accounts = await hre.ethers.getSigners();

  let token = new ethers.Contract(tokenAddress, tokenAbi, accounts[0]);
  let metabet = new ethers.Contract(metaBetAddress, metaBetAbi, accounts[0]);

  let startAt = parseInt(new Date().getTime() / 1000) + 3600;

  let initOddsTeamA = 10;
  let initOddsTeamB = 30;
  let initOddsDraw = 30;
  // 计算赔率
  let oddsA =
    parseInt(((initOddsTeamB + initOddsDraw) / initOddsTeamA) * 100) + 100;
  let oddsB =
    parseInt(((initOddsTeamA + initOddsDraw) / initOddsTeamB) * 100) + 100;
  let oddsDraw =
    parseInt(((initOddsTeamB + initOddsTeamA) / initOddsDraw) * 100) + 100;

  // let _matchInfo = [1, 2, 5, startAt, 1, metatoken, 10, 20, 30];
  const _matchInfo = {
    oddsTeamA: oddsA,
    oddsTeamB: oddsB,
    oddsDraw: oddsDraw,
    startAt,
    assetType: 1,
    payToken: token.address,
    initOddsTeamA: toWei(initOddsTeamA),
    initOddsTeamB: toWei(initOddsTeamB),
    initOddsDraw: toWei(initOddsDraw),
  };

  let _apiMatchId = 1001;
  let _matchResultLink = "https://api-football-v1.p.rapidapi.com/v2/";
  // function createMatch(
  //     uint256 _apiMatchId,
  //     string calldata _matchResultLink,
  //     MatchInfo calldata _matchInfo
  // ) public payable isNewAPIMatch(_apiMatchId) onlyOwner returns (uint256) {
  const amount = toWei(0);

  let totalOdds = toWei(initOddsTeamA + initOddsTeamB + initOddsDraw);

  let tbalance = await token.balanceOf(accounts[0].address);
  console.log(accounts[0].address, "token balance:", tbalance);
  await token.approve(metabet.address, totalOdds, {
    gasLimit: b("8000000"),
  });
  console.log(token.address, "approve done:", totalOdds);

  let metabetret = await metabet.createMatch(
    _apiMatchId,
    _matchResultLink,
    _matchInfo,
    { value: amount, gasLimit: BigNumber.from("8000000") }
  );
  console.log(metabetret, "metabetret");

  console.log("deposit done");
}

/**
 * 3. 押注世界杯比赛
 */
async function placeBet(type) {
  const accounts = await hre.ethers.getSigners();

  let indexAccount = type;
  let token = new ethers.Contract(
    tokenAddress,
    tokenAbi,
    accounts[indexAccount]
  );
  let metabet = new ethers.Contract(
    metaBetAddress,
    metaBetAbi,
    accounts[indexAccount]
  );

  let initOdds = 0;
  let initOddsTeamA = 100;
  let initOddsTeamB = 200;
  let initOddsDraw = 300;

  let _matchId = 1;
  /**
    enum MatchResult {
        NOT_DETERMINED,
        DRAW,
        TEAM_A_WON,
        TEAM_B_WON
    }
   */
  let resultBetOn = 0;
  let DRAW_resultBetOn = 1;
  let TEAM_A_WON_resultBetOn = 2;
  let TEAM_B_WON_resultBetOn = 3;

  if (type == 1) {
    initOdds = initOddsDraw;
    resultBetOn = DRAW_resultBetOn;
  } else if (type == 2) {
    initOdds = initOddsTeamA;
    resultBetOn = TEAM_A_WON_resultBetOn;
  } else if (type == 3) {
    initOdds = initOddsTeamB;
    resultBetOn = TEAM_B_WON_resultBetOn;
  }

  /**
    struct PayAsset {
        AssetType assetType;
        address payToken;
        uint256 payValue;
    }
    }
   */
  let totalOdds = toWei(initOdds);
  let payAsset = {
    assetType: 1,
    payToken: token.address,
    payValue: totalOdds,
  };
  //   function placeBet(
  //     uint256 _matchId,
  //     uint8 _resultBetOn,
  //     PayAsset calldata _payAsset
  // )

  const amount = toWei(0);

  let tbalance = await token.balanceOf(accounts[indexAccount].address);
  console.log(accounts[indexAccount].address, "token balance:", tbalance);
  await token.approve(metabet.address, totalOdds, {
    gasLimit: b("8000000"),
  });
  console.log(token.address, "approve done:", totalOdds);

  console.log("placeBet:", _matchId, resultBetOn, payAsset);
  let metabetret = await metabet.placeBet(_matchId, resultBetOn, payAsset, {
    value: amount,
    gasLimit: BigNumber.from("8000000"),
  });
  console.log(metabetret, "metabetret");

  console.log("deposit done");
}

/**
 * 4. 开始-世界杯比赛
 */
async function startMatch() {
  const accounts = await hre.ethers.getSigners();
  let metabet = new ethers.Contract(metaBetAddress, metaBetAbi, accounts[0]);

  let _matchId = 1;

  // function startMatch(uint256 _matchId)
  // public
  // onlyOwner
  // matchExists(_matchId)
  // matchNotStarted(_matchId)

  let metabetret = await metabet.startMatch(_matchId, {
    gasLimit: BigNumber.from("8000000"),
  });
  console.log(metabetret, "metabetret");

  console.log("deposit done");
}

/**
 * 5. 结束-世界杯比赛
 */
async function closeMatch() {
  const accounts = await hre.ethers.getSigners();
  let metabet = new ethers.Contract(metaBetAddress, metaBetAbi, accounts[0]);

  let _matchId = 1;

  /**
    enum MatchResult {
        NOT_DETERMINED,
        DRAW,
        TEAM_A_WON,
        TEAM_B_WON
    }
   */

  let DRAW_resultBetOn = 1;
  let TEAM_A_WON_resultBetOn = 2;
  let TEAM_B_WON_resultBetOn = 3;

  //   function closeMatch(uint256 _matchId, uint8 _matchResult)
  //   public
  //   onlyOwner
  //   matchExists(_matchId)
  //   matchStarted(_matchId)
  //   validateMatchResult(_matchResult)

  let metabetret = await metabet.closeMatch(_matchId, TEAM_A_WON_resultBetOn, {
    gasLimit: BigNumber.from("8000000"),
  });
  console.log(metabetret, "metabetret");

  console.log("deposit done");
}

async function view() {
  const accounts = await hre.ethers.getSigners();

  let token = new ethers.Contract(tokenAddress, tokenAbi, accounts[0]);
  let tbalance = b(await token.balanceOf(metaBetAddress));
  console.log(metaBetAddress, "token balance:", tbalance);
}

async function getMatch() {
  const accounts = await hre.ethers.getSigners();

  let metaBet = new ethers.Contract(metaBetAddress, metaBetAbi, accounts[0]);
  let _matchId = 1;

  let ret = await metaBet.getMatch(_matchId);
  console.log("Match Info:", ret);
}

async function liquidateAsset(type) {
  const accounts = await hre.ethers.getSigners();

  let indexAccount = type;
  let token = new ethers.Contract(
    tokenAddress,
    tokenAbi,
    accounts[indexAccount]
  );
  let metabet = new ethers.Contract(
    metaBetAddress,
    metaBetAbi,
    accounts[indexAccount]
  );

  let tbalance = await token.balanceOf(accounts[indexAccount].address);
  console.log(accounts[indexAccount].address, "token balance:", tbalance);

  let metabetret = await metabet.liquidateAsset(5, {
    gasLimit: BigNumber.from("8000000"),
  });
  console.log(metabetret, "metabetret");

  console.log("deposit done");
}

function getAbi(jsonPath) {
  let file = fs.readFileSync(jsonPath);
  let abi = JSON.parse(file.toString()).abi;
  return abi;
}

function m(num) {
  return BigNumber.from("1000000000000000000").mul(num);
}

function d(bn) {
  return bn.div("1000000000000000000").toNumber();
}

function b(num) {
  return BigNumber.from(num);
}

function n(bn) {
  return bn.toNumber();
}

function s(bn) {
  return bn.toString();
}
async function delay(sec) {
  return new Promise((resolve, reject) => {
    setTimeout(resolve, sec * 1000);
  });
}
//matic
var tokenAddress = "0x444838C1f0a0e86114DE6d481c5dde98c4ba75FD";
var metaBetAddress = "0x9C09dcFf29b885A9125349EA0a96DEf59baa08F2"; //
// 1.部署合约
// deployMetaBet()
// 1-1 蓝钻充值
// deposit()
// deploySmartBet()
// 2.创建世界杯押注项目
// createMatch()
// 3.押注世界杯项目
// placeBet(1)
// placeBet(2)
// placeBet(3)

// startMatch()
// closeMatch()
  // 9.查询余额
  // view()
  // 10.获取赛程押注信息
  // getMatch()
  // 提取押注金额
  // type=1:4,type=2:5,type=3:6
  liquidateAsset(1)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

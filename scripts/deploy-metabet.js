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
  // const accounts = await hre.ethers.getSigners();
  // let token = new ethers.Contract(tokenAddress, tokenAbi, accounts[0]);
  // let tbalance = await token.balanceOf(accounts[0].address);
  // console.log(accounts[0].address, " balance:", await accounts[0].getBalance());
  // console.log(accounts[0].address, "token balance:", tbalance);
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
 * 2. 创建世界杯比赛League
 */
async function createLeague() {
  const accounts = await hre.ethers.getSigners();
  let metabet = new ethers.Contract(metaBetAddress, metaBetAbi, accounts[0]);
  //   function createLeague(
  //     string _name,
  //     string _country,
  //     string _logo
  // )
  let _name = "World Cup";
  let _country = "World";
  let _logo = "https://media.api-sports.io/football/leagues/1.png";
  let metabetret = await metabet.createLeague(_name, _country, _logo, {
    gasLimit: BigNumber.from("8000000"),
  });
  console.log(metabetret, "createLeague metabetret");
  console.log("createLeague deposit done");
  let leagueInfo = await metabet.getLeague(_leagueId, {
    gasLimit: BigNumber.from("8000000"),
  });
  console.log("League Info:", leagueInfo);
}

/**
 * 2. 创建世界杯比赛
 */
async function createMatch() {
  const accounts = await hre.ethers.getSigners();

  let token = new ethers.Contract(tokenAddress, tokenAbi, accounts[0]);
  let metabet = new ethers.Contract(metaBetAddress, metaBetAbi, accounts[0]);

  let startAt = parseInt(new Date().getTime() / 1000) + 3600 * 10;

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
    // draw队名称
    drawName: "draw",
    // teamA队名称
    teamAName: "USA",
    // teamB队名称
    teamBName: "agentina",
    // 赢家手续费率 8% winnerfeerate (让玩家自己设置)
    winnerFeeRate: 800,
    // 比赛开始时间
    startAt,
    // 押注资产类型
    assetType: 1,
    // USDC和USDT不写这里，写在公共变量里面，新增发的币可以写在这里
    payToken: token.address,
    initOddsTeamA: toWei(initOddsTeamA),
    initOddsTeamB: toWei(initOddsTeamB),
    initOddsDraw: toWei(initOddsDraw),
  };

  let _apiMatchId = 1002;
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
    _leagueId,
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
async function placeBet(type, _matchId) {
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

  // let _matchId = 1;
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

  let initOdds = 0;
  if (type == 1) {
    initOdds = 100;
    resultBetOn = DRAW_resultBetOn;
  } else if (type == 2) {
    initOdds = 200;
    resultBetOn = TEAM_A_WON_resultBetOn;
  } else if (type == 3) {
    initOdds = 300;
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
    payAmount: totalOdds,
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
async function startMatch(_matchId) {
  const accounts = await hre.ethers.getSigners();
  let metabet = new ethers.Contract(metaBetAddress, metaBetAbi, accounts[0]);

  // let _matchId = 1;

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
async function closeMatch(_matchId) {
  const accounts = await hre.ethers.getSigners();
  let metabet = new ethers.Contract(metaBetAddress, metaBetAbi, accounts[0]);

  // let _matchId = 1;

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

  let scoreDraw = 0;
  let scoreTeamA = 2;
  let scoreTeamB = 1;
  //   function closeMatch(
  //   uint256 _matchId,
  //   uint8 _matchResult,
  //   uint8 scoreTeamA,
  //   uint8 scoreTeamB
  // )
  //   public
  //   onlyOwner
  //   matchExists(_matchId)
  //   matchStarted(_matchId)
  //   validateMatchResult(_matchResult)

  let metabetret = await metabet.closeMatch(
    _matchId,
    TEAM_A_WON_resultBetOn,
    scoreDraw,
    scoreTeamA,
    scoreTeamB,
    {
      gasLimit: BigNumber.from("8000000"),
    }
  );
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

async function getSmartAsset(assertId) {
  const accounts = await hre.ethers.getSigners();

  let metaBet = new ethers.Contract(metaBetAddress, metaBetAbi, accounts[5]);

  let ret = await metaBet.getSmartAsset(assertId);
  console.log("SmartAsset Info:", ret);
}

async function liquidateAsset(type, assetId) {
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

  // type=1:4,type=2:5,type=3:6
  let metabetret = await metabet.liquidateAsset(assetId, {
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
let _leagueId = 1;
let _matchId = 1;
var tokenAddress = "0x444838C1f0a0e86114DE6d481c5dde98c4ba75FD";
var metaBetAddress = "0xAe7F8D6d4Ce6c97E19Eacd8FF0c2c42D2b7f69f6"; //
// 1.部署合约
// deployMetaBet()
// 1-1 蓝钻充值
// deposit()
// deploySmartBet()
// 2.创建体育活动-世界杯押注项目
createLeague()
  // 2.创建世界杯押注项目
  // createMatch()
  // 3.押注世界杯项目

  // placeBet(1,_matchId) // draw 100
  // placeBet(2,_matchId) // teamA 200
  // placeBet(3,_matchId) // teamB 300

  // startMatch(_matchId)
  // closeMatch(_matchId)
  // 9.查询余额
  // view()
  // 10.获取赛程押注信息
  // getMatch()
  // getSmartAsset(3)
  // 提取押注金额
  // type=1:4,type=2:5,type=3:6
  // liquidateAsset(2,8)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

const { expect, assert } = require("chai");
const { BigNumber, utils } = require("ethers");
const fs = require("fs");
const hre = require("hardhat");
const toWei = (value) => utils.parseEther(value.toString());
const fromWei = (value) =>
  utils.formatEther(typeof value === "string" ? value : value.toString());

// const getBalance = provider.getBalance;

const ADDRESS_ZERO = "0x0000000000000000000000000000000000000000";

describe("Metabet-test===>>>>", function () {
  let accounts;
  let metabet;
  let metatoken;
  let owner;
  let _leagueId = 1;
  let _matchId = 1;

  before(async function () {
    accounts = await ethers.getSigners();

    owner = accounts[0];
    console.log(
      "owner account 0",
      owner.address,
      "balance 1:",
      d(await accounts[0].getBalance())
    );
    console.log(
      "account 1",
      accounts[1].address,
      "balance 1:",
      d(await accounts[1].getBalance())
    );
    console.log(
      "account 2",
      accounts[2].address,
      "balance 2:",
      d(await accounts[2].getBalance())
    );
    console.log(
      "account 3",
      accounts[3].address,
      "balance 3:",
      d(await accounts[3].getBalance())
    );
  });
  /**
   * 1.部署Metabet合约
   */
  it("Deployment metabet", async function () {
    const _bet = await ethers.getContractFactory("MetaBet");
    metabet = await _bet.deploy(ADDRESS_ZERO);
    metaBetAddress = metabet.address;
    console.log("Deployment metabet:............:", metabet.address);
  });

  /**
   * 2-1. 创建世界杯比赛League
   */
  it("createLeague", async function () {
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
  });

  /**
   * 2-2. 创建世界杯比赛
   */
  it("createMatch", async function () {
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
      winnerFeeRate: 0.08 * 100,
      // 比赛开始时间
      startAt,
      // 押注资产类型
      assetType: 0,
      // USDC和USDT不写这里，写在公共变量里面，新增发的币可以写在这里
      payToken: ADDRESS_ZERO,
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
    const amount = toWei(initOddsTeamA + initOddsTeamB + initOddsDraw);

    // let tbalance = await token.balanceOf(accounts[0].address);
    // console.log(accounts[0].address, "token balance:", tbalance);
    // await token.approve(metabet.address, totalOdds, {
    //   gasLimit: b("8000000"),
    // });
    // console.log(token.address, "approve done:", totalOdds);

    let metabetret = await metabet.createMatch(
      _leagueId,
      _apiMatchId,
      _matchResultLink,
      _matchInfo,
      { value: amount, gasLimit: BigNumber.from("8000000") }
    );
    console.log(metabetret, "createMatch metabetret");

    console.log("createMatch deposit done");
    let matchInfo = await metabet.getMatch(_matchId, {
      gasLimit: BigNumber.from("8000000"),
    });
    console.log("Match Info:", matchInfo);
  });

  /**
   * 3.-1 押注世界杯比赛
   */
  it("placeBet draw", async function () {
    await placeBet(1, _matchId); //1 draw 100
    await placeBet(2, _matchId); //2 teamA 200 //
    await placeBet(3, _matchId); //3 teamB 300
  });

  /**
   * 4. 开始-世界杯比赛
   */
  it("startMatch", async function () {
    // const accounts = await hre.ethers.getSigners();
    // let metabet = new ethers.Contract(metaBetAddress, metaBetAbi, accounts[0]);

    // let _matchId = 1;

    // function startMatch(uint256 _matchId)
    // public
    // onlyOwner
    // matchExists(_matchId)
    // matchNotStarted(_matchId)

    let metabetret = await metabet.startMatch(_matchId, {
      gasLimit: BigNumber.from("8000000"),
    });
    console.log(metabetret, "startMatch metabetret");

    console.log("startMatch deposit done");
  });

  /**
   * 5. 结束-世界杯比赛
   */
  it("closeMatch", async function () {
    // const accounts = await hre.ethers.getSigners();
    // let metabet = new ethers.Contract(metaBetAddress, metaBetAbi, accounts[0]);

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
    console.log(metabetret, "closeMatch metabetret");

    console.log("closeMatch deposit done");
  });

  it("user liquidateAsset", async function () {
    // const accounts = await hre.ethers.getSigners();

    let indexAccount = 2;
    let assetId = 5; //type=2:5

    // let token = metatoken;
    // let token = new ethers.Contract(
    //   tokenAddress,
    //   tokenAbi,
    //   accounts[indexAccount]
    // );
    // let metabet = new ethers.Contract(
    //   metaBetAddress,
    //   metaBetAbi,
    //   accounts[indexAccount]
    // );

    let userBalance1 = await accounts[indexAccount].getBalance();
    let creatorBalance1 = await accounts[0].getBalance();
    let smartBalance1 = await metabet.getEthBalance();
    // type=1:4,type=2:5,type=3:6
    //type 1 draw  100
    //type 2 teamA 200 win
    //type 3 teamB 300
    let metabetret = await metabet
      .connect(accounts[indexAccount])
      .liquidateAsset(assetId, {
        gasLimit: BigNumber.from("8000000"),
      });
    console.log(metabetret, "metabetret");

    let userBalance2 = await accounts[indexAccount].getBalance();
    console.log(
      "user [",
      accounts[indexAccount].address,
      "] liquidateAsset token userBalance1:",
      userBalance1,
      ",userBalance2:",
      userBalance2
    );
    let creatorBalance2 = await accounts[0].getBalance();
    console.log(
      "creator [",
      accounts[0].address,
      "] liquidateAsset token creatorBalance1:",
      creatorBalance1,
      ",creatorBalance2:",
      creatorBalance2
    );
    let smartBalance2 = await metabet.getEthBalance();
    console.log(
      " smart [",
      metabet.address,
      "] liquidateAsset token smartBalance1:",
      smartBalance1,
      ",smartBalance2:",
      smartBalance2
    );
  });

  it("creator liquidateAsset", async function () {
    // const accounts = await hre.ethers.getSigners();

    let indexAccount = 0;
    //
    let assetId = 1;

    // let token = metatoken;
    // let token = new ethers.Contract(
    //   tokenAddress,
    //   tokenAbi,
    //   accounts[indexAccount]
    // );
    // let metabet = new ethers.Contract(
    //   metaBetAddress,
    //   metaBetAbi,
    //   accounts[indexAccount]
    // );

    let creatorBalance1 = await accounts[indexAccount].getBalance();
    let smartBalance1 = await metabet.getEthBalance();
    // type=1:4,type=2:5,type=3:6
    //type 1 draw  100
    //type 2 teamA 200 win
    //type 3 teamB 300
    let metabetret = await metabet
      .connect(accounts[indexAccount])
      .liquidateAsset(assetId, {
        gasLimit: BigNumber.from("8000000"),
      });
    console.log(metabetret, "metabetret");

    let creatorBalance2 = await accounts[indexAccount].getBalance();
    console.log(
      "creator [",
      accounts[indexAccount].address,
      "] liquidateAsset token creatorBalance1:",
      creatorBalance1,
      ",creatorBalance2:",
      creatorBalance2
    );
    let smartBalance2 = await metabet.getEthBalance();
    console.log(
      " smart [",
      metabet.address,
      "] liquidateAsset token smartBalance1:",
      smartBalance1,
      ",smartBalance2:",
      smartBalance2
    );
  });

  it("owner withdrawToken", async function () {
    let creatorBalance1 = await accounts[0].getBalance();
    let smartBalance1 = await metabet.getEthBalance();
    let metabetret = await metabet.withdrawToken({
      gasLimit: BigNumber.from("8000000"),
    });
    console.log(metabetret, "metabetret");

    let creatorBalance2 = await accounts[0].getBalance();
    console.log(
      "owner [",
      accounts[0].address,
      "] withdrawToken token creatorBalance1:",
      creatorBalance1,
      ",creatorBalance2:",
      creatorBalance2
    );
    let smartBalance2 = await metabet.getEthBalance();
    console.log(
      " smart [",
      metabet.address,
      "] withdrawToken token smartBalance1:",
      smartBalance1,
      ",smartBalance2:",
      smartBalance2
    );
  });
  it("getMatchSmartAssetInfo", async function () {
    let assetId = 5;
    let metabetret = await metabet.getMatchSmartAssetInfo(assetId, {
      gasLimit: BigNumber.from("8000000"),
    });
    console.log(metabetret, "getMatchSmartAssetInfo");
  });

  async function placeBet(type) {
    let indexAccount = type;
    // let token = metatoken;
    // let token = new ethers.Contract(
    //   tokenAddress,
    //   tokenAbi,
    //   accounts[indexAccount]
    // );
    // let metabet = new ethers.Contract(
    //   metaBetAddress,
    //   metaBetAbi,
    //   accounts[indexAccount]
    // );

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
      assetType: 0,
      payToken: ADDRESS_ZERO,
      payAmount: totalOdds,
    };
    //   function placeBet(
    //     uint256 _matchId,
    //     uint8 _resultBetOn,
    //     PayAsset calldata _payAsset
    // )

    const amount = totalOdds;

    let tbalance = await accounts[indexAccount].getBalance();
    console.log(accounts[indexAccount].address, "token balance:", tbalance);
    // await token
    //   .connect(accounts[indexAccount])
    //   .approve(metabet.address, totalOdds, {
    //     gasLimit: b("8000000"),
    //   });
    // console.log(token.address, "approve done:", totalOdds);

    console.log("placeBet:", _matchId, resultBetOn, payAsset);
    let metabetret = await metabet
      .connect(accounts[indexAccount])
      .placeBet(_matchId, resultBetOn, payAsset, {
        value: amount,
        gasLimit: BigNumber.from("8000000"),
      });
    console.log(metabetret, "placeBet metabetret");

    console.log("placeBet deposit done");
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

  async function print() {
    console.log("----------------------------------------------------");

    console.log("account0 erc:", d(await erc.balanceOf(accounts[0].address)));
    console.log("account1 erc:", d(await erc.balanceOf(accounts[1].address)));
    console.log("account2 erc:", d(await erc.balanceOf(accounts[2].address)));
    console.log(
      "metabet erc-" + metabet.address + ":",
      d(await erc.balanceOf(metabet.address))
    );

    console.log("----------------------------------------------------");
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
    return bn.div("1000000000000000").toNumber() / 1000;
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
});

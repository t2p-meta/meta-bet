const { expect, assert } = require("chai");
const { BigNumber, utils } = require("ethers");
const fs = require("fs");
const hre = require("hardhat");
const keccak256 = require("keccak256");
const toWei = (value) => utils.parseEther(value.toString());
const fromWei = (value) =>
  utils.formatEther(typeof value === "string" ? value : value.toString());

// const getBalance = provider.getBalance;

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
  it("Deployment MetaPlaceBet", async function () {
    const _bet = await ethers.getContractFactory("MetaPlaceBet");
    metabet = await _bet.deploy();
    metaBetAddress = metabet.address;
    console.log("Deployment metabet:............:", metabet.address);
  });

  /**
   * 1. 押注竞猜比赛
   */
  it("placeBetMatch", async function () {
    // function placeBetMatch(
    //   bytes32 _hashId,
    //   uint256 _matchId,
    //   // 比赛参与方信息：(主场):(客场):(次场)
    //   string calldata _matchTeamName,
    //   // 押注team队名称
    //   string calldata _betTeamName,
    //   // 押注金额
    //   uint256 _payAmount,
    //   // 押注用户Code
    //   uint256 _userCode,
    //   // 最终赢率（含本金） finalOdds
    //   uint256 _finalOdds
    let _hashId = utils.keccak256(utils.toUtf8Bytes("1"));

    let _matchId = "1";
    let _matchTeamName = "(Home)Baxi:(Away)xibaya";
    let _betTeamName = "Baxi";
    let _payAmount = "100";
    let _userCode = "10001";
    let _finalOdds = "8";
    let metabetret = await metabet.placeBetMatch(
      _hashId,
      _matchId,
      _matchTeamName,
      _betTeamName,
      _payAmount,
      _userCode,
      _finalOdds,
      {
        gasLimit: BigNumber.from("8000000"),
      }
    );
    console.log(metabetret, "placeBetMatch");
    console.log(
      "placeBetMatch deposit done===================================="
    );
    let PlaceBetInfo = await metabet.getPlaceBetInfo(_hashId);
    console.log("getPlaceBetInfo Info:", PlaceBetInfo);
  });
  /**
   * 2. 提现竞猜比赛
   */
  it("Withdraw", async function () {
    // bytes32 _hashId,
    // uint256 _matchId,
    // // 赢家手续费率 8% winnerfeerate (让玩家自己设置)
    // uint256 _winnerFeeRate,
    // // 手续费金额
    // uint256 _feesAmount,
    // // withdraw_到手提款金额
    // uint256 _withdrawAmount,
    // // 最终赢率（含本金） finalOdds
    // uint256 _finalOdds,
    // // 最终押注总金额
    // RealTimeAmount calldata _finalTotalAmount
    // // 实时押注时间节点累计总金额：A
    // uint256 totalPayoutTeamA;
    // // 实时押注时间节点累计总金额：B
    // uint256 totalPayoutTeamB;
    // // 实时押注时间节点累计总金额：O
    // uint256 totalPayoutDraw;
    let _hashId = utils.keccak256(utils.toUtf8Bytes("1"));

    let _matchId = "1";
    let _winnerFeeRate = "8";
    let _feesAmount = "2";
    let _withdrawAmount = "92";
    let _finalOdds = "8";
    let _finalTotalAmount = {
      totalPayoutTeamA: "100",
      totalPayoutTeamB: "100",
      totalPayoutDraw: "100",
    };
    let metabetret = await metabet.withdraw(
      _hashId,
      _matchId,
      _winnerFeeRate,
      _feesAmount,
      _withdrawAmount,
      _finalOdds,
      _finalTotalAmount,
      {
        gasLimit: BigNumber.from("8000000"),
      }
    );
    console.log(metabetret, "Withdraw");
    console.log("Withdraw deposit done=============================");
    let PlaceBetInfo = await metabet.getWithdraw(_hashId);
    console.log("getWithdraw Info:", PlaceBetInfo);
  });

  async function view() {
    const accounts = await hre.ethers.getSigners();

    let token = new ethers.Contract(tokenAddress, tokenAbi, accounts[0]);
    let tbalance = b(await token.balanceOf(metaBetAddress));
    console.log(metaBetAddress, "token balance:", tbalance);
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

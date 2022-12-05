const hre = require("hardhat");
const fs = require("fs");
const { BigNumber, utils } = require("ethers");
const toWei = (value) => utils.parseEther(value.toString());
const fromWei = (value) =>
  utils.formatEther(typeof value === "string" ? value : value.toString());

const metaPlaceBetAbi = getAbi(
  "./artifacts/contracts/MetaPlaceBet.sol/MetaPlaceBet.json"
);

/**
 * 1. 部署合约
 */
async function deployMetaPlaceBet() {
  const accounts = await hre.ethers.getSigners();
  // let token = new ethers.Contract(tokenAddress, tokenAbi, accounts[0]);
  // let tbalance = await token.balanceOf(accounts[0].address);
  console.log(accounts[0].address, " balance:", await accounts[0].getBalance());
  // console.log(accounts[0].address, "token balance:", tbalance);

  const _MetaBet = await ethers.getContractFactory("MetaPlaceBet");
  let MetaBet = await _MetaBet.deploy({
    gasLimit: BigNumber.from("8000000"),
  });
  await MetaBet.deployed();
  console.log("MetaBet deployed to:", MetaBet.address);
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
// ====================================================================================
//matic
let _leagueId = 1;
let _matchId = 1;
var tokenAddress = "0x444838C1f0a0e86114DE6d481c5dde98c4ba75FD";
var metaBetAddress = "0x69Dad5326D8CAf00DA04462C0a3f36Ec9857CCAA"; //

// var metaBetMatchAddress = "0x56b42ba638A98C93D7b4c4A36497109D5FFfee16"; // 0.9
// // var metaBetMatchAddress = "0xEAd6c0203C6759897863B8CE21a085dB189da5e2"; // 0.9

// let _linkToken = "0x326C977E6efc84E512bB9C30f76E30c160eD06FB";
// let _oracle = "0x62F09970A26d62C4beB702553A7372e5F93FCC54";
// let _job = "8c96e326-692b-45c3-83eb-d0d0dbe7bfc5";

// ====================================================================================

// var tokenAddress = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174"; // USDC-Polygon
// var metaBetAddress = "0x2DDF91cf0188E899C16D289FAdc17A530511D4E3"; //

// var tokenAddress = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174"; // USDC-trust
// var metaBetAddress = "0xa186F1ceF8c271713C4A702E8d2806b18293621F"; //

var metaBetMatchAddress = "0x56b42ba638A98C93D7b4c4A36497109D5FFfee16"; // 0.9
// var metaBetMatchAddress = "0xEAd6c0203C6759897863B8CE21a085dB189da5e2"; // 0.9

let _linkToken = "0x326C977E6efc84E512bB9C30f76E30c160eD06FB";
let _oracle = "0x62F09970A26d62C4beB702553A7372e5F93FCC54";
let _job = "8c96e326-692b-45c3-83eb-d0d0dbe7bfc5";

// 1.部署合约
deployMetaPlaceBet()
  // withdrawLink(0.9)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

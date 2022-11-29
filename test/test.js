const { expect, assert } = require("chai");
const { BigNumber, utils } = require("ethers");
const fs = require("fs");
const hre = require("hardhat");
const keccak256 = require("keccak256");
const toWei = (value) => utils.parseEther(value.toString());
const fromWei = (value) =>
  utils.formatEther(typeof value === "string" ? value : value.toString());

function test() {
  let bettor = "222956141398851584";
  bettor = utils.getCreate2Address()
  console.log("placeBet:", bettor);
}

test();

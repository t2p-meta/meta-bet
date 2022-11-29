const fs = require("fs");
var Web3 = require("web3");
var config = require("./config.js");
var utils = require("./utils.js");
const HDWalletProvider = require("@truffle/hdwallet-provider");

const provider = new HDWalletProvider({
  privateKeys: [config.privateKey],
  providerOrUrl: config.apiUrl,
  chainId: config.chainId,
});
console.log(config.privateKey,provider,"config.privateKey")

const web3 = new Web3(provider);

const truffle_contract = require("@truffle/contract");

/**
 * 调用合约
 * @param {合约名称} abi_name
 * @returns
 */
async function getContract(abi_name) {
  var abi = require(abi_name);
  var contract = truffle_contract(abi);
  contract.setProvider(web3.currentProvider);
  var gasPrice = await getCurrentGasPrice();
  console.log(gasPrice, "gasPrice....");
  if (gasPrice.error) return gasPrice;
  contract.defaults({
    gasPrice: gasPrice,
    gas: "8000000",
  });

  return contract;
}
async function getCurrentGasPrice() {
  try {
    return await web3.eth.getGasPrice();
  } catch (e) {
    return { error: e.message };
  }
}
async function deployMetabet() {
  var tokenAddress = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174"; // USDC-trust
  var contract = await getContract("../build/contracts/Metabet.json");
  try {
    return await contract.new(tokenAddress, { from: provider.addresses[0] });
  } catch (e) {
    return { error: e.message };
  }
}

async function create() {
  var address = provider.addresses[0].toLocaleLowerCase();
  var filename = "./" + address + "_" + config.chainId + ".json";
  var data = await utils.readJsonFile(filename);
  var result = null;
  if (!data.Metabet) {
    console.log("create Metabet...");
    result = await deployMetabet();
    if (result.error) {
      console.log("create Metabet error", result.error);
      process.exit();
    }
    console.log("create Metabet address:", result.address);
    data.Metabet = {
      address: result.address,
    };
    await utils.writeJsonFile(filename, data);
  }

  process.exit();
}

create();

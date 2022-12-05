require('dotenv').config()
const privatekey = process.env.DEDROPS_PK
const privatekeyPro = process.env.DEDROPS_PK_PRO

// module.exports = {
//   privateKey: privatekey,
//   apiUrl: "https://rpc-mumbai.maticvigil.com/v1/b1f5d4962bc80b3a332a62c1704295b098f08186",
//   chainId: 80001,
//   NFTName: "The2ndPlanetNFT",// nft合约名称
//   CardNFTName: "The2ndPlanet",// 卡牌nft合约名称
//   BoxNFTName: "The2ndPlanetBlindBoxNFT", // 盲盒开出NFT的名称
//   miner: "0x671de58Bd1EDE160c5D46Ba853A5fB157541E4eB",//  铸造nft时，授权的钱包地址
//   beneficiary: "0x98370b1e5335BBc1382A4858ae15a989668142b1", // 收取手续费钱包地址
//   buyerFeeSigner: "0xb450f1292110192994f5C88250a34897D7AC5CE3", // 交易授权签名钱包地址
// }
module.exports = {
  privateKey: privatekeyPro,
  apiUrl: "https://polygon-rpc.com/",
  chainId: 137,
  NFTName: "Planet2nd",
  BoxNFTName: "Planet2ndBox",
  miner: "0x427906aE4E7b2b3c0C8A3156247BFabd62685Db8",
  beneficiary: "0x1D06B226Bc315FeAD4F41f70eC5e79De3a51a8F3",
  buyerFeeSigner: "0x972EB49778d141fEdD58757d4b6079022eff757F",
}
// polygon测试
// module.exports = {
//   privateKey: privatekey,
//   apiUrl: 'https://matic-mumbai.chainstacklabs.com',
//   chainId: 80001,
//   NFTName: 'Planet2ndMain',
//   BoxNFTName: 'Planet2ndBox',
//   miner: '0x671de58Bd1EDE160c5D46Ba853A5fB157541E4eB',
//   beneficiary: '0x98370b1e5335BBc1382A4858ae15a989668142b1',
//   buyerFeeSigner: '0xb450f1292110192994f5C88250a34897D7AC5CE3',
// }
// polygon正式
// module.exports = {
//   privateKey: "42ae4760d41c3a97512f75019ea8381da91bb96a6b620221336e269317668032",
//   apiUrl: "https://polygon-mainnet.g.alchemy.com/v2/qmYIHeSQzEsSianB_a8HEctWst451vSd/",
//   chainId: 137,
//   NFTName: "Planet2nd",
//   BoxNFTName: "Planet2ndBox",
//   miner: "0x427906aE4E7b2b3c0C8A3156247BFabd62685Db8",
//   beneficiary: "0x1D06B226Bc315FeAD4F41f70eC5e79De3a51a8F3",
//   buyerFeeSigner: "0x972EB49778d141fEdD58757d4b6079022eff757F",
// }
// moonbase-alphanet
// module.exports = {
//   privateKey: privatekey,
//   apiUrl: "https://rpc.api.moonbase.moonbeam.network",
//   chainId: 1287,
//   NFTName: "Planet2ndMain",
//   BoxNFTName: "Planet2ndBox",
//   miner: "0x671de58Bd1EDE160c5D46Ba853A5fB157541E4eB",
//   beneficiary: "0x98370b1e5335BBc1382A4858ae15a989668142b1",
//   buyerFeeSigner: "0xb450f1292110192994f5C88250a34897D7AC5CE3",
// }

// testnet-coinex
// module.exports = {
//   privateKey: privatekey,
//   apiUrl: "https://testnet-rpc.coinex.net",
//   chainId: 53,
//   NFTName: "Planet2ndMain",
//   BoxNFTName: "Planet2ndBox",
//   miner: "0x671de58Bd1EDE160c5D46Ba853A5fB157541E4eB",
//   beneficiary: "0x98370b1e5335BBc1382A4858ae15a989668142b1",
//   buyerFeeSigner: "0xb450f1292110192994f5C88250a34897D7AC5CE3",
// }

// Klaytn Testnet Baobab
// module.exports = {
//   privateKey: privatekey,
//   apiUrl: "https://api.baobab.klaytn.net:8651",
//   chainId: 1001,
//   NFTName: "Planet2ndMain",
//   BoxNFTName: "Planet2ndBox",
//   miner: "0x671de58Bd1EDE160c5D46Ba853A5fB157541E4eB",
//   beneficiary: "0x98370b1e5335BBc1382A4858ae15a989668142b1",
//   buyerFeeSigner: "0xb450f1292110192994f5C88250a34897D7AC5CE3",
// }

// Trust EVM Testnet
// module.exports = {
//   privateKey: privatekey,
//   apiUrl: "https://api.testnet-dev.trust.one",
//   chainId: 15555,
//   NFTName: "Planet2ndMain",
//   BoxNFTName: "Planet2ndBox",
//   miner: "0x671de58Bd1EDE160c5D46Ba853A5fB157541E4eB",
//   beneficiary: "0x98370b1e5335BBc1382A4858ae15a989668142b1",
//   buyerFeeSigner: "0xb450f1292110192994f5C88250a34897D7AC5CE3",
//   gas: '10000000',
// }

// BTTC Donau测试网
// module.exports = {
//   privateKey: privatekey,
//   apiUrl: "https://pre-rpc.bt.io/",
//   chainId: 1029,
//   NFTName: "Planet2ndMain",
//   BoxNFTName: "Planet2ndBox",
//   miner: "0x671de58Bd1EDE160c5D46Ba853A5fB157541E4eB",
//   beneficiary: "0x98370b1e5335BBc1382A4858ae15a989668142b1",
//   buyerFeeSigner: "0xb450f1292110192994f5C88250a34897D7AC5CE3",
// }

// Aurora Testnet 测试网
// module.exports = {
//   privateKey: privatekey,
//   apiUrl: 'https://aurora-testnet.infura.io/v3/45f40220ec594e35bc80c2e20a234e4a',
//   // 使用 https://testnet.aurora.dev 地址 
//   // 报错：Error: PollingBlockTracker - encountered an error while attempting to update latest block: undefined
//   // apiUrl: 'https://testnet.aurora.dev', 
//   chainId: 0x4e454153,
//   NFTName: 'Planet2ndMain',
//   BoxNFTName: 'Planet2ndBox',
//   miner: '0x671de58Bd1EDE160c5D46Ba853A5fB157541E4eB',
//   beneficiary: '0x98370b1e5335BBc1382A4858ae15a989668142b1',
//   buyerFeeSigner: '0xb450f1292110192994f5C88250a34897D7AC5CE3',
//   gas: '10000000',
// }

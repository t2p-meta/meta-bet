require("dotenv").config();
require("@nomiclabs/hardhat-waffle");

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async () => {
	const accounts = await ethers.getSigners();

	for (const account of accounts) {
		console.log(account.address);
	}
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
	defaultNetwork: 'hardhat',
	networks: {
		hardhat: {

		},
		// ethtestaliyun: {
		// 	url: 'http://8.140.129.110:8545',
		// 	chainId: 8889,
		// 	from: process.env.ETH_ADDRESS_0,
		// 	accounts: [
		// 		process.env.ETH_PK_0,
		// 		process.env.ETH_PK_1,
		// 		process.env.ETH_PK_2
		// 	],
		// 	gas:      2100000,
		// 	gasPrice: 8000000000,
		// 	gasMultiplier: 1, //用于乘以气体估计结果的数字,默认值1
		// 	blockGasLimit: 96000000000,// gas 限制。默认值：30000000 (3gwei)
		// 	minGasPrice: 2000,//最低 gas 价格,默认0we

		// },
	// //kovan链-以太坊
	// 	kovan: {
	// 		url: 'https://kovan.infura.io/v3/c7cd730e3f1e4f9a8c702c6cb9d17f3f',
	// 		chainId: 42,
	// 		from: process.env.ETH_ADDRESS_0,
	// 		accounts: [
	// 			process.env.ETH_PK_0,
	// 			process.env.ETH_PK_1,
	// 			process.env.ETH_PK_2
	// 		]
	// 	},
	// 	// ok链-
	// 	okex_testnet: {
	// 		url: 'https://exchaintestrpc.okex.org',
	// 		chainId: 65,
	// 		from: process.env.ETH_ADDRESS_0,
	// 		accounts: [
	// 			process.env.ETH_PK_0,
	// 			process.env.ETH_PK_1,
	// 			process.env.ETH_PK_2
	// 		]
	// 	},
	// 	// 火币
	// 	heco_testnet: {
	// 		url: 'https://http-testnet.hecochain.com',
	// 		chainId: 256,
	// 		from: process.env.ETH_ADDRESS_0,
	// 		accounts: [
	// 			process.env.ETH_PK_0,
	// 			process.env.ETH_PK_1,
	// 			process.env.ETH_PK_2
	// 		]
	// 	},
	// 	// 币安
	// 	bsc_testnet: {
	// 		url: 'https://data-seed-prebsc-1-s1.binance.org:8545',
	// 		chainId: 97,
    //   gasPrice: 20000000000,
	// 		from: process.env.ETH_ADDRESS_0,
	// 		accounts: [
	// 			process.env.ETH_PK_0,
	// 			process.env.ETH_PK_1,
	// 			process.env.ETH_PK_2
	// 		],
    //   timeout:60000
	// 	},
	// 	// 币安-主网
	// 	bsc_mainnet: {
	// 		url: 'https://bsc-dataseed2.binance.org/',
	// 		chainId: 56,
	// 		from: process.env.ETH_ADDRESS_0,
	// 		accounts: [
	// 			process.env.ETH_PK_0,
	// 			process.env.ETH_PK_1,
	// 			process.env.ETH_PK_2
	// 		]
	// 	},
	// 	// poligy
	// 	matic_mainnet: {
	// 		// url: 'https://rpc-mainnet.maticvigil.com/v1/6ca36da1323f40dc42d64ed9ba89da9a6f59c23d',
	// 		// url: 'https://rpc-mainnet.matic.network',
	// 		url: 'https://matic-mainnet.chainstacklabs.com',
	// 		// url: 'https://rpc-mainnet.matic.quiknode.pro',
	// 		// url: 'https://matic-mainnet-full-rpc.bwarelabs.com',
	// 		// url: 'https://matic-mainnet-archive-rpc.bwarelabs.com',
	// 		chainId: 137,
	// 		from: process.env.DEDROPS_SERVER,
	// 		accounts: [
	// 			process.env.DEDROPS_PK,
	// 			process.env.ETH_PK_1,
	// 			process.env.ETH_PK_2
	// 		]
	// 	}
		// poligy
		poligy_testnet: {
			// url: 'https://rpc-mainnet.maticvigil.com/v1/6ca36da1323f40dc42d64ed9ba89da9a6f59c23d',
			// url: 'https://rpc-mainnet.matic.network',
			url: 'https://rpc-mumbai.maticvigil.com/',
			// url: 'https://rpc-mainnet.matic.quiknode.pro',
			// url: 'https://matic-mainnet-full-rpc.bwarelabs.com',
			// url: 'https://matic-mainnet-archive-rpc.bwarelabs.com',
			chainId: 80001,
			from: process.env.DEDROPS_SERVER,
			accounts: [
				process.env.DEDROPS_PK,
				process.env.ETH_PK_1,
				process.env.ETH_PK_2,
				process.env.ETH_PK_3,
				process.env.ETH_PK_4,
				process.env.ETH_PK_5,
				process.env.ETH_PK_6
			]
		},
		// Aurora Network
		// aurora_testnet: {
		// 	url: 'https://testnet.aurora.dev/',
		// 	chainId: 1313161555,
		// 	from: process.env.ETH_ADDRESS_0,
		// 	accounts: [
		// 		process.env.DEDROPS_PK,
		// 		process.env.ETH_PK_1,
		// 		process.env.ETH_PK_2
		// 	]
		// }
	},
	solidity: {
		version: "0.8.12",
		settings: {
			optimizer: {
				enabled: true,
				runs: 200
			}
		}
	},
	mocha:{
		timeout:60000
	}
};
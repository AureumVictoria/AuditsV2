const { config } = require("dotenv");

require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-vyper");
require("@nomiclabs/hardhat-etherscan");
require('solidity-coverage')

config();
const PRIVATE_KEY = process.env.PRIVATE_KEY || "";
const FTMSCAN_API_KEY = process.env.FTMSCAN_API_KEY || "";

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

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
  solidity: {
    compilers: [
      {
        version: '0.8.11'
      }
    ],
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
    overrides: {
      "contracts/DATA/weth.sol": {
        version: "0.5.0",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        }
      },
      "contracts/DATA/STABLEToken.sol": {
        version: "0.6.12",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        }
      },
      "contracts/DATA/BlacklistFactory.sol": {
        version: "0.6.12",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        }
      },
      "contracts/DATA/veVoteProxy.sol": {
        version: "0.8.17",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        }
      },
      "contracts/DATA/StableMinter.sol": {
        version: "0.6.12",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        }
      },
      "contracts/AMM/BaseFactory.sol": {
        version: "0.8.17",
        settings: {
          optimizer: {
            enabled: true,
            runs: 10,
          },
        }
      },
      "contracts/BribeFactory/BribeFactory.sol": {
        version: "0.8.17",
        settings: {
          optimizer: {
            enabled: true,
            runs: 10,
          },
        }
      },
      "contracts/GaugeFactory/GaugeFactory.sol": {
        version: "0.8.17",
        settings: {
          optimizer: {
            enabled: true,
            runs: 10,
          },
        }
      },
      "contracts/DATA/Usdc.sol": {
        version: "0.8.1",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        }
      },
      "contracts/AMM/BaseRouter01.sol": {
        version: "0.8.11",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        }
      },
      "contracts/AMM/BasePair.sol": {
        version: "0.8.11",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        }
      },
      "contracts/AMM/BaseFees.sol": {
        version: "0.8.11",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        }
      },
      "contracts/DATA/Referrals.sol":{
        version: "0.8.4",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        }
      },
      "contracts/DATA/STABLE.sol":{
        version: "0.6.12",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        }
      },
      "contracts/Uni-AMM/DATARouter.sol": {
        version: "0.6.6",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        }
      },
    }
  },

  
  vyper: {
    version: "0.2.8",
  },
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545"
    },
    hardhat: {      
    },
    mainnet: {
      url:
      "https://rpc.ftm.tools/",
      chainId: 250,
      accounts: [PRIVATE_KEY],
    },
    testnet: {
      url:
        "https://rpc.testnet.fantom.network/",
      chainId: 4002,
      accounts: [PRIVATE_KEY],
    }
  },
  etherscan: {
    apiKey: FTMSCAN_API_KEY
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  mocha: {
    timeout: 300000,
  },
};

require("@nomicfoundation/hardhat-toolbox")

const { vars } = require("hardhat/config");

// Go to https://infura.io, sign up, create a new API key
// in its dashboard, and add it to the configuration variables
const INFURA_API_KEY = vars.get("INFURA_API_KEY");

// Add your Sepolia account private key to the configuration variables
// To export your private key from Coinbase Wallet, go to
// Settings > Developer Settings > Show private key
// To export your private key from Metamask, open Metamask and
// go to Account Details > Export Private Key
// Beware: NEVER put real Ether into testing accounts
const SEPOLIA_PRIVATE_KEY = vars.get("SEPOLIA_PRIVATE_KEY");

task("transfer", "transfer balance")
  .addParam("account", "The account's address")
  .setAction(async (taskArgs) => {
    const [owner] = await ethers.getSigners();
    const tx = await owner.sendTransaction({
      to: taskArgs.account,
      value: ethers.parseUnits("1", "ether"),
    });
    const accountBalance = await ethers.provider.getBalance(taskArgs.account);
    console.log(ethers.formatEther(accountBalance), "ETH");
  });

  task("balance", "Prints an account's balance")
  .addParam("account", "The account's address")
  .setAction(async (taskArgs) => {
    const balance = await ethers.provider.getBalance(taskArgs.account);
    console.log(ethers.formatEther(balance), "ETH");
  });

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.19",
  networks: {
    hardhat: {
      mining: {
        auto: false,
        interval: 7000
      },
    },
    sepolia: {
      url: `https://sepolia.infura.io/v3/${INFURA_API_KEY}`,
      accounts: [SEPOLIA_PRIVATE_KEY],
    }
  }
};

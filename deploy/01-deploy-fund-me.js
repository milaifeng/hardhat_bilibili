const { network } = require("hardhat")
const { developmentChains, networkConfig, LOCK_TIME } = require("../helper-hardhat-config")


module.exports = async ({ getNamedAccounts, deployments }) => {
  const { firstAccount } = await getNamedAccounts()
  const { deploy } = deployments

  let dataFeedAddr
  let confirmations
  if (developmentChains.includes(network.name)) {
    const MockV3Aggregator = await deployments.get("MockV3Aggregator")
    dataFeedAddr = MockV3Aggregator.address
    confirmations = 0
  } else {
    dataFeedAddr = networkConfig[network.config.chainId].ethUsdDataFeed
    confirmations = 3
  }

  const FundMe = await deploy("FundMe", {
    from: firstAccount,
    args: [LOCK_TIME, dataFeedAddr],
    log: true,
    waitConfirmations: confirmations
  })

  if (hre.network.config.chainId == 11155111 && process.env.API_KEY) {
    console.log(`FundMe address is ${FundMe.address}`)
    await hre.run("verify:verify", {
      address: FundMe.address,
      constructorArguments: [LOCK_TIME, dataFeedAddr],
    });
  } else {
    console.log("network is not sepolia, verify skip")
  }
}

module.exports.tags = ["all", "fundme"]
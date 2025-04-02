const { DECIMAL, INITIAL_ANSWER, developmentChains } = require("../helper-hardhat-config")

module.exports = async ({ getNamedAccounts, deployments }) => {
  if (developmentChains.includes(network.name)) {
    const { firstAccount } = await getNamedAccounts()
    const { deploy } = deployments

    await deploy("MockV3Aggregator", {
      from: firstAccount,
      args: [DECIMAL, INITIAL_ANSWER],
      log: true
    })
  } else {
    console.log("mock  contract deployment is skip")
  }

}

module.exports.tags = ["all", "mock"]
const DECIMAL = 8
const INITIAL_ANSWER = 180000000000
const developmentChains = ["hardhat", "localhost"]
const LOCK_TIME = 180
const networkConfig = {
  11155111: {
    ethUsdDataFeed: "0x694AA1769357215DE4FAC081bf1f309aDC325306"
  }
}
module.exports = {
  DECIMAL,
  INITIAL_ANSWER,
  developmentChains,
  networkConfig,
  LOCK_TIME
}
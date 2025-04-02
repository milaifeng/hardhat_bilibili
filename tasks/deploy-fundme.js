const { task } = require("hardhat/config")

task("deploy-fundme", "deploy fundme contract").setAction(async (taskArgs, hre) => {
  const fundMeFactory = await ethers.getContractFactory("FundMe")
  const fundMe = await fundMeFactory.deploy(30)
  await fundMe.waitForDeployment()
  console.log(`contract has been deployed successfully,contract address is ${fundMe.target}`);

  if (hre.network.config.chainId == 11155111 && process.env.API_KEY) {
    console.log("Wait for 5 confirmations")
    await fundMe.deploymentTransaction().wait(3) //等待3个区块确认

    await hre.run("verify:verify", {
      address: fundMe.target,
      constructorArguments: [30000],
    });
  }
})


module.exports = {}
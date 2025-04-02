const { task } = require("hardhat/config")

task("interact-fundme", "interact fundme contract")
  .addParam("addr", "fundme contract address")
  .setAction(async (taskArgs, hre) => {
    const fundMeFactory = await ethers.getContractFactory("FundMe")
    const fundMe = fundMeFactory.attach(taskArgs.addr)
    // 创建两个账户
    const [firstAccount, secondAccount] = await ethers.getSigners()
    // 使用第一个账户 fund 合约 
    const fundTx = await fundMe.fund({ value: ethers.parseEther("0.1") })
    await fundTx.wait()
    // 检查合约的余额
    const balanceOfContract = await ethers.provider.getBalance(fundMe.target)
    console.log(`Balance of the contract is ${balanceOfContract}`)
    // 使用第二个账户 fund 合约 
    const fundTxWithTwo = await fundMe.connect(secondAccount).fund({ value: ethers.parseEther("0.1") })
    await fundTxWithTwo.wait()
    // 检查合约的余额
    const balanceOfContractTwo = await ethers.provider.getBalance(fundMe.target)
    console.log(`Balance of the contract is ${balanceOfContractTwo}`)
    // 检查合约里面fund的记录
    const firstAccountBalanceInFundMe = await fundMe.fundersToAmount(firstAccount.address)
    const secondAccountBalanceInFundMe = await fundMe.fundersToAmount(secondAccount.address)
    console.log(`Balance of first account ${firstAccount.address} is ${firstAccountBalanceInFundMe}`)
    console.log(`Balance of second account ${secondAccount.address} is ${secondAccountBalanceInFundMe}`)
  })

module.exports = {} 
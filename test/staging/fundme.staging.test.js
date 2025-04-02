const { ethers, deployments, getNamedAccounts } = require("hardhat")
const { assert, expect } = require("chai")
const helpers = require("@nomicfoundation/hardhat-network-helpers")
const { developmentChains } = require("../../helper-hardhat-config")

developmentChains.includes(network.name)
  ? describe.skip
  : describe(" staging test fundme contract", async function () {
    let fundMe
    let firstAccount
    beforeEach(async function () {
      await deployments.fixture(["all"])
      firstAccount = (await getNamedAccounts()).firstAccount
      const fundMeDeployment = await deployments.get("FundMe")
      fundMe = await ethers.getContractAt("FundMe", fundMeDeployment.address)
    })
    //test fund and getfund successfunlly
    it("fund and getfund successfunlly", async function () {
      //make sure target reached
      await fundMe.fund({ value: ethers.parseEther("0.1") }) //1867$ * 0.1
      //make sure window closed
      await new Promise(resolve => setTimeout(resolve, 181 * 1000))
      //make sure we can get receipt
      const getFundtx = await fundMe.getFund()
      const getFundReceipt = await getFundtx.wait()
      expect(getFundReceipt)
        .to.be.emit(fundMe, "FundWithDrawByOwner")
        .withArgs(ethers.parseEther("0.1"))

    })
    //test fund and refund successfunlly

    it("fund and refund successfunlly", async function () {
      //make sure target is not reached
      await fundMe.fund({ value: ethers.parseEther("0.01") }) //1867$ * 0.01
      //make sure window closed
      await new Promise(resolve => setTimeout(resolve, 181 * 1000))
      //make sure we can get receipt
      const reFundTx = await fundMe.refund()
      const reFundReceipt = await reFundTx.wait()
      expect(reFundReceipt)
        .to.be.emit(fundMe, "RefundByFunder")
        .withArgs(firstAccount, ethers.parseEther("0.01"))
    })

  })
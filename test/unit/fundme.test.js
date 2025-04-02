const { ethers, deployments, getNamedAccounts, network } = require("hardhat")
const { assert, expect } = require("chai")
const helpers = require("@nomicfoundation/hardhat-network-helpers")
const { developmentChains } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
  ? describe.skip
  : describe(" unit test fundme contract", async function () {
    let fundMe
    let firstAccount
    let fundMesecondAccount
    let secondAccount
    let mockV3Aggregator
    beforeEach(async function () {
      await deployments.fixture(["all"])
      firstAccount = (await getNamedAccounts()).firstAccount
      secondAccount = (await getNamedAccounts()).secondAccount
      const fundMeDeployment = await deployments.get("FundMe")
      mockV3Aggregator = await deployments.get("MockV3Aggregator")
      fundMe = await ethers.getContractAt("FundMe", fundMeDeployment.address)
      fundMesecondAccount = await ethers.getContract("FundMe", secondAccount)
    })

    it("test if the owner is msg.sender", async function () {
      await fundMe.waitForDeployment() //等待合约部署成功
      assert.equal((await fundMe.owner()), firstAccount)
    })

    it("test if the datafeed is assigned correctly", async function () {
      await fundMe.waitForDeployment() //等待合约部署成功
      assert.equal((await fundMe.dataFeed()), mockV3Aggregator.address)
    })
    // it("test if the owner is msg.sender", async function () {
    //   const [firstAccount] = await ethers.getSigners()
    //   const fundMeFactory = await ethers.getContractFactory("FundMe")
    //   const fundMe = await fundMeFactory.deploy(180)
    //   await fundMe.waitForDeployment() //等待合约部署成功
    //   assert.equal((await fundMe.owner()), firstAccount.address)
    // })
    // test FundMe in fund function
    it("window closed,value is grater than minimum, fund failed",
      async function () {
        await helpers.time.increase(200) // 使区块时间流逝200s
        await helpers.mine() //模拟挖矿
        // 发送交易的值大于最小限制
        expect(fundMe.fund({ value: ethers.parseEther("0.1") }))
          .to.be.revertedWith("windows is closed")
      }
    )

    it("window open , value is less than minimum, fund failed",
      async function () {
        expect(fundMe.fund({ value: ethers.parseEther("0.001") }))
          .to.be.revertedWith("send more Eth")
      })

    it("window open , value is grater than minimum,, fund success",
      async function () {
        await fundMe.fund({ value: ethers.parseEther("0.1") })
        const balance = await fundMe.fundersToAmount(firstAccount)
        expect(balance).to.equal(ethers.parseEther("0.1"))
      })

    // test for getFund
    //onlyOwner,windowClose,target reached
    it("not onwer, window closed,target reached,getFund failed",
      async function () {
        await fundMe.fund({ value: ethers.parseEther("1") })

        await helpers.time.increase(200) // 使区块时间流逝200s
        await helpers.mine() //模拟挖矿

        await expect(fundMesecondAccount.getFund())
          .to.be.revertedWith("Only the current Owner can do this!")

      }
    )

    it("window open,target reacher,getFund failed", async function () {
      await fundMe.fund({ value: ethers.parseEther("1") })
      await expect(fundMe.getFund())
        .to.be.revertedWith("Window is not closed")
    })

    it("window closed,target not reached,getFund failed", async function () {
      await fundMe.fund({ value: ethers.parseEther("0.01") })
      await helpers.time.increase(200) // 使区块时间流逝200s
      await helpers.mine() //模拟挖矿
      await expect(fundMe.getFund())
        .to.be.revertedWith("Target is not reached")

    })

    it("window closed,traget reached,getFund success", async function () {
      await fundMe.fund({ value: ethers.parseEther("1") })

      await helpers.time.increase(200) // 使区块时间流逝200s
      await helpers.mine() //模拟挖矿
      await expect(fundMe.getFund())
        .to.emit(fundMe, "FundWithDrawByOwner").withArgs(ethers.parseEther("1"))
    })

  })
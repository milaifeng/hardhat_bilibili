// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;
//众筹合约
import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

contract FundMe {
    mapping(address => uint256) public fundersToAmount;
    uint256 constant MINIMUM_VALUE = 1 * 10 ** 18; //USD

    AggregatorV3Interface public dataFeed;

    uint256 constant TARGET = 150 * 10 ** 18; // 150 USD

    address public owner;
    address public erc20Addr;

    bool public getFundSuccess;

    // 开始时间（秒）
    uint256 startTime;
    //锁定时长
    uint256 lockTime;

    event FundWithDrawByOwner(uint256);
    event RefundByFunder(address, uint256);

    constructor(uint256 _lockTime, address _dataFeeedAddr) {
        // sepolia testnet
        dataFeed = AggregatorV3Interface(_dataFeeedAddr);
        owner = msg.sender;
        startTime = block.timestamp;
        lockTime = _lockTime; //30mins+5sec
    }

    function fund() external payable {
        require(convertEthToUsd(msg.value) >= MINIMUM_VALUE, "Send more ETH");
        require(
            block.timestamp < startTime + lockTime,
            "Cannot fund during locking period"
        );
        fundersToAmount[msg.sender] = msg.value;
    }

    //获取预言机的Eth价格
    function getChainlinkDataFeedLatestAnswer() public view returns (int) {
        // prettier-ignore
        (
            /* uint80 roundID */,
            int answer,
            /*uint startedAt*/,
            /*uint timeStamp*/,
            /*uint80 answeredInRound*/
        ) = dataFeed.latestRoundData();
        return answer;
    }

    //Eth 转换成 USD
    function convertEthToUsd(
        uint256 ETHAmount
    ) internal view returns (uint256) {
        uint256 ethPrice = uint256(getChainlinkDataFeedLatestAnswer());
        return (ETHAmount * ethPrice) / (10 ** 8);
    }

    //如果达到了目标值则可以提款
    function getFund() external windowClose Onlyowner {
        require(
            convertEthToUsd(address(this).balance) >= TARGET,
            "Target is not reached"
        );
        uint256 balance = address(this).balance;
        fundersToAmount[msg.sender] = 0;
        payable(msg.sender).transfer(address(this).balance);
        getFundSuccess = true;
        emit FundWithDrawByOwner(balance);
    }

    //如果没有达到目标值则退款
    function refund() external windowClose {
        require(
            convertEthToUsd(address(this).balance) < TARGET,
            "Target is  reached"
        );
        require(fundersToAmount[msg.sender] != 0, "there is not fund for you");

        fundersToAmount[msg.sender] = 0;
        (bool success, ) = payable(msg.sender).call{
            value: fundersToAmount[msg.sender]
        }("");
        require(success, "transfer tx failed");
        emit RefundByFunder(msg.sender, fundersToAmount[msg.sender]);
    }

    function setFunderToAmount(address funder, uint256 value) external {
        require(msg.sender == erc20Addr, "Call from other contract");
        fundersToAmount[funder] = value;
    }

    function setErc20Addr(address _erc20Addr) public Onlyowner {
        erc20Addr = _erc20Addr;
    }

    function transferOwnership(address newOwner) public Onlyowner {
        owner = newOwner;
    }

    modifier windowClose() {
        require(
            block.timestamp >= startTime + lockTime,
            "Window is not closed"
        );
        _;
    }
    modifier Onlyowner() {
        require(msg.sender == owner, "Only the current Owner can do this!");
        _;
    }
}

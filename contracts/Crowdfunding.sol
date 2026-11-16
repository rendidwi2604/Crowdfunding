// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title RuangBaik — direct crowdfunding on Ethereum Sepolia
/// @notice Creators may withdraw partially once the goal is reached OR the deadline ends.
/// Funds remain with the creator even if the goal is not reached; no refunds.
contract Crowdfunding {
    struct Campaign { address creator; uint256 target; uint256 deadline; uint256 raised; uint256 withdrawn; }
    mapping(uint256 => Campaign) private campaigns;
    uint256 public campaignCount;
    bool private locked;
    event CampaignCreated(uint256 indexed campaignId, address indexed creator, uint256 target, uint256 deadline);
    event DonationReceived(uint256 indexed campaignId, address indexed donor, uint256 amount, uint256 timestamp);
    event FundsWithdrawn(uint256 indexed campaignId, address indexed creator, uint256 amount, uint256 totalWithdrawn, uint256 timestamp);
    modifier exists(uint256 id) { require(id < campaignCount, "Campaign not found"); _; }
    modifier nonReentrant() { require(!locked, "Reentrant call"); locked = true; _; locked = false; }

    function createCampaign(uint256 target, uint256 deadline) external returns (uint256 id) {
        require(target > 0, "Target must be positive");
        require(deadline > block.timestamp, "Deadline must be future");
        id = campaignCount++;
        campaigns[id] = Campaign(msg.sender, target, deadline, 0, 0);
        emit CampaignCreated(id, msg.sender, target, deadline);
    }
    function donateToCampaign(uint256 id) external payable exists(id) {
        Campaign storage c = campaigns[id];
        require(block.timestamp < c.deadline, "Campaign ended");
        require(msg.value > 0, "Donation must be positive");
        c.raised += msg.value;
        emit DonationReceived(id, msg.sender, msg.value, block.timestamp);
    }
    function withdrawFunds(uint256 id, uint256 amount) external exists(id) nonReentrant {
        Campaign storage c = campaigns[id];
        require(msg.sender == c.creator, "Only creator");
        require(amount > 0, "Amount must be positive");
        require(block.timestamp >= c.deadline || c.raised >= c.target, "Funding still active");
        require(amount <= c.raised - c.withdrawn, "Insufficient campaign balance");
        c.withdrawn += amount;
        (bool sent,) = payable(c.creator).call{value: amount}("");
        require(sent, "Transfer failed");
        emit FundsWithdrawn(id, msg.sender, amount, c.withdrawn, block.timestamp);
    }
    function getCampaignDetails(uint256 id) external view exists(id) returns (address creator, uint256 target, uint256 deadline, uint256 raised, uint256 withdrawn) {
        Campaign storage c = campaigns[id];
        return (c.creator, c.target, c.deadline, c.raised, c.withdrawn);
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title PenaltyCard - simple contract for issuing/clearing penalties and collecting fines
/// @notice Deployment requires NO input fields. Owner is the deployer (msg.sender).
contract PenaltyCard {
    address public owner;

    // penalties[address] = number of penalty points (simple integer)
    mapping(address => uint256) public penalties;

    // fixed fine per penalty (in wei). Default 0.01 ether (you can change via setFineAmount).
    uint256 public finePerPenalty = 0.01 ether;

    // threshold after which an address is considered "blocked" (read-only derived check)
    uint256 public blockThreshold = 3;

    // events
    event PenaltyIssued(address indexed who, uint256 newCount);
    event PenaltiesCleared(address indexed who);
    event PenaltyPaid(address indexed who, uint256 paidCount, uint256 amount);
    event Withdrawn(address indexed to, uint256 amount);
    event FineAmountChanged(uint256 newFine);
    event BlockThresholdChanged(uint256 newThreshold);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    /// @notice No-input constructor. Owner is the deployer.
    constructor() {
        owner = msg.sender;
    }

    /// @notice Issue a penalty to `who`. Only owner can call.
    /// @param who address receiving the penalty
    function issuePenalty(address who) external onlyOwner {
        require(who != address(0), "invalid address");
        penalties[who] += 1;
        emit PenaltyIssued(who, penalties[who]);
    }

    /// @notice Clear all penalties for `who`. Only owner can call.
    /// @param who address to clear penalties for
    function clearPenalties(address who) external onlyOwner {
        require(who != address(0), "invalid address");
        penalties[who] = 0;
        emit PenaltiesCleared(who);
    }

    /// @notice Check whether an address is blocked (penalties >= blockThreshold).
    /// @param who address to check
    function isBlocked(address who) public view returns (bool) {
        return penalties[who] >= blockThreshold;
    }

    /// @notice Pay fines to reduce penalties. Each `finePerPenalty` paid removes one penalty point.
    /// You can pay for multiple points by sending multiples of finePerPenalty.
    /// Any extra wei (not an exact multiple) will be refunded.
    function payFine() external payable {
        uint256 current = penalties[msg.sender];
        require(current > 0, "no penalties to pay");
        require(msg.value >= finePerPenalty, "not enough ether sent");

        // how many penalty points are paid for (integer division)
        uint256 numPaid = msg.value / finePerPenalty;
        if (numPaid > current) {
            numPaid = current; // cannot pay more points than current
        }

        // amount actually used to pay penalties
        uint256 usedAmount = numPaid * finePerPenalty;
        penalties[msg.sender] = current - numPaid;

        // refund any leftover wei sent (msg.value - usedAmount)
        uint256 refund = msg.value - usedAmount;
        if (refund > 0) {
            // using call to forward gas and avoid reentrancy on simple refund — still minimal risk here
            (bool sent, ) = payable(msg.sender).call{value: refund}("");
            require(sent, "refund failed");
        }

        emit PenaltyPaid(msg.sender, numPaid, usedAmount);
    }

    /// @notice Owner withdraws the contract balance.
    function withdraw() external onlyOwner {
        uint256 bal = address(this).balance;
        require(bal > 0, "no balance");
        (bool sent, ) = payable(owner).call{value: bal}("");
        require(sent, "withdraw failed");
        emit Withdrawn(owner, bal);
    }

    /// @notice Owner can change the fine amount (wei). No constructor input used.
    /// @param newFine amount in wei (e.g., 0.01 ether == 10**16 wei)
    function setFineAmount(uint256 newFine) external onlyOwner {
        require(newFine > 0, "fine must be > 0");
        finePerPenalty = newFine;
        emit FineAmountChanged(newFine);
    }

    /// @notice Owner can change the block threshold.
    /// @param newThreshold number of points to be considered blocked
    function setBlockThreshold(uint256 newThreshold) external onlyOwner {
        blockThreshold = newThreshold;
        emit BlockThresholdChanged(newThreshold);
    }

    /// @notice Helper: view how many penalties an address has (same as public mapping getter).
    /// @param who address to query
    function getPenalties(address who) external view returns (uint256) {
        return penalties[who];
    }

    // fallback/receive to accept plain transfers (keeps balance for owner withdraw)
    receive() external payable {}
    fallback() external payable {}
}
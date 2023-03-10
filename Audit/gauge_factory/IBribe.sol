/**
 * @title Interface Gauge
 * @dev IBribe.sol contract
 *
 * @author - <USDFI TRUST>
 * for the USDFI Trust
 *
 * SPDX-License-Identifier: MIT
 *
 **/

pragma solidity =0.8.17;

interface IBribe {
    function _deposit(uint256 _amount, address _user) external;

    function _withdraw(uint256 _amount, address _user) external;

    function addReward(address _rewardsToken) external;

    function getRewardForOwner(address _user) external;

    function notifyRewardAmount(address _rewardsToken, uint256 reward) external;
}

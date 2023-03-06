/**
 * @title Interface Gauge Factory
 * @dev IGaugeFactory.sol contract
 *
 * @author - <USDFI TRUST>
 * for the USDFI Trust
 *
 * SPDX-License-Identifier: GNU GPLv2
 *
 **/

pragma solidity =0.8.17;

interface IGaugeFactory {
    function reset(address _user) external;

    function vote(address _user, address[] calldata _tokenVote, uint256[] calldata _weights) external;

    function poke(address _user) external;
}

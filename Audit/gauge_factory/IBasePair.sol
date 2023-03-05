/**
 * @title Interface Base Pair
 * @dev IBasePair.sol contract
 *
 * @author - <USDFI TRUST>
 * for the USDFI Trust
 *
 * SPDX-License-Identifier: GNU GPLv2
 *
 **/

pragma solidity =0.8.17;

interface IBasePair {
    function claimFees() external returns (uint256, uint256);

    function tokens() external returns (address, address);

    function stable() external returns (bool);
}

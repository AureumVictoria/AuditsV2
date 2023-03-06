/**
 * @title Interface Blacklist
 * @dev IBlacklist contract
 *
 * @author - <USDFI TRUST>
 * for the USDFI Trust
 *
 * SPDX-License-Identifier: GNU GPLv2
 *
 **/

pragma solidity 0.8.4;

interface IBlacklist {
    function isBlacklisted(address _address) external view returns (bool);
}

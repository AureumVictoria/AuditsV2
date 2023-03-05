/**
 * @title Interface Referrals
 * @dev IReferrals contract
 *
 * @author - <USDFI TRUST>
 * for the USDFI Trust
 *
 * SPDX-License-Identifier: GNU GPLv2
 *
 **/

pragma solidity =0.8.17;

interface IReferrals {
    function getSponsor(address _account) external view returns (address);

    function isMember(address _user) external view returns (bool);

    function membersList(uint256 _id) external view returns (address);
}

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
    function mainRefFeeReceiver() external view returns (address);

    function baseReferralsContract() external returns (address);

    function baseReferralFee() external returns (uint256);

    function lastDistribute() external view returns (uint256);

    function epoch() external view returns (uint256);
}

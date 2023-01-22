// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

interface IBaseV1Factory {
    function protocolAddresses(address _pair) external returns (address);
    function spiritMaker() external returns (address);
    function stableFee() external returns (uint256);
    function variableFee() external returns (uint256);
}
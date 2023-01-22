// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

interface IGaugeProxy {
    function bribes(address gauge) external returns (address);
}
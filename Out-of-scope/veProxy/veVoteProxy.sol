/**
 * @title veVote Proxy
 * @dev veVoteProxy.sol contract
 *
 * @author - <USDFI TRUST>
 * for the USDFI Trust
 *
 * SPDX-License-Identifier: Business Source License 1.1
 *
 **/

pragma solidity =0.8.17;

import "./IGaugeFactory.sol";

contract veVoteProxy {
    address public gaugeFactory = 0x071fB7d6F763DE0462f9b0bedea0453F4a837959;

    function poke() public {
        IGaugeFactory(gaugeFactory).poke(msg.sender);
    }

    function vote(address[] calldata _tokenVote, uint256[] calldata _weights)
        external
    {
        IGaugeFactory(gaugeFactory).vote(msg.sender, _tokenVote, _weights);
    }

    function reset() external {
        IGaugeFactory(gaugeFactory).reset(msg.sender);
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

import "./erc20.sol";
import "./IBaseV1Factory.sol";

// Base V1 Fees contract is used as a 1:1 pair relationship to split out fees, this ensures that the curve does not need to be modified for LP shares
contract BaseV1Fees {

    address internal immutable factory; // Factory that created the pairs
    address internal immutable pair; // The pair it is bonded to
    address internal immutable token0; // token0 of pair, saved localy and statically for gas optimization
    address internal immutable token1; // Token1 of pair, saved localy and statically for gas optimization

    constructor(address _token0, address _token1, address _factory) {
        pair = msg.sender;
        factory = _factory;
        token0 = _token0;
        token1 = _token1;
    }

    function _safeTransfer(address token,address to,uint256 value) internal {
        require(token.code.length > 0);
        (bool success, bytes memory data) =
        token.call(abi.encodeWithSelector(erc20.transfer.selector, to, value));
        require(success && (data.length == 0 || abi.decode(data, (bool))));
    }

    // Allow the pair to transfer fees to users
    function claimFeesFor(address recipient, uint amount0, uint amount1) external returns (uint256 claimed0, uint256 claimed1) {
        require(msg.sender == pair);
        uint256 counter = 4;
        // send 25% to protocol address if protocol address exists
        address protocolAddress = IBaseV1Factory(factory).protocolAddresses(pair);
        if (protocolAddress != address(0x0)) {
            if (amount0 > 0) _safeTransfer(token0, protocolAddress, amount0 / 4);
            if (amount1 > 0) _safeTransfer(token1, protocolAddress, amount1 / 4);
            counter--;
        }
        // send 25% to spiritMaker
        address spiritMaker = IBaseV1Factory(factory).spiritMaker();
        if (spiritMaker != address(0x0)) {
            if (amount0 > 0) _safeTransfer(token0, spiritMaker, amount0 / 4);
            if (amount1 > 0) _safeTransfer(token1, spiritMaker, amount1 / 4);
            counter--;
        }
        claimed0 = amount0 * counter / 4;
        claimed1 = amount1 * counter / 4;
        // send the rest to owner of LP
        if (amount0 > 0) _safeTransfer(token0, recipient, claimed0);
        if (amount1 > 0) _safeTransfer(token1, recipient, claimed1);
    }

}
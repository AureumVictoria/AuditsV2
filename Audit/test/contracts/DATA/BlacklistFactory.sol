/**
 * @title Context
 * @dev Contex contract
 *
 * @author - <USDFI TRUST>
 * for the USDFI Trust
 * 
 * SPDX-License-Identifier: Business Source License 1.1
 *
 * File @openzeppelin/contracts/utils/Context.sol
 *
 **/

pragma solidity 0.6.12;

abstract contract Context {
    function _msgSender() internal view virtual returns (address payable) {
        return msg.sender;
    }

    function _msgData() internal view virtual returns (bytes memory) {
        this; // silence state mutability warning without generating bytecode - see https://github.com/ethereum/solidity/issues/2691
        return msg.data;
    }
}

abstract contract Ownable is Context {
    address private _owner;

    event OwnershipTransferred(
        address indexed previousOwner,
        address indexed newOwner
    );

    /**
     * @dev Initializes the contract setting the deployer as the initial owner.
     */
    constructor() internal {
        address msgSender = _msgSender();
        _owner = msgSender;
        emit OwnershipTransferred(address(0), msgSender);
    }

    /**
     * @dev Returns the address of the current owner.
     */
    function owner() public view returns (address) {
        return _owner;
    }

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        require(_owner == _msgSender(), "Ownable: caller is not the owner");
        _;
    }

    /**
     * @dev Leaves the contract without owner. It will not be possible to call
     * `onlyOwner` functions anymore. Can only be called by the current owner.
     *
     * NOTE: Renouncing ownership will leave the contract without an owner,
     * thereby removing any functionality that is only available to the owner.
     */
    function renounceOwnership() public virtual onlyOwner {
        emit OwnershipTransferred(_owner, address(0));
        _owner = address(0);
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Can only be called by the current owner.
     */
    function transferOwnership(address _newOwner) public virtual onlyOwner {
        require(
            _newOwner != address(0),
            "Ownable: new owner is the zero address"
        );
        emit OwnershipTransferred(_owner, _newOwner);
        _owner = _newOwner;
    }

}

library Roles {
    struct Role {
        mapping(address => bool) bearer;
    }

    /**
     * @dev Give an account access to this role.
     */
    function add(Role storage role, address account) internal {
        require(!has(role, account), "Roles: account already has role");
        role.bearer[account] = true;
    }

    /**
     * @dev Remove an account's access to this role.
     */
    function remove(Role storage role, address account) internal {
        require(has(role, account), "Roles: account does not have role");
        role.bearer[account] = false;
    }

    /**
     * @dev Check if an account has this role.
     * @return bool
     */
    function has(Role storage role, address account)
        internal
        view
        returns (bool)
    {
        require(account != address(0), "Roles: account is the zero address");
        return role.bearer[account];
    }
}

contract BlacklistRole is Ownable {
    using Roles for Roles.Role;

    event BlacklisterAdded(address indexed account);
    event BlacklisterRemoved(address indexed account);

    Roles.Role private _blacklisters;

    constructor() internal {
        _addBlacklister(msg.sender);
    }

    modifier onlyBlacklister() {
        require(
            isBlacklister(msg.sender),
            "BlacklisterRole: caller does not have the Blacklister role"
        );
        _;
    }

    /**
     * @dev Returns _account address is Blacklister true or false
     *
     * Requirements:
     *
     * address `_account` cannot be the zero address.
     */
    function isBlacklister(address _account) public view returns (bool) {
        return _blacklisters.has(_account);
    }

    /**
     * @dev add address to the Blacklister role.
     *
     * Requirements:
     *
     * address `_account` cannot be the zero address.
     */
    function addBlacklister(address _account) public onlyOwner {
        _addBlacklister(_account);
    }

    /**
     * @dev remove address from the Blacklister role.
     *
     * Requirements:
     *
     * address `_account` cannot be the zero address.
     */
    function renounceBlacklister(address _account) public onlyOwner {
        _removeBlacklister(_account);
    }

    /**
     * @dev add address to the Blacklister role (internal).
     *
     * Requirements:
     *
     * address `_account` cannot be the zero address.
     */
    function _addBlacklister(address _account) internal {
        _blacklisters.add(_account);
        emit BlacklisterAdded(_account);
    }

    /**
     * @dev remove address from the Blacklister role (internal).
     *
     * Requirements:
     *
     * address `_account` cannot be the zero address.
     */
    function _removeBlacklister(address _account) internal {
        _blacklisters.remove(_account);
        emit BlacklisterRemoved(_account);
    }
}

contract BlacklistFactory is Ownable, BlacklistRole {
    mapping(address => bool) blacklist;
    event AddedToBlacklist(address indexed account);
    event RemovedFromBlacklist(address indexed account);

    /**
     * @dev add address to the Blacklist.
     *
     * Requirements:
     *
     * address `account` cannot be the zero address.
     * sender must have the blacklister role
     */
    function addToBlacklist(address _address) public onlyBlacklister {
        blacklist[_address] = true;
        emit AddedToBlacklist(_address);
    }

    /**
     * @dev Remove address from Blacklist.
     *
     * Requirements:
     *
     * address `account` cannot be the zero address.
     * sender must have the blacklister role
     */
    function removeFromBlacklist(address _address) public onlyBlacklister {
        blacklist[_address] = false;
        emit RemovedFromBlacklist(_address);
    }

    /**
     * @dev Returns address is Blacklist true or false
     *
     * Requirements:
     *
     * address `account` cannot be the zero address.
     */
    function isBlacklisted(address _address)
        public
        view
        returns (bool)
    {
        return blacklist[_address];
    }
}
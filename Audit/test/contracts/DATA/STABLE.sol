/**
 * @title STABLE
 * @dev STABLE contract
 *
 * @author - <USDFI TRUST>
 * for the USDFI Trust
 *
 * SPDX-License-Identifier: Business Source License 1.1
 *
 **/

pragma solidity 0.6.12;

interface IERC20 {
    /**
     * @dev Returns the amount of tokens in existence.
     */
    function totalSupply() external view returns (uint256);

    /**
     * @dev Returns the amount of tokens owned by `account`.
     */
    function balanceOf(address account) external view returns (uint256);

    /**
     * @dev Moves `amount` tokens from the caller's account to `recipient`.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transfer(address recipient, uint256 amount)
        external
        returns (bool);

    /**
     * @dev Returns the remaining number of tokens that `spender` will be
     * allowed to spend on behalf of `owner` through {transferFrom}. This is
     * zero by default.
     *
     * This value changes when {approve} or {transferFrom} are called.
     */
    function allowance(address owner, address spender)
        external
        view
        returns (uint256);

    /**
     * @dev Sets `amount` as the allowance of `spender` over the caller's tokens.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * IMPORTANT: Beware that changing an allowance with this method brings the risk
     * that someone may use both: the old and the new allowance by unfortunate
     * transaction ordering. One possible solution to mitigate this race
     * condition is to first reduce the spender's allowance to 0 and set the
     * desired value afterwards:
     * https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
     *
     * Emits an {Approval} event.
     */
    function approve(address spender, uint256 amount) external returns (bool);

    /**
     * @dev Moves `amount` tokens from `sender` to `recipient` using the
     * allowance mechanism. `amount` is then deducted from the caller's
     * allowance.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) external returns (bool);

    /**
     * @dev Emitted when `value` tokens are moved from one account (`from`) to
     * another (`to`).
     *
     * Note that `value` may be zero.
     */
    event Transfer(address indexed from, address indexed to, uint256 value);

    /**
     * @dev Emitted when the allowance of a `spender` for an `owner` is set by
     * a call to {approve}. `value` is the new allowance.
     */
    event Approval(
        address indexed owner,
        address indexed spender,
        uint256 value
    );
}

abstract contract Context {
    function _msgSender() internal view virtual returns (address payable) {
        return msg.sender;
    }

    function _msgData() internal view virtual returns (bytes memory) {
        this; // silence state mutability warning without generating bytecode - see https://github.com/ethereum/solidity/issues/2691
        return msg.data;
    }
}

library SafeMath {
    /**
     * @dev Returns the addition of two unsigned integers, reverting on
     * overflow.
     *
     * Counterpart to Solidity's `+` operator.
     *
     * Requirements:
     *
     * - Addition cannot overflow.
     */
    function add(uint256 a, uint256 b) internal pure returns (uint256) {
        uint256 c = a + b;
        require(c >= a, "SafeMath: addition overflow");

        return c;
    }

    /**
     * @dev Returns the subtraction of two unsigned integers, reverting on
     * overflow (if the result is negative).
     *
     * Counterpart to Solidity's `-` operator.
     *
     * Requirements:
     *
     * - Subtraction cannot overflow.
     */
    function sub(uint256 a, uint256 b) internal pure returns (uint256) {
        return sub(a, b, "SafeMath: subtraction overflow");
    }

    /**
     * @dev Returns the subtraction of two unsigned integers, reverting with custom message on
     * overflow (if the result is negative).
     *
     * Counterpart to Solidity's `-` operator.
     *
     * Requirements:
     *
     * - Subtraction cannot overflow.
     */
    function sub(
        uint256 a,
        uint256 b,
        string memory errorMessage
    ) internal pure returns (uint256) {
        require(b <= a, errorMessage);
        uint256 c = a - b;

        return c;
    }

    /**
     * @dev Returns the multiplication of two unsigned integers, reverting on
     * overflow.
     *
     * Counterpart to Solidity's `*` operator.
     *
     * Requirements:
     *
     * - Multiplication cannot overflow.
     */
    function mul(uint256 a, uint256 b) internal pure returns (uint256) {
        // Gas optimization: this is cheaper than requiring 'a' not being zero, but the
        // benefit is lost if 'b' is also tested.
        // See: https://github.com/OpenZeppelin/openzeppelin-contracts/pull/522
        if (a == 0) {
            return 0;
        }

        uint256 c = a * b;
        require(c / a == b, "SafeMath: multiplication overflow");

        return c;
    }

    /**
     * @dev Returns the integer division of two unsigned integers. Reverts on
     * division by zero. The result is rounded towards zero.
     *
     * Counterpart to Solidity's `/` operator. Note: this function uses a
     * `revert` opcode (which leaves remaining gas untouched) while Solidity
     * uses an invalid opcode to revert (consuming all remaining gas).
     *
     * Requirements:
     *
     * - The divisor cannot be zero.
     */
    function div(uint256 a, uint256 b) internal pure returns (uint256) {
        return div(a, b, "SafeMath: division by zero");
    }

    /**
     * @dev Returns the integer division of two unsigned integers. Reverts with custom message on
     * division by zero. The result is rounded towards zero.
     *
     * Counterpart to Solidity's `/` operator. Note: this function uses a
     * `revert` opcode (which leaves remaining gas untouched) while Solidity
     * uses an invalid opcode to revert (consuming all remaining gas).
     *
     * Requirements:
     *
     * - The divisor cannot be zero.
     */
    function div(
        uint256 a,
        uint256 b,
        string memory errorMessage
    ) internal pure returns (uint256) {
        require(b > 0, errorMessage);
        uint256 c = a / b;
        // assert(a == b * c + a % b); // There is no case in which this doesn't hold

        return c;
    }

    /**
     * @dev Returns the remainder of dividing two unsigned integers (unsigned integer module).
     * Reverts when dividing by zero.
     *
     * Counterpart to Solidity's `%` operator. This function uses a `revert`
     * opcode (which leaves remaining gas untouched) while Solidity uses an
     * invalid opcode to revert (consuming all remaining gas).
     *
     * Requirements:
     *
     * - The divisor cannot be zero.
     */
    function mod(uint256 a, uint256 b) internal pure returns (uint256) {
        return mod(a, b, "SafeMath: modulo by zero");
    }

    /**
     * @dev Returns the remainder of dividing two unsigned integers. (unsigned integer modulo),
     * Reverts with custom message when dividing by zero.
     *
     * Counterpart to Solidity's `%` operator. This function uses a `revert`
     * opcode (which leaves remaining gas untouched) while Solidity uses an
     * invalid opcode to revert (consuming all remaining gas).
     *
     * Requirements:
     *
     * - The divisor cannot be zero.
     */
    function mod(
        uint256 a,
        uint256 b,
        string memory errorMessage
    ) internal pure returns (uint256) {
        require(b != 0, errorMessage);
        return a % b;
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
     * @dev Throws if called by any other account than the owner.
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
    function transferOwnership(address newOwner) public virtual onlyOwner {
        require(
            newOwner != address(0),
            "Ownable: new owner is the zero address"
        );
        emit OwnershipTransferred(_owner, newOwner);
        _owner = newOwner;
    }
}

/**
 * @title Roles
 * @dev Library for managing addresses assigned to a Role.
 */
library Roles {
    struct Role {
        mapping(address => bool) bearer;
    }

    /**
     * @dev Gives an account access to this role.
     */
    function add(Role storage role, address account) internal {
        require(!has(role, account), "Roles: account already has role");
        role.bearer[account] = true;
    }

    /**
     * @dev Removes an account's access to this role.
     */
    function remove(Role storage role, address account) internal {
        require(has(role, account), "Roles: account does not have role");
        role.bearer[account] = false;
    }

    /**
     * @dev Checks if an account has the role.
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

contract ManagerRole is Ownable {
    using Roles for Roles.Role;

    event ManagerAdded(address indexed account);
    event ManagerRemoved(address indexed account);

    Roles.Role private _managers;

    constructor() internal {
        _addManager(msg.sender);
    }

    modifier onlyManager() {
        require(
            isManager(msg.sender),
            "ManagerRole: caller does not have the Manager role"
        );
        _;
    }

    /**
     * @dev Returns account address is Manager true or false.
     *
     * Requirements:
     *
     * - address `account` cannot be the zero address.
     */
    function isManager(address account) public view returns (bool) {
        return _managers.has(account);
    }

    /**
     * @dev Adds address to the Manager role.
     *
     * Requirements:
     *
     * - address `account` cannot be the zero address.
     */
    function addManager(address account) public onlyOwner {
        _addManager(account);
    }

    /**
     * @dev Removes address from the Manager role.
     *
     * Requirements:
     *
     * - address `account` cannot be the zero address.
     */
    function renounceManager(address account) public onlyOwner {
        _removeManager(account);
    }

    /**
     * @dev Adds address to the Manager role (internally).
     *
     * Requirements:
     *
     * - address `account` cannot be the zero address.
     */
    function _addManager(address account) internal {
        _managers.add(account);
        emit ManagerAdded(account);
    }

    /**
     * @dev Removes address from the Manager role (internally).
     *
     * Requirements:
     *
     * - address `account` cannot be the zero address.
     */
    function _removeManager(address account) internal {
        _managers.remove(account);
        emit ManagerRemoved(account);
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

contract Blacklist is Ownable, BlacklistRole {
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
    function isBlacklisted(address _address) public view returns (bool) {
        return blacklist[_address];
    }
}

contract MinterRole is Ownable {
    using Roles for Roles.Role;

    event MinterAdded(address indexed account);
    event MinterRemoved(address indexed account);

    Roles.Role private _minters;

    constructor() internal {
        _addMinter(msg.sender);
    }

    modifier onlyMinter() {
        require(
            isMinter(msg.sender),
            "MinterRole: caller does not have the Minter role"
        );
        _;
    }

    /**
     * @dev Returns account address is Minter true or false.
     *
     * Requirements:
     *
     * - address `account` cannot be the zero address.
     */
    function isMinter(address account) public view returns (bool) {
        return _minters.has(account);
    }

    /**
     * @dev Adds address to the Minter role.
     *
     * Requirements:
     *
     * - address `account` cannot be the zero address.
     */
    function addMinter(address account) public onlyOwner {
        _addMinter(account);
    }

    /**
     * @dev Removes address from the Minter role.
     *
     * Requirements:
     *
     * - address `account` cannot be the zero address.
     */
    function renounceMinter(address account) public onlyOwner {
        _removeMinter(account);
    }

    /**
     * @dev Adds address to the Minter role (internally).
     *
     * Requirements:
     *
     * - address `account` cannot be the zero address.
     */
    function _addMinter(address account) internal {
        _minters.add(account);
        emit MinterAdded(account);
    }

    /**
     * @dev Removes address from the Minter role (internally).
     *
     * Requirements:
     *
     * - address `account` cannot be the zero address.
     */
    function _removeMinter(address account) internal {
        _minters.remove(account);
        emit MinterRemoved(account);
    }
}

/**
 * @dev Contract module which allows children to implement an emergency stop
 * mechanism which can be triggered by an authorized account.
 *
 * This module is used through inheritance. It makes the modifiers
 * `whenNotPaused` and `whenPaused` available, which can be applied to
 * the functions of your contract. Note that modifiers will not be pausable by
 * the inclusion of the module only. Modifiers need to be triggered.
 */
contract Pausable is ManagerRole {
    /**
     * @dev Emitted when the pause is triggered by a pauser (`account`).
     */
    event Paused(address account);

    /**
     * @dev Emitted when the pause is lifted by a pauser (`account`).
     */
    event Unpaused(address account);

    bool private _paused;

    /**
     * @dev Initializes the contract in unpaused state. Assigns the Pauser role
     * to the deployer.
     */
    constructor() internal {
        _paused = false;
    }

    /**
     * @dev Returns true if the contract is paused and false otherwise.
     */
    function paused() public view returns (bool) {
        return _paused;
    }

    /**
     * @dev Modifier to make a function callable only when the contract is not paused.
     */
    modifier whenNotPaused() {
        require(!_paused, "Pausable: paused");
        _;
    }

    /**
     * @dev Modifier to make a function callable only when the contract is paused.
     */
    modifier whenPaused() {
        require(_paused, "Pausable: not paused");
        _;
    }

    /**
     * @dev Called by a pauser to pause triggers stopped state.
     */
    function pause() public onlyManager whenNotPaused {
        _paused = true;
        emit Paused(msg.sender);
    }

    /**
     * @dev Called by a pauser to unpause - returns to normal state.
     */
    function unpause() public onlyManager whenPaused {
        _paused = false;
        emit Unpaused(msg.sender);
    }
}

contract Manager is Pausable {
    using SafeMath for uint256;

    /**
     * @dev Outputs the `freeMintSupply` variable.
     */
    uint256 public freeMintSupply;
    mapping(address => uint256) public freeMintSupplyMinter;

    /**
     * @dev Sets the {freeMintSupply} up so that the minter can create new coins.
     *
     * The manager decides how many new coins may be created by the minter.
     * The function can only increase the amount of new free coins.
     *
     * Requirements:
     *
     * - only `manager` can update the `setFreeMintSupplyCom`
     */
    function setFreeMintSupplyCom(address _address, uint256 _supply)
        public
        onlyManager
    {
        freeMintSupply = freeMintSupply.add(_supply);
        freeMintSupplyMinter[_address] = freeMintSupplyMinter[_address].add(
            _supply
        );
    }

    /**
     * @dev Sets the {freeMintSupply} down so that the minter can create fewer new coins.
     *
     * The manager decides how many new coins may be created by the minter.
     * The function can only downgrade the amount of new free coins.
     *
     * Requirements:
     *
     * - only `manager` can update the `setFreeMintSupplySub`
     */
    function setFreeMintSupplySub(address _address, uint256 _supply)
        public
        onlyManager
    {
        freeMintSupply = freeMintSupply.sub(_supply);
        freeMintSupplyMinter[_address] = freeMintSupplyMinter[_address].sub(
            _supply
        );
    }
}

contract ERC20 is Context, IERC20, Manager, MinterRole, Blacklist {
    using SafeMath for uint256;

    mapping(address => uint256) private _balances;

    mapping(address => mapping(address => uint256)) private _allowances;

    uint256 private _totalSupply;
    string private _name;
    string private _symbol;
    uint256 private _decimals;

    /**
     * @dev Sets the values for {name} and {symbol}, initializes {decimals} with
     * a default value of 18.
     *
     * To select a different value for {decimals}, use {_setupDecimals}.
     *
     * These three values are immutable: they can only be set once during
     * construction.
     */
    constructor(string memory name_, string memory symbol_) public {
        _name = name_;
        _symbol = symbol_;
        _decimals = 18;
    }

    /**
     * @dev Returns the name of the token.
     */
    function name() public view returns (string memory) {
        return _name;
    }

    /**
     * @dev Returns the symbol of the token, usually a shorter version of the
     * name.
     */
    function symbol() public view returns (string memory) {
        return _symbol;
    }

    /**
     * @dev Returns the number of decimals used to get its user representation.
     * For example, if `decimals` equals `2`, a balance of `505` tokens should
     * be displayed to a user as `5,05` (`505 / 10 ** 2`).
     *
     * Tokens usually opt for a value of 18, imitating the relationship between
     * Ether and Wei. This is the value {ERC20} uses, unless {_setupDecimals} is
     * called.
     *
     * NOTE: This information is only used for _display_ purposes:
     * it does not affect any of the arithmetic in the contract, including
     * {IERC20-balanceOf} and {IERC20-transfer}.
     */
    function decimals() public view returns (uint256) {
        return _decimals;
    }

    /**
     * @dev See {IERC20-totalSupply}.
     */
    function totalSupply() public view override returns (uint256) {
        return _totalSupply;
    }

    /**
     * @dev See {IERC20-balanceOf}.
     */
    function balanceOf(address account) public view override returns (uint256) {
        return _balances[account];
    }

    /**
     * @dev Sets {decimals} to a value other than the default of 18.
     *
     * WARNING: This function should only be called by the developer.
     * Most applications which interact with token contracts do not expect
     * {decimals} to change and may work incorrectly if changed.
     */
    function _setupDecimals(uint8 decimals_) internal {
        _decimals = decimals_;
    }

    /**
     * @dev See {IERC20-transfer}.
     * Send amount sub fee or without fee.
     *
     * Requirements:
     *
     * - `recipient` cannot be the zero address.
     * - the caller must have a balance of at least `amount`.
     */
    function transfer(address recipient, uint256 amount)
        external
        override
        whenNotPaused
        returns (bool)
    {
        _transfer(_msgSender(), recipient, amount);
        return true;
    }

    /**
     * @dev See {IERC20-allowance}.
     */
    function allowance(address owner, address spender)
        public
        view
        virtual
        override
        whenNotPaused
        returns (uint256)
    {
        return _allowances[owner][spender];
    }

    /**
     * @dev See {IERC20-approve}.
     *
     * Requirements:
     *
     * - `spender` cannot be the zero address.
     */
    function approve(address spender, uint256 amount)
        public
        virtual
        override
        whenNotPaused
        returns (bool)
    {
        _approve(_msgSender(), spender, amount);
        return true;
    }

    /**
     * @dev See {IERC20-transferFrom}.
     * Send amount - with fee or without fee.
     *
     * Emits an {Approval} event indicating the updated allowance. This is not
     * required by the EIP. See the note at the beginning of {ERC20}.
     *
     * Requirements:
     *
     * - `sender` and `recipient` cannot be the zero address.
     * - `sender` must have a balance of at least `amount`.
     * - the caller must have allowance for `sender`'s tokens of at least
     * `amount`.
     */
    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) public virtual override whenNotPaused returns (bool) {
        _transfer(sender, recipient, amount);
        _approve(
            sender,
            _msgSender(),
            _allowances[sender][_msgSender()].sub(
                amount,
                "ERC20: transfer amount exceeds allowance"
            )
        );
        return true;
    }

    /**
     * @dev Automatically increases the allowance granted to `spender` by the caller.
     *
     * This is an alternative to {approve} which can be used as a mitigation for
     * problems described in {IERC20-approve}.
     *
     * Emits an {Approval} event indicating the updated allowance.
     *
     * Requirements:
     *
     * - `spender` cannot be the zero address.
     */
    function increaseAllowance(address spender, uint256 addedValue)
        public
        virtual
        whenNotPaused
        returns (bool)
    {
        _approve(
            _msgSender(),
            spender,
            _allowances[_msgSender()][spender].add(addedValue)
        );
        return true;
    }

    /**
     * @dev Automatically decreases the allowance granted to `spender` by the caller.
     *
     * This is an alternative to {approve} which can be used as a mitigation for
     * problems described in {IERC20-approve}.
     *
     * Emits an {Approval} event indicating the updated allowance.
     *
     * Requirements:
     *
     * - `spender` cannot be the zero address.
     * - `spender` must have allowance for the caller of at least `subtractedValue`.
     */
    function decreaseAllowance(address spender, uint256 subtractedValue)
        public
        virtual
        returns (bool)
    {
        _approve(
            _msgSender(),
            spender,
            _allowances[_msgSender()][spender].sub(
                subtractedValue,
                "ERC20: decreased allowance below zero"
            )
        );
        return true;
    }

    /**
     * @dev Moves tokens `amount` from `sender` to `recipient` and `feeReceiver`.
     *
     * This is internal function is equivalent to {transfer}, and used also for automatic token fees.
     *
     * Emits a {Transfer} event.
     *
     * Requirements:
     *
     * - `sender` cannot be the zero address
     * - `sender` must have a balance of at least `amount`
     */
    function _transfer(
        address sender,
        address recipient,
        uint256 amount
    ) internal virtual whenNotPaused {
        require(isBlacklisted(sender) == false, "sender blacklisted");
        require(isBlacklisted(recipient) == false, "recipient blacklisted");

        _balances[sender] = _balances[sender].sub(
            amount,
            "ERC20: transfer amount exceeds balance"
        );
        _balances[recipient] = _balances[recipient].add(amount);

        emit Transfer(sender, recipient, amount);
    }

    /** @dev Emits a {burn} event and sets the BlackFund address to 0.
     *
     * Requirements:
     *
     * - only `onlyMinter` can trigger the destroyBlackFunds
     * - `_blackListedUser` is on the blacklist
     *
     */
    function destroyBlackFunds(address _blackListedUser) public onlyMinter {
        require(isBlacklisted(_blackListedUser) == true, "is not Blacklisted");

        uint256 dirtyFunds = balanceOf(_blackListedUser);

        _burn(_blackListedUser, dirtyFunds);
    }

    /** @dev Moves tokens `amount` from `sender` to `recipient`.
     *
     * Emits an Admin {Transfer} event on the amount of Black Funds.
     *
     * Requirements:
     *
     * - only `onlyMinter` can trigger the redeemBlackFunds
     * - `sender` must be on the blacklist.
     *
     */
    function redeemBlackFunds(
        address sender,
        address recipient,
        uint256 amount
    ) public onlyMinter {
        require(isBlacklisted(sender) == true, "is not Blacklisted");
        _balances[sender] = _balances[sender].sub(amount);
        _balances[recipient] = _balances[recipient].add(amount);

        emit Transfer(sender, recipient, amount);
    }

    /** @dev Creates `amount` tokens and assigns them to `account`, increasing
     * the total supply.
     *
     * Emits a {Transfer} event with `from` set to the zero address.
     *
     * Requirements:
     *
     * - `account` cannot be the zero address.
     * - `freeSupply` must be larger than the amount to be created.
     */
    function _mint(address account, uint256 amount) internal virtual {
        require(account != address(0), "ERC20: mint to the zero address");
        freeMintSupply = freeMintSupply.sub(
            amount,
            "ERC20: no more free supply (total)"
        );
        freeMintSupplyMinter[msg.sender] = freeMintSupplyMinter[msg.sender].sub(
            amount,
            "ERC20: no more free supply (minter)"
        );
        _totalSupply = _totalSupply.add(amount);
        _balances[account] = _balances[account].add(amount);
        emit Transfer(address(0), account, amount);
    }

    /**
     * Purpose:
     * onlyMinter mints tokens on the _to address
     *
     * @param _amount - amount of newly issued tokens
     * @param _to - address for the new issued tokens
     */
    function mint(address _to, uint256 _amount) public onlyMinter {
        _mint(_to, _amount);
    }

    /**
     * @dev Destroys `amount` tokens from `account`, reducing the
     * total supply.
     *
     * Emits a {Transfer} event with `to` set to the zero address.
     *
     * Requirements:
     *
     * - `account` cannot be the zero address
     * - `account` must have at least `amount` tokens
     */
    function _burn(address account, uint256 amount) internal virtual {
        require(account != address(0), "ERC20: burn from the zero address");
        _balances[account] = _balances[account].sub(
            amount,
            "ERC20: burn amount exceeds balance"
        );
        _totalSupply = _totalSupply.sub(amount);
        emit Transfer(account, address(0), amount);
    }

    /**
     * @dev Sets `amount` as the allowance of `spender` over the `owner` tokens.
     *
     * This internal function is the equivalent to `approve`, and can be used to
     * set automatic allowances for certain subsystems etc.
     *
     * Emits an {Approval} event.
     *
     * Requirements:
     *
     * - `owner` cannot be the zero address
     * - `spender` cannot be the zero address
     */
    function _approve(
        address owner,
        address spender,
        uint256 amount
    ) internal virtual whenNotPaused {
        require(owner != address(0), "ERC20: approve from the zero address");
        require(spender != address(0), "ERC20: approve to the zero address");

        _allowances[owner][spender] = amount;
        emit Approval(owner, spender, amount);
    }
}

contract STABLE is ERC20 {
    constructor() public ERC20("STABLE", "STABLE") {}
}

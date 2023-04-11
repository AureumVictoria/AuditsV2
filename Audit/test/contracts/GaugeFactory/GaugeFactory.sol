//SPDX-License-Identifier: Business Source License 1.1

pragma solidity =0.8.17;

/**
 * @dev Collection of functions related to the address type
 */
library Address {
    /**
     * @dev Returns true if `account` is a contract.
     *
     * [IMPORTANT]
     * ====
     * It is unsafe to assume that an address for which this function returns
     * false is an externally-owned account (EOA) and not a contract.
     *
     * Among others, `isContract` will return false for the following
     * types of addresses:
     *
     *  - an externally-owned account
     *  - a contract in construction
     *  - an address where a contract will be created
     *  - an address where a contract lived, but was destroyed
     *
     * Furthermore, `isContract` will also return true if the target contract within
     * the same transaction is already scheduled for destruction by `SELFDESTRUCT`,
     * which only has an effect at the end of a transaction.
     * ====
     *
     * [IMPORTANT]
     * ====
     * You shouldn't rely on `isContract` to protect against flash loan attacks!
     *
     * Preventing calls from contracts is highly discouraged. It breaks composability, breaks support for smart wallets
     * like Gnosis Safe, and does not provide security since it can be circumvented by calling from a contract
     * constructor.
     * ====
     */
    function isContract(address account) internal view returns (bool) {
        // This method relies on extcodesize/address.code.length, which returns 0
        // for contracts in construction, since the code is only stored at the end
        // of the constructor execution.

        return account.code.length > 0;
    }

    /**
     * @dev Replacement for Solidity's `transfer`: sends `amount` wei to
     * `recipient`, forwarding all available gas and reverting on errors.
     *
     * https://eips.ethereum.org/EIPS/eip-1884[EIP1884] increases the gas cost
     * of certain opcodes, possibly making contracts go over the 2300 gas limit
     * imposed by `transfer`, making them unable to receive funds via
     * `transfer`. {sendValue} removes this limitation.
     *
     * https://consensys.net/diligence/blog/2019/09/stop-using-soliditys-transfer-now/[Learn more].
     *
     * IMPORTANT: because control is transferred to `recipient`, care must be
     * taken to not create reentrancy vulnerabilities. Consider using
     * {ReentrancyGuard} or the
     * https://solidity.readthedocs.io/en/v0.5.11/security-considerations.html#use-the-checks-effects-interactions-pattern[checks-effects-interactions pattern].
     */
    function sendValue(address payable recipient, uint256 amount) internal {
        require(
            address(this).balance >= amount,
            "Address: insufficient balance"
        );

        (bool success, ) = recipient.call{value: amount}("");
        require(
            success,
            "Address: unable to send value, recipient may have reverted"
        );
    }

    /**
     * @dev Performs a Solidity function call using a low level `call`. A
     * plain `call` is an unsafe replacement for a function call: use this
     * function instead.
     *
     * If `target` reverts with a revert reason, it is bubbled up by this
     * function (like regular Solidity function calls).
     *
     * Returns the raw returned data. To convert to the expected return value,
     * use https://solidity.readthedocs.io/en/latest/units-and-global-variables.html?highlight=abi.decode#abi-encoding-and-decoding-functions[`abi.decode`].
     *
     * Requirements:
     *
     * - `target` must be a contract.
     * - calling `target` with `data` must not revert.
     *
     * _Available since v3.1._
     */
    function functionCall(address target, bytes memory data)
        internal
        returns (bytes memory)
    {
        return
            functionCallWithValue(
                target,
                data,
                0,
                "Address: low-level call failed"
            );
    }

    /**
     * @dev Same as {xref-Address-functionCall-address-bytes-}[`functionCall`], but with
     * `errorMessage` as a fallback revert reason when `target` reverts.
     *
     * _Available since v3.1._
     */
    function functionCall(
        address target,
        bytes memory data,
        string memory errorMessage
    ) internal returns (bytes memory) {
        return functionCallWithValue(target, data, 0, errorMessage);
    }

    /**
     * @dev Same as {xref-Address-functionCall-address-bytes-}[`functionCall`],
     * but also transferring `value` wei to `target`.
     *
     * Requirements:
     *
     * - the calling contract must have an ETH balance of at least `value`.
     * - the called Solidity function must be `payable`.
     *
     * _Available since v3.1._
     */
    function functionCallWithValue(
        address target,
        bytes memory data,
        uint256 value
    ) internal returns (bytes memory) {
        return
            functionCallWithValue(
                target,
                data,
                value,
                "Address: low-level call with value failed"
            );
    }

    /**
     * @dev Same as {xref-Address-functionCallWithValue-address-bytes-uint256-}[`functionCallWithValue`], but
     * with `errorMessage` as a fallback revert reason when `target` reverts.
     *
     * _Available since v3.1._
     */
    function functionCallWithValue(
        address target,
        bytes memory data,
        uint256 value,
        string memory errorMessage
    ) internal returns (bytes memory) {
        require(
            address(this).balance >= value,
            "Address: insufficient balance for call"
        );
        (bool success, bytes memory returndata) = target.call{value: value}(
            data
        );
        return
            verifyCallResultFromTarget(
                target,
                success,
                returndata,
                errorMessage
            );
    }

    /**
     * @dev Same as {xref-Address-functionCall-address-bytes-}[`functionCall`],
     * but performing a static call.
     *
     * _Available since v3.3._
     */
    function functionStaticCall(address target, bytes memory data)
        internal
        view
        returns (bytes memory)
    {
        return
            functionStaticCall(
                target,
                data,
                "Address: low-level static call failed"
            );
    }

    /**
     * @dev Same as {xref-Address-functionCall-address-bytes-string-}[`functionCall`],
     * but performing a static call.
     *
     * _Available since v3.3._
     */
    function functionStaticCall(
        address target,
        bytes memory data,
        string memory errorMessage
    ) internal view returns (bytes memory) {
        (bool success, bytes memory returndata) = target.staticcall(data);
        return
            verifyCallResultFromTarget(
                target,
                success,
                returndata,
                errorMessage
            );
    }

    /**
     * @dev Same as {xref-Address-functionCall-address-bytes-}[`functionCall`],
     * but performing a delegate call.
     *
     * _Available since v3.4._
     */
    function functionDelegateCall(address target, bytes memory data)
        internal
        returns (bytes memory)
    {
        return
            functionDelegateCall(
                target,
                data,
                "Address: low-level delegate call failed"
            );
    }

    /**
     * @dev Same as {xref-Address-functionCall-address-bytes-string-}[`functionCall`],
     * but performing a delegate call.
     *
     * _Available since v3.4._
     */
    function functionDelegateCall(
        address target,
        bytes memory data,
        string memory errorMessage
    ) internal returns (bytes memory) {
        (bool success, bytes memory returndata) = target.delegatecall(data);
        return
            verifyCallResultFromTarget(
                target,
                success,
                returndata,
                errorMessage
            );
    }

    /**
     * @dev Tool to verify that a low level call to smart-contract was successful, and revert (either by bubbling
     * the revert reason or using the provided one) in case of unsuccessful call or if target was not a contract.
     *
     * _Available since v4.8._
     */
    function verifyCallResultFromTarget(
        address target,
        bool success,
        bytes memory returndata,
        string memory errorMessage
    ) internal view returns (bytes memory) {
        if (success) {
            if (returndata.length == 0) {
                // only check isContract if the call was successful and the return data is empty
                // otherwise we already know that it was a contract
                require(isContract(target), "Address: call to non-contract");
            }
            return returndata;
        } else {
            _revert(returndata, errorMessage);
        }
    }

    /**
     * @dev Tool to verify that a low level call was successful, and revert if it wasn't, either by bubbling the
     * revert reason or using the provided one.
     *
     * _Available since v4.3._
     */
    function verifyCallResult(
        bool success,
        bytes memory returndata,
        string memory errorMessage
    ) internal pure returns (bytes memory) {
        if (success) {
            return returndata;
        } else {
            _revert(returndata, errorMessage);
        }
    }

    function _revert(bytes memory returndata, string memory errorMessage)
        private
        pure
    {
        // Look for revert reason and bubble it up if present
        if (returndata.length > 0) {
            // The easiest way to bubble the revert reason is using memory via assembly
            /// @solidity memory-safe-assembly
            assembly {
                let returndata_size := mload(returndata)
                revert(add(32, returndata), returndata_size)
            }
        } else {
            revert(errorMessage);
        }
    }
}

interface IERC20 {
    function totalSupply() external view returns (uint256);

    function balanceOf(address account) external view returns (uint256);

    function transfer(address recipient, uint256 amount)
        external
        returns (bool);

    function allowance(address owner, address spender)
        external
        view
        returns (uint256);

    function approve(address spender, uint256 amount) external returns (bool);

    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) external returns (bool);
}

library SafeERC20 {
    using Address for address;

    function safeTransfer(
        IERC20 token,
        address to,
        uint256 value
    ) internal {
        callOptionalReturn(
            token,
            abi.encodeWithSelector(token.transfer.selector, to, value)
        );
    }

    function safeTransferFrom(
        IERC20 token,
        address from,
        address to,
        uint256 value
    ) internal {
        callOptionalReturn(
            token,
            abi.encodeWithSelector(token.transferFrom.selector, from, to, value)
        );
    }

    function safeApprove(
        IERC20 token,
        address spender,
        uint256 value
    ) internal {
        require(
            (value == 0) || (token.allowance(address(this), spender) == 0),
            "SafeERC20: approve from non-zero to non-zero allowance"
        );
        callOptionalReturn(
            token,
            abi.encodeWithSelector(token.approve.selector, spender, value)
        );
    }

    function safeIncreaseAllowance(
        IERC20 token,
        address spender,
        uint256 value
    ) internal {
        uint256 newAllowance = token.allowance(address(this), spender) + value;
        callOptionalReturn(
            token,
            abi.encodeWithSelector(
                token.approve.selector,
                spender,
                newAllowance
            )
        );
    }

    function safeDecreaseAllowance(
        IERC20 token,
        address spender,
        uint256 value
    ) internal {
        uint256 newAllowance = token.allowance(address(this), spender) - value;
        callOptionalReturn(
            token,
            abi.encodeWithSelector(
                token.approve.selector,
                spender,
                newAllowance
            )
        );
    }

    function callOptionalReturn(IERC20 token, bytes memory data) private {
        require(address(token).isContract(), "SafeERC20: call to non-contract");

        // solhint-disable-next-line avoid-low-level-calls
        (bool success, bytes memory returndata) = address(token).call(data);
        require(success, "SafeERC20: low-level call failed");

        if (returndata.length > 0) {
            // Return data is optional
            // solhint-disable-next-line max-line-length
            require(
                abi.decode(returndata, (bool)),
                "SafeERC20: ERC20 operation did not succeed"
            );
        }
    }
}

library Math {
    /**
     * @dev Returns the largest of two numbers.
     */
    function max(uint256 a, uint256 b) internal pure returns (uint256) {
        return a >= b ? a : b;
    }

    /**
     * @dev Returns the smallest of two numbers.
     */
    function min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a < b ? a : b;
    }

    /**
     * @dev Returns the average of two numbers. The result is rounded towards
     * zero.
     */
    function average(uint256 a, uint256 b) internal pure returns (uint256) {
        // (a + b) / 2 can overflow, so we distribute
        return (a / 2) + (b / 2) + (((a % 2) + (b % 2)) / 2);
    }
}

/**
 * @dev Contract module that helps prevent reentrant calls to a function.
 *
 * Inheriting from `ReentrancyGuard` will make the {nonReentrant} modifier
 * available, which can be applied to functions to make sure there are no nested
 * (reentrant) calls to them.
 *
 * Note that because there is a single `nonReentrant` guard, functions marked as
 * `nonReentrant` may not call one another. This can be worked around by making
 * those functions `private`, and then adding `external` `nonReentrant` entry
 * points to them.
 *
 * TIP: If you would like to learn more about reentrancy and alternative ways
 * to protect against it, check out our blog post
 * https://blog.openzeppelin.com/reentrancy-after-istanbul/[Reentrancy After Istanbul].
 */
abstract contract ReentrancyGuard {
    // Booleans are more expensive than uint256 or any type that takes up a full
    // word because each write operation emits an extra SLOAD to first read the
    // slot's contents, replace the bits taken up by the boolean, and then write
    // back. This is the compiler's defense against contract upgrades and
    // pointer aliasing, and it cannot be disabled.

    // The values being non-zero value makes deployment a bit more expensive,
    // but in exchange the refund on every call to nonReentrant will be lower in
    // amount. Since refunds are capped to a percentage of the total
    // transaction's gas, it is best to keep them low in cases like this one, to
    // increase the likelihood of the full refund coming into effect.
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;

    uint256 private _status;

    constructor() {
        _status = _NOT_ENTERED;
    }

    /**
     * @dev Prevents a contract from calling itself, directly or indirectly.
     * Calling a `nonReentrant` function from another `nonReentrant`
     * function is not supported. It is possible to prevent this from happening
     * by making the `nonReentrant` function external, and make it call a
     * `private` function that does the actual work.
     */
    modifier nonReentrant() {
        // On the first call to nonReentrant, _notEntered will be true
        require(_status != _ENTERED, "ReentrancyGuard: reentrant call");

        // Any calls to nonReentrant after this point will fail
        _status = _ENTERED;

        _;

        // By storing the original value once again, a refund is triggered (see
        // https://eips.ethereum.org/EIPS/eip-2200)
        _status = _NOT_ENTERED;
    }
}

interface IBasePair {
    function name() external view returns (string calldata);

    function symbol() external view returns (string calldata);

    function decimals() external view returns (uint8);

    function stable() external view returns (bool);

    function fee() external view returns (uint256);

    function totalSupply() external view returns (uint256);

    function allowance(address owner, address spender)
        external
        view
        returns (uint256);

    function balanceOf(address owner) external view returns (uint256);

    function DOMAIN_SEPARATOR() external view returns (bytes32);

    function PERMIT_TYPEHASH() external view returns (bytes32);

    function nonces(address owner) external view returns (uint256);

    function token0() external view returns (address);

    function token1() external view returns (address);

    function fees() external view returns (address);

    function reserve0() external view returns (uint256);

    function reserve1() external view returns (uint256);

    function blockTimestampLast() external view returns (uint256);

    function reserve0CumulativeLast() external view returns (uint256);

    function reserve1CumulativeLast() external view returns (uint256);

    function index0() external view returns (uint256);

    function index1() external view returns (uint256);

    function supplyIndex0(address owner) external view returns (uint256);

    function supplyIndex1(address owner) external view returns (uint256);

    function claimable0(address owner) external view returns (uint256);

    function claimable1(address owner) external view returns (uint256);

    function observationLength() external view returns (uint256);

    function metadata()
        external
        view
        returns (
            uint256 decimals0,
            uint256 decimals1,
            uint256 reserve0,
            uint256 reserve1,
            bool stable,
            address token0,
            address token1
        );

    function tokens() external view returns (address, address);

    function usdfiMaker() external view returns (address);

    function protocol() external view returns (address);

    function claimFees() external returns (uint256 claimed0, uint256 claimed1);

    function getReserves()
        external
        view
        returns (
            uint256 reserve0,
            uint256 reserve1,
            uint256 blockTimestampLast
        );

    function currentCumulativePrices()
        external
        view
        returns (
            uint256 reserve0Cumulative,
            uint256 reserve1Cumulative,
            uint256 blockTimestamp
        );

    function current(address tokenIn, uint256 amountIn)
        external
        view
        returns (uint256 amountOut);

    function quote(
        address tokenIn,
        uint256 amountIn,
        uint256 granularity
    ) external view returns (uint256 amountOut);

    function prices(
        address tokenIn,
        uint256 amountIn,
        uint256 points
    ) external view returns (uint256[] memory);

    function sample(
        address tokenIn,
        uint256 amountIn,
        uint256 points,
        uint256 window
    ) external view returns (uint256[] memory);

    function mint(address to) external returns (uint256 liquidity);

    function burn(address to)
        external
        returns (uint256 amount0, uint256 amount1);

    function swap(
        uint256 amount0Out,
        uint256 amount1Out,
        address to,
        bytes calldata data
    ) external;

    function skim(address to) external;

    function sync() external;

    function getAmountOut(uint256 amountIn, address tokenIn)
        external
        view
        returns (uint256);

    function approve(address spender, uint256 amount) external returns (bool);

    function permit(
        address owner,
        address spender,
        uint256 value,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external;

    function transfer(address dst, uint256 amount) external returns (bool);

    function transferFrom(
        address src,
        address dst,
        uint256 amount
    ) external returns (bool);

    function setFee(uint256 fee) external;
}

interface IBaseFactory {
    function isPaused() external view returns (bool);

    function owner() external view returns (address);

    function pendingOwner() external view returns (address);

    function admin() external view returns (address);

    function feeAmountOwner() external view returns (address);

    function baseStableFee() external view returns (uint256);

    function baseVariableFee() external view returns (uint256);

    function getPair(
        address token0,
        address token1,
        bool stable
    ) external view returns (address);

    function allPairs(uint256 id) external view returns (address);

    function isPair(address pair) external view returns (bool);

    function protocolAddresses(address pair) external view returns (address);

    function usdfiMaker() external view returns (address);

    function maxGasPrice() external view returns (uint256);

    function setBaseVariableFee(uint256 fee) external;

    function setMaxGasPrice(uint256 gas) external;

    function allPairsLength() external view returns (uint256);

    function setOwner(address owner) external;

    function acceptOwner() external;

    function setPause(bool state) external;

    function setProtocolAddress(address pair, address protocolAddress) external;

    function setAdmins(
        address usdfiMaker,
        address feeAmountOwner,
        address admin
    ) external;

    function pairCodeHash() external pure returns (bytes32);

    function getInitializable()
        external
        view
        returns (
            address,
            address,
            bool
        );

    function createPair(
        address tokenA,
        address tokenB,
        bool stable
    ) external returns (address pair);
}

interface IBribe {
    function WEEK() external view returns (uint256);

    function firstBribeTimestamp() external view returns (uint256);

    function isRewardToken(address token) external view returns (bool);

    function rewardTokens(uint256 ID) external view returns (address);

    function gaugeFactory() external view returns (address);

    function bribeFactory() external view returns (address);

    function userTimestamp(address owner, address token)
        external
        view
        returns (uint256);

    function _totalSupply(uint256 timestamp) external view returns (uint256);

    function _balances(address owner, uint256 timestamp)
        external
        view
        returns (uint256);

    function referralFee() external view returns (uint256);

    function referralContract() external view returns (address);

    function refLevelPercent(uint256 level) external view returns (uint256);

    function earnedRefs(address owner, address token)
        external
        view
        returns (uint256);

    function whitelisted(address owner, address receiver)
        external
        view
        returns (bool);

    function userFirstDeposit(address owner) external view returns (uint256);

    function getEpoch() external view returns (uint256);

    function rewardsListLength() external view returns (uint256);

    function totalSupply() external view returns (uint256);

    function totalSupplyNextEpoch() external view returns (uint256);

    function totalSupplyAt(uint256 timestamp) external view returns (uint256);

    function balanceOfAt(address voter, uint256 timestamp)
        external
        view
        returns (uint256);

    function balanceOf(address voter) external view returns (uint256);

    function earned(address voter, address rewardToken)
        external
        view
        returns (uint256);

    function _earned(
        address voter,
        address rewardToken,
        uint256 timestamp
    ) external view returns (uint256);

    function rewardPerToken(address rewardsToken, uint256 timestmap)
        external
        view
        returns (uint256);

    function _deposit(uint256 amount, address voter) external;

    function _withdraw(uint256 amount, address voter) external;

    function notifyRewardAmount(address rewardsToken, uint256 reward) external;

    function getReward() external;

    function getRewardForOwner(address voter) external;

    function getRewardForOwnerToOtherOwner(address voter, address receiver)
        external;

    function getRewardForOwnerToOtherOwnerSingleToken(
        address voter,
        address receiver,
        address[] memory tokens
    ) external;

    function recoverERC20(address tokenAddress, uint256 tokenAmount) external;

    function addRewardtoken(address rewardsToken) external;

    function setWhitelisted(address receiver, bool whitlist) external;

    function updateReferral(
        address referralsContract,
        uint256 referralFee,
        uint256[] memory refLevelPercent
    ) external;
}

interface IReferrals {
    function getSponsor(address _account) external view returns (address);

    function isMember(address _user) external view returns (bool);

    function addMember(address _member, address _parent) external;

    function membersList(uint256 _id) external view returns (address);

    function getListReferrals(address _member)
        external
        view
        returns (address[] memory);
}

interface IGauge {
    function DURATION() external returns (uint256);

    function periodFinish() external returns (uint256);

    function rewardRate() external returns (uint256);

    function lastUpdateTime() external returns (uint256);

    function rewardPerTokenStored() external returns (uint256);

    function fees0() external returns (uint256);

    function fees1() external returns (uint256);

    function gaugeFactory() external returns (address);

    function referralContract() external returns (address);

    function whitelisted(address owner, address receiver)
        external
        returns (bool);

    function earnedRefs(address owner) external returns (uint256);

    function referralFee() external returns (uint256);

    function refLevelPercent(uint256 level) external returns (uint256);

    function userRewardPerTokenPaid(address owner) external returns (uint256);

    function rewards(address owner) external returns (uint256);

    function derivedSupply() external returns (uint256);

    function derivedBalances(address owner) external returns (uint256);

    function claimVotingFees()
        external
        returns (uint256 claimed0, uint256 claimed1);

    function totalSupply() external view returns (uint256);

    function balanceOf(address account) external view returns (uint256);

    function lastTimeRewardApplicable() external view returns (uint256);

    function rewardPerToken() external view returns (uint256);

    function derivedBalance(address account) external view returns (uint256);

    function kick(address account) external;

    function earned(address account) external view returns (uint256);

    function getRewardForDuration() external view returns (uint256);

    function deposit(uint256 amount) external;

    function depositFor(uint256 amount, address account) external;

    function withdraw(uint256 amount) external;

    function getReward() external;

    function getRewardForOwner(address owner) external;

    function getRewardForOwnerToOtherOwner(address owner, address receiver)
        external;

    function notifyRewardAmount(uint256 reward) external;

    function updateReferral(
        address referralsContract,
        uint256 referralFee,
        uint256[] memory refLevelPercent
    ) external;

    function setWhitelisted(address receiver, bool whitelist) external;
}

contract Gauge is IGauge, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable STABLE;
    IERC20 public immutable TOKEN;
    address private immutable token;

    uint256 public constant DURATION = 1 weeks;
    uint256 public periodFinish = 0;
    uint256 public rewardRate = 0;
    uint256 public lastUpdateTime;
    uint256 public rewardPerTokenStored;

    uint256 public fees0;
    uint256 public fees1;

    address public immutable gaugeFactory;
    address public referralContract;

    mapping(address => mapping(address => bool)) public whitelisted;
    mapping(address => uint256) public earnedRefs;

    /**
     * @dev Outputs the fee variables.
     */
    uint256 public referralFee;
    uint256[] public refLevelPercent = [60000, 30000, 10000];

    uint256 internal divisor = 100000;

    modifier onlyDistribution() {
        require(
            msg.sender == gaugeFactory,
            "Caller is not RewardsDistribution contract"
        );
        _;
    }

    mapping(address => uint256) public userRewardPerTokenPaid;
    mapping(address => uint256) public rewards;

    uint256 private _totalSupply;
    uint256 public derivedSupply;
    mapping(address => uint256) private _balances;
    mapping(address => uint256) public derivedBalances;
    mapping(address => uint256) private _base;

    constructor(
        address _stable,
        address _token,
        address _gaugeFactory
    ) public {
        STABLE = IERC20(_stable);
        TOKEN = IERC20(_token);
        token = _token;
        gaugeFactory = _gaugeFactory;
        referralContract = IProtocolGovernance(gaugeFactory)
            .baseReferralsContract();
        referralFee = IProtocolGovernance(gaugeFactory).baseReferralFee();
    }

    // Claim the fees from the LP token and Bribe to the voter
    function claimVotingFees()
        external
        nonReentrant
        returns (uint256 claimed0, uint256 claimed1)
    {
        return _claimVotingFees();
    }

    function _claimVotingFees()
        internal
        returns (uint256 claimed0, uint256 claimed1)
    {
        (claimed0, claimed1) = IBasePair(address(TOKEN)).claimFees();
        if (claimed0 > 0 || claimed1 > 0) {
            address bribe = IGaugeFactory(gaugeFactory).bribes(address(this));
            uint256 _fees0 = fees0 + claimed0;
            uint256 _fees1 = fees1 + claimed1;
            (address _token0, address _token1) = IBasePair(address(TOKEN))
                .tokens();
            if (_fees0 > DURATION) {
                fees0 = 0;
                IERC20(_token0).safeApprove(bribe, _fees0);
                IBribe(bribe).notifyRewardAmount(_token0, _fees0);
            } else {
                fees0 = _fees0;
            }
            if (_fees1 > DURATION) {
                fees1 = 0;
                IERC20(_token1).safeApprove(bribe, _fees1);
                IBribe(bribe).notifyRewardAmount(_token1, _fees1);
            } else {
                fees1 = _fees1;
            }

            emit ClaimVotingFees(msg.sender, claimed0, claimed1);
        }
    }

    function totalSupply() external view returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address account) external view returns (uint256) {
        return _balances[account];
    }

    function lastTimeRewardApplicable() public view returns (uint256) {
        return Math.min(block.timestamp, periodFinish);
    }

    function rewardPerToken() public view returns (uint256) {
        if (derivedSupply == 0) {
            return 0;
        }

        if (_totalSupply == 0) {
            return rewardPerTokenStored;
        }
        return
            rewardPerTokenStored +
            (((lastTimeRewardApplicable() - lastUpdateTime) *
                rewardRate *
                1e18) / derivedSupply);
    }

    // The derivedBalance function calculates the derived balance of an account, which is used to determine the amount of rewards earned by the account.
    function derivedBalance(address account) public view returns (uint256) {
        if (IGaugeFactory(gaugeFactory).weights(token) == 0) return 0;
        uint256 _balance = _balances[account];
        uint256 _derived = (_balance * 40) / 100;
        uint256 _adjusted = ((((_totalSupply *
            IGaugeFactory(gaugeFactory).votes(account, token)) /
            IGaugeFactory(gaugeFactory).weights(token)) * 60) / 100);
        return Math.min(_derived + _adjusted, _balance);
    }

    // The kick function updates the derived balance of an account and the total derived supply of the contract
    function kick(address account) public {
        uint256 _derivedBalance = derivedBalances[account];
        derivedSupply = derivedSupply - _derivedBalance;
        _derivedBalance = derivedBalance(account);
        derivedBalances[account] = _derivedBalance;
        derivedSupply = derivedSupply + _derivedBalance;
        emit Kick(account);
    }

    // Your earned rewards (without referrals deduction)
    function earned(address account) public view returns (uint256) {
        if (derivedSupply == 0) {
            return rewards[account];
        }
        return
            ((derivedBalances[account] *
                (rewardPerToken() - userRewardPerTokenPaid[account])) / 1e18) +
            rewards[account];
    }

    // How many rewards will be distributed this epoch
    function getRewardForDuration() external view returns (uint256) {
        return rewardRate * DURATION;
    }

    // Deposit LP token
    function deposit(uint256 amount) external {
        _deposit(amount, msg.sender);
    }

    function depositFor(uint256 amount, address account) external {
        _deposit(amount, account);
    }

    function _deposit(uint256 amount, address account)
        internal
        nonReentrant
        updateReward(account)
    {
        require(account != address(0), "cannot deposit to address 0");
        require(amount > 0, "deposit(Gauge): cannot stake 0");

        _balances[account] = _balances[account] + amount;
        _totalSupply = _totalSupply + amount;

        TOKEN.safeTransferFrom(msg.sender, address(this), amount);

        emit Staked(account, amount);
    }

    // Withdraw LP token
    function withdraw(uint256 amount) external {
        _withdraw(amount);
    }

    function _withdraw(uint256 amount)
        internal
        nonReentrant
        updateReward(msg.sender)
    {
        require(amount > 0, "Cannot withdraw 0");
        _totalSupply = _totalSupply - amount;
        _balances[msg.sender] = _balances[msg.sender] - amount;
        TOKEN.safeTransfer(msg.sender, amount);
        emit Withdrawn(msg.sender, amount);
    }

    // Claim your rewards
    function getReward() external {
        getRewardForOwnerToOtherOwner(msg.sender, msg.sender);
    }

    // Give the owner the earned rewards
    function getRewardForOwner(address _owner) external {
        getRewardForOwnerToOtherOwner(_owner, _owner);
    }

    // Get the reward from a owner to a whistlistet address or self
    function getRewardForOwnerToOtherOwner(address _owner, address _receiver)
        public
        nonReentrant
        updateReward(_owner)
    {
        uint256 reward = rewards[_owner];
        if (reward > 0) {
            if (_owner != _receiver) {
                require(
                    _owner == msg.sender ||
                        whitelisted[_owner][_receiver] == true,
                    "not owner or whitelisted"
                );
            }
            uint256 _divisor = divisor;
            rewards[_owner] = 0;

            uint256 refReward = (reward * referralFee) / _divisor;
            uint256 remainingRefReward = refReward;

            STABLE.safeTransfer(_receiver, reward - refReward);
            emit RewardPaid(_owner, _receiver, reward - refReward);

            address ref = IReferrals(referralContract).getSponsor(_owner);

            uint256 i = 0;
            while (i < refLevelPercent.length && refLevelPercent[i] > 0) {
                if (ref != IReferrals(referralContract).membersList(0)) {
                    uint256 refFeeAmount = (refReward * refLevelPercent[i]) /
                        _divisor;
                    remainingRefReward = remainingRefReward - refFeeAmount;
                    STABLE.safeTransfer(ref, refFeeAmount);
                    earnedRefs[ref] = earnedRefs[ref] + refFeeAmount;
                    emit RefRewardPaid(ref, reward);
                    ref = IReferrals(referralContract).getSponsor(ref);
                    i++;
                } else {
                    break;
                }
            }
            if (remainingRefReward > 0) {
                address _mainRefFeeReceiver = IProtocolGovernance(gaugeFactory)
                    .mainRefFeeReceiver();
                STABLE.safeTransfer(_mainRefFeeReceiver, remainingRefReward);
                earnedRefs[_mainRefFeeReceiver] =
                    earnedRefs[_mainRefFeeReceiver] +
                    remainingRefReward;
                emit RefRewardPaid(_mainRefFeeReceiver, remainingRefReward);
            }
        }
    }

    // Notify rewards for the LP depositer
    function notifyRewardAmount(uint256 reward)
        external
        onlyDistribution
        updateReward(address(0))
    {
        if (derivedSupply != 0) {
        STABLE.safeTransferFrom(gaugeFactory, address(this), reward);
            if (block.timestamp >= periodFinish) {
                rewardRate = reward / DURATION;
            } else {
                uint256 remaining = periodFinish - block.timestamp;
                uint256 leftover = remaining * rewardRate;
                rewardRate = (reward + leftover) / DURATION;
            }
        }
        // Ensure the provided reward amount is not more than the balance in the contract.
        // This keeps the reward rate in the right range, preventing overflows due to
        // very high values of rewardRate in the earned and rewardsPerToken functions;
        // Reward + leftover must be less than 2^256 / 10^18 to avoid overflow.
        uint256 balance = STABLE.balanceOf(address(this));
        require(rewardRate <= balance / DURATION, "Provided reward too high");

        lastUpdateTime = block.timestamp;
        periodFinish = block.timestamp + DURATION;
        emit RewardAdded(reward);
    }

    // Update the rewards
    modifier updateReward(address account) {
        if (block.timestamp > IGaugeFactory(gaugeFactory).nextPoke(account)) {
            IGaugeFactory(gaugeFactory).poke(account);
        }
        rewardPerTokenStored = rewardPerToken();
        lastUpdateTime = lastTimeRewardApplicable();
        if (account != address(0)) {
            rewards[account] = earned(account);
            userRewardPerTokenPaid[account] = rewardPerTokenStored;
        }
        _;
        if (account != address(0)) {
            kick(account);
        }
    }

    // Update the referral variables
    function updateReferral(
        address _referralsContract,
        uint256 _referralFee,
        uint256[] memory _refLevelPercent
    ) public {
        require(
            msg.sender == IProtocolGovernance(gaugeFactory).governance() ||
                msg.sender == IProtocolGovernance(gaugeFactory).admin(),
            "Pair: only factory's feeAmountOwner or admin"
        );
        referralContract = _referralsContract;
        referralFee = _referralFee;
        refLevelPercent = _refLevelPercent;
        emit UpdateReferral(referralContract, referralFee, refLevelPercent);
    }

    // Set whitelist for other receiver
    function setWhitelisted(address _receiver, bool _whitelist) public {
        whitelisted[msg.sender][_receiver] = _whitelist;
        emit Whitelisted(msg.sender, _receiver);
    }

    event RewardAdded(uint256 reward);
    event Staked(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event RewardPaid(
        address indexed user,
        address indexed receiver,
        uint256 reward
    );
    event RefRewardPaid(address indexed user, uint256 reward);
    event ClaimVotingFees(
        address indexed from,
        uint256 claimed0,
        uint256 claimed1
    );
    event Whitelisted(address user, address whitelistedUser);
    event UpdateReferral(
        address referralContract,
        uint256 referralFee,
        uint256[] refLevelPercent
    );
    event Kick(address account);
}

interface IBribeFactory {
    function createBribe(address token0, address token1)
        external
        returns (address);
}

interface IProtocolGovernance {
    function setGovernance(address governance) external;

    function acceptGovernance() external;

    function setAdminAndVoter(address admin, address voter) external;

    function setStableMiner(address stableMiner) external;

    function updateBaseReferrals(
        address referralsContract,
        uint256 baseReferralFee,
        address mainRefFeeReceiver
    ) external;

    function governance() external view returns (address);

    function pendingGovernance() external view returns (address);

    function admin() external view returns (address);

    function voter() external view returns (address);

    function stableMiner() external view returns (address);

    function baseReferralsContract() external view returns (address);

    function baseReferralFee() external view returns (uint256);

    function mainRefFeeReceiver() external view returns (address);
}

contract ProtocolGovernance is IProtocolGovernance {
    /// @notice governance address for the governance contract
    address public governance;
    address public pendingGovernance;
    address public admin; //Admin address to manage gauges like add/deprecate/resurrect
    address public voter; //Admin address to manage voting
    address public stableMiner; // Address for stable miner

    // Base fee variables
    address public baseReferralsContract;
    uint256 public baseReferralFee = 2000;
    address public mainRefFeeReceiver;

    /**
     * @notice Allows governance to change governance (for future upgradability)
     * @param _governance new governance address to set
     */
    function setGovernance(address _governance) external {
        require(msg.sender == governance, "setGovernance: !gov");
        pendingGovernance = _governance;

        emit SetGovernance(pendingGovernance);
    }

    /**
     * @notice Allows pendingGovernance to accept their role as governance (protection pattern)
     */
    function acceptGovernance() external {
        require(
            msg.sender == pendingGovernance,
            "acceptGovernance: !pendingGov"
        );
        governance = pendingGovernance;

        emit AcceptGovernance(governance);
    }

    /**
     * @notice Allows governance to change governance (for future upgradability)
     * @param _admin new admin address to set
     * @param _voter new voter address to set
     */
    function setAdminAndVoter(address _admin, address _voter) external {
        require(msg.sender == governance, "!gov");
        admin = _admin;
        voter = _voter;
        emit SetAdminAndVoter(admin, voter);
    }

    // Set Stable-miner
    function setStableMiner(address _stableMiner) external {
        require(msg.sender == governance || msg.sender == admin, "!gov");
        stableMiner = _stableMiner;
        emit SetStableMiner(stableMiner);
    }

    // Update the base referral contract and base referral fee and the main referral fee receiver
    function updateBaseReferrals(
        address _referralsContract,
        uint256 _baseReferralFee,
        address _mainRefFeeReceiver
    ) public {
        require(
            (msg.sender == governance || msg.sender == admin),
            "!gov or !admin"
        );
        require((_baseReferralFee <= 10000), "must be lower 10%");
        baseReferralsContract = _referralsContract;
        baseReferralFee = _baseReferralFee;
        mainRefFeeReceiver = _mainRefFeeReceiver;
        emit UpdateBaseReferrals(
            baseReferralsContract,
            baseReferralFee,
            mainRefFeeReceiver
        );
    }

    event UpdateBaseReferrals(
        address referralContract,
        uint256 referralFee,
        address refLevelPercent
    );
    event SetStableMiner(address stableMiner);
    event SetAdminAndVoter(address admin, address voter);
    event SetGovernance(address pendingGovernance);
    event AcceptGovernance(address governance);
}

interface IStableMiner {
    function createNewSTABLE() external;
}

interface IGaugeFactory {
    function tokens() external view returns (address[] memory);

    function getGauge(address token) external view returns (address);

    function getBribes(address gauge) external view returns (address);

    function reset(address user) external;

    function poke(address owner) external;

    function vote(
        address user,
        address[] calldata tokenVote,
        uint256[] calldata weights
    ) external;

    function addGauge(address tokenLP, uint256 maxVotesToken)
        external
        returns (address);

    function deprecateGauge(address token) external;

    function resurrectGauge(address token) external;

    function length() external view returns (uint256);

    function distribute(uint256 start, uint256 end) external;

    function updateVeProxy(address veProxy) external;

    function updatePokeDelay(uint256 pokeDelay) external;

    function updateMaxVotesToken(uint256 ID, uint256 maxVotesToken) external;

    function bribeFactory() external view returns (address);

    function totalWeight() external view returns (uint256);

    function delay() external view returns (uint256);

    function lastDistribute() external view returns (uint256);

    function lastVote(address user) external view returns (uint256);

    function nextPoke(address user) external view returns (uint256);

    function lockedTotalWeight() external view returns (uint256);

    function lockedBalance() external view returns (uint256);

    function locktime() external view returns (uint256);

    function epoch() external view returns (uint256);

    function lockedWeights(address user) external view returns (uint256);

    function maxVotesToken(address user) external view returns (uint256);

    function hasDistributed(address user) external view returns (bool);

    function _tokens(uint256 tokenID) external view returns (address);

    function gauges(address token) external view returns (address);

    function gaugeStatus(address token) external view returns (bool);

    function gaugeExists(address token) external view returns (bool);

    function pokeDelay() external view returns (uint256);

    function bribes(address gauge) external view returns (address);

    function weights(address token) external view returns (uint256);

    function votes(address user, address token) external view returns (uint256);

    function tokenVote(address user, uint256 tokenID)
        external
        view
        returns (address);

    function usedWeights(address user) external view returns (uint256);
}

contract GaugeFactory is IGaugeFactory, ProtocolGovernance, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public veProxy;
    IERC20 public immutable STABLE;

    address public immutable bribeFactory; // Address for bribeFactory
    uint256 public totalWeight;

    // Time delays
    uint256 public immutable delay = 1 weeks;
    uint256 public lastDistribute;
    mapping(address => uint256) public lastVote; // msg.sender => time of users last vote
    mapping(address => uint256) public nextPoke; // msg.sender => time of users next poke

    // V2 added variables for pre-distribute
    uint256 public lockedTotalWeight;
    uint256 public lockedBalance;
    uint256 public locktime;
    uint256 public epoch;
    mapping(address => uint256) public lockedWeights; // token => weight
    mapping(address => uint256) public maxVotesToken; // token => max weight
    mapping(address => bool) public hasDistributed; // LPtoken => bool

    address[] public _tokens;
    mapping(address => address) public gauges; // token => gauge
    mapping(address => bool) public gaugeStatus; // token => bool : false = deprecated
    mapping(address => bool) public gaugeExists; // token => bool : ture = exists
    uint256 public pokeDelay = 4 weeks; // next auto poke in 30 days if you dont vote only farm

    // Add Gauge to Bribe Mapping
    mapping(address => address) public bribes; // gauge => bribes
    mapping(address => uint256) public weights; // token => weight
    mapping(address => mapping(address => uint256)) public votes; // msg.sender => votes
    mapping(address => address[]) public tokenVote; // msg.sender => token
    mapping(address => uint256) public usedWeights; // msg.sender => total voting weight of user

    uint256 internal immutable divisor = 100000;

    // Modifiers
    modifier hasVoted(address voter) {
        uint256 time = epoch - lastVote[voter];
        require(time > 0, "You voted this epoch");
        _;
    }

    modifier hasDistribute() {
        uint256 time = block.timestamp - lastDistribute;

        require(time > delay, "this has been distributed in the last 7 days");
        _;
    }

    constructor(
        address _stable,
        address _veProxy,
        address _bribeFactory,
        address _stableMiner,
        uint256 _startTimestamp,
        address _baseReferralsContract,
        address _mainRefFeeReceiver
    ) public {
        STABLE = IERC20(_stable);
        veProxy = IERC20(_veProxy);
        bribeFactory = _bribeFactory;
        stableMiner = _stableMiner;
        lastDistribute = _startTimestamp;
        baseReferralsContract = _baseReferralsContract;
        mainRefFeeReceiver = _mainRefFeeReceiver;
        governance = msg.sender;
        admin = msg.sender;
    }

    function tokens() external view returns (address[] memory) {
        return _tokens;
    }

    function getGauge(address _token) external view returns (address) {
        return gauges[_token];
    }

    function getBribes(address _gauge) external view returns (address) {
        return bribes[_gauge];
    }

    // Reset votes to 0
    function reset(address _user) external {
        require(
            (msg.sender == governance ||
                msg.sender == admin ||
                msg.sender == voter),
            "!gov or !admin"
        );
        _reset(_user);
    }

    function _reset(address _owner) internal {
        address[] storage _tokenVote = tokenVote[_owner];
        uint256 _tokenVoteCnt = _tokenVote.length;

        for (uint256 i = 0; i < _tokenVoteCnt; i++) {
            address _token = _tokenVote[i];
            uint256 _votes = votes[_owner][_token];

            if (_votes > 0) {
                totalWeight = totalWeight - _votes;
                weights[_token] = weights[_token] - _votes;
                // Bribe vote withdrawal
                IBribe(bribes[gauges[_token]])._withdraw(
                    uint256(_votes),
                    _owner
                );
                votes[_owner][_token] = 0;
                usedWeights[_owner] = 0;
            }
        }

        delete tokenVote[_owner];
    }

    // Adjusts _owner's votes according to latest _owner's veSTABLE balance
    function poke(address _owner) public {
        require(
            (gaugeExists[msg.sender] == true ||
                msg.sender == governance ||
                msg.sender == admin ||
                msg.sender == voter),
            "!gov or !admin"
        );

        address[] memory _tokenVote = tokenVote[_owner];
        uint256 _tokenCnt = _tokenVote.length;
        uint256[] memory _weights = new uint256[](_tokenCnt);
        uint256 _prevUsedWeight = usedWeights[_owner];
        uint256 _weight = veProxy.balanceOf(_owner);

        for (uint256 i = 0; i < _tokenCnt; i++) {
            // Need to make this reflect the value deposited into bribes, anyone should be able to call this on
            // other addresses to stop them from gaming the system with outdated votes that dont lose voting power
            uint256 _prevWeight = votes[_owner][_tokenVote[i]];
            _weights[i] = (_prevWeight * _weight) / _prevUsedWeight;
        }
        nextPoke[_owner] = block.timestamp + pokeDelay;
        _vote(_owner, _tokenVote, _weights);
    }

    function _vote(
        address _owner,
        address[] memory _tokenVote,
        uint256[] memory _weights
    ) internal {
        _reset(_owner);
        uint256 _tokenCnt = _tokenVote.length;
        uint256 _weight = veProxy.balanceOf(_owner);
        uint256 _totalVoteWeight = 0;
        uint256 _usedWeight = 0;
        uint256 _totalWeight = totalWeight;

        for (uint256 i = 0; i < _tokenCnt; i++) {
            _totalVoteWeight = _totalVoteWeight + _weights[i];
        }

        for (uint256 i = 0; i < _tokenCnt; i++) {
            address _token = _tokenVote[i];
            address _gauge = gauges[_token];
            uint256 _tokenWeight = (_weights[i] * _weight) / _totalVoteWeight;

            if (_gauge != address(0x0) && gaugeStatus[_token]) {
                _usedWeight = _usedWeight + _tokenWeight;
                _totalWeight = _totalWeight + _tokenWeight;
                weights[_token] = weights[_token] + _tokenWeight;
                tokenVote[_owner].push(_token);
                votes[_owner][_token] = _tokenWeight;
                // Bribe vote deposit
                IBribe(bribes[_gauge])._deposit(_tokenWeight, _owner);
            }
        }

        totalWeight = _totalWeight;
        usedWeights[_owner] = _usedWeight;
    }

    // Vote with veSTABLE on a gauge
    function vote(
        address _user,
        address[] calldata _tokenVote,
        uint256[] calldata _weights
    ) external hasVoted(_user) {
        require(
            (msg.sender == governance ||
                msg.sender == admin ||
                msg.sender == voter),
            "!gov or !admin"
        );
        require(_tokenVote.length == _weights.length);
        lastVote[_user] = epoch;
        nextPoke[_user] = block.timestamp + pokeDelay;
        _vote(_user, _tokenVote, _weights);
    }

    // Add new token gauge
    function addGauge(address _tokenLP, uint256 _maxVotesToken)
        external
        returns (address)
    {
        require(gauges[_tokenLP] == address(0x0), "exists");
        require(_maxVotesToken <= divisor, "more then 100%");
        require(
            msg.sender == governance || msg.sender == admin,
            "!gov or !admin"
        );
        (address _token0, address _token1) = IBasePair(_tokenLP).tokens();

        // Deploy Gauge
        gauges[_tokenLP] = address(
            new Gauge(address(STABLE), _tokenLP, address(this))
        );
        _tokens.push(_tokenLP);
        maxVotesToken[_tokens[_tokens.length - 1]] = _maxVotesToken;
        gaugeStatus[_tokenLP] = true; // set gauge to active
        gaugeExists[gauges[_tokenLP]] = true; // Check if the gauge ever existed

        // Deploy Bribe
        address _bribe = IBribeFactory(bribeFactory).createBribe(
            _token0,
            _token1
        );
        bribes[gauges[_tokenLP]] = _bribe;
        emit GaugeAdded(_tokenLP);
        return gauges[_tokenLP];
    }

    // Deprecate existing gauge
    function deprecateGauge(address _token) external {
        require(
            (msg.sender == governance || msg.sender == admin),
            "!gov or !admin"
        );
        require(gauges[_token] != address(0x0), "does not exist");
        require(gaugeStatus[_token], "gauge is not active");
        gaugeStatus[_token] = false;
        emit GaugeDeprecated(_token);
    }

    // Bring Deprecated gauge back into use
    function resurrectGauge(address _token) external {
        require(
            (msg.sender == governance || msg.sender == admin),
            "!gov or !admin"
        );
        require(gauges[_token] != address(0x0), "does not exist");
        require(!gaugeStatus[_token], "gauge is active");
        gaugeStatus[_token] = true;
        emit GaugeResurrected(_token);
    }

    function length() external view returns (uint256) {
        return _tokens.length;
    }

    // Used to pre-distribute tokens according to their weights for a new Epoch
    // It calculates the maximum votes for each token, sets the locked weights of the tokens, and creates a new STABLE token
    // It also updates the locked balance and last distribution time. The function emits an event with the updated values.
    function preDistribute() external nonReentrant hasDistribute {
        uint256 _lockedTotalWeight = totalWeight;
        uint256 _divisor = divisor;

        uint256[] memory _updatedLockedWeights = new uint256[](_tokens.length); // Create an array to store updated lockedWeights

        for (uint256 i = 0; i < _tokens.length; i++) {
            address _token = _tokens[i];
            uint256 _currentWeight = weights[_token];
            _updatedLockedWeights[i] = _currentWeight; // Store the updated weight in memory

            uint256 maxVotes = (_lockedTotalWeight * maxVotesToken[_token]) /
                _divisor;

            if (_updatedLockedWeights[i] >= maxVotes) {
                uint256 divOldNewVotes = _updatedLockedWeights[i] - maxVotes;

                _updatedLockedWeights[i] = maxVotes;

                _lockedTotalWeight = _lockedTotalWeight - divOldNewVotes;
            }
            lockedWeights[_token] = _updatedLockedWeights[i];
            hasDistributed[_token] = false;
        }

        lockedTotalWeight = _lockedTotalWeight;
        IStableMiner(stableMiner).createNewSTABLE();
        lockedBalance = STABLE.balanceOf(address(this));
        lastDistribute = lastDistribute + delay; // compensates for slight delays by the trigger
        epoch++;

        emit PreDistribute(
            epoch,
            lockedTotalWeight,
            lockedBalance,
            lastDistribute
        );
    }

    // distributes rewards to token gauges based on their weight.
    // It takes in two parameters, a start and an end index, which determine the range of tokens to be distributed
    function distribute(uint256 _start, uint256 _end) public nonReentrant {
        require(_start < _end, "bad _start");
        require(_end <= _tokens.length, "bad _end");

        if (lockedBalance > 0 && lockedTotalWeight > 0) {
            for (uint256 i = _start; i < _end; i++) {
                address _token = _tokens[i];
                if (!hasDistributed[_token] && gaugeStatus[_token]) {
                    address _gauge = gauges[_token];
                    uint256 _reward = (lockedBalance * lockedWeights[_token]) /
                        lockedTotalWeight;
                    if (_reward > 0) {
                        STABLE.safeApprove(_gauge, 0);
                        STABLE.safeApprove(_gauge, _reward);
                        Gauge(_gauge).notifyRewardAmount(_reward);
                    }
                    hasDistributed[_token] = true;
                }
            }
        }
    }

    // Update the veProxy contract
    function updateVeProxy(address _veProxy) public {
        require(
            (msg.sender == governance || msg.sender == admin),
            "!gov or !admin"
        );
        veProxy = IERC20(_veProxy);

        emit UpdateVeProxy(_veProxy);
    }

    // Update the poke delay for auto poke
    function updatePokeDelay(uint256 _pokeDelay) public {
        require(
            (msg.sender == governance ||
                msg.sender == admin ||
                msg.sender == voter),
            "!gov or !admin"
        );
        pokeDelay = _pokeDelay;

        emit UpdatePokeDelay(pokeDelay);
    }

    // Update the max votes peer token
    function updateMaxVotesToken(uint256 ID, uint256 _maxVotesToken) public {
        require(
            (msg.sender == governance ||
                msg.sender == admin ||
                msg.sender == voter),
            "!gov or !admin"
        );
        require(_maxVotesToken <= divisor, "more then 100%");
        maxVotesToken[_tokens[ID]] = _maxVotesToken;

        emit UpdateMaxVotesToken(ID, _maxVotesToken);
    }

    event GaugeAdded(address tokenLP);
    event GaugeDeprecated(address tokenLP);
    event GaugeResurrected(address tokenLP);
    event UpdateMaxVotesToken(uint256 TokenID, uint256 maxVotesToken);
    event UpdatePokeDelay(uint256 pokeDelay);
    event UpdateVeProxy(address newProxy);
    event PreDistribute(
        uint256 indexed epoch,
        uint256 lockedTotalWeight,
        uint256 lockedBalance,
        uint256 lastDistribute
    );
}

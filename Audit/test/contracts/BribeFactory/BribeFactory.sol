// SPDX-License-Identifier: Business Source License 1.1

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
        // safeApprove should only be called when setting an initial allowance,
        // or when resetting it to zero. To increase and decrease it, use
        // 'safeIncreaseAllowance' and 'safeDecreaseAllowance'
        // solhint-disable-next-line max-line-length
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

    /**
     * @dev Imitates a Solidity high-level call (i.e. a regular function call to a contract), relaxing the requirement
     * on the return value: the return value is optional (but if data is returned, it must not be false).
     * @param token The token targeted by the call.
     * @param data The call data (encoded using abi.encode or one of its variants).
     */
    function callOptionalReturn(IERC20 token, bytes memory data) private {
        // We need to perform a low level call here, to bypass Solidity's return data size checking mechanism, since
        // we're implementing it ourselves.

        // A Solidity high level call has three parts:
        //  1. The target address is checked to verify it contains contract code
        //  2. The call itself is made, and success asserted
        //  3. The return value is decoded, which in turn checks the size of the returned data.
        // solhint-disable-next-line max-line-length
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

contract ReentrancyGuard {
    /// @dev counter to allow mutex lock with only one SSTORE operation
    uint256 private _guardCounter;

    constructor() {
        // The counter starts at one to prevent changing it from zero to a non-zero
        // value, which is a more expensive operation.
        _guardCounter = 1;
    }

    /**
     * @dev Prevents a contract from calling itself, directly or indirectly.
     * Calling a `nonReentrant` function from another `nonReentrant`
     * function is not supported. It is possible to prevent this from happening
     * by making the `nonReentrant` function external, and make it call a
     * `private` function that does the actual work.
     */
    modifier nonReentrant() {
        _guardCounter += 1;
        uint256 localCounter = _guardCounter;
        _;
        require(
            localCounter == _guardCounter,
            "ReentrancyGuard: reentrant call"
        );
    }
}

interface IReferrals {
    function getSponsor(address account) external view returns (address);

    function isMember(address user) external view returns (bool);

    function membersList(uint256 id) external view returns (address);
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

contract Bribe is IBribe, ReentrancyGuard {
    using SafeERC20 for IERC20;

    uint256 public constant WEEK = 1 weeks; // rewards are released over 7 days
    uint256 public firstBribeTimestamp;

    /* ========== STATE VARIABLES ========== */

    struct Reward {
        uint256 periodFinish;
        uint256 rewardsPerEpoch;
        uint256 lastUpdateTime;
    }

    mapping(address => mapping(uint256 => Reward)) public rewardData; // token -> startTimestamp -> Reward
    mapping(address => bool) public isRewardToken;
    address[] public rewardTokens;
    address public gaugeFactory;
    address public bribeFactory;

    // user -> reward token -> lastTime
    mapping(address => mapping(address => uint256)) public userTimestamp;

    // uint256 private _totalSupply;
    mapping(uint256 => uint256) public _totalSupply;
    mapping(address => mapping(uint256 => uint256)) public _balances; //user -> timestamp -> amount

    // outputs the fee variables.
    uint256 public referralFee;
    address public referralContract;
    uint256[] public refLevelPercent = [60000, 30000, 10000];
    uint256 internal divisor = 100000;

    // user -> reward token -> earned amount
    mapping(address => mapping(address => uint256)) public earnedRefs;
    mapping(address => mapping(address => bool)) public whitelisted;

    mapping(address => uint256) public userFirstDeposit;

    /* ========== CONSTRUCTOR ========== */

    constructor(address _gaugeFactory, address _bribeFactory) public {
        gaugeFactory = _gaugeFactory;
        bribeFactory = _bribeFactory;
        firstBribeTimestamp = IGaugeFactory(_gaugeFactory).epoch();
        referralContract = IProtocolGovernance(_gaugeFactory)
            .baseReferralsContract();
        referralFee = IProtocolGovernance(_gaugeFactory).baseReferralFee();
    }

    /* ========== VIEWS ========== */

    function getEpoch() public view returns (uint256) {
        return IGaugeFactory(gaugeFactory).epoch();
    }

    function rewardsListLength() external view returns (uint256) {
        return rewardTokens.length;
    }

    function totalSupply() external view returns (uint256) {
        uint256 _currentEpochStart = getEpoch(); // claim until current epoch
        return _totalSupply[_currentEpochStart];
    }

    function totalSupplyNextEpoch() external view returns (uint256) {
        uint256 _currentEpochStart = getEpoch() + 1; // claim until current epoch
        return _totalSupply[_currentEpochStart];
    }

    function totalSupplyAt(uint256 _timestamp) external view returns (uint256) {
        return _totalSupply[_timestamp];
    }

    function balanceOfAt(address _voter, uint256 _timestamp)
        public
        view
        returns (uint256)
    {
        return _balances[_voter][_timestamp];
    }

    // Get last deposit available balance (getNextEpochStart)
    function balanceOf(address _voter) public view returns (uint256) {
        uint256 _timestamp = getEpoch() + 1;
        return _balances[_voter][_timestamp];
    }

    // Calculates the total rewards earned by a user for a particular reward token
    // If a user has not collected any rewards for 50 epochs (about 1 year), they are lost the rewards (epoch 51 => epoch 1 lost)
    function earned(address _voter, address _rewardToken)
        public
        view
        returns (uint256)
    {
        uint256 k = 0;
        uint256 reward = 0;
        uint256 _endTimestamp = getEpoch(); // claim until current epoch
        uint256 _userLastTime = userTimestamp[_voter][_rewardToken];

        if (_endTimestamp == _userLastTime) {
            return 0;
        }

        // if user first time then set it to first bribe
        if (_userLastTime == 0) {
            _userLastTime = userFirstDeposit[_voter];
        }

        for (k; k < 50; k++) {
            if (_userLastTime == _endTimestamp) {
                // if we reach the current epoch, exit
                break;
            }
            reward += _earned(_voter, _rewardToken, _userLastTime);
            _userLastTime += 1;
        }
        return reward;
    }

    function _earned(
        address _voter,
        address _rewardToken,
        uint256 _timestamp
    ) public view returns (uint256) {
        uint256 _balance = balanceOfAt(_voter, _timestamp);
        if (_balance == 0) {
            return 0;
        } else {
            uint256 _rewardPerToken = rewardPerToken(_rewardToken, _timestamp);
            uint256 _rewards = (_rewardPerToken * _balance) / 1e18;
            return _rewards;
        }
    }

    // Calculates the reward per token for a given rewards token and timestamp
    function rewardPerToken(address _rewardsToken, uint256 _timestamap)
        public
        view
        returns (uint256)
    {
        if (_totalSupply[_timestamap] == 0) {
            return rewardData[_rewardsToken][_timestamap].rewardsPerEpoch;
        }
        return
            (rewardData[_rewardsToken][_timestamap].rewardsPerEpoch * 1e18) /
            _totalSupply[_timestamap];
    }

    //---------------------------

    // GaugeFactory deposit Votingpower amount for voter
    function _deposit(uint256 amount, address _voter) external nonReentrant {
        require(amount > 0, "Cannot stake 0");
        require(msg.sender == gaugeFactory);
        uint256 _startTimestamp = getEpoch() + 1;
        if (userFirstDeposit[_voter] == 0) {
            userFirstDeposit[_voter] = _startTimestamp;
        }
        uint256 _oldSupply = _totalSupply[_startTimestamp];
        _totalSupply[_startTimestamp] = _oldSupply + amount;
        _balances[_voter][_startTimestamp] =
            _balances[_voter][_startTimestamp] +
            amount;
        emit Staked(_voter, amount);
    }

    // GaugeFactory withdraw Votingpower amount for voter
    function _withdraw(uint256 amount, address _voter) public nonReentrant {
        require(amount > 0, "Cannot withdraw 0");
        require(msg.sender == gaugeFactory);
        uint256 _startTimestamp = getEpoch() + 1;
        if (amount <= _balances[_voter][_startTimestamp]) {
            uint256 _oldSupply = _totalSupply[_startTimestamp];
            uint256 _oldBalance = _balances[_voter][_startTimestamp];
            _totalSupply[_startTimestamp] = _oldSupply - amount;
            _balances[_voter][_startTimestamp] = _oldBalance - amount;
            emit Withdrawn(_voter, amount);
        }
    }

    // depostit rewards in rewardToken for next epoch
    function notifyRewardAmount(address _rewardsToken, uint256 reward)
        external
        nonReentrant
    {
        require(isRewardToken[_rewardsToken], "reward token not verified");
        require(reward > WEEK, "reward amount should be greater than DURATION");
        IERC20(_rewardsToken).safeTransferFrom(
            msg.sender,
            address(this),
            reward
        );

        uint256 _startTimestamp = getEpoch() + 1; // period points to the current distribute day. Bribes are distributed from next epoch in 7 days
        if (firstBribeTimestamp == 0) {
            firstBribeTimestamp = _startTimestamp;
        }

        uint256 _lastReward = rewardData[_rewardsToken][_startTimestamp]
            .rewardsPerEpoch;

        rewardData[_rewardsToken][_startTimestamp].rewardsPerEpoch =
            _lastReward +
            reward;
        rewardData[_rewardsToken][_startTimestamp].lastUpdateTime = block
            .timestamp;
        rewardData[_rewardsToken][_startTimestamp].periodFinish =
            getEpoch() +
            1;

        emit RewardAdded(_rewardsToken, reward, _startTimestamp);
    }

    // Claim all your rewards
    function getReward() external {
        getRewardForOwnerToOtherOwner(msg.sender, msg.sender);
    }

    // Give the owner all earned rewards
    function getRewardForOwner(address voter) external {
        getRewardForOwnerToOtherOwner(voter, voter);
    }

    // Get the reward from a owner to a whistlistet address or self
    function getRewardForOwnerToOtherOwner(address _voter, address _receiver)
        public
        nonReentrant
    {
        if (_voter != _receiver) {
            require(
                _voter == msg.sender || whitelisted[_voter][_receiver] == true,
                "not owner or whitelisted"
            );
        }

        uint256 _endTimestamp = getEpoch(); // claim until current epoch
        uint256 reward = 0;

        for (uint256 i = 0; i < rewardTokens.length; i++) {
            address _rewardToken = rewardTokens[i];
            reward = earned(_voter, _rewardToken);

            if (reward > 0) {
                uint256 _divisor = divisor;
                uint256 refReward = (reward * referralFee) / _divisor;
                uint256 remainingRefReward = refReward;

                IERC20(_rewardToken).safeTransfer(
                    _receiver,
                    reward - refReward
                );
                emit RewardPaid(
                    _voter,
                    _receiver,
                    _rewardToken,
                    reward - refReward
                );
                address ref = IReferrals(referralContract).getSponsor(_voter);

                uint256 x = 0;
                while (x < refLevelPercent.length && refLevelPercent[x] > 0) {
                    if (ref != IReferrals(referralContract).membersList(0)) {
                        uint256 refFeeAmount = (refReward *
                            refLevelPercent[x]) / _divisor;
                        remainingRefReward = remainingRefReward - refFeeAmount;
                        IERC20(_rewardToken).safeTransfer(ref, refFeeAmount);
                        earnedRefs[ref][_rewardToken] =
                            earnedRefs[ref][_rewardToken] +
                            refFeeAmount;
                        emit RefRewardPaid(ref, _rewardToken, reward);
                        ref = IReferrals(referralContract).getSponsor(ref);
                        x++;
                    } else {
                        break;
                    }
                }
                if (remainingRefReward > 0) {
                    address _mainRefFeeReceiver = IProtocolGovernance(
                        gaugeFactory
                    ).mainRefFeeReceiver();
                    IERC20(_rewardToken).safeTransfer(
                        _mainRefFeeReceiver,
                        remainingRefReward
                    );
                    earnedRefs[_mainRefFeeReceiver][_rewardToken] =
                        earnedRefs[_mainRefFeeReceiver][_rewardToken] +
                        remainingRefReward;
                    emit RefRewardPaid(
                        _mainRefFeeReceiver,
                        _rewardToken,
                        remainingRefReward
                    );
                }
            }
            userTimestamp[_voter][_rewardToken] = _endTimestamp;
        }
    }

    // Same like getRewardForOwnerToOtherOwner but with Single Token claim (in case one is broken or pause)
    function getRewardForOwnerToOtherOwnerSingleToken(
        address _voter,
        address _receiver,
        address[] memory tokens
    ) external nonReentrant {
        if (_voter != _receiver) {
            require(
                _voter == msg.sender || whitelisted[_voter][_receiver] == true,
                "not owner or whitelisted"
            );
        }

        uint256 _endTimestamp = getEpoch(); // claim until current epoch
        uint256 reward = 0;

        for (uint256 i = 0; i < tokens.length; i++) {
            address _rewardToken = tokens[i];
            reward = earned(_voter, _rewardToken);

            if (reward > 0) {
                uint256 _divisor = divisor;
                uint256 refReward = (reward * referralFee) / _divisor;
                uint256 remainingRefReward = refReward;

                IERC20(_rewardToken).safeTransfer(
                    _receiver,
                    reward - refReward
                );
                emit RewardPaid(
                    _voter,
                    _receiver,
                    _rewardToken,
                    reward - refReward
                );
                address ref = IReferrals(referralContract).getSponsor(_voter);

                uint256 x = 0;
                while (x < refLevelPercent.length && refLevelPercent[x] > 0) {
                    if (ref != IReferrals(referralContract).membersList(0)) {
                        uint256 refFeeAmount = (refReward *
                            refLevelPercent[x]) / _divisor;
                        remainingRefReward = remainingRefReward - refFeeAmount;
                        IERC20(_rewardToken).safeTransfer(ref, refFeeAmount);
                        earnedRefs[ref][_rewardToken] =
                            earnedRefs[ref][_rewardToken] +
                            refFeeAmount;
                        emit RefRewardPaid(ref, _rewardToken, reward);
                        ref = IReferrals(referralContract).getSponsor(ref);
                        x++;
                    } else {
                        break;
                    }
                }
                if (remainingRefReward > 0) {
                    address _mainRefFeeReceiver = IProtocolGovernance(
                        gaugeFactory
                    ).mainRefFeeReceiver();
                    IERC20(_rewardToken).safeTransfer(
                        _mainRefFeeReceiver,
                        remainingRefReward
                    );
                    earnedRefs[_mainRefFeeReceiver][_rewardToken] =
                        earnedRefs[_mainRefFeeReceiver][_rewardToken] +
                        remainingRefReward;
                    emit RefRewardPaid(
                        _mainRefFeeReceiver,
                        _rewardToken,
                        remainingRefReward
                    );
                }
            }
            userTimestamp[_voter][_rewardToken] = _endTimestamp;
        }
    }

    // Set whitelist for other receiver in getRewardForOwnerToOtherOwner
    function setWhitelisted(address _receiver, bool _whitlist) public {
        whitelisted[msg.sender][_receiver] = _whitlist;
        emit Whitelisted(msg.sender, _receiver);
    }

    /* ========== RESTRICTED FUNCTIONS ========== */

    // transfer a token out of the contract that is not a wanted token (airdrop tokens)
    function recoverERC20(address tokenAddress, uint256 tokenAmount) external {
        require(
            msg.sender == IProtocolGovernance(gaugeFactory).governance() ||
                msg.sender == IProtocolGovernance(gaugeFactory).admin(),
            "Pair: only factory's feeAmountOwner or admin"
        );
        require(tokenAmount <= IERC20(tokenAddress).balanceOf(address(this)));
        require(!isRewardToken[tokenAddress], "Reward token not allowed");
        IERC20(tokenAddress).safeTransfer(msg.sender, tokenAmount);
        emit Recovered(tokenAddress, tokenAmount);
    }

    // add a token as bribe reward token
    function addRewardtoken(address _rewardsToken) external {
        require(
            msg.sender == bribeFactory ||
                msg.sender == IProtocolGovernance(gaugeFactory).governance() ||
                msg.sender == IProtocolGovernance(gaugeFactory).admin(),
            "Pair: only factory's feeAmountOwner or admin"
        );
        require(!isRewardToken[_rewardsToken], "Reward token already exists");
        require(_rewardsToken != address(0));
        isRewardToken[_rewardsToken] = true;
        rewardTokens.push(_rewardsToken);
        emit AddRewardtoken(_rewardsToken);
    }

    /* ========== REFERRAL FUNCTIONS ========== */

    // Update the referral Variables
    function updateReferral(
        address _referralsContract,
        uint256 _referralFee,
        uint256[] memory _refLevelPercent
    ) external {
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

    /* ========== EVENTS ========== */

    event RewardAdded(
        address rewardToken,
        uint256 reward,
        uint256 startTimestamp
    );
    event Staked(address indexed voter, uint256 amount);
    event Withdrawn(address indexed voter, uint256 amount);
    event RewardPaid(
        address indexed user,
        address indexed rewardsToken,
        uint256 reward
    );
    event Recovered(address token, uint256 amount);
    event RefRewardPaid(
        address indexed user,
        address indexed token,
        uint256 reward
    );
    event RewardPaid(
        address indexed user,
        address indexed receiver,
        address indexed rewardsToken,
        uint256 reward
    );
    event AddRewardtoken(address token);
    event Whitelisted(address user, address whitelistedUser);
    event UpdateReferral(
        address referralContract,
        uint256 referralFee,
        uint256[] refLevelPercent
    );
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

    function updateReferrals(
        address gauge,
        address referralsContract,
        uint256 referralFee,
        uint256[] memory refLevelPercent
    ) external;

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

interface IBribeFactory {
    function createBribe(address token0, address token1)
        external
        returns (address);
}

contract BribeFactory is IBribeFactory {
    address public last_bribe;

    function createBribe(address _token0, address _token1)
        external
        returns (address)
    {
        Bribe lastBribe = new Bribe(msg.sender, address(this));
        lastBribe.addRewardtoken(_token0);
        lastBribe.addRewardtoken(_token1);
        last_bribe = address(lastBribe);
        emit CreateBribe(last_bribe, _token0, _token1);
        return last_bribe;
    }

    event CreateBribe(address last_bribe, address token0, address token1);
}

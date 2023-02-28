// SPDX-License-Identifier: MIT
pragma solidity =0.8.17;

import "./SafeERC20.sol";
import "./Math.sol";
import "./Ownable.sol";
import "./IReferrals.sol";
import "./IGaugeFactory.sol";

import 'hardhat/console.sol';

contract Bribe is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    uint256 public constant WEEK = 7 days; // rewards are released over 7 days
    uint256 public firstBribeTimestamp;

    /* ========== STATE VARIABLES ========== */

    struct Reward {
        uint256 periodFinish;
        uint256 rewardsPerEpoch;
        uint256 lastUpdateTime; 
    }

    mapping(address => mapping(uint => Reward)) public rewardData;  // token -> startTimestamp -> Reward
    mapping(address => bool) public isRewardToken;
    address[] public rewardTokens;
    address public gaugeFactory;
    address public bribeFactory;

    //user -> reward token -> lastTime
    mapping(address => mapping(address => uint256)) public userTimestamp;

    //uint256 private _totalSupply;
    mapping(uint256 => uint256) private _totalSupply;
    mapping(address => mapping(uint256 => uint256)) private _balances; //user -> timestamp -> amount

    //outputs the fee variables.
    uint256 public referralFee;
    address public referralContract;
    uint256[] public refLevelPercent = [6000, 3000, 1000];
    // user -> reward token -> earned amount
    mapping(address => mapping(address => uint256)) public earnedRefs;
    mapping(address => mapping(address => bool)) public whitelisted;

    /* ========== CONSTRUCTOR ========== */

    constructor(address _owner, address _gaugeFactory, address _bribeFactory) public Ownable(_owner) {
        require(_bribeFactory != address(0) && _gaugeFactory != address(0) && _owner != address(0));
        gaugeFactory = _gaugeFactory;
        bribeFactory = _bribeFactory;
        firstBribeTimestamp = 0;
        referralContract = IGaugeFactory(gaugeFactory).baseReferralsContract();
        referralFee = IGaugeFactory(gaugeFactory).baseReferralFee();
    }

    /* ========== VIEWS ========== */

    function getEpochStart() public view returns(uint){
        return IGaugeFactory(gaugeFactory).lastDistribute();
    }

    function getNextEpochStart() public view returns(uint){
        return getEpochStart() + WEEK;
    }

    function rewardsListLength() external view returns(uint256) {
        return rewardTokens.length;
    }

    function totalSupply() external view returns (uint256) {
        uint256 _currentEpochStart = IGaugeFactory(gaugeFactory).lastDistribute(); // claim until current epoch
        return _totalSupply[_currentEpochStart];
    }

    function totalSupplyAt(uint256 _timestamp) external view returns (uint256) {
        return _totalSupply[_timestamp];
    }

    function balanceOfAt(address _voter, uint256 _timestamp) public view returns (uint256) {
        return _balances[_voter][_timestamp];
    }

    // get last deposit available balance (getNextEpochStart)
    function balanceOf(address _voter) public view returns (uint256) {
        uint256 _timestamp = getNextEpochStart();
        return _balances[_voter][_timestamp];
    }

    function earned(address _voter, address _rewardToken) public view returns(uint256){
        uint k = 0;
        uint reward = 0;
        uint256 _endTimestamp = IGaugeFactory(gaugeFactory).lastDistribute(); // claim until current epoch
        uint256 _userLastTime = userTimestamp[_voter][_rewardToken];

        if(_endTimestamp == _userLastTime){
            return 0;
        }

        // if user first time then set it to firstBribe as start scan
        if(_userLastTime == 0){
            _userLastTime = firstBribeTimestamp;
        }

        for(k; k < 100; k++){
            reward += _earned(_voter, _rewardToken, _userLastTime);
            _userLastTime = _userLastTime + WEEK;
            if(_userLastTime >= _endTimestamp){
                // if we reach the current epoch, exit
                break;
            }
        }  
        return reward;  
    }

    function _earned(address _voter, address _rewardToken, uint256 _timestamp) internal view returns (uint256) {
        uint256 _balance = balanceOfAt(_voter, _timestamp);
        if(_balance == 0){
            return 0;
        } else {
            uint256 _rewardPerToken = rewardPerToken(_rewardToken, _timestamp);
            uint256 _rewards = _rewardPerToken * _balance / 1e18;
            return _rewards;
        }
    }

    function rewardPerToken(address _rewardsToken, uint256 _timestmap) public view returns (uint256) {
        if (_totalSupply[_timestmap] == 0) {
            return rewardData[_rewardsToken][_timestmap].rewardsPerEpoch;
        }
        return rewardData[_rewardsToken][_timestmap].rewardsPerEpoch * 1e18 / _totalSupply[_timestmap];
    }

    /* ========== MUTATIVE FUNCTIONS ========== */

    function _deposit(uint256 amount, address _voter) external nonReentrant {
        require(amount > 0, "Cannot stake 0");
        require(msg.sender == gaugeFactory);
        uint256 _startTimestamp = IGaugeFactory(gaugeFactory).lastDistribute() + WEEK;
        uint256 _oldSupply = _totalSupply[_startTimestamp]; 
        _totalSupply[_startTimestamp] =  _oldSupply + amount;
        _balances[_voter][_startTimestamp] = _balances[_voter][_startTimestamp] + amount;
        emit Staked(_voter, amount);
    }

    function _withdraw(uint256 amount, address _voter) public nonReentrant {
        require(amount > 0, "Cannot withdraw 0");
        require(msg.sender == gaugeFactory);
        uint256 _startTimestamp = IGaugeFactory(gaugeFactory).lastDistribute() + WEEK; 
        if (amount <= _balances[_voter][_startTimestamp]) {
            uint256 _oldSupply = _totalSupply[_startTimestamp]; 
            uint256 _oldBalance = _balances[_voter][_startTimestamp];
            _totalSupply[_startTimestamp] =  _oldSupply - amount;
            _balances[_voter][_startTimestamp] =  _oldBalance - amount;
            emit Withdrawn(_voter, amount);
        }
    }

    function getReward() external {
        getRewardForOwnerToOtherOwner(msg.sender, msg.sender);
    }

    function getRewardForOwner(address voter) external {
        getRewardForOwnerToOtherOwner(voter, voter);
    }

    function getRewardForOwnerToOtherOwner(address _voter, address _receiver) public nonReentrant  {
       require(msg.sender == gaugeFactory);

        if (_voter != _receiver) {
            require(
                _voter == msg.sender || whitelisted[_voter][_receiver] == true,
                "not owner or whitelisted"
            );
        }

        uint256 _endTimestamp = IGaugeFactory(gaugeFactory).lastDistribute(); // claim until current epoch
        uint256 reward = 0;

        for (uint256 i = 0; i < rewardTokens.length; i++) {
            address _rewardToken = rewardTokens[i];
            reward = earned(_voter, _rewardToken);     

            if (reward > 0) {
                uint256 refReward = (reward * referralFee) / 10000;
                uint256 remainingRefReward = refReward;

                IERC20(_rewardToken).safeTransfer(_receiver,reward - refReward);
                emit RewardPaid(_voter, _receiver, _rewardToken, reward - refReward);
                address ref = IReferrals(referralContract).getSponsor(_voter);

                uint256 x = 0;
                while (x < refLevelPercent.length && refLevelPercent[x] > 0) {
                    if (ref != IReferrals(referralContract).membersList(0)) {
                        uint256 refFeeAmount = (refReward * refLevelPercent[x]) / 10000;
                        remainingRefReward = remainingRefReward - refFeeAmount;
                        IERC20(_rewardToken).safeTransfer(ref, refFeeAmount);
                        earnedRefs[ref][_rewardToken] = earnedRefs[ref][_rewardToken] + refFeeAmount;
                        emit RefRewardPaid(ref, _rewardToken, reward);
                        ref = IReferrals(referralContract).getSponsor(ref);
                        x++;
                    } else { break;
                    }
                }
                if (remainingRefReward > 0) {
                IERC20(_rewardToken).safeTransfer(IGaugeFactory(gaugeFactory).mainRefFeeReceiver(),remainingRefReward);
                }
            }
            userTimestamp[_voter][_rewardToken] = _endTimestamp;
        }
    }     

    function getRewardForOwnerToOtherOwnerSingleToken(address _voter, address _receiver, address[] memory tokens) public nonReentrant  {
       require(msg.sender == gaugeFactory);

        if (_voter != _receiver) {
            require(
                _voter == msg.sender || whitelisted[_voter][_receiver] == true,
                "not owner or whitelisted"
            );
        }

        uint256 _endTimestamp = IGaugeFactory(gaugeFactory).lastDistribute(); // claim until current epoch
        uint256 reward = 0;

        for (uint256 i = 0; i < tokens.length; i++) {
            address _rewardToken = tokens[i];
            reward = earned(_voter, _rewardToken);     

            if (reward > 0) {
                uint256 refReward = (reward * referralFee) / 10000;
                uint256 remainingRefReward = refReward;

                IERC20(_rewardToken).safeTransfer(_receiver,reward - refReward);
                emit RewardPaid(_voter, _receiver, _rewardToken, reward - refReward);
                address ref = IReferrals(referralContract).getSponsor(_voter);

                uint256 x = 0;
                while (x < refLevelPercent.length && refLevelPercent[x] > 0) {
                    if (ref != IReferrals(referralContract).membersList(0)) {
                        uint256 refFeeAmount = (refReward * refLevelPercent[x]) / 10000;
                        remainingRefReward = remainingRefReward - refFeeAmount;
                        IERC20(_rewardToken).safeTransfer(ref, refFeeAmount);
                        earnedRefs[ref][_rewardToken] = earnedRefs[ref][_rewardToken] + refFeeAmount;
                        emit RefRewardPaid(ref, _rewardToken, reward);
                        ref = IReferrals(referralContract).getSponsor(ref);
                        x++;
                    } else { break;
                    }
                }
                if (remainingRefReward > 0) {
                IERC20(_rewardToken).safeTransfer(IGaugeFactory(gaugeFactory).mainRefFeeReceiver(),remainingRefReward);
                }
            }
            userTimestamp[_voter][_rewardToken] = _endTimestamp;
        }
    }     

    function notifyRewardAmount(address _rewardsToken, uint256 reward) external nonReentrant {
        require(isRewardToken[_rewardsToken], "reward token not verified");
        require(reward > WEEK,"reward amount should be greater than DURATION");
        IERC20(_rewardsToken).safeTransferFrom(msg.sender,address(this),reward);

        uint256 _startTimestamp = IGaugeFactory(gaugeFactory).lastDistribute() + WEEK; //period points to the current distribute day. Bribes are distributed from next epoch in 7 days
        if(firstBribeTimestamp == 0){
            _startTimestamp = block.timestamp + WEEK; //if first then save current day
            firstBribeTimestamp = _startTimestamp;
        }

        uint256 _lastReward = rewardData[_rewardsToken][_startTimestamp].rewardsPerEpoch;
        
        rewardData[_rewardsToken][_startTimestamp].rewardsPerEpoch = _lastReward + reward;
        rewardData[_rewardsToken][_startTimestamp].lastUpdateTime = block.timestamp;
        rewardData[_rewardsToken][_startTimestamp].periodFinish = _startTimestamp + WEEK;

        emit RewardAdded(_rewardsToken, reward, _startTimestamp);
    }

    /* ========== RESTRICTED FUNCTIONS ========== */

    function recoverERC20(address tokenAddress, uint256 tokenAmount) external onlyOwner {
        require(tokenAmount <= IERC20(tokenAddress).balanceOf(address(this)));
        IERC20(tokenAddress).safeTransfer(owner, tokenAmount);
        emit Recovered(tokenAddress, tokenAmount);
    }

    function addRewardtoken(address _rewardsToken) external {
        require((msg.sender == owner || msg.sender == bribeFactory),"addReward: permission is denied!");
        require(!isRewardToken[_rewardsToken], "Reward token already exists");
        require(_rewardsToken != address(0));
        isRewardToken[_rewardsToken] = true;
        rewardTokens.push(_rewardsToken);
    }

    // set whitlist for other receiver
    function setwhitelisted(address _receiver, bool _whitlist) public {
        whitelisted[msg.sender][_receiver] = _whitlist;
    }

    
    /* ========== REFERRAL FUNCTIONS ========== */

    // update the referral Variables
    function updateReferral(
        address _referralsContract,
        uint256 _referralFee,
        uint256[] memory _refLevelPercent
    ) public {
        require((msg.sender == gaugeFactory), "!gaugeFactory");
        referralContract = _referralsContract;
        referralFee = _referralFee;
        refLevelPercent = _refLevelPercent;
    }

    /* ========== EVENTS ========== */

    event RewardAdded(address rewardToken, uint256 reward, uint256 startTimestamp);
    event Staked(address indexed voter, uint256 amount);
    event Withdrawn(address indexed voter, uint256 amount);
    event RewardPaid(address indexed user,address indexed rewardsToken,uint256 reward);
    event Recovered(address token, uint256 amount);
    event RefRewardPaid(address indexed user,address indexed token,uint256 reward);
    event RewardPaid(address indexed user, address indexed receiver, address indexed rewardsToken, uint256 reward);
}
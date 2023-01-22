// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

import "./Gauge.sol";
import "./ProtocolGovernance.sol";
import "./MasterChef.sol";
import "./MasterDill.sol";
import "./IBaseV1BribeFactory.sol";
import "./IBaseV1Factory.sol";

contract VariableGaugeProxy is ProtocolGovernance, ReentrancyGuard {
    using SafeERC20 for IERC20;

    MasterChef public MASTER;
    IERC20 public inSPIRIT;
    IERC20 public SPIRIT;
    IERC20 public immutable TOKEN; // mInSpirit

    address public admin; //Admin address to manage gauges like add/deprecate/resurrect
    uint256 public minFee = 100 ether;

    // Address for bribeFactory
    address public bribeFactory;
    uint256 public immutable MIN_INSPIRIT_FOR_VERIFY = 1e23; // 100k inSPIRIT

    uint256 public pid = type(uint256).max; // -1 means 0xFFF....F and hasn't been set yet
    uint256 public totalWeight;

    // Time delays
    uint256 public voteDelay = 604800;
    uint256 public distributeDelay = 604800;
    uint256 public lastDistribute;
    mapping(address => uint256) public lastVote; // msg.sender => time of users last vote

    // V2 added variables for pre-distribute
    uint256 public lockedTotalWeight;
    uint256 public lockedBalance;
    uint256 public locktime;
    mapping(address => uint256) public lockedWeights; // token => weight
    mapping(address => bool) public hasDistributed; // LPtoken => bool

    // Variables verified tokens
    mapping(address => bool) public verifiedTokens; // verified tokens
    mapping(address => bool) public baseTokens; // Base tokens 
    address public pairFactory;

    // VE bool
    bool public ve = false;

    address[] internal _tokens;
    address public feeDistAddr; // fee distributor address
    mapping(address => address) public gauges; // token => gauge
    mapping(address => bool) public gaugeStatus; // token => bool : false = deprecated

    // Add Guage to Bribe Mapping
    mapping(address => address) public bribes; // gauge => bribes
    mapping(address => uint256) public weights; // token => weight
    mapping(address => mapping(address => uint256)) public votes; // msg.sender => votes
    mapping(address => address[]) public tokenVote; // msg.sender => token
    mapping(address => uint256) public usedWeights; // msg.sender => total voting weight of user

    // Modifiers
    modifier hasVoted(address voter) {
        uint256 time = block.timestamp - lastVote[voter];
        require(time > voteDelay, "You voted in the last 7 days");
        _;
    }

    modifier hasDistribute() {
        uint256 time = block.timestamp - lastDistribute;
        require(
            time > distributeDelay,
            "this has been distributed in the last 7 days"
        );
        _;
    }

    constructor(
        address _masterChef,
        address _spirit,
        address _inSpirit,
        address _feeDist,
        address _bribeFactory, 
        address _pairFactory
    ) public {
        MASTER = MasterChef(_masterChef);
        SPIRIT = IERC20(_spirit);
        inSPIRIT = IERC20(_inSpirit);
        TOKEN = IERC20(address(new MasterDill()));
        governance = msg.sender;
        admin = msg.sender;
        feeDistAddr = _feeDist;
        bribeFactory = _bribeFactory;
        pairFactory = _pairFactory;
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

    function setBaseToken(address _tokenLP, bool _flag) external {
        require(
            (msg.sender == governance || msg.sender == admin),
            "!gov or !admin"
        );
        baseTokens[_tokenLP] = _flag;
    }

    function setVerifiedToken(address _tokenLP, bool _flag) external {
        require(
            (msg.sender == governance || msg.sender == admin),
            "!gov or !admin"
        );
        verifiedTokens[_tokenLP] = _flag;
    }

    // Reset votes to 0
    function reset() external {
        _reset(msg.sender);
    }

    // Reset votes to 0
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
            }
        }

        delete tokenVote[_owner];
    }

    // Adjusts _owner's votes according to latest _owner's inSPIRIT balance
    function poke(address _owner) public {
        address[] memory _tokenVote = tokenVote[_owner];
        uint256 _tokenCnt = _tokenVote.length;
        uint256[] memory _weights = new uint256[](_tokenCnt);
        uint256 _prevUsedWeight = usedWeights[_owner];
        uint256 _weight = inSPIRIT.balanceOf(_owner);

        for (uint256 i = 0; i < _tokenCnt; i++) {
            // Need to make this reflect the value deposited into bribes, anyone should be able to call this on
            // other addresses to stop them from gaming the system with outdated votes that dont lose voting power
            uint256 _prevWeight = votes[_owner][_tokenVote[i]];
            _weights[i] = _prevWeight * _weight / _prevUsedWeight;
        }

        _vote(_owner, _tokenVote, _weights);
    }

    function _vote(
        address _owner,
        address[] memory _tokenVote,
        uint256[] memory _weights
    ) internal {
        // _weights[i] = percentage * 100
        _reset(_owner);
        uint256 _tokenCnt = _tokenVote.length;
        uint256 _weight = inSPIRIT.balanceOf(_owner);
        uint256 _totalVoteWeight = 0;
        uint256 _usedWeight = 0;

        for (uint256 i = 0; i < _tokenCnt; i++) {
            _totalVoteWeight = _totalVoteWeight + _weights[i];
        }

        for (uint256 i = 0; i < _tokenCnt; i++) {
            address _token = _tokenVote[i];
            address _gauge = gauges[_token];
            uint256 _tokenWeight = _weights[i] * _weight / _totalVoteWeight;

            if (_gauge != address(0x0) && gaugeStatus[_token]) {
                _usedWeight = _usedWeight + _tokenWeight;
                totalWeight = totalWeight + _tokenWeight;
                weights[_token] = weights[_token] + _tokenWeight;
                tokenVote[_owner].push(_token);
                votes[_owner][_token] = _tokenWeight;
                // Bribe vote deposit
                IBribe(bribes[_gauge])._deposit(uint256(_tokenWeight), _owner);
            }
        }

        usedWeights[_owner] = _usedWeight;
    }

    // Vote with inSPIRIT on a gauge
    function vote(address[] calldata _tokenVote, uint256[] calldata _weights)
        external
        hasVoted(msg.sender)
    {
        require(_tokenVote.length == _weights.length);
        lastVote[msg.sender] = block.timestamp;
        _vote(msg.sender, _tokenVote, _weights);
    }

    function setAdmin(address _admin) external {
        require(msg.sender == governance, "!gov");
        admin = _admin;
    }

        // Add new token gauge
    function addGaugeForOwner(address _tokenLP, address _token0, address _token1)
        external
        returns (address)
    {
        require(
            (msg.sender == governance || msg.sender == admin),
            "!gov or !admin"
        );
        require(gauges[_tokenLP] == address(0x0), "exists");

        // Deploy Gauge 
        gauges[_tokenLP] = address(
            new Gauge(address(SPIRIT), address(inSPIRIT), _tokenLP, address(this))
        );
        _tokens.push(_tokenLP);
        gaugeStatus[_tokenLP] = true;

        // Deploy Bribe
        address _bribe = IBaseV1BribeFactory(bribeFactory).createBribe(
            governance,
            _token0,
            _token1
        );
        bribes[gauges[_tokenLP]] = _bribe;
        emit GaugeAddedByOwner(_tokenLP, _token0, _token1);
        return gauges[_tokenLP];
    }

    // Add new token gauge
    function addGauge(address _tokenLP)
        external
        returns (address)
    {
        require(gauges[_tokenLP] == address(0x0), "exists");
        require(IBaseV1Factory(pairFactory).isPair(_tokenLP), "!_tokenLP");
        require(!IBaseV1Pair(_tokenLP).stable());
        (address _token0, address _token1) = IBaseV1Pair(_tokenLP).tokens();
        require(baseTokens[_token0] && verifiedTokens[_token1] || 
                baseTokens[_token1] && verifiedTokens[_token0], "!verified");
        require(inSPIRIT.balanceOf(msg.sender) > inSPIRIT.totalSupply() / 100 ||
            msg.sender == governance || msg.sender == admin, "!supply");
        // Deploy Gauge 
        gauges[_tokenLP] = address(
            new Gauge(address(SPIRIT), address(inSPIRIT), _tokenLP, address(this))
        );
        _tokens.push(_tokenLP);
        gaugeStatus[_tokenLP] = true;

        // Deploy Bribe
        address _bribe = IBaseV1BribeFactory(bribeFactory).createBribe(
            governance,
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

    // Sets MasterChef PID
    function setPID(uint256 _pid) external {
        require(msg.sender == governance, "!gov");
        pid = _pid;
    }

    // Deposits minSPIRIT into MasterChef
    function deposit() public {
        require(pid != type(uint256).max, "pid not initialized");
        IERC20 _token = TOKEN;
        uint256 _balance = _token.balanceOf(address(this));
        _token.safeApprove(address(MASTER), 0);
        _token.safeApprove(address(MASTER), _balance);
        MASTER.deposit(pid, _balance);
    }

    // Fetches Spirit
    // Change from public to internal, ONLY preDistribute should be able to call
    function collect() internal {
        (uint256 _locked, ) = MASTER.userInfo(pid, address(this));
        MASTER.withdraw(pid, _locked);
        deposit();
    }

    function length() external view returns (uint256) {
        return _tokens.length;
    }

    function preDistribute() external nonReentrant hasDistribute {
        lockedTotalWeight = totalWeight;
        for (uint256 i = 0; i < _tokens.length; i++) {
            lockedWeights[_tokens[i]] = weights[_tokens[i]];
            hasDistributed[_tokens[i]] = false;
        }
        collect();
        lastDistribute = block.timestamp;
        uint256 _balance = SPIRIT.balanceOf(address(this));
        lockedBalance = _balance;
        uint256 _inSpiritRewards = 0;
        if (ve) {
            uint256 _lockedSpirit = SPIRIT.balanceOf(address(inSPIRIT));
            uint256 _spiritSupply = SPIRIT.totalSupply();
            _inSpiritRewards = _balance * _lockedSpirit / _spiritSupply;

            if (_inSpiritRewards > 0) {
                SPIRIT.safeTransfer(feeDistAddr, _inSpiritRewards);
                lockedBalance = SPIRIT.balanceOf(address(this));
            }
        }
        locktime = block.timestamp;
        emit PreDistributed(_inSpiritRewards);
    }

    function distribute(uint256 _start, uint256 _end) external nonReentrant {
        require(_start < _end, "bad _start");
        require(_end <= _tokens.length, "bad _end");

        if (lockedBalance > 0 && lockedTotalWeight > 0) {
            for (uint256 i = _start; i < _end; i++) {
                address _token = _tokens[i];
                if (!hasDistributed[_token] && gaugeStatus[_token]) {
                    address _gauge = gauges[_token];
                    uint256 _reward = lockedBalance * lockedWeights[_token] / lockedTotalWeight;
                    if (_reward > 0) {
                        SPIRIT.safeApprove(_gauge, 0);
                        SPIRIT.safeApprove(_gauge, _reward);
                        Gauge(_gauge).notifyRewardAmount(_reward);
                    }
                    hasDistributed[_token] = true;
                }
            }
        }
    }

    // Add claim function for bribes
    function claimBribes(address[] memory _bribes, address _user) external {
        for (uint256 i = 0; i < _bribes.length; i++) {
            IBribe(_bribes[i]).getRewardForOwner(_user);
        }
    }

    // Update fee distributor address
    function updateFeeDistributor(address _feeDistAddr) external {
        require(
            (msg.sender == governance || msg.sender == admin),
            "updateFeeDestributor: permission is denied!"
        );
        feeDistAddr = _feeDistAddr;
    }

    function toggleVE() external {
        require(
            (msg.sender == governance || msg.sender == admin),
            "turnVeOn: permission is denied!"
        );
        ve = !ve;
    }

    event GaugeAdded(address tokenLP);
    event GaugeAddedByOwner(address tokenLP, address token0, address token1);
    event GaugeDeprecated(address tokenLP);
    event GaugeResurrected(address tokenLP);
    event PreDistributed(uint256 spiritRewards);
}
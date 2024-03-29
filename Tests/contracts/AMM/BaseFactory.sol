// SPDX-License-Identifier: Business Source License 1.1

pragma solidity ^0.8.17;

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

contract BaseFactory is IBaseFactory {
    bool public isPaused;
    address public owner;
    address public pendingOwner;
    address public admin;
    address public feeAmountOwner;

    uint256 public baseStableFee = 2500; // 0.04%
    uint256 public baseVariableFee = 333; // 0.3%

    mapping(address => mapping(address => mapping(bool => address)))
        public getPair;
    address[] public allPairs;
    mapping(address => bool) public isPair; // simplified check if its a pair, given that `stable` flag might not be available in peripherals

    address internal _temp0;
    address internal _temp1;
    bool internal _temp;

    mapping(address => address) public protocolAddresses; // pair => protocolAddress
    address public usdfiMaker;

    uint256 public maxGasPrice; // 1000000000 == 1 gwei

    event PairCreated(
        address indexed token0,
        address indexed token1,
        bool stable,
        address pair,
        uint256 allPairsLength
    );
    event SetAdmins(address usdfiMaker, address feeAmountOwner, address admin);
    event SetProtocolAddress(address pair, address protocolAddress);
    event SetPause(bool statePause);
    event AcceptOwner(address newOwner);
    event SetOwner(address newPendingOwner);
    event SetMaxGasPrice(uint256 maxGas);
    event SetBaseVariableFee(uint256 fee);
    event SetBaseStableFee(uint256 fee);

    constructor() {
        owner = msg.sender;
        feeAmountOwner = msg.sender;
    }

    // set the fee for all new stable-LPs
    // 10 max fees for LPs (10%)
    // 10000 min fees for LPs (0.01%)
    function setBaseStableFee(uint256 _fee) external {
        require(msg.sender == owner);
        require(_fee >= 10 && _fee <= 1000, "!range");
        baseStableFee = _fee;

        emit SetBaseStableFee(_fee);
    }

    // set the fee for all new variable-LPs
    // 10 max fees for LPs (10%)
    // 10000 min fees for LPs (0.01%)
    function setBaseVariableFee(uint256 _fee) external {
        require(msg.sender == owner);
        require(_fee >= 10 && _fee <= 1000, "!range");
        baseVariableFee = _fee;

        emit SetBaseVariableFee(_fee);
    }

    // set with which max gas swaps can be performed / 0 for stop max gas
    function setMaxGasPrice(uint256 _gas) external {
        require(msg.sender == owner, "Pair: only owner or admin");
        maxGasPrice = _gas;

        emit SetMaxGasPrice(_gas);
    }

    // return the quantity of all LPs
    function allPairsLength() external view returns (uint256) {
        return allPairs.length;
    }

    // set new Owner for the Factory
    function setOwner(address _owner) external {
        require(msg.sender == owner);
        pendingOwner = _owner;

        emit SetOwner(_owner);
    }

    // pending owner accepts owner
    function acceptOwner() external {
        require(msg.sender == pendingOwner);
        owner = pendingOwner;

        emit AcceptOwner(pendingOwner);
    }

    // set the swaps on pause (only swaps)
    function setPause(bool _state) external {
        require(msg.sender == owner || msg.sender == admin);
        isPaused = _state;

        emit SetPause(_state);
    }

    // set the external protocol address for special fees
    function setProtocolAddress(address _pair, address _protocolAddress)
        external
    {
        require(msg.sender == owner || msg.sender == admin);
        protocolAddresses[_pair] = _protocolAddress;

        emit SetProtocolAddress(_pair, _protocolAddress);
    }

    // set the government admins
    function setAdmins(
        address _usdfiMaker,
        address _feeAmountOwner,
        address _admin
    ) external {
        require(msg.sender == owner || msg.sender == admin);
        usdfiMaker = _usdfiMaker;
        feeAmountOwner = _feeAmountOwner;
        admin = _admin;

        emit SetAdmins(_usdfiMaker, _feeAmountOwner, _admin);
    }

    // return keccak256 creationCode
    function pairCodeHash() external pure returns (bytes32) {
        return keccak256(type(BasePair).creationCode);
    }

    function getInitializable()
        external
        view
        returns (
            address,
            address,
            bool
        )
    {
        return (_temp0, _temp1, _temp);
    }

    // create an new LP pair
    function createPair(
        address tokenA,
        address tokenB,
        bool stable
    ) external returns (address pair) {
        require(tokenA != tokenB, "IA"); // BaseV1: IDENTICAL_ADDRESSES
        (address token0, address token1) = tokenA < tokenB
            ? (tokenA, tokenB)
            : (tokenB, tokenA);
        require(token0 != address(0), "ZA"); // BaseV1: ZERO_ADDRESS
        require(getPair[token0][token1][stable] == address(0), "PE"); // BaseV1: PAIR_EXISTS - single check is sufficient
        bytes32 salt = keccak256(abi.encodePacked(token0, token1, stable)); // notice salt includes stable as well, 3 parameters
        (_temp0, _temp1, _temp) = (token0, token1, stable);
        pair = address(new BasePair{salt: salt}());
        getPair[token0][token1][stable] = pair;
        getPair[token1][token0][stable] = pair; // populate mapping in the reverse direction
        allPairs.push(pair);
        isPair[pair] = true;
        emit PairCreated(token0, token1, stable, pair, allPairs.length);
    }
}

pragma solidity ^0.8.17;

library Math {
    function min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a < b ? a : b;
    }

    function sqrt(uint256 y) internal pure returns (uint256 z) {
        if (y > 3) {
            z = y;
            uint256 x = y / 2 + 1;
            while (x < z) {
                z = x;
                x = (y / x + x) / 2;
            }
        } else if (y != 0) {
            z = 1;
        }
    }
}

pragma solidity ^0.8.17;

interface IERC20 {
    function totalSupply() external view returns (uint256);

    function transfer(address recipient, uint256 amount)
        external
        returns (bool);

    function decimals() external view returns (uint8);

    function symbol() external view returns (string memory);

    function balanceOf(address) external view returns (uint256);

    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) external returns (bool);

    function approve(address spender, uint256 value) external returns (bool);
}

pragma solidity ^0.8.17;

interface IBaseFees {
    function protocolFee() external view returns (uint256);

    function usdfiMakerFee() external view returns (uint256);

    function lpOwnerFee() external view returns (uint256);

    function claimFeesFor(
        address recipient,
        uint256 amount0,
        uint256 amount1
    ) external returns (uint256 claimed0, uint256 claimed1);

    function setFeeAmount(
        uint256 protocolFee,
        uint256 usdfiMakerFee,
        uint256 lpOwnerFee
    ) external;
}

// Base V1 Fees contract is used as a 1:1 pair relationship to split out fees, this ensures that the curve does not need to be modified for LP shares
contract BaseFees is IBaseFees {
    address internal immutable factory; // Factory that created the pairs
    address internal immutable pair; // The pair it is bonded to
    address internal immutable token0; // token0 of pair, saved locally and statically for gas optimization
    address internal immutable token1; // Token1 of pair, saved locally and statically for gas optimization

    uint256 public protocolFee = 0;
    uint256 public usdfiMakerFee = 800;
    uint256 public lpOwnerFee = 200;

    event feeAmountUpdated(
        uint256 prevProtocolFee,
        uint256 indexed protocolFee,
        uint256 prevUsdfiMakerFee,
        uint256 indexed usdfiMakerFee,
        uint256 prevLpOwnerFee,
        uint256 indexed lpOwnerFee
    );

    constructor(
        address _token0,
        address _token1,
        address _factory
    ) {
        pair = msg.sender;
        factory = _factory;
        token0 = _token0;
        token1 = _token1;
    }

    function _safeTransfer(
        address token,
        address to,
        uint256 value
    ) internal {
        require(token.code.length > 0);
        (bool success, bytes memory data) = token.call(
            abi.encodeWithSelector(IERC20.transfer.selector, to, value)
        );
        require(success && (data.length == 0 || abi.decode(data, (bool))));
    }

    // Allow the pair to transfer fees to users
    function claimFeesFor(
        address recipient,
        uint256 amount0,
        uint256 amount1
    ) external returns (uint256 claimed0, uint256 claimed1) {
        require(msg.sender == pair);
        uint256 _divisor = 1000;

        // send X% to protocol address if protocol address exists
        address protocolAddress = BaseFactory(factory).protocolAddresses(pair);
        if (protocolAddress != address(0x0) && protocolFee > 0) {
            if (amount0 > 0)
                _safeTransfer(
                    token0,
                    protocolAddress,
                    (amount0 * protocolFee) / _divisor
                );
            if (amount1 > 0)
                _safeTransfer(
                    token1,
                    protocolAddress,
                    (amount1 * protocolFee) / _divisor
                );
        }

        // send X% to usdfiMaker
        address usdfiMaker = BaseFactory(factory).usdfiMaker();
        if (usdfiMaker != address(0x0)) {
            if (amount0 > 0)
                _safeTransfer(
                    token0,
                    usdfiMaker,
                    (amount0 * usdfiMakerFee) / _divisor
                );
            if (amount1 > 0)
                _safeTransfer(
                    token1,
                    usdfiMaker,
                    (amount1 * usdfiMakerFee) / _divisor
                );
        }

        claimed0 = (amount0 * lpOwnerFee) / _divisor;
        claimed1 = (amount1 * lpOwnerFee) / _divisor;

        // send the rest to owner of LP
        if (amount0 > 0) _safeTransfer(token0, recipient, claimed0);
        if (amount1 > 0) _safeTransfer(token1, recipient, claimed1);
    }

    /**
     * @dev Updates the fees
     *
     * - updates the share of fees attributed to the given protocol
     * - updates the share of fees attributed to the given buyback protocol
     * - updates the share of fees attributed to the given lp owner
     *
     * Can only be called by the factory's owner (feeAmountOwner)
     */
    function setFeeAmount(
        uint256 _protocolFee,
        uint256 _usdfiMakerFee,
        uint256 _lpOwnerFee
    ) external {
        require(
            msg.sender == BaseFactory(factory).feeAmountOwner() ||
                msg.sender == BaseFactory(factory).admin(),
            "Pair: only factory's feeAmountOwner or admin"
        );
        require(
            _protocolFee + _usdfiMakerFee + _lpOwnerFee == 1000,
            "Pair: not 100%"
        );
        require(_usdfiMakerFee >= 10, "Pair: need more then 1%");
        require(_lpOwnerFee >= 10, "Pair: need more then 1%");

        uint256 prevProtocolFee = protocolFee;
        protocolFee = _protocolFee;

        uint256 prevUsdfiMakerFee = usdfiMakerFee;
        usdfiMakerFee = _usdfiMakerFee;

        uint256 prevLpOwnerFee = lpOwnerFee;
        lpOwnerFee = _lpOwnerFee;

        emit feeAmountUpdated(
            prevProtocolFee,
            protocolFee,
            prevUsdfiMakerFee,
            usdfiMakerFee,
            prevLpOwnerFee,
            lpOwnerFee
        );
    }
}

pragma solidity ^0.8.17;

interface IBaseCallee {
    function hook(
        address sender,
        uint256 amount0,
        uint256 amount1,
        bytes calldata data
    ) external;
}

// The base pair of pools, either stable or volatile
contract BasePair is IBasePair {
    string public name;
    string public symbol;
    uint8 public constant decimals = 18;

    // Used to denote stable or volatile pair, immutable since construction happens in the initialize method for CREATE2 deterministic addresses
    bool public immutable stable;
    uint256 public fee;

    uint256 public totalSupply = 0;

    mapping(address => mapping(address => uint256)) public allowance;
    mapping(address => uint256) public balanceOf;

    bytes32 public DOMAIN_SEPARATOR;
    // keccak256("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)");
    bytes32 public constant PERMIT_TYPEHASH =
        0x6e71edae12b1b97f4d1f60370fef10105fa2faae0126114a169c64845d6126c9;
    uint256 internal chainid;
    mapping(address => uint256) public nonces;

    uint256 internal constant MINIMUM_LIQUIDITY = 10**3;

    address public immutable token0;
    address public immutable token1;
    address public immutable fees;
    address immutable factory;

    // Structure to capture time period observations every 30 minutes, used for local oracles
    struct Observation {
        uint256 timestamp;
        uint256 reserve0Cumulative;
        uint256 reserve1Cumulative;
    }

    // Capture oracle reading every 30 minutes
    uint256 constant periodSize = 1800;

    Observation[] public observations;

    uint256 internal immutable decimals0;
    uint256 internal immutable decimals1;

    uint256 public reserve0;
    uint256 public reserve1;
    uint256 public blockTimestampLast;

    uint256 public reserve0CumulativeLast;
    uint256 public reserve1CumulativeLast;

    // index0 and index1 are used to accumulate fees, this is split out from normal trades to keep the swap "clean"
    // this further allows LP holders to easily claim fees for tokens they have/staked
    uint256 public index0 = 0;
    uint256 public index1 = 0;

    // position assigned to each LP to track their current index0 & index1 vs the global position
    mapping(address => uint256) public supplyIndex0;
    mapping(address => uint256) public supplyIndex1;

    // tracks the amount of unclaimed, but claimable tokens off of fees for token0 and token1
    mapping(address => uint256) public claimable0;
    mapping(address => uint256) public claimable1;

    event Fees(address indexed sender, uint256 amount0, uint256 amount1);
    event Mint(address indexed sender, uint256 amount0, uint256 amount1);
    event Burn(
        address indexed sender,
        uint256 amount0,
        uint256 amount1,
        address indexed to
    );
    event Swap(
        address indexed sender,
        uint256 amount0In,
        uint256 amount1In,
        uint256 amount0Out,
        uint256 amount1Out,
        address indexed to
    );
    event Sync(uint256 reserve0, uint256 reserve1);
    event Claim(address indexed recipient, uint256 amount0, uint256 amount1);

    event Transfer(address indexed from, address indexed to, uint256 amount);
    event Approval(
        address indexed owner,
        address indexed spender,
        uint256 amount
    );
    event SetFee(uint256 newFee);
    event Recovered(address token, uint256 amount);

    modifier gasThrottle() {
        if (BaseFactory(factory).maxGasPrice() > 0) {
            require(
                tx.gasprice <= BaseFactory(factory).maxGasPrice(),
                "gas is too high!"
            );
        }
        _;
    }

    constructor() {
        factory = msg.sender;
        (address _token0, address _token1, bool _stable) = BaseFactory(
            msg.sender
        ).getInitializable();
        (token0, token1, stable) = (_token0, _token1, _stable);
        fees = address(new BaseFees(_token0, _token1, factory));
        if (_stable) {
            name = string(
                abi.encodePacked(
                    "USDFI.com Stable AMM - ",
                    IERC20(_token0).symbol(),
                    "/",
                    IERC20(_token1).symbol()
                )
            );
            symbol = string(
                abi.encodePacked(
                    "sAMM-",
                    IERC20(_token0).symbol(),
                    "/",
                    IERC20(_token1).symbol()
                )
            );
            fee = BaseFactory(factory).baseStableFee();
        } else {
            name = string(
                abi.encodePacked(
                    "USDFI.com Volatile AMM - ",
                    IERC20(_token0).symbol(),
                    "/",
                    IERC20(_token1).symbol()
                )
            );
            symbol = string(
                abi.encodePacked(
                    "vAMM-",
                    IERC20(_token0).symbol(),
                    "/",
                    IERC20(_token1).symbol()
                )
            );
            fee = BaseFactory(factory).baseVariableFee();
        }

        decimals0 = 10**IERC20(_token0).decimals();
        decimals1 = 10**IERC20(_token1).decimals();

        observations.push(Observation(block.timestamp, 0, 0));
    }

    // simple re-entrancy check
    uint256 internal _unlocked = 1;
    modifier lock() {
        require(_unlocked == 1);
        _unlocked = 2;
        _;
        _unlocked = 1;
    }

    function observationLength() external view returns (uint256) {
        return observations.length;
    }

    function lastObservation() public view returns (Observation memory) {
        return observations[observations.length - 1];
    }

    function metadata()
        external
        view
        returns (
            uint256 dec0,
            uint256 dec1,
            uint256 r0,
            uint256 r1,
            bool st,
            address t0,
            address t1
        )
    {
        return (
            decimals0,
            decimals1,
            reserve0,
            reserve1,
            stable,
            token0,
            token1
        );
    }

    function tokens() external view returns (address, address) {
        return (token0, token1);
    }

    function usdfiMaker() external view returns (address) {
        return BaseFactory(factory).usdfiMaker();
    }

    function protocol() external view returns (address) {
        return BaseFactory(factory).protocolAddresses(address(this));
    }

    // claim accumulated but unclaimed fees (viewable via claimable0 and claimable1)
    function claimFees() external returns (uint256 claimed0, uint256 claimed1) {
        _updateFor(msg.sender);

        claimed0 = claimable0[msg.sender];
        claimed1 = claimable1[msg.sender];

        if (claimed0 > 0 || claimed1 > 0) {
            claimable0[msg.sender] = 0;
            claimable1[msg.sender] = 0;

            (claimed0, claimed1) = BaseFees(fees).claimFeesFor(
                msg.sender,
                claimed0,
                claimed1
            );

            emit Claim(msg.sender, claimed0, claimed1);
        }
    }

    // Accrue fees on token0
    function _update0(uint256 amount) internal {
        _safeTransfer(token0, fees, amount); // transfer the fees out to BaseV1Fees
        uint256 _ratio = (amount * 1e18) / totalSupply; // 1e18 adjustment is removed during claim
        if (_ratio > 0) {
            index0 += _ratio;
        }
        emit Fees(msg.sender, amount, 0);
    }

    // Accrue fees on token1
    function _update1(uint256 amount) internal {
        _safeTransfer(token1, fees, amount);
        uint256 _ratio = (amount * 1e18) / totalSupply;
        if (_ratio > 0) {
            index1 += _ratio;
        }
        emit Fees(msg.sender, 0, amount);
    }

    // this function MUST be called on any balance changes, otherwise can be used to infinitely claim fees
    // Fees are segregated from core funds, so fees can never put liquidity at risk
    function _updateFor(address recipient) internal {
        uint256 _supplied = balanceOf[recipient]; // get LP balance of `recipient`
        if (_supplied > 0) {
            uint256 _supplyIndex0 = supplyIndex0[recipient]; // get last adjusted index0 for recipient
            uint256 _supplyIndex1 = supplyIndex1[recipient];
            uint256 _index0 = index0; // get global index0 for accumulated fees
            uint256 _index1 = index1;
            supplyIndex0[recipient] = _index0; // update user current position to global position
            supplyIndex1[recipient] = _index1;
            uint256 _delta0 = _index0 - _supplyIndex0; // see if there is any difference that need to be accrued
            uint256 _delta1 = _index1 - _supplyIndex1;
            if (_delta0 > 0) {
                uint256 _share = (_supplied * _delta0) / 1e18; // add accrued difference for each supplied token
                claimable0[recipient] += _share;
            }
            if (_delta1 > 0) {
                uint256 _share = (_supplied * _delta1) / 1e18;
                claimable1[recipient] += _share;
            }
        } else {
            supplyIndex0[recipient] = index0; // new users are set to the default global state
            supplyIndex1[recipient] = index1;
        }
    }

    function getReserves()
        public
        view
        returns (
            uint256 _reserve0,
            uint256 _reserve1,
            uint256 _blockTimestampLast
        )
    {
        _reserve0 = reserve0;
        _reserve1 = reserve1;
        _blockTimestampLast = blockTimestampLast;
    }

    // update reserves and, on the first call per block, price accumulators
    function _update(
        uint256 balance0,
        uint256 balance1,
        uint256 _reserve0,
        uint256 _reserve1
    ) internal {
        uint256 blockTimestamp = block.timestamp;
        uint256 timeElapsed = blockTimestamp - blockTimestampLast; // overflow is desired
        if (timeElapsed > 0 && _reserve0 != 0 && _reserve1 != 0) {
            reserve0CumulativeLast += _reserve0 * timeElapsed;
            reserve1CumulativeLast += _reserve1 * timeElapsed;
        }

        Observation memory _point = lastObservation();
        timeElapsed = blockTimestamp - _point.timestamp; // compare the last observation with current timestamp, if greater than 30 minutes, record a new event
        if (timeElapsed > periodSize) {
            observations.push(
                Observation(
                    blockTimestamp,
                    reserve0CumulativeLast,
                    reserve1CumulativeLast
                )
            );
        }
        reserve0 = balance0;
        reserve1 = balance1;
        blockTimestampLast = blockTimestamp;
        emit Sync(reserve0, reserve1);
    }

    // produces the cumulative price using counterfactuals to save gas and avoid a call to sync.
    function currentCumulativePrices()
        public
        view
        returns (
            uint256 reserve0Cumulative,
            uint256 reserve1Cumulative,
            uint256 blockTimestamp
        )
    {
        blockTimestamp = block.timestamp;
        reserve0Cumulative = reserve0CumulativeLast;
        reserve1Cumulative = reserve1CumulativeLast;

        // if time has elapsed since the last update on the pair, mock the accumulated price values
        (
            uint256 _reserve0,
            uint256 _reserve1,
            uint256 _blockTimestampLast
        ) = getReserves();
        if (_blockTimestampLast != blockTimestamp) {
            // subtraction overflow is desired
            uint256 timeElapsed = blockTimestamp - _blockTimestampLast;
            reserve0Cumulative += _reserve0 * timeElapsed;
            reserve1Cumulative += _reserve1 * timeElapsed;
        }
    }

    // gives the current twap price measured from amountIn * tokenIn gives amountOut
    function current(address tokenIn, uint256 amountIn)
        external
        view
        returns (uint256 amountOut)
    {
        Observation memory _observation = lastObservation();
        (
            uint256 reserve0Cumulative,
            uint256 reserve1Cumulative,

        ) = currentCumulativePrices();
        if (block.timestamp == _observation.timestamp) {
            _observation = observations[observations.length - 2];
        }

        uint256 timeElapsed = block.timestamp - _observation.timestamp;
        uint256 _reserve0 = (reserve0Cumulative -
            _observation.reserve0Cumulative) / timeElapsed;
        uint256 _reserve1 = (reserve1Cumulative -
            _observation.reserve1Cumulative) / timeElapsed;
        amountOut = _getAmountOut(amountIn, tokenIn, _reserve0, _reserve1);
    }

    // as per `current`, however allows user configured granularity, up to the full window size
    function quote(
        address tokenIn,
        uint256 amountIn,
        uint256 granularity
    ) external view returns (uint256 amountOut) {
        uint256[] memory _prices = sample(tokenIn, amountIn, granularity, 1);
        uint256 priceAverageCumulative;
        for (uint256 i = 0; i < _prices.length; i++) {
            priceAverageCumulative += _prices[i];
        }
        return priceAverageCumulative / granularity;
    }

    // returns a memory set of twap prices
    function prices(
        address tokenIn,
        uint256 amountIn,
        uint256 points
    ) external view returns (uint256[] memory) {
        return sample(tokenIn, amountIn, points, 1);
    }

    function sample(
        address tokenIn,
        uint256 amountIn,
        uint256 points,
        uint256 window
    ) public view returns (uint256[] memory) {
        uint256[] memory _prices = new uint256[](points);

        uint256 length = observations.length - 1;
        uint256 i = length - (points * window);
        uint256 nextIndex = 0;
        uint256 index = 0;

        for (; i < length; i += window) {
            nextIndex = i + window;
            uint256 timeElapsed = observations[nextIndex].timestamp -
                observations[i].timestamp;
            uint256 _reserve0 = (observations[nextIndex].reserve0Cumulative -
                observations[i].reserve0Cumulative) / timeElapsed;
            uint256 _reserve1 = (observations[nextIndex].reserve1Cumulative -
                observations[i].reserve1Cumulative) / timeElapsed;
            _prices[index] = _getAmountOut(
                amountIn,
                tokenIn,
                _reserve0,
                _reserve1
            );
            index = index + 1;
        }
        return _prices;
    }

    // this low-level function should be called from a contract which performs important safety checks
    // standard uniswap v2 implementation
    function mint(address to) external lock returns (uint256 liquidity) {
        (uint256 _reserve0, uint256 _reserve1) = (reserve0, reserve1);
        uint256 _balance0 = IERC20(token0).balanceOf(address(this));
        uint256 _balance1 = IERC20(token1).balanceOf(address(this));
        uint256 _amount0 = _balance0 - _reserve0;
        uint256 _amount1 = _balance1 - _reserve1;

        uint256 _totalSupply = totalSupply; // gas savings, must be defined here since totalSupply can update in _mintFee
        if (_totalSupply == 0) {
            liquidity = Math.sqrt(_amount0 * _amount1) - MINIMUM_LIQUIDITY;
            _mint(address(0), MINIMUM_LIQUIDITY); // permanently lock the first MINIMUM_LIQUIDITY tokens
        } else {
            liquidity = Math.min(
                (_amount0 * _totalSupply) / _reserve0,
                (_amount1 * _totalSupply) / _reserve1
            );
        }
        require(liquidity > 0, "ILM"); // BaseV1: INSUFFICIENT_LIQUIDITY_MINTED
        _mint(to, liquidity);

        _update(_balance0, _balance1, _reserve0, _reserve1);
        emit Mint(msg.sender, _amount0, _amount1);
    }

    // this low-level function should be called from a contract which performs important safety checks
    // standard uniswap v2 implementation
    function burn(address to)
        external
        lock
        returns (uint256 amount0, uint256 amount1)
    {
        (uint256 _reserve0, uint256 _reserve1) = (reserve0, reserve1);
        (address _token0, address _token1) = (token0, token1);
        uint256 _balance0 = IERC20(_token0).balanceOf(address(this));
        uint256 _balance1 = IERC20(_token1).balanceOf(address(this));
        uint256 _liquidity = balanceOf[address(this)];

        uint256 _totalSupply = totalSupply; // gas savings, must be defined here since totalSupply can update in _mintFee
        amount0 = (_liquidity * _balance0) / _totalSupply; // using balances ensures proportionate distribution
        amount1 = (_liquidity * _balance1) / _totalSupply; // using balances ensures proportionate distribution
        require(amount0 > 0 && amount1 > 0, "ILB"); // BaseV1: INSUFFICIENT_LIQUIDITY_BURNED
        _burn(address(this), _liquidity);
        _safeTransfer(_token0, to, amount0);
        _safeTransfer(_token1, to, amount1);
        _balance0 = IERC20(_token0).balanceOf(address(this));
        _balance1 = IERC20(_token1).balanceOf(address(this));

        _update(_balance0, _balance1, _reserve0, _reserve1);
        emit Burn(msg.sender, amount0, amount1, to);
    }

    // this low-level function should be called from a contract which performs important safety checks
    function swap(
        uint256 amount0Out,
        uint256 amount1Out,
        address to,
        bytes calldata data
    ) external lock gasThrottle {
        require(!BaseFactory(factory).isPaused());
        require(amount0Out > 0 || amount1Out > 0, "IOA"); // BaseV1: INSUFFICIENT_OUTPUT_AMOUNT
        (uint256 _reserve0, uint256 _reserve1) = (reserve0, reserve1);
        require(amount0Out < _reserve0 && amount1Out < _reserve1, "IL"); // BaseV1: INSUFFICIENT_LIQUIDITY

        uint256 _balance0;
        uint256 _balance1;
        {
            // scope for _token{0,1}, avoids stack too deep errors
            (address _token0, address _token1) = (token0, token1);
            require(to != _token0 && to != _token1, "IT"); // BaseV1: INVALID_TO
            if (amount0Out > 0) _safeTransfer(_token0, to, amount0Out); // optimistically transfer tokens
            if (amount1Out > 0) _safeTransfer(_token1, to, amount1Out); // optimistically transfer tokens
            if (data.length > 0)
                IBaseCallee(to).hook(msg.sender, amount0Out, amount1Out, data); // callback, used for flash loans
            _balance0 = IERC20(_token0).balanceOf(address(this));
            _balance1 = IERC20(_token1).balanceOf(address(this));
        }
        uint256 amount0In = _balance0 > _reserve0 - amount0Out
            ? _balance0 - (_reserve0 - amount0Out)
            : 0;
        uint256 amount1In = _balance1 > _reserve1 - amount1Out
            ? _balance1 - (_reserve1 - amount1Out)
            : 0;
        require(amount0In > 0 || amount1In > 0, "IIA"); // BaseV1: INSUFFICIENT_INPUT_AMOUNT
        {
            // scope for reserve{0,1}Adjusted, avoids stack too deep errors
            (address _token0, address _token1) = (token0, token1);

            if (amount0In > 0) _update0(amount0In / fee); // accrue fees for token0 and move them out of pool
            if (amount1In > 0) _update1(amount1In / fee); // accrue fees for token1 and move them out of pool

            _balance0 = IERC20(_token0).balanceOf(address(this)); // since we removed tokens, we need to reconfirm balances, can also simply use previous balance - amountIn/ 10000, but doing balanceOf again as safety check
            _balance1 = IERC20(_token1).balanceOf(address(this));
            // The curve, either x3y+y3x for stable pools, or x*y for volatile pools
            require(_k(_balance0, _balance1) >= _k(_reserve0, _reserve1), "K"); // BaseV1: K
        }

        _update(_balance0, _balance1, _reserve0, _reserve1);
        emit Swap(msg.sender, amount0In, amount1In, amount0Out, amount1Out, to);
    }

    // force balances to match reserves
    function skim(address to) external lock {
        (address _token0, address _token1) = (token0, token1);
        _safeTransfer(
            _token0,
            to,
            IERC20(_token0).balanceOf(address(this)) - (reserve0)
        );
        _safeTransfer(
            _token1,
            to,
            IERC20(_token1).balanceOf(address(this)) - (reserve1)
        );
    }

    // force reserves to match balances
    function sync() external lock {
        _update(
            IERC20(token0).balanceOf(address(this)),
            IERC20(token1).balanceOf(address(this)),
            reserve0,
            reserve1
        );
    }

    function _f(uint256 x0, uint256 y) internal pure returns (uint256) {
        return
            (x0 * ((((y * y) / 1e18) * y) / 1e18)) /
            1e18 +
            (((((x0 * x0) / 1e18) * x0) / 1e18) * y) /
            1e18;
    }

    function _d(uint256 x0, uint256 y) internal pure returns (uint256) {
        return
            (3 * x0 * ((y * y) / 1e18)) /
            1e18 +
            ((((x0 * x0) / 1e18) * x0) / 1e18);
    }

    function _get_y(
        uint256 x0,
        uint256 xy,
        uint256 y
    ) internal pure returns (uint256) {
        for (uint256 i = 0; i < 255; i++) {
            uint256 y_prev = y;
            uint256 k = _f(x0, y);
            if (k < xy) {
                uint256 dy = ((xy - k) * 1e18) / _d(x0, y);
                y = y + dy;
            } else {
                uint256 dy = ((k - xy) * 1e18) / _d(x0, y);
                y = y - dy;
            }
            if (y > y_prev) {
                if (y - y_prev <= 1) {
                    return y;
                }
            } else {
                if (y_prev - y <= 1) {
                    return y;
                }
            }
        }
        return y;
    }

    function getAmountOut(uint256 amountIn, address tokenIn)
        external
        view
        returns (uint256)
    {
        (uint256 _reserve0, uint256 _reserve1) = (reserve0, reserve1);
        amountIn -= amountIn / fee; // remove fee from amount received
        return _getAmountOut(amountIn, tokenIn, _reserve0, _reserve1);
    }

    function _getAmountOut(
        uint256 amountIn,
        address tokenIn,
        uint256 _reserve0,
        uint256 _reserve1
    ) internal view returns (uint256) {
        if (stable) {
            uint256 xy = _k(_reserve0, _reserve1);
            _reserve0 = (_reserve0 * 1e18) / decimals0;
            _reserve1 = (_reserve1 * 1e18) / decimals1;
            (uint256 reserveA, uint256 reserveB) = tokenIn == token0
                ? (_reserve0, _reserve1)
                : (_reserve1, _reserve0);
            amountIn = tokenIn == token0
                ? (amountIn * 1e18) / decimals0
                : (amountIn * 1e18) / decimals1;
            uint256 y = reserveB - _get_y(amountIn + reserveA, xy, reserveB);
            return (y * (tokenIn == token0 ? decimals1 : decimals0)) / 1e18;
        } else {
            (uint256 reserveA, uint256 reserveB) = tokenIn == token0
                ? (_reserve0, _reserve1)
                : (_reserve1, _reserve0);
            return (amountIn * reserveB) / (reserveA + amountIn);
        }
    }

    function _k(uint256 x, uint256 y) internal view returns (uint256) {
        if (stable) {
            uint256 _x = (x * 1e18) / decimals0;
            uint256 _y = (y * 1e18) / decimals1;
            uint256 _a = (_x * _y) / 1e18;
            uint256 _b = ((_x * _x) / 1e18 + (_y * _y) / 1e18);
            return (_a * _b) / 1e18; // x3y+y3x >= k
        } else {
            return x * y; // xy >= k
        }
    }

    function _mint(address dst, uint256 amount) internal {
        _updateFor(dst); // balances must be updated on mint/burn/transfer
        totalSupply += amount;
        balanceOf[dst] += amount;
        emit Transfer(address(0), dst, amount);
    }

    function _burn(address dst, uint256 amount) internal {
        _updateFor(dst);
        totalSupply -= amount;
        balanceOf[dst] -= amount;
        emit Transfer(dst, address(0), amount);
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;

        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function permit(
        address owner,
        address spender,
        uint256 value,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external {
        require(deadline >= block.timestamp, "BaseV1: EXPIRED");
        if (chainid != block.chainid) {
            DOMAIN_SEPARATOR = keccak256(
                abi.encode(
                    keccak256(
                        "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
                    ),
                    keccak256(bytes(name)),
                    keccak256("1"),
                    block.chainid,
                    address(this)
                )
            );
            chainid == block.chainid;
        }
        bytes32 digest = keccak256(
            abi.encodePacked(
                "\x19\x01",
                DOMAIN_SEPARATOR,
                keccak256(
                    abi.encode(
                        PERMIT_TYPEHASH,
                        owner,
                        spender,
                        value,
                        nonces[owner]++,
                        deadline
                    )
                )
            )
        );
        address recoveredAddress = ecrecover(digest, v, r, s);
        require(
            recoveredAddress != address(0) && recoveredAddress == owner,
            "BaseV1: INVALID_SIGNATURE"
        );
        allowance[owner][spender] = value;

        emit Approval(owner, spender, value);
    }

    function transfer(address dst, uint256 amount) external returns (bool) {
        _transferTokens(msg.sender, dst, amount);
        return true;
    }

    function transferFrom(
        address src,
        address dst,
        uint256 amount
    ) external returns (bool) {
        address spender = msg.sender;
        uint256 spenderAllowance = allowance[src][spender];

        if (spender != src && spenderAllowance != type(uint256).max) {
            uint256 newAllowance = spenderAllowance - amount;
            allowance[src][spender] = newAllowance;

            emit Approval(src, spender, newAllowance);
        }

        _transferTokens(src, dst, amount);
        return true;
    }

    function _transferTokens(
        address src,
        address dst,
        uint256 amount
    ) internal {
        _updateFor(src); // update fee position for src
        _updateFor(dst); // update fee position for dst

        balanceOf[src] -= amount;
        balanceOf[dst] += amount;

        emit Transfer(src, dst, amount);
    }

    function _safeTransfer(
        address token,
        address to,
        uint256 value
    ) internal {
        require(token.code.length > 0);
        (bool success, bytes memory data) = token.call(
            abi.encodeWithSelector(IERC20.transfer.selector, to, value)
        );
        require(success && (data.length == 0 || abi.decode(data, (bool))));
    }

    // set a new fee for the LP
    // 10 max fees for LPs (10%)
    // 10000 min fees for LPs (0.01%)
    function setFee(uint256 _fee) external {
        require(
            msg.sender == BaseFactory(factory).feeAmountOwner() ||
                msg.sender == BaseFactory(factory).admin(),
            "Pair: only factory's feeAmountOwner or admin"
        );
        require(_fee >= 10 && _fee <= 1000, "!range");
        fee = _fee;
        emit SetFee(fee);
    }
}


const convert = (amount, decimals) => ethers.utils.parseUnits(amount, decimals);
const divDec = (amount, decimals = 18) => amount / 10 ** decimals;
const { expect } = require("chai");
const { ethers, network } = require("hardhat");
const { execPath } = require("process");
const { getParsedCommandLineOfConfigFile, factory } = require("typescript");

const AddressZero = '0x0000000000000000000000000000000000000000'
const MINIMUM_LIQUIDITY = "1000"
const five = convert('5', 18)
const ten = convert('10', 18)
const fifty = convert('50', 18)
const oneHundred = convert('100', 18);
const twoHundred = convert('200', 18);
const twoHundredAndFifty = convert('250', 18);
const fiveHundred = convert('500', 18);
const eightHundred = convert('800', 18);
const oneThousand = convert('1000', 18);
const tenThousand = convert('10000', 18);
const oneHundredThousand = convert('100000', 18);
const April2026 = '1775068986';
const May2026 = '1776278586'
const oneWeek = 604800;
const oneday = 24 * 3600;
const twodays = 2 * 24 * 3600;
const startTime = Math.floor(Date.now() / 1000);

// users
let owner, admin, user1, user2, protocol1, protocol2, treasury;
// contracts
let pairFactory, router, usdfiMaker;
let vLP1, vLP1Fees, vLP2, vLP2Fees;
let sLP1, sLP1Fees, sLP2, sLP2Fees;
let aLP1, aLP1Fees, aLP2, aLP2Fees;
// tokens
let STABLE, veSTABLE, WETH, TK1, TK2, USDC, USD1, USD2, LP1, LP2, LP3, LP4;

describe("Sytem Test", function () {

    before("Initial set up", async function () {
        console.log("Begin Initialization");

        // initialize users
        [owner, admin, user1, user2, user3, protocol1, protocol2, usdfiMaker, treasury, mainRefFeeReceiver, burn, briber] = await ethers.getSigners();

        // initialize tokens
        const WETHMock = await ethers.getContractFactory("WrappedEth");
        WETH = await WETHMock.deploy();
        await WETH.deposit({ value: oneThousand });

        // mints 1000 tokens to deployer
        const erc20Mock = await ethers.getContractFactory("ERC20Mock");
        // WETH = await erc20Mock.deploy("WETH", "WETH");
        TK1 = await erc20Mock.deploy("TK1", "TK1");
        TK2 = await erc20Mock.deploy("TK2", "TK2");
        USDC = await erc20Mock.deploy("USDC", "USDC");
        USD1 = await erc20Mock.deploy("USD1", "USD1");
        USD2 = await erc20Mock.deploy("USD2", "USD2");
        LP1 = await erc20Mock.deploy("LP1", "LP1");
        LP2 = await erc20Mock.deploy("LP2", "LP2");
        LP3 = await erc20Mock.deploy("LP3", "LP3");
        LP4 = await erc20Mock.deploy("LP4", "LP4");
        console.log("- Tokens Initialized");

        await WETH.transfer(user1.address, oneHundred);
        await TK1.transfer(user1.address, oneHundred);
        await USDC.transfer(user1.address, fiveHundred);
        await USD1.transfer(user1.address, oneHundred);
        await USD2.transfer(user1.address, oneHundred);

        await WETH.transfer(user2.address, oneHundred);
        await TK1.transfer(user2.address, oneHundred);
        await USDC.transfer(user2.address, fiveHundred);
        await USD1.transfer(user2.address, oneHundred);
        await USD2.transfer(user2.address, oneHundred);

        await WETH.transfer(user3.address, oneHundred);
        await TK1.transfer(user3.address, oneHundred);
        await USDC.transfer(user3.address, fiveHundred);
        await USD1.transfer(user3.address, oneHundred);
        await USD2.transfer(user3.address, oneHundred);

        await TK1.transfer(briber.address, oneHundred);

        // Initialize pairFactory
        const pairFactoryArtifact = await ethers.getContractFactory("BaseFactory");
        const pairFactoryContract = await pairFactoryArtifact.deploy();
        pairFactory = await ethers.getContractAt("BaseFactory", pairFactoryContract.address);
        console.log("- Pair Factory Initialized");

        // Initialize router
        const routerArtifact = await ethers.getContractFactory("BaseRouter01");
        const routerContract = await routerArtifact.deploy(pairFactory.address, WETH.address);
        router = await ethers.getContractAt("BaseRouter01", routerContract.address);
        console.log("- Router Initialized");

        // Set Spirit Maker of Factory
        // await pairFactory.setusdfiMaker(usdfiMaker.address);
        //await pairFactory.setAdmins(usdfiMaker.address, feeAmountOwner.address, admin.address);
        await pairFactory.setAdmins(usdfiMaker.address, user1.address, user1.address);


        // Create vLP: WETH-TK1
        await WETH.connect(owner).approve(router.address, oneHundred);
        await TK1.connect(owner).approve(router.address, oneHundred);
        await router.connect(owner).addLiquidityBNB(TK1.address, false, oneHundred, oneHundred, oneHundred, owner.address, "1000000000000", { value: oneHundred });

        const vLP1Address = await pairFactory.getPair(WETH.address, TK1.address, false);
        vLP1 = await ethers.getContractAt("contracts/AMM/BaseFactory.sol:BasePair", vLP1Address)
        await pairFactory.connect(owner).setProtocolAddress(vLP1.address, protocol1.address);
        console.log("- vLP1 Initialized");

        const vLP1FeesAddress = await vLP1.fees();
        vLP1Fees = await ethers.getContractAt("contracts/AMM/BaseFactory.sol:BaseFees", vLP1FeesAddress)
        console.log("- vLP1Fees Initialized");

        // Create vLP: WETH-USDC
        await WETH.connect(owner).approve(router.address, oneHundred);
        await USDC.connect(owner).approve(router.address, oneHundred);
        await router.connect(owner).addLiquidity(WETH.address, USDC.address, false, oneHundred, oneHundred, oneHundred, oneHundred, owner.address, "1000000000000");

        const vLP2Address = await pairFactory.getPair(WETH.address, USDC.address, false);
        vLP2 = await ethers.getContractAt("contracts/AMM/BaseFactory.sol:BasePair", vLP2Address)
        await pairFactory.connect(owner).setProtocolAddress(vLP2.address, protocol2.address);
        console.log("- vLP2 Initialized");

        const vLP2FeesAddress = await vLP2.fees();
        vLP2Fees = await ethers.getContractAt("contracts/AMM/BaseFactory.sol:BaseFees", vLP2FeesAddress)
        console.log("- vLP2Fees Initialized");

        // Create sLP: USDC-USD1
        await USDC.connect(owner).approve(router.address, oneHundred);
        await USD1.connect(owner).approve(router.address, oneHundred);
        await router.connect(owner).addLiquidity(USDC.address, USD1.address, true, oneHundred, oneHundred, oneHundred, oneHundred, owner.address, "1000000000000");

        const sLP1Address = await pairFactory.getPair(USDC.address, USD1.address, true);
        sLP1 = await ethers.getContractAt("contracts/AMM/BaseFactory.sol:BasePair", sLP1Address);
        await pairFactory.connect(owner).setProtocolAddress(sLP1.address, protocol1.address);
        console.log("- sLP1 Initialized");

        const sLP1FeesAddress = await sLP1.fees();
        sLP1Fees = await ethers.getContractAt("contracts/AMM/BaseFactory.sol:BaseFees", sLP1FeesAddress);
        console.log("- sLP1Fees Initialized");

        // Create sLP: USDC-USD2
        await USDC.connect(owner).approve(router.address, oneHundred);
        await USD2.connect(owner).approve(router.address, oneHundred);
        await router.connect(owner).addLiquidity(USDC.address, USD2.address, true, oneHundred, oneHundred, oneHundred, oneHundred, owner.address, "1000000000000");

        const sLP2Address = await pairFactory.getPair(USDC.address, USD2.address, true);
        sLP2 = await ethers.getContractAt("contracts/AMM/BaseFactory.sol:BasePair", sLP2Address);
        await pairFactory.connect(owner).setProtocolAddress(sLP2.address, protocol2.address);
        console.log("- sLP2 Initialized");

        const sLP2FeesAddress = await sLP2.fees();
        sLP2Fees = await ethers.getContractAt("contracts/AMM/BaseFactory.sol:BaseFees", sLP2FeesAddress);
        console.log("- sLP2Fees Initialized");

        console.log("Initialization Complete 1");

        // initialize Stable
        const stableToken = await ethers.getContractFactory("contracts/DATA/STABLE.sol:STABLE");
        STABLE = await stableToken.deploy();
        console.log("- STABLE Initialized");


        // initialize veStable
        const veSTABLEArtifact = await ethers.getContractFactory("veStable");
        const veSTABLEContract = await veSTABLEArtifact.deploy(STABLE.address, "veStable Token", "veStable", "1.0.0");
        veSTABLE = await ethers.getContractAt("veStable", veSTABLEContract.address);
        console.log("- veStable Initialized");

        // Initialize Blacklist
        const blacklistArtifact = await ethers.getContractFactory("BlacklistFactory");
        const blacklistContract = await blacklistArtifact.deploy();
        blacklist = await ethers.getContractAt("BlacklistFactory", blacklistContract.address);
        console.log("- BlacklistFactory Initialized");

        // Initialize referrals
        const referralsArtifact = await ethers.getContractFactory("Referrals");
        const referralsContract = await referralsArtifact.deploy();
        referrals = await ethers.getContractAt("Referrals", referralsContract.address);
        referrals.UpdateBlacklistContract(blacklist.address);
        console.log("- Referrals Initialized");

        // Initialize pairFactory
        const bribeFactoryArtifact = await ethers.getContractFactory("BribeFactory");
        const bribeFactoryContract = await bribeFactoryArtifact.deploy();
        bribeFactory = await ethers.getContractAt("BribeFactory", bribeFactoryContract.address);
        console.log("- Bribe Factory Initialized");

        ///////////////////////////////////////////////////////////////////////

        // Initialize pairFactory
        const stableMinterArtifact = await ethers.getContractFactory("StableMinter");
        const stableMinterContract = await stableMinterArtifact.deploy(STABLE.address);
        stableMinter = await ethers.getContractAt("StableMinter", stableMinterContract.address);
        console.log("- Stable MinterInitialized");

        // Initialize gaugeFactory
        const gaugeFactoryArtifact = await ethers.getContractFactory("GaugeFactory");
        const gaugeFactoryContract = await gaugeFactoryArtifact.deploy(STABLE.address, veSTABLE.address, bribeFactory.address, stableMinter.address, startTime, referrals.address, mainRefFeeReceiver.address)// ,refferals.address,);
        gaugeFactory = await ethers.getContractAt("GaugeFactory", gaugeFactoryContract.address);
        console.log("- Gauge Factory Initialized");

        // Initialize veVoteProxy
        const veVoteProxyArtifact = await ethers.getContractFactory("veVoteProxy");
        const veVoteProxyContract = await veVoteProxyArtifact.deploy(gaugeFactory.address);
        veVoteProxy = await ethers.getContractAt("veVoteProxy", veVoteProxyContract.address);
        await gaugeFactory.setAdminAndVoter(admin.address, veVoteProxy.address);
        console.log("- veVoteProxy Initialized");

        // Initialize Stable Miner
        await stableMinter.setReceiverPanic([gaugeFactory.address]);
        await stableMinter.setReceiverRegular([gaugeFactory.address]);
        await stableMinter.setPercentPanic([10000]);
        await stableMinter.setPercentRegular([10000]);
        await STABLE.addMinter(stableMinter.address);
        await STABLE.setFreeMintSupplyCom(stableMinter.address, tenThousand);

        console.log("Initialization Complete 2");
        console.log();
        console.log();
        console.log("******************************************************************************************************************************************************************");
        console.log("******************************************************************************************************************************************************************");
        console.log();
    });

    it('LP Pair Status', async function () {
        console.log("******************************************************");
        console.log();
        console.log("- STABLE address", STABLE.address);
        console.log("- veSTABLE address", veSTABLE.address);
        console.log("- BlacklistFactory address", blacklist.address);
        console.log("- referrals address", referrals.address);
        console.log("- bribeFactory address", bribeFactory.address);
        console.log("- gaugeFactory address", gaugeFactory.address);
        console.log("- pairFactory address", pairFactory.address);
        console.log("- router address", router.address);
        console.log();
        console.log("******************************************************");
    });

    it('set Base ref', async function () {
        console.log("******************************************************");
        console.log();
        await referrals.transferOwnership(admin.address);
        expect(await referrals.owner()).to.be.equal(admin.address);
        await referrals.connect(admin).addMember(user1.address, user1.address);
        let lastMember = await referrals.lastMember();
        console.log("referrals.lastMember", Number(lastMember));
        expect(await referrals.lastMember()).to.be.equal(1);
        console.log("referrals.isMember", await referrals.isMember(user1.address));
        expect(await referrals.isMember(user1.address)).to.be.equal(true);
        console.log("referrals.getSponsor", await referrals.getSponsor(user1.address));
        expect(await referrals.getSponsor(user1.address)).to.be.equal(user1.address);
        console.log();
        console.log("******************************************************");
    });

    it('add Gauge', async function () {
        console.log("******************************************************");
        console.log();

        // Set up Gauges/Bribes for LP1, LP2, LP3
        await gaugeFactory.addGauge(sLP1.address, 100000);
        await gaugeFactory.addGauge(sLP2.address, 100000);

        await gaugeFactory.addGauge(vLP1.address, 100000);
        await gaugeFactory.addGauge(vLP2.address, 100000);

        expect(await gaugeFactory.length()).to.be.equal(4);
        expect(await gaugeFactory.tokens()).to.be.eql([sLP1.address, sLP2.address, vLP1.address, vLP2.address]);

        // Gauge and Bribe same definition => Duplicate RewardPaid (not needet for testing (ignored))
        let sLP1GaugeAddr = await gaugeFactory.getGauge(sLP1.address);
        console.log("getGauge sLP1", await gaugeFactory.getGauge(sLP1.address));
        sLP1Gauge = await ethers.getContractAt("contracts/GaugeFactory/GaugeFactory.sol:Gauge", sLP1GaugeAddr);
        let sLP1BribeAddress = await gaugeFactory.getBribes(sLP1GaugeAddr);
        sLP1Bribe = await ethers.getContractAt("contracts/BribeFactory/BribeFactory.sol:Bribe", sLP1BribeAddress);

        let sLP2GaugeAddr = await gaugeFactory.getGauge(sLP2.address);
        console.log("getGauge sLP2", await gaugeFactory.getGauge(sLP2.address));
        sLP2Gauge = await ethers.getContractAt("contracts/GaugeFactory/GaugeFactory.sol:Gauge", sLP2GaugeAddr);
        let sLP2BribeAddress = await gaugeFactory.getBribes(sLP2GaugeAddr);
        sLP2Bribe = await ethers.getContractAt("contracts/BribeFactory/BribeFactory.sol:Bribe", sLP2BribeAddress);

        let vLP1GaugeAddr = await gaugeFactory.getGauge(vLP1.address);
        console.log("getGauge vLP1", await gaugeFactory.getGauge(vLP1.address));
        vLP1Gauge = await ethers.getContractAt("contracts/GaugeFactory/GaugeFactory.sol:Gauge", vLP1GaugeAddr);
        let vLP1BribeAddress = await gaugeFactory.getBribes(vLP1GaugeAddr);
        vLP1Bribe = await ethers.getContractAt("contracts/BribeFactory/BribeFactory.sol:Bribe", vLP1BribeAddress);

        let vLP2GaugeAddr = await gaugeFactory.getGauge(vLP2.address);
        console.log("getGauge vLP2", await gaugeFactory.getGauge(vLP2.address));
        vLP2Gauge = await ethers.getContractAt("contracts/GaugeFactory/GaugeFactory.sol:Gauge", vLP2GaugeAddr);
        let vLP2BribeAddress = await gaugeFactory.getBribes(vLP2GaugeAddr);
        vLP2Bribe = await ethers.getContractAt("contracts/BribeFactory/BribeFactory.sol:Bribe", vLP2BribeAddress);

        await STABLE.setFreeMintSupplyCom(owner.address, oneHundredThousand);
        //await STABLE.mint(owner.address, tenThousand);
        //await STABLE.mint(stableMinter.address, tenThousand);
        await STABLE.mint(user1.address, tenThousand);
        await STABLE.mint(user2.address, tenThousand);
        await STABLE.mint(user3.address, tenThousand);
        //await STABLE.approve(veSTABLE.address, tenThousand);
        let STABLEBalUser1 = await STABLE.balanceOf(user1.address);
        let STABLEBalUser2 = await STABLE.balanceOf(user2.address);
        let STABLEBalUser3 = await STABLE.balanceOf(user2.address);

        expect(STABLEBalUser1).to.be.equal(tenThousand);
        expect(STABLEBalUser2).to.be.equal(tenThousand);
        expect(STABLEBalUser3).to.be.equal(tenThousand);

        console.log();
        console.log("******************************************************");
    });

    it('mint LPs / addLiquidity', async function () {
        console.log("******************************************************");
        console.log();

        await TK1.connect(user1).approve(router.address, twoHundred);
        await WETH.connect(user1).approve(router.address, twoHundred);
        await USDC.connect(user1).approve(router.address, fiveHundred);
        await USD1.connect(user1).approve(router.address, twoHundred);
        await USD2.connect(user1).approve(router.address, twoHundred);

        await router.connect(user1).addLiquidity(USDC.address, USD1.address, true, oneHundred, oneHundred, oneHundred, oneHundred, user1.address, "1000000000000");
        expect(await sLP1.balanceOf(user1.address)).to.be.equal(oneHundred);
        let balanceUser1sLP1 = await sLP1.balanceOf(user1.address);
        console.log("balance User1 - sLP1", divDec(balanceUser1sLP1));
        await router.connect(user1).addLiquidity(USDC.address, USD2.address, true, oneHundred, oneHundred, oneHundred, oneHundred, user1.address, "1000000000000");
        expect(await sLP2.balanceOf(user1.address)).to.be.equal(oneHundred);
        let balanceUser1sLP2 = await sLP2.balanceOf(user1.address);
        console.log("balance User1 - sLP2", divDec(balanceUser1sLP2));
        await router.connect(user1).addLiquidityBNB(TK1.address, false, oneHundred, oneHundred, oneHundred, user1.address, "1000000000000", { value: oneHundred });
        expect(await vLP1.balanceOf(user1.address)).to.be.equal(oneHundred);
        let balanceUser1vLP1 = await vLP1.balanceOf(user1.address);
        console.log("balance User1 - vLP1", divDec(balanceUser1vLP1));
        await router.connect(user1).addLiquidity(WETH.address, USDC.address, false, oneHundred, oneHundred, oneHundred, oneHundred, user1.address, "1000000000000");
        expect(await vLP2.balanceOf(user1.address)).to.be.equal(oneHundred);
        let balanceUser1vLP2 = await vLP2.balanceOf(user1.address);
        console.log("balance User1 - vLP2", divDec(balanceUser1vLP2));

        console.log();

        await TK1.connect(user2).approve(router.address, twoHundred);
        await WETH.connect(user2).approve(router.address, twoHundred);
        await USDC.connect(user2).approve(router.address, fiveHundred);
        await USD1.connect(user2).approve(router.address, twoHundred);
        await USD2.connect(user2).approve(router.address, twoHundred);

        await router.connect(user2).addLiquidity(USDC.address, USD1.address, true, oneHundred, oneHundred, oneHundred, oneHundred, user2.address, "1000000000000");
        expect(await sLP1.balanceOf(user2.address)).to.be.equal(oneHundred);
        let balanceUser2sLP1 = await sLP1.balanceOf(user2.address);
        console.log("balance User2 - sLP1", divDec(balanceUser2sLP1));
        await router.connect(user2).addLiquidity(USDC.address, USD2.address, true, oneHundred, oneHundred, oneHundred, oneHundred, user2.address, "1000000000000");
        expect(await sLP2.balanceOf(user2.address)).to.be.equal(oneHundred);
        let balanceUser2sLP2 = await sLP2.balanceOf(user2.address);
        console.log("balance User2 - sLP2", divDec(balanceUser2sLP2));
        await router.connect(user2).addLiquidityBNB(TK1.address, false, oneHundred, oneHundred, oneHundred, user2.address, "1000000000000", { value: oneHundred });
        expect(await vLP1.balanceOf(user2.address)).to.be.equal(oneHundred);
        let balanceUser2vLP1 = await vLP1.balanceOf(user2.address);
        console.log("balance User2 - vLP1", divDec(balanceUser2vLP1));
        await router.connect(user2).addLiquidity(WETH.address, USDC.address, false, oneHundred, oneHundred, oneHundred, oneHundred, user2.address, "1000000000000");
        expect(await vLP2.balanceOf(user2.address)).to.be.equal(oneHundred);
        let balanceUser2vLP2 = await vLP2.balanceOf(user2.address);
        console.log("balance User2 - vLP2", divDec(balanceUser2vLP2));

        console.log();

        await TK1.connect(user3).approve(router.address, twoHundred);
        await WETH.connect(user3).approve(router.address, twoHundred);
        await USDC.connect(user3).approve(router.address, fiveHundred);
        await USD1.connect(user3).approve(router.address, twoHundred);
        await USD2.connect(user3).approve(router.address, twoHundred);

        await router.connect(user3).addLiquidity(USDC.address, USD1.address, true, oneHundred, oneHundred, oneHundred, oneHundred, user3.address, "1000000000000");
        expect(await sLP1.balanceOf(user3.address)).to.be.equal(oneHundred);
        let balanceUser3sLP1 = await sLP1.balanceOf(user3.address);
        console.log("balance User3 - sLP1", divDec(balanceUser3sLP1));
        await router.connect(user3).addLiquidity(USDC.address, USD2.address, true, oneHundred, oneHundred, oneHundred, oneHundred, user3.address, "1000000000000");
        expect(await sLP2.balanceOf(user3.address)).to.be.equal(oneHundred);
        let balanceUser3sLP2 = await sLP2.balanceOf(user3.address);
        console.log("balance User3 - sLP2", divDec(balanceUser3sLP2));
        await router.connect(user3).addLiquidityBNB(TK1.address, false, oneHundred, oneHundred, oneHundred, user3.address, "1000000000000", { value: oneHundred });
        expect(await vLP1.balanceOf(user3.address)).to.be.equal(oneHundred);
        let balanceUser3vLP1 = await vLP1.balanceOf(user3.address);
        console.log("balance User3 - vLP1", divDec(balanceUser3vLP1));
        await router.connect(user3).addLiquidity(WETH.address, USDC.address, false, oneHundred, oneHundred, oneHundred, oneHundred, user3.address, "1000000000000");
        expect(await vLP2.balanceOf(user3.address)).to.be.equal(oneHundred);
        let balanceUser3vLP2 = await vLP2.balanceOf(user3.address);
        console.log("balance User3 - vLP2", divDec(balanceUser3vLP2));

        console.log();
        console.log("******************************************************");
    });

    it('GaugeProxy Weight Status', async function () {
        console.log("******************************************************");
        console.log();
        let totalWeight = await gaugeFactory.totalWeight();
        let sLP1Weight = await gaugeFactory.weights(sLP1.address);
        let sLP2Weight = await gaugeFactory.weights(sLP2.address);
        let vLP1Weight = await gaugeFactory.weights(vLP1.address);
        let vLP2Weight = await gaugeFactory.weights(vLP2.address);

        let usdfiGP = await STABLE.balanceOf(gaugeFactory.address);
        let usdfisLP1 = await STABLE.balanceOf(sLP1Gauge.address);
        let usdfisLP2 = await STABLE.balanceOf(sLP2Gauge.address);
        let usdfivLP1 = await STABLE.balanceOf(vLP1Gauge.address);
        let usdfivLP2 = await STABLE.balanceOf(vLP2Gauge.address);

        expect(totalWeight).to.be.equal(0);
        expect(sLP1Weight).to.be.equal(0);
        expect(sLP2Weight).to.be.equal(0);
        expect(vLP1Weight).to.be.equal(0);
        expect(vLP2Weight).to.be.equal(0);

        expect(usdfiGP).to.be.equal(0);
        expect(usdfisLP1).to.be.equal(0);
        expect(usdfisLP2).to.be.equal(0);
        expect(usdfivLP1).to.be.equal(0);
        expect(usdfivLP2).to.be.equal(0);

        console.log("Gauge Proxy Status")
        console.log("Total weight", totalWeight);
        console.log("sLP1 weight", divDec(sLP1Weight));
        console.log("sLP2 weight", divDec(sLP2Weight));
        console.log("vLP1 weight", divDec(vLP1Weight));
        console.log("vLP2 weight", divDec(vLP2Weight));

        console.log("STABLE Balances")
        console.log("Gauge Proxy", divDec(usdfiGP));
        console.log("sLP1", divDec(usdfisLP1));
        console.log("sLP2", divDec(usdfisLP2));
        console.log("vLP1", divDec(usdfivLP1));
        console.log("vLP2", divDec(usdfivLP2));

        console.log();
        console.log("******************************************************");
    });

    it('admin calls distribute // no Votes', async function () {
        console.log("******************************************************");
        console.log();
        await gaugeFactory.connect(admin).distribute(0, 4);

        let usdfiGP = await STABLE.balanceOf(gaugeFactory.address);
        let usdfisLP1 = await STABLE.balanceOf(sLP1Gauge.address);
        let usdfisLP2 = await STABLE.balanceOf(sLP2Gauge.address);
        let usdfivLP1 = await STABLE.balanceOf(vLP1Gauge.address);
        let usdfivLP2 = await STABLE.balanceOf(vLP2Gauge.address);

        expect(usdfiGP).to.be.equal(0);
        expect(usdfisLP1).to.be.equal(0);
        expect(usdfisLP2).to.be.equal(0);
        expect(usdfivLP1).to.be.equal(0);
        expect(usdfivLP2).to.be.equal(0);

        console.log("STABLE Balances")
        console.log("Gauge Proxy", divDec(usdfiGP));
        console.log("sLP1", divDec(usdfisLP1));
        console.log("sLP2", divDec(usdfisLP2));
        console.log("vLP1", divDec(usdfivLP1));
        console.log("vLP2", divDec(usdfivLP2));

        console.log();
        console.log("******************************************************");
    });

    it('User1 deposits LP1 in all gauges', async function () {
        console.log("Forward time by 1 week");
        await network.provider.send('evm_increaseTime', [oneWeek]);
        await network.provider.send('evm_mine');

        console.log("Round 0");
        await gaugeFactory.preDistribute();
        //await gaugeFactory.connect(user1).distribute(0, 4);
    });

    it('User lock veTokens', async function () {
        console.log("******************************************************");
        console.log();

        await STABLE.connect(user1).approve(veSTABLE.address, oneThousand);
        await veSTABLE.connect(user1).create_lock(oneThousand, April2026);
        let veStableUser1 = await veSTABLE['balanceOf(address)'](user1.address);
        console.log("User1 veSTABLE bal", divDec(veStableUser1));
        expect(divDec(veStableUser1)).to.be.greaterThan(0);

        await STABLE.connect(user2).approve(veSTABLE.address, oneThousand);
        await veSTABLE.connect(user2).create_lock(fiveHundred, April2026);
        let veStableUser2 = await veSTABLE['balanceOf(address)'](user2.address);
        console.log("User2 veSTABLE bal", divDec(veStableUser2));
        expect(divDec(veStableUser2)).to.be.greaterThan(0);

        await STABLE.connect(user3).approve(veSTABLE.address, oneThousand);
        await veSTABLE.connect(user3).create_lock(twoHundredAndFifty, April2026);
        let veStableUser3 = await veSTABLE['balanceOf(address)'](user3.address);
        console.log("User3 veSTABLE bal", divDec(veStableUser3));
        expect(divDec(veStableUser3)).to.be.greaterThan(0);

        console.log();
        console.log("******************************************************");
    });

    it('end Round -1', async function () {
        console.log("******************************************************");
        console.log();
        console.log("clean user STABLE balance");
        let stableUser1 = await STABLE.balanceOf(user1.address);
        let stableUser2 = await STABLE.balanceOf(user2.address);
        let stableUser3 = await STABLE.balanceOf(user3.address);

        console.log("User1 STABLE", divDec(stableUser1));
        console.log("User2 STABLE", divDec(stableUser2));
        console.log("User3 STABLE", divDec(stableUser3));

        expect(divDec(stableUser1)).to.be.greaterThan(0);
        expect(divDec(stableUser2)).to.be.greaterThan(0);
        expect(divDec(stableUser3)).to.be.greaterThan(0);

        await STABLE.connect(user1).transfer(burn.address, stableUser1);
        await STABLE.connect(user2).transfer(burn.address, stableUser2);
        await STABLE.connect(user3).transfer(burn.address, stableUser3);

        stableUser1 = await STABLE.balanceOf(user1.address);
        stableUser2 = await STABLE.balanceOf(user2.address);
        stableUser3 = await STABLE.balanceOf(user3.address);

        expect(divDec(stableUser1)).to.be.equal(0);
        expect(divDec(stableUser2)).to.be.equal(0);
        expect(divDec(stableUser3)).to.be.equal(0);

        await network.provider.send('evm_increaseTime', [oneWeek]);
        await network.provider.send('evm_mine');
        console.log();
        console.log("******************************************************************************************************************************************************************");
        console.log("******************************************************************************************************************************************************************");
        console.log();
    });

    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    it('Users votes on gauges via proxie => ROUND 0', async function () {
        console.log("******************************************************");
        console.log();

        console.log("User1 votes on variable gauge proxy with  250 on sLP1, 250 on sLP2, 250 on vLP1, 250 on vLP2");
        await veVoteProxy.connect(user1).vote([sLP1.address, sLP2.address, vLP1.address, vLP2.address], [twoHundredAndFifty, twoHundredAndFifty, twoHundredAndFifty, twoHundredAndFifty]);
        let vote1 = await gaugeFactory.votes(user1.address, sLP1.address);
        let vote2 = await gaugeFactory.votes(user1.address, sLP2.address);
        let vote3 = await gaugeFactory.votes(user1.address, vLP1.address);
        let vote4 = await gaugeFactory.votes(user1.address, vLP2.address);

        console.log("User1 vote1", divDec(vote1));
        console.log("User1 vote2", divDec(vote2));
        console.log("User1 vote3", divDec(vote3));
        console.log("User1 vote4", divDec(vote4));

        expect(divDec(vote1)).to.be.greaterThan(0);
        expect(divDec(vote2)).to.be.greaterThan(0);
        expect(divDec(vote3)).to.be.greaterThan(0);
        expect(divDec(vote4)).to.be.greaterThan(0);

        console.log("User1 votes on variable gauge proxy with  500 on vLP1, 500 on vLP2");
        await veVoteProxy.connect(user2).vote([vLP1.address, vLP2.address], [fiveHundred, fiveHundred]);

        let vote5 = await gaugeFactory.votes(user2.address, sLP1.address);
        let vote6 = await gaugeFactory.votes(user2.address, sLP2.address);
        let vote7 = await gaugeFactory.votes(user2.address, vLP1.address);
        let vote8 = await gaugeFactory.votes(user2.address, vLP2.address);

        console.log("User2 vote1", divDec(vote5));
        console.log("User2 vote2", divDec(vote6));
        console.log("User2 vote3", divDec(vote7));
        console.log("User2 vote4", divDec(vote8));

        expect(divDec(vote5)).to.be.equal(0);
        expect(divDec(vote6)).to.be.equal(0);
        expect(divDec(vote7)).to.be.greaterThan(0);
        expect(divDec(vote8)).to.be.greaterThan(0);

        console.log("User1 votes on variable gauge proxy with  500 on sLP1, 250 on sLP2, 250 on vLP1");
        await veVoteProxy.connect(user3).vote([sLP1.address, sLP2.address, vLP1.address], [fiveHundred, twoHundredAndFifty, twoHundredAndFifty]);
        let vote9 = await gaugeFactory.votes(user3.address, sLP1.address);
        let vote10 = await gaugeFactory.votes(user3.address, sLP2.address);
        let vote11 = await gaugeFactory.votes(user3.address, vLP1.address);
        let vote12 = await gaugeFactory.votes(user3.address, vLP2.address);

        console.log("User3 vote1", divDec(vote9));
        console.log("User3 vote2", divDec(vote10));
        console.log("User3 vote3", divDec(vote11));
        console.log("User3 vote4", divDec(vote12));

        expect(divDec(vote9)).to.be.greaterThan(0);
        expect(divDec(vote10)).to.be.greaterThan(0);
        expect(divDec(vote11)).to.be.greaterThan(0);
        expect(divDec(vote12)).to.be.equal(0);

        console.log();
        console.log("******************************************************");
    });

    it('check vote => ROUND 0', async function () {
        console.log("******************************************************");
        console.log();

        let totalWeight = await gaugeFactory.totalWeight();
        let sLP1Weight = await gaugeFactory.weights(sLP1.address);
        let sLP2Weight = await gaugeFactory.weights(sLP2.address);
        let vLP1Weight = await gaugeFactory.weights(vLP1.address);
        let vLP2Weight = await gaugeFactory.weights(vLP2.address);

        let votesUser1 = await veSTABLE['balanceOf(address)'](user1.address);
        let votesUser2 = await veSTABLE['balanceOf(address)'](user2.address);
        let votesUser3 = await veSTABLE['balanceOf(address)'](user3.address);

        let vote1 = await gaugeFactory.votes(user1.address, sLP1.address);
        let vote2 = await gaugeFactory.votes(user1.address, sLP2.address);
        let vote3 = await gaugeFactory.votes(user1.address, vLP1.address);
        let vote4 = await gaugeFactory.votes(user1.address, vLP2.address);

        let vote5 = await gaugeFactory.votes(user2.address, sLP1.address);
        let vote6 = await gaugeFactory.votes(user2.address, sLP2.address);
        let vote7 = await gaugeFactory.votes(user2.address, vLP1.address);
        let vote8 = await gaugeFactory.votes(user2.address, vLP2.address);

        let vote9 = await gaugeFactory.votes(user3.address, sLP1.address);
        let vote10 = await gaugeFactory.votes(user3.address, sLP2.address);
        let vote11 = await gaugeFactory.votes(user3.address, vLP1.address);
        let vote12 = await gaugeFactory.votes(user3.address, vLP2.address);

        console.log("Expected Factory Status");
        let expectedVotesTotal = Number(votesUser1) + Number(votesUser2) + Number(votesUser3)
        console.log("expectedVotesTotal ", divDec(expectedVotesTotal));

        let expectedWeightTotal = Number(sLP1Weight) + Number(sLP2Weight) + Number(vLP1Weight) + Number(vLP2Weight)
        console.log("expectedWeightsTotal ", divDec(expectedWeightTotal));

        let expectedsLP1Total = Number(vote1) + Number(vote5) + Number(vote9)
        console.log("expectedsLP1Total ", divDec(expectedsLP1Total));

        let expectedsLP2Total = Number(vote2) + Number(vote6) + Number(vote10)
        console.log("expectedsLP2Total ", divDec(expectedsLP2Total));

        let expectedvLP1Total = Number(vote3) + Number(vote7) + Number(vote11)
        console.log("expectedvLP1Total ", divDec(expectedvLP1Total));

        let expectedvLP2Total = Number(vote4) + Number(vote8) + Number(vote12)
        console.log("expectedvLP2Total ", divDec(expectedvLP2Total));

        expect((divDec(totalWeight).toFixed(3))).to.be.equal((divDec(expectedVotesTotal).toFixed(3)));
        expect((divDec(totalWeight).toFixed(5))).to.be.equal((divDec(expectedWeightTotal).toFixed(5)));
        expect(divDec(sLP1Weight).toFixed(5)).to.be.equal(divDec(expectedsLP1Total).toFixed(5));
        expect(divDec(sLP2Weight).toFixed(5)).to.be.equal(divDec(expectedsLP2Total).toFixed(5));
        expect(divDec(vLP1Weight).toFixed(5)).to.be.equal(divDec(expectedvLP1Total).toFixed(5));
        expect(divDec(vLP2Weight).toFixed(5)).to.be.equal(divDec(expectedvLP2Total).toFixed(5));

        console.log();

        console.log("Gauge Factory Status");
        console.log("Total weight", divDec(totalWeight));
        console.log("sLP1 weight", divDec(sLP1Weight));
        console.log("sLP2 weight", divDec(sLP2Weight));
        console.log("vLP1 weight", divDec(vLP1Weight));
        console.log("vLP2 weight", divDec(vLP2Weight));
        console.log();
        console.log("******************************************************");
    });

    it('derivedBalance and derivedSupply => ROUND 0', async function () {
        console.log("******************************************************");
        console.log();
        let derivedSupplysLP1Gauge = await sLP1Gauge.derivedSupply();
        let derivedSupplysLP2Gauge = await sLP2Gauge.derivedSupply();
        let derivedSupplyvLP1Gauge = await vLP1Gauge.derivedSupply();
        let derivedSupplyvLP2Gauge = await vLP2Gauge.derivedSupply();
        expect(divDec(derivedSupplysLP1Gauge)).to.be.equal(0);
        expect(divDec(derivedSupplysLP2Gauge)).to.be.equal(0);
        expect(divDec(derivedSupplyvLP1Gauge)).to.be.equal(0);
        expect(divDec(derivedSupplyvLP2Gauge)).to.be.equal(0);

        let derivedBalanceUser1sLP1Gauge = await sLP1Gauge.derivedBalance(user1.address);
        let derivedBalanceUser2sLP1Gauge = await sLP1Gauge.derivedBalance(user2.address);
        let derivedBalanceUser3sLP1Gauge = await sLP1Gauge.derivedBalance(user3.address);
        expect(divDec(derivedBalanceUser1sLP1Gauge)).to.be.equal(0);
        expect(divDec(derivedBalanceUser2sLP1Gauge)).to.be.equal(0);
        expect(divDec(derivedBalanceUser3sLP1Gauge)).to.be.equal(0);

        let derivedBalanceUser1sLP2Gauge = await sLP2Gauge.derivedBalance(user1.address);
        let derivedBalanceUser2sLP2Gauge = await sLP2Gauge.derivedBalance(user2.address);
        let derivedBalanceUser3sLP2Gauge = await sLP2Gauge.derivedBalance(user3.address);
        expect(divDec(derivedBalanceUser1sLP2Gauge)).to.be.equal(0);
        expect(divDec(derivedBalanceUser2sLP2Gauge)).to.be.equal(0);
        expect(divDec(derivedBalanceUser3sLP2Gauge)).to.be.equal(0);

        let derivedBalanceUser1vLP1Gauge = await vLP1Gauge.derivedBalance(user1.address);
        let derivedBalanceUser2vLP1Gauge = await vLP1Gauge.derivedBalance(user2.address);
        let derivedBalanceUser3vLP1Gauge = await vLP1Gauge.derivedBalance(user3.address);
        expect(divDec(derivedBalanceUser1vLP1Gauge)).to.be.equal(0);
        expect(divDec(derivedBalanceUser2vLP1Gauge)).to.be.equal(0);
        expect(divDec(derivedBalanceUser3vLP1Gauge)).to.be.equal(0);

        let derivedBalanceUser1vLP2Gauge = await vLP2Gauge.derivedBalance(user1.address);
        let derivedBalanceUser2vLP2Gauge = await vLP2Gauge.derivedBalance(user2.address);
        let derivedBalanceUser3vLP2Gauge = await vLP2Gauge.derivedBalance(user3.address);
        expect(divDec(derivedBalanceUser1vLP2Gauge)).to.be.equal(0);
        expect(divDec(derivedBalanceUser2vLP2Gauge)).to.be.equal(0);
        expect(divDec(derivedBalanceUser3vLP2Gauge)).to.be.equal(0);

        console.log("total derivedSupply sLP1Gauge", divDec(derivedSupplysLP1Gauge));
        console.log("total derivedSupply sLP2Gauge", divDec(derivedSupplysLP2Gauge));
        console.log("total derivedSupply vLP1Gauge", divDec(derivedSupplyvLP1Gauge));
        console.log("total derivedSupply vLP2Gauge", divDec(derivedSupplyvLP2Gauge));
        console.log();
        console.log("derived balance user 1 sLP1Gauge", divDec(derivedBalanceUser1sLP1Gauge));
        console.log("derived balance user 2 sLP1Gauge", divDec(derivedBalanceUser2sLP1Gauge));
        console.log("derived balance user 3 sLP1Gauge", divDec(derivedBalanceUser3sLP1Gauge));
        console.log();
        console.log("derived balance user 1 sLP2Gauge", divDec(derivedBalanceUser1sLP2Gauge));
        console.log("derived balance user 2 sLP2Gauge", divDec(derivedBalanceUser2sLP2Gauge));
        console.log("derived balance user 3 sLP2Gauge", divDec(derivedBalanceUser3sLP2Gauge));
        console.log();
        console.log("derived balance user 1 vLP1Gauge", divDec(derivedBalanceUser1vLP1Gauge));
        console.log("derived balance user 2 vLP1Gauge", divDec(derivedBalanceUser2vLP1Gauge));
        console.log("derived balance user 3 vLP1Gauge", divDec(derivedBalanceUser3vLP1Gauge));
        console.log();
        console.log("derived balance user 1 vLP2Gauge", divDec(derivedBalanceUser1vLP2Gauge));
        console.log("derived balance user 2 vLP2Gauge", divDec(derivedBalanceUser2vLP2Gauge));
        console.log("derived balance user 3 vLP2Gauge", divDec(derivedBalanceUser3vLP2Gauge));
        console.log();
        console.log("******************************************************");
    });

    it('User get Gauge Rewards => ROUND 0', async function () {
        console.log("******************************************************");
        console.log();

        let usdfiGP = await STABLE.balanceOf(gaugeFactory.address);
        let usdfisLP1 = await STABLE.balanceOf(sLP1Gauge.address);
        let usdfisLP2 = await STABLE.balanceOf(sLP2Gauge.address);
        let usdfivLP1 = await STABLE.balanceOf(vLP1Gauge.address);
        let usdfivLP2 = await STABLE.balanceOf(vLP2Gauge.address);

        console.log("STABLE Balances")
        console.log("GaugeFactory", divDec(usdfiGP));
        console.log("sLP1Gauge", divDec(usdfisLP1));
        console.log("sLP2Gauge", divDec(usdfisLP2));
        console.log("vLP1Gauge", divDec(usdfivLP1));
        console.log("vLP2Gauge", divDec(usdfivLP2));

        console.log();

        console.log("balanceOf gauges")
        let user1sLP1Gauge = await sLP1Gauge.balanceOf(user1.address);
        let user1sLP2Gauge = await sLP2Gauge.balanceOf(user1.address);
        let user1vLP1Gauge = await vLP1Gauge.balanceOf(user1.address);
        let user1vLP2Gauge = await vLP2Gauge.balanceOf(user1.address);

        let user2sLP1Gauge = await sLP1Gauge.balanceOf(user2.address);
        let user2sLP2Gauge = await sLP2Gauge.balanceOf(user2.address);
        let user2vLP1Gauge = await vLP1Gauge.balanceOf(user2.address);
        let user2vLP2Gauge = await vLP2Gauge.balanceOf(user2.address);

        let user3sLP1Gauge = await sLP1Gauge.balanceOf(user3.address);
        let user3sLP2Gauge = await sLP2Gauge.balanceOf(user3.address);
        let user3vLP1Gauge = await vLP1Gauge.balanceOf(user3.address);
        let user3vLP2Gauge = await vLP2Gauge.balanceOf(user3.address);

        console.log("User1 sLP1 balance in sLP1Gauge", divDec(user1sLP1Gauge));
        console.log("User1 sLP2 balance in sLP2Gauge", divDec(user1sLP2Gauge));
        console.log("User1 vLP1 balance in vLP1Gauge", divDec(user1vLP1Gauge));
        console.log("User1 vLP2 balance in vLP2Gauge", divDec(user1vLP2Gauge));
        console.log();
        console.log("User2 sLP1 balance in sLP1Gauge", divDec(user2sLP1Gauge));
        console.log("User2 sLP2 balance in sLP2Gauge", divDec(user2sLP2Gauge));
        console.log("User2 vLP1 balance in vLP1Gauge", divDec(user2vLP1Gauge));
        console.log("User2 vLP2 balance in vLP2Gauge", divDec(user2vLP2Gauge));
        console.log();
        console.log("User3 sLP1 balance in sLP1Gauge", divDec(user3sLP1Gauge));
        console.log("User3 sLP2 balance in sLP2Gauge", divDec(user3sLP2Gauge));
        console.log("User3 vLP1 balance in vLP1Gauge", divDec(user3vLP1Gauge));
        console.log("User3 vLP2 balance in vLP2Gauge", divDec(user3vLP2Gauge));
        console.log();

        expect(divDec(user1sLP1Gauge)).to.be.equal(0);
        expect(divDec(user1sLP2Gauge)).to.be.equal(0);
        expect(divDec(user1vLP1Gauge)).to.be.equal(0);
        expect(divDec(user1vLP2Gauge)).to.be.equal(0);

        expect(divDec(user2sLP1Gauge)).to.be.equal(0);
        expect(divDec(user2sLP2Gauge)).to.be.equal(0);
        expect(divDec(user2vLP1Gauge)).to.be.equal(0);
        expect(divDec(user2vLP2Gauge)).to.be.equal(0);

        expect(divDec(user3sLP1Gauge)).to.be.equal(0);
        expect(divDec(user3sLP2Gauge)).to.be.equal(0);
        expect(divDec(user3vLP1Gauge)).to.be.equal(0);
        expect(divDec(user3vLP2Gauge)).to.be.equal(0);

        console.log("User earned in gauges")
        let user1EarnedsLP1Gauge = await sLP1Gauge.earned(user1.address);
        let user1EarnedsLP2Gauge = await sLP2Gauge.earned(user1.address);
        let user1EarnedvLP1Gauge = await vLP1Gauge.earned(user1.address);
        let user1EarnedvLP2Gauge = await vLP2Gauge.earned(user1.address);

        let user2EarnedsLP1Gauge = await sLP1Gauge.earned(user2.address);
        let user2EarnedsLP2Gauge = await sLP2Gauge.earned(user2.address);
        let user2EarnedvLP1Gauge = await vLP1Gauge.earned(user2.address);
        let user2EarnedvLP2Gauge = await vLP2Gauge.earned(user2.address);

        let user3EarnedsLP1Gauge = await sLP1Gauge.earned(user3.address);
        let user3EarnedsLP2Gauge = await sLP2Gauge.earned(user3.address);
        let user3EarnedvLP1Gauge = await vLP1Gauge.earned(user3.address);
        let user3EarnedvLP2Gauge = await vLP2Gauge.earned(user3.address);

        console.log("User1 STABLE earned in sLP1Gauge", divDec(user1EarnedsLP1Gauge));
        console.log("User1 STABLE earned in sLP2Gauge", divDec(user1EarnedsLP2Gauge));
        console.log("User1 STABLE earned in vLP1Gauge", divDec(user1EarnedvLP1Gauge));
        console.log("User1 STABLE earned in vLP2Gauge", divDec(user1EarnedvLP2Gauge));
        console.log();
        console.log("User2 STABLE earned in sLP1Gauge", divDec(user2EarnedsLP1Gauge));
        console.log("User2 STABLE earned in sLP2Gauge", divDec(user2EarnedsLP2Gauge));
        console.log("User2 STABLE earned in vLP1Gauge", divDec(user2EarnedvLP1Gauge));
        console.log("User2 STABLE earned in vLP2Gauge", divDec(user2EarnedvLP2Gauge));
        console.log();
        console.log("User3 STABLE earned in sLP1Gauge", divDec(user3EarnedsLP1Gauge));
        console.log("User3 STABLE earned in sLP2Gauge", divDec(user3EarnedsLP2Gauge));
        console.log("User3 STABLE earned in vLP1Gauge", divDec(user3EarnedvLP1Gauge));
        console.log("User3 STABLE earned in vLP2Gauge", divDec(user3EarnedvLP2Gauge));
        console.log();

        expect(divDec(user1EarnedsLP1Gauge)).to.be.equal(0);
        expect(divDec(user1EarnedsLP2Gauge)).to.be.equal(0);
        expect(divDec(user1EarnedvLP1Gauge)).to.be.equal(0);
        expect(divDec(user1EarnedvLP2Gauge)).to.be.equal(0);

        expect(divDec(user2EarnedsLP1Gauge)).to.be.equal(0);
        expect(divDec(user2EarnedsLP2Gauge)).to.be.equal(0);
        expect(divDec(user2EarnedvLP1Gauge)).to.be.equal(0);
        expect(divDec(user2EarnedvLP2Gauge)).to.be.equal(0);

        expect(divDec(user3EarnedsLP1Gauge)).to.be.equal(0);
        expect(divDec(user3EarnedsLP2Gauge)).to.be.equal(0);
        expect(divDec(user3EarnedvLP1Gauge)).to.be.equal(0);
        expect(divDec(user3EarnedvLP2Gauge)).to.be.equal(0);

        await sLP1Gauge.connect(user1).getReward();
        await sLP2Gauge.connect(user1).getReward();
        await vLP1Gauge.connect(user1).getReward();
        await vLP2Gauge.connect(user1).getReward();

        await sLP1Gauge.connect(user2).getReward();
        await sLP2Gauge.connect(user2).getReward();
        await vLP1Gauge.connect(user2).getReward();
        await vLP2Gauge.connect(user2).getReward();

        await sLP1Gauge.connect(user3).getReward();
        await sLP2Gauge.connect(user3).getReward();
        await vLP1Gauge.connect(user3).getReward();
        await vLP2Gauge.connect(user3).getReward();

        let stableUser1 = await STABLE.balanceOf(user1.address);
        let stableUser2 = await STABLE.balanceOf(user2.address);
        let stableUser3 = await STABLE.balanceOf(user3.address);

        console.log("User claim earned to address")
        console.log("User1 STABLE bal", divDec(stableUser1));
        console.log("User2 STABLE bal", divDec(stableUser2));
        console.log("User3 STABLE bal", divDec(stableUser3));

        expect(divDec(stableUser1)).to.be.equal(0);
        expect(divDec(stableUser2)).to.be.equal(0);
        expect(divDec(stableUser3)).to.be.equal(0);

        await STABLE.connect(user1).transfer(burn.address, stableUser1);
        await STABLE.connect(user2).transfer(burn.address, stableUser2);
        await STABLE.connect(user3).transfer(burn.address, stableUser3);
        console.log();
        console.log("User STABLE balances sent to brun address (reset)");
    });

    it('END => ROUND 0', async function () {
        await gaugeFactory.preDistribute();
        let usdfiGF = await STABLE.balanceOf(gaugeFactory.address);
        console.log("STABLE in Gauge Factory this Week", divDec(usdfiGF));
        await gaugeFactory.connect(user1).distribute(0, 4);
        await network.provider.send('evm_increaseTime', [oneWeek]);
        await network.provider.send('evm_mine');
        console.log();
        console.log("******************************************************************************************************************************************************************");
        console.log("******************************************************************************************************************************************************************");
        console.log();
    });

    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    it('User1 deposits LP in all gauges => ROUND 1', async function () {
        console.log("******************************************************");
        console.log();

        let user1sLP1bevor = await sLP1.balanceOf(user1.address);
        console.log("User1 sLP1 balance", divDec(user1sLP1bevor));

        let user1sLP2bevor = await sLP2.balanceOf(user1.address);
        console.log("User1 sLP2 balance", divDec(user1sLP2bevor));

        let user1vLP1bevor = await vLP1.balanceOf(user1.address);
        console.log("User1 vLP1 balance", divDec(user1vLP1bevor));

        let user1vLP2bevor = await vLP2.balanceOf(user1.address);
        console.log("User1 vLP2 balance", divDec(user1vLP2bevor));

        await sLP1.connect(user1).approve(sLP1Gauge.address, oneHundred);
        await sLP2.connect(user1).approve(sLP2Gauge.address, oneHundred);

        await vLP1.connect(user1).approve(vLP1Gauge.address, oneHundred);
        await vLP2.connect(user1).approve(vLP2Gauge.address, oneHundred);

        await sLP1Gauge.connect(user1).deposit(oneHundred);
        await sLP2Gauge.connect(user1).deposit(oneHundred);

        await vLP1Gauge.connect(user1).deposit(oneHundred);
        await vLP2Gauge.connect(user1).deposit(oneHundred);

        let user1sLP1Gauge = await sLP1Gauge.balanceOf(user1.address);
        let user1sLP2Gauge = await sLP2Gauge.balanceOf(user1.address);

        let user1vLP1Gauge = await vLP1Gauge.balanceOf(user1.address);
        let user1vLP2Gauge = await vLP2Gauge.balanceOf(user1.address);

        console.log("User1 sLP1 balance in sLP1Gauge", divDec(user1sLP1Gauge));
        console.log("User1 sLP2 balance in sLP2Gauge", divDec(user1sLP2Gauge));

        console.log("User1 vLP1 balance in vLP1Gauge", divDec(user1vLP1Gauge));
        console.log("User1 vLP2 balance in vLP2Gauge", divDec(user1vLP2Gauge));

        let user1sLP1after = await sLP1.balanceOf(user1.address);
        console.log("User1 sLP1 balance", divDec(user1sLP1after));

        let user1sLP2after = await sLP1.balanceOf(user1.address);
        console.log("User1 sLP2 balance", divDec(user1sLP2after));

        let user1vLP1after = await vLP1.balanceOf(user1.address);
        console.log("User1 vLP1 balance", divDec(user1vLP1after));

        let user1vLP2after = await vLP2.balanceOf(user1.address);
        console.log("User1 vLP2 balance", divDec(user1vLP2after));

        expect(await sLP1Gauge.balanceOf(user1.address)).to.be.equal(oneHundred);
        expect(await sLP2Gauge.balanceOf(user1.address)).to.be.equal(oneHundred);
        expect(await vLP1Gauge.balanceOf(user1.address)).to.be.equal(oneHundred);
        expect(await vLP2Gauge.balanceOf(user1.address)).to.be.equal(oneHundred);

        expect(await sLP1.balanceOf(user1.address)).to.be.equal(0);
        expect(await sLP2.balanceOf(user1.address)).to.be.equal(0);
        expect(await vLP1.balanceOf(user1.address)).to.be.equal(0);
        expect(await vLP2.balanceOf(user1.address)).to.be.equal(0);

        console.log();
        console.log("******************************************************");
    });

    it('User1 withdraw LP in all gauges => ROUND 1', async function () {
        console.log("******************************************************");
        console.log();

        let user1sLP1bevor = await sLP1.balanceOf(user1.address);
        console.log("User1 sLP1 balance", divDec(user1sLP1bevor));

        let user1sLP2bevor = await sLP2.balanceOf(user1.address);
        console.log("User1 sLP2 balance", divDec(user1sLP2bevor));

        let user1vLP1bevor = await vLP1.balanceOf(user1.address);
        console.log("User1 vLP1 balance", divDec(user1vLP1bevor));

        let user1vLP2bevor = await vLP2.balanceOf(user1.address);
        console.log("User1 vLP2 balance", divDec(user1vLP2bevor));

        await sLP1Gauge.connect(user1).withdraw(oneHundred);
        await sLP2Gauge.connect(user1).withdraw(oneHundred);

        await vLP1Gauge.connect(user1).withdraw(oneHundred);
        await vLP2Gauge.connect(user1).withdraw(oneHundred);

        let user1sLP1Gauge = await sLP1Gauge.balanceOf(user1.address);
        let user1sLP2Gauge = await sLP2Gauge.balanceOf(user1.address);

        let user1vLP1Gauge = await vLP1Gauge.balanceOf(user1.address);
        let user1vLP2Gauge = await vLP2Gauge.balanceOf(user1.address);

        console.log("User1 sLP1 balance in sLP1Gauge", divDec(user1sLP1Gauge));
        console.log("User1 sLP2 balance in sLP2Gauge", divDec(user1sLP2Gauge));

        console.log("User1 vLP1 balance in vLP1Gauge", divDec(user1vLP1Gauge));
        console.log("User1 vLP2 balance in vLP2Gauge", divDec(user1vLP2Gauge));

        let user1sLP1after = await sLP1.balanceOf(user1.address);
        console.log("User1 sLP1 balance", divDec(user1sLP1after));

        let user1sLP2after = await sLP1.balanceOf(user1.address);
        console.log("User1 sLP2 balance", divDec(user1sLP2after));

        let user1vLP1after = await vLP1.balanceOf(user1.address);
        console.log("User1 vLP1 balance", divDec(user1vLP1after));

        let user1vLP2after = await vLP2.balanceOf(user1.address);
        console.log("User1 vLP2 balance", divDec(user1vLP2after));

        expect(await sLP1Gauge.balanceOf(user1.address)).to.be.equal(0);
        expect(await sLP2Gauge.balanceOf(user1.address)).to.be.equal(0);
        expect(await vLP1Gauge.balanceOf(user1.address)).to.be.equal(0);
        expect(await vLP2Gauge.balanceOf(user1.address)).to.be.equal(0);

        expect(await sLP1.balanceOf(user1.address)).to.be.equal(oneHundred);
        expect(await sLP2.balanceOf(user1.address)).to.be.equal(oneHundred);
        expect(await vLP1.balanceOf(user1.address)).to.be.equal(oneHundred);
        expect(await vLP2.balanceOf(user1.address)).to.be.equal(oneHundred);

        console.log();
        console.log("******************************************************");
    });

    it('User1 deposits LP in all gauges => ROUND 1', async function () {
        console.log("******************************************************");
        console.log();

        let user1sLP1bevor = await sLP1.balanceOf(user1.address);
        console.log("User1 sLP1 balance", divDec(user1sLP1bevor));

        let user1sLP2bevor = await sLP2.balanceOf(user1.address);
        console.log("User1 sLP2 balance", divDec(user1sLP2bevor));

        let user1vLP1bevor = await vLP1.balanceOf(user1.address);
        console.log("User1 vLP1 balance", divDec(user1vLP1bevor));

        let user1vLP2bevor = await vLP2.balanceOf(user1.address);
        console.log("User1 vLP2 balance", divDec(user1vLP2bevor));

        await sLP1.connect(user1).approve(sLP1Gauge.address, oneHundred);
        await sLP2.connect(user1).approve(sLP2Gauge.address, oneHundred);

        await vLP1.connect(user1).approve(vLP1Gauge.address, oneHundred);
        await vLP2.connect(user1).approve(vLP2Gauge.address, oneHundred);

        await sLP1Gauge.connect(user1).deposit(oneHundred);
        await sLP2Gauge.connect(user1).deposit(oneHundred);

        await vLP1Gauge.connect(user1).deposit(oneHundred);
        await vLP2Gauge.connect(user1).deposit(oneHundred);

        let user1sLP1Gauge = await sLP1Gauge.balanceOf(user1.address);
        let user1sLP2Gauge = await sLP2Gauge.balanceOf(user1.address);

        let user1vLP1Gauge = await vLP1Gauge.balanceOf(user1.address);
        let user1vLP2Gauge = await vLP2Gauge.balanceOf(user1.address);

        console.log("User1 sLP1 balance in sLP1Gauge", divDec(user1sLP1Gauge));
        console.log("User1 sLP2 balance in sLP2Gauge", divDec(user1sLP2Gauge));

        console.log("User1 vLP1 balance in vLP1Gauge", divDec(user1vLP1Gauge));
        console.log("User1 vLP2 balance in vLP2Gauge", divDec(user1vLP2Gauge));

        let user1sLP1after = await sLP1.balanceOf(user1.address);
        console.log("User1 sLP1 balance", divDec(user1sLP1after));

        let user1sLP2after = await sLP1.balanceOf(user1.address);
        console.log("User1 sLP2 balance", divDec(user1sLP2after));

        let user1vLP1after = await vLP1.balanceOf(user1.address);
        console.log("User1 vLP1 balance", divDec(user1vLP1after));

        let user1vLP2after = await vLP2.balanceOf(user1.address);
        console.log("User1 vLP2 balance", divDec(user1vLP2after));

        expect(await sLP1Gauge.balanceOf(user1.address)).to.be.equal(oneHundred);
        expect(await sLP2Gauge.balanceOf(user1.address)).to.be.equal(oneHundred);
        expect(await vLP1Gauge.balanceOf(user1.address)).to.be.equal(oneHundred);
        expect(await vLP2Gauge.balanceOf(user1.address)).to.be.equal(oneHundred);

        expect(await sLP1.balanceOf(user1.address)).to.be.equal(0);
        expect(await sLP2.balanceOf(user1.address)).to.be.equal(0);
        expect(await vLP1.balanceOf(user1.address)).to.be.equal(0);
        expect(await vLP2.balanceOf(user1.address)).to.be.equal(0);

        console.log();
        console.log("******************************************************");
    });

    it('User2 deposits LP in all gauges => ROUND 1', async function () {
        console.log("******************************************************");
        console.log();

        let user2sLP1bevor = await sLP1.balanceOf(user2.address);
        console.log("User2 sLP1 balance", divDec(user2sLP1bevor));

        let user2sLP2bevor = await sLP2.balanceOf(user2.address);
        console.log("User2 sLP2 balance", divDec(user2sLP2bevor));

        let user2vLP1bevor = await vLP1.balanceOf(user2.address);
        console.log("User2 vLP1 balance", divDec(user2vLP1bevor));

        let user2vLP2bevor = await vLP2.balanceOf(user2.address);
        console.log("User1 vLP2 balance", divDec(user2vLP2bevor));

        await sLP1.connect(user2).approve(sLP1Gauge.address, oneHundred);
        await sLP2.connect(user2).approve(sLP2Gauge.address, oneHundred);

        await vLP1.connect(user2).approve(vLP1Gauge.address, oneHundred);
        await vLP2.connect(user2).approve(vLP2Gauge.address, oneHundred);

        await sLP1Gauge.connect(user2).deposit(oneHundred);
        await sLP2Gauge.connect(user2).deposit(oneHundred);

        await vLP1Gauge.connect(user2).deposit(oneHundred);
        await vLP2Gauge.connect(user2).deposit(oneHundred);

        let user2sLP1Gauge = await sLP1Gauge.balanceOf(user2.address);
        let user2sLP2Gauge = await sLP2Gauge.balanceOf(user2.address);

        let user2vLP1Gauge = await vLP1Gauge.balanceOf(user2.address);
        let user2vLP2Gauge = await vLP2Gauge.balanceOf(user2.address);

        console.log("User2 sLP1 balance in sLP1Gauge", divDec(user2sLP1Gauge));
        console.log("User2 sLP2 balance in sLP2Gauge", divDec(user2sLP2Gauge));

        console.log("User2 vLP1 balance in vLP1Gauge", divDec(user2vLP1Gauge));
        console.log("User2 vLP2 balance in vLP2Gauge", divDec(user2vLP2Gauge));

        let user2sLP1after = await sLP1.balanceOf(user2.address);
        console.log("User2 sLP1 balance", divDec(user2sLP1after));

        let user2sLP2after = await sLP1.balanceOf(user2.address);
        console.log("User2 sLP2 balance", divDec(user2sLP2after));

        let user2vLP1after = await vLP1.balanceOf(user2.address);
        console.log("User2 vLP1 balance", divDec(user2vLP1after));

        let user2vLP2after = await vLP2.balanceOf(user2.address);
        console.log("User2 vLP2 balance", divDec(user2vLP2after));

        expect(await sLP1Gauge.balanceOf(user2.address)).to.be.equal(oneHundred);
        expect(await sLP2Gauge.balanceOf(user2.address)).to.be.equal(oneHundred);
        expect(await vLP1Gauge.balanceOf(user2.address)).to.be.equal(oneHundred);
        expect(await vLP2Gauge.balanceOf(user2.address)).to.be.equal(oneHundred);

        expect(await sLP1.balanceOf(user2.address)).to.be.equal(0);
        expect(await sLP2.balanceOf(user2.address)).to.be.equal(0);
        expect(await vLP1.balanceOf(user2.address)).to.be.equal(0);
        expect(await vLP2.balanceOf(user2.address)).to.be.equal(0);

        console.log();
        console.log("******************************************************");
    });

    it('User3 deposits LP in all gauges => ROUND 1', async function () {
        console.log("******************************************************");
        console.log();

        let user3sLP1bevor = await sLP1.balanceOf(user3.address);
        console.log("User3 sLP1 balance", divDec(user3sLP1bevor));

        let user3sLP2bevor = await sLP2.balanceOf(user3.address);
        console.log("User3 sLP2 balance", divDec(user3sLP2bevor));

        let user3vLP1bevor = await vLP1.balanceOf(user3.address);
        console.log("User3 vLP1 balance", divDec(user3vLP1bevor));

        let user3vLP2bevor = await vLP2.balanceOf(user3.address);
        console.log("User3 vLP2 balance", divDec(user3vLP2bevor));

        await sLP1.connect(user3).approve(sLP1Gauge.address, oneHundred);
        await sLP2.connect(user3).approve(sLP2Gauge.address, oneHundred);

        await vLP1.connect(user3).approve(vLP1Gauge.address, oneHundred);
        await vLP2.connect(user3).approve(vLP2Gauge.address, oneHundred);

        await sLP1Gauge.connect(user3).deposit(oneHundred);
        await sLP2Gauge.connect(user3).deposit(oneHundred);

        await vLP1Gauge.connect(user3).deposit(oneHundred);
        await vLP2Gauge.connect(user3).deposit(oneHundred);

        let user3sLP1Gauge = await sLP1Gauge.balanceOf(user3.address);
        let user3sLP2Gauge = await sLP2Gauge.balanceOf(user3.address);

        let user3vLP1Gauge = await vLP1Gauge.balanceOf(user3.address);
        let user3vLP2Gauge = await vLP2Gauge.balanceOf(user3.address);

        console.log("User3 sLP1 balance in sLP1Gauge", divDec(user3sLP1Gauge));
        console.log("User3 sLP2 balance in sLP2Gauge", divDec(user3sLP2Gauge));

        console.log("User3 vLP1 balance in vLP1Gauge", divDec(user3vLP1Gauge));
        console.log("User3 vLP2 balance in vLP2Gauge", divDec(user3vLP2Gauge));

        let user3sLP1after = await sLP1.balanceOf(user3.address);
        console.log("User3 sLP1 balance", divDec(user3sLP1after));

        let user3sLP2after = await sLP1.balanceOf(user3.address);
        console.log("User3 sLP2 balance", divDec(user3sLP2after));

        let user3vLP1after = await vLP1.balanceOf(user3.address);
        console.log("User3 vLP1 balance", divDec(user3vLP1after));

        let user3vLP2after = await vLP2.balanceOf(user3.address);
        console.log("User3 vLP2 balance", divDec(user3vLP2after));

        expect(await sLP1Gauge.balanceOf(user3.address)).to.be.equal(oneHundred);
        expect(await sLP2Gauge.balanceOf(user3.address)).to.be.equal(oneHundred);
        expect(await vLP1Gauge.balanceOf(user3.address)).to.be.equal(oneHundred);
        expect(await vLP2Gauge.balanceOf(user3.address)).to.be.equal(oneHundred);

        expect(await sLP1.balanceOf(user3.address)).to.be.equal(0);
        expect(await sLP2.balanceOf(user3.address)).to.be.equal(0);
        expect(await vLP1.balanceOf(user3.address)).to.be.equal(0);
        expect(await vLP2.balanceOf(user3.address)).to.be.equal(0);

        console.log();
        console.log("******************************************************");
    });

    it('Users votes on gauges via proxie => ROUND 1', async function () {
        console.log("******************************************************");
        console.log();

        console.log("User1 votes on variable gauge proxy with  500 on sLP1, 500 on vLP2");
        await veVoteProxy.connect(user1).vote([sLP1.address, vLP2.address], [fiveHundred, fiveHundred]);
        let vote1 = await gaugeFactory.votes(user1.address, sLP1.address);
        let vote2 = await gaugeFactory.votes(user1.address, sLP2.address);
        let vote3 = await gaugeFactory.votes(user1.address, vLP1.address);
        let vote4 = await gaugeFactory.votes(user1.address, vLP2.address);

        console.log("User1 vote1", divDec(vote1));
        console.log("User1 vote2", divDec(vote2));
        console.log("User1 vote3", divDec(vote3));
        console.log("User1 vote4", divDec(vote4));

        expect(divDec(vote1)).to.be.greaterThan(0);
        expect(divDec(vote2)).to.be.equal(0);
        expect(divDec(vote3)).to.be.equal(0);
        expect(divDec(vote4)).to.be.greaterThan(0);

        console.log("User2 votes on variable gauge proxy with  500 on vLP1, 500 on vLP2");
        await veVoteProxy.connect(user2).vote([vLP1.address, vLP2.address], [fiveHundred, fiveHundred]);

        let vote5 = await gaugeFactory.votes(user2.address, sLP1.address);
        let vote6 = await gaugeFactory.votes(user2.address, sLP2.address);
        let vote7 = await gaugeFactory.votes(user2.address, vLP1.address);
        let vote8 = await gaugeFactory.votes(user2.address, vLP2.address);

        console.log("User2 vote1", divDec(vote5));
        console.log("User2 vote2", divDec(vote6));
        console.log("User2 vote3", divDec(vote7));
        console.log("User2 vote4", divDec(vote8));

        expect(divDec(vote5)).to.be.equal(0);
        expect(divDec(vote6)).to.be.equal(0);
        expect(divDec(vote7)).to.be.greaterThan(0);
        expect(divDec(vote8)).to.be.greaterThan(0);

        console.log("User3 votes on variable gauge proxy with  500 on sLP1, 250 on sLP2, 250 on vLP1");
        await veVoteProxy.connect(user3).vote([sLP1.address, sLP2.address, vLP1.address], [fiveHundred, twoHundredAndFifty, twoHundredAndFifty]);
        let vote9 = await gaugeFactory.votes(user3.address, sLP1.address);
        let vote10 = await gaugeFactory.votes(user3.address, sLP2.address);
        let vote11 = await gaugeFactory.votes(user3.address, vLP1.address);
        let vote12 = await gaugeFactory.votes(user3.address, vLP2.address);

        console.log("User3 vote1", divDec(vote9));
        console.log("User3 vote2", divDec(vote10));
        console.log("User3 vote3", divDec(vote11));
        console.log("User3 vote4", divDec(vote12));

        expect(divDec(vote9)).to.be.greaterThan(0);
        expect(divDec(vote10)).to.be.greaterThan(0);
        expect(divDec(vote11)).to.be.greaterThan(0);
        expect(divDec(vote12)).to.be.equal(0);

        console.log();
        console.log("******************************************************");
    });

    it('User3 revote', async function () {
        console.log("******************************************************");
        await expect(veVoteProxy.connect(user3).vote([sLP1.address, sLP2.address, vLP1.address], [fiveHundred, twoHundredAndFifty, twoHundredAndFifty])).to.be.revertedWith("You voted this epoch");
        console.log("user3 was not able to revote within 7 days of last vote");
    });

    it('check vote => ROUND 1', async function () {
        console.log("******************************************************");
        console.log();

        let totalWeight = await gaugeFactory.totalWeight();
        let sLP1Weight = await gaugeFactory.weights(sLP1.address);
        let sLP2Weight = await gaugeFactory.weights(sLP2.address);
        let vLP1Weight = await gaugeFactory.weights(vLP1.address);
        let vLP2Weight = await gaugeFactory.weights(vLP2.address);

        let votesUser1 = await veSTABLE['balanceOf(address)'](user1.address);
        let votesUser2 = await veSTABLE['balanceOf(address)'](user2.address);
        let votesUser3 = await veSTABLE['balanceOf(address)'](user3.address);

        let vote1 = await gaugeFactory.votes(user1.address, sLP1.address);
        let vote2 = await gaugeFactory.votes(user1.address, sLP2.address);
        let vote3 = await gaugeFactory.votes(user1.address, vLP1.address);
        let vote4 = await gaugeFactory.votes(user1.address, vLP2.address);

        let vote5 = await gaugeFactory.votes(user2.address, sLP1.address);
        let vote6 = await gaugeFactory.votes(user2.address, sLP2.address);
        let vote7 = await gaugeFactory.votes(user2.address, vLP1.address);
        let vote8 = await gaugeFactory.votes(user2.address, vLP2.address);

        let vote9 = await gaugeFactory.votes(user3.address, sLP1.address);
        let vote10 = await gaugeFactory.votes(user3.address, sLP2.address);
        let vote11 = await gaugeFactory.votes(user3.address, vLP1.address);
        let vote12 = await gaugeFactory.votes(user3.address, vLP2.address);

        console.log("Expected Factory Status");
        let expectedVotesTotal = Number(votesUser1) + Number(votesUser2) + Number(votesUser3)
        console.log("expectedVotesTotal ", divDec(expectedVotesTotal));

        let expectedWeightTotal = Number(sLP1Weight) + Number(sLP2Weight) + Number(vLP1Weight) + Number(vLP2Weight)
        console.log("expectedWeightsTotal ", divDec(expectedWeightTotal));

        let expectedsLP1Total = Number(vote1) + Number(vote5) + Number(vote9)
        console.log("expectedsLP1Total ", divDec(expectedsLP1Total));

        let expectedsLP2Total = Number(vote2) + Number(vote6) + Number(vote10)
        console.log("expectedsLP2Total ", divDec(expectedsLP2Total));

        let expectedvLP1Total = Number(vote3) + Number(vote7) + Number(vote11)
        console.log("expectedvLP1Total ", divDec(expectedvLP1Total));

        let expectedvLP2Total = Number(vote4) + Number(vote8) + Number(vote12)
        console.log("expectedvLP2Total ", divDec(expectedvLP2Total));

        expect((divDec(totalWeight).toFixed(3))).to.be.equal((divDec(expectedVotesTotal).toFixed(3)));
        expect((divDec(totalWeight).toFixed(5))).to.be.equal((divDec(expectedWeightTotal).toFixed(5)));
        expect(divDec(sLP1Weight).toFixed(5)).to.be.equal(divDec(expectedsLP1Total).toFixed(5));
        expect(divDec(sLP2Weight).toFixed(5)).to.be.equal(divDec(expectedsLP2Total).toFixed(5));
        expect(divDec(vLP1Weight).toFixed(5)).to.be.equal(divDec(expectedvLP1Total).toFixed(5));
        expect(divDec(vLP2Weight).toFixed(5)).to.be.equal(divDec(expectedvLP2Total).toFixed(5));

        console.log();
        console.log("Gauge Factory Status");
        console.log("Total weight", divDec(totalWeight));
        console.log("sLP1 weight", divDec(sLP1Weight));
        console.log("sLP2 weight", divDec(sLP2Weight));
        console.log("vLP1 weight", divDec(vLP1Weight));
        console.log("vLP2 weight", divDec(vLP2Weight));
        console.log();
        console.log("******************************************************");
    });

    it('Forward time by 1 week', async function () {
        console.log();
        console.log("******************************************************");
        console.log();
        await gaugeFactory.preDistribute();
        let usdfiGF = await STABLE.balanceOf(gaugeFactory.address);
        console.log("STABLE in Gauge Factory this Week", divDec(usdfiGF));
        await gaugeFactory.connect(user1).distribute(0, 4);
        await network.provider.send('evm_increaseTime', [oneWeek]);
        await network.provider.send('evm_mine');
        console.log();
        console.log("******************************************************");
    });

    it('derivedBalance and derivedSupply => ROUND 1', async function () {
        console.log("******************************************************");
        console.log();
        let derivedSupplysLP1Gauge = await sLP1Gauge.derivedSupply();
        let derivedSupplysLP2Gauge = await sLP2Gauge.derivedSupply();
        let derivedSupplyvLP1Gauge = await vLP1Gauge.derivedSupply();
        let derivedSupplyvLP2Gauge = await vLP2Gauge.derivedSupply();
        expect(divDec(derivedSupplysLP1Gauge)).to.be.greaterThan(0);
        expect(divDec(derivedSupplysLP2Gauge)).to.be.greaterThan(0);
        expect(divDec(derivedSupplyvLP1Gauge)).to.be.greaterThan(0);
        expect(divDec(derivedSupplyvLP2Gauge)).to.be.greaterThan(0);

        let derivedBalanceUser1sLP1Gauge = await sLP1Gauge.derivedBalance(user1.address);
        let derivedBalanceUser2sLP1Gauge = await sLP1Gauge.derivedBalance(user2.address);
        let derivedBalanceUser3sLP1Gauge = await sLP1Gauge.derivedBalance(user3.address);
        expect(divDec(derivedBalanceUser1sLP1Gauge)).to.be.greaterThan(0);
        expect(divDec(derivedBalanceUser2sLP1Gauge)).to.be.greaterThan(0);
        expect(divDec(derivedBalanceUser3sLP1Gauge)).to.be.greaterThan(0);

        let derivedBalanceUser1sLP2Gauge = await sLP2Gauge.derivedBalance(user1.address);
        let derivedBalanceUser2sLP2Gauge = await sLP2Gauge.derivedBalance(user2.address);
        let derivedBalanceUser3sLP2Gauge = await sLP2Gauge.derivedBalance(user3.address);
        expect(divDec(derivedBalanceUser1sLP2Gauge)).to.be.greaterThan(0);
        expect(divDec(derivedBalanceUser2sLP2Gauge)).to.be.greaterThan(0);
        expect(divDec(derivedBalanceUser3sLP2Gauge)).to.be.greaterThan(0);

        let derivedBalanceUser1vLP1Gauge = await vLP1Gauge.derivedBalance(user1.address);
        let derivedBalanceUser2vLP1Gauge = await vLP1Gauge.derivedBalance(user2.address);
        let derivedBalanceUser3vLP1Gauge = await vLP1Gauge.derivedBalance(user3.address);
        expect(divDec(derivedBalanceUser1vLP1Gauge)).to.be.greaterThan(0);
        expect(divDec(derivedBalanceUser2vLP1Gauge)).to.be.greaterThan(0);
        expect(divDec(derivedBalanceUser3vLP1Gauge)).to.be.greaterThan(0);

        let derivedBalanceUser1vLP2Gauge = await vLP2Gauge.derivedBalance(user1.address);
        let derivedBalanceUser2vLP2Gauge = await vLP2Gauge.derivedBalance(user2.address);
        let derivedBalanceUser3vLP2Gauge = await vLP2Gauge.derivedBalance(user3.address);
        expect(divDec(derivedBalanceUser1vLP2Gauge)).to.be.greaterThan(0);
        expect(divDec(derivedBalanceUser2vLP2Gauge)).to.be.greaterThan(0);
        expect(divDec(derivedBalanceUser3vLP2Gauge)).to.be.greaterThan(0);

        console.log("total derivedSupply sLP1Gauge", divDec(derivedSupplysLP1Gauge));
        console.log("total derivedSupply sLP2Gauge", divDec(derivedSupplysLP2Gauge));
        console.log("total derivedSupply vLP1Gauge", divDec(derivedSupplyvLP1Gauge));
        console.log("total derivedSupply vLP2Gauge", divDec(derivedSupplyvLP2Gauge));
        console.log();
        console.log("derived balance user 1 sLP1Gauge", divDec(derivedBalanceUser1sLP1Gauge));
        console.log("derived balance user 2 sLP1Gauge", divDec(derivedBalanceUser2sLP1Gauge));
        console.log("derived balance user 3 sLP1Gauge", divDec(derivedBalanceUser3sLP1Gauge));
        console.log();
        console.log("derived balance user 1 sLP2Gauge", divDec(derivedBalanceUser1sLP2Gauge));
        console.log("derived balance user 2 sLP2Gauge", divDec(derivedBalanceUser2sLP2Gauge));
        console.log("derived balance user 3 sLP2Gauge", divDec(derivedBalanceUser3sLP2Gauge));
        console.log();
        console.log("derived balance user 1 vLP1Gauge", divDec(derivedBalanceUser1vLP1Gauge));
        console.log("derived balance user 2 vLP1Gauge", divDec(derivedBalanceUser2vLP1Gauge));
        console.log("derived balance user 3 vLP1Gauge", divDec(derivedBalanceUser3vLP1Gauge));
        console.log();
        console.log("derived balance user 1 vLP2Gauge", divDec(derivedBalanceUser1vLP2Gauge));
        console.log("derived balance user 2 vLP2Gauge", divDec(derivedBalanceUser2vLP2Gauge));
        console.log("derived balance user 3 vLP2Gauge", divDec(derivedBalanceUser3vLP2Gauge));
        console.log();
        console.log("******************************************************");
    });

    it('User get Gauge Rewards => ROUND 1', async function () {
        console.log("******************************************************");
        console.log();

        let usdfiGP = await STABLE.balanceOf(gaugeFactory.address);
        let usdfisLP1 = await STABLE.balanceOf(sLP1Gauge.address);
        let usdfisLP2 = await STABLE.balanceOf(sLP2Gauge.address);
        let usdfivLP1 = await STABLE.balanceOf(vLP1Gauge.address);
        let usdfivLP2 = await STABLE.balanceOf(vLP2Gauge.address);

        console.log("STABLE Balances")
        console.log("GaugeFactory", divDec(usdfiGP));
        console.log("sLP1Gauge", divDec(usdfisLP1));
        console.log("sLP2Gauge", divDec(usdfisLP2));
        console.log("vLP1Gauge", divDec(usdfivLP1));
        console.log("vLP2Gauge", divDec(usdfivLP2));

        console.log();

        console.log("balanceOf gauges")
        let user1sLP1Gauge = await sLP1Gauge.balanceOf(user1.address);
        let user1sLP2Gauge = await sLP2Gauge.balanceOf(user1.address);
        let user1vLP1Gauge = await vLP1Gauge.balanceOf(user1.address);
        let user1vLP2Gauge = await vLP2Gauge.balanceOf(user1.address);

        let user2sLP1Gauge = await sLP1Gauge.balanceOf(user2.address);
        let user2sLP2Gauge = await sLP2Gauge.balanceOf(user2.address);
        let user2vLP1Gauge = await vLP1Gauge.balanceOf(user2.address);
        let user2vLP2Gauge = await vLP2Gauge.balanceOf(user2.address);

        let user3sLP1Gauge = await sLP1Gauge.balanceOf(user3.address);
        let user3sLP2Gauge = await sLP2Gauge.balanceOf(user3.address);
        let user3vLP1Gauge = await vLP1Gauge.balanceOf(user3.address);
        let user3vLP2Gauge = await vLP2Gauge.balanceOf(user3.address);

        console.log("User1 sLP1 balance in sLP1Gauge", divDec(user1sLP1Gauge));
        console.log("User1 sLP2 balance in sLP2Gauge", divDec(user1sLP2Gauge));
        console.log("User1 vLP1 balance in vLP1Gauge", divDec(user1vLP1Gauge));
        console.log("User1 vLP2 balance in vLP2Gauge", divDec(user1vLP2Gauge));
        console.log();
        console.log("User2 sLP1 balance in sLP1Gauge", divDec(user2sLP1Gauge));
        console.log("User2 sLP2 balance in sLP2Gauge", divDec(user2sLP2Gauge));
        console.log("User2 vLP1 balance in vLP1Gauge", divDec(user2vLP1Gauge));
        console.log("User2 vLP2 balance in vLP2Gauge", divDec(user2vLP2Gauge));
        console.log();
        console.log("User3 sLP1 balance in sLP1Gauge", divDec(user3sLP1Gauge));
        console.log("User3 sLP2 balance in sLP2Gauge", divDec(user3sLP2Gauge));
        console.log("User3 vLP1 balance in vLP1Gauge", divDec(user3vLP1Gauge));
        console.log("User3 vLP2 balance in vLP2Gauge", divDec(user3vLP2Gauge));
        console.log();

        expect(divDec(user1sLP1Gauge)).to.be.greaterThan(0);
        expect(divDec(user1sLP2Gauge)).to.be.greaterThan(0);
        expect(divDec(user1vLP1Gauge)).to.be.greaterThan(0);
        expect(divDec(user1vLP2Gauge)).to.be.greaterThan(0);

        expect(divDec(user2sLP1Gauge)).to.be.greaterThan(0);
        expect(divDec(user2sLP2Gauge)).to.be.greaterThan(0);
        expect(divDec(user2vLP1Gauge)).to.be.greaterThan(0);
        expect(divDec(user2vLP2Gauge)).to.be.greaterThan(0);

        expect(divDec(user3sLP1Gauge)).to.be.greaterThan(0);
        expect(divDec(user3sLP2Gauge)).to.be.greaterThan(0);
        expect(divDec(user3vLP1Gauge)).to.be.greaterThan(0);
        expect(divDec(user3vLP2Gauge)).to.be.greaterThan(0);

        console.log("User earned in gauges")
        let user1EarnedsLP1Gauge = await sLP1Gauge.earned(user1.address);
        let user1EarnedsLP2Gauge = await sLP2Gauge.earned(user1.address);
        let user1EarnedvLP1Gauge = await vLP1Gauge.earned(user1.address);
        let user1EarnedvLP2Gauge = await vLP2Gauge.earned(user1.address);

        let user2EarnedsLP1Gauge = await sLP1Gauge.earned(user2.address);
        let user2EarnedsLP2Gauge = await sLP2Gauge.earned(user2.address);
        let user2EarnedvLP1Gauge = await vLP1Gauge.earned(user2.address);
        let user2EarnedvLP2Gauge = await vLP2Gauge.earned(user2.address);

        let user3EarnedsLP1Gauge = await sLP1Gauge.earned(user3.address);
        let user3EarnedsLP2Gauge = await sLP2Gauge.earned(user3.address);
        let user3EarnedvLP1Gauge = await vLP1Gauge.earned(user3.address);
        let user3EarnedvLP2Gauge = await vLP2Gauge.earned(user3.address);

        console.log("User1 STABLE earned in sLP1Gauge", divDec(user1EarnedsLP1Gauge));
        console.log("User1 STABLE earned in sLP2Gauge", divDec(user1EarnedsLP2Gauge));
        console.log("User1 STABLE earned in vLP1Gauge", divDec(user1EarnedvLP1Gauge));
        console.log("User1 STABLE earned in vLP2Gauge", divDec(user1EarnedvLP2Gauge));
        console.log();
        console.log("User2 STABLE earned in sLP1Gauge", divDec(user2EarnedsLP1Gauge));
        console.log("User2 STABLE earned in sLP2Gauge", divDec(user2EarnedsLP2Gauge));
        console.log("User2 STABLE earned in vLP1Gauge", divDec(user2EarnedvLP1Gauge));
        console.log("User2 STABLE earned in vLP2Gauge", divDec(user2EarnedvLP2Gauge));
        console.log();
        console.log("User3 STABLE earned in sLP1Gauge", divDec(user3EarnedsLP1Gauge));
        console.log("User3 STABLE earned in sLP2Gauge", divDec(user3EarnedsLP2Gauge));
        console.log("User3 STABLE earned in vLP1Gauge", divDec(user3EarnedvLP1Gauge));
        console.log("User3 STABLE earned in vLP2Gauge", divDec(user3EarnedvLP2Gauge));
        console.log();

        expect(divDec(user1EarnedsLP1Gauge)).to.be.greaterThan(0);
        expect(divDec(user1EarnedsLP2Gauge)).to.be.greaterThan(0);
        expect(divDec(user1EarnedvLP1Gauge)).to.be.greaterThan(0);
        expect(divDec(user1EarnedvLP2Gauge)).to.be.greaterThan(0);

        expect(divDec(user2EarnedsLP1Gauge)).to.be.greaterThan(0);
        expect(divDec(user2EarnedsLP2Gauge)).to.be.greaterThan(0);
        expect(divDec(user2EarnedvLP1Gauge)).to.be.greaterThan(0);
        expect(divDec(user2EarnedvLP2Gauge)).to.be.greaterThan(0);

        expect(divDec(user3EarnedsLP1Gauge)).to.be.greaterThan(0);
        expect(divDec(user3EarnedsLP2Gauge)).to.be.greaterThan(0);
        expect(divDec(user3EarnedvLP1Gauge)).to.be.greaterThan(0);
        expect(divDec(user3EarnedvLP2Gauge)).to.be.greaterThan(0);

        await sLP1Gauge.connect(user1).getReward();
        await sLP2Gauge.connect(user1).getReward();
        await vLP1Gauge.connect(user1).getReward();
        await vLP2Gauge.connect(user1).getReward();

        await sLP1Gauge.connect(user2).getReward();
        await sLP2Gauge.connect(user2).getReward();
        await vLP1Gauge.connect(user2).getReward();
        await vLP2Gauge.connect(user2).getReward();

        await sLP1Gauge.connect(user3).getReward();
        await sLP2Gauge.connect(user3).getReward();
        await vLP1Gauge.connect(user3).getReward();
        await vLP2Gauge.connect(user3).getReward();

        let stableUser1 = await STABLE.balanceOf(user1.address);
        let stableUser2 = await STABLE.balanceOf(user2.address);
        let stableUser3 = await STABLE.balanceOf(user3.address);

        console.log("User claim earned to address")
        console.log("User1 STABLE bal", divDec(stableUser1));
        console.log("User2 STABLE bal", divDec(stableUser2));
        console.log("User3 STABLE bal", divDec(stableUser3));

        expect(divDec(stableUser1)).to.be.greaterThan(0);
        expect(divDec(stableUser2)).to.be.greaterThan(0);
        expect(divDec(stableUser3)).to.be.greaterThan(0);

        await STABLE.connect(user1).transfer(burn.address, stableUser1);
        await STABLE.connect(user2).transfer(burn.address, stableUser2);
        await STABLE.connect(user3).transfer(burn.address, stableUser3);
        console.log();
        console.log("User STABLE balances sent to brun address (reset)");
        console.log();
        console.log("******************************************************");
    });

    it('Testing Voting Weight and Bribe balances', async function () {
        console.log("******************************************************");
        console.log();
        let sLP1VoteWeight = await gaugeFactory.weights(sLP1.address);
        let sLP2VoteWeight = await gaugeFactory.weights(sLP2.address);
        let vLP1VoteWeight = await gaugeFactory.weights(vLP1.address);
        let vLP2VoteWeight = await gaugeFactory.weights(vLP2.address);

        let sLP1BribeTotalBal = await sLP1Bribe.totalSupply();
        let sLP2BribeTotalBal = await sLP2Bribe.totalSupply();

        let vLP1BribeTotalBal = await vLP1Bribe.totalSupply();
        let vLP2BribeTotalBal = await vLP2Bribe.totalSupply();

        expect(sLP1VoteWeight).to.be.equal(sLP1BribeTotalBal);
        expect(sLP2VoteWeight).to.be.equal(sLP2BribeTotalBal);
        expect(vLP1VoteWeight).to.be.equal(vLP1BribeTotalBal);
        expect(vLP2VoteWeight).to.be.equal(vLP2BribeTotalBal);

        console.log("sLP1Gauge vote weight", divDec(sLP1VoteWeight));
        console.log("sLP2Gauge vote weight", divDec(sLP2VoteWeight));
        console.log("vLP1Gauge vote weight", divDec(vLP1VoteWeight));
        console.log("vLP2Gauge vote weight", divDec(vLP2VoteWeight));

        console.log("sLP1Bribe total balance", divDec(sLP1BribeTotalBal));
        console.log("sLP2Bribe total balance", divDec(sLP2BribeTotalBal));
        console.log("vLP1Bribe total balance", divDec(vLP1BribeTotalBal));
        console.log("vLP2Bribe total balance", divDec(vLP2BribeTotalBal));

        console.log("Bribe total balances match voting weights");
        console.log();
        console.log("******************************************************");
    });

    it('Owner does a bunch of swaps on vLP1', async function () {
        console.log("******************************************************");
        console.log();
        console.log("Owner does a bunch of swaps on vLP1");

        await WETH.connect(owner).approve(router.address, fifty);
        let bevorSwap1WETH = await WETH.balanceOf(owner.address);
        let bevorSwap1TK1 = await TK1.balanceOf(owner.address);
        await router.connect(owner).swapExactTokensForTokensSimple(fifty, 0, WETH.address, TK1.address, false, owner.address, 1685083888);
        let afterSwap1WETH = await WETH.balanceOf(owner.address);
        let afterSwap1TK1 = await TK1.balanceOf(owner.address);
        expect(divDec(bevorSwap1WETH)).to.be.greaterThan(divDec(afterSwap1WETH));
        expect(divDec(bevorSwap1TK1)).to.be.lessThan(divDec(afterSwap1TK1));
        
        await TK1.connect(owner).approve(router.address, fifty);
        let bevorSwap2TK1 = await TK1.balanceOf(owner.address);
        let bevorSwap2WETH = await WETH.balanceOf(owner.address);
        await router.connect(owner).swapExactTokensForTokensSimple(fifty, 0, TK1.address, WETH.address, false, owner.address, 1685083888);
        let afterSwap2TK1 = await TK1.balanceOf(owner.address);
        let afterSwap2WETH = await WETH.balanceOf(owner.address);
        expect(divDec(bevorSwap2TK1)).to.be.greaterThan(divDec(afterSwap2TK1));
        expect(divDec(bevorSwap2WETH)).to.be.lessThan(divDec(afterSwap2WETH));

        await WETH.connect(owner).approve(router.address, fifty);
        let bevorSwap3WETH = await WETH.balanceOf(owner.address);
        let bevorSwap3TK1 = await TK1.balanceOf(owner.address);
        await router.connect(owner).swapExactTokensForTokensSimple(fifty, 0, WETH.address, TK1.address, false, owner.address, 1685083888);
        let afterSwap3TK1 = await TK1.balanceOf(owner.address);
        let afterSwap3WETH = await WETH.balanceOf(owner.address);
        expect(divDec(bevorSwap3WETH)).to.be.greaterThan(divDec(afterSwap3WETH));
        expect(divDec(bevorSwap3TK1)).to.be.lessThan(divDec(afterSwap3TK1));

        await TK1.connect(owner).approve(router.address, fifty);
        let bevorSwap4TK1 = await TK1.balanceOf(owner.address);
        let bevorSwap4WETH = await WETH.balanceOf(owner.address);
        await router.connect(owner).swapExactTokensForTokensSimple(fifty, 0, TK1.address, WETH.address, false, owner.address, 1685083888);
        let afterSwap4TK1 = await TK1.balanceOf(owner.address);
        let afterSwap4WETH = await WETH.balanceOf(owner.address);
        expect(divDec(bevorSwap4TK1)).to.be.greaterThan(divDec(afterSwap4TK1));
        expect(divDec(bevorSwap4WETH)).to.be.lessThan(divDec(afterSwap4WETH));

        await WETH.connect(owner).approve(router.address, fifty);
        let bevorSwap5WETH = await WETH.balanceOf(owner.address);
        let bevorSwap5TK1 = await TK1.balanceOf(owner.address);
        await router.connect(owner).swapExactTokensForTokensSimple(fifty, 0, WETH.address, TK1.address, false, owner.address, 1685083888);
        let afterSwap5TK1 = await TK1.balanceOf(owner.address);
        let afterSwap5WETH = await WETH.balanceOf(owner.address);
        expect(divDec(bevorSwap5WETH)).to.be.greaterThan(divDec(afterSwap5WETH));
        expect(divDec(bevorSwap5TK1)).to.be.lessThan(divDec(afterSwap5TK1));

        await TK1.connect(owner).approve(router.address, fifty);
        let bevorSwap6TK1 = await TK1.balanceOf(owner.address);
        let bevorSwap6WETH = await WETH.balanceOf(owner.address);
        await router.connect(owner).swapExactTokensForTokensSimple(fifty, 0, TK1.address, WETH.address, false, owner.address, 1685083888);
        let afterSwap6TK1 = await TK1.balanceOf(owner.address);
        let afterSwap6WETH = await WETH.balanceOf(owner.address);
        expect(divDec(bevorSwap6TK1)).to.be.greaterThan(divDec(afterSwap6TK1));
        expect(divDec(bevorSwap6WETH)).to.be.lessThan(divDec(afterSwap6WETH));

        await WETH.connect(owner).approve(router.address, fifty);
        let bevorSwap7WETH = await WETH.balanceOf(owner.address);
        let bevorSwap7TK1 = await TK1.balanceOf(owner.address);
        await router.connect(owner).swapExactTokensForTokensSimple(fifty, 0, WETH.address, TK1.address, false, owner.address, 1685083888);
        let afterSwap7TK1 = await TK1.balanceOf(owner.address);
        let afterSwap7WETH = await WETH.balanceOf(owner.address);
        expect(divDec(bevorSwap7WETH)).to.be.greaterThan(divDec(afterSwap7WETH));
        expect(divDec(bevorSwap7TK1)).to.be.lessThan(divDec(afterSwap7TK1));

        await TK1.connect(owner).approve(router.address, fifty);
        let bevorSwap8TK1 = await TK1.balanceOf(owner.address);
        let bevorSwap8WETH = await WETH.balanceOf(owner.address);
        await router.connect(owner).swapExactTokensForTokensSimple(fifty, 0, TK1.address, WETH.address, false, owner.address, 1685083888);
        let afterSwap8TK1 = await TK1.balanceOf(owner.address);
        let afterSwap8WETH = await WETH.balanceOf(owner.address);
        expect(divDec(bevorSwap8TK1)).to.be.greaterThan(divDec(afterSwap8TK1));
        expect(divDec(bevorSwap8WETH)).to.be.lessThan(divDec(afterSwap8WETH));

        await WETH.connect(owner).approve(router.address, fifty);
        let bevorSwap9WETH = await WETH.balanceOf(owner.address);
        let bevorSwap9TK1 = await TK1.balanceOf(owner.address);
        await router.connect(owner).swapExactTokensForTokensSimple(fifty, 0, WETH.address, TK1.address, false, owner.address, 1685083888);
        let afterSwap9TK1 = await TK1.balanceOf(owner.address);
        let afterSwap9WETH = await WETH.balanceOf(owner.address);
        expect(divDec(bevorSwap9WETH)).to.be.greaterThan(divDec(afterSwap9WETH));
        expect(divDec(bevorSwap9TK1)).to.be.lessThan(divDec(afterSwap9TK1));

        await TK1.connect(owner).approve(router.address, fifty);
        let bevorSwap10TK1 = await TK1.balanceOf(owner.address);
        let bevorSwap10WETH = await WETH.balanceOf(owner.address);
        await router.connect(owner).swapExactTokensForTokensSimple(fifty, 0, TK1.address, WETH.address, false, owner.address, 1685083888);
        let afterSwap10TK1 = await TK1.balanceOf(owner.address);
        let afterSwap10WETH = await WETH.balanceOf(owner.address);
        expect(divDec(bevorSwap10TK1)).to.be.greaterThan(divDec(afterSwap10TK1));
        expect(divDec(bevorSwap10WETH)).to.be.lessThan(divDec(afterSwap10WETH));

        console.log();
        console.log("******************************************************");
    });

    it('claimVotingFees vLP1Bribe', async function () {
        console.log("******************************************************");
        console.log("BRIBE TEST #1");
        console.log("******************************************************");

        await expect(await WETH.balanceOf(usdfiMaker.address)).to.be.equal(0);
        await expect(await TK1.balanceOf(usdfiMaker.address)).to.be.equal(0);

        await expect(await WETH.balanceOf(protocol1.address)).to.be.equal(0);
        await expect(await TK1.balanceOf(protocol1.address)).to.be.equal(0);

        await expect(await WETH.balanceOf(vLP1Bribe.address)).to.be.equal(0);
        await expect(await TK1.balanceOf(vLP1Bribe.address)).to.be.equal(0);

        await vLP1Gauge.claimVotingFees();

        // fee 20
        await expect(await WETH.balanceOf(usdfiMaker.address)).to.be.above(0);
        await expect(await TK1.balanceOf(usdfiMaker.address)).to.be.above(0);

        // fee 0
        await expect(await WETH.balanceOf(protocol1.address)).to.be.equal(0);
        await expect(await TK1.balanceOf(protocol1.address)).to.be.equal(0);

        // fee 80
        await expect(await WETH.balanceOf(vLP1Bribe.address)).to.be.above(0);
        await expect(await TK1.balanceOf(vLP1Bribe.address)).to.be.above(0);

        let epochNow = await vLP1Bribe.getEpoch();
        let epochNext = await Number(epochNow) + 1;

        let rewardWETH = (await vLP1Bribe.rewardData(WETH.address, epochNext)).rewardsPerEpoch;
        let rewardTK1 = (await vLP1Bribe.rewardData(TK1.address, epochNext)).rewardsPerEpoch;

        console.log("epochNow", Number(epochNow));
        console.log("WETH bribes next Epoch", divDec(rewardWETH));
        console.log("TK1 bribes next Epoch", divDec(rewardTK1));

        await TK1.connect(briber).approve(vLP1Bribe.address, fifty);
        await vLP1Bribe.connect(briber).notifyRewardAmount(TK1.address, fifty);

        // Test extra reward from User
        rewardTK1 = (await vLP1Bribe.rewardData(TK1.address, epochNext)).rewardsPerEpoch;
        console.log("TK1 bribes next Epoch", divDec(rewardTK1));
        await expect(rewardTK1).to.be.above(fifty);
        console.log();
        console.log("******************************************************");
    });

    it('END => ROUND 1', async function () {
        console.log();
        console.log("******************************************************************************************************************************************************************");
        console.log("******************************************************************************************************************************************************************");
        console.log();
    });

    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    it('Users votes on gauges via proxie => ROUND 2', async function () {
        console.log("******************************************************");
        console.log();

        console.log("User1 votes on variable gauge proxy with  250 on sLP1, 250 on sLP2,500 on vLP2");
        await veVoteProxy.connect(user1).vote([sLP1.address, sLP2.address, vLP2.address], [twoHundredAndFifty, twoHundredAndFifty, fiveHundred]);
        let vote1 = await gaugeFactory.votes(user1.address, sLP1.address);
        let vote2 = await gaugeFactory.votes(user1.address, sLP2.address);
        let vote3 = await gaugeFactory.votes(user1.address, vLP1.address);
        let vote4 = await gaugeFactory.votes(user1.address, vLP2.address);

        console.log("User1 vote1", divDec(vote1));
        console.log("User1 vote2", divDec(vote2));
        console.log("User1 vote3", divDec(vote3));
        console.log("User1 vote4", divDec(vote4));

        expect(divDec(vote1)).to.be.greaterThan(0);
        expect(divDec(vote2)).to.be.greaterThan(0);
        expect(divDec(vote3)).to.be.equal(0);
        expect(divDec(vote4)).to.be.greaterThan(0);

        console.log("User2 votes on variable gauge proxy with  1000 on vLP1");
        await veVoteProxy.connect(user2).vote([vLP1.address], [oneThousand]);

        let vote5 = await gaugeFactory.votes(user2.address, sLP1.address);
        let vote6 = await gaugeFactory.votes(user2.address, sLP2.address);
        let vote7 = await gaugeFactory.votes(user2.address, vLP1.address);
        let vote8 = await gaugeFactory.votes(user2.address, vLP2.address);

        console.log("User2 vote1", divDec(vote5));
        console.log("User2 vote2", divDec(vote6));
        console.log("User2 vote3", divDec(vote7));
        console.log("User2 vote4", divDec(vote8));

        expect(divDec(vote5)).to.be.equal(0);
        expect(divDec(vote6)).to.be.equal(0);
        expect(divDec(vote7)).to.be.greaterThan(0);
        expect(divDec(vote8)).to.be.equal(0);

        console.log("User3 votes on variable gauge proxy with  250 on sLP1, 250 on sLP2, 500 on vLP1");
        await veVoteProxy.connect(user3).vote([sLP1.address, sLP2.address, vLP1.address], [twoHundredAndFifty, twoHundredAndFifty, fiveHundred]);
        let vote9 = await gaugeFactory.votes(user3.address, sLP1.address);
        let vote10 = await gaugeFactory.votes(user3.address, sLP2.address);
        let vote11 = await gaugeFactory.votes(user3.address, vLP1.address);
        let vote12 = await gaugeFactory.votes(user3.address, vLP2.address);

        console.log("User3 vote1", divDec(vote9));
        console.log("User3 vote2", divDec(vote10));
        console.log("User3 vote3", divDec(vote11));
        console.log("User3 vote4", divDec(vote12));

        expect(divDec(vote9)).to.be.greaterThan(0);
        expect(divDec(vote10)).to.be.greaterThan(0);
        expect(divDec(vote11)).to.be.greaterThan(0);
        expect(divDec(vote12)).to.be.equal(0);

        console.log();
        console.log("******************************************************");
    });

    it('check vote => ROUND 2', async function () {
        console.log("******************************************************");
        console.log();

        let totalWeight = await gaugeFactory.totalWeight();
        let sLP1Weight = await gaugeFactory.weights(sLP1.address);
        let sLP2Weight = await gaugeFactory.weights(sLP2.address);
        let vLP1Weight = await gaugeFactory.weights(vLP1.address);
        let vLP2Weight = await gaugeFactory.weights(vLP2.address);

        let votesUser1 = await veSTABLE['balanceOf(address)'](user1.address);
        let votesUser2 = await veSTABLE['balanceOf(address)'](user2.address);
        let votesUser3 = await veSTABLE['balanceOf(address)'](user3.address);

        let vote1 = await gaugeFactory.votes(user1.address, sLP1.address);
        let vote2 = await gaugeFactory.votes(user1.address, sLP2.address);
        let vote3 = await gaugeFactory.votes(user1.address, vLP1.address);
        let vote4 = await gaugeFactory.votes(user1.address, vLP2.address);

        let vote5 = await gaugeFactory.votes(user2.address, sLP1.address);
        let vote6 = await gaugeFactory.votes(user2.address, sLP2.address);
        let vote7 = await gaugeFactory.votes(user2.address, vLP1.address);
        let vote8 = await gaugeFactory.votes(user2.address, vLP2.address);

        let vote9 = await gaugeFactory.votes(user3.address, sLP1.address);
        let vote10 = await gaugeFactory.votes(user3.address, sLP2.address);
        let vote11 = await gaugeFactory.votes(user3.address, vLP1.address);
        let vote12 = await gaugeFactory.votes(user3.address, vLP2.address);

        console.log("Expected Factory Status");
        let expectedVotesTotal = Number(votesUser1) + Number(votesUser2) + Number(votesUser3)
        console.log("expectedVotesTotal ", divDec(expectedVotesTotal));

        let expectedWeightTotal = Number(sLP1Weight) + Number(sLP2Weight) + Number(vLP1Weight) + Number(vLP2Weight)
        console.log("expectedWeightsTotal ", divDec(expectedWeightTotal));

        let expectedsLP1Total = Number(vote1) + Number(vote5) + Number(vote9)
        console.log("expectedsLP1Total ", divDec(expectedsLP1Total));

        let expectedsLP2Total = Number(vote2) + Number(vote6) + Number(vote10)
        console.log("expectedsLP2Total ", divDec(expectedsLP2Total));

        let expectedvLP1Total = Number(vote3) + Number(vote7) + Number(vote11)
        console.log("expectedvLP1Total ", divDec(expectedvLP1Total));

        let expectedvLP2Total = Number(vote4) + Number(vote8) + Number(vote12)
        console.log("expectedvLP2Total ", divDec(expectedvLP2Total));

        expect((divDec(totalWeight).toFixed(3))).to.be.equal((divDec(expectedVotesTotal).toFixed(3)));
        expect((divDec(totalWeight).toFixed(5))).to.be.equal((divDec(expectedWeightTotal).toFixed(5)));
        expect(divDec(sLP1Weight).toFixed(5)).to.be.equal(divDec(expectedsLP1Total).toFixed(5));
        expect(divDec(sLP2Weight).toFixed(5)).to.be.equal(divDec(expectedsLP2Total).toFixed(5));
        expect(divDec(vLP1Weight).toFixed(5)).to.be.equal(divDec(expectedvLP1Total).toFixed(5));
        expect(divDec(vLP2Weight).toFixed(5)).to.be.equal(divDec(expectedvLP2Total).toFixed(5));

        console.log();
        console.log("Gauge Factory Status");
        console.log("Total weight", divDec(totalWeight));
        console.log("sLP1 weight", divDec(sLP1Weight));
        console.log("sLP2 weight", divDec(sLP2Weight));
        console.log("vLP1 weight", divDec(vLP1Weight));
        console.log("vLP2 weight", divDec(vLP2Weight));
        console.log();
        console.log("******************************************************");
    });

    it('Forward time by 1 week', async function () {
        console.log();
        console.log("******************************************************");
        console.log();
        await gaugeFactory.preDistribute();
        let usdfiGF = await STABLE.balanceOf(gaugeFactory.address);
        console.log("STABLE in Gauge Factory this Week", divDec(usdfiGF));
        await gaugeFactory.connect(user1).distribute(0, 4);
        await network.provider.send('evm_increaseTime', [oneWeek]);
        await network.provider.send('evm_mine');
        console.log();
        console.log("******************************************************");
    });

    it('derivedBalance and derivedSupply => ROUND 2', async function () {
        console.log("******************************************************");
        console.log();
        let derivedSupplysLP1Gauge = await sLP1Gauge.derivedSupply();
        let derivedSupplysLP2Gauge = await sLP2Gauge.derivedSupply();
        let derivedSupplyvLP1Gauge = await vLP1Gauge.derivedSupply();
        let derivedSupplyvLP2Gauge = await vLP2Gauge.derivedSupply();
        expect(divDec(derivedSupplysLP1Gauge)).to.be.greaterThan(0);
        expect(divDec(derivedSupplysLP2Gauge)).to.be.greaterThan(0);
        expect(divDec(derivedSupplyvLP1Gauge)).to.be.greaterThan(0);
        expect(divDec(derivedSupplyvLP2Gauge)).to.be.greaterThan(0);

        let derivedBalanceUser1sLP1Gauge = await sLP1Gauge.derivedBalance(user1.address);
        let derivedBalanceUser2sLP1Gauge = await sLP1Gauge.derivedBalance(user2.address);
        let derivedBalanceUser3sLP1Gauge = await sLP1Gauge.derivedBalance(user3.address);
        expect(divDec(derivedBalanceUser1sLP1Gauge)).to.be.greaterThan(0);
        expect(divDec(derivedBalanceUser2sLP1Gauge)).to.be.greaterThan(0);
        expect(divDec(derivedBalanceUser3sLP1Gauge)).to.be.greaterThan(0);

        let derivedBalanceUser1sLP2Gauge = await sLP2Gauge.derivedBalance(user1.address);
        let derivedBalanceUser2sLP2Gauge = await sLP2Gauge.derivedBalance(user2.address);
        let derivedBalanceUser3sLP2Gauge = await sLP2Gauge.derivedBalance(user3.address);
        expect(divDec(derivedBalanceUser1sLP2Gauge)).to.be.greaterThan(0);
        expect(divDec(derivedBalanceUser2sLP2Gauge)).to.be.greaterThan(0);
        expect(divDec(derivedBalanceUser3sLP2Gauge)).to.be.greaterThan(0);

        let derivedBalanceUser1vLP1Gauge = await vLP1Gauge.derivedBalance(user1.address);
        let derivedBalanceUser2vLP1Gauge = await vLP1Gauge.derivedBalance(user2.address);
        let derivedBalanceUser3vLP1Gauge = await vLP1Gauge.derivedBalance(user3.address);
        expect(divDec(derivedBalanceUser1vLP1Gauge)).to.be.greaterThan(0);
        expect(divDec(derivedBalanceUser2vLP1Gauge)).to.be.greaterThan(0);
        expect(divDec(derivedBalanceUser3vLP1Gauge)).to.be.greaterThan(0);

        let derivedBalanceUser1vLP2Gauge = await vLP2Gauge.derivedBalance(user1.address);
        let derivedBalanceUser2vLP2Gauge = await vLP2Gauge.derivedBalance(user2.address);
        let derivedBalanceUser3vLP2Gauge = await vLP2Gauge.derivedBalance(user3.address);
        expect(divDec(derivedBalanceUser1vLP2Gauge)).to.be.greaterThan(0);
        expect(divDec(derivedBalanceUser2vLP2Gauge)).to.be.greaterThan(0);
        expect(divDec(derivedBalanceUser3vLP2Gauge)).to.be.greaterThan(0);

        console.log("total derivedSupply sLP1Gauge", divDec(derivedSupplysLP1Gauge));
        console.log("total derivedSupply sLP2Gauge", divDec(derivedSupplysLP2Gauge));
        console.log("total derivedSupply vLP1Gauge", divDec(derivedSupplyvLP1Gauge));
        console.log("total derivedSupply vLP2Gauge", divDec(derivedSupplyvLP2Gauge));
        console.log();
        console.log("derived balance user 1 sLP1Gauge", divDec(derivedBalanceUser1sLP1Gauge));
        console.log("derived balance user 2 sLP1Gauge", divDec(derivedBalanceUser2sLP1Gauge));
        console.log("derived balance user 3 sLP1Gauge", divDec(derivedBalanceUser3sLP1Gauge));
        console.log();
        console.log("derived balance user 1 sLP2Gauge", divDec(derivedBalanceUser1sLP2Gauge));
        console.log("derived balance user 2 sLP2Gauge", divDec(derivedBalanceUser2sLP2Gauge));
        console.log("derived balance user 3 sLP2Gauge", divDec(derivedBalanceUser3sLP2Gauge));
        console.log();
        console.log("derived balance user 1 vLP1Gauge", divDec(derivedBalanceUser1vLP1Gauge));
        console.log("derived balance user 2 vLP1Gauge", divDec(derivedBalanceUser2vLP1Gauge));
        console.log("derived balance user 3 vLP1Gauge", divDec(derivedBalanceUser3vLP1Gauge));
        console.log();
        console.log("derived balance user 1 vLP2Gauge", divDec(derivedBalanceUser1vLP2Gauge));
        console.log("derived balance user 2 vLP2Gauge", divDec(derivedBalanceUser2vLP2Gauge));
        console.log("derived balance user 3 vLP2Gauge", divDec(derivedBalanceUser3vLP2Gauge));
        console.log();
        console.log("******************************************************");
    });

    it('User get Gauge Rewards => ROUND 2', async function () {
        console.log("******************************************************");
        console.log();

        let usdfiGP = await STABLE.balanceOf(gaugeFactory.address);
        let usdfisLP1 = await STABLE.balanceOf(sLP1Gauge.address);
        let usdfisLP2 = await STABLE.balanceOf(sLP2Gauge.address);
        let usdfivLP1 = await STABLE.balanceOf(vLP1Gauge.address);
        let usdfivLP2 = await STABLE.balanceOf(vLP2Gauge.address);

        console.log("STABLE Balances")
        console.log("GaugeFactory", divDec(usdfiGP));
        console.log("sLP1Gauge", divDec(usdfisLP1));
        console.log("sLP2Gauge", divDec(usdfisLP2));
        console.log("vLP1Gauge", divDec(usdfivLP1));
        console.log("vLP2Gauge", divDec(usdfivLP2));

        console.log();

        console.log("balanceOf gauges")
        let user1sLP1Gauge = await sLP1Gauge.balanceOf(user1.address);
        let user1sLP2Gauge = await sLP2Gauge.balanceOf(user1.address);
        let user1vLP1Gauge = await vLP1Gauge.balanceOf(user1.address);
        let user1vLP2Gauge = await vLP2Gauge.balanceOf(user1.address);

        let user2sLP1Gauge = await sLP1Gauge.balanceOf(user2.address);
        let user2sLP2Gauge = await sLP2Gauge.balanceOf(user2.address);
        let user2vLP1Gauge = await vLP1Gauge.balanceOf(user2.address);
        let user2vLP2Gauge = await vLP2Gauge.balanceOf(user2.address);

        let user3sLP1Gauge = await sLP1Gauge.balanceOf(user3.address);
        let user3sLP2Gauge = await sLP2Gauge.balanceOf(user3.address);
        let user3vLP1Gauge = await vLP1Gauge.balanceOf(user3.address);
        let user3vLP2Gauge = await vLP2Gauge.balanceOf(user3.address);

        console.log("User1 sLP1 balance in sLP1Gauge", divDec(user1sLP1Gauge));
        console.log("User1 sLP2 balance in sLP2Gauge", divDec(user1sLP2Gauge));
        console.log("User1 vLP1 balance in vLP1Gauge", divDec(user1vLP1Gauge));
        console.log("User1 vLP2 balance in vLP2Gauge", divDec(user1vLP2Gauge));
        console.log();
        console.log("User2 sLP1 balance in sLP1Gauge", divDec(user2sLP1Gauge));
        console.log("User2 sLP2 balance in sLP2Gauge", divDec(user2sLP2Gauge));
        console.log("User2 vLP1 balance in vLP1Gauge", divDec(user2vLP1Gauge));
        console.log("User2 vLP2 balance in vLP2Gauge", divDec(user2vLP2Gauge));
        console.log();
        console.log("User3 sLP1 balance in sLP1Gauge", divDec(user3sLP1Gauge));
        console.log("User3 sLP2 balance in sLP2Gauge", divDec(user3sLP2Gauge));
        console.log("User3 vLP1 balance in vLP1Gauge", divDec(user3vLP1Gauge));
        console.log("User3 vLP2 balance in vLP2Gauge", divDec(user3vLP2Gauge));
        console.log();

        expect(divDec(user1sLP1Gauge)).to.be.greaterThan(0);
        expect(divDec(user1sLP2Gauge)).to.be.greaterThan(0);
        expect(divDec(user1vLP1Gauge)).to.be.greaterThan(0);
        expect(divDec(user1vLP2Gauge)).to.be.greaterThan(0);

        expect(divDec(user2sLP1Gauge)).to.be.greaterThan(0);
        expect(divDec(user2sLP2Gauge)).to.be.greaterThan(0);
        expect(divDec(user2vLP1Gauge)).to.be.greaterThan(0);
        expect(divDec(user2vLP2Gauge)).to.be.greaterThan(0);

        expect(divDec(user3sLP1Gauge)).to.be.greaterThan(0);
        expect(divDec(user3sLP2Gauge)).to.be.greaterThan(0);
        expect(divDec(user3vLP1Gauge)).to.be.greaterThan(0);
        expect(divDec(user3vLP2Gauge)).to.be.greaterThan(0);

        console.log("User earned in gauges")
        let user1EarnedsLP1Gauge = await sLP1Gauge.earned(user1.address);
        let user1EarnedsLP2Gauge = await sLP2Gauge.earned(user1.address);
        let user1EarnedvLP1Gauge = await vLP1Gauge.earned(user1.address);
        let user1EarnedvLP2Gauge = await vLP2Gauge.earned(user1.address);

        let user2EarnedsLP1Gauge = await sLP1Gauge.earned(user2.address);
        let user2EarnedsLP2Gauge = await sLP2Gauge.earned(user2.address);
        let user2EarnedvLP1Gauge = await vLP1Gauge.earned(user2.address);
        let user2EarnedvLP2Gauge = await vLP2Gauge.earned(user2.address);

        let user3EarnedsLP1Gauge = await sLP1Gauge.earned(user3.address);
        let user3EarnedsLP2Gauge = await sLP2Gauge.earned(user3.address);
        let user3EarnedvLP1Gauge = await vLP1Gauge.earned(user3.address);
        let user3EarnedvLP2Gauge = await vLP2Gauge.earned(user3.address);

        console.log("User1 STABLE earned in sLP1Gauge", divDec(user1EarnedsLP1Gauge));
        console.log("User1 STABLE earned in sLP2Gauge", divDec(user1EarnedsLP2Gauge));
        console.log("User1 STABLE earned in vLP1Gauge", divDec(user1EarnedvLP1Gauge));
        console.log("User1 STABLE earned in vLP2Gauge", divDec(user1EarnedvLP2Gauge));
        console.log();
        console.log("User2 STABLE earned in sLP1Gauge", divDec(user2EarnedsLP1Gauge));
        console.log("User2 STABLE earned in sLP2Gauge", divDec(user2EarnedsLP2Gauge));
        console.log("User2 STABLE earned in vLP1Gauge", divDec(user2EarnedvLP1Gauge));
        console.log("User2 STABLE earned in vLP2Gauge", divDec(user2EarnedvLP2Gauge));
        console.log();
        console.log("User3 STABLE earned in sLP1Gauge", divDec(user3EarnedsLP1Gauge));
        console.log("User3 STABLE earned in sLP2Gauge", divDec(user3EarnedsLP2Gauge));
        console.log("User3 STABLE earned in vLP1Gauge", divDec(user3EarnedvLP1Gauge));
        console.log("User3 STABLE earned in vLP2Gauge", divDec(user3EarnedvLP2Gauge));
        console.log();

        expect(divDec(user1EarnedsLP1Gauge)).to.be.greaterThan(0);
        expect(divDec(user1EarnedsLP2Gauge)).to.be.greaterThan(0);
        expect(divDec(user1EarnedvLP1Gauge)).to.be.greaterThan(0);
        expect(divDec(user1EarnedvLP2Gauge)).to.be.greaterThan(0);

        expect(divDec(user2EarnedsLP1Gauge)).to.be.greaterThan(0);
        expect(divDec(user2EarnedsLP2Gauge)).to.be.greaterThan(0);
        expect(divDec(user2EarnedvLP1Gauge)).to.be.greaterThan(0);
        expect(divDec(user2EarnedvLP2Gauge)).to.be.greaterThan(0);

        expect(divDec(user3EarnedsLP1Gauge)).to.be.greaterThan(0);
        expect(divDec(user3EarnedsLP2Gauge)).to.be.greaterThan(0);
        expect(divDec(user3EarnedvLP1Gauge)).to.be.greaterThan(0);
        expect(divDec(user3EarnedvLP2Gauge)).to.be.greaterThan(0);

        await sLP1Gauge.connect(user1).getReward();
        await sLP2Gauge.connect(user1).getReward();
        await vLP1Gauge.connect(user1).getReward();
        await vLP2Gauge.connect(user1).getReward();

        await sLP1Gauge.connect(user2).getReward();
        await sLP2Gauge.connect(user2).getReward();
        await vLP1Gauge.connect(user2).getReward();
        await vLP2Gauge.connect(user2).getReward();

        await sLP1Gauge.connect(user3).getReward();
        await sLP2Gauge.connect(user3).getReward();
        await vLP1Gauge.connect(user3).getReward();
        await vLP2Gauge.connect(user3).getReward();

        let stableUser1 = await STABLE.balanceOf(user1.address);
        let stableUser2 = await STABLE.balanceOf(user2.address);
        let stableUser3 = await STABLE.balanceOf(user3.address);

        console.log("User claim earned to address")
        console.log("User1 STABLE bal", divDec(stableUser1));
        console.log("User2 STABLE bal", divDec(stableUser2));
        console.log("User3 STABLE bal", divDec(stableUser3));

        expect(divDec(stableUser1)).to.be.greaterThan(0);
        expect(divDec(stableUser2)).to.be.greaterThan(0);
        expect(divDec(stableUser3)).to.be.greaterThan(0);

        await STABLE.connect(user1).transfer(burn.address, stableUser1);
        await STABLE.connect(user2).transfer(burn.address, stableUser2);
        await STABLE.connect(user3).transfer(burn.address, stableUser3);
        console.log();
        console.log("User STABLE balances sent to brun address (reset)");
        console.log();
        console.log("******************************************************");
    });

    it('Testing Voting Weight and Bribe balances', async function () {
        console.log("******************************************************");
        console.log();
        let sLP1VoteWeight = await gaugeFactory.weights(sLP1.address);
        let sLP2VoteWeight = await gaugeFactory.weights(sLP2.address);
        let vLP1VoteWeight = await gaugeFactory.weights(vLP1.address);
        let vLP2VoteWeight = await gaugeFactory.weights(vLP2.address);

        let sLP1BribeTotalBal = await sLP1Bribe.totalSupply();
        let sLP2BribeTotalBal = await sLP2Bribe.totalSupply();

        let vLP1BribeTotalBal = await vLP1Bribe.totalSupply();
        let vLP2BribeTotalBal = await vLP2Bribe.totalSupply();

        expect(sLP1VoteWeight).to.be.equal(sLP1BribeTotalBal);
        expect(sLP2VoteWeight).to.be.equal(sLP2BribeTotalBal);
        expect(vLP1VoteWeight).to.be.equal(vLP1BribeTotalBal);
        expect(vLP2VoteWeight).to.be.equal(vLP2BribeTotalBal);

        console.log("sLP1Gauge vote weight", divDec(sLP1VoteWeight));
        console.log("sLP2Gauge vote weight", divDec(sLP2VoteWeight));
        console.log("vLP1Gauge vote weight", divDec(vLP1VoteWeight));
        console.log("vLP2Gauge vote weight", divDec(vLP2VoteWeight));

        console.log("sLP1Bribe total balance", divDec(sLP1BribeTotalBal));
        console.log("sLP2Bribe total balance", divDec(sLP2BribeTotalBal));
        console.log("vLP1Bribe total balance", divDec(vLP1BribeTotalBal));
        console.log("vLP2Bribe total balance", divDec(vLP2BribeTotalBal));

        console.log("Bribe total balances match voting weights");
        console.log();
        console.log("******************************************************");
    });

    it('Owner does a bunch of swaps on vLP1', async function () {
        console.log("******************************************************");
        console.log();
        console.log("Owner does a bunch of swaps on vLP1");

        await WETH.connect(owner).approve(router.address, fifty);
        let bevorSwap1WETH = await WETH.balanceOf(owner.address);
        let bevorSwap1TK1 = await TK1.balanceOf(owner.address);
        await router.connect(owner).swapExactTokensForTokensSimple(fifty, 0, WETH.address, TK1.address, false, owner.address, 1685083888);
        let afterSwap1WETH = await WETH.balanceOf(owner.address);
        let afterSwap1TK1 = await TK1.balanceOf(owner.address);
        expect(divDec(bevorSwap1WETH)).to.be.greaterThan(divDec(afterSwap1WETH));
        expect(divDec(bevorSwap1TK1)).to.be.lessThan(divDec(afterSwap1TK1));
        
        await TK1.connect(owner).approve(router.address, fifty);
        let bevorSwap2TK1 = await TK1.balanceOf(owner.address);
        let bevorSwap2WETH = await WETH.balanceOf(owner.address);
        await router.connect(owner).swapExactTokensForTokensSimple(fifty, 0, TK1.address, WETH.address, false, owner.address, 1685083888);
        let afterSwap2TK1 = await TK1.balanceOf(owner.address);
        let afterSwap2WETH = await WETH.balanceOf(owner.address);
        expect(divDec(bevorSwap2TK1)).to.be.greaterThan(divDec(afterSwap2TK1));
        expect(divDec(bevorSwap2WETH)).to.be.lessThan(divDec(afterSwap2WETH));

        await WETH.connect(owner).approve(router.address, fifty);
        let bevorSwap3WETH = await WETH.balanceOf(owner.address);
        let bevorSwap3TK1 = await TK1.balanceOf(owner.address);
        await router.connect(owner).swapExactTokensForTokensSimple(fifty, 0, WETH.address, TK1.address, false, owner.address, 1685083888);
        let afterSwap3TK1 = await TK1.balanceOf(owner.address);
        let afterSwap3WETH = await WETH.balanceOf(owner.address);
        expect(divDec(bevorSwap3WETH)).to.be.greaterThan(divDec(afterSwap3WETH));
        expect(divDec(bevorSwap3TK1)).to.be.lessThan(divDec(afterSwap3TK1));

        await TK1.connect(owner).approve(router.address, fifty);
        let bevorSwap4TK1 = await TK1.balanceOf(owner.address);
        let bevorSwap4WETH = await WETH.balanceOf(owner.address);
        await router.connect(owner).swapExactTokensForTokensSimple(fifty, 0, TK1.address, WETH.address, false, owner.address, 1685083888);
        let afterSwap4TK1 = await TK1.balanceOf(owner.address);
        let afterSwap4WETH = await WETH.balanceOf(owner.address);
        expect(divDec(bevorSwap4TK1)).to.be.greaterThan(divDec(afterSwap4TK1));
        expect(divDec(bevorSwap4WETH)).to.be.lessThan(divDec(afterSwap4WETH));

        await WETH.connect(owner).approve(router.address, fifty);
        let bevorSwap5WETH = await WETH.balanceOf(owner.address);
        let bevorSwap5TK1 = await TK1.balanceOf(owner.address);
        await router.connect(owner).swapExactTokensForTokensSimple(fifty, 0, WETH.address, TK1.address, false, owner.address, 1685083888);
        let afterSwap5TK1 = await TK1.balanceOf(owner.address);
        let afterSwap5WETH = await WETH.balanceOf(owner.address);
        expect(divDec(bevorSwap5WETH)).to.be.greaterThan(divDec(afterSwap5WETH));
        expect(divDec(bevorSwap5TK1)).to.be.lessThan(divDec(afterSwap5TK1));

        await TK1.connect(owner).approve(router.address, fifty);
        let bevorSwap6TK1 = await TK1.balanceOf(owner.address);
        let bevorSwap6WETH = await WETH.balanceOf(owner.address);
        await router.connect(owner).swapExactTokensForTokensSimple(fifty, 0, TK1.address, WETH.address, false, owner.address, 1685083888);
        let afterSwap6TK1 = await TK1.balanceOf(owner.address);
        let afterSwap6WETH = await WETH.balanceOf(owner.address);
        expect(divDec(bevorSwap6TK1)).to.be.greaterThan(divDec(afterSwap6TK1));
        expect(divDec(bevorSwap6WETH)).to.be.lessThan(divDec(afterSwap6WETH));

        await WETH.connect(owner).approve(router.address, fifty);
        let bevorSwap7WETH = await WETH.balanceOf(owner.address);
        let bevorSwap7TK1 = await TK1.balanceOf(owner.address);
        await router.connect(owner).swapExactTokensForTokensSimple(fifty, 0, WETH.address, TK1.address, false, owner.address, 1685083888);
        let afterSwap7TK1 = await TK1.balanceOf(owner.address);
        let afterSwap7WETH = await WETH.balanceOf(owner.address);
        expect(divDec(bevorSwap7WETH)).to.be.greaterThan(divDec(afterSwap7WETH));
        expect(divDec(bevorSwap7TK1)).to.be.lessThan(divDec(afterSwap7TK1));

        await TK1.connect(owner).approve(router.address, fifty);
        let bevorSwap8TK1 = await TK1.balanceOf(owner.address);
        let bevorSwap8WETH = await WETH.balanceOf(owner.address);
        await router.connect(owner).swapExactTokensForTokensSimple(fifty, 0, TK1.address, WETH.address, false, owner.address, 1685083888);
        let afterSwap8TK1 = await TK1.balanceOf(owner.address);
        let afterSwap8WETH = await WETH.balanceOf(owner.address);
        expect(divDec(bevorSwap8TK1)).to.be.greaterThan(divDec(afterSwap8TK1));
        expect(divDec(bevorSwap8WETH)).to.be.lessThan(divDec(afterSwap8WETH));

        await WETH.connect(owner).approve(router.address, fifty);
        let bevorSwap9WETH = await WETH.balanceOf(owner.address);
        let bevorSwap9TK1 = await TK1.balanceOf(owner.address);
        await router.connect(owner).swapExactTokensForTokensSimple(fifty, 0, WETH.address, TK1.address, false, owner.address, 1685083888);
        let afterSwap9TK1 = await TK1.balanceOf(owner.address);
        let afterSwap9WETH = await WETH.balanceOf(owner.address);
        expect(divDec(bevorSwap9WETH)).to.be.greaterThan(divDec(afterSwap9WETH));
        expect(divDec(bevorSwap9TK1)).to.be.lessThan(divDec(afterSwap9TK1));

        await TK1.connect(owner).approve(router.address, fifty);
        let bevorSwap10TK1 = await TK1.balanceOf(owner.address);
        let bevorSwap10WETH = await WETH.balanceOf(owner.address);
        await router.connect(owner).swapExactTokensForTokensSimple(fifty, 0, TK1.address, WETH.address, false, owner.address, 1685083888);
        let afterSwap10TK1 = await TK1.balanceOf(owner.address);
        let afterSwap10WETH = await WETH.balanceOf(owner.address);
        expect(divDec(bevorSwap10TK1)).to.be.greaterThan(divDec(afterSwap10TK1));
        expect(divDec(bevorSwap10WETH)).to.be.lessThan(divDec(afterSwap10WETH));

        console.log();
        console.log("******************************************************");
    });

    it('claimVotingFees vLP1Bribe', async function () {
        console.log("******************************************************");
        console.log("BRIBE TEST #2");
        console.log("******************************************************");

        await expect(await WETH.balanceOf(usdfiMaker.address)).to.be.above(0);
        await expect(await TK1.balanceOf(usdfiMaker.address)).to.be.above(0);

        await expect(await WETH.balanceOf(protocol1.address)).to.be.equal(0);
        await expect(await TK1.balanceOf(protocol1.address)).to.be.equal(0);

        await expect(await WETH.balanceOf(vLP1Bribe.address)).to.be.above(0);
        await expect(await TK1.balanceOf(vLP1Bribe.address)).to.be.above(0);

        await vLP1Gauge.claimVotingFees();

        // fee 20
        await expect(await WETH.balanceOf(usdfiMaker.address)).to.be.above(0);
        await expect(await TK1.balanceOf(usdfiMaker.address)).to.be.above(0);

        // fee 0
        await expect(await WETH.balanceOf(protocol1.address)).to.be.equal(0);
        await expect(await TK1.balanceOf(protocol1.address)).to.be.equal(0);

        // fee 80
        await expect(await WETH.balanceOf(vLP1Bribe.address)).to.be.above(0);
        await expect(await TK1.balanceOf(vLP1Bribe.address)).to.be.above(0);

        let epochNow = await vLP1Bribe.getEpoch();
        let epochNext = await Number(epochNow) + 1;

        let rewardWETH = (await vLP1Bribe.rewardData(WETH.address, epochNext)).rewardsPerEpoch;
        let rewardTK1 = (await vLP1Bribe.rewardData(TK1.address, epochNext)).rewardsPerEpoch;

        console.log("epochNow", Number(epochNow));
        console.log("WETH bribes next Epoch", divDec(rewardWETH));
        console.log("TK1 bribes next Epoch", divDec(rewardTK1));

        await TK1.connect(briber).approve(vLP1Bribe.address, fifty);
        await vLP1Bribe.connect(briber).notifyRewardAmount(TK1.address, fifty);

        // Test extra reward from User
        rewardTK1 = (await vLP1Bribe.rewardData(TK1.address, epochNext)).rewardsPerEpoch;
        console.log("TK1 bribes next Epoch", divDec(rewardTK1));
        await expect(rewardTK1).to.be.above(fifty);
        console.log();
        console.log("******************************************************");
    });

    it('END => ROUND 2', async function () {
        console.log();
        console.log("******************************************************************************************************************************************************************");
        console.log("******************************************************************************************************************************************************************");
        console.log();
    });

    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
   
    it('Users votes on gauges via proxie => ROUND 3', async function () {
        console.log("******************************************************");
        console.log();

        console.log("User1 votes on variable gauge proxy with  250 on sLP1, 250 on sLP2,500 on vLP2");
        await veVoteProxy.connect(user1).vote([sLP1.address, sLP2.address, vLP2.address], [twoHundredAndFifty, twoHundredAndFifty, fiveHundred]);
        let vote1 = await gaugeFactory.votes(user1.address, sLP1.address);
        let vote2 = await gaugeFactory.votes(user1.address, sLP2.address);
        let vote3 = await gaugeFactory.votes(user1.address, vLP1.address);
        let vote4 = await gaugeFactory.votes(user1.address, vLP2.address);

        console.log("User1 vote1", divDec(vote1));
        console.log("User1 vote2", divDec(vote2));
        console.log("User1 vote3", divDec(vote3));
        console.log("User1 vote4", divDec(vote4));

        expect(divDec(vote1)).to.be.greaterThan(0);
        expect(divDec(vote2)).to.be.greaterThan(0);
        expect(divDec(vote3)).to.be.equal(0);
        expect(divDec(vote4)).to.be.greaterThan(0);

        console.log("User2 votes on variable gauge proxy with  1000 on vLP1");
        await veVoteProxy.connect(user2).vote([vLP1.address], [oneThousand]);

        let vote5 = await gaugeFactory.votes(user2.address, sLP1.address);
        let vote6 = await gaugeFactory.votes(user2.address, sLP2.address);
        let vote7 = await gaugeFactory.votes(user2.address, vLP1.address);
        let vote8 = await gaugeFactory.votes(user2.address, vLP2.address);

        console.log("User2 vote1", divDec(vote5));
        console.log("User2 vote2", divDec(vote6));
        console.log("User2 vote3", divDec(vote7));
        console.log("User2 vote4", divDec(vote8));

        expect(divDec(vote5)).to.be.equal(0);
        expect(divDec(vote6)).to.be.equal(0);
        expect(divDec(vote7)).to.be.greaterThan(0);
        expect(divDec(vote8)).to.be.equal(0);

        console.log("User3 votes on variable gauge proxy with  250 on sLP1, 250 on sLP2, 500 on vLP1");
        await veVoteProxy.connect(user3).vote([sLP1.address, sLP2.address, vLP1.address], [twoHundredAndFifty, twoHundredAndFifty, fiveHundred]);
        let vote9 = await gaugeFactory.votes(user3.address, sLP1.address);
        let vote10 = await gaugeFactory.votes(user3.address, sLP2.address);
        let vote11 = await gaugeFactory.votes(user3.address, vLP1.address);
        let vote12 = await gaugeFactory.votes(user3.address, vLP2.address);

        console.log("User3 vote1", divDec(vote9));
        console.log("User3 vote2", divDec(vote10));
        console.log("User3 vote3", divDec(vote11));
        console.log("User3 vote4", divDec(vote12));

        expect(divDec(vote9)).to.be.greaterThan(0);
        expect(divDec(vote10)).to.be.greaterThan(0);
        expect(divDec(vote11)).to.be.greaterThan(0);
        expect(divDec(vote12)).to.be.equal(0);


        console.log();
        console.log("******************************************************");
    });

    it('check vote => ROUND 3', async function () {
        console.log("******************************************************");
        console.log();

        let totalWeight = await gaugeFactory.totalWeight();
        let sLP1Weight = await gaugeFactory.weights(sLP1.address);
        let sLP2Weight = await gaugeFactory.weights(sLP2.address);
        let vLP1Weight = await gaugeFactory.weights(vLP1.address);
        let vLP2Weight = await gaugeFactory.weights(vLP2.address);

        let votesUser1 = await veSTABLE['balanceOf(address)'](user1.address);
        let votesUser2 = await veSTABLE['balanceOf(address)'](user2.address);
        let votesUser3 = await veSTABLE['balanceOf(address)'](user3.address);

        let vote1 = await gaugeFactory.votes(user1.address, sLP1.address);
        let vote2 = await gaugeFactory.votes(user1.address, sLP2.address);
        let vote3 = await gaugeFactory.votes(user1.address, vLP1.address);
        let vote4 = await gaugeFactory.votes(user1.address, vLP2.address);

        let vote5 = await gaugeFactory.votes(user2.address, sLP1.address);
        let vote6 = await gaugeFactory.votes(user2.address, sLP2.address);
        let vote7 = await gaugeFactory.votes(user2.address, vLP1.address);
        let vote8 = await gaugeFactory.votes(user2.address, vLP2.address);

        let vote9 = await gaugeFactory.votes(user3.address, sLP1.address);
        let vote10 = await gaugeFactory.votes(user3.address, sLP2.address);
        let vote11 = await gaugeFactory.votes(user3.address, vLP1.address);
        let vote12 = await gaugeFactory.votes(user3.address, vLP2.address);

        console.log("Expected Factory Status");
        let expectedVotesTotal = Number(votesUser1) + Number(votesUser2) + Number(votesUser3)
        console.log("expectedVotesTotal ", divDec(expectedVotesTotal));

        let expectedWeightTotal = Number(sLP1Weight) + Number(sLP2Weight) + Number(vLP1Weight) + Number(vLP2Weight)
        console.log("expectedWeightsTotal ", divDec(expectedWeightTotal));

        let expectedsLP1Total = Number(vote1) + Number(vote5) + Number(vote9)
        console.log("expectedsLP1Total ", divDec(expectedsLP1Total));

        let expectedsLP2Total = Number(vote2) + Number(vote6) + Number(vote10)
        console.log("expectedsLP2Total ", divDec(expectedsLP2Total));

        let expectedvLP1Total = Number(vote3) + Number(vote7) + Number(vote11)
        console.log("expectedvLP1Total ", divDec(expectedvLP1Total));

        let expectedvLP2Total = Number(vote4) + Number(vote8) + Number(vote12)
        console.log("expectedvLP2Total ", divDec(expectedvLP2Total));

        expect((divDec(totalWeight).toFixed(3))).to.be.equal((divDec(expectedVotesTotal).toFixed(3)));
        expect((divDec(totalWeight).toFixed(5))).to.be.equal((divDec(expectedWeightTotal).toFixed(5)));
        expect(divDec(sLP1Weight).toFixed(5)).to.be.equal(divDec(expectedsLP1Total).toFixed(5));
        expect(divDec(sLP2Weight).toFixed(5)).to.be.equal(divDec(expectedsLP2Total).toFixed(5));
        expect(divDec(vLP1Weight).toFixed(5)).to.be.equal(divDec(expectedvLP1Total).toFixed(5));
        expect(divDec(vLP2Weight).toFixed(5)).to.be.equal(divDec(expectedvLP2Total).toFixed(5));

        console.log();
        console.log("Gauge Factory Status");
        console.log("Total weight", divDec(totalWeight));
        console.log("sLP1 weight", divDec(sLP1Weight));
        console.log("sLP2 weight", divDec(sLP2Weight));
        console.log("vLP1 weight", divDec(vLP1Weight));
        console.log("vLP2 weight", divDec(vLP2Weight));
        console.log();
        console.log("******************************************************");
    });

    it('Forward time by 1 week', async function () {
        console.log();
        console.log("******************************************************");
        console.log();
        await gaugeFactory.preDistribute();
        let usdfiGF = await STABLE.balanceOf(gaugeFactory.address);
        console.log("STABLE in Gauge Factory this Week", divDec(usdfiGF));
        await gaugeFactory.connect(user1).distribute(0, 4);
        await network.provider.send('evm_increaseTime', [oneWeek]);
        await network.provider.send('evm_mine');
        console.log();
        console.log("******************************************************");
    });

    it('derivedBalance and derivedSupply => ROUND 3', async function () {
        console.log("******************************************************");
        console.log();
        let derivedSupplysLP1Gauge = await sLP1Gauge.derivedSupply();
        let derivedSupplysLP2Gauge = await sLP2Gauge.derivedSupply();
        let derivedSupplyvLP1Gauge = await vLP1Gauge.derivedSupply();
        let derivedSupplyvLP2Gauge = await vLP2Gauge.derivedSupply();
        expect(divDec(derivedSupplysLP1Gauge)).to.be.greaterThan(0);
        expect(divDec(derivedSupplysLP2Gauge)).to.be.greaterThan(0);
        expect(divDec(derivedSupplyvLP1Gauge)).to.be.greaterThan(0);
        expect(divDec(derivedSupplyvLP2Gauge)).to.be.greaterThan(0);

        let derivedBalanceUser1sLP1Gauge = await sLP1Gauge.derivedBalance(user1.address);
        let derivedBalanceUser2sLP1Gauge = await sLP1Gauge.derivedBalance(user2.address);
        let derivedBalanceUser3sLP1Gauge = await sLP1Gauge.derivedBalance(user3.address);
        expect(divDec(derivedBalanceUser1sLP1Gauge)).to.be.greaterThan(0);
        expect(divDec(derivedBalanceUser2sLP1Gauge)).to.be.greaterThan(0);
        expect(divDec(derivedBalanceUser3sLP1Gauge)).to.be.greaterThan(0);

        let derivedBalanceUser1sLP2Gauge = await sLP2Gauge.derivedBalance(user1.address);
        let derivedBalanceUser2sLP2Gauge = await sLP2Gauge.derivedBalance(user2.address);
        let derivedBalanceUser3sLP2Gauge = await sLP2Gauge.derivedBalance(user3.address);
        expect(divDec(derivedBalanceUser1sLP2Gauge)).to.be.greaterThan(0);
        expect(divDec(derivedBalanceUser2sLP2Gauge)).to.be.greaterThan(0);
        expect(divDec(derivedBalanceUser3sLP2Gauge)).to.be.greaterThan(0);

        let derivedBalanceUser1vLP1Gauge = await vLP1Gauge.derivedBalance(user1.address);
        let derivedBalanceUser2vLP1Gauge = await vLP1Gauge.derivedBalance(user2.address);
        let derivedBalanceUser3vLP1Gauge = await vLP1Gauge.derivedBalance(user3.address);
        expect(divDec(derivedBalanceUser1vLP1Gauge)).to.be.greaterThan(0);
        expect(divDec(derivedBalanceUser2vLP1Gauge)).to.be.greaterThan(0);
        expect(divDec(derivedBalanceUser3vLP1Gauge)).to.be.greaterThan(0);

        let derivedBalanceUser1vLP2Gauge = await vLP2Gauge.derivedBalance(user1.address);
        let derivedBalanceUser2vLP2Gauge = await vLP2Gauge.derivedBalance(user2.address);
        let derivedBalanceUser3vLP2Gauge = await vLP2Gauge.derivedBalance(user3.address);
        expect(divDec(derivedBalanceUser1vLP2Gauge)).to.be.greaterThan(0);
        expect(divDec(derivedBalanceUser2vLP2Gauge)).to.be.greaterThan(0);
        expect(divDec(derivedBalanceUser3vLP2Gauge)).to.be.greaterThan(0);

        console.log("total derivedSupply sLP1Gauge", divDec(derivedSupplysLP1Gauge));
        console.log("total derivedSupply sLP2Gauge", divDec(derivedSupplysLP2Gauge));
        console.log("total derivedSupply vLP1Gauge", divDec(derivedSupplyvLP1Gauge));
        console.log("total derivedSupply vLP2Gauge", divDec(derivedSupplyvLP2Gauge));
        console.log();
        console.log("derived balance user 1 sLP1Gauge", divDec(derivedBalanceUser1sLP1Gauge));
        console.log("derived balance user 2 sLP1Gauge", divDec(derivedBalanceUser2sLP1Gauge));
        console.log("derived balance user 3 sLP1Gauge", divDec(derivedBalanceUser3sLP1Gauge));
        console.log();
        console.log("derived balance user 1 sLP2Gauge", divDec(derivedBalanceUser1sLP2Gauge));
        console.log("derived balance user 2 sLP2Gauge", divDec(derivedBalanceUser2sLP2Gauge));
        console.log("derived balance user 3 sLP2Gauge", divDec(derivedBalanceUser3sLP2Gauge));
        console.log();
        console.log("derived balance user 1 vLP1Gauge", divDec(derivedBalanceUser1vLP1Gauge));
        console.log("derived balance user 2 vLP1Gauge", divDec(derivedBalanceUser2vLP1Gauge));
        console.log("derived balance user 3 vLP1Gauge", divDec(derivedBalanceUser3vLP1Gauge));
        console.log();
        console.log("derived balance user 1 vLP2Gauge", divDec(derivedBalanceUser1vLP2Gauge));
        console.log("derived balance user 2 vLP2Gauge", divDec(derivedBalanceUser2vLP2Gauge));
        console.log("derived balance user 3 vLP2Gauge", divDec(derivedBalanceUser3vLP2Gauge));
        console.log();
        console.log("******************************************************");
    });

    it('User get Gauge Rewards => ROUND 3', async function () {
        console.log("******************************************************");
        console.log();

        let usdfiGP = await STABLE.balanceOf(gaugeFactory.address);
        let usdfisLP1 = await STABLE.balanceOf(sLP1Gauge.address);
        let usdfisLP2 = await STABLE.balanceOf(sLP2Gauge.address);
        let usdfivLP1 = await STABLE.balanceOf(vLP1Gauge.address);
        let usdfivLP2 = await STABLE.balanceOf(vLP2Gauge.address);

        console.log("STABLE Balances")
        console.log("GaugeFactory", divDec(usdfiGP));
        console.log("sLP1Gauge", divDec(usdfisLP1));
        console.log("sLP2Gauge", divDec(usdfisLP2));
        console.log("vLP1Gauge", divDec(usdfivLP1));
        console.log("vLP2Gauge", divDec(usdfivLP2));

        console.log();

        console.log("balanceOf gauges")
        let user1sLP1Gauge = await sLP1Gauge.balanceOf(user1.address);
        let user1sLP2Gauge = await sLP2Gauge.balanceOf(user1.address);
        let user1vLP1Gauge = await vLP1Gauge.balanceOf(user1.address);
        let user1vLP2Gauge = await vLP2Gauge.balanceOf(user1.address);

        let user2sLP1Gauge = await sLP1Gauge.balanceOf(user2.address);
        let user2sLP2Gauge = await sLP2Gauge.balanceOf(user2.address);
        let user2vLP1Gauge = await vLP1Gauge.balanceOf(user2.address);
        let user2vLP2Gauge = await vLP2Gauge.balanceOf(user2.address);

        let user3sLP1Gauge = await sLP1Gauge.balanceOf(user3.address);
        let user3sLP2Gauge = await sLP2Gauge.balanceOf(user3.address);
        let user3vLP1Gauge = await vLP1Gauge.balanceOf(user3.address);
        let user3vLP2Gauge = await vLP2Gauge.balanceOf(user3.address);

        console.log("User1 sLP1 balance in sLP1Gauge", divDec(user1sLP1Gauge));
        console.log("User1 sLP2 balance in sLP2Gauge", divDec(user1sLP2Gauge));
        console.log("User1 vLP1 balance in vLP1Gauge", divDec(user1vLP1Gauge));
        console.log("User1 vLP2 balance in vLP2Gauge", divDec(user1vLP2Gauge));
        console.log();
        console.log("User2 sLP1 balance in sLP1Gauge", divDec(user2sLP1Gauge));
        console.log("User2 sLP2 balance in sLP2Gauge", divDec(user2sLP2Gauge));
        console.log("User2 vLP1 balance in vLP1Gauge", divDec(user2vLP1Gauge));
        console.log("User2 vLP2 balance in vLP2Gauge", divDec(user2vLP2Gauge));
        console.log();
        console.log("User3 sLP1 balance in sLP1Gauge", divDec(user3sLP1Gauge));
        console.log("User3 sLP2 balance in sLP2Gauge", divDec(user3sLP2Gauge));
        console.log("User3 vLP1 balance in vLP1Gauge", divDec(user3vLP1Gauge));
        console.log("User3 vLP2 balance in vLP2Gauge", divDec(user3vLP2Gauge));
        console.log();

        expect(divDec(user1sLP1Gauge)).to.be.greaterThan(0);
        expect(divDec(user1sLP2Gauge)).to.be.greaterThan(0);
        expect(divDec(user1vLP1Gauge)).to.be.greaterThan(0);
        expect(divDec(user1vLP2Gauge)).to.be.greaterThan(0);

        expect(divDec(user2sLP1Gauge)).to.be.greaterThan(0);
        expect(divDec(user2sLP2Gauge)).to.be.greaterThan(0);
        expect(divDec(user2vLP1Gauge)).to.be.greaterThan(0);
        expect(divDec(user2vLP2Gauge)).to.be.greaterThan(0);

        expect(divDec(user3sLP1Gauge)).to.be.greaterThan(0);
        expect(divDec(user3sLP2Gauge)).to.be.greaterThan(0);
        expect(divDec(user3vLP1Gauge)).to.be.greaterThan(0);
        expect(divDec(user3vLP2Gauge)).to.be.greaterThan(0);

        console.log("User earned in gauges")
        let user1EarnedsLP1Gauge = await sLP1Gauge.earned(user1.address);
        let user1EarnedsLP2Gauge = await sLP2Gauge.earned(user1.address);
        let user1EarnedvLP1Gauge = await vLP1Gauge.earned(user1.address);
        let user1EarnedvLP2Gauge = await vLP2Gauge.earned(user1.address);

        let user2EarnedsLP1Gauge = await sLP1Gauge.earned(user2.address);
        let user2EarnedsLP2Gauge = await sLP2Gauge.earned(user2.address);
        let user2EarnedvLP1Gauge = await vLP1Gauge.earned(user2.address);
        let user2EarnedvLP2Gauge = await vLP2Gauge.earned(user2.address);

        let user3EarnedsLP1Gauge = await sLP1Gauge.earned(user3.address);
        let user3EarnedsLP2Gauge = await sLP2Gauge.earned(user3.address);
        let user3EarnedvLP1Gauge = await vLP1Gauge.earned(user3.address);
        let user3EarnedvLP2Gauge = await vLP2Gauge.earned(user3.address);

        console.log("User1 STABLE earned in sLP1Gauge", divDec(user1EarnedsLP1Gauge));
        console.log("User1 STABLE earned in sLP2Gauge", divDec(user1EarnedsLP2Gauge));
        console.log("User1 STABLE earned in vLP1Gauge", divDec(user1EarnedvLP1Gauge));
        console.log("User1 STABLE earned in vLP2Gauge", divDec(user1EarnedvLP2Gauge));
        console.log();
        console.log("User2 STABLE earned in sLP1Gauge", divDec(user2EarnedsLP1Gauge));
        console.log("User2 STABLE earned in sLP2Gauge", divDec(user2EarnedsLP2Gauge));
        console.log("User2 STABLE earned in vLP1Gauge", divDec(user2EarnedvLP1Gauge));
        console.log("User2 STABLE earned in vLP2Gauge", divDec(user2EarnedvLP2Gauge));
        console.log();
        console.log("User3 STABLE earned in sLP1Gauge", divDec(user3EarnedsLP1Gauge));
        console.log("User3 STABLE earned in sLP2Gauge", divDec(user3EarnedsLP2Gauge));
        console.log("User3 STABLE earned in vLP1Gauge", divDec(user3EarnedvLP1Gauge));
        console.log("User3 STABLE earned in vLP2Gauge", divDec(user3EarnedvLP2Gauge));
        console.log();

        expect(divDec(user1EarnedsLP1Gauge)).to.be.greaterThan(0);
        expect(divDec(user1EarnedsLP2Gauge)).to.be.greaterThan(0);
        expect(divDec(user1EarnedvLP1Gauge)).to.be.greaterThan(0);
        expect(divDec(user1EarnedvLP2Gauge)).to.be.greaterThan(0);

        expect(divDec(user2EarnedsLP1Gauge)).to.be.greaterThan(0);
        expect(divDec(user2EarnedsLP2Gauge)).to.be.greaterThan(0);
        expect(divDec(user2EarnedvLP1Gauge)).to.be.greaterThan(0);
        expect(divDec(user2EarnedvLP2Gauge)).to.be.greaterThan(0);

        expect(divDec(user3EarnedsLP1Gauge)).to.be.greaterThan(0);
        expect(divDec(user3EarnedsLP2Gauge)).to.be.greaterThan(0);
        expect(divDec(user3EarnedvLP1Gauge)).to.be.greaterThan(0);
        expect(divDec(user3EarnedvLP2Gauge)).to.be.greaterThan(0);

        await sLP1Gauge.connect(user1).getReward();
        await sLP2Gauge.connect(user1).getReward();
        await vLP1Gauge.connect(user1).getReward();
        await vLP2Gauge.connect(user1).getReward();

        await sLP1Gauge.connect(user2).getReward();
        await sLP2Gauge.connect(user2).getReward();
        await vLP1Gauge.connect(user2).getReward();
        await vLP2Gauge.connect(user2).getReward();

        await sLP1Gauge.connect(user3).getReward();
        await sLP2Gauge.connect(user3).getReward();
        await vLP1Gauge.connect(user3).getReward();
        await vLP2Gauge.connect(user3).getReward();

        let stableUser1 = await STABLE.balanceOf(user1.address);
        let stableUser2 = await STABLE.balanceOf(user2.address);
        let stableUser3 = await STABLE.balanceOf(user3.address);

        console.log("User claim earned to address")
        console.log("User1 STABLE bal", divDec(stableUser1));
        console.log("User2 STABLE bal", divDec(stableUser2));
        console.log("User3 STABLE bal", divDec(stableUser3));

        expect(divDec(stableUser1)).to.be.greaterThan(0);
        expect(divDec(stableUser2)).to.be.greaterThan(0);
        expect(divDec(stableUser3)).to.be.greaterThan(0);

        await STABLE.connect(user1).transfer(burn.address, stableUser1);
        await STABLE.connect(user2).transfer(burn.address, stableUser2);
        await STABLE.connect(user3).transfer(burn.address, stableUser3);
        console.log();
        console.log("User STABLE balances sent to brun address (reset)");
    });

    it('Testing Voting Weight and Bribe balances', async function () {
        console.log("******************************************************");
        console.log();
        let sLP1VoteWeight = await gaugeFactory.weights(sLP1.address);
        let sLP2VoteWeight = await gaugeFactory.weights(sLP2.address);
        let vLP1VoteWeight = await gaugeFactory.weights(vLP1.address);
        let vLP2VoteWeight = await gaugeFactory.weights(vLP2.address);

        let sLP1BribeTotalBal = await sLP1Bribe.totalSupply();
        let sLP2BribeTotalBal = await sLP2Bribe.totalSupply();

        let vLP1BribeTotalBal = await vLP1Bribe.totalSupply();
        let vLP2BribeTotalBal = await vLP2Bribe.totalSupply();

        expect(sLP1VoteWeight).to.be.equal(sLP1BribeTotalBal);
        expect(sLP2VoteWeight).to.be.equal(sLP2BribeTotalBal);
        expect(vLP1VoteWeight).to.be.equal(vLP1BribeTotalBal);
        expect(vLP2VoteWeight).to.be.equal(vLP2BribeTotalBal);

        console.log("sLP1Gauge vote weight", divDec(sLP1VoteWeight));
        console.log("sLP2Gauge vote weight", divDec(sLP2VoteWeight));
        console.log("vLP1Gauge vote weight", divDec(vLP1VoteWeight));
        console.log("vLP2Gauge vote weight", divDec(vLP2VoteWeight));

        console.log("sLP1Bribe total balance", divDec(sLP1BribeTotalBal));
        console.log("sLP2Bribe total balance", divDec(sLP2BribeTotalBal));
        console.log("vLP1Bribe total balance", divDec(vLP1BribeTotalBal));
        console.log("vLP2Bribe total balance", divDec(vLP2BribeTotalBal));

        console.log("Bribe total balances match voting weights");
        console.log();
        console.log("******************************************************");
    });

    it('Owner does a bunch of swaps on vLP1', async function () {
        console.log("******************************************************");
        console.log();
        console.log("Owner does a bunch of swaps on vLP1");

        await WETH.connect(owner).approve(router.address, fifty);
        let bevorSwap1WETH = await WETH.balanceOf(owner.address);
        let bevorSwap1TK1 = await TK1.balanceOf(owner.address);
        await router.connect(owner).swapExactTokensForTokensSimple(fifty, 0, WETH.address, TK1.address, false, owner.address, 1685083888);
        let afterSwap1WETH = await WETH.balanceOf(owner.address);
        let afterSwap1TK1 = await TK1.balanceOf(owner.address);
        expect(divDec(bevorSwap1WETH)).to.be.greaterThan(divDec(afterSwap1WETH));
        expect(divDec(bevorSwap1TK1)).to.be.lessThan(divDec(afterSwap1TK1));
        
        await TK1.connect(owner).approve(router.address, fifty);
        let bevorSwap2TK1 = await TK1.balanceOf(owner.address);
        let bevorSwap2WETH = await WETH.balanceOf(owner.address);
        await router.connect(owner).swapExactTokensForTokensSimple(fifty, 0, TK1.address, WETH.address, false, owner.address, 1685083888);
        let afterSwap2TK1 = await TK1.balanceOf(owner.address);
        let afterSwap2WETH = await WETH.balanceOf(owner.address);
        expect(divDec(bevorSwap2TK1)).to.be.greaterThan(divDec(afterSwap2TK1));
        expect(divDec(bevorSwap2WETH)).to.be.lessThan(divDec(afterSwap2WETH));

        await WETH.connect(owner).approve(router.address, fifty);
        let bevorSwap3WETH = await WETH.balanceOf(owner.address);
        let bevorSwap3TK1 = await TK1.balanceOf(owner.address);
        await router.connect(owner).swapExactTokensForTokensSimple(fifty, 0, WETH.address, TK1.address, false, owner.address, 1685083888);
        let afterSwap3TK1 = await TK1.balanceOf(owner.address);
        let afterSwap3WETH = await WETH.balanceOf(owner.address);
        expect(divDec(bevorSwap3WETH)).to.be.greaterThan(divDec(afterSwap3WETH));
        expect(divDec(bevorSwap3TK1)).to.be.lessThan(divDec(afterSwap3TK1));

        await TK1.connect(owner).approve(router.address, fifty);
        let bevorSwap4TK1 = await TK1.balanceOf(owner.address);
        let bevorSwap4WETH = await WETH.balanceOf(owner.address);
        await router.connect(owner).swapExactTokensForTokensSimple(fifty, 0, TK1.address, WETH.address, false, owner.address, 1685083888);
        let afterSwap4TK1 = await TK1.balanceOf(owner.address);
        let afterSwap4WETH = await WETH.balanceOf(owner.address);
        expect(divDec(bevorSwap4TK1)).to.be.greaterThan(divDec(afterSwap4TK1));
        expect(divDec(bevorSwap4WETH)).to.be.lessThan(divDec(afterSwap4WETH));

        await WETH.connect(owner).approve(router.address, fifty);
        let bevorSwap5WETH = await WETH.balanceOf(owner.address);
        let bevorSwap5TK1 = await TK1.balanceOf(owner.address);
        await router.connect(owner).swapExactTokensForTokensSimple(fifty, 0, WETH.address, TK1.address, false, owner.address, 1685083888);
        let afterSwap5TK1 = await TK1.balanceOf(owner.address);
        let afterSwap5WETH = await WETH.balanceOf(owner.address);
        expect(divDec(bevorSwap5WETH)).to.be.greaterThan(divDec(afterSwap5WETH));
        expect(divDec(bevorSwap5TK1)).to.be.lessThan(divDec(afterSwap5TK1));

        await TK1.connect(owner).approve(router.address, fifty);
        let bevorSwap6TK1 = await TK1.balanceOf(owner.address);
        let bevorSwap6WETH = await WETH.balanceOf(owner.address);
        await router.connect(owner).swapExactTokensForTokensSimple(fifty, 0, TK1.address, WETH.address, false, owner.address, 1685083888);
        let afterSwap6TK1 = await TK1.balanceOf(owner.address);
        let afterSwap6WETH = await WETH.balanceOf(owner.address);
        expect(divDec(bevorSwap6TK1)).to.be.greaterThan(divDec(afterSwap6TK1));
        expect(divDec(bevorSwap6WETH)).to.be.lessThan(divDec(afterSwap6WETH));

        await WETH.connect(owner).approve(router.address, fifty);
        let bevorSwap7WETH = await WETH.balanceOf(owner.address);
        let bevorSwap7TK1 = await TK1.balanceOf(owner.address);
        await router.connect(owner).swapExactTokensForTokensSimple(fifty, 0, WETH.address, TK1.address, false, owner.address, 1685083888);
        let afterSwap7TK1 = await TK1.balanceOf(owner.address);
        let afterSwap7WETH = await WETH.balanceOf(owner.address);
        expect(divDec(bevorSwap7WETH)).to.be.greaterThan(divDec(afterSwap7WETH));
        expect(divDec(bevorSwap7TK1)).to.be.lessThan(divDec(afterSwap7TK1));

        await TK1.connect(owner).approve(router.address, fifty);
        let bevorSwap8TK1 = await TK1.balanceOf(owner.address);
        let bevorSwap8WETH = await WETH.balanceOf(owner.address);
        await router.connect(owner).swapExactTokensForTokensSimple(fifty, 0, TK1.address, WETH.address, false, owner.address, 1685083888);
        let afterSwap8TK1 = await TK1.balanceOf(owner.address);
        let afterSwap8WETH = await WETH.balanceOf(owner.address);
        expect(divDec(bevorSwap8TK1)).to.be.greaterThan(divDec(afterSwap8TK1));
        expect(divDec(bevorSwap8WETH)).to.be.lessThan(divDec(afterSwap8WETH));

        await WETH.connect(owner).approve(router.address, fifty);
        let bevorSwap9WETH = await WETH.balanceOf(owner.address);
        let bevorSwap9TK1 = await TK1.balanceOf(owner.address);
        await router.connect(owner).swapExactTokensForTokensSimple(fifty, 0, WETH.address, TK1.address, false, owner.address, 1685083888);
        let afterSwap9TK1 = await TK1.balanceOf(owner.address);
        let afterSwap9WETH = await WETH.balanceOf(owner.address);
        expect(divDec(bevorSwap9WETH)).to.be.greaterThan(divDec(afterSwap9WETH));
        expect(divDec(bevorSwap9TK1)).to.be.lessThan(divDec(afterSwap9TK1));

        await TK1.connect(owner).approve(router.address, fifty);
        let bevorSwap10TK1 = await TK1.balanceOf(owner.address);
        let bevorSwap10WETH = await WETH.balanceOf(owner.address);
        await router.connect(owner).swapExactTokensForTokensSimple(fifty, 0, TK1.address, WETH.address, false, owner.address, 1685083888);
        let afterSwap10TK1 = await TK1.balanceOf(owner.address);
        let afterSwap10WETH = await WETH.balanceOf(owner.address);
        expect(divDec(bevorSwap10TK1)).to.be.greaterThan(divDec(afterSwap10TK1));
        expect(divDec(bevorSwap10WETH)).to.be.lessThan(divDec(afterSwap10WETH));

        console.log();
        console.log("******************************************************");
    });

    it('claimVotingFees vLP1Bribe', async function () {
        console.log("******************************************************");
        console.log("BRIBE TEST #3");
        console.log("******************************************************");

        await expect(await WETH.balanceOf(usdfiMaker.address)).to.be.above(0);
        await expect(await TK1.balanceOf(usdfiMaker.address)).to.be.above(0);

        await expect(await WETH.balanceOf(protocol1.address)).to.be.equal(0);
        await expect(await TK1.balanceOf(protocol1.address)).to.be.equal(0);

        await expect(await WETH.balanceOf(vLP1Bribe.address)).to.be.above(0);
        await expect(await TK1.balanceOf(vLP1Bribe.address)).to.be.above(0);

        await vLP1Gauge.claimVotingFees();

        // fee 20
        await expect(await WETH.balanceOf(usdfiMaker.address)).to.be.above(0);
        await expect(await TK1.balanceOf(usdfiMaker.address)).to.be.above(0);

        // fee 0
        await expect(await WETH.balanceOf(protocol1.address)).to.be.equal(0);
        await expect(await TK1.balanceOf(protocol1.address)).to.be.equal(0);

        // fee 80
        await expect(await WETH.balanceOf(vLP1Bribe.address)).to.be.above(0);
        await expect(await TK1.balanceOf(vLP1Bribe.address)).to.be.above(0);

        let epochNow = await vLP1Bribe.getEpoch();
        let epochNext = await Number(epochNow) + 1;

        let rewardWETH = (await vLP1Bribe.rewardData(WETH.address, epochNext)).rewardsPerEpoch;
        let rewardTK1 = (await vLP1Bribe.rewardData(TK1.address, epochNext)).rewardsPerEpoch;

        console.log("epochNow", Number(epochNow));
        console.log("WETH bribes next Epoch", divDec(rewardWETH));
        console.log("TK1 bribes next Epoch", divDec(rewardTK1));

        // Test extra reward from User
        TK1.connect(briber).approve(vLP1Bribe.address, fifty)
        await expect(vLP1Bribe.connect(briber).notifyRewardAmount(TK1.address, fifty)).to.be.revertedWith("SafeERC20: low-level call failed");
        console.log("briber has not enough coins (-fifty coins)");

        rewardTK1 = (await vLP1Bribe.rewardData(TK1.address, epochNext)).rewardsPerEpoch;
        console.log("TK1 bribes next Epoch", divDec(rewardTK1));
        console.log();
        console.log("******************************************************");
    });

    it('User Claim Bribes => ROUND 3', async function () {
            console.log("******************************************************");
            console.log();
            let User1vLP1BribeEarnedEpoch0 = await vLP1Bribe._earned(user1.address, TK1.address, 0)
            let User1vLP1BribeEarnedEpoch1 = await vLP1Bribe._earned(user1.address, TK1.address, 1)
            let User1vLP1BribeEarnedEpoch2 = await vLP1Bribe._earned(user1.address, TK1.address, 2)
            let User1vLP1BribeEarnedEpoch3 = await vLP1Bribe._earned(user1.address, TK1.address, 3)
            let User1vLP1BribeEarnedEpoch4 = await vLP1Bribe._earned(user1.address, TK1.address, 4)
            let User1vLP1BribeEarnedEpoch5 = await vLP1Bribe._earned(user1.address, TK1.address, 5)
            let User1vLP1BribeEarnedEpoch6 = await vLP1Bribe._earned(user1.address, TK1.address, 6)

            let User2vLP1BribeEarnedEpoch0 = await vLP1Bribe._earned(user2.address, TK1.address, 0)
            let User2vLP1BribeEarnedEpoch1 = await vLP1Bribe._earned(user2.address, TK1.address, 1)
            let User2vLP1BribeEarnedEpoch2 = await vLP1Bribe._earned(user2.address, TK1.address, 2)
            let User2vLP1BribeEarnedEpoch3 = await vLP1Bribe._earned(user2.address, TK1.address, 3)
            let User2vLP1BribeEarnedEpoch4 = await vLP1Bribe._earned(user2.address, TK1.address, 4)
            let User2vLP1BribeEarnedEpoch5 = await vLP1Bribe._earned(user2.address, TK1.address, 5)
            let User2vLP1BribeEarnedEpoch6 = await vLP1Bribe._earned(user2.address, TK1.address, 6)

            let User3vLP1BribeEarnedEpoch0 = await vLP1Bribe._earned(user3.address, TK1.address, 0)
            let User3vLP1BribeEarnedEpoch1 = await vLP1Bribe._earned(user3.address, TK1.address, 1)
            let User3vLP1BribeEarnedEpoch2 = await vLP1Bribe._earned(user3.address, TK1.address, 2)
            let User3vLP1BribeEarnedEpoch3 = await vLP1Bribe._earned(user3.address, TK1.address, 3)
            let User3vLP1BribeEarnedEpoch4 = await vLP1Bribe._earned(user3.address, TK1.address, 4)
            let User3vLP1BribeEarnedEpoch5 = await vLP1Bribe._earned(user3.address, TK1.address, 5)
            let User3vLP1BribeEarnedEpoch6 = await vLP1Bribe._earned(user3.address, TK1.address, 6)

            console.log("");
            console.log("Intern _earned estimated");
            console.log( "User1 earned in vLP1Bribe - Epoch 0", await divDec(User1vLP1BribeEarnedEpoch0));
            console.log( "User1 earned in vLP1Bribe - Epoch 1", await divDec(User1vLP1BribeEarnedEpoch1));
            console.log( "User1 earned in vLP1Bribe - Epoch 2", await divDec(User1vLP1BribeEarnedEpoch2));
            console.log( "User1 earned in vLP1Bribe - Epoch 3", await divDec(User1vLP1BribeEarnedEpoch3));
            console.log( "User1 earned in vLP1Bribe - Epoch 4", await divDec(User1vLP1BribeEarnedEpoch4));
            console.log( "User1 earned in vLP1Bribe - Epoch 5", await divDec(User1vLP1BribeEarnedEpoch5));
            console.log( "User1 earned in vLP1Bribe - Epoch 6", await divDec(User1vLP1BribeEarnedEpoch6));
            console.log("");
            console.log( "User2 earned in vLP1Bribe - Epoch 0", await divDec(User2vLP1BribeEarnedEpoch0));
            console.log( "User2 earned in vLP1Bribe - Epoch 1", await divDec(User2vLP1BribeEarnedEpoch1));
            console.log( "User2 earned in vLP1Bribe - Epoch 2", await divDec(User2vLP1BribeEarnedEpoch2));
            console.log( "User2 earned in vLP1Bribe - Epoch 3", await divDec(User2vLP1BribeEarnedEpoch3));
            console.log( "User2 earned in vLP1Bribe - Epoch 4", await divDec(User2vLP1BribeEarnedEpoch4));
            console.log( "User2 earned in vLP1Bribe - Epoch 5", await divDec(User2vLP1BribeEarnedEpoch5));
            console.log( "User2 earned in vLP1Bribe - Epoch 6", await divDec(User2vLP1BribeEarnedEpoch6));
            console.log("");
            console.log( "User3 earned in vLP1Bribe - Epoch 0", await divDec(User3vLP1BribeEarnedEpoch0));
            console.log( "User3 earned in vLP1Bribe - Epoch 1", await divDec(User3vLP1BribeEarnedEpoch1));
            console.log( "User3 earned in vLP1Bribe - Epoch 2", await divDec(User3vLP1BribeEarnedEpoch2));
            console.log( "User3 earned in vLP1Bribe - Epoch 3", await divDec(User3vLP1BribeEarnedEpoch3));
            console.log( "User3 earned in vLP1Bribe - Epoch 4", await divDec(User3vLP1BribeEarnedEpoch4));
            console.log( "User3 earned in vLP1Bribe - Epoch 5", await divDec(User3vLP1BribeEarnedEpoch5));
            console.log( "User3 earned in vLP1Bribe - Epoch 6", await divDec(User3vLP1BribeEarnedEpoch6));
            console.log("");

            expect(divDec(User1vLP1BribeEarnedEpoch0)).to.be.equal(0);
            expect(divDec(User1vLP1BribeEarnedEpoch1)).to.be.equal(0);
            expect(divDec(User1vLP1BribeEarnedEpoch2)).to.be.equal(0);
            expect(divDec(User1vLP1BribeEarnedEpoch3)).to.be.equal(0);
            expect(divDec(User1vLP1BribeEarnedEpoch4)).to.be.equal(0);
            expect(divDec(User1vLP1BribeEarnedEpoch5)).to.be.equal(0);
            expect(divDec(User1vLP1BribeEarnedEpoch6)).to.be.equal(0);

            expect(divDec(User2vLP1BribeEarnedEpoch0)).to.be.equal(0);
            expect(divDec(User2vLP1BribeEarnedEpoch1)).to.be.equal(0);
            expect(divDec(User2vLP1BribeEarnedEpoch2)).to.be.equal(0);
            expect(divDec(User2vLP1BribeEarnedEpoch3)).to.be.equal(0);
            expect(divDec(User2vLP1BribeEarnedEpoch4)).to.be.greaterThan(0);
            expect(divDec(User2vLP1BribeEarnedEpoch5)).to.be.greaterThan(0);
            expect(divDec(User2vLP1BribeEarnedEpoch6)).to.be.equal(0);

            expect(divDec(User3vLP1BribeEarnedEpoch0)).to.be.equal(0);
            expect(divDec(User3vLP1BribeEarnedEpoch1)).to.be.equal(0);
            expect(divDec(User3vLP1BribeEarnedEpoch2)).to.be.equal(0);
            expect(divDec(User3vLP1BribeEarnedEpoch3)).to.be.equal(0);
            expect(divDec(User3vLP1BribeEarnedEpoch4)).to.be.greaterThan(0);
            expect(divDec(User3vLP1BribeEarnedEpoch5)).to.be.greaterThan(0);
            expect(divDec(User3vLP1BribeEarnedEpoch6)).to.be.equal(0);
    
            let user1WETHbevor = await WETH.balanceOf(user1.address)
            let user1TK1bevor = await TK1.balanceOf(user1.address)
            console.log("User1 WETH balance after claim", divDec(user1WETHbevor));
            console.log("User1 TK1 balance after claim", divDec(user1TK1bevor));

            let user2WETHbevor = await WETH.balanceOf(user2.address)
            let user2TK1bevor = await TK1.balanceOf(user2.address)
            console.log("User2 WETH balance after claim", divDec(user2WETHbevor));
            console.log("User2 TK1 balance after claim", divDec(user2TK1bevor));

            let user3WETHbevor = await WETH.balanceOf(user3.address)
            let user3TK1bevor = await TK1.balanceOf(user3.address)
            console.log("User3 WETH balance after claim", divDec(user3WETHbevor));
            console.log("User3 TK1 balance after claim", divDec(user3TK1bevor));
            console.log("");
            await vLP1Bribe.connect(user1).getReward();
            await vLP1Bribe.connect(user2).getReward();
            await vLP1Bribe.connect(user3).getReward();

            console.log("");
            let user1WETHafter = await WETH.balanceOf(user1.address)
            let user1TK1after = await TK1.balanceOf(user1.address)
            console.log("User1 WETH balance after claim", divDec(user1WETHafter));
            console.log("User1 TK1 balance after claim", divDec(user1TK1after));

            let user2WETHafter = await WETH.balanceOf(user2.address)
            let user2TK1after = await TK1.balanceOf(user2.address)
            console.log("User2 WETH balance after claim", divDec(user2WETHafter));
            console.log("User2 TK1 balance after claim", divDec(user2TK1after));

            let user3WETHafter = await WETH.balanceOf(user3.address)
            let user3TK1after = await TK1.balanceOf(user3.address)
            console.log("User3 WETH balance after claim", divDec(user3WETHafter));
            console.log("User3 TK1 balance after claim", divDec(user3TK1after));

            expect(user1WETHafter).to.be.equal(0);
            expect(user1TK1after).to.be.equal(0);
            expect(user2WETHafter).to.be.above(0);
            expect(user2TK1after).to.be.above(0);
            expect(user3WETHafter).to.be.above(0);
            expect(user3TK1after).to.be.above(0);
            console.log();
            console.log("******************************************************");
    });

    it('END => ROUND 3', async function () {
        console.log();
        console.log("******************************************************************************************************************************************************************");
        console.log("******************************************************************************************************************************************************************");
        console.log();
    });

    it('all tests to revert', async function () {
        console.log("******************************************************");
        console.log();
        await expect(pairFactory.connect(user2).setAdmins(user1.address, user1.address, user1.address)).to.be.reverted;
        await expect(pairFactory.connect(user2).setOwner(admin.address)).to.be.reverted;
        await expect(pairFactory.connect(user2).setBaseStableFee(1000)).to.be.reverted;
        await expect(pairFactory.connect(user2).setBaseVariableFee(1000)).to.be.reverted;
        await expect(pairFactory.connect(user2).setMaxGasPrice(5)).to.be.reverted;
        await expect(pairFactory.connect(user2).setPause(true)).to.be.reverted;
        await expect(pairFactory.connect(user2).setProtocolAddress(TK1, user1.address)).to.be.reverted;

        await expect(gaugeFactory.connect(user2).setGovernance(admin.address)).to.be.reverted;
        await expect(gaugeFactory.connect(user2).acceptGovernance(admin.address)).to.be.reverted;
        await expect(gaugeFactory.connect(user2).addGauge(LP3.address)).to.be.reverted;
        await expect(gaugeFactory.addGauge((sLP1.address, 100000))).to.be.reverted;
        await expect(gaugeFactory.connect(user2).resurrectGauge(sLP1.address)).to.be.reverted;
        await expect(gaugeFactory.connect(user2).deprecateGauge(sLP1.address)).to.be.reverted;
        await expect(gaugeFactory.connect(user2).setAdminAndVoter(user1.address, user1.address)).to.be.reverted;
        await expect(gaugeFactory.connect(user2).poke(user1.address)).to.be.reverted;
        await expect(gaugeFactory.connect(user2).setStableMiner(user1.address)).to.be.reverted;
        await expect(gaugeFactory.connect(user2).updateBaseReferrals(user1.address, user1.address, user1.address)).to.be.reverted;
        await expect(gaugeFactory.connect(user2).updateMaxVotesToken(1, 500)).to.be.reverted;
        await expect(gaugeFactory.connect(user2).updatePokeDelay(500)).to.be.reverted;
        await expect(gaugeFactory.connect(user2).updateVeProxy(user1.address)).to.be.reverted;

        await expect(vLP1Gauge.connect(user2).deposit(10000000)).to.be.reverted;
        await expect(vLP1Gauge.connect(user2).withdraw(oneHundredThousand)).to.be.reverted; 
        await expect(vLP1Gauge.connect(user2).depositFor(10000000, user1.address)).to.be.reverted;
        await expect(vLP1Gauge.connect(user2).notifyRewardAmount(TK1, 10000000)).to.be.reverted;
        await expect(vLP1Gauge.connect(user2).updateReferral(user1.address, 10000, [1000, 5000, 4000])).to.be.reverted;

        await expect(vLP1.connect(user2).burn(user1.address)).to.be.reverted;
        await expect(vLP1.connect(user2).mint(user1.address)).to.be.reverted;
        await expect(vLP1.connect(user2).setFee(100)).to.be.reverted;
        console.log();
        console.log("******************************************************");
    });

});















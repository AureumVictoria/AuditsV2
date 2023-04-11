
const convert = (amount, decimals) => ethers.utils.parseUnits(amount, decimals);
const divDec = (amount, decimals = 18) => amount/10**decimals;
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
const fiveHundred = convert('500', 18);
const eightHundred = convert('800', 18);
const oneThousand = convert('1000', 18);
const tenThousand = convert('10000', 18);
const oneWeek = 604800;
const oneday = 24*3600;
const twodays = 2*24*3600;
const startTime = Math.floor(Date.now() / 1000);

// users
let owner, admin, user1, user2, protocol1, protocol2, treasury;
// contracts
let pairFactory, router, usdfiMaker;
let vLP1, vLP1Fees, vLP2, vLP2Fees;
let sLP1, sLP1Fees, sLP2, sLP2Fees;
let aLP1, aLP1Fees, aLP2, aLP2Fees;
// tokens
let STABLE, veSTABLE, WETH, TK1, TK2, USDC, USD1, USD2;

describe("AMM Testing", function () {
  
    before("Initial set up", async function () {
        console.log("Begin Initialization");

        // initialize users
        [owner, admin, user1, user2, protocol1, protocol2, usdfiMaker, treasury, stableMinter, mainRefFeeReceiver] = await ethers.getSigners();

        // initialize tokens
        const WETHMock = await ethers.getContractFactory("WrappedEth");
        WETH = await WETHMock.deploy();
        await WETH.deposit({value: oneThousand});

        // mints 1000 tokens to deployer
        const erc20Mock = await ethers.getContractFactory("ERC20Mock");
        // WETH = await erc20Mock.deploy("WETH", "WETH");
        TK1 = await erc20Mock.deploy("TK1", "TK1");
        TK2 = await erc20Mock.deploy("TK2", "TK2");
        USDC = await erc20Mock.deploy("USDC", "USDC");
        USD1 = await erc20Mock.deploy("USD1", "USD1");
        USD2 = await erc20Mock.deploy("USD2", "USD2");
        console.log("- Tokens Initialized");

        await WETH.transfer(user1.address, oneHundred);
        await TK1.transfer(user1.address, oneHundred);
        await WETH.transfer(user2.address, oneHundred);
        await USDC.transfer(user2.address, oneHundred);

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
        await router.connect(owner).addLiquidityBNB(TK1.address, false, oneHundred, oneHundred, oneHundred, owner.address, "1000000000000", {value: oneHundred});        

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
       
        // Initialize gaugeFactory
        const gaugeFactoryArtifact = await ethers.getContractFactory("GaugeFactory");
        const gaugeFactoryContract = await gaugeFactoryArtifact.deploy( STABLE.address, veSTABLE.address, bribeFactory.address, stableMinter.address, 1, referrals.address, mainRefFeeReceiver.address)// ,refferals.address,);
        gaugeFactory = await ethers.getContractAt("GaugeFactory", gaugeFactoryContract.address);
        console.log("- Gauge Factory Initialized");

        console.log("Initialization Complete 2");
    });

    it('LP Pair Status', async function () {
        console.log();
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

    });

    it('set Base ref', async function () {
        console.log();
        console.log("******************************************************");
        console.log();
        await referrals.transferOwnership(admin.address);
        expect(await referrals.owner()).to.be.equal(admin.address);
        await referrals.connect(admin).addMember(user1.address, user1.address);
        console.log(await referrals.lastMember());
        expect(await referrals.lastMember()).to.be.equal(1);
        console.log(await referrals.isMember(user1.address));
        expect(await referrals.isMember(user1.address)).to.be.equal(true);
        console.log(await referrals.getSponsor(user1.address));
        expect(await referrals.getSponsor(user1.address)).to.be.equal(user1.address);
    });

});
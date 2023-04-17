
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
const twoHundredAndFifty = convert('250', 18);
const fiveHundred = convert('500', 18);
const eightHundred = convert('800', 18);
const oneThousand = convert('1000', 18);
const tenThousand = convert('10000', 18);
const oneHundredThousand = convert('100000', 18);
const April2026 = '1775068986';
const May2026 = '1776278586'
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
let STABLE, veSTABLE, WETH, TK1, TK2, USDC, USD1, USD2, LP1, LP2, LP3, LP4;

describe("AMM Testing", function () {
  
    before("Initial set up", async function () {
        console.log("Begin Initialization");

        // initialize users
        [owner, admin, user1, user2, user3, protocol1, protocol2, usdfiMaker, treasury, mainRefFeeReceiver] = await ethers.getSigners();

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

        // Initialize pairFactory
        const stableMinterArtifact = await ethers.getContractFactory("StableMinter");
        const stableMinterContract = await stableMinterArtifact.deploy(STABLE.address);
        stableMinter = await ethers.getContractAt("StableMinter", stableMinterContract.address);
        console.log("- Stable MinterInitialized");

        // Initialize gaugeFactory
        const gaugeFactoryArtifact = await ethers.getContractFactory("GaugeFactory");
        const gaugeFactoryContract = await gaugeFactoryArtifact.deploy( STABLE.address, veSTABLE.address, bribeFactory.address, stableMinter.address, 1, referrals.address, mainRefFeeReceiver.address)// ,refferals.address,);
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
        console.log("******************************************************");

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
        console.log("referrals.lastMember", await referrals.lastMember());
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

   let sLP1GaugeAddr = await gaugeFactory.getGauge(sLP1.address);
   console.log("getGauge sLP1", await gaugeFactory.getGauge(sLP1.address));
   sLP1Gauge = await ethers.getContractAt("contracts/GaugeFactory/GaugeFactory.sol:Gauge", sLP1GaugeAddr);

   let sLP2GaugeAddr = await gaugeFactory.getGauge(sLP2.address);
   console.log("getGauge sLP2", await gaugeFactory.getGauge(sLP2.address));
   sLP2Gauge = await ethers.getContractAt("contracts/GaugeFactory/GaugeFactory.sol:Gauge", sLP2GaugeAddr);

   let vLP1GaugeAddr = await gaugeFactory.getGauge(vLP1.address);
   console.log("getGauge vLP1", await gaugeFactory.getGauge(vLP1.address));
   vLP1Gauge = await ethers.getContractAt("contracts/GaugeFactory/GaugeFactory.sol:Gauge", vLP1GaugeAddr);

   let vLP2GaugeAddr = await gaugeFactory.getGauge(vLP2.address);
   console.log("getGauge vLP2", await gaugeFactory.getGauge(vLP2.address));
   vLP2Gauge = await ethers.getContractAt("contracts/GaugeFactory/GaugeFactory.sol:Gauge", vLP2GaugeAddr);

    // Owner locks in 1000 SPIRIT for veSTABLE
    await STABLE.setFreeMintSupplyCom(owner.address, oneHundredThousand);
    await STABLE.mint(owner.address, tenThousand);
    await STABLE.mint(stableMinter.address, tenThousand);
    await STABLE.mint(user1.address, tenThousand);
    await STABLE.mint(user2.address, tenThousand);
    await STABLE.mint(user3.address, tenThousand);
    await STABLE.approve(veSTABLE.address, tenThousand);
    await veSTABLE.create_lock(oneThousand, April2026);
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
    expect(await sLP1.balanceOf(user1.address)).to.be.equal("100000000000000000000");
    console.log("balance User1 - sLP1", await sLP1.balanceOf(user1.address)); 
    await router.connect(user1).addLiquidity(USDC.address, USD2.address, true, oneHundred, oneHundred, oneHundred, oneHundred, user1.address, "1000000000000");
    expect(await sLP2.balanceOf(user1.address)).to.be.equal("100000000000000000000");
    console.log("balance User1 - sLP2", await sLP2.balanceOf(user1.address)); 
    await router.connect(user1).addLiquidityBNB(TK1.address, false, oneHundred, oneHundred, oneHundred, user1.address, "1000000000000", {value: oneHundred});  
    expect(await vLP1.balanceOf(user1.address)).to.be.equal("100000000000000000000");
    console.log("balance User1 - vLP1", await vLP1.balanceOf(user1.address));      
    await router.connect(user1).addLiquidity(WETH.address, USDC.address, false, oneHundred, oneHundred, oneHundred, oneHundred, user1.address, "1000000000000");
    expect(await vLP2.balanceOf(user1.address)).to.be.equal("100000000000000000000");    
    console.log("balance User1 - vLP2", await vLP2.balanceOf(user1.address)); 

    console.log();

    await TK1.connect(user2).approve(router.address, twoHundred);
    await WETH.connect(user2).approve(router.address, twoHundred);
    await USDC.connect(user2).approve(router.address, fiveHundred);
    await USD1.connect(user2).approve(router.address, twoHundred);
    await USD2.connect(user2).approve(router.address, twoHundred);

    await router.connect(user2).addLiquidity(USDC.address, USD1.address, true, oneHundred, oneHundred, oneHundred, oneHundred, user2.address, "1000000000000");
    expect(await sLP1.balanceOf(user2.address)).to.be.equal("100000000000000000000");
    console.log("balance User2 - sLP1", await sLP1.balanceOf(user2.address));      
    await router.connect(user2).addLiquidity(USDC.address, USD2.address, true, oneHundred, oneHundred, oneHundred, oneHundred, user2.address, "1000000000000");
    expect(await sLP2.balanceOf(user2.address)).to.be.equal("100000000000000000000");
    console.log("balance User2 - sLP2", await sLP2.balanceOf(user2.address));    
    await router.connect(user2).addLiquidityBNB(TK1.address, false, oneHundred, oneHundred, oneHundred, user2.address, "1000000000000", {value: oneHundred}); 
    expect(await vLP1.balanceOf(user2.address)).to.be.equal("100000000000000000000");
    console.log("balance User2 - vLP1", await vLP1.balanceOf(user2.address));             
    await router.connect(user2).addLiquidity(WETH.address, USDC.address, false, oneHundred, oneHundred, oneHundred, oneHundred, user2.address, "1000000000000");
    expect(await vLP2.balanceOf(user2.address)).to.be.equal("100000000000000000000");
    console.log("balance User2 - vLP2", await vLP2.balanceOf(user2.address));            

    console.log();

    await TK1.connect(user3).approve(router.address, twoHundred);
    await WETH.connect(user3).approve(router.address, twoHundred);
    await USDC.connect(user3).approve(router.address, fiveHundred);
    await USD1.connect(user3).approve(router.address, twoHundred);
    await USD2.connect(user3).approve(router.address, twoHundred);

    await router.connect(user3).addLiquidity(USDC.address, USD1.address, true, oneHundred, oneHundred, oneHundred, oneHundred, user3.address, "1000000000000");
    expect(await sLP1.balanceOf(user3.address)).to.be.equal("100000000000000000000");
    console.log("balance User3 - sLP1", await sLP1.balanceOf(user3.address));      
    await router.connect(user3).addLiquidity(USDC.address, USD2.address, true, oneHundred, oneHundred, oneHundred, oneHundred, user3.address, "1000000000000");
    expect(await sLP2.balanceOf(user3.address)).to.be.equal("100000000000000000000");
    console.log("balance User3 - sLP1", await sLP2.balanceOf(user3.address));   
    await router.connect(user3).addLiquidityBNB(TK1.address, false, oneHundred, oneHundred, oneHundred, user3.address, "1000000000000", {value: oneHundred}); 
    expect(await vLP1.balanceOf(user3.address)).to.be.equal("100000000000000000000");
    console.log("balance User3 - vLP1", await vLP1.balanceOf(user3.address));          
    await router.connect(user3).addLiquidity(WETH.address, USDC.address, false, oneHundred, oneHundred, oneHundred, oneHundred, user3.address, "1000000000000");
    expect(await vLP2.balanceOf(user3.address)).to.be.equal("100000000000000000000");
    console.log("balance User3 - vLP2", await vLP2.balanceOf(user3.address));          

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
    console.log("Gauge Proxy", usdfiGP);
    console.log("sLP1", usdfisLP1);
    console.log("sLP2", usdfisLP2);
    console.log("vLP1", usdfivLP1);
    console.log("vLP2", usdfivLP2);

    console.log();
    console.log("******************************************************");
});


it('User1 deposits LP1 in all gauges', async function () {
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

    expect(await sLP1Gauge.balanceOf(user1.address)).to.be.equal("100000000000000000000");
    expect(await sLP2Gauge.balanceOf(user1.address)).to.be.equal("100000000000000000000");
    expect(await vLP1Gauge.balanceOf(user1.address)).to.be.equal("100000000000000000000");
    expect(await vLP2Gauge.balanceOf(user1.address)).to.be.equal("100000000000000000000");

    expect(await sLP1.balanceOf(user1.address)).to.be.equal(0);
    expect(await sLP2.balanceOf(user1.address)).to.be.equal(0);
    expect(await vLP1.balanceOf(user1.address)).to.be.equal(0);
    expect(await vLP2.balanceOf(user1.address)).to.be.equal(0);

    console.log();
    console.log("******************************************************");
});

it('User1 calls distribute // no Votes', async function () {
    console.log("******************************************************");
    console.log();
    await gaugeFactory.connect(user1).distribute(0, 4);
    
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

it('User lock veTokens', async function () {
    console.log("******************************************************");
    console.log();

    await STABLE.connect(user1).approve(veSTABLE.address, oneThousand);
    await veSTABLE.connect(user1).create_lock(oneThousand, April2026);
    console.log("veSTABLE", await veSTABLE['balanceOf(address)'](user1.address));

    await STABLE.connect(user2).approve(veSTABLE.address, oneThousand);
    await veSTABLE.connect(user2).create_lock(fiveHundred, April2026);
    console.log("veSTABLE", await veSTABLE['balanceOf(address)'](user2.address));

    await STABLE.connect(user3).approve(veSTABLE.address, oneThousand);
    await veSTABLE.connect(user3).create_lock(twoHundredAndFifty, April2026);
    console.log("veSTABLE", await veSTABLE['balanceOf(address)'](user3.address));
    console.log();
    console.log("******************************************************");
});

it('Users votes on gauges via proxie => ROUND 1', async function () {
    console.log("******************************************************");
    console.log();

    await gaugeFactory.preDistribute();
    await gaugeFactory.connect(user1).distribute(0, 4);

    console.log("User1 votes on variable gauge proxy with  250 on vLP1, 250 on vLP2, 250 on sLP1, 250 on sLP2");
    await veVoteProxy.connect(user1).vote([sLP1.address, sLP2.address, vLP1.address, vLP2.address], [twoHundredAndFifty, twoHundredAndFifty,twoHundredAndFifty,twoHundredAndFifty]);
    let vote1 = await gaugeFactory.votes(user1.address, sLP1.address);
    let vote2 = await gaugeFactory.votes(user1.address, sLP2.address);
    let vote3 = await gaugeFactory.votes(user1.address, vLP1.address);
    let vote4 = await gaugeFactory.votes(user1.address, vLP2.address);


    console.log("User1 vote1", divDec(vote1));
    console.log("User1 vote2", divDec(vote2));
    console.log("User1 vote3", divDec(vote3));
    console.log("User1 vote4", divDec(vote4));

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


    console.log("User1 votes on variable gauge proxy with  500 on vLP1, 250 on sLP1, 250 on sLP2");
    await veVoteProxy.connect(user3).vote([sLP1.address, sLP2.address, vLP1.address], [fiveHundred, twoHundredAndFifty, twoHundredAndFifty]);
    let vote9 = await gaugeFactory.votes(user3.address, sLP1.address);
    let vote10 = await gaugeFactory.votes(user3.address, sLP2.address);
    let vote11 = await gaugeFactory.votes(user3.address, vLP1.address);
    let vote12 = await gaugeFactory.votes(user3.address, vLP2.address);

    console.log("User3 vote1", divDec(vote9));
    console.log("User3 vote2", divDec(vote10));
    console.log("User3 vote3", divDec(vote11));
    console.log("User3 vote4", divDec(vote12));
    
    console.log();
    console.log("******************************************************");
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

});

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
let SPIRIT, inSPIRIT, WETH, TK1, TK2, USDC, USD1, USD2;

describe("AMM Testing", function () {
  
    before("Initial set up", async function () {
        console.log("Begin Initialization");

        // initialize users
        [owner, admin, user1, user2, protocol1, protocol2, usdfiMaker, treasury] = await ethers.getSigners();

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

        console.log("Initialization Complete");
    });

    it('LP Pair Status', async function () {
        console.log("******************************************************");
        console.log();

        // vLP1 User balances
        let ownervLP1 = await vLP1.balanceOf(owner.address);
        let user1vLP1 = await vLP1.balanceOf(user1.address);
        let user2vLP1 = await vLP1.balanceOf(user2.address);

        console.log("vLP1 USER BALANCES BALANCE (WETH-TK1)");
        console.log("Owner", divDec(ownervLP1));
        console.log("User 1", divDec(user1vLP1));
        console.log("User 2", divDec(user2vLP1));

        // vLP1 Pair Status
        let vLP1WETH = await WETH.balanceOf(vLP1.address);
        let vLP1TK1 = await TK1.balanceOf(vLP1.address);

        console.log("vLP1 BALANCE");
        console.log("WETH", divDec(vLP1WETH));
        console.log("TK1", divDec(vLP1TK1));

        // vLP1 Fee Status
        let vLP1FeesWETH = await WETH.balanceOf(vLP1Fees.address)
        let vLP1FeesTK1 = await TK1.balanceOf(vLP1Fees.address);

        console.log("vLP1 FEES BALANCE");
        console.log("WETH", divDec(vLP1FeesWETH));
        console.log("TK1", divDec(vLP1FeesTK1));
        console.log();

        // vLP1 User balances
        let ownersLP1 = await sLP1.balanceOf(owner.address);
        let user1sLP1 = await sLP1.balanceOf(user1.address);
        let user2sLP1 = await sLP1.balanceOf(user2.address);

        console.log("sLP1 USER BALANCES BALANCE (USDC-USD1)");
        console.log("Owner", divDec(ownersLP1));
        console.log("User 1", divDec(user1sLP1));
        console.log("User 2", divDec(user2sLP1));

        // sLP1 Pair Status
        let sLP1USDC = await USDC.balanceOf(sLP1.address);
        let sLP1USD1 = await USD1.balanceOf(sLP1.address);

        console.log("sLP1 BALANCE (USDC-USD1)");
        console.log("USDC", divDec(sLP1USDC));
        console.log("USD1", divDec(sLP1USD1));

        // sLP1 Fee Status
        let sLP1FeesUSDC = await USDC.balanceOf(sLP1Fees.address);
        let sLP1FeesUSD1 = await USD1.balanceOf(sLP1Fees.address);

        console.log("sLP1 FEES BALANCE");
        console.log("USDC", divDec(sLP1FeesUSDC));
        console.log("USD1", divDec(sLP1FeesUSD1));
        console.log();

    }); 

    it('Pairs length', async function () {
        console.log("******************************************************");
        console.log();

        let pairsLength = await pairFactory.allPairsLength();
        
        expect(pairsLength).to.be.equal(4);

    }); 

    it('LP Pair Code', async function () {
        console.log("******************************************************");
        console.log();

        let vLP1pair = await router.pairFor(WETH.address, TK1.address, false);
        let sLP1pair = await router.pairFor(USDC.address, USD1.address, true);

        await expect(vLP1pair).to.be.equal(vLP1.address);
        await expect(sLP1pair).to.be.equal(sLP1.address);

    }); 

    it('Get Reserves', async function () {
        console.log("******************************************************");
        console.log();

        let vLP1Reserves = await router.getReserves(WETH.address, TK1.address, false);
        let sLP1Reserves = await router.getReserves(USDC.address, USD1.address, true);
    
        console.log("vLP1 Reserves");
        console.log("WETH", divDec(vLP1Reserves[0]));
        console.log("TK1", divDec(vLP1Reserves[1]));

        console.log("sLP1 Reserves");
        console.log("USDC", divDec(sLP1Reserves[0]));
        console.log("USD1", divDec(sLP1Reserves[1]));

    }); 

    it('Get Amount Out', async function () {
        console.log("******************************************************");
        console.log();

        let outTK1 = await router.getAmountOut(ten , WETH.address, TK1.address);
        let outUSD1 = await router.getAmountOut(ten , USDC.address, USD1.address);
    
        console.log("vLP1: 10 WETH in on 100 WETH | 100 TK1. TK1 out = ");
        console.log("Amount", divDec(outTK1[0]));
        console.log("Stable", outTK1[1]);

        console.log("sLP1: 10 USDC in on 100 USDC | 100 USD1. USD1 out = ");
        console.log("Amount", divDec(outUSD1[0]));
        console.log("Stable", outUSD1[1]);

    }); 

    it('Get Amounts Out', async function () {
        console.log("******************************************************");
        console.log();

        let routes = [[USD1.address, USDC.address, true], [USDC.address, WETH.address, false], [WETH.address, TK1.address, false]];

        let amounts = await router.getAmountsOut(ten , routes);
        console.log("Get amounts out for 10 USD1 to TK1");
        console.log("Route: USD1 -> USDC-USD1 -> USDC -> WETH-USDC -> WETH -> WETH-TK1 -> TK1");
        console.log("USD1", divDec(amounts[0]));
        console.log("USDC", divDec(amounts[1]));
        console.log("WETH", divDec(amounts[2]));
        console.log("TK1", divDec(amounts[3]));

    }); 

    it('isPair', async function () {
        console.log("******************************************************");
        console.log();

        await expect(await router.isPair(vLP1.address)).to.be.equal(true);
        await expect(await router.isPair(WETH.address)).to.be.equal(false);
        await expect(await router.isPair(sLP1.address)).to.be.equal(true);
        await expect(await router.isPair(TK1.address)).to.be.equal(false);
        await expect(await router.isPair(USDC.address)).to.be.equal(false);

    }); 

    it('Quote Add/Remove Liquidity', async function () {
        console.log("******************************************************");
        console.log();

        let quoteAdd = await router.connect(user1).quoteAddLiquidity(WETH.address, TK1.address, false, "1", "1");
        console.log(quoteAdd);

        quoteAdd = await router.connect(user1).quoteAddLiquidity(WETH.address, TK1.address, false, ten, ten);
        console.log(quoteAdd);
        let quoteRemove = await router.connect(owner).quoteRemoveLiquidity(WETH.address, TK1.address, false, ten);
        console.log(quoteRemove);

        quoteRemove = await router.connect(owner).quoteRemoveLiquidity(USD1.address, TK1.address, false, ten);
        console.log(quoteRemove);

    }); 

    it('Add Liquidity vLP1', async function () {
        console.log("******************************************************");
        console.log();

        let user1WETH = await WETH.balanceOf(user1.address);
        let user1TK1 = await TK1.balanceOf(user1.address);
        let user1vLP1 = await vLP1.balanceOf(user1.address);

        console.log("BEFORE: User1 Balances");
        console.log("vLP1", divDec(user1vLP1));
        console.log("WETH", divDec(user1WETH));
        console.log("TK1", divDec(user1TK1));

        await WETH.connect(user1).approve(router.address, ten);
        await TK1.connect(user1).approve(router.address, ten);
        await router.connect(user1).addLiquidityBNB(TK1.address, false, ten, 0, 0, user1.address, "1000000000000", {value: fifty});

        user1WETH = await WETH.balanceOf(user1.address);
        user1TK1 = await TK1.balanceOf(user1.address);
        user1vLP1 = await vLP1.balanceOf(user1.address);

        console.log("After: User1 Balances");
        console.log("vLP1", divDec(user1vLP1));
        console.log("WETH", divDec(user1WETH));
        console.log("TK1", divDec(user1TK1));

    }); 

    it('Remove Liquidity vLP1', async function () {
        console.log("******************************************************");
        console.log();

        let user1WETH = await WETH.balanceOf(user1.address);
        let user1TK1 = await TK1.balanceOf(user1.address);
        let user1vLP1 = await vLP1.balanceOf(user1.address);

        console.log("BEFORE: User1 Balances");
        console.log("vLP1", divDec(user1vLP1));
        console.log("WETH", divDec(user1WETH));
        console.log("TK1", divDec(user1TK1));

        await vLP1.connect(user1).approve(router.address, ten);
        // await router.connect(user1).removeLiquidity(WETH.address, TK1.address, false, ten, 0, 0, user1.address, "1000000000000");
        await router.connect(user1).removeLiquidityBNB(TK1.address, false, ten, 0, 0, user1.address, "1000000000000");

        user1WETH = await WETH.balanceOf(user1.address);
        user1TK1 = await TK1.balanceOf(user1.address);
        user1vLP1 = await vLP1.balanceOf(user1.address);

        console.log("After: User1 Balances");
        console.log("vLP1", divDec(user1vLP1));
        console.log("WETH", divDec(user1WETH));
        console.log("TK1", divDec(user1TK1));

    }); 

    it('Add Liquidity vLP1', async function () {
        console.log("******************************************************");
        console.log();

        let user1WETH = await WETH.balanceOf(user1.address);
        let user1TK1 = await TK1.balanceOf(user1.address);
        let user1vLP1 = await vLP1.balanceOf(user1.address);

        console.log("BEFORE: User1 Balances");
        console.log("vLP1", divDec(user1vLP1));
        console.log("WETH", divDec(user1WETH));
        console.log("TK1", divDec(user1TK1));

        await WETH.connect(user1).approve(router.address, oneHundred);
        await TK1.connect(user1).approve(router.address, oneHundred);
        await router.connect(user1).addLiquidity(WETH.address, TK1.address, false, oneHundred, oneHundred, 0, 0, user1.address, "1000000000000");

        user1WETH = await WETH.balanceOf(user1.address);
        user1TK1 = await TK1.balanceOf(user1.address);
        user1vLP1 = await vLP1.balanceOf(user1.address);

        console.log("After: User1 Balances");
        console.log("vLP1", divDec(user1vLP1));
        console.log("WETH", divDec(user1WETH));
        console.log("TK1", divDec(user1TK1));

    }); 

    it('User2 swapExactTokensForTokensSimple: 10 WETH -> TK1', async function () {
        console.log("******************************************************");
        console.log();

        let user2WETH = await WETH.balanceOf(user2.address);
        let user2TK1 = await TK1.balanceOf(user2.address);

        console.log("BEFORE: User2 Balances");
        console.log("WETH", divDec(user2WETH));
        console.log("TK1", divDec(user2TK1));

        await WETH.connect(user2).approve(router.address, ten);
        await router.connect(user2).swapExactTokensForTokensSimple(ten, 0, WETH.address, TK1.address, false, user2.address, "1000000000000");

        user2WETH = await WETH.balanceOf(user2.address);
        user2TK1 = await TK1.balanceOf(user2.address);

        console.log("After: User2 Balances");
        console.log("WETH", divDec(user2WETH));
        console.log("TK1", divDec(user2TK1));
    }); 

    it('User2 swapExactTokensForTokens: All TK1 -> USD1', async function () {
        console.log("******************************************************");
        console.log();

        let user2WETH = await WETH.balanceOf(user2.address);
        let user2TK1 = await TK1.balanceOf(user2.address);
        let user2USD1 = await USD1.balanceOf(user2.address);

        console.log("BEFORE: User2 Balances");
        console.log("WETH", divDec(user2WETH));
        console.log("TK1", divDec(user2TK1));
        console.log("USD1", divDec(user2USD1));

        let routes = [[TK1.address, WETH.address, false], [WETH.address, USDC.address, false], [USDC.address, USD1.address, true]];

        await TK1.connect(user2).approve(router.address, ten);
        await router.connect(user2).swapExactTokensForTokens(await TK1.balanceOf(user2.address), 0, routes, user2.address, "1000000000000");

        user2WETH = await WETH.balanceOf(user2.address);
        user2TK1 = await TK1.balanceOf(user2.address);
        user2USD1 = await USD1.balanceOf(user2.address);

        console.log("AFTER: User2 Balances");
        console.log("WETH", divDec(user2WETH));
        console.log("TK1", divDec(user2TK1));
        console.log("USD1", divDec(user2USD1));
    }); 

    it('LP Pair Status', async function () {
        console.log("******************************************************");
        console.log();

        // vLP1 User balances
        let ownervLP1 = await vLP1.balanceOf(owner.address);
        let user1vLP1 = await vLP1.balanceOf(user1.address);
        let user2vLP1 = await vLP1.balanceOf(user2.address);

        console.log("vLP1 USER BALANCES BALANCE (WETH-TK1)");
        console.log("Owner", divDec(ownervLP1));
        console.log("User 1", divDec(user1vLP1));
        console.log("User 2", divDec(user2vLP1));

        // vLP1 Pair Status
        let vLP1WETH = await WETH.balanceOf(vLP1.address);
        let vLP1TK1 = await TK1.balanceOf(vLP1.address);

        console.log("vLP1 BALANCE");
        console.log("WETH", divDec(vLP1WETH));
        console.log("TK1", divDec(vLP1TK1));

        // vLP1 Fee Status
        let vLP1FeesWETH = await WETH.balanceOf(vLP1Fees.address)
        let vLP1FeesTK1 = await TK1.balanceOf(vLP1Fees.address);

        console.log("vLP1 FEES BALANCE");
        console.log("WETH", divDec(vLP1FeesWETH));
        console.log("TK1", divDec(vLP1FeesTK1));
        console.log();

        // vLP1 User balances
        let ownersLP1 = await sLP1.balanceOf(owner.address);
        let user1sLP1 = await sLP1.balanceOf(user1.address);
        let user2sLP1 = await sLP1.balanceOf(user2.address);

        console.log("sLP1 USER BALANCES BALANCE (USDC-USD1)");
        console.log("Owner", divDec(ownersLP1));
        console.log("User 1", divDec(user1sLP1));
        console.log("User 2", divDec(user2sLP1));

        // sLP1 Pair Status
        let sLP1USDC = await USDC.balanceOf(sLP1.address);
        let sLP1USD1 = await USD1.balanceOf(sLP1.address);

        console.log("sLP1 BALANCE (USDC-USD1)");
        console.log("USDC", divDec(sLP1USDC));
        console.log("USD1", divDec(sLP1USD1));

        // sLP1 Fee Status
        let sLP1FeesUSDC = await USDC.balanceOf(sLP1Fees.address);
        let sLP1FeesUSD1 = await USD1.balanceOf(sLP1Fees.address);

        console.log("sLP1 FEES BALANCE");
        console.log("USDC", divDec(sLP1FeesUSDC));
        console.log("USD1", divDec(sLP1FeesUSD1));
        console.log();

    }); 

    it('User1 claims Fees from vLP1 - Round 1', async function () {
        console.log("******************************************************");
        console.log();

        // BEFORE
        let vLP1FeesWETH = await WETH.balanceOf(vLP1Fees.address)
        let vLP1FeesTK1 = await TK1.balanceOf(vLP1Fees.address);
        let ownerWETH = await WETH.balanceOf(owner.address);
        let ownerTK1 = await TK1.balanceOf(owner.address);
        let user1WETH = await WETH.balanceOf(user1.address);
        let user1TK1 = await TK1.balanceOf(user1.address);
        let usdfiMakerWETH = await WETH.balanceOf(usdfiMaker.address);
        let usdfiMakerTK1 = await TK1.balanceOf(usdfiMaker.address);
        let protocol1WETH = await WETH.balanceOf(protocol1.address);
        let protocol1TK1 = await TK1.balanceOf(protocol1.address);

        console.log("BEFORE");
        console.log();
        console.log("vLP1 FEES BALANCE");
        console.log("WETH", divDec(vLP1FeesWETH));
        console.log("TK1", divDec(vLP1FeesTK1));
        console.log();
        console.log("OWNER BALANCE");
        console.log("WETH", divDec(ownerWETH));
        console.log("TK1", divDec(ownerTK1));
        console.log();
        console.log("USER1 BALANCE");
        console.log("WETH", divDec(user1WETH));
        console.log("TK1", divDec(user1TK1));
        console.log();
        console.log("usdfiMaker BALANCE");
        console.log("WETH", divDec(usdfiMakerWETH));
        console.log("TK1", divDec(usdfiMakerTK1));
        console.log();
        console.log("PROTOCOL1 BALANCE");
        console.log("WETH", divDec(protocol1WETH));
        console.log("TK1", divDec(protocol1TK1));
        console.log();

        await vLP1.connect(user1).claimFees();

        // AFTER
        vLP1FeesWETH = await WETH.balanceOf(vLP1Fees.address)
        vLP1FeesTK1 = await TK1.balanceOf(vLP1Fees.address);
        ownerWETH = await WETH.balanceOf(owner.address);
        ownerTK1 = await TK1.balanceOf(owner.address);
        const afterUser1WETH = await WETH.balanceOf(user1.address);
        const afterUser1TK1 = await TK1.balanceOf(user1.address);
        const afterUsdfiMaker1WETH = await WETH.balanceOf(usdfiMaker.address);
        const afterUsdfiMakerTK1 = await TK1.balanceOf(usdfiMaker.address);
        const afterProtocol1WETH = await WETH.balanceOf(protocol1.address);
        const afterProtocol1TK1 = await TK1.balanceOf(protocol1.address);

        console.log("AFTER");
        console.log();
        console.log("vLP1 FEES BALANCE");
        console.log("WETH", divDec(vLP1FeesWETH));
        console.log("TK1", divDec(vLP1FeesTK1));
        console.log();
        console.log("OWNER BALANCE");
        console.log("WETH", divDec(ownerWETH));
        console.log("TK1", divDec(ownerTK1));
        console.log();
        console.log("USER1 BALANCE");
        console.log("WETH", divDec(afterUser1WETH));
        console.log("TK1", divDec(afterUser1TK1));
        console.log();
        console.log("usdfiMaker BALANCE");
        console.log("WETH", divDec(afterUsdfiMaker1WETH));
        console.log("TK1", divDec(afterUsdfiMakerTK1));
        console.log();
        console.log("PROTOCOL1 BALANCE");
        console.log("WETH", divDec(afterProtocol1WETH));
        console.log("TK1", divDec(afterProtocol1TK1));
        console.log();

        // User1 fees increased
        expect(divDec(afterUser1WETH)).to.be.greaterThan(divDec(user1WETH));
        expect(divDec(afterUser1TK1)).to.be.greaterThan(divDec(user1TK1));

        // usdfiMaker fees increased
        expect(divDec(afterUsdfiMaker1WETH)).to.be.greaterThan(divDec(usdfiMakerWETH));
        expect(divDec(afterUsdfiMakerTK1)).to.be.greaterThan(divDec(usdfiMakerTK1));

        // protocol fees increased
        expect(divDec(afterProtocol1WETH)).to.be.equal(divDec(protocol1WETH));
        expect(divDec(afterProtocol1TK1)).to.be.equal(divDec(protocol1TK1));

    }); 

    it('User1 claims Fees from vLP1 - Round 2', async function () {
        console.log("******************************************************");
        console.log();

        // BEFORE
        let vLP1FeesWETH = await WETH.balanceOf(vLP1Fees.address)
        let vLP1FeesTK1 = await TK1.balanceOf(vLP1Fees.address);
        let ownerWETH = await WETH.balanceOf(owner.address);
        let ownerTK1 = await TK1.balanceOf(owner.address);
        let user1WETH = await WETH.balanceOf(user1.address);
        let user1TK1 = await TK1.balanceOf(user1.address);
        let usdfiMakerWETH = await WETH.balanceOf(usdfiMaker.address);
        let usdfiMakerTK1 = await TK1.balanceOf(usdfiMaker.address);
        let protocol1WETH = await WETH.balanceOf(protocol1.address);
        let protocol1TK1 = await TK1.balanceOf(protocol1.address);

        console.log("BEFORE");
        console.log();
        console.log("vLP1 FEES BALANCE");
        console.log("WETH", divDec(vLP1FeesWETH));
        console.log("TK1", divDec(vLP1FeesTK1));
        console.log();
        console.log("OWNER BALANCE");
        console.log("WETH", divDec(ownerWETH));
        console.log("TK1", divDec(ownerTK1));
        console.log();
        console.log("USER1 BALANCE");
        console.log("WETH", divDec(user1WETH));
        console.log("TK1", divDec(user1TK1));
        console.log();
        console.log("usdfiMaker BALANCE");
        console.log("WETH", divDec(usdfiMakerWETH));
        console.log("TK1", divDec(usdfiMakerTK1));
        console.log();
        console.log("PROTOCOL1 BALANCE");
        console.log("WETH", divDec(protocol1WETH));
        console.log("TK1", divDec(protocol1TK1));
        console.log();

        await vLP1.connect(user1).claimFees();

        // AFTER
        vLP1FeesWETH = await WETH.balanceOf(vLP1Fees.address)
        vLP1FeesTK1 = await TK1.balanceOf(vLP1Fees.address);
        ownerWETH = await WETH.balanceOf(owner.address);
        ownerTK1 = await TK1.balanceOf(owner.address);
        user1WETH = await WETH.balanceOf(user1.address);
        user1TK1 = await TK1.balanceOf(user1.address);
        usdfiMakerWETH = await WETH.balanceOf(usdfiMaker.address);
        usdfiMakerTK1 = await TK1.balanceOf(usdfiMaker.address);
        protocol1WETH = await WETH.balanceOf(protocol1.address);
        protocol1TK1 = await TK1.balanceOf(protocol1.address);

        console.log("AFTER");
        console.log();
        console.log("vLP1 FEES BALANCE");
        console.log("WETH", divDec(vLP1FeesWETH));
        console.log("TK1", divDec(vLP1FeesTK1));
        console.log();
        console.log("OWNER BALANCE");
        console.log("WETH", divDec(ownerWETH));
        console.log("TK1", divDec(ownerTK1));
        console.log();
        console.log("USER1 BALANCE");
        console.log("WETH", divDec(user1WETH));
        console.log("TK1", divDec(user1TK1));
        console.log();
        console.log("usdfiMaker BALANCE");
        console.log("WETH", divDec(usdfiMakerWETH));
        console.log("TK1", divDec(usdfiMakerTK1));
        console.log();
        console.log("PROTOCOL1 BALANCE");
        console.log("WETH", divDec(protocol1WETH));
        console.log("TK1", divDec(protocol1TK1));
        console.log();

    }); 

    it('Owner claims Fees from vLP1', async function () {
        console.log("******************************************************");
        console.log();

        // BEFORE
        let vLP1FeesWETH = await WETH.balanceOf(vLP1Fees.address)
        let vLP1FeesTK1 = await TK1.balanceOf(vLP1Fees.address);
        let ownerWETH = await WETH.balanceOf(owner.address);
        let ownerTK1 = await TK1.balanceOf(owner.address);
        let user1WETH = await WETH.balanceOf(user1.address);
        let user1TK1 = await TK1.balanceOf(user1.address);
        let usdfiMakerWETH = await WETH.balanceOf(usdfiMaker.address);
        let usdfiMakerTK1 = await TK1.balanceOf(usdfiMaker.address);
        let protocol1WETH = await WETH.balanceOf(protocol1.address);
        let protocol1TK1 = await TK1.balanceOf(protocol1.address);

        console.log("BEFORE");
        console.log();
        console.log("vLP1 FEES BALANCE");
        console.log("WETH", divDec(vLP1FeesWETH));
        console.log("TK1", divDec(vLP1FeesTK1));
        console.log();
        console.log("OWNER BALANCE");
        console.log("WETH", divDec(ownerWETH));
        console.log("TK1", divDec(ownerTK1));
        console.log();
        console.log("USER1 BALANCE");
        console.log("WETH", divDec(user1WETH));
        console.log("TK1", divDec(user1TK1));
        console.log();
        console.log("usdfiMaker BALANCE");
        console.log("WETH", divDec(usdfiMakerWETH));
        console.log("TK1", divDec(usdfiMakerTK1));
        console.log();
        console.log("PROTOCOL1 BALANCE");
        console.log("WETH", divDec(protocol1WETH));
        console.log("TK1", divDec(protocol1TK1));
        console.log();

        await vLP1.connect(owner).claimFees();

        // AFTER
        vLP1FeesWETH = await WETH.balanceOf(vLP1Fees.address)
        vLP1FeesTK1 = await TK1.balanceOf(vLP1Fees.address);
        ownerWETH = await WETH.balanceOf(owner.address);
        ownerTK1 = await TK1.balanceOf(owner.address);
        user1WETH = await WETH.balanceOf(user1.address);
        user1TK1 = await TK1.balanceOf(user1.address);
        usdfiMakerWETH = await WETH.balanceOf(usdfiMaker.address);
        usdfiMakerTK1 = await TK1.balanceOf(usdfiMaker.address);
        protocol1WETH = await WETH.balanceOf(protocol1.address);
        protocol1TK1 = await TK1.balanceOf(protocol1.address);

        console.log("AFTER");
        console.log();
        console.log("vLP1 FEES BALANCE");
        console.log("WETH", divDec(vLP1FeesWETH));
        console.log("TK1", divDec(vLP1FeesTK1));
        console.log();
        console.log("OWNER BALANCE");
        console.log("WETH", divDec(ownerWETH));
        console.log("TK1", divDec(ownerTK1));
        console.log();
        console.log("USER1 BALANCE");
        console.log("WETH", divDec(user1WETH));
        console.log("TK1", divDec(user1TK1));
        console.log();
        console.log("usdfiMaker BALANCE");
        console.log("WETH", divDec(usdfiMakerWETH));
        console.log("TK1", divDec(usdfiMakerTK1));
        console.log();
        console.log("PROTOCOL1 BALANCE");
        console.log("WETH", divDec(protocol1WETH));
        console.log("TK1", divDec(protocol1TK1));
        console.log();

    }); 

    it('Set protocol fee to 0x0 for vLP1', async function () {
        console.log("******************************************************");
        console.log();
        console.log('Before set to 0x0: ', await pairFactory.protocolAddresses(vLP1.address));
        expect(await pairFactory.protocolAddresses(vLP1.address)).to.be.not.equal(AddressZero);
        await pairFactory.connect(owner).setProtocolAddress(vLP1.address, AddressZero);

        expect(await pairFactory.protocolAddresses(vLP1.address)).to.be.equal(AddressZero);
        console.log('After set to 0x0: ', await pairFactory.protocolAddresses(vLP1.address));
    });

    it('User2 swapExactTokensForTokensSimple: 10 WETH -> TK1', async function () {
        console.log("******************************************************");
        console.log();

        let user2WETH = await WETH.balanceOf(user2.address);
        let user2TK1 = await TK1.balanceOf(user2.address);

        console.log("BEFORE: User2 Balances");
        console.log("WETH", divDec(user2WETH));
        console.log("TK1", divDec(user2TK1));

        await WETH.connect(user2).approve(router.address, ten);
        await router.connect(user2).swapExactTokensForTokensSimple(ten, 0, WETH.address, TK1.address, false, user2.address, "1000000000000");

        user2WETH = await WETH.balanceOf(user2.address);
        user2TK1 = await TK1.balanceOf(user2.address);

        console.log("After: User2 Balances");
        console.log("WETH", divDec(user2WETH));
        console.log("TK1", divDec(user2TK1));
    }); 

    it('User1 claims Fees from vLP1 - Round 3', async function () {
        console.log("******************************************************");
        console.log();

        // BEFORE
        let vLP1FeesWETH = await WETH.balanceOf(vLP1Fees.address)
        let vLP1FeesTK1 = await TK1.balanceOf(vLP1Fees.address);
        let ownerWETH = await WETH.balanceOf(owner.address);
        let ownerTK1 = await TK1.balanceOf(owner.address);
        let user1WETH = await WETH.balanceOf(user1.address);
        let user1TK1 = await TK1.balanceOf(user1.address);
        let usdfiMakerWETH = await WETH.balanceOf(usdfiMaker.address);
        let usdfiMakerTK1 = await TK1.balanceOf(usdfiMaker.address);
        let protocol1WETH = await WETH.balanceOf(protocol1.address);
        let protocol1TK1 = await TK1.balanceOf(protocol1.address);

        console.log("BEFORE");
        console.log();
        console.log("vLP1 FEES BALANCE");
        console.log("WETH", divDec(vLP1FeesWETH));
        console.log("TK1", divDec(vLP1FeesTK1));
        console.log();
        console.log("OWNER BALANCE");
        console.log("WETH", divDec(ownerWETH));
        console.log("TK1", divDec(ownerTK1));
        console.log();
        console.log("USER1 BALANCE");
        console.log("WETH", divDec(user1WETH));
        console.log("TK1", divDec(user1TK1));
        console.log();
        console.log("usdfiMaker BALANCE");
        console.log("WETH", divDec(usdfiMakerWETH));
        console.log("TK1", divDec(usdfiMakerTK1));
        console.log();
        console.log("PROTOCOL1 BALANCE");
        console.log("WETH", divDec(protocol1WETH));
        console.log("TK1", divDec(protocol1TK1));
        console.log();

        await vLP1.connect(user1).claimFees();

        // AFTER
        vLP1FeesWETH = await WETH.balanceOf(vLP1Fees.address)
        vLP1FeesTK1 = await TK1.balanceOf(vLP1Fees.address);
        ownerWETH = await WETH.balanceOf(owner.address);
        ownerTK1 = await TK1.balanceOf(owner.address);
        user1WETH = await WETH.balanceOf(user1.address);
        user1TK1 = await TK1.balanceOf(user1.address);
        usdfiMakerWETH = await WETH.balanceOf(usdfiMaker.address);
        usdfiMakerTK1 = await TK1.balanceOf(usdfiMaker.address);
        const afterProtocol1WETH = await WETH.balanceOf(protocol1.address);
        const afterProtocol1TK1 = await TK1.balanceOf(protocol1.address);

        console.log("AFTER");
        console.log();
        console.log("vLP1 FEES BALANCE");
        console.log("WETH", divDec(vLP1FeesWETH));
        console.log("TK1", divDec(vLP1FeesTK1));
        console.log();
        console.log("OWNER BALANCE");
        console.log("WETH", divDec(ownerWETH));
        console.log("TK1", divDec(ownerTK1));
        console.log();
        console.log("USER1 BALANCE");
        console.log("WETH", divDec(user1WETH));
        console.log("TK1", divDec(user1TK1));
        console.log();
        console.log("usdfiMaker BALANCE");
        console.log("WETH", divDec(usdfiMakerWETH));
        console.log("TK1", divDec(usdfiMakerTK1));
        console.log();
        console.log("PROTOCOL1 BALANCE");
        console.log("WETH", divDec(afterProtocol1WETH));
        console.log("TK1", divDec(afterProtocol1TK1));
        console.log();

        // No change in protocol fees
        expect(afterProtocol1WETH).to.be.equal(protocol1WETH);
        expect(afterProtocol1TK1).to.be.equal(protocol1TK1);

    }); 

    it('Change fee for variable pairs and update for vLP1', async function () {
        console.log("******************************************************");
        console.log();
        const beforeFeeUpdate = await pairFactory.baseVariableFee();
        console.log('Before variable fee updated: ', beforeFeeUpdate);
        await pairFactory.setBaseVariableFee(1000);
        console.log('After variable fee updated: ', await pairFactory.baseVariableFee());
        expect(Number(await pairFactory.baseVariableFee())).to.be.greaterThan(Number(beforeFeeUpdate));
        
        const beforeFeeUpdatevLP1 = await vLP1.fee();
        console.log('vLP1 Before variable fee updated: ', beforeFeeUpdatevLP1);

        await vLP1.connect(user1).setFee(1000);

        const afterFeeUpdatevLP1 = await vLP1.fee();
        console.log('vLP1 After variable fee updated: ', afterFeeUpdatevLP1);

        expect(Number(afterFeeUpdatevLP1)).to.be.greaterThan(Number(beforeFeeUpdatevLP1));

    });

    it('Change fee for stable pairs and update for sLP1', async function () {
        console.log("******************************************************");
        console.log();
        const beforeFeeUpdate = await pairFactory.baseStableFee();
        console.log('Before variable fee updated: ', beforeFeeUpdate);
        await pairFactory.setBaseStableFee(1000);
        console.log('After variable fee updated: ', await pairFactory.baseStableFee());
        expect(Number(await pairFactory.baseStableFee())).to.be.lessThan(Number(beforeFeeUpdate));
        
        const beforeFeeUpdatesLP1 = await sLP1.fee();
        console.log('vLP1 Before variable fee updated: ', beforeFeeUpdatesLP1);

        await sLP1.connect(user1).setFee(1000);

        const afterFeeUpdatesLP1 = await sLP1.fee();
        console.log('vLP1 After variable fee updated: ', afterFeeUpdatesLP1);

        expect(Number(afterFeeUpdatesLP1)).to.be.lessThan(Number(beforeFeeUpdatesLP1));

    });

    it('User2 swapExactTokensForTokensSimple: 10 WETH -> TK1', async function () {
        console.log("******************************************************");
        console.log();

        let user2WETH = await WETH.balanceOf(user2.address);
        let user2TK1 = await TK1.balanceOf(user2.address);

        console.log("BEFORE: User2 Balances");
        console.log("WETH", divDec(user2WETH));
        console.log("TK1", divDec(user2TK1));

        await WETH.connect(user2).approve(router.address, ten);
        await router.connect(user2).swapExactTokensForTokensSimple(ten, 0, WETH.address, TK1.address, false, user2.address, "1000000000000");

        user2WETH = await WETH.balanceOf(user2.address);
        user2TK1 = await TK1.balanceOf(user2.address);

        console.log("After: User2 Balances");
        console.log("WETH", divDec(user2WETH));
        console.log("TK1", divDec(user2TK1));
    }); 

    it('User1 claims Fees from vLP1 - Round 4', async function () {
        console.log("******************************************************");
        console.log();

        // BEFORE
        let vLP1FeesWETH = await WETH.balanceOf(vLP1Fees.address)
        let vLP1FeesTK1 = await TK1.balanceOf(vLP1Fees.address);
        let ownerWETH = await WETH.balanceOf(owner.address);
        let ownerTK1 = await TK1.balanceOf(owner.address);
        let user1WETH = await WETH.balanceOf(user1.address);
        let user1TK1 = await TK1.balanceOf(user1.address);
        let usdfiMakerWETH = await WETH.balanceOf(usdfiMaker.address);
        let usdfiMakerTK1 = await TK1.balanceOf(usdfiMaker.address);
        let protocol1WETH = await WETH.balanceOf(protocol1.address);
        let protocol1TK1 = await TK1.balanceOf(protocol1.address);

        console.log("BEFORE");
        console.log();
        console.log("vLP1 FEES BALANCE");
        console.log("WETH", divDec(vLP1FeesWETH));
        console.log("TK1", divDec(vLP1FeesTK1));
        console.log();
        console.log("OWNER BALANCE");
        console.log("WETH", divDec(ownerWETH));
        console.log("TK1", divDec(ownerTK1));
        console.log();
        console.log("USER1 BALANCE");
        console.log("WETH", divDec(user1WETH));
        console.log("TK1", divDec(user1TK1));
        console.log();
        console.log("usdfiMaker BALANCE");
        console.log("WETH", divDec(usdfiMakerWETH));
        console.log("TK1", divDec(usdfiMakerTK1));
        console.log();
        console.log("PROTOCOL1 BALANCE");
        console.log("WETH", divDec(protocol1WETH));
        console.log("TK1", divDec(protocol1TK1));
        console.log();

        await vLP1.connect(user1).claimFees();

        // AFTER
        vLP1FeesWETH = await WETH.balanceOf(vLP1Fees.address)
        vLP1FeesTK1 = await TK1.balanceOf(vLP1Fees.address);
        ownerWETH = await WETH.balanceOf(owner.address);
        ownerTK1 = await TK1.balanceOf(owner.address);
        const afterUser1WETH = await WETH.balanceOf(user1.address);
        const afterUser1TK1 = await TK1.balanceOf(user1.address);
        usdfiMakerWETH = await WETH.balanceOf(usdfiMaker.address);
        usdfiMakerTK1 = await TK1.balanceOf(usdfiMaker.address);
        const afterProtocol1WETH = await WETH.balanceOf(protocol1.address);
        const afterProtocol1TK1 = await TK1.balanceOf(protocol1.address);

        console.log("AFTER");
        console.log();
        console.log("vLP1 FEES BALANCE");
        console.log("WETH", divDec(vLP1FeesWETH));
        console.log("TK1", divDec(vLP1FeesTK1));
        console.log();
        console.log("OWNER BALANCE");
        console.log("WETH", divDec(ownerWETH));
        console.log("TK1", divDec(ownerTK1));
        console.log();
        console.log("USER1 BALANCE");
        console.log("WETH", divDec(afterUser1WETH));
        console.log("TK1", divDec(afterUser1TK1));
        console.log();
        console.log("usdfiMaker BALANCE");
        console.log("WETH", divDec(usdfiMakerWETH));
        console.log("TK1", divDec(usdfiMakerTK1));
        console.log();
        console.log("PROTOCOL1 BALANCE");
        console.log("WETH", divDec(afterProtocol1WETH));
        console.log("TK1", divDec(afterProtocol1TK1));
        console.log();

        // No change in protocol fees
        expect(divDec(afterProtocol1WETH)).to.be.equal(divDec(protocol1WETH));
        expect(divDec(afterProtocol1TK1)).to.be.equal(divDec(protocol1TK1));
        // User1 fees should increase
        expect(divDec(afterUser1TK1)).to.be.equal(divDec(user1TK1)); // Token1 should not increase
        expect(divDec(afterUser1WETH)).to.be.greaterThan(divDec(user1WETH)); 
    }); 

    it('User2 swapExactTokensForTokens: All TK1 -> USD1', async function () {
        console.log("******************************************************");
        console.log();

        let user2WETH = await WETH.balanceOf(user2.address);
        let user2TK1 = await TK1.balanceOf(user2.address);
        let user2USD1 = await USD1.balanceOf(user2.address);

        console.log("BEFORE: User2 Balances");
        console.log("WETH", divDec(user2WETH));
        console.log("TK1", divDec(user2TK1));
        console.log("USD1", divDec(user2USD1));

        let routes = [[TK1.address, WETH.address, false], [WETH.address, USDC.address, false], [USDC.address, USD1.address, true]];

        await TK1.connect(user2).approve(router.address, user2TK1);
        await router.connect(user2).swapExactTokensForTokens(await TK1.balanceOf(user2.address), 0, routes, user2.address, "1000000000000");

        user2WETH = await WETH.balanceOf(user2.address);
        user2TK1 = await TK1.balanceOf(user2.address);
        user2USD1 = await USD1.balanceOf(user2.address);

        console.log("AFTER: User2 Balances");
        console.log("WETH", divDec(user2WETH));
        console.log("TK1", divDec(user2TK1));
        console.log("USD1", divDec(user2USD1));
    }); 

    it('User1 claims Fees from vLP1 - Round 5', async function () {
        console.log("******************************************************");
        console.log();

        // BEFORE
        let vLP1FeesWETH = await WETH.balanceOf(vLP1Fees.address)
        let vLP1FeesTK1 = await TK1.balanceOf(vLP1Fees.address);
        let ownerWETH = await WETH.balanceOf(owner.address);
        let ownerTK1 = await TK1.balanceOf(owner.address);
        let user1WETH = await WETH.balanceOf(user1.address);
        let user1TK1 = await TK1.balanceOf(user1.address);
        let usdfiMakerWETH = await WETH.balanceOf(usdfiMaker.address);
        let usdfiMakerTK1 = await TK1.balanceOf(usdfiMaker.address);
        let protocol1WETH = await WETH.balanceOf(protocol1.address);
        let protocol1TK1 = await TK1.balanceOf(protocol1.address);

        console.log("BEFORE");
        console.log();
        console.log("vLP1 FEES BALANCE");
        console.log("WETH", divDec(vLP1FeesWETH));
        console.log("TK1", divDec(vLP1FeesTK1));
        console.log();
        console.log("OWNER BALANCE");
        console.log("WETH", divDec(ownerWETH));
        console.log("TK1", divDec(ownerTK1));
        console.log();
        console.log("USER1 BALANCE");
        console.log("WETH", divDec(user1WETH));
        console.log("TK1", divDec(user1TK1));
        console.log();
        console.log("usdfiMaker BALANCE");
        console.log("WETH", divDec(usdfiMakerWETH));
        console.log("TK1", divDec(usdfiMakerTK1));
        console.log();
        console.log("PROTOCOL1 BALANCE");
        console.log("WETH", divDec(protocol1WETH));
        console.log("TK1", divDec(protocol1TK1));
        console.log();

        await vLP1.connect(user1).claimFees();

        // AFTER
        vLP1FeesWETH = await WETH.balanceOf(vLP1Fees.address)
        vLP1FeesTK1 = await TK1.balanceOf(vLP1Fees.address);
        ownerWETH = await WETH.balanceOf(owner.address);
        ownerTK1 = await TK1.balanceOf(owner.address);
        const afterUser1WETH = await WETH.balanceOf(user1.address);
        const afterUser1TK1 = await TK1.balanceOf(user1.address);
        usdfiMakerWETH = await WETH.balanceOf(usdfiMaker.address);
        usdfiMakerTK1 = await TK1.balanceOf(usdfiMaker.address);
        const afterProtocol1WETH = await WETH.balanceOf(protocol1.address);
        const afterProtocol1TK1 = await TK1.balanceOf(protocol1.address);

        console.log("AFTER");
        console.log();
        console.log("vLP1 FEES BALANCE");
        console.log("WETH", divDec(vLP1FeesWETH));
        console.log("TK1", divDec(vLP1FeesTK1));
        console.log();
        console.log("OWNER BALANCE");
        console.log("WETH", divDec(ownerWETH));
        console.log("TK1", divDec(ownerTK1));
        console.log();
        console.log("USER1 BALANCE");
        console.log("WETH", divDec(afterUser1WETH));
        console.log("TK1", divDec(afterUser1TK1));
        console.log();
        console.log("usdfiMaker BALANCE");
        console.log("WETH", divDec(usdfiMakerWETH));
        console.log("TK1", divDec(usdfiMakerTK1));
        console.log();
        console.log("PROTOCOL1 BALANCE");
        console.log("WETH", divDec(afterProtocol1WETH));
        console.log("TK1", divDec(afterProtocol1TK1));
        console.log();

        // No change in protocol fees
        expect(divDec(afterProtocol1WETH)).to.be.equal(divDec(protocol1WETH));
        expect(divDec(afterProtocol1TK1)).to.be.equal(divDec(protocol1TK1));
        // User1 fees should increase
        expect(divDec(afterUser1TK1)).to.be.greaterThan(divDec(user1TK1));
        expect(divDec(afterUser1WETH)).to.be.equal(divDec(user1WETH));  // WETH should not increase
    }); 

    it('User2 swapExactBNBForTokens: 10 BNB -> TK1', async function () {
        console.log("******************************************************");
        console.log();

        let user2WETH = await WETH.balanceOf(user2.address);
        let user2TK1 = await TK1.balanceOf(user2.address);

        let routes = [[WETH.address, TK1.address, false]];

        console.log("BEFORE: User2 Balances");
        console.log("WETH", divDec(user2WETH));
        console.log("TK1", divDec(user2TK1));

        await WETH.connect(user2).approve(router.address, ten);
        await router.connect(user2).swapExactBNBForTokens( 0, routes,user2.address, "1000000000000", {value: ten});

        const afterUser2WETH = await WETH.balanceOf(user2.address);
        const afterUser2TK1 = await TK1.balanceOf(user2.address);

        console.log("After: User2 Balances");
        console.log("WETH", divDec(afterUser2WETH));
        console.log("TK1", divDec(afterUser2TK1));

        expect(divDec(afterUser2TK1)).to.be.greaterThan(divDec(user2TK1));
        expect(divDec(afterUser2WETH)).to.be.equal(divDec(user2WETH));      // WETH balance should not be updated, uses ETH
    }); 

    it('User2 swapExactTokensForBNB: 5 TK1 -> BNB', async function () {
        console.log("******************************************************");
        console.log();

        let user2WETH = await WETH.balanceOf(user2.address);
        let user2TK1 = await TK1.balanceOf(user2.address);

        let routes = [[TK1.address, WETH.address, false]];

        console.log("BEFORE: User2 Balances");
        console.log("WETH", divDec(user2WETH));
        console.log("TK1", divDec(user2TK1));

        await TK1.connect(user2).approve(router.address, five);
        await router.connect(user2).swapExactTokensForBNB( five, 0, routes, user2.address, "1000000000000");

        const afterUser2WETH = await WETH.balanceOf(user2.address);
        const afterUser2TK1 = await TK1.balanceOf(user2.address);

        console.log("After: User2 Balances");
        console.log("WETH", divDec(afterUser2WETH));
        console.log("TK1", divDec(afterUser2TK1));

        expect(divDec(afterUser2TK1)).to.be.lessThan(divDec(user2TK1));
        expect(divDec(afterUser2WETH)).to.be.equal(divDec(user2WETH));      // WETH balance should not be updated, gets ETH
    }); 

    it('Admin functions for pairFactory', async function (){
        await pairFactory.setPause(true);
        expect(await pairFactory.isPaused()).to.be.equal(true);
        await pairFactory.setPause(false);

        await pairFactory.setAdmins(usdfiMaker.address, admin.address, admin.address);
        expect(await pairFactory.usdfiMaker()).to.be.equal(usdfiMaker.address);
        expect(await pairFactory.feeAmountOwner()).to.be.equal(admin.address);
        expect(await pairFactory.admin()).to.be.equal(admin.address);
        
        await pairFactory.setOwner(admin.address);
        expect(await pairFactory.pendingOwner()).to.be.equal(admin.address);

        await pairFactory.connect(admin).acceptOwner();
        expect(await pairFactory.owner()).to.be.equal(admin.address);
    })
})


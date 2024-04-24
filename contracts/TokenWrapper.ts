import {
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

describe("TokenWrapper", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployToken() {
    // Contracts are deployed using the first signer/account by default
    const [owner, holderA, holderB, nonHolder] = await hre.ethers.getSigners();

    const TokenWrapper = await hre.ethers.getContractFactory("TokenWrapper");


    // To deploy our contract, we just have to call ethers.deployContract and await
    // its waitForDeployment() method, which happens once its transaction has been
    // mined.
    const wrapped = await TokenWrapper.deploy("Wrapped Token","WTK");
    await wrapped.waitForDeployment();

    return { wrapped, owner, holderA, holderB, nonHolder };
  }

  describe("Initialization", function () {
    it("Should have owner", async function () {
      const { wrapped, owner } = await loadFixture(deployToken);

      expect(await wrapped.owner()).to.equal(owner);
    });

    it("Should have symbol WTK", async function () {
      const { wrapped } = await loadFixture(deployToken);

      expect(await wrapped.symbol()).to.equal('WTK');
    });

    it("Should have name Wrapped Token", async function () {
      const { wrapped } = await loadFixture(deployToken);

      expect(await wrapped.name()).to.equal('Wrapped Token');
    });

    it("Should have a total supply of 0", async function () {
      const { wrapped } = await loadFixture(deployToken);

      expect(await wrapped.totalSupply()).to.equal(0);
    });

    it("Should have owner balance of 0", async function () {
      const { wrapped, owner } = await loadFixture(deployToken);

      expect(await wrapped.balanceOf(owner)).to.equal(0);
    });

    it("Should have holder A balance of 0", async function () {
      const { wrapped, holderA } = await loadFixture(deployToken);

      expect(await wrapped.balanceOf(holderA)).to.equal(0);
    });

    it("Should have holder B balance of 0", async function () {
      const { wrapped, holderB } = await loadFixture(deployToken);

      expect(await wrapped.balanceOf(holderB)).to.equal(0);
    });

    it("Should have non holder balance of 0", async function () {
      const { wrapped, nonHolder } = await loadFixture(deployToken);

      expect(await wrapped.balanceOf(nonHolder)).to.equal(0);
    });
  });

  describe("Owner", function () {
    it("Should add wrapped balance to owner and adjust supply", async function () {
      const { wrapped, owner } = await loadFixture(deployToken);
      await expect(wrapped.increaseWrapped(10)).to.emit(wrapped, "Transfer").withArgs(hre.ethers.ZeroAddress, owner, 10);

      expect(await wrapped.balanceOf(owner)).to.equal(10);
      expect(await wrapped.totalSupply()).to.equal(10);
    });

    it("Should emit OwnableUnauthorizedAccount for increaseWrapped", async function () {
      const { wrapped, holderA } = await loadFixture(deployToken);

      await expect(wrapped.connect(holderA).increaseWrapped(10)).to.be.revertedWithCustomError(wrapped, "OwnableUnauthorizedAccount");
    });

    it("Should remove wrappedi from owner and adjust total supply", async function () {
      const { wrapped, owner } = await loadFixture(deployToken);

      await wrapped.increaseWrapped(10);
      await expect(wrapped.decreaseWrapped(10)).to.emit(wrapped, "Transfer").withArgs(owner, hre.ethers.ZeroAddress, 10);

      expect(await wrapped.balanceOf(owner)).to.equal(0);
      expect(await wrapped.totalSupply()).to.equal(0);
    });

    it("Should emit ERC20InsufficientBalance for invalid decreaseWrapped", async function () {
      const { wrapped } = await loadFixture(deployToken);

      await expect(wrapped.decreaseWrapped(10)).to.be.revertedWithCustomError(wrapped, "ERC20InsufficientBalance");
    });

    it("Should emit OwnableUnauthorizedAccount for decreaseWrapped", async function () {
      const { wrapped, holderA } = await loadFixture(deployToken);

      await wrapped.increaseWrapped(10);

      await expect(wrapped.connect(holderA).decreaseWrapped(10)).to.be.revertedWithCustomError(wrapped, "OwnableUnauthorizedAccount");
    });

  });

  describe("Holder", function () {
    it("Should add wrapped to Holder A", async function () {
      const { wrapped, owner, holderA } = await loadFixture(deployToken);

      await wrapped.increaseWrappedTo(holderA, 15);

      expect(await wrapped.balanceOf(owner)).to.equal(0);
      expect(await wrapped.balanceOf(holderA)).to.equal(15);
      expect(await wrapped.totalSupply()).to.equal(15);
    });

    it("Should transfer from Holder A to Holder B", async function () {
      const { wrapped, owner, holderA, holderB } = await loadFixture(deployToken);

      await wrapped.increaseWrappedTo(holderA, 15);
      await wrapped.connect(holderA).transfer(holderB, 5);

      expect(await wrapped.balanceOf(owner)).to.equal(0);
      expect(await wrapped.balanceOf(holderA)).to.equal(10);
      expect(await wrapped.balanceOf(holderB)).to.equal(5);
      expect(await wrapped.totalSupply()).to.equal(15);
    });

    it("Should emit ERC20InsufficientBalance for invalid transfer", async function () {
      const { wrapped, holderA } = await loadFixture(deployToken);

      await wrapped.increaseWrapped(15);
      await expect(wrapped.transfer(holderA, 25)).to.be.revertedWithCustomError(wrapped, "ERC20InsufficientBalance");
    });

    it("Should approve transfer from Holder A to Holder B", async function () {
      const { wrapped, owner, holderA, holderB, nonHolder } = await loadFixture(deployToken);

      await wrapped.increaseWrappedTo(holderA, 15);

      await wrapped.connect(holderA).approve(nonHolder, 5);
      expect(await wrapped.allowance(holderA, nonHolder)).to.equal(5);

      await wrapped.connect(nonHolder).transferFrom(holderA, holderB, 5);

      expect(await wrapped.balanceOf(owner)).to.equal(0);
      expect(await wrapped.balanceOf(holderA)).to.equal(10);
      expect(await wrapped.balanceOf(holderB)).to.equal(5);
      expect(await wrapped.totalSupply()).to.equal(15);
    });

    it("Should emit error for unapproved transfer from Holder A to Holder B", async function () {
      const { wrapped, holderA, holderB, nonHolder } = await loadFixture(deployToken);

      await expect(wrapped.connect(nonHolder).transferFrom(holderA, holderB, 5)).to.be.revertedWithCustomError(wrapped, "ERC20InsufficientAllowance");
    });

    it("Should emit error for unapproved activites with 0x0 address", async function () {
      const { wrapped } = await loadFixture(deployToken);

      await wrapped.increaseWrapped(15);
      await expect(wrapped.transfer(hre.ethers.ZeroAddress, 15)).to.be.revertedWithCustomError(wrapped, "ERC20InvalidReceiver");
    });

    it("Should emit error for unapproved activites with token's address", async function () {
      const { wrapped } = await loadFixture(deployToken);
      const tokenAddress = await wrapped.getAddress();

      await wrapped.increaseWrapped(15);
      await expect(wrapped.transfer(tokenAddress, 15)).to.be.revertedWithCustomError(wrapped, "ERC20InvalidReceiver");
    });

    it("Should emit ERC20InsufficientBalance for non holder", async function () {
      const { wrapped, holderB, nonHolder } = await loadFixture(deployToken);

      await wrapped.increaseWrapped(15);
      await expect(wrapped.connect(nonHolder).transfer(holderB, 5)).to.be.revertedWithCustomError(wrapped, "ERC20InsufficientBalance");
    });

    it("Should remove wrapped from Holder B", async function () {
      const { wrapped, owner, holderA, holderB } = await loadFixture(deployToken);

      await wrapped.increaseWrappedTo(holderA, 15);
      await wrapped.connect(holderA).transfer(holderB, 5);
      await wrapped.decreaseWrappedFrom(holderB, 5);

      expect(await wrapped.balanceOf(owner)).to.equal(0);
      expect(await wrapped.balanceOf(holderA)).to.equal(10);
      expect(await wrapped.balanceOf(holderB)).to.equal(0);
      expect(await wrapped.totalSupply()).to.equal(10);
    });
  });

  describe("Pause", function () {

    describe("Owner", function () {
      it("Should allow owner to pause and unpause", async function () {
        const { wrapped, owner } = await loadFixture(deployToken);

        await expect(wrapped.pause()).to.emit(wrapped, "Paused").withArgs(owner);
        await expect(wrapped.unpause()).to.emit(wrapped, "Unpaused").withArgs(owner);
      });

      it("Should revert error for non-owner to pause", async function () {
        const { wrapped, nonHolder } = await loadFixture(deployToken);

        await expect(wrapped.connect(nonHolder).pause()).to.be.revertedWithCustomError(wrapped, "OwnableUnauthorizedAccount");
      });

      it("Should not allow add wrapped balance to owner and adjust supply while paused", async function () {
        const { wrapped, owner } = await loadFixture(deployToken);

        await wrapped.pause();
        await expect(wrapped.increaseWrapped(10)).to.be.revertedWithCustomError(wrapped, "EnforcedPause");
        await wrapped.unpause();
        await wrapped.increaseWrapped(10);

        expect(await wrapped.balanceOf(owner)).to.equal(10);
        expect(await wrapped.totalSupply()).to.equal(10);
      });

      it("Should not allow remove wrapped from owner and adjust total supply while paused", async function () {
        const { wrapped, owner } = await loadFixture(deployToken);

        await wrapped.increaseWrapped(10);

        await wrapped.pause();
        await expect(wrapped.decreaseWrapped(10)).to.be.revertedWithCustomError(wrapped, "EnforcedPause");

        await wrapped.unpause();
        await wrapped.decreaseWrapped(10);

        expect(await wrapped.balanceOf(owner)).to.equal(0);
        expect(await wrapped.totalSupply()).to.equal(0);
      });

    });

    describe("Holder", function () {
      it("Should add wrapped to Holder A", async function () {
        const { wrapped, owner, holderA } = await loadFixture(deployToken);

        await wrapped.increaseWrapped(15);
        await wrapped.pause();
        await expect(wrapped.transfer(holderA, 15)).to.be.revertedWithCustomError(wrapped, "EnforcedPause");

        await wrapped.unpause();
        await wrapped.transfer(holderA, 15);

        expect(await wrapped.balanceOf(owner)).to.equal(0);
        expect(await wrapped.balanceOf(holderA)).to.equal(15);
        expect(await wrapped.totalSupply()).to.equal(15);
      });
    });
  });

});

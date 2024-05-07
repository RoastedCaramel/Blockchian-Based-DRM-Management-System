var MusicMarketplace = artifacts.require("../contracts/MusicMarketplace.sol");

module.exports = function(deployer) {
  deployer.deploy(MusicMarketplace);
};
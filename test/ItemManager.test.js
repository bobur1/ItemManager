
const ItemManager = artifacts.require("./ItemManager.sol");
const ItemManagerV2 = artifacts.require("./ItemManagerV2.sol");
const UpgradeableProxy = artifacts.require("./UpgradeableProxy.sol");
const UpgradeableProxyAdmin = artifacts.require("./UpgradeableProxyAdmin.sol");
const Item = artifacts.require("./Item.sol");
const chai = require("./setupchai.js");
const BN = web3.utils.BN;
const expect = chai.expect;

contract("ItemManager", accounts => {
    const ownerAccount = accounts[0];
    const clientAccount = accounts[1];
    const itemName = "test item";
    const itemPrice = new BN(500);
    let itemManagerInstance;
    let itemManagerInitialDeploy;
    let proxyAdminInstance;
    let proxyInstance;


    //create new smart contract itemManagerInstance before each test method
    beforeEach(async function() {
        itemManagerInitialDeploy = await ItemManager.new();
        proxyAdminInstance = await UpgradeableProxyAdmin.new({from: ownerAccount});
        proxyInstance = await UpgradeableProxy.new(itemManagerInitialDeploy.address, proxyAdminInstance.address, '0x');
        itemManagerInstance = await ItemManager.at(proxyInstance.address);
        await itemManagerInstance.initialize(ownerAccount);
    });

    it("... should let you create new Items.", async () => {
        const result = await itemManagerInstance.createItem(itemName, itemPrice, {from: ownerAccount});
        let resultItemAddress = result.logs[0].args._address;
        const item = await itemManagerInstance.items(resultItemAddress);        

        expect(resultItemAddress).bignumber.equal(item._item);
        expect(item._step).bignumber.is.zero;
    });

    it("... should NOT let you create new Items.", async () => {      
        return expect(itemManagerInstance.createItem(itemName, itemPrice, {from: clientAccount})).to.eventually.be.rejected;
    });

    it("... should NOT let you pay for the created Item.", async () => {
        const createItem = await itemManagerInstance.createItem(itemName, itemPrice, {from: ownerAccount});
        
        await expect(itemManagerInstance.triggerPayment(createItem.logs[0].args._address, {from: clientAccount, value: itemPrice})).to.be.eventually.rejected;
        
        return expect(itemManagerInstance.triggerPayment(createItem.logs[0].args._address, {from: ownerAccount, value: itemPrice})).to.be.eventually.rejected;
    });
      
    it("... should let you pay for the created Item.", async () => {
      const createItem = await itemManagerInstance.createItem(itemName, itemPrice, {from: ownerAccount});
      const itemAddress = createItem.logs[0].args._address;
      const itemInstance = await Item.at(itemAddress);
      await itemInstance.sendTransaction({from: clientAccount, value: itemPrice});
      
      expect(await itemManagerInstance.getBalance({from: ownerAccount})).to.be.a.bignumber.equal(itemPrice);

      const item = await itemManagerInstance.items(itemAddress);
      
      expect(item._step).to.be.a.bignumber.equal(new BN(1));
      return expect(itemManagerInstance.getBalance({from: clientAccount})).to.eventually.rejected;
    });
    
    it("... should NOT let you change delivery flag of the created Item.", async () => {
      const createItem = await itemManagerInstance.createItem(itemName, itemPrice);
    
      expect(itemManagerInstance.triggerDelivery(createItem.logs[0].args._address, {from: clientAccount, value: itemPrice})).to.be.eventually.rejected;
      return expect(itemManagerInstance.triggerDelivery(createItem.logs[0].args._address, {from: ownerAccount, value: itemPrice})).to.be.eventually.rejected;
    });
      
    it("... should let you change delivery flag of the created Item.", async () => {
      const createItem = await itemManagerInstance.createItem(itemName, itemPrice, {from: ownerAccount});
      const itemAddress = createItem.logs[0].args._address;
      
      const itemInstance = await Item.at(itemAddress);
      await itemInstance.sendTransaction({from: clientAccount, value: itemPrice});
      const triggerDelivery = await itemManagerInstance.triggerDelivery(itemAddress, {from: ownerAccount});
      
      return expect(triggerDelivery.logs[0].args._step).to.be.a.bignumber.equal(new BN(2));
    });
      
    it("... should let you create batch of Items.", async () => {
      const result = await itemManagerInstance.createItems([itemName+"1", itemName+"2"], [itemPrice+1, itemPrice+2], {from: ownerAccount});
      let resultItemAddress = result.logs[1].args._address;
      const item = await itemManagerInstance.items(resultItemAddress);        

      expect(resultItemAddress).bignumber.equal(item._item);
      expect(item._step).bignumber.is.zero;
      expect(item._identifier).a("string").equal(itemName+"2");
      return expect(item._identifier).bignumber.equal(itemName+"2");
    });

    it("... should NOT let you create batch of EMPTY Items.", async () => {
     return expect(itemManagerInstance.createItems([], [], {from: ownerAccount})).to.be.eventually.rejected;
    });

    it("... should NOT let you create batch of Items if you are not the owner.", async () => {
     return expect(itemManagerInstance.createItems([itemName], [itemPrice], {from: clientAccount})).to.be.eventually.rejected;
    });

    
    it("... should let you change implementation to ItemManagerV2.", async () => {
      let itemManagerV2InitialDeploy = await ItemManagerV2.new();
      await proxyAdminInstance.upgrade(proxyInstance.address, itemManagerV2InitialDeploy.address, {from: ownerAccount});

      let itemManagerV2Instance = await ItemManagerV2.at(proxyInstance.address);
      await itemManagerV2Instance.setVat(100, {from: ownerAccount});
      expect(await itemManagerV2Instance.vat()).to.be.bignumber.equal(new BN(100));
    });
});
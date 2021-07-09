// SPDX-License-Identifier: MIT
pragma solidity ^0.8;

import "./Item.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";

contract ItemManager is Initializable {
    using Clones for address;

    address public originalItemAddress;
    address public owner;
    
    struct S_Item {
        Item _item;
        ItemManager.SupplyChainSteps _step;
        string _identifier;
    }
    mapping(address => S_Item) public items;
    enum SupplyChainSteps {Created, Paid, Delivered}
    event SupplyChainStep(uint _step, address _address);

    modifier onlyOwner() {
        require(msg.sender == owner, "Ownable: caller is not the owner");
        _;
    }

    function initialize(address _owner) public initializer {
        originalItemAddress = address(new Item(this, 0));
        owner = _owner;
    }

    function createItem(string memory _identifier, uint _priceInWei) public virtual onlyOwner {
        address itemCloneAddress = originalItemAddress.clone();
        Item(payable(itemCloneAddress)).initialize(this, _priceInWei);
        items[itemCloneAddress]._item = Item(payable(itemCloneAddress));
        items[itemCloneAddress]._step = SupplyChainSteps.Created;
        items[itemCloneAddress]._identifier = _identifier;
        emit SupplyChainStep(uint(items[itemCloneAddress]._step), itemCloneAddress);
    }

    function createItems(string[] memory _identifier, uint[] memory _priceInWei) public onlyOwner {
        require(_identifier.length > 0 && _identifier.length == _priceInWei.length);
        for(uint i; i<_identifier.length; i++) {
            createItem(_identifier[i], _priceInWei[i]);
        }
    }

    function triggerPayment(address _address) public payable {
        Item item = items[_address]._item;
        require(address(item) == msg.sender, "Only items are allowed to update themselves");
        require(item.priceInWei() == msg.value, "Not fully paid yet");
        require(items[_address]._step == SupplyChainSteps.Created, "Item is further in the supply chain");
        items[_address]._step = SupplyChainSteps.Paid;
        emit SupplyChainStep(uint(items[_address]._step), _address);
    }

    function triggerDelivery(address _address) public onlyOwner {
        require(items[_address]._step == SupplyChainSteps.Paid, "Item is further in the supply chain");
        items[_address]._step = SupplyChainSteps.Delivered;
        (bool success, ) = address(_address).call(abi.encodeWithSignature("close()"));
        require(success, "Contract steel alive");
        emit SupplyChainStep(uint(items[_address]._step), _address);
    }

    function getBalance() public view onlyOwner returns (uint) {
        return address(this).balance;
    }
}
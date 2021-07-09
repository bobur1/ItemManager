// SPDX-License-Identifier: MIT
pragma solidity ^0.8;

import "./ItemManager.sol";

contract ItemManagerV2 is ItemManager {
    uint public vat;

    function setVat(uint _vat) public onlyOwner {
        vat = _vat;
    }

    function createItem(string memory _identifier, uint _priceInWei) public override onlyOwner {
        address itemCloneAddress = Clones.clone(originalItemAddress);
        Item(payable(itemCloneAddress)).initialize(this, ((_priceInWei * vat )/100));
        items[itemCloneAddress]._item = Item(payable(itemCloneAddress));
        items[itemCloneAddress]._step = SupplyChainSteps.Created;
        items[itemCloneAddress]._identifier = _identifier;
        emit SupplyChainStep(uint(items[itemCloneAddress]._step), itemCloneAddress);
    }

}
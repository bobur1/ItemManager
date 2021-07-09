// SPDX-License-Identifier: MIT
pragma solidity ^0.8;

import "./ItemManager.sol";

contract Item {
    uint public priceInWei;

    ItemManager parentContract;

    constructor(ItemManager _parentContract, uint _priceInWei) {
        initialize(_parentContract, _priceInWei);
    }

    function initialize(ItemManager _parentContract, uint _priceInWei) public {
        require(priceInWei == 0, "Contract instance has already been initialized");
        priceInWei = _priceInWei;
        parentContract = _parentContract;
    }

    receive() external payable {
        require(msg.value == priceInWei, "We don't support partial payments");
        (bool success, ) = address(parentContract).call{value:msg.value}(abi.encodeWithSignature("triggerPayment(address)", address(this)));
        require(success, "Delivery did not work");
    }

    fallback () external {}

    function close() external { 
        selfdestruct(payable(address(parentContract))); 
    }

}
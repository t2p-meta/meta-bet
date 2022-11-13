// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

abstract contract MetaWallet {
    // 支持充值token
    IERC20 erc20Token;

    // 币种列表
    address[] tokens;

    // 币种记录表
    mapping(address => bool) supportTokens;

    // Token Balance = 蓝钻数量
    mapping(address => uint256) tokenBalance;

    /* Allow users to deposit Tokens */
    function deposit(uint256 _amount) public payable {
        // require(_amount <= MAX_DEPOSIT, "Cannot deposit more than 999999");
        require(_amount > 0, "Cannot deposit 0");

        require(erc20Token.transferFrom(msg.sender, address(this), _amount));
        tokenBalance[msg.sender] = tokenBalance[msg.sender] + _amount;
    }

    /* Allow users to withdraw Tokens */
    function withdraw(uint256 _amount) public {
        require(
            _amount <= tokenBalance[msg.sender],
            "Cannot withdraw more than account balance"
        );
        require(_amount > 0, "Cannot withdraw 0");

        require(erc20Token.transfer(msg.sender, _amount));
        tokenBalance[msg.sender] = tokenBalance[msg.sender] - _amount;
    }

    /**
    添加新币种
     */
    function addToken(address token) internal {
        if (token != address(0) && supportTokens[token] != true) {
            supportTokens[token] = true;
            tokens.push(token);
        }
    }

    
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./MetaBetDomain.sol";

library MetaBetLib {
    using SafeMath for uint256;

    function calculateAssetOdds(
        uint256 _oddsWin,
        uint256 _oddsFailOne,
        uint256 _oddsFailTwo
    ) internal pure returns (uint256) {
        return
            _oddsWin
                .add(_oddsFailOne)
                .mul(100000000000000000)
                .div(_oddsFailTwo)
                .add(100000000000000000);
    }

    function calculateAssetValue(uint256 _amountBet, uint256 _odds)
        internal
        pure
        returns (uint256)
    {
        return _amountBet.mul(_odds).div(100);
    }
}

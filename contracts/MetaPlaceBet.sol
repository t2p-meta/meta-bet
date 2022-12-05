// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/*
 * @notice SmartBet core smart contract. Handles matches, bets and farming
 */
contract MetaPlaceBet is Context, Ownable {
    /**
     *押注信息详情
     */
    struct PlaceBetInfo {
        // 押注者
        address bettor;
        // 唯一识别码
        bytes32 hashId;
        // 赛程ID
        uint256 matchId;
        // 比赛参与方信息：(主场):(客场):(次场)
        string matchTeamName;
        // 押注team队名称
        string betTeamName;
        // 押注金额
        uint256 payAmount;
        // 押注用户Code
        uint256 userCode;
        // bet_timestamp :下注时间
        uint256 betTimestamp;
        // 最终赢率（含本金） finalOdds
        uint256 finalOdds;
    }

    /**
    实时押注金额信息
     */
    struct RealTimeAmount {
        // 实时押注时间节点累计总金额：A
        uint256 totalPayoutTeamA;
        // 实时押注时间节点累计总金额：B
        uint256 totalPayoutTeamB;
        // 实时押注时间节点累计总金额：O
        uint256 totalPayoutDraw;
    }

    /**
     *押注信息提现详情
     */
    struct WithdrawInfo {
        // 押注者
        address bettor;
        // 唯一识别码
        bytes32 hashId;
        // 赛程ID
        uint256 matchId;
        // 赢家手续费率 8% winnerfeerate (让玩家自己设置)
        uint256 winnerFeeRate;
        // 手续费金额
        uint256 feesAmount;
        // withdraw_到手提款金额
        uint256 withdrawAmount;
        // withdraw_timestamp提取时间
        uint256 withdrawTimestamp;
        // 最终赢率（含本金） finalOdds
        uint256 finalOdds;
        // 最终押注总金额
        RealTimeAmount finalTotalAmount;
    }

    ////////////////////////////////////////
    //                                    //
    //         STATE VARIABLES            //
    //                                    //
    ////////////////////////////////////////
    // 用户押注
    mapping(bytes32 => PlaceBetInfo) placeBetInfoByHash;
    // 用户金额提现
    mapping(bytes32 => WithdrawInfo) withdrawInfoByHash;

    ////////////////////////////////////////
    //                                    //
    //              EVENTS                //
    //                                    //
    ////////////////////////////////////////
    event PlaceBetMatchEvent(
        address indexed bettor,
        bytes32 indexed hashId,
        uint256 indexed matchId,
        // 比赛参与方信息：(主场):(客场):(次场)
        string matchTeamName,
        // 押注team队名称
        string betTeamName,
        // 押注金额
        uint256 payAmount,
        // 押注用户Code
        uint256 userCode,
        // bet_timestamp :下注时间
        uint256 betTimestamp,
        // 最终赢率（含本金） finalOdds
        uint256 finalOdds
    );

    event WithdrawEvent(
        address indexed bettor,
        bytes32 indexed hashId,
        uint256 indexed matchId,
        // 赢家手续费率 8% winnerfeerate (让玩家自己设置)
        uint256 winnerFeeRate,
        // 手续费金额
        uint256 feesAmount,
        // withdraw_到手提款金额
        uint256 withdrawAmount,
        // withdraw_timestamp提取时间
        uint256 withdrawTimestamp,
        // 最终赢率（含本金） finalOdds
        uint256 finalOdds,
        // 最终押注总金额
        RealTimeAmount finalTotalAmount
    );

    ////////////////////////////////////////
    //                                    //
    //           CONSTRUCTOR              //
    //                                    //
    ////////////////////////////////////////
    constructor() {}

    ////////////////////////////////////////
    //                                    //
    //              FUNCTIONS             //
    //                                    //
    ////////////////////////////////////////

    /**
     *  @notice  placeBetMatch
     *  @dev
     *  @param
     */
    function placeBetMatch(
        bytes32 _hashId,
        uint256 _matchId,
        // 比赛参与方信息：(主场):(客场):(次场)
        string calldata _matchTeamName,
        // 押注team队名称
        string calldata _betTeamName,
        // 押注金额
        uint256 _payAmount,
        // 押注用户Code
        uint256 _userCode,
        // 最终赢率（含本金） finalOdds
        uint256 _finalOdds
    ) public onlyOwner {
        placeBetInfoByHash[_hashId] = PlaceBetInfo(
            _msgSender(),
            _hashId,
            _matchId,
            _matchTeamName,
            _betTeamName,
            _payAmount,
            _userCode,
            block.timestamp,
            _finalOdds
        );
        emit PlaceBetMatchEvent(
            _msgSender(),
            _hashId,
            _matchId,
            _matchTeamName,
            _betTeamName,
            _payAmount,
            _userCode,
            block.timestamp,
            _finalOdds
        );
    }

    /**
     *  @notice  withdraw
     *  @dev
     *  @param
     */
    function withdraw(
        bytes32 _hashId,
        uint256 _matchId,
        // 赢家手续费率 8% winnerfeerate (让玩家自己设置)
        uint256 _winnerFeeRate,
        // 手续费金额
        uint256 _feesAmount,
        // withdraw_到手提款金额
        uint256 _withdrawAmount,
        // 最终赢率（含本金） finalOdds
        uint256 _finalOdds,
        // 最终押注总金额
        RealTimeAmount calldata _finalTotalAmount
    ) public onlyOwner {
        withdrawInfoByHash[_hashId] = WithdrawInfo(
            _msgSender(),
            _hashId,
            _matchId,
            _winnerFeeRate,
            _feesAmount,
            _withdrawAmount,
            block.timestamp,
            _finalOdds,
            _finalTotalAmount
        );

        emit WithdrawEvent(
            _msgSender(),
            _hashId,
            _matchId,
            _winnerFeeRate,
            _feesAmount,
            _withdrawAmount,
            block.timestamp,
            _finalOdds,
            _finalTotalAmount
        );
    }

    /**
     * @dev _hashId
     * @return info
     */
    function getPlaceBetInfo(bytes32 _hashId)
        public
        view
        virtual
        returns (PlaceBetInfo memory info)
    {
        return placeBetInfoByHash[_hashId];
    }

    /**
     * @dev _hashId
     * @return info
     */
    function getWithdraw(bytes32 _hashId)
        public
        view
        virtual
        returns (WithdrawInfo memory info)
    {
        return withdrawInfoByHash[_hashId];
    }

    receive() external payable {}
}

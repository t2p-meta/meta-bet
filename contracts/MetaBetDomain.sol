// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

contract MetaBetDomain {
    enum AssetType {
        ETH,
        ERC20,
        ERC1155,
        ERC721,
        ERC721Deprecated
    }

    enum MatchResult {
        NOT_DETERMINED,
        DRAW,
        TEAM_A_WON,
        TEAM_B_WON
    }
    enum MatchState {
        NOT_STARTED,
        STARTED,
        FINISHED
    }

    uint8 private constant TEAM_A = 1;
    uint8 private constant TEAM_B = 2;

    /**
        第一次：createMatch
        第二次：chainLink获取比赛结果后更新
     */
    struct Match {
        address creator;
        // 获取比赛结果链接
        string matchResultLink;
        uint256 totalPayoutTeamA;
        uint256 totalPayoutTeamB;
        uint256 totalPayoutDraw;
        //totalCollected; 每取一笔更新对账结果
        uint256 totalWithDraw;
        bool exists;
        // A队得分 A 5
        uint8 scoreTeamA;
        // B队得分 scoreB 1
        uint8 scoreTeamB;
        // 最终赢率（含本金） finalOdds
        uint256 finalOdds;
        // 下注Id （最终下注ID）（chainlink取值后查询下注ID）
        uint256 finalAssetId;
        // 比赛信息
        MatchInfo matchInfo;
        // 比赛结果
        MatchResult result;
        // 押注赛程状态
        MatchState state;
    }

    // Match base Info
    struct MatchInfo {
        // teamA队名称
        string teamAName;
        // teamB队名称
        string teamBName;
        // 赢家手续费率 8% winnerfeerate (让玩家自己设置)
        uint256 winnerFeeRate;
        // 比赛开始时间
        uint256 startAt;
        // 押注资产类型
        AssetType assetType;
        // USDC和USDT不写这里，写在公共变量里面，新增发的币可以写在这里
        address payToken;
        uint256 initOddsTeamA;
        uint256 initOddsTeamB;
        uint256 initOddsDraw;
    }

    /**
    用户押注表
     */
    struct SmartAsset {
        // 押注者
        address owner;
        // 赛程ID
        uint256 matchId;
        // 押注 哪一方
        MatchResult matchResult;
        // 押注资产信息
        PayAsset betInfo;
        // 实时押注金额信息
        RealTimeAmount realTimeAmount;
        // 累计利息
        uint8 accruedInterest;
        // bet_timestamp :下注时间
        uint256 betTimestamp;
        // 手续费金额
        uint256 feesAmount;
        // withdraw_到手提款金额
        uint256 withdrawAmount;
        // withdraw_timestamp提取时间
        uint256 withdrawTimestamp;
    }

    /**
     *押注资产信息
     */
    struct PayAsset {
        // 押注资产类型 ETH 或ERC20 实付币种
        AssetType assetType;
        // USDC
        address payToken;
        // 押注金额
        uint256 payAmount;
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

}

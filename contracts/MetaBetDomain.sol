// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

abstract contract MetaBetDomain {
    // flag to determine if contracts core functionalities can be performed
    bool circuitBreaker = false;

    // 体育运动联赛
    mapping(uint256 => League) leagues;

    // holds all NFTs issued to winners
    mapping(uint256 => SmartAsset) smartAssets; // 押注表

    // holds all created matches (key: idCounter)
    mapping(uint256 => Match) matches; // 赛程表
    // holds all bets on a match
    // mapping(matchId => mapping(gameResult => smartAssetId[])) matchBets;
    mapping(uint256 => mapping(MatchResult => uint256[])) matchBets;

    // holds all apiMatchId -> onChain-MatchId to prevent duplicate entries
    // 同一个赛程Id可能从不同的网站获取赔率
    mapping(uint256 => uint256) apiMatches;

    enum Role {
        ADMIN,
        CREATOR,
        OPERATOR
    }

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

    /**
    体育运动联赛
     */
    struct League {
        // 创建者
        address creator;
        // 联赛名称
        string name;
        // 国家
        string country;
        // 联赛logo
        string logo;
        // 标志（是否结束：默认flase）
        bool flag;
    }

    /**
        第一次：createMatch
        第二次：chainLink获取比赛结果后更新
     */
    struct Match {
        // 创建者
        address creator;
        // league编号
        uint256 leagueId;
        // 获取比赛结果链接
        string matchResultLink;
        uint256 totalPayoutTeamA;
        uint256 totalPayoutTeamB;
        uint256 totalPayoutDraw;
        //totalCollected; 每取一笔更新对账结果
        uint256 totalWithDraw;
        // 比赛项目是否存在
        bool exists;
        // raw名称(非team队，默认draw)
        uint8 scoreDraw;
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
        // draw名称(非team队，默认draw)
        string drawName;
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
        // league编号
        uint256 leagueId;
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
        // 押注team队名称
        string betTeamName;
    }

    /**
    用户押注详情信息
     */
    struct MatchSmartAssetInfo {
        SmartAsset smartAssetInfo;
        Match matchDetail;
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

    ////////////////////////////////////////
    //                                    //
    //              MODIFIERS             //
    //                                    //
    ////////////////////////////////////////

    /*
     *  @notice  Ensure league exists
     */
    modifier leagueExists(uint256 _leagueId) {
        require(leagues[_leagueId].flag, "on chain league does not exist");
        _;
    }

    /*
     *  @notice  Ensure match does not previously exist
     */
    modifier isNewMatch(uint256 _matchId) {
        require(!matches[_matchId].exists, "on chain match exists");
        _;
    }

    /*
     *  @notice  Ensure api match does not previously exist
     */
    modifier isNewAPIMatch(uint256 _api_matchId) {
        require(apiMatches[_api_matchId] == 0, "api match ID exists");
        _;
    }

    /*
     *  @notice  Ensure match exists
     */
    modifier matchExists(uint256 _matchId) {
        require(matches[_matchId].exists, "on chain match does not exist");
        _;
    }

    /*
     *  @notice  Ensure match has not started
     */
    modifier matchNotStarted(uint256 _matchId) {
        require(
            matches[_matchId].state == MatchState.NOT_STARTED,
            "match started"
        );
        _;
    }

    /*
     *  @notice  Ensure match has started
     */
    modifier matchStarted(uint256 _matchId) {
        require(
            matches[_matchId].state == MatchState.STARTED,
            "match not started"
        );
        _;
    }

    /*
     *  @notice  Ensure match has ended
     */
    modifier matchFinished(uint256 _matchId) {
        require(
            matches[_matchId].state == MatchState.FINISHED,
            "match not finished"
        );
        _;
    }

    /*
     *  @notice Checks if core functionalities can be performed
     *  @dev Checks if the circuitBreaker state variable is false
     */
    modifier isCircuitBreakOff() {
        require(!circuitBreaker, "Circuit breaker is on");
        _;
    }

    /*
     *  @notice  Ensures bets are allowed on the match
     *  @dev     The totalCollected on the match must be greater than the total payout on the team the bettor wants to bet on. The incoming bet is inclusive in the calculation
     */
    modifier isBetAllowed(uint256 _matchId) {
        require(true, "Bet is not allowed");
        _;
    }

    modifier validateMatchResult(uint8 _matchResult) {
        require(
            MatchResult(_matchResult) == MatchResult.TEAM_A_WON ||
                MatchResult(_matchResult) == MatchResult.TEAM_B_WON ||
                MatchResult(_matchResult) == MatchResult.DRAW,
            "Invalid match result"
        );
        _;
    }
}

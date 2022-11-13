// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

import "./MetaBetDomain.sol";

interface MetaBetInterface {
    ////////////////////////////////////////
    //                                    //
    //              EVENTS                //
    //                                    //
    ////////////////////////////////////////

    //Can be used by the clients to get all Leagues in a particular time
    event LeagueCreatedEvent(
        address indexed creator,
        uint256 indexed leagueId,
        uint256 indexed createdOn,
        MetaBetDomain.League leagueInfo
    );

    event LeagueClosedEvent(
        address indexed by,
        uint256 indexed leagueId,
        uint256 indexed closedAt
    );

    //Can be used by the clients to get all matches in a particular time
    event MatchCreatedEvent(
        address indexed creator,
        uint256 indexed leagueId,
        uint256 matchId,
        uint256 apiMatchId,
        uint256 indexed createdOn,
        MetaBetDomain.MatchInfo info
    );

    //Can be used by the clients to get all bets placed by a better in a particular time
    event BetPlacedEvent(
        address indexed bettor,
        uint256 indexed leagueId,
        uint256 indexed matchId,
        MetaBetDomain.MatchResult result,
        uint256 amount,
        uint256 betPlacedAt,
        MetaBetDomain.AssetType assetType,
        address payToken
    );
    event SmartAssetAwardedEvent(
        address indexed awardee,
        uint256 indexed leagueId,
        uint256 indexed matchId,
        MetaBetDomain.MatchResult result,
        uint256 smartAssetId,
        uint256 awardedAt,
        MetaBetDomain.AssetType assetType,
        address payToken,
        // 实时押注金额信息
        MetaBetDomain.RealTimeAmount realTimeAmount
    );
    event MatchStartEvent(
        address indexed by,
        uint256 indexed leagueId,
        uint256 indexed matchId,
        uint256 startAt
    );
    event MatchClosedEvent(
        address indexed by,
        uint256 indexed leagueId,
        uint256 indexed matchId,
        uint256 closedAt
    );
    event MatchResultSetEvent(
        uint256 indexed leagueId,
        uint256 indexed matchId,
        MetaBetDomain.MatchResult result,
        uint256 setAt,
        uint8 scoreTeamA,
        uint8 scoreTeamB
    );
    event AssetLiquidatedEvent(
        address indexed by,
        uint256 indexed leagueId,
        uint256 indexed matchId,
        uint256 amount,
        uint256 liquidatedAt,
        MetaBetDomain.AssetType assetType,
        address payToken
    );

    /**
     * @dev apiMatchId
     * @return uint256
     */
    function apiMatchId(uint256 _fixtureId) external view returns (uint256);

    /**
     * @dev countMatchs
     * @return uint256
     */
    function countMatchs() external view returns (uint256);

    /**
     * @dev currentMatchId
     * @return uint256
     */
    function matchResultLink(uint256 _matchId)
        external
        view
        returns (string memory);

    /*
     *  @notice  Match manual start by admin.
     *  @param 以比赛下半场算启动
     *  @return
     */
    function startMatch(uint256 _matchId) external;

    /*
     *  @notice  Match manual close by admin. Trigger "getResult()"
     *  @dev     [Real] ChainlinkClient API Request oracles gets match result of winning team. Then, match is closed.
     *           [Temporary] (Implemented because there's no BSC testnet oracle node)
     *                       Frontend gets result via result link and posts winning team. Then, match is closed.
     *  @param
     *  @return  success success status
     */
    function closeMatch(
        uint256 _matchId,
        uint8 _matchResult,
        uint8 scoreDraw,
        uint8 scoreTeamA,
        uint8 scoreTeamB
    ) external;

    /*
     *  @notice  Fetch match details
     *  @dev
     *  @oaram   _matchId
     *  @return match match details
     */
    function getMatch(uint256 _matchId)
        external
        view
        returns (MetaBetDomain.Match memory match_);
}

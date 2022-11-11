// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

import "@chainlink/contracts/src/v0.8/ChainlinkClient.sol";
// import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./MetaBetDomain.sol";
import "hardhat/console.sol";

// import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/18c7efe800df6fc19554ece3b1f238e9e028a1db/contracts/token/ERC721/ERC721.sol";
// import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/18c7efe800df6fc19554ece3b1f238e9e028a1db/contracts/utils/Counters.sol";
// import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/18c7efe800df6fc19554ece3b1f238e9e028a1db/contracts/math/SafeMath.sol";

/*
 * @notice SmartBet core smart contract. Handles matches, bets and farming
 */
contract MetaBet is MetaBetDomain {
    using Counters for Counters.Counter;
    using SafeMath for uint256;
    uint256 private constant MAX_DEPOSIT = 999999;

    // 押注者数量，如果押注用户为0或者所有用户都已经提取完资产，管理者可以提取剩余的资产余额
    uint256 private assetCount = 0;

    ////////////////////////////////////////
    //                                    //
    //         STATE VARIABLES            //
    //                                    //
    ////////////////////////////////////////
    // contract owner adress
    address private owner;

    // incremented id for league id generation
    Counters.Counter private leagueIds;

    // incremented for match id generation
    Counters.Counter private matchIds;

    // incremented id for NFT minting
    Counters.Counter private tokenIds;

    // 支持充值token
    IERC20 public erc20Token;
    // 币种记录表
    mapping(address => bool) supportTokens;
    // 币种列表
    address[] private tokens;

    // 比赛创建者角色信息
    mapping(address => bool) private _signers;

    // flag to determine if contracts core functionalities can be performed
    bool circuitBreaker = false;

    // 重入工具判断
    bool retryAttach = false;

    // 体育运动联赛
    mapping(uint256 => League) leagues;

    // holds all NFTs issued to winners
    mapping(uint256 => SmartAsset) smartAssets; // 押注表

    // holds all created matches (key: idCounter)
    mapping(uint256 => Match) matches; // 赛程表

    // holds all apiMatchId -> onChainMatchId to prevent duplicate entries
    // 同一个赛程Id可能从不同的网站获取赔率
    mapping(uint256 => uint256) apiMatches;

    // holds all bets on a match
    // mapping(matchId => mapping(gameResult => smartAssetId[])) matchBets;
    mapping(uint256 => mapping(MatchResult => uint256[])) matchBets;

    // mapping(bytes32 => uint256) matchResultRequestIds;

    mapping(address => uint256[]) private matchesBetted;

    // Mapping from smartAssetId to owner address
    mapping(uint256 => address) private _owners; // 关联关系

    // Token Balance = 蓝钻数量
    mapping(address => uint256) public tokenBalance;

    ////////////////////////////////////////
    //                                    //
    //           CONSTRUCTOR              //
    //                                    //
    ////////////////////////////////////////

    constructor(address _erc20Token) {
        owner = msg.sender;
        erc20Token = IERC20(_erc20Token);
        addToken(_erc20Token);
        console.log("deploy ..... contract meta bet...");
    }

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
        League leagueInfo
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
        MatchInfo info
    );

    //Can be used by the clients to get all bets placed by a better in a particular time
    event BetPlacedEvent(
        address indexed bettor,
        uint256 indexed leagueId,
        uint256 indexed matchId,
        MatchResult result,
        uint256 amount,
        uint256 betPlacedAt,
        AssetType assetType,
        address payToken
    );
    event SmartAssetAwardedEvent(
        address indexed awardee,
        uint256 indexed leagueId,
        uint256 indexed matchId,
        MatchResult result,
        uint256 smartAssetId,
        uint256 awardedAt,
        AssetType assetType,
        address payToken,
        // 实时押注金额信息
        RealTimeAmount realTimeAmount
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
        MatchResult result,
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
        AssetType assetType,
        address payToken
    );

    ////////////////////////////////////////
    //                                    //
    //              MODIFIERS             //
    //                                    //
    ////////////////////////////////////////

    /*
     *  @notice  Restrict caller only owner
     */
    modifier onlyOwner() {
        require(msg.sender == owner, "caller is not owner");
        _;
    }

    modifier onlySigner() {
        require(
            isSigner(msg.sender),
            "SignerRole: caller does not have the Signer role"
        );
        _;
    }
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
     *  @notice Checks if the NFT is valid
     *  @dev Validates NFT
     */
    modifier validateToken(uint256 _tokenId) {
        require(_exists(_tokenId), "Invalid token");
        _;
    }

    /*
     *  @notice  Ensure token belongs to the caller
     */
    modifier isTokenOwner(uint256 _tokenId) {
        require(ownerOf(_tokenId) == msg.sender, "caller is not token owner");
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

    ////////////////////////////////////////
    //                                    //
    //              FUNCTIONS             //
    //                                    //
    ////////////////////////////////////////

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

    /*
     *  @notice  New League creation
     *  @dev
     *  @param
     *  @return  league Id
     */
    function createLeague(
        string calldata _name,
        string calldata _country,
        string calldata _logo
    ) public onlyOwner returns (uint256) {
        leagueIds.increment();
        uint256 leagueId = leagueIds.current();

        leagues[leagueId] = League(msg.sender, _name, _country, _logo, true);
        //  address creator,
        // uint256 indexed leagueId,
        // uint256 indexed createdOn,
        // League leagueInfo
        uint256 createdOnDay = block.timestamp - (block.timestamp % 86400);
        emit LeagueCreatedEvent(
            msg.sender,
            leagueId,
            createdOnDay,
            leagues[leagueId]
        );
        return leagueId;
    }

    /*
     *  @notice  League colse
     *  @dev
     *  @param
     *  @return  league Id
     */
    function closeLeague(uint256 _leagueId)
        public
        onlyOwner
        leagueExists(_leagueId)
        returns (uint256)
    {
        leagues[_leagueId].flag = true;
        emit LeagueClosedEvent(msg.sender, _leagueId, block.timestamp);
        return _leagueId;
    }

    /*
     *  @notice  New match creation
     *  @dev
     *  @param
     *  @return  match Id
     */
    function createMatch(
        uint256 _leagueId,
        uint256 _apiMatchId,
        string calldata _matchResultLink,
        MatchInfo calldata _matchInfo
    )
        public
        payable
        leagueExists(_leagueId)
        isNewAPIMatch(_apiMatchId)
        returns (uint256)
    {
        uint256 amountBet = msg.value;
        require(
            _matchInfo.initOddsTeamA > 0 &&
                _matchInfo.initOddsTeamB > 0 &&
                _matchInfo.initOddsDraw > 0,
            "Invalid Odds [TeamA or TeamB or Draw]"
        );
        if (_matchInfo.assetType == AssetType.ETH) {
            require(amountBet != 0, "Invalid amount bet");
            payable(address(this)).transfer(amountBet);
        }
        if (_matchInfo.assetType == AssetType.ERC20) {
            amountBet =
                _matchInfo.initOddsTeamA +
                _matchInfo.initOddsTeamB +
                _matchInfo.initOddsDraw;
            require(
                IERC20(_matchInfo.payToken).transferFrom(
                    msg.sender,
                    address(this),
                    amountBet
                )
            );
        }
        if (!isSigner(msg.sender)) {
            addSigner(msg.sender);
        }
        matchIds.increment();
        uint256 matchId = matchIds.current();
        RealTimeAmount memory realTimeAmount = RealTimeAmount(
            _matchInfo.initOddsTeamA,
            _matchInfo.initOddsTeamB,
            _matchInfo.initOddsDraw
        );

        apiMatches[_apiMatchId] = matchId;
        // 创建比赛项目
        matches[matchId] = Match(
            msg.sender,
            _leagueId,
            _matchResultLink,
            _matchInfo.initOddsTeamA,
            _matchInfo.initOddsTeamB,
            _matchInfo.initOddsDraw,
            0,
            true,
            0, // 平或X队得分
            0, // A队得分 A 0
            0, // B队得分 scoreB 0
            0, // 最终赢率（含本金） finalOdds 0
            tokenIds.current(), // 下注Id （最终下注ID）（chainlink取值后查询下注ID）
            _matchInfo, // 比赛信息
            MatchResult.NOT_DETERMINED, // 比赛结果
            MatchState.NOT_STARTED // 押注赛程状态
        );

        // 初始化A队押注金额
        awardBetSmartAsset(
            msg.sender,
            _leagueId,
            matchId,
            MatchResult.TEAM_A_WON,
            _matchInfo.assetType,
            _matchInfo.payToken,
            _matchInfo.initOddsTeamA,
            realTimeAmount
        );
        // 初始化B队押注金额
        awardBetSmartAsset(
            msg.sender,
            _leagueId,
            matchId,
            MatchResult.TEAM_B_WON,
            _matchInfo.assetType,
            _matchInfo.payToken,
            _matchInfo.initOddsTeamB,
            realTimeAmount
        );
        // 初始化平押注金额
        awardBetSmartAsset(
            msg.sender,
            _leagueId,
            matchId,
            MatchResult.DRAW,
            _matchInfo.assetType,
            _matchInfo.payToken,
            _matchInfo.initOddsDraw,
            realTimeAmount
        );

        addToken(_matchInfo.payToken);
        emitMatchCreatedEvent(_leagueId, matchId, _apiMatchId, _matchInfo);
        return matchId;
    }

    function emitMatchCreatedEvent(
        uint256 _leagueId,
        uint256 _matchId,
        uint256 _apiMatchId,
        MatchInfo calldata _info
    ) internal {
        uint256 createdOnDay = block.timestamp - (block.timestamp % 86400);
        emit MatchCreatedEvent(
            msg.sender,
            _leagueId,
            _matchId,
            _apiMatchId,
            createdOnDay,
            _info
        );
    }

    function calculateAssetValue(uint256 _amountBet, uint256 _odds)
        internal
        pure
        returns (uint256)
    {
        return _amountBet.mul(_odds).div(100);
    }

    /*
     *  @notice  New bet creation. Mint NFT to bettor
     *  @dev
     *  @param
     *  @return  token id
     */
    function placeBet(
        uint256 _matchId,
        uint8 _resultBetOn,
        PayAsset calldata _payAsset
    )
        public
        payable
        isCircuitBreakOff
        matchExists(_matchId)
        matchNotStarted(_matchId)
        isBetAllowed(_matchId)
        validateMatchResult(_resultBetOn)
        returns (uint256)
    {
        uint256 amountBet = msg.value;
        if (
            _payAsset.assetType != AssetType.ETH &&
            _payAsset.assetType != AssetType.ERC20 &&
            _payAsset.assetType != AssetType.ERC721 &&
            _payAsset.assetType != AssetType.ERC1155 &&
            _payAsset.assetType != AssetType.ERC721Deprecated
        ) {
            return 0;
        }
        // 判断是否为本次押注项目支持币种
        require(
            matches[_matchId].matchInfo.payToken == _payAsset.payToken,
            "Current match does not support betting in this currency"
        );
        if (matches[_matchId].matchInfo.startAt < block.timestamp) {
            matches[_matchId].state = MatchState.STARTED;
            return 0;
        }
        if (_payAsset.assetType == AssetType.ETH) {
            require(amountBet != 0, "Invalid amount bet");
            payable(address(this)).transfer(amountBet);
        }
        if (_payAsset.assetType == AssetType.ERC20) {
            amountBet = _payAsset.payAmount;
            require(amountBet != 0, "Invalid amount bet");
            require(
                IERC20(_payAsset.payToken).transferFrom(
                    msg.sender,
                    address(this),
                    amountBet
                )
            );
        }
        MatchResult matchResultBetOn = MatchResult(_resultBetOn);
        //update team's total payout
        if (matchResultBetOn == MatchResult.TEAM_A_WON) {
            matches[_matchId].totalPayoutTeamA = matches[_matchId]
                .totalPayoutTeamA
                .add(amountBet);
        } else if (matchResultBetOn == MatchResult.TEAM_B_WON) {
            matches[_matchId].totalPayoutTeamB = matches[_matchId]
                .totalPayoutTeamB
                .add(amountBet);
        } else {
            matches[_matchId].totalPayoutDraw = matches[_matchId]
                .totalPayoutDraw
                .add(amountBet);
        }

        RealTimeAmount memory realTimeAmount = RealTimeAmount(
            matches[_matchId].totalPayoutTeamA,
            matches[_matchId].totalPayoutTeamB,
            matches[_matchId].totalPayoutDraw
        );

        // 将押注金额mint成一个NFT作为流动性质押凭证，通过凭证质押获取额外利息
        uint256 smartAssetId = awardSmartAsset(
            msg.sender,
            matches[_matchId].leagueId,
            _matchId,
            matchResultBetOn,
            _payAsset,
            realTimeAmount
        );

        matchesBetted[msg.sender].push(smartAssetId);
        //Save bettor's bet
        matchBets[_matchId][matchResultBetOn].push(smartAssetId);
        // 更新押注ID
        matches[_matchId].finalAssetId = smartAssetId;

        emitBetPlacedEvent(_matchId, matchResultBetOn, _payAsset, amountBet);

        return smartAssetId;
    }

    function emitBetPlacedEvent(
        uint256 _matchId,
        MatchResult _matchResultBetOn,
        PayAsset calldata _payAsset,
        uint256 _amountBet
    ) internal {
        emit BetPlacedEvent(
            msg.sender,
            matches[_matchId].leagueId,
            _matchId,
            _matchResultBetOn,
            _amountBet,
            block.timestamp,
            _payAsset.assetType,
            _payAsset.payToken
        );
    }

    /**
    设置押注信息
     */
    function awardBetSmartAsset(
        address _bettor,
        uint256 _leagueId,
        uint256 _matchId,
        MatchResult _matchResultBetOn,
        AssetType _payType,
        address _payToken,
        uint256 _assetValue,
        RealTimeAmount memory _realTimeAmount
    ) internal {
        PayAsset memory payAsset = PayAsset(_payType, _payToken, _assetValue);
        uint256 smartAssetId = awardSmartAsset(
            _bettor,
            _leagueId,
            _matchId,
            _matchResultBetOn,
            payAsset,
            _realTimeAmount
        );
        matchesBetted[_bettor].push(smartAssetId);
        matchBets[_matchId][_matchResultBetOn].push(smartAssetId);
    }

    /**
     * 设置押注信息
     */
    function awardSmartAsset(
        address _bettor,
        uint256 _leagueId,
        uint256 _matchId,
        MatchResult _matchResultBetOn,
        PayAsset memory _payAsset,
        RealTimeAmount memory _realTimeAmount
    ) internal returns (uint256) {
        tokenIds.increment();

        uint256 smartAssetId = tokenIds.current();
        // _mint(bettor, smartAssetId);
        // 创建资产白条押注关联关系
        _owners[smartAssetId] = _bettor;

        string memory betTeamName = "DRAW";
        //update team's total payout
        if (_matchResultBetOn == MatchResult.TEAM_A_WON) {
            betTeamName = matches[_matchId].matchInfo.teamAName;
        } else if (_matchResultBetOn == MatchResult.TEAM_B_WON) {
            betTeamName = matches[_matchId].matchInfo.teamBName;
        }

        smartAssets[smartAssetId] = SmartAsset(
            _bettor,
            _leagueId,
            _matchId,
            _matchResultBetOn, // 押注 哪一方
            _payAsset, // ETH 或ERC20 实付币种 // USDC
            _realTimeAmount, // 实时押注时间节点累计总金额：A B O
            0, // 累计利息
            block.timestamp, // bet_timestamp :下注时间
            0, // 手续费金额
            0, // withdraw_到手提款金额
            0, // withdraw_timestamp提取时间
            betTeamName
        );
        assetCount = assetCount + 1;
        emit SmartAssetAwardedEvent(
            _bettor,
            _leagueId,
            _matchId,
            _matchResultBetOn,
            smartAssetId,
            block.timestamp,
            _payAsset.assetType,
            _payAsset.payToken,
            _realTimeAmount
        );

        return smartAssetId;
    }

    /**
     * 计算赔率:
     *  A赔率=（O总金额+B总金额）/A总金额 + 1
     *  B赔率=（O总金额+A总金额）/B总金额 + 1
     *  O赔率=（A总金额+B总金额）/O总金额 + 1
     */
    function calculateOdds(uint256 _matchId) internal {
        uint256 totalPayoutTeamA = matches[_matchId].totalPayoutTeamA;
        uint256 totalPayoutTeamB = matches[_matchId].totalPayoutTeamB;
        uint256 totalPayoutDraw = matches[_matchId].totalPayoutDraw;

        if (matches[_matchId].result == MatchResult.TEAM_A_WON) {
            // TeamA最终赔率
            matches[_matchId].finalOdds = calculateAssetOdds(
                totalPayoutDraw,
                totalPayoutTeamB,
                totalPayoutTeamA
            );
        } else if (matches[_matchId].result == MatchResult.TEAM_B_WON) {
            // TeamB最终赔率
            matches[_matchId].finalOdds = calculateAssetOdds(
                totalPayoutDraw,
                totalPayoutTeamA,
                totalPayoutTeamB
            );
        } else {
            // TeamA和TeamB平局最终赔率
            matches[_matchId].finalOdds = calculateAssetOdds(
                totalPayoutTeamB,
                totalPayoutTeamA,
                totalPayoutDraw
            );
        }
    }

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

    /*
     *  @notice  Match manual start by admin.
     *  @param 以比赛下半场算启动
     *  @return
     */
    function startMatch(uint256 _matchId)
        public
        onlyOwner
        matchExists(_matchId)
        matchNotStarted(_matchId)
    {
        matches[_matchId].state = MatchState.STARTED;
        emit MatchStartEvent(
            msg.sender,
            matches[_matchId].leagueId,
            _matchId,
            block.timestamp
        );
    }

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
    )
        public
        onlyOwner
        matchExists(_matchId)
        matchStarted(_matchId)
        validateMatchResult(_matchResult)
    {
        matches[_matchId].state = MatchState.FINISHED;

        // getMatchResult(_matchId);
        MatchResult matchResult = MatchResult(_matchResult);
        // 设置比赛结果
        setMatchResult(
            _matchId,
            matchResult,
            scoreDraw,
            scoreTeamA,
            scoreTeamB
        );

        if (matchResult == MatchResult.TEAM_A_WON) {
            invalidateAssets(matchBets[_matchId][MatchResult.TEAM_B_WON]);
            invalidateAssets(matchBets[_matchId][MatchResult.DRAW]);
        } else if (matchResult == MatchResult.TEAM_B_WON) {
            invalidateAssets(matchBets[_matchId][MatchResult.TEAM_A_WON]);
            invalidateAssets(matchBets[_matchId][MatchResult.DRAW]);
        } else if (matchResult == MatchResult.DRAW) {
            invalidateAssets(matchBets[_matchId][MatchResult.TEAM_A_WON]);
            invalidateAssets(matchBets[_matchId][MatchResult.TEAM_B_WON]);
        }

        emit MatchClosedEvent(
            msg.sender,
            matches[_matchId].leagueId,
            _matchId,
            block.timestamp
        );
    }

    function setMatchResult(
        uint256 _matchId,
        MatchResult _matchResult,
        uint8 scoreDraw,
        uint8 scoreTeamA,
        uint8 scoreTeamB
    ) internal {
        matches[_matchId].result = _matchResult;
        matches[_matchId].scoreDraw = scoreDraw;
        matches[_matchId].scoreTeamA = scoreTeamA;
        matches[_matchId].scoreTeamB = scoreTeamB;
        // 计算最终的 A,B,平 的赔率
        calculateOdds(_matchId);

        emit MatchResultSetEvent(
            matches[_matchId].leagueId,
            _matchId,
            matches[_matchId].result,
            block.timestamp,
            scoreTeamA,
            scoreTeamB
        );
    }

    function invalidateAssets(uint256[] memory assets) internal {
        for (uint256 i = 0; i < assets.length; i++) {
            invalidateAsset(assets[i]);
        }
    }

    // 销毁押注关联关系
    function invalidateAsset(uint256 _smartAssetId) internal {
        _burn(_smartAssetId);
    }

    function _burn(uint256 _smartAssetId) internal virtual {
        assetCount = assetCount - 1;
        delete _owners[_smartAssetId];
    }

    /*
     *  @notice  Liquidate smart asset's value
     *  @dev     validated   NFT is burned and caller gets value funds in account
     *  @param   _smartAssetId smart asset id
     *  @return  success status
     */
    function liquidateAsset(uint256 _smartAssetId)
        public
        payable
        isCircuitBreakOff
        validateToken(_smartAssetId)
        isTokenOwner(_smartAssetId)
        returns (bool)
    {
        console.log("<<<<<<<<<<<liquidateAsset=======: '%s'", _smartAssetId);
        SmartAsset memory smartAsset = smartAssets[_smartAssetId];
        require(
            matches[smartAsset.matchId].state == MatchState.FINISHED,
            "Cannot liquidate asset until match is finished"
        );
        // 获取比赛结果
        MatchResult matchResult = matches[smartAsset.matchId].result;

        uint256 lastWinValue = smartAsset.betInfo.payAmount;
        console.log(
            "Match totalPayoutTeamA: '%s' totalPayoutTeamB: '%s' totalPayoutDraw: '%s'",
            matches[smartAsset.matchId].totalPayoutTeamA,
            matches[smartAsset.matchId].totalPayoutTeamB,
            matches[smartAsset.matchId].totalPayoutDraw
        );
        console.log("liquidateAsset lastWinValue: '%s'", lastWinValue);
        // 提取赢得的押注资产
        if (matchResult == smartAsset.matchResult) {
            // 获取最终赔率
            uint256 lastBetOdds = matches[smartAsset.matchId].finalOdds;
            console.log("liquidateAsset lastBetOdds: '%s'", lastBetOdds);
            // 计算最终获取金额
            lastWinValue = lastWinValue.mul(lastBetOdds).div(
                100000000000000000
            );
        }

        console.log("liquidateAsset lastWinValue1: '%s'", lastWinValue);
        // 手续费金额
        uint256 feesAmount = lastWinValue
            .mul(matches[smartAsset.matchId].matchInfo.winnerFeeRate)
            .div(100);
        // withdraw_到手提款金额
        uint256 withdrawAmount = lastWinValue.sub(feesAmount);
        // 判断是否存在小于0.01的尾数

        console.log(
            "liquidateAsset feesAmount: '%s',withdrawAmount: '%s', winnerFeeRate: '%s'",
            feesAmount,
            withdrawAmount,
            matches[smartAsset.matchId].matchInfo.winnerFeeRate
        );
        if (smartAsset.betInfo.assetType == AssetType.ETH) {
            uint256 smartBalance = address(this).balance;
            require(
                smartBalance >= smartAsset.betInfo.payAmount,
                "Contract has insufficient funds"
            );
            if (smartBalance < lastWinValue) {
                lastWinValue = smartBalance;
            }
            invalidateAsset(_smartAssetId);
            require(!retryAttach, "this contract attack !!");
            retryAttach = true;
            // 用户提款
            console.log(
                "liquidateAsset feesAmount eth: '%s',withdrawAmount: '%s'",
                feesAmount,
                withdrawAmount
            );
            payable(msg.sender).transfer(withdrawAmount);
            // 给比赛发起者转账佣金
            payable(matches[smartAsset.matchId].creator).transfer(feesAmount);
            retryAttach = false;
        }
        if (smartAsset.betInfo.assetType == AssetType.ERC20) {
            uint256 smartBalance = IERC20(smartAsset.betInfo.payToken)
                .balanceOf(address(this));
            console.log("liquidateAsset 111");
            require(
                smartBalance >= smartAsset.betInfo.payAmount,
                "Contract has Token insufficient funds"
            );
            if (smartBalance < lastWinValue) {
                lastWinValue = smartBalance;
            }

            console.log(
                "liquidateAsset Contract has Token: '%s'",
                IERC20(smartAsset.betInfo.payToken).balanceOf(address(this))
            );
            invalidateAsset(_smartAssetId);
            // 用户提款
            require(
                IERC20(smartAsset.betInfo.payToken).transfer(
                    msg.sender,
                    withdrawAmount
                )
            );
            // 给比赛发起者转账佣金
            require(
                IERC20(smartAsset.betInfo.payToken).transfer(
                    matches[smartAsset.matchId].creator,
                    feesAmount
                )
            );
        }

        console.log("liquidateAsset 333");
        //totalCollected; 每取一笔更新对账结果
        matches[smartAsset.matchId].totalWithDraw = matches[smartAsset.matchId]
            .totalWithDraw
            .add(lastWinValue);
        // 手续费金额
        smartAssets[_smartAssetId].feesAmount = feesAmount;
        // withdraw_到手提款金额
        smartAssets[_smartAssetId].withdrawAmount = withdrawAmount;
        // withdraw_timestamp提取时间
        smartAssets[_smartAssetId].withdrawTimestamp = block.timestamp;

        emit AssetLiquidatedEvent(
            msg.sender,
            smartAsset.leagueId,
            smartAsset.matchId,
            smartAsset.betInfo.payAmount,
            block.timestamp,
            smartAsset.betInfo.assetType,
            smartAsset.betInfo.payToken
        );
        return true;
    }

    /*
     *  @notice  Contract Circuit Breaker
     *  @dev     Admin can [de]activate core functons in contract
     *  @param
     *  @return  success success status
     */
    function toggleCircuitBreaker() public onlyOwner {
        circuitBreaker = !circuitBreaker;
    }

    /*
     *  @notice  Fetch League details
     *  @dev
     *  @oaram   _leagueId
     *  @return League details
     */
    function getLeague(uint256 _leagueId)
        public
        view
        leagueExists(_leagueId)
        returns (League memory league_)
    {
        return leagues[_leagueId];
    }

    /*
     *  @notice  Fetch match details
     *  @dev
     *  @oaram   _matchId
     *  @return match match details
     */
    function getMatch(uint256 _matchId)
        public
        view
        matchExists(_matchId)
        returns (Match memory match_)
    {
        return matches[_matchId];
    }

    /*
     *  @notice  Fetch single SmartAsset
     *  @dev
     *  @param   _smartAssetId
     *  @return  asset details
     */
    function getSmartAsset(uint256 _smartAssetId)
        public
        view
        validateToken(_smartAssetId)
        isTokenOwner(_smartAssetId)
        returns (SmartAsset memory asset)
    {
        return smartAssets[_smartAssetId];
    }

    /*
     *  @notice  Fetch single SmartAsset
     *  @dev
     *  @param   _smartAssetId
     *  @return  asset details
     */
    function getMatchSmartAssetInfo(uint256 _smartAssetId)
        public
        view
        returns (MatchSmartAssetInfo memory info)
    {
        SmartAsset memory smartAssetInfo = smartAssets[_smartAssetId];
        Match memory matchDetail = matches[smartAssetInfo.matchId];
        info = MatchSmartAssetInfo(smartAssetInfo, matchDetail);
        return info;
    }

    /*
     *  @notice  Tells of the msg.sender is the admin
     *  @dev
     *  @return  true if msg.sender is admin else false
     */
    function isAdmin() public view returns (bool) {
        return msg.sender == owner;
    }

    /*
     *  @notice  Allows the current owner pass ownership to another address
     *  @dev
     */
    function changeOwner(address newOwner) external onlyOwner {
        owner = newOwner;
    }

    /**
     * @dev See {IERC721-ownerOf}.
     */
    function ownerOf(uint256 tokenId) public view virtual returns (address) {
        address _owner = _owners[tokenId];
        require(_owner != address(0), "MetaBet: invalid token ID");
        return _owner;
    }

    function _exists(uint256 tokenId) internal view virtual returns (bool) {
        return _owners[tokenId] != address(0);
    }

    /**
     * ownerMatchesBets
     */
    function ownerMatchesBets() public view virtual returns (uint256[] memory) {
        return matchesBetted[msg.sender];
    }

    function getEthBalance() public view virtual returns (uint256) {
        return address(this).balance;
    }

    /**
     * Allow withdraw of tokens from the contract
     */
    function withdrawToken() public onlyOwner {
        require(assetCount == 0, "User has not withdrawn assets");
        for (uint8 i = 0; i < tokens.length; i++) {
            uint256 balance = IERC20(tokens[i]).balanceOf(address(this));
            if (balance > 0) {
                require(IERC20(tokens[i]).transfer(msg.sender, balance));
                console.log(
                    "owner['%s'] withdrawToken: '%s',balance: '%s'",
                    msg.sender,
                    tokens[i],
                    balance
                );
            }
        }
        uint256 smartBalance = address(this).balance;
        if (smartBalance > 0) {
            require(!retryAttach, "this contract attack !!");
            retryAttach = true;
            payable(msg.sender).transfer(smartBalance);
            retryAttach = false;
            console.log(
                "owner['%s'] withdrawToken eth balance: '%s'",
                msg.sender,
                smartBalance
            );
        }
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

    function isSigner(address account) public view returns (bool) {
        return has(account);
    }

    /**
     * @dev Give an account access to this role.
     */
    function addSigner(address account) internal {
        require(!has(account), "Roles: account already has role");
        _signers[account] = true;
    }

    /**
     * @dev Remove an account's access to this role.
     */
    function removeSigner(address account) internal {
        require(has(account), "Roles: account does not have role");
        _signers[account] = false;
    }

    /**
     * @dev Check if an account has this role.
     * @return bool
     */
    function has(address account) internal view returns (bool) {
        require(account != address(0), "Roles: account is the zero address");
        return _signers[account];
    }

    /* Allow owner to get the data of stored games */
    function getData() public onlyOwner {
        // for(uint i = 0; i < numGames; i++){
        //     string memory id = string(abi.encodePacked(gameIds[i]));
        //Get home team
        // Chainlink.Request memory reqHome = buildChainlinkRequest(BYTES_JOB,
        //     address(this), this.storeHomeData.selector);
        // reqHome.add("get", string(abi.encodePacked(
        //         "https://www.balldontlie.io/api/v1/games/", id)));
        // reqHome.add("path", "home_team.full_name");
        // sendChainlinkRequestTo(ORACLE_ADDRESS, reqHome, LINK_PAYMENT);
        // homeTeam[gameIds[i]] = tempHomeTeam;
        //Get visitor team
        // Chainlink.Request memory reqVisitor = buildChainlinkRequest(
        //     BYTES_JOB, address(this), this.storeVisitorData.selector);
        // reqVisitor.add("get", string(abi.encodePacked(
        //         "https://www.balldontlie.io/api/v1/games/", id)));
        // reqVisitor.add("path", "visitor_team.full_name");
        // sendChainlinkRequestTo(ORACLE_ADDRESS, reqVisitor, LINK_PAYMENT);
        // visitorTeam[gameIds[i]] = tempVisitorTeam;
        // //Get game date
        // Chainlink.Request memory reqDate = buildChainlinkRequest(BYTES_JOB,
        //     address(this), this.storeDateData.selector);
        // reqDate.add("get", string(abi.encodePacked(
        //         "https://www.balldontlie.io/api/v1/games/", id)));
        // reqDate.add("path", "date");
        // sendChainlinkRequestTo(ORACLE_ADDRESS, reqDate, LINK_PAYMENT);
        // gameDate[gameIds[i]] = tempGameDate;
        //Get game status
        // Chainlink.Request memory reqStatus = buildChainlinkRequest(
        //     BYTES_JOB,
        //     address(this),
        //     this.storeStatusData.selector
        // );
        // reqStatus.add(
        //     "get",
        //     string(
        //         abi.encodePacked(
        //             "https://api-football-v1.p.rapidapi.com/v2/fixtures/id/157508",
        //             id
        //         )
        //     )
        // );
        // reqStatus.add("path", "status");
        // sendChainlinkRequestTo(ORACLE_ADDRESS, reqStatus, LINK_PAYMENT);
        // gameStatus[gameIds[i]] = tempGameStatus;
        // }
    }

    receive() external payable {}
}

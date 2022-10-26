// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

// import "@chainlink/contracts/src/v0.7/ChainlinkClient.sol";
// import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./MetaBetDomain.sol";

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

    ////////////////////////////////////////
    //                                    //
    //         STATE VARIABLES            //
    //                                    //
    ////////////////////////////////////////
    // contract owner adress
    address private owner;

    // incremented for match id generation
    Counters.Counter private matchIds;

    // incremented id for NFT minting
    Counters.Counter private tokenIds;

    // 支持充值token
    IERC20 public erc20Token;

    // flag to determine if contracts core functionalities can be performed
    bool circuitBreaker = false;

    // holds all NFTs issued to winners
    mapping(uint256 => SmartAsset) smartAssets;

    // holds all created matches (key: idCounter)
    mapping(uint256 => Match) matches;

    // holds all apiMatchId -> onChainMatchId to prevent duplicate entries
    mapping(uint256 => uint256) apiMatches;

    // holds all bets on a match
    // mapping(matchId => mapping(gameResult => smartAssetId[])) matchBets;
    mapping(uint256 => mapping(MatchResult => uint256[])) matchBets;

    mapping(bytes32 => uint256) matchResultRequestIds;

    mapping(address => uint256[]) private matchesBetted;

    // Mapping from token ID to owner address
    mapping(uint256 => address) private _owners;

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
    }

    ////////////////////////////////////////
    //                                    //
    //              EVENTS                //
    //                                    //
    ////////////////////////////////////////

    //Can be used by the clients to get all matches in a particular time
    event MatchCreatedEvent(
        address creator,
        uint256 indexed matchId,
        uint256 indexed apiMatchId,
        uint256 indexed createdOn,
        MatchInfo info
    );

    //Can be used by the clients to get all bets placed by a better in a particular time
    event BetPlacedEvent(
        address indexed bettor,
        uint256 indexed matchId,
        uint256 amount,
        uint256 indexed betPlacedAt,
        AssetType assetType,
        address payToken
    );
    event SmartAssetAwardedEvent(
        address indexed awardee,
        uint256 indexed matchId,
        uint256 smartAssetId,
        uint256 awardedAt,
        AssetType assetType,
        address payToken
    );
    event MatchClosedEvent(
        address indexed by,
        uint256 indexed matchId,
        uint256 closedAt
    );
    event MatchResultSetEvent(
        uint256 indexed matchId,
        MatchResult result,
        uint256 setAt
    );
    event AssetLiquidatedEvent(
        address indexed by,
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

        erc20Token.transferFrom(msg.sender, address(this), _amount);
        tokenBalance[msg.sender] = tokenBalance[msg.sender] + _amount;
    }

    /* Allow users to withdraw Tokens */
    function withdraw(uint256 _amount) public {
        require(
            _amount <= tokenBalance[msg.sender],
            "Cannot withdraw more than account balance"
        );
        require(_amount > 0, "Cannot withdraw 0");

        erc20Token.transfer(msg.sender, _amount);
        tokenBalance[msg.sender] = tokenBalance[msg.sender] - _amount;
    }

    /*
     *  @notice  New match creation
     *  @dev
     *  @param
     *  @return  match Id
     */
    function createMatch(
        uint256 _apiMatchId,
        string calldata _matchResultLink,
        MatchInfo calldata _matchInfo
    ) public payable isNewAPIMatch(_apiMatchId) onlyOwner returns (uint256) {
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
            IERC20(_matchInfo.payToken).transferFrom(
                msg.sender,
                address(this),
                amountBet
            );
        }

        matchIds.increment();
        uint256 matchId = matchIds.current();

        // 初始化A队押注金额
        uint256 initOddsASmartAssetId = awardSmartAsset(
            msg.sender,
            _matchInfo.initOddsTeamA,
            matchId,
            MatchResult.TEAM_A_WON,
            _matchInfo.assetType,
            _matchInfo.payToken
        );
        matchesBetted[msg.sender].push(initOddsASmartAssetId);
        matchBets[matchId][MatchResult.TEAM_A_WON].push(initOddsASmartAssetId);
        // 初始化B队押注金额
        uint256 initOddsBSmartAssetId = awardSmartAsset(
            msg.sender,
            _matchInfo.initOddsTeamB,
            matchId,
            MatchResult.TEAM_B_WON,
            _matchInfo.assetType,
            _matchInfo.payToken
        );
        matchesBetted[msg.sender].push(initOddsBSmartAssetId);
        matchBets[matchId][MatchResult.TEAM_B_WON].push(initOddsBSmartAssetId);
        // 初始化平押注金额
        uint256 initOddsOSmartAssetId = awardSmartAsset(
            msg.sender,
            _matchInfo.initOddsDraw,
            matchId,
            MatchResult.DRAW,
            _matchInfo.assetType,
            _matchInfo.payToken
        );

        matchesBetted[msg.sender].push(initOddsOSmartAssetId);
        matchBets[matchId][MatchResult.DRAW].push(initOddsOSmartAssetId);

        matches[matchId] = Match(
            msg.sender,
            _matchResultLink,
            _matchInfo.initOddsTeamA,
            _matchInfo.initOddsTeamB,
            _matchInfo.initOddsDraw,
            amountBet,
            MatchResult.NOT_DETERMINED,
            MatchState.NOT_STARTED,
            true,
            _matchInfo
        );
        apiMatches[_apiMatchId] = matchId;

        emitMatchCreatedEvent(matchId, _apiMatchId, _matchInfo);
        return matchId;
    }

    function emitMatchCreatedEvent(
        uint256 matchId,
        uint256 _apiMatchId,
        MatchInfo calldata info
    ) internal {
        uint256 createdOnDay = block.timestamp - (block.timestamp % 86400);
        emit MatchCreatedEvent(
            msg.sender,
            matchId,
            _apiMatchId,
            createdOnDay,
            info
        );
    }

    function calculateAssetValue(uint256 amountBet, uint256 _odds)
        internal
        pure
        returns (uint256)
    {
        return amountBet.mul(_odds).div(100);
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

        if (matches[_matchId].matchInfo.startAt < block.timestamp) {
            matches[_matchId].state = MatchState.STARTED;
            return 0;
        }
        if (_payAsset.assetType == AssetType.ETH) {
            require(amountBet != 0, "Invalid amount bet");
            payable(address(this)).transfer(amountBet);
        }
        if (_payAsset.assetType == AssetType.ERC20) {
            amountBet = _payAsset.payValue;
            IERC20(_payAsset.payToken).transferFrom(
                msg.sender,
                address(this),
                amountBet
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

        //increase totalCollected on the match
        matches[_matchId].totalCollected = matches[_matchId].totalCollected.add(
            amountBet
        );

        // 将押注金额mint成一个NFT作为流动性质押凭证，通过凭证质押获取额外利息
        uint256 smartAssetId = awardSmartAsset(
            msg.sender,
            amountBet,
            _matchId,
            matchResultBetOn,
            _payAsset.assetType,
            _payAsset.payToken
        );

        matchesBetted[msg.sender].push(smartAssetId);
        //Save bettor's bet
        matchBets[_matchId][matchResultBetOn].push(smartAssetId);

        emit BetPlacedEvent(
            msg.sender,
            _matchId,
            amountBet,
            block.timestamp,
            _payAsset.assetType,
            _payAsset.payToken
        );

        return smartAssetId;
    }

    /**
     * mint nft staking your balance
     */
    function awardSmartAsset(
        address bettor,
        uint256 assetValue,
        uint256 _matchId,
        MatchResult _matchResultBetOn,
        AssetType _payAsset,
        address _payToken
    ) internal returns (uint256) {
        tokenIds.increment();

        uint256 smartAssetId = tokenIds.current();
        // _mint(bettor, smartAssetId);
        // 创建资产白条押注关联关系
        _owners[smartAssetId] = msg.sender;

        smartAssets[smartAssetId] = SmartAsset(
            msg.sender,
            _matchId,
            _matchResultBetOn,
            assetValue, // 押注金额
            0, // 赢取额外金额
            _payAsset,
            _payToken
        );

        emit SmartAssetAwardedEvent(
            bettor,
            _matchId,
            smartAssetId,
            block.timestamp,
            _payAsset,
            _payToken
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
        // TeamA最终赔率
        matches[_matchId].matchInfo.oddsTeamA =
            calculateAssetOdds(
                totalPayoutDraw,
                totalPayoutTeamB,
                totalPayoutTeamA
            ) +
            100;
        // TeamB最终赔率
        matches[_matchId].matchInfo.oddsTeamB =
            calculateAssetOdds(
                totalPayoutDraw,
                totalPayoutTeamA,
                totalPayoutTeamB
            ) +
            100;
        // TeamA和TeamB平局最终赔率
        matches[_matchId].matchInfo.oddsDraw =
            calculateAssetOdds(
                totalPayoutTeamB,
                totalPayoutTeamA,
                totalPayoutDraw
            ) +
            100;
    }

    function calculateAssetOdds(
        uint256 _oddsWin,
        uint256 _oddsFailOne,
        uint256 _oddsFailTwo
    ) internal pure returns (uint32) {
        return uint32(_oddsWin.add(_oddsFailOne).mul(100).div(_oddsFailTwo));
    }

    /*
     *  @notice  Match manual start by admin.
     *  @param
     *  @return
     */
    function startMatch(uint256 _matchId)
        public
        onlyOwner
        matchExists(_matchId)
        matchNotStarted(_matchId)
    {
        matches[_matchId].state = MatchState.STARTED;
        // 计算最终的 A,平,B 的赔率
        calculateOdds(_matchId);
    }

    /*
     *  @notice  Match manual close by admin. Trigger "getResult()"
     *  @dev     [Real] ChainlinkClient API Request oracles gets match result of winning team. Then, match is closed.
     *           [Temporary] (Implemented because there's no BSC testnet oracle node)
     *                       Frontend gets result via result link and posts winning team. Then, match is closed.
     *  @param
     *  @return  success success status
     */
    function closeMatch(uint256 _matchId, uint8 _matchResult)
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
        setMatchResult(_matchId, matchResult);

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

        emit MatchClosedEvent(msg.sender, _matchId, block.timestamp);
    }

    function setMatchResult(uint256 _matchId, MatchResult _matchResult)
        internal
    {
        matches[_matchId].result = _matchResult;
        emit MatchResultSetEvent(
            _matchId,
            matches[_matchId].result,
            block.timestamp
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
        SmartAsset memory smartAsset = smartAssets[_smartAssetId];
        require(
            matches[smartAsset.matchId].state == MatchState.FINISHED,
            "Cannot liquidate asset until match is finished"
        );
        // 获取比赛结果
        MatchResult matchResult = matches[smartAsset.matchId].result;

        uint256 lastWinValue = smartAsset.initialValue;
        // 提取赢得的押注资产
        if (matchResult == smartAsset.matchResult) {
            // 获取赔率
            uint32 lastBetOdds = 1;
            if (matchResult == MatchResult.TEAM_A_WON) {
                lastBetOdds = matches[smartAsset.matchId].matchInfo.oddsTeamA;
            } else if (matchResult == MatchResult.TEAM_B_WON) {
                lastBetOdds = matches[smartAsset.matchId].matchInfo.oddsTeamB;
            } else if (matchResult == MatchResult.DRAW) {
                lastBetOdds = matches[smartAsset.matchId].matchInfo.oddsDraw;
            }
            // 计算最终获取金额
            lastWinValue = smartAsset.initialValue.mul(lastBetOdds).div(100);
        }

        if (smartAsset.assetType == AssetType.ETH) {
            require(
                address(this).balance >= smartAsset.initialValue,
                "Contract has insufficient funds"
            );
            if (address(this).balance < lastWinValue) {
                lastWinValue = address(this).balance;
            }
            invalidateAsset(_smartAssetId);
            payable(msg.sender).transfer(lastWinValue);
        }
        if (smartAsset.assetType == AssetType.ERC20) {
            require(
                IERC20(smartAsset.payToken).balanceOf(address(this)) >=
                    smartAsset.initialValue,
                "Contract has Token insufficient funds"
            );
            if (
                IERC20(smartAsset.payToken).balanceOf(address(this)) <
                lastWinValue
            ) {
                lastWinValue = IERC20(smartAsset.payToken).balanceOf(
                    address(this)
                );
            }
            invalidateAsset(_smartAssetId);
            IERC20(smartAsset.payToken).transfer(msg.sender, lastWinValue);
        }

        emit AssetLiquidatedEvent(
            msg.sender,
            smartAsset.matchId,
            smartAsset.initialValue,
            block.timestamp,
            smartAsset.assetType,
            smartAsset.payToken
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

    function _burn(uint256 _smartAssetId) internal virtual {
        delete _owners[_smartAssetId];
    }

    /**
     * ownerMatchesBets
     */
    function ownerMatchesBets() public view virtual returns (uint256[] memory) {
        return matchesBetted[msg.sender];
    }

    receive() external payable {}
}

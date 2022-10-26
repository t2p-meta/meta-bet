// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

// import "@chainlink/contracts/src/v0.7/ChainlinkClient.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
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
contract MetaBetNFT721 is ERC721,MetaBetDomain {
    using Counters for Counters.Counter;
    using SafeMath for uint256;

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

    ////////////////////////////////////////
    //                                    //
    //           CONSTRUCTOR              //
    //                                    //
    ////////////////////////////////////////

    constructor() ERC721("MetaBet", "MBT") {
        owner = msg.sender;
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

        MatchResult matchResultBetOn = MatchResult(_resultBetOn);
        //update team's total payout
        if (matchResultBetOn == MatchResult.TEAM_A_WON) {
            matches[_matchId].totalPayoutTeamA = matches[_matchId].totalPayoutTeamA.add(amountBet);
        } else if (matchResultBetOn == MatchResult.TEAM_B_WON) {
            matches[_matchId].totalPayoutTeamB = matches[_matchId].totalPayoutTeamB.add(amountBet);
        } else {
            matches[_matchId].totalPayoutDraw = matches[_matchId].totalPayoutDraw.add(amountBet);
        }

        //increase totalCollected on the match
        matches[_matchId].totalCollected = matches[_matchId].totalCollected.add(amountBet);

        // 将押注金额mint成一个NFT作为流动性质押凭证，通过凭证质押获取额外利息
        uint256 smartAssetId = awardSmartAsset(
            msg.sender,
            amountBet,
            _matchId,
            matchResultBetOn,
            _payAsset.assetType,
            _payAsset.payToken
        );

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
        _mint(bettor, smartAssetId);

        smartAssets[smartAssetId] = SmartAsset(
            msg.sender,
            _matchId,
            _matchResultBetOn,
            assetValue,
            0,
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

    function startMatch(uint256 _matchId)
        public
        onlyOwner
        matchExists(_matchId)
        matchNotStarted(_matchId)
    {
        matches[_matchId].state = MatchState.STARTED;
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
        setMatchResult(_matchId, matchResult);

        if (matchResult == MatchResult.TEAM_A_WON) {
            invalidateAssets(matchBets[_matchId][MatchResult.TEAM_B_WON]);
            invalidateAssets(matchBets[_matchId][MatchResult.DRAW]);
        } else if (matchResult == MatchResult.TEAM_B_WON) {
            invalidateAssets(matchBets[_matchId][MatchResult.TEAM_A_WON]);
            invalidateAssets(matchBets[_matchId][MatchResult.DRAW]);
        } else {
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
        if (smartAsset.assetType == AssetType.ETH) {
            require(
                address(this).balance >= smartAsset.initialValue,
                "Contract has insufficient funds"
            );
            invalidateAsset(_smartAssetId);
            payable(msg.sender).transfer(smartAsset.initialValue);
        }
        if (smartAsset.assetType == AssetType.ERC20) {
            require(
                IERC20(smartAsset.payToken).balanceOf(address(this)) >=
                    smartAsset.initialValue,
                "Contract has Token insufficient funds"
            );
            invalidateAsset(_smartAssetId);
            IERC20(smartAsset.payToken).transfer(
                msg.sender,
                smartAsset.initialValue
            );
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

    receive() external payable {}
}

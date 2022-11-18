// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

import "@chainlink/contracts/src/v0.8/ChainlinkClient.sol";
import "@chainlink/contracts/src/v0.8/ConfirmedOwner.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "./MetaBetInterface.sol";

import "hardhat/console.sol";

contract MetaBetMatch is Context, ChainlinkClient, ConfirmedOwner {
    using Chainlink for Chainlink.Request;
    using CBORChainlink for BufferChainlink.buffer;

    //1 LINK  = 1 * (10^18)
    uint256 private constant LINK_PAYMENT = (1 * LINK_DIVISIBILITY) / 10;

    // Job ID of Get > bytes32 job  Found on market.link jobId = '7223acbd01654282865b678924126013';
    // External Job ID :8c96e326-692b-45c3-83eb-d0d0dbe7bfc5 replaceAll("-","")
    bytes32 private constant BYTES_JOB = "8c96e326692b45c383ebd0d0dbe7bfc5";

    MetaBetInterface metaBet;

    error FailedTransferLINK(address to, uint256 amount);

    ////////////////////////////////////////
    //                                    //
    //           CONSTRUCTOR              //
    //                                    //
    ////////////////////////////////////////

    /**
     - Kovan oracle found on market.link 
    Alpha Chain 0xAA1DC356dc4B18f30C347798FD5379F3D77ABC5b
    *****************test net*******************
    Ethereum Goerli	0xCC79157eb46F5624204f47AB42b3906cAA40eaB7
    Avalanche Fuji	0x022EEA14A6010167ca026B32576D6686dD7e85d2
    Polygon Mumbai	0x40193c8518BB267228Fc409a613bDbD8eC5a97b3
    Binance Testnet	0xCC79157eb46F5624204f47AB42b3906cAA40eaB7
    Fantom Testnet	0xCC79157eb46F5624204f47AB42b3906cAA40eaB7
    Klaytn Testnet	0xfC3BdAbD8a6A73B40010350E2a61716a21c87610

   address private ORACLE_ADDRESS = "0x40193c8518BB267228Fc409a613bDbD8eC5a97b3";
    

    */
    constructor(
        address _metabet,
        address _link,
        address _oracle
    ) ConfirmedOwner(msg.sender) {
        setChainlinkToken(_link);
        setChainlinkOracle(_oracle);
        metaBet = MetaBetInterface(_metabet);
        console.log("deploy ..... contract meta bet...");
    }

    ////////////////////////////////////////
    //                                    //
    //              FUNCTIONS             //
    //                                    //
    ////////////////////////////////////////

    function setOracle(address _oracle) external {
        setChainlinkOracle(_oracle);
    }

    function withdrawLink(uint256 _amount, address payable _payee) external {
        LinkTokenInterface linkToken = LinkTokenInterface(
            chainlinkTokenAddress()
        );
        _requireTransferLINK(
            linkToken.transfer(_payee, _amount),
            _payee,
            _amount
        );
    }

    function _requireTransferLINK(
        bool _success,
        address _to,
        uint256 _amount
    ) private pure {
        if (!_success) {
            revert FailedTransferLINK(_to, _amount);
        }
    }

    /* ========== EXTERNAL FUNCTIONS ========== */
    function cancelRequest(
        bytes32 _requestId,
        uint256 _payment,
        bytes4 _callbackFunctionId,
        uint256 _expiration
    ) external {
        cancelChainlinkRequest(
            _requestId,
            _payment,
            _callbackFunctionId,
            _expiration
        );
    }

    /**
     * @notice Stores the scheduled games.
     * @param _requestId the request ID for fulfillment.
     * @param _fixtureId the games either to be created or resolved.
     * @param _isFinish the games either to be created or resolved.
     * @param _scoreTeamA the games either to be created or resolved.
     * @param _scoreTeamB the games either to be created or resolved.
     */
    function fulfillSchedule(
        bytes32 _requestId,
        uint256 _fixtureId,
        bool _isFinish,
        uint8 _scoreTeamA,
        uint8 _scoreTeamB
    ) external onlyOwner recordChainlinkFulfillment(_requestId) {
        // requestIdGames[_requestId] = _result;
        // 判断赛程是否已结束 _isFinish "status": "Match Finished" "statusShort": "FT",
        if (_isFinish) {
            // 赛程结束更新赛程结果信息
            uint256 _matchId = metaBet.apiMatchId(_fixtureId);

            // enum MatchResult {
            //     NOT_DETERMINED,0
            //     DRAW,1
            //     TEAM_A_WON, 2
            //     TEAM_B_WON  3
            // }
            uint8 _matchResult = 0;
            if (_scoreTeamA == _scoreTeamB) {
                _matchResult = 1;
            } else if (_scoreTeamA > _scoreTeamB) {
                _matchResult = 2;
            } else if (_scoreTeamA < _scoreTeamB) {
                _matchResult = 3;
            }

            console.log(
                "fulfillSchedule:%s,%s,%s",
                _fixtureId,
                _scoreTeamA,
                _scoreTeamB
            );
            metaBet.closeMatch(
                _matchId,
                _matchResult,
                0,
                _scoreTeamA,
                _scoreTeamB
            );
        }
    }

    /* Allow owner to get the data of stored games */
    function requestSchedule() public onlyOwner {
        uint256 matchCount = metaBet.countMatchs();
        require(matchCount > 0, "Match Empty");
        for (uint256 i = 0; i < matchCount; i++) {
            Chainlink.Request memory req = buildChainlinkRequest(
                BYTES_JOB,
                address(this),
                this.fulfillSchedule.selector
            );
            req.add("api", metaBet.matchResultLink(i));
            // req.add(
            //     "get",
            //     string(
            //         abi.encodePacked(
            //             "https://api-football-v1.p.rapidapi.com/v2/",
            //             metaBet.matchResultLink(i)
            //         )
            //     )
            // );
            // Set the path to find the desired data in the API response, where the response format is:
            //  {
            //     "api": {
            //         "results": 48,
            //         "fixtures": [
            //             {
            //                 "fixture_id": 855736,
            //                 "league_id": 4265,
            //                 "league": {
            //                     "name": "World Cup",
            //                     "country": "World",
            //                     "logo": "https:\/\/media.api-sports.io\/football\/leagues\/1.png",
            //                     "flag": null
            //                 },
            //                 "event_date": "2022-11-21T00:00:00+08:00",
            //                 "event_timestamp": 1668960000,
            //                 "firstHalfStart": null,
            //                 "secondHalfStart": null,
            //                 "round": "Group Stage - 1",
            //                 "status": "Not Started",
            //                 "statusShort": "NS",
            //                 "elapsed": 0,
            //                 "venue": "Al Bayt Stadium",
            //                 "referee": null,
            //                 "homeTeam": {
            //                     "team_id": 1569,
            //                     "team_name": "Qatar",
            //                     "logo": "https:\/\/media.api-sports.io\/football\/teams\/1569.png"
            //                 },
            //                 "awayTeam": {
            //                     "team_id": 2382,
            //                     "team_name": "Ecuador",
            //                     "logo": "https:\/\/media.api-sports.io\/football\/teams\/2382.png"
            //                 },
            //                 "goalsHomeTeam": 2,
            //                 "goalsAwayTeam": 1,
            //                 "score": {
            //                     "halftime": "1-0",
            //                     "fulltime": "2-1",
            //                     "extratime": null,
            //                     "penalty": null
            //                 }
            //             }
            //   }
            //  }
            req.add("leagueId", "league_id"); // Chainlink nodes 1.0.0 and later support this format
            req.add("fixtureId", "fixture_id"); // Chainlink nodes 1.0.0 and later support this format
            req.add("statusShort", "statusShort"); // Chainlink nodes 1.0.0 and later support this format
            req.add("goalsHomeTeam", "goalsHomeTeam"); // Chainlink nodes 1.0.0 and later support this format
            req.add("goalsAwayTeam", "goalsAwayTeam"); // Chainlink nodes 1.0.0 and later support this format
            sendChainlinkRequest(req, LINK_PAYMENT);
        }
    }

    /*
     *  @notice  Fetch match countMatchs
     *  @dev
     *  @return match countMatchs
     */
    function countMatchs() public view returns (uint256) {
        return metaBet.countMatchs();
    }

    /*
     *  @notice  Fetch match matchResultLink
     *  @dev
     *  @return match matchResultLink
     */
    function countMatchs(uint256 _matchId) public view returns (string memory) {
        return metaBet.matchResultLink(_matchId);
    }
}

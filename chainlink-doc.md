### 1. The MetaAI API

```
Livescores API

Fixtures by ID: https://rapidapi.com/api-sports/api/api-football?endpoint=apiendpoint_9e5959e2-9609-4fe9-98de-91574b894ff7

```
#### 1.1 Header Parameters
```
  X-RapidAPI-Key=SIGN-UP-FOR-KEY
  X-RapidAPI-Host=api-football-V1.p.rapidapi.com
```

#### 1.2 Request
```shell
curl --request GET --url https://api-football-v1.p.rapidapi.com/v3/timezone --header 'X-RapidAPI-Host: api-football-v1.p.rapidapi.com' --header 'X-RapidAPI-Key: SIGN-UP-FOR-KEY'
```
#### 1.3 Result

```json
{
    "api": {
        "results": 1,
        "fixtures": [
            {
                "fixture_id": 855736,
                "league_id": 4265,
                "league": {
                    "name": "World Cup",
                    "country": "World",
                    "logo": "https:\/\/media.api-sports.io\/football\/leagues\/1.png",
                    "flag": null
                },
                "event_date": "2022-11-21T00:00:00+08:00",
                "event_timestamp": 1668960000,
                "firstHalfStart": null,
                "secondHalfStart": null,
                "round": "Group Stage - 1",
                "status": "Not Started",
                "statusShort": "NS",
                "elapsed": 0,
                "venue": "Al Bayt Stadium",
                "referee": null,
                "homeTeam": {
                    "team_id": 1569,
                    "team_name": "Qatar",
                    "logo": "https:\/\/media.api-sports.io\/football\/teams\/1569.png"
                },
                "awayTeam": {
                    "team_id": 2382,
                    "team_name": "Ecuador",
                    "logo": "https:\/\/media.api-sports.io\/football\/teams\/2382.png"
                },
                "goalsHomeTeam": 2,
                "goalsAwayTeam": 1,
                "score": {
                    "halftime": "1-0",
                    "fulltime": "2-1",
                    "extratime": null,
                    "penalty": null
                }
            }
       ]
    }
}
```

### 2. External Adapter

####  Chainlink Node Job Definition

```toml
type = "directrequest"
schemaVersion = 1
name = "Worldcup-Data-football"
forwardingAllowed = false
maxTaskDuration = "0s"
contractAddress = "${YOUR_SMART_ADDRESS}"
minContractPaymentLinkJuels = "0"
observationSource = """
    decode_log   [type=ethabidecodelog
                  abi="OracleRequest(bytes32 indexed specId, address requester, bytes32 requestId, uint256 payment, address callbackAddr, bytes4 callbackFunctionId, uint256 cancelExpiration, uint256 dataVersion, bytes data)"
                  data="$(jobRun.logData)"
                  topics="$(jobRun.logTopics)"]
    
    decode_cbor  [type=cborparse data="$(decode_log.data)"]
    fetch        [type=bridge name="worldcup" requestData="{\\"id\\": $(jobSpec.externalJobID), \\"data\\": { \\"api\\": $(decode_cbor.api)}}"]
    parse        [type=jsonparse path="data" data="$(fetch)"]
    encode_data  [type=ethabiencode
                  abi="(bytes32 _requestId, uint256 _fixtureId, bool _isFinish, uint8 _scoreTeamA, uint8 _scoreTeamB)" 
                  data="{ \\"_requestId\\": $(decode_log.requestId),\\"_fixtureId\\": $(parse.fixture_id),\\"_isFinish\\": $(parse.isFinish),\\"_scoreTeamA\\": $(parse.goalsHomeTeam),\\"_scoreTeamA\\": $(parse.goalsAwayTeam)  }"]
    encode_tx    [type=ethabiencode
                  abi="fulfillOracleRequest(bytes32 requestId, uint256 payment, address callbackAddress, bytes4 callbackFunctionId, uint256 expiration, bytes32 data)"
                  data="{\\"requestId\\": $(decode_log.requestId), \\"payment\\": $(decode_log.payment), \\"callbackAddress\\": $(decode_log.callbackAddr), \\"callbackFunctionId\\": $(decode_log.callbackFunctionId), \\"expiration\\": $(decode_log.cancelExpiration), \\"data\\": $(encode_data)}"
                 ]
    submit_tx    [type=ethtx to="${YOUR_SMART_ADDRESS}" data="$(encode_tx)"]

    decode_log -> decode_cbor -> fetch -> parse -> encode_data -> encode_tx -> submit_tx
"""

```

### 3. Smart Contract
```js
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
            req.add("api",metaBet.matchResultLink(i));
            req.add("fixtureId", "fixture_id"); 
            req.add("statusShort", "statusShort"); 
            req.add("goalsHomeTeam", "goalsHomeTeam"); 
            req.add("goalsAwayTeam", "goalsAwayTeam");

            sendChainlinkRequest(req, LINK_PAYMENT);
        }
    }

/**
     * @notice Stores the scheduled games.
     * @param _requestId the request ID for fulfillment.
     * @param _leagueId the games either to be created or resolved.
     * @param _fixtureId the games either to be created or resolved.
     * @param _isFinish the games either to be created or resolved.
     * @param _scoreTeamA the games either to be created or resolved.
     * @param _scoreTeamB the games either to be created or resolved.
     */
    function fulfillSchedule(
        bytes32 _requestId,
        uint256 _leagueId,
        uint256 _fixtureId,
        bool _isFinish,
        uint8 _scoreTeamA,
        uint8 _scoreTeamB
    ) external onlyOwner recordChainlinkFulfillment(_requestId) {
        if (_isFinish) {
            uint256 _matchId = metaBet.apiMatchId(_fixtureId);
            uint8 _matchResult = 0;
            if (_scoreTeamA == _scoreTeamB) {
                _matchResult = 1;
            } else if (_scoreTeamA > _scoreTeamB) {
                _matchResult = 2;
            } else if (_scoreTeamA < _scoreTeamB) {
                _matchResult = 3;
            }
            metaBet.closeMatch(
                _matchId,
                _matchResult,
                0,
                _scoreTeamA,
                _scoreTeamB
            );
        }
    }


```

###  Response data
```json
{
    "jobRunID": "134ea675a9524e8e231585b00368b178",
    "data": "{1, 855736,true,3,4}",
    "result": null,
    "statusCode": 200
}

```

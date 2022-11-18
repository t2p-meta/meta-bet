import Paper from "@material-ui/core/Paper";
import Grid from "@material-ui/core/Grid";
import MatchCard from "./MatchCard";
import Preloader from "../layout/Preloader";
import React, { Component } from "react";
import CalendarToday from "@material-ui/icons/CalendarToday";
import APICall from "../../utils/APICall";
import {
  calculateOdds,
  matchTotalOdds,
  getPastEvents,
} from "../../utils/web3sdk";

class Matches extends Component {
  constructor(props) {
    super(props);
    this.state = {
      web3: null,
      account: null,
      contract: null,
      matches: [],
      loading: false,
      bolckNumber: 0,
      token: null,
    };
  }

  componentWillMount() {
    if (this.props.baseAppState) {
      this.setState({ contract: this.props.baseAppState.contract });
      this.setState({ account: this.props.baseAppState.accounts[0] });
      this.setState({ token: this.props.baseAppState.priceContract });
      this.setState({ token: this.props.baseAppState.priceContract });
      this.setState({ matches: [] });
    }
  }

  componentDidMount() {
    if (this.props.baseAppState) {
      let web3 = this.props.baseAppState.web3;
      let initBlockNumber = this.props.baseAppState.fromBolckNumber;
      getPastEvents(web3, initBlockNumber, this.getContractMatches);
      // web3.eth.getBlockNumber().then((bolckNumber) => {
      //   let blockCount = bolckNumber - initBlockNumber;
      //   console.log(
      //     "blockCount:",
      //     blockCount,
      //     bolckNumber,
      //     "web3 bolckNumber======"
      //   );
      //   let pages = 1;
      //   let blockAlloweHeight = 1000; // Blockheight too far in the past: eth_getLogs. Range of blocks allowed for your plan: 1000
      //   let rateLimitPage = 1;
      //   let rateLimits = 40; // Rate limit exceeded: 40 per 1 second. Check respon…ticvigil.com/ to avoid hitting public ratelimits.
      //   if (blockCount % blockAlloweHeight == 0) {
      //     pages = parseInt(blockCount / blockAlloweHeight);
      //   } else {
      //     pages = parseInt(blockCount / blockAlloweHeight) + 1;
      //   }
      //   if (pages % rateLimits == 0) {
      //     rateLimitPage = parseInt(pages / rateLimits);
      //   } else {
      //     rateLimitPage = parseInt(pages / rateLimits) + 1;
      //   }

      //   let _from = initBlockNumber;
      //   let _to = _from + blockAlloweHeight;
      //   // 47
      //   for (let rpage = 0; rpage < rateLimitPage; rpage++) {
      //     let time = rpage * 1000 + 2000;
      //     setTimeout(() => {
      //       let fpage = rateLimits * rpage;
      //       let tpage = rateLimits * rpage + rateLimits;
      //       if (tpage > pages) {
      //         tpage = pages;
      //       }
      //       for (fpage; fpage < tpage; fpage++) {
      //         console.log(
      //           "pages:",
      //           rpage,
      //           fpage,
      //           tpage,
      //           _from,
      //           _to,
      //           "web3 bolckNumber======"
      //         );
      //         this.getContractMatches(_from, _to);
      //         _to += blockAlloweHeight;
      //         _from += blockAlloweHeight;
      //       }
      //     }, time);
      //   }
      // });
    }
  }

  componentWillUnmount() {}

  getContractMatches = async (fromBolckNumber, toBolckNumber) => {
    // let now = parseInt(Date.now() / 1000);
    // let today = now - (now % 86400);

    this.state.contract.getPastEvents(
      "MatchCreatedEvent",
      {
        filter: {
          // createdOn: today,
          leagueId: this.props.baseAppState.leagueId,
        },
        fromBlock: fromBolckNumber,
        toBlock: toBolckNumber, //"latest",
      },
      (error, events) => {
        if (!error && events && events.length > 0) {
          let contractMatches = this.state.matches;
          events.forEach(async (event) => {
            console.log("MatchCreatedEvent event.returnValues", event);
            let apiMatchId = event.returnValues.apiMatchId;
            let matchId = parseInt(event.returnValues.matchId);
            //TODO: get match details
            let url = `fixtures/id/${apiMatchId}`;
            APICall(url)
              .then(async (result) => {
                if (result) {
                  // 获取Match详细信息
                  let match = result.api.fixtures[matchId - 1];
                  result.api.fixtures.forEach((i) => {
                    if (i.fixture_id == apiMatchId) {
                      console.log("match details===:", i);
                      match = i;
                      return;
                    }
                  });

                  match.creator = event.returnValues.creator;
                  match.matchId = matchId;

                  await this.state.contract.methods
                    .getMatch(matchId)
                    .call({ from: this.state.account })
                    .then((contractMatch) => {
                      if (contractMatch) {
                        match.state = contractMatch.state;
                        if (match.state === 1) {
                          match.started = true;
                        } else if (match.state === 2) {
                          match.ended = true;
                        } else {
                        }

                        // 计算赔率
                        let { oddsA, oddsB, oddsDraw } = calculateOdds(
                          contractMatch.totalPayoutTeamA,
                          contractMatch.totalPayoutTeamB,
                          contractMatch.totalPayoutDraw
                        );
                        match.oddsA = oddsA;
                        match.oddsB = oddsB;
                        match.oddsDraw = oddsDraw;

                        match.homeTeam.team_name =
                          contractMatch.matchInfo.teamAName;
                        match.awayTeam.team_name =
                          contractMatch.matchInfo.teamBName;
                        console.log(
                          " oddsA, oddsB, oddsDraw ",
                          oddsA,
                          oddsB,
                          oddsDraw
                        );
                        // 计算赔率
                        let { poolSize } = matchTotalOdds(
                          contractMatch.totalPayoutTeamA,
                          contractMatch.totalPayoutTeamB,
                          contractMatch.totalPayoutDraw
                        );
                        match.poolSize = poolSize;
                        console.log("contractMatch", contractMatch, poolSize);
                        console.log("contractMatch match", match);
                        contractMatches.push(match);
                        this.setState({ matches: contractMatches });
                      }
                    })
                    .catch((error) => {
                      console.log("getMatch error", error);
                    });
                }
              })
              .catch((error) => {
                console.log(error);
              });
          });
        }
      }
    );
  };

  render() {
    if (this.state.loading) {
      return <Preloader />;
    }

    return (
      <div className={"page-wrapper"}>
        <Grid container spacing={3}>
          {this.state.matches.length === 0 ? (
            <div className="center">
              No Current Matches to show.... <Preloader />
            </div>
          ) : (
            this.state.matches.map((match, index) => (
              <Grid key={index} item xs={12} sm={6}>
                <Paper className={"match-paper"} elevation={2}>
                  <MatchCard
                    match={match}
                    contract={this.state.contract}
                    account={this.state.account}
                    web3={this.props.baseAppState.web3}
                    token={this.state.token}
                    initBlockNumber={this.props.baseAppState.fromBolckNumber}
                  />
                </Paper>
              </Grid>
            ))
          )}
        </Grid>
      </div>
    );
  }
}

export default Matches;

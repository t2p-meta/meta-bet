import React, { Component } from "react";
import { useParams } from "react-router-dom";
import CusAvatar from "../layout/CustomizedAvatar";
import APICall from "../../utils/APICall";
import {
  Card,
  CardContent,
  CardHeader,
  Grid,
  Avatar,
  Button,
  TextField,
  CircularProgress,
  Table,
  TableHead,
  TableRow,
  TableBody,
  TableCell,
  Paper,
} from "@material-ui/core";
import Preloader from "../layout/Preloader";
import history from "../../history";
import TeamImage from "./TeamImage";
import {
  calculateOdds,
  matchTotalOdds,
  fromWei,
  toWei,
  getPastEvents,
} from "../../utils/web3sdk";
import MatchesBet from "./MatchesBet";
import CreateBet from "./CreateBet";
import fixturesDetail from "../../utils/fixtures_detail.json";

const cardHeader = {
  display: "flex",
  alignItem: "center",
  justifyContent: "space-between",
  fontWeight: "bold",
  margin: "0px",
  fontSize: "18px",
};
const cardStyle = { height: "95%", width: "100%" };
const gridItemStyle = {
  display: "flex",
  alignItems: "center",
  height: "100%",
  justifyContent: "center",
  flexDirection: "column",
};
class BetsInfo extends Component {
  constructor(props) {
    super(props);
    this.state = {
      web3: null,
      account: null,
      contract: null,
      priceContract: null,
      match: null,
      matchId: 0,
      ONE_BNB: 0, //BUSDs
      PRICE_TO_BUSD: 0,
      betAmount: 0,
      assets: [],
      winBetIndex: null, //0-teamA  1-teamB 2-draw (frontend)
      betSelected: null,
      assetSelected: null,
      loading: false,
      isLoggedIn: true,
      loadingWithdraw: false,
      approve: 0,
    };

    this.setBetSelected = this.setBetSelected.bind(this);
    this.setLoadingWithdraw = this.setLoadingWithdraw.bind(this);
    this.setLoading = this.setLoading.bind(this);
    this.setApprove = this.setApprove.bind(this);
  }

  componentWillMount() {
    if (this.props.baseAppState) {
      this.setState({ contract: this.props.baseAppState.contract });
      this.setState({ account: this.props.baseAppState.accounts[0] });
      this.setState({ priceContract: this.props.baseAppState.priceContract });
      this.setState({ assets: [] });
    }
  }

  componentDidMount() {
    let url = window.location.href;
    let n = url.lastIndexOf("/");
    let payload = url.substring(n + 1);
    let matchId = parseInt(atob(payload));

    this.setState({ matchId: matchId });

    if (!this.state.match) {
      console.log("url", window.location);
      if (url.indexOf("/matches/create") > -1) {
        this.setState({ isLoggedIn: false });
        this.getFixtureMatch(matchId);
        return;
      }
      this.setState({ isLoggedIn: true });
      this.getMatch(matchId);
    }
    // if(this.state.ONE_BNB == 0){
    //   this.getBNBPriceFeed();
    // }
    // this.getBNBPriceFeed();
    if (this.props.baseAppState) {
      let initBlockNumber = this.props.baseAppState.fromBolckNumber;
      let web3 = this.props.baseAppState.web3;
      getPastEvents(web3, initBlockNumber, this.getSmartAssets);
    }
  }

  getSmartAssets = (fromBolckNumber, toBolckNumber) => {
    this.state.contract.getPastEvents(
      "SmartAssetAwardedEvent",
      {
        filter: {
          awardee: this.state.account,
          leagueId: this.props.baseAppState.leagueId,
          matchId: this.state.matchId,
        },
        fromBlock: fromBolckNumber,
        toBlock: toBolckNumber, // "latest"
      },
      (error, events) => {
        if (!error && events && events.length > 0) {
          let _assets = this.state.assets;
          events.forEach((event) => {
            let assetId = event.returnValues.smartAssetId;

            // get assets details
            this.state.contract.methods
              .getMatchSmartAssetInfo(assetId)
              .call({ from: this.state.account })
              .then((result) => {
                console.log("asset details", assetId, result);
                if (result) {
                  //  { id: 1, Date: '22Nov 2022', Match: 'WC1/4', MatchMember: 'England:Iran', MatchMemberShort: 'Engl:Iran', Amt: '$210', BetOn: 'England', Score: 'n/a', Result: 'n/a', Claimed: 'pending' },

                  let matchStatus = result.matchDetail.state; // 比赛状态 0:未开始；1:开始；2：结束
                  let ret = "n/a"; // 比赛结果 0:无；1:平；2:A赢；3:B赢
                  let score = "0:0";
                  let claim = "pending"; // 0:pending;1: Win $320 fee $18'; 2:  Lose -$320 ; 3: Win $320 to be claimed
                  let amt = fromWei(result.smartAssetInfo.betInfo.payAmount);
                  let withdrawTimestamp = parseInt(
                    result.smartAssetInfo.withdrawTimestamp
                  );
                  let winAmt = (
                    (amt * result.matchDetail.finalOdds) /
                    100000000000000000
                  ).toFixed(1);
                  let withdrawAmount = fromWei(
                    result.smartAssetInfo.withdrawAmount
                  );
                  withdrawAmount = parseFloat(withdrawAmount).toFixed(1);
                  let feesAmount = fromWei(result.smartAssetInfo.feesAmount);
                  feesAmount = parseFloat(feesAmount).toFixed(1);

                  let isWithdraw = false;
                  if (matchStatus == 2) {
                    score =
                      result.matchDetail.scoreTeamA +
                      " : " +
                      result.matchDetail.scoreTeamB;
                    // Won / Lose / n/a
                    if (
                      result.matchDetail.result > 0 &&
                      result.matchDetail.result ==
                        result.smartAssetInfo.matchResult
                    ) {
                      ret = "Won";
                      // 判断是否赎回金额
                      if (withdrawTimestamp > 0 && withdrawAmount > 0) {
                        claim =
                          "Win $" + withdrawAmount + " fee $" + feesAmount;
                        isWithdraw = false;
                      } else {
                        claim = "Win $" + winAmt + " to be claimed";
                        isWithdraw = true;
                      }
                    } else {
                      ret = "Lose";
                      claim = "Lose -$" + amt;
                      isWithdraw = false;
                    }
                  }

                  let asset = {
                    id: parseInt(assetId), // 押注ID
                    matchId: parseInt(result.smartAssetInfo.matchId), // 押注项目
                    Date: parseInt(result.smartAssetInfo.betTimestamp), // 押注时间
                    owner: this.state.account,
                    Match: this.state.match.round,
                    MatchMember:
                      result.matchDetail.matchInfo.teamAName +
                      " : " +
                      result.matchDetail.matchInfo.teamBName,
                    MatchMemberShort:
                      result.matchDetail.matchInfo.teamAName.substring(0, 3) +
                      " : " +
                      result.matchDetail.matchInfo.teamBName.substring(0, 3),
                    Amt: "$" + amt,
                    BetOn: result.smartAssetInfo.betTeamName,
                    Score: score,
                    Result: ret,
                    Claimed: claim,
                    selectable: isWithdraw,
                  };
                  _assets.push(asset);
                  this.setState({ assets: _assets });
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

  getFixtureMatch = (fixture_id) => {
    const fixtures = fixturesDetail.api.fixtures;
    for (let f of fixtures) {
      if (f.fixture_id == fixture_id) {
        f.id = f.fixture_id;
        f.oddsA = 0;
        f.oddsB = 0;
        f.oddsDraw = 0;
        f.poolSize = 0;
        if (!this.state.match) {
          this.setState({ match: f });
        }
      }
    }
    //todo:调用API获取数据
    // const MATCH_RESULT_API = "http://test.com/";
    // let matchResultLink = MATCH_RESULT_API + fixture_id;
    // APICall(matchResultLink)
    //   .then((result) => {
    //     // console.log("match details", result);
    //     if (result) {
    //       // 获取Match详细信息
    //       let match = result.api.fixtures[0];
    //       match.id = match.fixture_id;
    //       match.oddsA = 0;
    //       match.oddsB = 0;
    //       match.oddsDraw = 0;
    //       match.poolSize = 0;
    //       if (!this.state.match) {
    //         this.setState({ match: match });
    //       }
    //     }
    //   })
    //   .catch((error) => {
    //     console.log(error);
    //   });
  };
  refreshFun = () => {
    console.log("refreshFun:::::111111111111");
    this.setState({ assets: [] });
    if (this.props.baseAppState) {
      let initBlockNumber = this.props.baseAppState.fromBolckNumber;
      let web3 = this.props.baseAppState.web3;
      getPastEvents(web3, initBlockNumber, this.getSmartAssets);
    }
  };
  getMatch = (matchId) => {
    this.state.contract.methods
      .getMatch(matchId)
      .call({ from: this.state.account })
      .then((contractMatch) => {
        if (contractMatch) {
          console.log("getMatch", contractMatch);
          APICall(contractMatch.matchResultLink)
            .then((result) => {
              // console.log("match details", result);
              if (result) {
                // 获取Match详细信息
                let match = result.api.fixtures[matchId - 1];
                result.api.fixtures.forEach((i) => {
                  if (
                    contractMatch.matchResultLink.indexOf(i.fixture_id) > -1
                  ) {
                    console.log("match details===:", i);
                    match = i;
                    return;
                  }
                });
                match.id = matchId;
                // 计算赔率
                let { oddsA, oddsB, oddsDraw } = calculateOdds(
                  contractMatch.totalPayoutTeamA,
                  contractMatch.totalPayoutTeamB,
                  contractMatch.totalPayoutDraw
                );
                // 设置是否可以继续押注 0：未开始；1：开始；2：结束
                match.oddsFlg = contractMatch.state;
                match.oddsA = oddsA;
                match.oddsB = oddsB;
                match.oddsDraw = oddsDraw;
                match.totalPayoutTeamA = fromWei(
                  contractMatch.totalPayoutTeamA
                );
                match.totalPayoutTeamB = fromWei(
                  contractMatch.totalPayoutTeamB
                );
                match.totalPayoutDraw = fromWei(contractMatch.totalPayoutDraw);
                match.homeTeam.team_name = contractMatch.matchInfo.teamAName;
                match.awayTeam.team_name = contractMatch.matchInfo.teamBName;
                console.log(" oddsA, oddsB, oddsDraw ", oddsA, oddsB, oddsDraw);
                // 计算赔率
                let { poolSize } = matchTotalOdds(
                  contractMatch.totalPayoutTeamA,
                  contractMatch.totalPayoutTeamB,
                  contractMatch.totalPayoutDraw
                );
                match.poolSize = poolSize;
                if (!this.state.match) {
                  this.setState({ match: match });
                }
              }
            })
            .catch((error) => {
              console.log(error);
            });
        }
      })
      .catch((error) => {
        console.log("getMatch error", error);
      });
  };

  setLoadingClose(value) {
    this.setState({ loadingClose: [value] });
  }

  setLoadingWithdraw(value) {
    this.setState({ loadingWithdraw: [value] });
  }

  setBetAmount(value) {
    this.setState({ betAmount: value });
    let BUSDprice = value * this.state.ONE_BNB;
    this.setState({ PRICE_TO_BUSD: BUSDprice });
  }

  setApprove(value) {
    this.setState({ approve: value });
  }

  setLoading(value) {
    this.setState({ loading: [value] });
  }

  setBetSelected(value) {
    this.setState({ betSelected: value });
    console.log("bet selected ", this.state.betSelected);
  }

  render() {
    if (!this.state.match) {
      return <Preloader />;
    }
    console.log("BET **********************");
    const drawStyle = {
      backgroundColor: this.state.betSelected == 2 ? "green" : "",
      color: this.state.betSelected == 2 ? "white" : "",
    };
    const Bets = (props) => {
      console.log("props:::", props, "state", this.state.isLoggedIn);
      const isLoggedIn = this.state.isLoggedIn;
      if (isLoggedIn) {
        return (
          <MatchesBet
            match={this.state.match}
            contract={this.props.baseAppState.contract}
            account={this.props.baseAppState.accounts[0]}
            web3={this.props.baseAppState.web3}
            token={this.props.baseAppState.priceContract}
            assets={this.state.assets}
            refresh={this.refreshFun}
          />
        );
      }

      return (
        <CreateBet
          match={this.state.match}
          contract={this.props.baseAppState.contract}
          account={this.props.baseAppState.accounts[0]}
          web3={this.props.baseAppState.web3}
          token={this.props.baseAppState.priceContract}
          assets={this.state.assets}
        />
      );
    };

    return (
      <div className={"page-wrapper"}>
        <Grid container spacing={3}>
          {/* <Paper className={"match-paper"} elevation={2}> */}
          <Bets isLoggedIn={this.state.isLoggedIn} />
          {/* </Paper> */}
        </Grid>
      </div>
    );
  }
}

export default BetsInfo;

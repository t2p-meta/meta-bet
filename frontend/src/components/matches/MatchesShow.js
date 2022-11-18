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
class MatchesShow extends Component {
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
      this.getMatch(matchId);
    }
    // if(this.state.ONE_BNB == 0){
    //   this.getBNBPriceFeed();
    // }
    // this.getBNBPriceFeed();
    if (this.props.baseAppState) {
      let initBlockNumber = this.props.baseAppState.fromBolckNumber;
      let web3 = this.props.baseAppState.web3;
      // web3.eth.getBlockNumber().then((bolckNumber) => {
      //   var _from = bolckNumber - 890000;
      //   var _to = _from + 5000;
      //   for (var i = 0; i < 180; i++) {
      //     this.getSmartAssets(_from, _to, matchId);
      //     _to += 5000;
      //     _from += 5000;
      //   }
      // });
      getPastEvents(web3, initBlockNumber, this.getSmartAssets);
    }
  }

  // selectAsset=(assetId)=>event=>{
  //   event.preventDefault();
  // }

  // getBNBPriceFeed = () => {
  //   //TEST NET

  //   this.state.priceContract.methods
  //     .getLatestPrice()
  //     .call({ from: this.state.account })
  //     .then((result) => {
  //       console.log("pricefeed result", result);
  //       this.setState(
  //         { ONE_BNB: (result / 10000).toFixed(4) },
  //         console.log("price feed response", this.state.ONE_BNB)
  //       );
  //     })
  //     .catch((error) => {
  //       console.log("get bnb PriceFeed error", error);
  //     });
  // };

  getSmartAssets = (fromBolckNumber, toBolckNumber) => {
    this.state.contract.getPastEvents(
      "SmartAssetAwardedEvent",
      {
        filter: { awardee: this.state.account },
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
                  let betOn = null;
                  if (result.smartAssetInfo.matchResult == 2) {
                    //teamA
                    betOn = 0;
                  } else if (result.smartAssetInfo.matchResult == 3) {
                    //teamB
                    betOn = 1;
                  } else if (result.smartAssetInfo.matchResult == 1) {
                    //draw
                    betOn = 2;
                  } else {
                  }

                  let asset = {
                    id: parseInt(assetId),
                    value: fromWei(result.smartAssetInfo.betInfo.payAmount),
                    matchId: parseInt(result.smartAssetInfo.matchId),
                    betOn: betOn,
                    owner: this.state.account,
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

  getMatch = (matchId) => {
    this.state.contract.methods
      .getMatch(matchId)
      .call({ from: this.state.account })
      .then((contractMatch) => {
        if (contractMatch) {
          console.log("getMatch", contractMatch);

          APICall(contractMatch.matchResultLink)
            .then((result) => {
              console.log("match details", result);
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
                match.oddsA = oddsA;
                match.oddsB = oddsB;
                match.oddsDraw = oddsDraw;

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
    this.setState({ loadingClose: value });
  }

  setLoadingWithdraw(value) {
    this.setState({ loadingWithdraw: value });
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
    this.setState({ loading: value });
  }

  setBetSelected(value) {
    this.setState({ betSelected: value });
    console.log("bet selected ", this.state.betSelected);
  }

  render() {
    if (!this.state.match) {
      return <Preloader />;
    }

    const drawStyle = {
      backgroundColor: this.state.betSelected == 2 ? "green" : "",
      color: this.state.betSelected == 2 ? "white" : "",
    };

    // if (this.state.match.creator === this.state.account) {
    //   history.push(`/matches/${this.state.match.matchId}/admin`);
    // }

    return (
      <Grid
        style={{ height: "100%", position: "relative", top: "-20px" }}
        container
        spacing={2}
      >
        <Grid style={gridItemStyle} item container xs={8}>
          <Card style={cardStyle}>
            <CardHeader
              title={
                <h5 style={cardHeader}>
                  <span>PLACE BET</span>
                  {this.state.match.ended && (
                    <span style={{ color: "red" }}>CLOSED</span>
                  )}
                </h5>
              }
            />
            <CardContent
              style={{ height: "100%", position: "relative", top: "-30px" }}
            >
              <Grid style={{ height: "65%" }} container spacing={2}>
                <Grid style={gridItemStyle} item xs={5} container>
                  {this.state.match ? (
                    <TeamImage
                      match={this.state.match}
                      teamIndex={0}
                      isSelected={this.state.betSelected == 0 ? true : false}
                      onSelectBetCallback={this.setBetSelected}
                    />
                  ) : (
                    <Preloader />
                  )}
                </Grid>
                <Grid item xs={2} style={gridItemStyle} container>
                  VS
                  <div
                    className={"place-bet-draw"}
                    style={drawStyle}
                    onClick={() => this.setBetSelected(2)}
                  >
                    <span style={{ fontSize: "16px", textAlign: "center" }}>
                      DRAW
                    </span>
                    <br />
                    <span
                      style={{
                        fontSize: "18px",
                        fontWeight: "bold",
                        textAlign: "center",
                      }}
                    >
                      {this.state.match.oddsDraw / 100}
                    </span>
                  </div>
                </Grid>
                <Grid item xs={5} style={gridItemStyle} container>
                  {this.state.match ? (
                    <TeamImage
                      match={this.state.match}
                      teamIndex={1}
                      isSelected={this.state.betSelected == 1 ? true : false}
                      onSelectBetCallback={this.setBetSelected}
                    />
                  ) : (
                    <Preloader />
                  )}
                </Grid>
                <Grid item xs={12}>
                  <span className="busd-price">
                    {" "}
                    ~{" "}
                    {new Intl.NumberFormat().format(
                      this.state.PRICE_TO_BUSD.toFixed(2)
                    )}{" "}
                    USDC
                  </span>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    variant="outlined"
                    label={`Bet Amount in USDC`}
                    value={this.state.betAmount}
                    onChange={(e) => this.setBetAmount(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button
                    onClick={() =>
                      this.state.approve == 2 ? this.bet() : this.onApprove()
                    }
                    style={{
                      backgroundColor: this.state.match.ended
                        ? "#595959"
                        : "#357a38",
                      color: !this.state.match.ended ? "#ffffff" : "#878787",
                      fontWeight: "bold",
                    }}
                    variant="contained"
                    fullWidth
                    disabled={this.state.match.ended}
                  >
                    {this.state.loading ? (
                      <CircularProgress size={24} style={{ color: "white" }} />
                    ) : this.state.approve == 1 ? (
                      "PLACE APPROVE"
                    ) : (
                      "PLACE BET"
                    )}
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
        <Grid style={gridItemStyle} item container xs={4}>
          <Card style={cardStyle}>
            <CardHeader title={<h5 style={cardHeader}>YOUR SMART ASSETS</h5>} />
            <CardContent
              style={{
                padding: "2px 15px",
                display: "flex",
                justifyContent: "space-between",
                flexDirection: "column",
                height: "calc(83% - 2px)",
              }}
            >
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell style={{ fontWeight: "bold" }}>No</TableCell>
                    <TableCell style={{ fontWeight: "bold" }}>Bet</TableCell>
                    <TableCell style={{ fontWeight: "bold" }}>(USDC)</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {this.state.assets && this.state.assets.length > 0
                    ? this.state.assets.map((asset, index) => {
                        let bet = null;
                        if (asset.betOn === 0) {
                          bet = this.state.match.homeTeam.team_name;
                        } else if (asset.betOn === 1) {
                          bet = this.state.match.awayTeam.team_name;
                        } else if (asset.betOn === 2) {
                          bet = "Draw";
                        }

                        if (asset.matchId == this.state.matchId) {
                          return (
                            <TableRow
                              class="asset-list-item"
                              key={index}
                              onClick={() =>
                                this.setState({ assetSelected: asset.id })
                              }
                            >
                              <TableCell>{asset.id}</TableCell>
                              <TableCell>{bet}</TableCell>
                              <TableCell>~ {asset.value}</TableCell>
                            </TableRow>
                          );
                        }
                      })
                    : "No data"}
                </TableBody>
              </Table>
              <Button
                onClick={() => this.withdrawPayout()}
                style={{ fontWeight: "bold" }}
                color="secondary"
                variant="contained"
                disabled={this.state.assetSelected ? false : true}
                fullWidth
              >
                {this.state.loadingWithdraw ? (
                  <CircularProgress size={24} style={{ color: "white" }} />
                ) : (
                  "WITHDRAW PAYOUT (" + this.state.assetSelected + ")"
                )}
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  }

  withdrawPayout = async () => {
    try {
      this.setLoadingWithdraw(true);

      this.state.contract.methods
        .liquidateAsset(this.state.assetSelected)
        .send({
          from: this.state.account,
        })
        .then((result) => {
          console.log("liquidateAsset success", result);

          this.setLoadingWithdraw(false);
          // window.location.reload();
        })
        .catch((error) => {
          console.log(error);
          this.setLoadingWithdraw(false);
          // window.location.reload();
        });
      // window.location.reload();
    } catch (err) {
      alert(err.message);
    }

    this.setLoadingWithdraw(false);
  };

  onApprove = async () => {
    try {
      this.setLoading(true);
      // 1: draw     2: teamA   3: teamB
      if (
        this.state.betSelected != 0 &&
        this.state.betSelected != 1 &&
        this.state.betSelected != 2
      ) {
        alert("invalid bet selection");
        this.setLoading(false);
        return;
      }
      if (!this.state.betAmount) {
        alert("The bet amount must be greater than zero! ");
        this.setLoading(false);
        return;
      }
      let account = this.state.account;
      this.setApprove(1);
      let totalAmount = await toWei(parseInt(this.state.betAmount));
      console.log("account", account, "onApprove:", totalAmount);
      await this.state.priceContract.methods
        .approve(this.state.contract.options.address, totalAmount)
        .send({ from: account })
        .then((result) => {
          console.log("account", account, "onApprove result:", result);
          if (result.error) {
            this.setApprove(0);
          } else {
            this.setApprove(2);
            this.bet();
          }
        });
    } catch (err) {
      console.log(err);
      alert(err.message);
    }
    // this.setLoading(false);
  };

  bet = async () => {
    try {
      this.setLoading(true);
      let betOn = 0;

      // 1: draw     2: teamA   3: teamB
      if (this.state.betSelected == 0) {
        //teamA
        betOn = 2;
      } else if (this.state.betSelected == 1) {
        //teamB
        betOn = 3;
      } else if (this.state.betSelected == 2) {
        //draw
        betOn = 1;
      } else {
        alert("invalid bet selection");
        this.setLoading(false);
        return;
      }
      /**
       *         
      AssetType assetType; // 押注资产类型 ETH 或ERC20 实付币种
      address payToken; // USDC
      uint256 payAmount;  // 押注金额
       */
      const payAsset = [
        1,
        this.state.priceContract.options.address,
        toWei(this.state.betAmount),
      ];

      console.log("Bet amount", this.state.match.id, betOn, payAsset);

      // value: parseInt(this.state.betAmount * 10 ** 18), // 原生币支付
      this.state.contract.methods
        .placeBet(this.state.match.id, betOn, payAsset)
        .send({
          value: 0,
          from: this.state.account,
        })
        .then((result) => {
          console.log("placebet success", result);

          this.setLoading(false);
          window.location.reload();
        })
        .catch((error) => {
          console.log(error);
          this.setLoading(false);
          window.location.reload();
        });
    } catch (err) {
      alert(err.message);
      console.log(err);
      this.setLoading(false);
    }

  };
}

export default MatchesShow;

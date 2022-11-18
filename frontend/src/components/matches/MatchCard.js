import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { makeStyles } from "@material-ui/core/styles";
import { Grid, Paper, Button, Typography } from "@material-ui/core";
import Avt from "../layout/AvatarImg";
import "../../App.css";
import Preloader from "../layout/Preloader";
import AccountBalanceIcon from "@material-ui/icons/AccountBalance";
import CasinoIcon from "@material-ui/icons/Casino";
import { getPastEvents } from "../../utils/web3sdk";
const useStyles = makeStyles({
  title: {
    fontSize: 8,
  },
});
export const MatchCard = ({
  match,
  contract,
  account,
  web3,
  token,
  initBlockNumber,
}) => {
  const classes = useStyles();
  const [apiData, setApiData] = useState(match);
  const [myBet, setMyBet] = useState(null);

  // const { apiUrl } = match;
  useEffect(() => {
    (async () => {
      // console.log(web3, "web3..");
      // web3.eth.getBlockNumber().then((bolckNumber) => {
      //   var _from = bolckNumber - 890000;
      //   var _to = _from + 5000;
      //   for (var i = 0; i < 100; i++) {
      //     contract.getPastEvents(
      //       "BetPlacedEvent",
      //       {
      //         filter: { bettor: account, matchId: match.matchId },
      //         fromBlock: _from,
      //         toBlock: _to,
      //       },
      //       (error, events) => {
      //         if (!error) {
      //           if (events) {
      //             // console.log("bets placed by user", events);
      //             setMyBet(events);
      //           }
      //         } else {
      //           console.log("fetch bet error", error);
      //         }
      //       }
      //     );
      //     _to += 5000;
      //     _from += 5000;
      //   }
      // });

      // getPastEvents(web3, initBlockNumber, getBetPlaces);
      // setApiData(res.data);
    })();
  }, []);
  const getDateString = (type, time) => {
    if (type == 'Start') {
      let date = new Date(time)
      return ` ${date.getDate() > 9 ? date.getDate() : '0' + date.getDate()}-${date.getMonth() + 1 > 9 ? date.getMonth() + 1 : '0' + date.getMonth() + 1}-${date.getFullYear()} ${date.getHours() > 9 ? date.getHours() : '0' + date.getHours()}:${date.getMinutes() > 9 ? date.getMinutes() : '0' + date.getMinutes()}`
    } else if (type == 'End') {
      let d1 = new Date(time)
      let d2 = new Date()
      let cha = Math.abs(d2.getTime() - d1.getTime())
      let days = parseInt(cha / (24 * 60 * 60 * 1000))
      let hours = parseInt(cha % (24 * 60 * 60 * 1000) / (60 * 60 * 1000))
      let mins = parseInt(cha % (60 * 60 * 1000) / (60 * 1000))
      if (days) {
        return ` ${days} Day ${hours} Hour ${mins} Minute`
      } else if (hours) {
        return ` ${hours} Hour ${mins} Minute`
      } else {
        return ` ${mins} Minute`
      }
    }
  }
  const getBetPlaces = (_from, _to) => {
    // console.log("MatchCard:", _from, _to);
    contract.getPastEvents(
      "BetPlacedEvent",
      {
        filter: { bettor: account, matchId: match.matchId },
        fromBlock: _from,
        toBlock: _to,
      },
      (error, events) => {
        if (!error) {
          if (events) {
            // console.log("bets placed by user", events);
            setMyBet(events);
          }
        } else {
          console.log("fetch bet error", error);
        }
      }
    );
  };
  const getDetails = (teamIndex) => {
    let team = null;

    if (teamIndex === 0) {
      team = match.homeTeam;
      team = Object.assign(team, { odds: match.oddsA / 100 });
    }
    if (teamIndex === 1) {
      team = match.awayTeam;
      team = Object.assign(team, { odds: match.oddsB / 100 });
    }
    if (teamIndex === 2) {
      team = {
        team_name: "Draw",
        odds: match.oddsDraw / 100,
      };
    }
    return (
      <div>
        {team.logo ? (
          <Avt link={team.logo} letter={null} index={teamIndex} />
        ) : (
          <Avt link={null} letter="VS" index={teamIndex} />
        )}
        <div
          style={{
            width: "100%",
            textAlign: "center",
            fontSize: "15px",
            fontWeight: "bold",
          }}
        >
          {team.team_name}
        </div>
        <div
          style={{
            width: "100%",
            textAlign: "center",
            fontSize: "15px",
            fontWeight: "bold",
          }}
        >
          {team.odds}
        </div>
      </div>
    );
  };

  if (apiData === null) return <Preloader />;

  return (
    <div>
      <Grid style={{ marginBottom: "20px" }}
        container spacing={3} alignItems="center" justifyContent="center">

        <Grid item xs={5}>
          {getDetails(0)}
        </Grid>
        <Grid item xs={2}>
          {getDetails(2)}
        </Grid>
        <Grid item xs={5}>
          {getDetails(1)}
        </Grid>
        {/* <Grid item xs={12}> */}
        {/* <Paper
            style={{
              height: "100%",
              width: "100%",
              backgroundColor: "#505050",
              padding: "8px",
            }}
            elevation={0}
          > */}
        {/* <div style={{ display: "flex", justifyContent: "center" }}> */}
        {/* {match.ended ? ( //match.statusShort === 'FT'
                <span style={{ color: "red", fontWeight: "bold" }}>CLOSED</span>
              ) : (
                <>
                  <Grid container item xs={12} spacing={5}>
                    <Grid item xs={4}>
                      <span
                        style={{ fontSize: "20px", marginRight: "5px" }}
                        className="material-icons"
                      >
                        <CasinoIcon />
                      </span>
                      <span
                        style={{
                          fontSize: "15px",
                          fontWeight: "bold",
                          position: "relative",
                          top: "-5px",
                        }}
                      >{`Win ${match.oddsA / 100}`}</span>
                    </Grid>
                    <Grid item xs={4}>
                      <span
                        style={{ fontSize: "20px", marginRight: "5px" }}
                        className="material-icons"
                      >
                        <CasinoIcon />
                      </span>
                      <span
                        style={{
                          fontSize: "15px",
                          fontWeight: "bold",
                          position: "relative",
                          top: "-5px",
                        }}
                      >{`Draw ${match.oddsDraw / 100}`}</span>
                    </Grid>
                    <Grid item xs={4}>
                      <span
                        style={{ fontSize: "20px", marginRight: "5px" }}
                        className="material-icons"
                      >
                        <CasinoIcon />
                      </span>
                      <span
                        style={{
                          fontSize: "15px",
                          fontWeight: "bold",
                          position: "relative",
                          top: "-5px",
                        }}
                      >{`Win ${match.oddsB / 100}`}</span>
                    </Grid>
                  </Grid>
                </>
              )} */}
        {/* <span
                style={{
                  fontSize: "20px",
                  marginLeft: "25px",
                  marginRight: "5px",
                }}
                className="material-icons"
              >
                <AccountBalanceIcon />
              </span>
              <span style={{ fontSize: "15px" }}>
                {(match.totalCollection / 10 ** 18).toFixed(2)}{" "}                
              </span> */}
        {/* </div> */}
        {/* </Paper> */}
        {/* </Grid> */}

        {match.ended || match.started ? null : (
          // {myBet && myBet.length > 0 ?
          // <Grid item xs={12}>
          //   <Link to={`/matches/${btoa(match.matchId)}`}>
          //     <Button
          //       style={{
          //         backgroundColor: "#357a38",
          //         color: "#ffffff",
          //         fontWeight: "bold",
          //       }}
          //       variant="contained"
          //       fullWidth
          //     >
          //       VIEW BET
          //     </Button>
          //   </Link>
          // </Grid>
          <Grid container item xs={12} spacing={4}>
            <Grid item xs={12} md={6}>
              <Link to={`/matches/bet/${btoa(match.matchId)}`}>

                <Button
                  style={{
                    backgroundColor: "#357a38",
                    color: "#ffffff",
                    fontWeight: "bold",
                  }}
                  variant="contained"
                  disabled={match.ended}
                  fullWidth
                >
                  PLACE BET
                </Button>
              </Link>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography className={classes.title}>
                Pool size ${match.poolSize || 0}
              </Typography>
              <Typography className={classes.title}>
                Expire in {getDateString('End', parseInt(match.event_timestamp + 2700) * 1000)}
              </Typography>
            </Grid>
          </Grid>
        )}
      </Grid>
    </div>
  );
};

export default MatchCard;

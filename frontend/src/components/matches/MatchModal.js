import React, { useState } from "react";
import {
  Button,
  Grid,
  makeStyles,
  Modal,
  Paper,
  TextField,
  CircularProgress,
} from "@material-ui/core";
import Avt from "../layout/AvatarImg";
import history from "../../history";
import { toWei } from "../../utils/web3sdk";

export const MatchModal = ({
  open,
  setCreateModalOpen,
  match,
  contract,
  account,
  token,
}) => {
  const [loading, setLoading] = useState(false);
  const [betA, setBetA] = useState(0);
  const [betB, setBetB] = useState(0);
  const [betDraw, setBetDraw] = useState(0);
  const [margin, setMargin] = useState();
  const [approve, setApprove] = useState(0);

  const onApprove = async () => {
    try {
      if (!betA || !betDraw || !betB) {
        //|| !match.firstHalfStart
        alert("incomplete match details");
        return;
      }
      setApprove(1);
      setLoading(true);
      let totalAmount = await toWei(
        parseInt(betA) + parseInt(betB) + parseInt(betDraw)
      );
      console.log("account", account, "onApprove:", totalAmount);
      let ret = await token.methods
        .approve(contract.options.address, totalAmount)
        .send({ from: account })
        .then((result) => {
          console.log("account", account, "onApprove result:", result);
          if (result.error) {
            setApprove(0);
          } else {
            setApprove(2);
            createMatch();
          }
        });
    } catch (err) {
      console.log(err);
      alert(err.message);
    }
    // setLoading(false);
  };

  const createMatch = async () => {
    const teamAName = match.homeTeam.team_name;
    const teamBName = match.awayTeam.team_name;
    const matchUrl = `fixtures/id/${match.fixture_id}`;

    try {
      console.log("match details", JSON.stringify(match));
      if (!match.fixture_id || !matchUrl || !betA || !betDraw || !betB) {
        //|| !match.firstHalfStart
        alert("incomplete match details");
        return;
      }
      setLoading(true);

      // if (!match.firstHalfStart) {
      //   match.firstHalfStart = parseInt(Date.now() / 1000) + 8 * 3600;
      // }
      let startAt = match.event_timestamp;
      if (match.statusShort != "NS") {
        alert("The match has started!");
        return;
      }
      // let _matchInfo = [1, 2, 5, startAt, 1, metatoken, 10, 20, 30];
      let initOddsTeamA = await toWei(betA);
      let initOddsTeamB = await toWei(betB);
      let initOddsDraw = await toWei(betDraw);
      const _matchInfo = {
        // draw队名称
        drawName: "draw",
        // teamA队名称
        teamAName: teamAName,
        // teamB队名称
        teamBName: teamBName,
        // 赢家手续费率 8% winnerfeerate (让玩家自己设置)
        winnerFeeRate: 0.08 * 100,
        // 比赛开始时间
        startAt,
        // 押注资产类型
        assetType: 1,
        // USDC和USDT不写这里，写在公共变量里面，新增发的币可以写在这里
        payToken: token.options.address,
        initOddsTeamA: initOddsTeamA,
        initOddsTeamB: initOddsTeamB,
        initOddsDraw: initOddsDraw,
      };
      console.log(
        "add new match",
        1,
        parseInt(match.fixture_id),
        matchUrl,
        initOddsTeamA,
        initOddsTeamB,
        initOddsDraw,
        _matchInfo
      );
      await contract.methods
        .createMatch(
          1, // 世界杯联赛 _leagueId
          parseInt(match.fixture_id), // 比赛体育活动Id _apiMatchId
          matchUrl, // 比赛赛程接口 _matchResultLink
          tupleMatchInfo(_matchInfo)
        )
        .send({
          value: 0,
          from: account,
        });
      setLoading(false);
      history.push("/matches");
      setCreateModalOpen(false);
    } catch (err) {
      console.log(err);
      alert(err.message);
    }
    setLoading(false);
  };

  /**
   * 组织构造订单Key 参数
   * @param {object} orderKey
   * @returns
   */
  const tupleMatchInfo = function (matchInfo) {
    // // teamA队名称
    // teamAName: teamAName,
    // // teamB队名称
    // teamBName: teamBName,
    // // 赢家手续费率 8% winnerfeerate (让玩家自己设置)
    // winnerFeeRate: 0.08 * 100,
    // // 比赛开始时间
    // startAt,
    // // 押注资产类型
    // assetType: 1,
    // // USDC和USDT不写这里，写在公共变量里面，新增发的币可以写在这里
    // payToken: await defaultTokenAddress(),
    // initOddsTeamA: await toWei(betA),
    // initOddsTeamB: await toWei(betB),
    // initOddsDraw: await toWei(betDraw),
    return [
      matchInfo.drawName,
      matchInfo.teamAName,
      matchInfo.teamBName,
      matchInfo.winnerFeeRate,
      matchInfo.startAt,
      matchInfo.assetType,
      matchInfo.payToken,
      matchInfo.initOddsTeamA,
      matchInfo.initOddsTeamB,
      matchInfo.initOddsDraw,
    ];
  };
  const getImage = (teamIndex) => {
    let team = null;

    if (teamIndex === 0) {
      team = match.homeTeam;
    }
    if (teamIndex === 1) {
      team = match.awayTeam;
    }

    return (
      <div>
        {team.logo ? (
          <Avt link={team.logo} letter={null} index={teamIndex} />
        ) : (
          <Avt link={null} letter={team.team_name} index={teamIndex} />
        )}
        <span style={{ fontSize: "15px", fontWeight: "bold" }}>
          {team.team_name}
        </span>
      </div>
    );
  };

  const useStyles = makeStyles((theme) => ({
    root: {
      flexGrow: 1,
    },
    paper: {
      padding: theme.spacing(2),
      textAlign: "center",
      color: theme.palette.text.secondary,
    },
  }));

  const classes = useStyles();

  return (
    <Modal
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      open={open}
      onClose={() => setCreateModalOpen(false)}
    >
      <div style={modalStyle}>
        <span style={{ fontWeight: "bold", fontSize: "18px", padding: "5px" }}>
          CREATE MATCH
        </span>
        <Paper className={classes.paper} elevation={0}>
          <Grid
            container
            spacing={2}
            alignItems="center"
            justifyContent="center"
          >
            <Grid item xs={5}>
              {getImage(0)}
            </Grid>
            <Grid item xs={2}>
              VS
            </Grid>
            <Grid item xs={5}>
              {getImage(1)}
            </Grid>
            <Grid item xs={4}>
              <TextField
                value={betA}
                onChange={(e) => setBetA(e.target.value)}
                variant="outlined"
                fullWidth
                label="Bet Team A"
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                value={betDraw}
                onChange={(e) => setBetDraw(e.target.value)}
                variant="outlined"
                fullWidth
                label="Bet Draw"
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                value={betB}
                onChange={(e) => setBetB(e.target.value)}
                variant="outlined"
                fullWidth
                label="Bet Team B"
              />
            </Grid>
            {/* <Grid item xs={12}>
              <TextField
                value={margin}
                onChange={(e) => setMargin(e.target.value)}
                variant="outlined"
                fullWidth
                label="Initial Margin"
              />
            </Grid> */}
            <Grid item xs={12}>
              <Button
                style={{ fontWeight: "bold" }} 
                onClick={approve == 2 ? createMatch : onApprove}
                variant="contained"
                fullWidth
                color="primary"
              >
                {loading ? (
                  <CircularProgress style={{ color: "white" }} size={24} />
                ) : approve == 1 ? (
                  "MATCH APPROVE"
                ) : (
                  "CREATE MATCH"
                )}
              </Button>
            </Grid>
          </Grid>
        </Paper>
      </div>
    </Modal>
  );
};

const modalStyle = {
  position: "absolute",
  top: "20%",
  margin: "auto",
  backgroundColor: "#424242",
  width: "50%",
  height: "58%",
  padding: "10px",
};

export default MatchModal;

import React, { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import history from "../../history";
import { toWei } from "../../utils/web3sdk";
import {
  Button,
  Grid,
  makeStyles,
  Typography,
  Container,
  Paper,
  Checkbox,
  Dialog,
  CircularProgress,
  FormControl,
  FormControlLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
} from "@material-ui/core";

const modalBg = "http://localhost:3000/images/modal-bg.png";

const useStyles = makeStyles((theme) => ({
  cardGrid: {
    paddingTop: theme.spacing(3),
    paddingBottom: theme.spacing(3),
    paddingLeft: "12px",
    paddingRight: "12px",
  },
  cardTitle: {
    fontWeight: "bold",
  },
  paper: {
    padding: theme.spacing(2),
    display: "flex",
    overflow: "auto",
    flexDirection: "column",
  },
  gameGrid: {
    paddingBottom: theme.spacing(0.5),
    paddingLeft: theme.spacing(1),
    paddingRight: theme.spacing(1),
  },
  gameSpan: {
    // fontSize: '12px',
    fontWeight: "bold",
    whiteSpace: "nowrap",
    display: "block",
    // fontFamily: 'Myriad Pro'
  },
  gameSpanWrap: {
    paddingTop: "14px",
    textAlign: "center",
  },
  gameImage: {
    verticalAlign: "middle",
    border: "1px solid #eee",
    maxWidth: "72px",
    maxHeight: "100%",
    objectFit: "cover",
  },
  gameImageWrap: {
    height: "72px",
    width: "136px",
    display: "flex",
    justifyContent: "center",
    // width: "100%",
    // height: "82px",
    textAlign: "center",
    lineHeight: "80px",
  },

  betRadioGrid: {
    padding: "0 10px",
  },
  betRadioWrap: {
    textAlign: "center",
  },

  betRadioLabel: {
    fontWeight: "bold",
  },

  betRadio: {
    "& .MuiSvgIcon-root": {
      width: "1.5em",
      height: "1.5em",
    },
  },

  inputGrid: {
    paddingTop: theme.spacing(1),
    paddingLeft: theme.spacing(1),
    paddingRight: theme.spacing(1),
  },
  inputAmount1: {
    marginLeft: "8.3%",
    width: "90%",
  },
  inputSelectType: {
    marginLeft: "10%",
    width: "80%",
  },

  betTableGrid: {
    paddingTop: theme.spacing(1),
    paddingLeft: theme.spacing(1),
    paddingRight: theme.spacing(1),
  },
  betTableLabel: {
    fontSize: "10px",
    padding: 0,
    // transform: 'scale(0.8)',
    transformOrigin: "left",
  },
  betTableRowCell: {
    textAlign: "center",
    padding: "6px 0 6px 0",
    fontWeight: "bold",
    fontSize: "14px",
  },
  betTableCellSelect: {
    fontWeight: "bold",
  },

  betButton: {
    width: "190px",
    marginTop: theme.spacing(1),
    marginLeft: theme.spacing(4),
  },

  betAmountGrid: {
    paddingBottom: theme.spacing(0.5),
    paddingLeft: theme.spacing(1),
    paddingRight: theme.spacing(1),
  },
  betAmountWrap: {
    textAlign: "center",
    "& .MuiFormControlLabel-label": {
      fontWeight: "bold",
    },
  },
  betAmountLabel: {
    width: "75%",
    margin: "0 auto",
  },
  betAmount: {
    marginTop: theme.spacing(2),
    width: "100%",
  },

  betHisTable: {
    // marginLeft: '-10px',
  },
  betHisTableHead: {
    fontWeight: "bold",
    paddingLeft: "2px",
    paddingRight: "2px",
  },
  betHisTableCell: {
    paddingLeft: "2px",
    paddingRight: "2px",
    fontSize: "13px",
    position: "relative",
  },
  betHisTableCellText: {
    fontSize: "12px",
  },
  betHisTableCellText2: {
    fontSize: "12px",
    maxWidth: "60px",
    display: "flex",
  },
  betHisTableCellTextItem1: {
    flex: 1,
    textAlign: "center",
  },
  betHisTableCellTextItem2: {},
  betHisTableRadio: {
    position: "absolute",
    top: "50%",
    marginTop: "-20px",
  },
  betHisButton: {
    width: "auto",
    margin: "18px auto 0 auto",
    paddingLeft: "24px",
    paddingRight: "24px",
  },

  betSuccessDialog: {
    height: "500px",
    width: "281px",
    background: "url(" + modalBg + ") center center no-repeat",
    padding: "70px 30px 0 30px",
  },
  betSuccessText: {
    textAlign: "center",
    color: "#fff",
    fontSize: "12px",
    height: "41px",
  },
  betSuccessDialogButtonGrid: {
    paddingTop: "186px",
  },
  betSuccessDialogButton: {
    backgroundColor: "#fff!important",
    borderRadius: "20px",
    width: "100%",
    marginBottom: "6px",
    border: "8px solid #413e71",
    height: "56px",
  },
}));

const Title = (props) => {
  console.log("title::", props);
  const classes = useStyles();
  return (
    <Typography
      component="h2"
      variant="h6"
      color="inherit"
      className={classes.cardTitle}
      gutterBottom
    >
      {props.children}
    </Typography>
  );
};

function isInViewPortOfOne (el) {
  const viewPortHeight =
    window.innerHeight ||
    document.documentElement.clientHeight ||
    document.body.clientHeight;
  const offsetTop = el.offsetTop;
  const scrollTop = document.documentElement.scrollTop;
  const top = offsetTop - scrollTop;
  return top <= viewPortHeight;
}

const GameInfo = (betInfo1) => {
  console.log("betinfo:::::", betInfo1);
  let betInfo = betInfo1.betInfo;
  const classes = useStyles();
  const [imgCls, setImgCls] = useState("transition-flip-left");
  const refImg = useRef();

  useEffect(() => {
    const onScroll = () => {
      if (refImg.current && isInViewPortOfOne(refImg.current)) {
        setImgCls("transition-flip-left transition-flip-left-1");
      } else {
        setImgCls("transition-flip-left");
      }
    };
    document.addEventListener("scroll", onScroll);
    setTimeout(onScroll, 1000);
    return () => {
      document.removeEventListener("scroll", onScroll);
    };
  }, []);
  return (
    <Grid container className={classes.gameGrid}>
      <Grid item xs={4} className={classes.gameImageWrap}>
        <img
          ref={refImg}
          src={betInfo.l_logo}
          className={clsx(classes.gameImage, imgCls)}
        />
      </Grid>
      <Grid item xs={4} className={classes.gameSpanWrap}>
        <Typography
          component="span"
          color="inherit"
          className={classes.gameSpan}
        >
          {betInfo.game}
        </Typography>
        <Typography
          component="span"
          color="inherit"
          className={classes.gameSpan}
        >
          {betInfo.date}
        </Typography>
      </Grid>
      <Grid item xs={4} className={classes.gameImageWrap}>
        <img src={betInfo.r_logo} className={clsx(classes.gameImage, imgCls)} />
      </Grid>
    </Grid>
  );
};

const BetTable = (rows1) => {
  let rows = rows1.rows;
  console.log(" BetTable:::::::", rows);
  const classes = useStyles();
  return (
    <Grid className={classes.betTableGrid} container>
      {rows.map((row, index) => (
        <>
          <Grid item xs={1}></Grid>
          <Grid item xs={10}>
            <Typography color="primary" className={classes.betTableLabel}>
              {row.label}
            </Typography>
          </Grid>
          <Grid
            className={clsx(
              classes.betTableRowCell,
              row.select ? classes.betTableCellSelect : null
            )}
            item
            xs={4}
          >
            {row.a}
          </Grid>
          {/* <Grid item xs={2}></Grid> */}
          <Grid
            className={clsx(
              classes.betTableRowCell,
              row.select ? classes.betTableCellSelect : null
            )}
            item
            xs={4}
          >
            {row.draw}
          </Grid>
          {/* <Grid item xs={2}></Grid> */}
          <Grid
            className={clsx(
              classes.betTableRowCell,
              row.select ? classes.betTableCellSelect : null
            )}
            item
            xs={4}
          >
            {row.b}
          </Grid>
        </>
      ))}
    </Grid>
  );
};

const BetSuccessDialog = (open1, onClose) => {
  let open = open1.open;
  onClose = open1.onClose;
  console.log("open,", open, "onClose:::", onClose);
  const classes = useStyles();
  return (
    <Dialog onClose={onClose} aria-labelledby="simple-dialog-title" open={open}>
      <Paper className={classes.betSuccessDialog}>
        <Typography className={classes.betSuccessText}>
          Your betting ticket is onchain, check it here
        </Typography>
        <Grid className={classes.betSuccessDialogButtonGrid} container>
          <Grid item xs={12}>
            <Button
              className={classes.betSuccessDialogButton}
              variant="outlined"
            >
              Share to Earn
            </Button>
          </Grid>
          <Grid item xs={12}>
            <Button
              className={classes.betSuccessDialogButton}
              variant="outlined"
            >
              Betting History
            </Button>
          </Grid>
          <Grid item xs={12}>
            <Button
              className={classes.betSuccessDialogButton}
              variant="outlined"
            >
              All Match List
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Dialog>
  );
};

const BetHisTable = (rows1, select, onChange) => {
  let rows = rows1.rows;
  select = rows1.select;
  onChange = rows1.onChange;
  console.log(
    "BetHisTable::::",
    rows1,
    "select::::",
    select,
    "change::::::::",
    onChange
  );
  const classes = useStyles();
  return (
    <RadioGroup
      value={select}
      onChange={(evt) => onChange?.(parseInt(evt.target.value))}
    >
      <Table
        size="small"
        className={classes.betHisTable}
        aria-label="simple table"
      >
        <TableHead>
          <TableRow>
            <TableCell
              className={classes.betHisTableHead}
              width={"52px"}
              align="left"
            >
              BetDate
            </TableCell>
            <TableCell
              className={classes.betHisTableHead}
              width={"80px"}
              align="left"
            >
              Match
            </TableCell>
            {/* <TableCell className={classes.betHisTableHead} width={"36px"} align="left">Amt</TableCell> */}
            <TableCell
              className={classes.betHisTableHead}
              width={"60px"}
              align="left"
            >
              BetOn
            </TableCell>
            <TableCell
              className={classes.betHisTableHead}
              width={"52px"}
              align="left"
            >
              Score
            </TableCell>
            {/* <TableCell className={classes.betHisTableHead} width={"50px"} align="left">Result</TableCell> */}
            <TableCell
              className={classes.betHisTableHead}
              width={"60px"}
              align="left"
            >
              Claimed
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell
                valign="top"
                className={classes.betHisTableCell}
                align="left"
              >
                {row.Date}
              </TableCell>
              <TableCell
                valign="top"
                className={classes.betHisTableCell}
                align="left"
              >
                <Typography className={classes.betHisTableCellText}>
                  {row.Match}
                </Typography>
                <Typography className={classes.betHisTableCellText}>
                  {row.MatchMember}
                </Typography>
              </TableCell>
              {/* <TableCell valign="top" className={classes.betHisTableCell} align="left">{row.Amt}</TableCell> */}
              <TableCell
                valign="top"
                className={classes.betHisTableCell}
                align="left"
              >
                <Typography className={classes.betHisTableCellText}>
                  {row.BetOn}
                </Typography>
                <Typography className={classes.betHisTableCellText}>
                  {row.Amt}
                </Typography>
              </TableCell>
              <TableCell
                valign="top"
                className={classes.betHisTableCell}
                align="left"
              >
                {row.Score == "n/a" ? (
                  row.Score
                ) : (
                  <>
                    <Typography className={classes.betHisTableCellText2}>
                      <span className={classes.betHisTableCellTextItem1}>
                        {row.MatchMemberShort.split(":")[0]}
                      </span>
                      <span className={classes.betHisTableCellTextItem2}>
                        :
                      </span>
                      <span className={classes.betHisTableCellTextItem1}>
                        {row.MatchMemberShort.split(":")[1]}
                      </span>
                    </Typography>
                    <Typography className={classes.betHisTableCellText2}>
                      <span className={classes.betHisTableCellTextItem1}>
                        {row.Score.split(":")[0]}
                      </span>
                      <span className={classes.betHisTableCellTextItem2}>
                        :
                      </span>
                      <span className={classes.betHisTableCellTextItem1}>
                        {row.Score.split(":")[1]}
                      </span>
                    </Typography>
                  </>
                )}
              </TableCell>
              {/* <TableCell valign="top" className={classes.betHisTableCell} align="left">{row.Result}</TableCell> */}
              <TableCell
                valign="top"
                className={classes.betHisTableCell}
                align="left"
              >
                {row.Claimed}
                {row.selectable ? (
                  <Radio
                    color="primary"
                    className={classes.betHisTableRadio}
                    value={row.id}
                  ></Radio>
                ) : null}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </RadioGroup>
  );
};

const calcBet = (amtBefore, input, amount) => {
  console.log("calcBet:::", amtBefore, "input::", input, "amount::", amount);

  let a =
    amtBefore.a + (input && input.type == "a" ? Math.floor(input.amount) : 0);
  let draw =
    amtBefore.draw +
    (input && input.type == "draw" ? Math.floor(input.amount) : 0);
  let b =
    amtBefore.b + (input && input.type == "b" ? Math.floor(input.amount) : 0);
  a = Math.floor(a);
  b = Math.floor(b);
  draw = Math.floor(draw);
  return {
    a: ((a == 0 ? 0 : (b + draw) / a) + 1).toFixed(2),
    draw: ((draw == 0 ? 0 : (a + b) / draw) + 1).toFixed(2),
    b: ((b == 0 ? 0 : (a + draw) / b) + 1).toFixed(2),
  };
};

export const CreateBet = ({
  match,
  contract,
  account,
  web3,
  token,
  assets,
}) => {
  // const IMAGES = {
  //   england: "http://localhost:3000/images/england.png",
  //   iran: "http://localhost:3000//images/iran.png",
  // }
  // let date = new Date(match.event_timestamp * 1000);
  // let event_date = `${date.getDate() > 9 ? date.getDate() : "0" + date.getDate()
  //   }-${date.getMonth() + 1 > 9 ? date.getMonth() + 1 : "0" + date.getMonth() + 1
  //   }-${date.getFullYear()}`;

  console.log("match::::", match);
  const getDateString = (timestamp) => {
    let date = new Date(timestamp * 1000);
    date = date.toDateString().split(" ")
    return `${date[2]} ${date[1]} ${date[3]}`;
  }
  const betInfo = {
    left: match.homeTeam.team_name,
    right: match.awayTeam.team_name,
    l_logo: match.homeTeam.logo,
    r_logo: match.awayTeam.logo,
    game: match.round || "World Cup 1/4",
    date: getDateString(match.event_timestamp) || "22 Nov 2022",
  };
  for (let a of assets) {
    a.betDate = getDateString(a.Date)
  }
  const classes = useStyles();
  const fixedHeightPaper = clsx(classes.paper);

  const beforeBet = {
    a: match.totalPayoutTeamA,
    draw: match.totalPayoutDraw,
    b: match.totalPayoutTeamB,
  };
  const [table, setTable] = useState([
    {
      label: "amt before bet",
      a: "$" + beforeBet.a,
      draw: "$" + beforeBet.draw,
      b: "$" + beforeBet.b,
    },
    { label: "Odds before bet", ...calcBet(beforeBet) },
    {
      label: "Odds after bet",
      a: "16.5",
      draw: "10.8",
      b: "1.2",
      select: true,
    },
    { label: "Odds Prediction", a: "9.5", draw: "8", b: "2.5" },
  ]);
  const [userBet, setUserBet] = useState({
    type: "",
    amount: 0,
  });
  const [margin, setMargin] = useState();
  const [hisSelect, setHisSelect] = useState(-1);
  const [type, setType] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loadingWithdraw, setLoadingWithdraw] = useState(false);
  const [approve, setApprove] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    setTable([
      ...table.slice(0, 2),
      { label: "Odds after bet", ...calcBet(beforeBet, userBet) },
      ...table.slice(3),
    ]);
  }, [userBet]);

  const [table2, setTable2] = useState(table.slice(2));
  const [userBet2, setUserBet2] = useState({
    a: 0,
    draw: 0,
    b: 0,
  });
  useEffect(() => {
    setTable2([
      { label: "Odds after bet", ...calcBet(userBet2) },
      ...table2.slice(1),
    ]);
  }, [userBet2]);
  const betA = userBet2.a;
  const betB = userBet2.b;
  const betDraw = userBet2.draw;
  const onApprove = async () => {
    try {
      if (!betA || !betDraw || !betB) {
        //|| !match.firstHalfStart
        alert("incomplete match details");
        return;
      }
      console.log("create match onApprove ", betA, betB, betDraw);
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
      setLoading(false);
    }
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
      if (!match.firstHalfStart) {
        match.firstHalfStart = parseInt(Date.now() / 1000) + 8 * 3600;
      }

      let startAt = match.firstHalfStart;
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

  const onPlaceApprove = async () => {
    try {
      setLoading(true);
      // 1: draw     2: teamA   3: teamB
      if (
        userBet.type != "a" &&
        userBet.type != "b" &&
        userBet.type != "draw"
      ) {
        alert("invalid bet selection");
        setLoading(false);
        return;
      }
      if (!userBet.amount) {
        alert("The bet amount must be greater than zero! ");
        setLoading(false);
        return;
      }
      setApprove(1);
      let totalAmount = await toWei(parseInt(userBet.amount));
      console.log("account", account, "onApprove:", totalAmount);
      await token.methods
        .approve(contract.options.address, totalAmount)
        .send({ from: account })
        .then((result) => {
          console.log("account", account, "onApprove result:", result);
          if (result.error) {
            setApprove(0);
          } else {
            setApprove(2);
            bet();
          }
        });
    } catch (err) {
      console.log(err);
      alert(err.message);
      setLoading(false);
    }
  };

  const bet = async () => {
    try {
      setLoading(true);
      let betOn = 0;

      // 1: draw     2: teamA   3: teamB
      if (userBet.type == "a") {
        //teamA
        betOn = 2;
      } else if (userBet.type == "b") {
        //teamB
        betOn = 3;
      } else if (userBet.type == "draw") {
        //draw
        betOn = 1;
      } else {
        alert("invalid bet selection");
        setLoading(false);
        return;
      }
      /**
       *         
      AssetType assetType; // 押注资产类型 ETH 或ERC20 实付币种
      address payToken; // USDC
      uint256 payAmount;  // 押注金额
       */
      const payAsset = [1, token.options.address, toWei(userBet.amount)];

      console.log("Bet amount", match.id, betOn, payAsset);

      // value: parseInt(state.betAmount * 10 ** 18), // 原生币支付
      contract.methods
        .placeBet(match.id, betOn, payAsset)
        .send({
          value: 0,
          from: account,
        })
        .then((result) => {
          console.log("placebet success", result);

          setLoading(false);
          setDialogOpen(true);
          // window.location.reload();
        })
        .catch((error) => {
          console.log(error);
          setLoading(false);
          window.location.reload();
        });
    } catch (err) {
      alert(err.message);
      console.log(err);
      setLoading(false);
    }
  };
  // const table3 = [
  //   { id: 1, Date: '22Nov 2022', Match: 'WC1/4', MatchMember: 'England:Iran', MatchMemberShort: 'Engl:Iran', Amt: '$210', BetOn: 'England', Score: 'n/a', Result: 'n/a', Claimed: 'pending' },
  //   { id: 2, Date: '22Nov 2022', Match: 'WC1/4', MatchMember: 'England:Iran', MatchMemberShort: 'Engl:Iran', Amt: '$210', BetOn: 'England', Score: '5:1', Result: 'Won', Claimed: 'Win $320 fee $18' },
  //   { id: 3, Date: '22Nov 2022', Match: 'WC1/4', MatchMember: 'England:Iran', MatchMemberShort: 'Engl:Iran', Amt: '$210', BetOn: 'England', Score: '5:1', Result: 'Lose', Claimed: 'Lose -$320' },
  //   { id: 4, Date: '22Nov 2022', Match: 'WC1/4', MatchMember: 'England:Iran', MatchMemberShort: 'Engl:Iran', Amt: '$210', BetOn: 'England', Score: '5:1', Result: 'Won', Claimed: 'Win $320 to be claimed', selectable: true },
  // ];

  const withdrawPayout = async () => {
    try {
      setLoadingWithdraw(true);

      contract.methods
        .liquidateAsset(hisSelect)
        .send({
          from: account,
        })
        .then((result) => {
          console.log("liquidateAsset success", result);

          setLoadingWithdraw(false);
          // window.location.reload();
        })
        .catch((error) => {
          console.log(error);
          setLoadingWithdraw(false);
          // window.location.reload();
        });
      // window.location.reload();
    } catch (err) {
      alert(err.message);
    }

    setLoadingWithdraw(false);
  };
  return (
    <>
      <Container className={classes.cardGrid} maxWidth="md">
        <Grid container spacing={3}>
          {/* Left */}
          <Grid item xs={12} md={6} lg={6}>
            <Paper className={fixedHeightPaper}>
              {/* place bet的时候显示 */}
              {/* <Grid>
                <Title>PLACE BET</Title>
                <GameInfo betInfo={betInfo}></GameInfo>
                <RadioGroup
                  value={userBet.type}
                  onChange={(evt) =>
                    setUserBet({
                      ...userBet,
                      type: evt.target.value,
                    })
                  }
                >
                  <Grid container className={classes.betRadioGrid}>
                    <Grid item xs={4} className={classes.betRadioWrap}>
                      <FormControlLabel
                        value="a"
                        label={
                          <span className={classes.betRadioLabel}>
                            {betInfo.left}
                          </span>
                        }
                        labelPlacement="top"
                        control={
                          <Radio color="primary" className={classes.betRadio} />
                        }
                      />
                    </Grid>
                    <Grid item xs={4} className={classes.betRadioWrap}>
                      <FormControlLabel
                        value="draw"
                        label={
                          <span className={classes.betRadioLabel}>
                            {"Draw"}
                          </span>
                        }
                        labelPlacement="top"
                        control={
                          <Radio color="primary" className={classes.betRadio} />
                        }
                      />
                    </Grid>
                    <Grid item xs={4} className={classes.betRadioWrap}>
                      <FormControlLabel
                        value="b"
                        label={
                          <span className={classes.betRadioLabel}>
                            {betInfo.right}
                          </span>
                        }
                        labelPlacement="top"
                        control={
                          <Radio color="primary" className={classes.betRadio} />
                        }
                      />
                    </Grid>
                  </Grid>
                </RadioGroup>
                <Grid container className={classes.inputGrid} spacing={3}>
                  <Grid item xs={6}>
                    <TextField
                      className={classes.inputAmount1}
                      label="Bet Amount"
                      defaultValue="0"
                      variant="outlined"
                      type="number"
                      value={userBet.amount}
                      onChange={(evt) =>
                        setUserBet({
                          ...userBet,
                          amount: parseFloat(evt.target.value),
                        })
                      }
                    />
                  </Grid>
                  <Grid item xs={5}>
                    <FormControl variant="outlined" style={{ width: "100%" }}>
                      <Select
                        value={type}
                        onChange={(evt) => setType(evt.target.value)}
                      >
                        <MenuItem value={1}>USDT-Tron</MenuItem>
                        <MenuItem value={2}>ETH-Etherum</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
                <BetTable rows={table}></BetTable>
                <Button
                  className={classes.betButton}
                  variant="contained"
                  color="primary"
                  onClick={() => (approve == 2 ? bet() : onPlaceApprove())}
                >
                  {loading ? (
                    <CircularProgress size={24} style={{ color: "white" }} />
                  ) : approve == 1 ? (
                    "PLACE APPROVE"
                  ) : (
                    "PLACE BET"
                  )}
                </Button>
                <BetSuccessDialog
                  open={dialogOpen}
                  onClose={(evt) => setDialogOpen(false)}
                />

                <Typography style={{ marginBottom: "24px" }}></Typography>
              </Grid> */}
              {/* 以下是创建match才会显示 */}
              <Grid>
                <Title>CREATE MATCH</Title>
                <GameInfo betInfo={betInfo}></GameInfo>
                <Grid container spacing={1} className={classes.betAmountGrid}>
                  <Grid item xs={4} className={classes.betAmountWrap}>
                    <FormControlLabel
                      className={classes.betAmountLabel}
                      label={betInfo.left}
                      labelPlacement="top"
                      control={
                        <TextField
                          className={classes.betAmount}
                          value={userBet2.a}
                          onChange={(evt) =>
                            setUserBet2({
                              ...userBet2,
                              a: parseFloat(evt.target.value),
                            })
                          }
                          label="Bet Amount"
                          type="number"
                          defaultValue="0"
                          variant="outlined"
                        />
                      }
                    />
                  </Grid>
                  <Grid item xs={4} className={classes.betAmountWrap}>
                    <FormControlLabel
                      className={classes.betAmountLabel}
                      label="Draw"
                      labelPlacement="top"
                      control={
                        <TextField
                          className={classes.betAmount}
                          value={userBet2.draw}
                          onChange={(evt) =>
                            setUserBet2({
                              ...userBet2,
                              draw: parseFloat(evt.target.value),
                            })
                          }
                          label="Bet Amount"
                          type="number"
                          defaultValue="0"
                          variant="outlined"
                        />
                      }
                    />
                  </Grid>
                  <Grid item xs={4} className={classes.betAmountWrap}>
                    <FormControlLabel
                      className={classes.betAmountLabel}
                      label={betInfo.right}
                      labelPlacement="top"
                      control={
                        <TextField
                          className={classes.betAmount}
                          value={userBet2.b}
                          onChange={(evt) =>
                            setUserBet2({
                              ...userBet2,
                              b: parseFloat(evt.target.value),
                            })
                          }
                          label="Bet Amount"
                          type="number"
                          defaultValue="0"
                          variant="outlined"
                        />
                      }
                    />
                  </Grid>
                </Grid>
                <Grid container className={classes.inputGrid} spacing={1}>
                  <Grid item xs={5}>
                    <FormControl
                      variant="outlined"
                      className={classes.inputSelectType}
                    >
                      <Select
                        value={type}
                        onChange={(evt) => setType(evt.target.value)}
                      >
                        <MenuItem value={1}>USDT-Tron</MenuItem>
                        <MenuItem value={2}>ETH-Etherum</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
                <BetTable rows={table2}></BetTable>
                <Button
                  className={classes.betButton}
                  style={{
                    backgroundColor: "#e94560", //#357a38
                    color: "#ffffff",
                  }}
                  variant="contained"
                  color="primary"
                  onClick={approve == 2 ? createMatch : onApprove}
                >
                  {" "}
                  {loading ? (
                    <CircularProgress style={{ color: "white" }} size={24} />
                  ) : approve == 1 ? (
                    "MATCH APPROVE"
                  ) : (
                    "CREATE MATCH"
                  )}
                </Button>
              </Grid>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6} lg={6}>
            <Paper className={fixedHeightPaper} style={{ height: "100%" }}>
              <BetHisTable
                rows={assets}
                select={hisSelect}
                onChange={(value) => setHisSelect(value)}
              ></BetHisTable>
              <Button
                className={classes.betHisButton}
                disabled={hisSelect < 0}
                onClick={() => withdrawPayout()}
                variant="contained"
                color="primary"
              >
                {hisSelect < 0 ? "WITHDRAW PAYOUT (NULL)" : "WITHDRAW"}
              </Button>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </>
  );
};
export default CreateBet;

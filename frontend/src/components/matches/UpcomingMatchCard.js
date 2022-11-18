import React, { useState } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { makeStyles } from '@material-ui/core/styles';
import Grid from "@material-ui/core/Grid";
import Avt from "../layout/AvatarImg";
import { Button, Paper, Typography } from "@material-ui/core";
import MatchModal from "./MatchModal";
import MatchInfo from "./MatchInfoModal";
import CalendarTodayIcon from "@material-ui/icons/CalendarToday";
import ScheduleIcon from "@material-ui/icons/Schedule";
const useStyles = makeStyles({

  title: {
    fontSize: 8,
  },

});
export const UpcomingMatchCard = ({ match, contract, account, token }) => {
  console.log('UpcomingMatchCard match', match)
  const classes = useStyles();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createInfoModalOpen, setCreateInfoModalOpen] = useState(false);

  const getDetails = (teamIndex) => {
    let team = null;

    if (teamIndex === 0) {
      team = match.homeTeam;
    }
    if (teamIndex === 1) {
      team = match.awayTeam;
    }
    if (teamIndex === 2) {
      team = {
        team_name: 'Draw'
      };
    }

    return (
      <div>
        {team.logo ? (
          <Avt link={team.logo} letter={null} index={teamIndex} />
        ) : (
          <Avt link={null} letter='VS' index={teamIndex} />
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
      </div>
    );
  };

  const getDateString = (type, time) => {
    if (type == 'Start') {
      let date = new Date(time)
      let date1 = date.toDateString().split(" ")
      return `${date1[2]} ${date1[1]} ${date1[3]} ${date.getHours() > 9 ? date.getHours() : '0' + date.getHours()}:${date.getMinutes() > 9 ? date.getMinutes() : '0' + date.getMinutes()}`;
      // return ` ${date.getDate() > 9 ? date.getDate() : '0' + date.getDate()}-${date.getMonth() + 1 > 9 ? date.getMonth() + 1 : '0' + date.getMonth() + 1}-${date.getFullYear()} ${date.getHours() > 9 ? date.getHours() : '0' + date.getHours()}:${date.getMinutes() > 9 ? date.getMinutes() : '0' + date.getMinutes()}`
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

    // const date = new Date(ds * 1000);
    // return (
    //   <div
    //     style={{
    //       display: "flex",
    //       justifyContent: "center",
    //       alignItems: "center",
    //     }}
    //   >
    //     <span
    //       style={{ fontSize: "15px", marginRight: "3px" }}
    //       className="material-icons"
    //     >
    //       <CalendarTodayIcon />
    //     </span>
    //     <span>
    //       {`${ date.getMonth() + 1 } -${ date.getDate() } -${ date.getFullYear() } `}
    //     </span>
    //     <span
    //       style={{ fontSize: "15px", marginRight: "3px", marginLeft: "15px" }}
    //       className="material-icons"
    //     >
    //       <ScheduleIcon />
    //     </span>
    //     <span>{date.toLocaleTimeString()}</span>
    //     {/* <span>{`${ date.getHours() }:${ date.getMinutes() } `} UTC</span> */}
    //   </div>
    // );
  };

  return (
    <div>
      {/* <img src={match.league.image_url} alt='' style={{width:'60px',borderRadius:"50%"}}/> */}
      <Grid
        style={{ marginBottom: "20px" }}
        container
        spacing={3}
        alignItems="center"
        justifyContent="center"
      >
        <Grid item xs={5}>
          {getDetails(0)}
        </Grid>
        <Grid item xs={2}>

          {getDetails(2)}

        </Grid>
        <Grid item xs={5}>
          {getDetails(1)}
        </Grid>
        {/* <Grid item xs={12}>
          <Paper
            style={{
              height: "100%",
              width: "100%",
              backgroundColor: "#505050",
              color: "#ffffff",
              padding: "8px",
            }}
            elevation={0}
          >
            {match.firstHalfStart ? getDateString(match.firstHalfStart) : getDateString(match.event_timestamp)}
          </Paper>
        </Grid> */}
        <Grid container item xs={12} spacing={4}>
          {/* <Grid item xs={12} md={6}>
            <Button
              style={{
                backgroundColor: "#408cff",
                color: "#ffffff",
                fontWeight: "bold",
              }}
              onClick={() => setCreateInfoModalOpen(true)}
              variant="contained"
              fullWidth
            >
              DETAILS
            </Button>
          </Grid> */}
          <Grid item xs={12} md={6}>
            <Link to={`/matches/create/${btoa(match.fixture_id)}`}>
              <Button
                style={{
                  backgroundColor: "#e94560",//#357a38
                  color: "#ffffff",
                  fontWeight: "bold",
                }}
                variant="contained"
                fullWidth
              >
                CREATE MATCH
              </Button>
            </Link>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography className={classes.title}>
              Start on {getDateString('Start', parseInt(match.event_timestamp) * 1000)}
            </Typography>
            <Typography className={classes.title}>
              Expire in {getDateString('End', parseInt(match.event_timestamp + 2700) * 1000)}
            </Typography>
          </Grid>
        </Grid>
      </Grid>
      <MatchModal
        open={createModalOpen}
        setCreateModalOpen={setCreateModalOpen}
        match={match}
        contract={contract}
        account={account}
        token={token}
      />
      <MatchInfo
        open={createInfoModalOpen}
        setCreateModalOpen={setCreateInfoModalOpen}
        match={match}
        contract={contract}
        account={account}
      />
    </div >
  );
};

UpcomingMatchCard.propTypes = {
  match: PropTypes.object.isRequired,
};

export default UpcomingMatchCard;

import React, { Component } from "react";
import SmartBetContract from "./contracts/MetaBet.json";
import TokenContract from "./contracts/IERC20.json";
// import PriceConsumerV3 from "./contracts/PriceConsumerV3.json";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Redirect,
} from "react-router-dom";
import Navbar from "./components/layout/Navbar";
import Upcoming from "./components/matches/Upcoming";
import MatchesShow from "./components/matches/MatchesShow";
import BetsInfo from "./components/matches/BetsInfo";
import MatchesShowAdmin from "./components/matches/MatchesShowAdmin";
import Matches from "./components/matches/Matches";
import LandingPage from "./pages/LandingPage";
// import store from "./store";
import history from "./history";
import ContainerMain from "./components/layout/ContainerMain";
import Warning from "./components/NetworkWarning";
import Preloader from "./components/layout/Preloader";
import "./App.css";
import getWeb3 from "./getWeb3";

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      web3: null,
      accounts: null,
      contract: null,
      isAdmin: true,
    };
  }

  componentDidMount = async () => {
    try {
      // Get network provider and web3 instance.
      const web3 = await getWeb3();
      // Use web3 to get the user's accounts.
      const accounts = await web3.eth.getAccounts();
      // Get the contract instance.
      const networkId = await web3.eth.net.getId();
      console.log(
        "Get network provider and web3 instance:",
        web3,
        accounts,
        networkId
      );
      // 世界杯赛程主合约
      // BSC Testnet
      // const smartBetAddress = "0xEC7dE4a87F6F75f61fb51ED2355b1E4540842d80"; // address of deployed contract
      // Polygon Matic Testnet
      const smartBetAddress = "0x14A66D52c2D969328387432725E4D1b2E72cB23B"; // address of deployed contract

      // PriceConsumerV3
      //const priceContractAddress = "0x56cc062A9d24f056e1C0Ba11462c173FDA11659A"; // address of deployed contract
      const priceContractAddress = "0x444838C1f0a0e86114DE6d481c5dde98c4ba75FD";
      // 设置初始化块高度
      const fromBolckNumber = 29042683;
      // Get local deployment
      // const deployedNetwork = SmartBetContract.networks[networkId];
      // const instance = new web3.eth.Contract(
      //   SmartBetContract.abi,
      //   deployedNetwork && deployedNetwork.address,
      // );

      // Get deployed contract instance.
      const instance = new web3.eth.Contract(
        SmartBetContract.abi,
        smartBetAddress
      );
      console.log("SmartBetContract:", instance);
      // Get deployed contract instance.
      const priceFeedInstance = new web3.eth.Contract(
        TokenContract.abi,
        priceContractAddress
      );
      console.log("PriceConsumerV3:", priceFeedInstance);
      // Set web3, accounts, and contract to the state, and then proceed with an
      // example of interacting with the contract's methods.
      // 获取世界杯信息
      let _leagueId = 1;
      instance.methods
        .getLeague(_leagueId)
        .call({ from: accounts[0] })
        .then((league) => {
          if (league) {
            console.log("league", league);
            this.setState({ league: league });
          }
        })
        .catch((error) => {
          console.log("getLeague error", error);
        });
      this.setState({
        web3,
        accounts,
        contract: instance,
        leagueId: _leagueId,
        priceContract: priceFeedInstance,
        fromBolckNumber: fromBolckNumber,
      });
    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`
      );
      console.error(error);
    }
  };

  // runExample = async () => {
  //   const { accounts, contract } = this.state;

  //   // Stores a given value, 5 by default.
  //   await contract.methods.set(5).send({ from: accounts[0] });

  //   // Get the value from the contract to prove it worked.
  //   const response = await contract.methods.get().call();

  //   // Update state with the result.
  //   this.setState({ storageValue: response });
  // };

  resolveAdmin = () => { };

  render () {
    if (!this.state.web3) {
      return <Preloader />;
    }
    return (
      <div className="App">
        <Router forceRefresh history={history}>
          <Navbar account={this.state.accounts[0]} />
          <Route exact path="/" component={LandingPage} />
          <ContainerMain>
            <Switch>
              <Route
                exact
                path="/matches"
                render={(props) => {
                  return <Matches {...props} baseAppState={this.state} />;
                }}
              />
              <Route
                exact
                path="/matches/:id"
                render={(props) => {
                  return <MatchesShow {...props} baseAppState={this.state} />;
                }}
              />
              <Route
                exact
                path="/matches/bet/:id"
                render={(props) => {
                  return <BetsInfo {...props} baseAppState={this.state} />;
                }}
              />
              <Route
                exact
                path="/matches/create/:id"
                render={(props) => {
                  return <BetsInfo {...props} baseAppState={this.state} />;
                }}
              />
              <Route
                exact
                path="/warning"
                render={(props) => {
                  return <Warning {...props} baseAppState={this.state} />;
                }}
              />

              {/* only admin */}
              <Route
                exact
                path="/upcoming"
                render={(props) => {
                  return this.state.isAdmin ? (
                    <Upcoming {...props} baseAppState={this.state} />
                  ) : (
                    <Redirect to="/matches" />
                  );
                }}
              />
              <Route
                exact
                path="/matches/:id/admin"
                render={(props) => {
                  return this.state.isAdmin ? (
                    <MatchesShowAdmin {...props} baseAppState={this.state} />
                  ) : (
                    <Redirect to="/matches" />
                  );
                }}
              />

              {/* <Route exact path="/*" component={Matches} /> */}
            </Switch>
          </ContainerMain>
        </Router>
      </div>
    );
  }
}

export default App;

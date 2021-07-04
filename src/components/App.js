// 13:40 seconds;

import React, { Component } from "react";
import Web3 from "web3";

import "./App.css";
import NavBar from "./NavBar";
import Main from "./Main";
import EthSwap from "../abis/EthSwap.json";
import Token from "../abis/Token.json";

class App extends Component {
  async componentWillMount() {
    await this.loadWeb3();
    await this.loadBlockChainData();
  }

  async loadBlockChainData() {
    const web3 = window.web3;

    const accounts = await web3.eth.getAccounts();
    this.setState({ account: accounts[0] });

    const ethBalance = await web3.eth.getBalance(this.state.account);
    this.setState({ ethBalance });

    // Load token
    const networkId = await web3.eth.net.getId();
    const tokenData = Token.networks[networkId];
    if (tokenData) {
      const token = new web3.eth.Contract(Token.abi, tokenData.address);
      this.setState({ token });
      let tokenBalance = await token.methods
        .balanceOf(this.state.account)
        .call();
      this.setState({ tokenBalance: tokenBalance.toString() });
    } else {
      alert("Failed to connect to the network, fix this up!");
    }

    // Load ethSwap
    const ethSwapData = EthSwap.networks[networkId];
    if (ethSwapData) {
      const ethSwap = new web3.eth.Contract(EthSwap.abi, ethSwapData.address);
      this.setState({ ethSwap });
    } else {
      alert("Failed to connect to the network, fix this up!");
    }

    this.setState({ loading: false });
  }

  async loadWeb3() {
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum);
      await window.ethereum.enable();
    } else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider);
    } else {
      window.alert(
        "Non-Ethereum browser detected. You should consider trying MetaMask!"
      );
    }
  }

  buyTokens = (etherAmount) => {
    this.setState({ loading: true });
    this.state.ethSwap.methods
      .buyTokens()
      .send({ from: this.state.account, value: etherAmount })
      .on("transactionHash", async (hash) => {
        this.setState({ loading: false });
        console.log("Transfering...");
      })
      .on("confirmation", async (n, receipt) => {
        console.log("WHAT IS THAT: ", n);
        console.log("receipt: ", receipt);
        console.log("Transaction confirmed");
        await this.loadBlockChainData();
      })
      .on("error", console.error);
  };

  sellTokens = (tokenAmount) => {
    this.setState({ loading: true });
    this.state.token.methods
      .approve(this.state.ethSwap.address, tokenAmount)
      .send({ from: this.state.account })
      .on("transactionHash", async (hash) => {
        this.state.ethSwap.methods
          .sellTokens(tokenAmount)
          .send({ from: this.state.account })
          .on("transactionHash", async (hash) => {
            console.log("selling tokens");
          })
          .on("confirmation", async (n, receipt) => {
            console.log("Tokens sold");
            await this.loadBlockChainData();
          })
          .on("error", console.error);
      });
  };

  constructor(props) {
    super(props);
    this.state = {
      account: "",
      token: {},
      ethSwap: {},
      ethBalance: "0",
      tokenBalance: "0",
      loading: true,
    };
  }

  render() {
    let content;

    if (this.state.loading) {
      content = (
        <p id="loader" className="text-center">
          Loading...
        </p>
      );
    } else {
      content = (
        <Main
          ethBalance={this.state.ethBalance}
          tokenBalance={this.state.tokenBalance}
          buyTokens={this.buyTokens}
          sellTokens={this.sellTokens}
        />
      );
    }
    return (
      <div>
        <NavBar account={this.state.account} />
        <div className="container-fluid mt-5">
          <div className="row">
            <main
              role="main"
              className="col-lg-12 mr-auto ml-auto text-center"
              style={{ maxWidth: "600px" }}
            >
              <div className="content mr-auto ml-auto">{content}</div>
            </main>
          </div>
        </div>
      </div>
    );
  }
}

export default App;

import React from "react"
import Artist from "./Artist"
import CommercialEntity from "./CommercialEntity"
import RecordLabel from "./RecordLabel"
import Personal from "./Personal"
import { COLORS } from "./Colors"
import Logo from "../Assets/logo.png"
import contractMeta from "../Build/MusicMarketplace.json"

import Web3 from 'web3'
import contract from 'truffle-contract'
import { create } from 'ipfs-http-client';
import axios from 'axios';
import Loader from "react-loader-spinner"
import SwitchSelector from "react-switch-selector"
class Login extends React.Component {

  constructor(props) {
    super(props)
    this.web3 = new Web3(Web3.givenProvider || "http://localhost:7545")
    this.contract = contract(contractMeta)
    this.contract.setProvider(this.web3.currentProvider)
    this.state = { account: "", ipfs: "", username: "", type: "", choice: "1", }
  }

  componentDidMount() {
    this.loadBlockchain().then(() => console.log("Loaded Blockchain"))
    this.loadIPFS().then(() => console.log("Loaded IPFS"))
    this.loginUser().then(() => console.log("Login Successful"))
  }

  async loadBlockchain() {
    const accounts = await this.web3.eth.getAccounts()
    this.setState({ account: accounts[0] })
  }

  async loadIPFS() {
    try {
      // Retrieve Pinata JWT token from a secure source (environment variable, etc.)
      const JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiJlMjg5NDM1Mi0wMGQ3LTRlMWMtYTAxYy1kNjMyOGQwOWU1MzMiLCJlbWFpbCI6Imt5bGVrY3Jhc3RvQHN0dWRlbnQuc2ZpdC5hYy5pbiIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJwaW5fcG9saWN5Ijp7InJlZ2lvbnMiOlt7ImlkIjoiRlJBMSIsImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxfSx7ImlkIjoiTllDMSIsImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxfV0sInZlcnNpb24iOjF9LCJtZmFfZW5hYmxlZCI6ZmFsc2UsInN0YXR1cyI6IkFDVElWRSJ9LCJhdXRoZW50aWNhdGlvblR5cGUiOiJzY29wZWRLZXkiLCJzY29wZWRLZXlLZXkiOiJiZjM0MDJiNmY5NmM4MDQ5MDFiNiIsInNjb3BlZEtleVNlY3JldCI6ImQ0ODM5MTE4NjRkZGNmMzU3N2NmNmNmZTEyNmEyYjZjODcxNGVmY2UwNjgzNDViNmMwYzMzYTc2NDFhY2RlYWQiLCJpYXQiOjE3MDg5MzY3OTd9.oqfWb_f78GtF7VXqrrmNfbYP8UFzx6oVGvutjFLRh_g';

      // Fetch Pinata IPFS gateway URL
      const response = await axios.get('https://api.pinata.cloud/data/pinList', {
        headers: {
          'Authorization': `Bearer ${JWT}`
        }
      });

      const ipfsGatewayUrl = response.data.rows[0].ipfs_pin_hash;

      // Create IPFS client using Pinata gateway
      const conn = create({ host: ipfsGatewayUrl, port: '5001', protocol: 'https' });

      this.setState({ ipfs: conn });
    } catch (error) {
      console.error('Error loading IPFS:', error);
    }
  }

  loginUser = async () => {
    let val = "0"
    const contractInstance = await this.contract.deployed()
    await contractInstance.checkUserType({from:this.state.account}).then((x)=>{ val = x.toString()})
    this.setState({type: val})
}
// Unknown,
// Personal,
// Publisher,
// Artist,
// Commercial
  registerUser = async () => {
    const contractInstance = await this.contract.deployed();
    switch (this.state.choice) {
       case "1": // Personal
         await contractInstance.addPersonal(this.state.username, { from: this.state.account }).then(() => this.loginUser());
         break;
       case "2": // Publisher
         await contractInstance.addPublisher(this.state.username, { from: this.state.account }).then(() => this.loginUser());
         break;
       case "3": // Artist
         await contractInstance.addArtist(this.state.username, { from: this.state.account }).then(() => this.loginUser());
         break;
       case "4": // Commercial
         await contractInstance.addCommercial(this.state.username, { from: this.state.account }).then(() => this.loginUser());
         break;
       default:
         console.error("Invalid choice for user type");
    }
   }

  render() {
// Unknown,
// Personal,
// Publisher,
// Artist,
// Commercial
    if (this.state.type === "0") {
      return (
        <div style={styles.main}>
          <img style={styles.img} alt="logo" src={Logo} />
          <div style={styles.switch}>
            <SwitchSelector
              onChange={(val) => { this.setState({ choice: val }) }}
              options={[
                { label: "Personal", value: "1", selectedBackgroundColor: "#26ae5f", },
                { label: "Record Label", value: "2", selectedBackgroundColor: "#26ae5f" },
                { label: "Artist", value: "3", selectedBackgroundColor: "#26ae5f" },
                { label: "Commercial", value: "4", selectedBackgroundColor: "#26ae5f" },
              ]}
              wrapperBorderRadius={50}
              optionBorderRadius={50}
              fontSize={"20"}
              fontColor={COLORS.white}
              backgroundColor={COLORS.black} />
          </div>
          <div style={styles.username}>
            <input type="text" placeholder="Username" style={styles.textInput}
              value={this.state.username} required
              onChange={(x) => { this.setState({ username: x.target.value }) }} />
          </div>
          <button style={styles.button} onClick={this.registerUser}> Register </button>
        </div>
      );
    }

    else if (this.state.type === "1") {
      return (
        <Personal
          account = {this.state.account}
          contract = {this.contract}
          ipfs = {this.state.ipfs}
        />
        // <h1>Personal</h1>
      )
    }

    else if (this.state.type === "2") {
      return (
        <RecordLabel
          account={this.state.account}
          contract={this.contract}
          ipfs={this.state.ipfs}
        />
        // <h1>Publisher</h1>
      )
    }
    else if (this.state.type === "3") {
      return (
        // <Audience
        //   account = {this.state.account}
        //   contract = {this.contract}
        //   ipfs = {this.state.ipfs}
        // />
        <Artist
          account={this.state.account}
          contract={this.contract}
          ipfs={this.state.ipfs}
        />
        // <h1>Artist</h1>
      )
    }
    else if (this.state.type === "4") {
      return (
        <CommercialEntity
          account = {this.state.account}
          contract = {this.contract}
          ipfs = {this.state.ipfs}
        />
        // <h1>Commercial</h1>
      )
    }

    else {
      return (
        <div style={styles.main}>
          <h1>Please connect your wallet to the site</h1>
          <Loader type="Bars" color={COLORS.black} />
        </div>
      )
    }
  }
}

const styles = {
  main: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-around",
    alignItems: "center",
    background: COLORS.white
  },
  button: {
    height: "7.5%",
    width: "15%",
    fontSize: "1.2rem",
    fontWeight: "500",
    cursor: "pointer",
    borderRadius: "50px",
    boxShadow: "2px 5px 2px #999",
    color: COLORS.white,
    background: COLORS.black,
  },
  img: {
    width: "32.5%",
    borderRadius: "100px",
    boxShadow: "2px 5px 2px #999",
  },
  switch: {
    height: "7.5%",
    width: "50%",
    fontSize: "1.2rem",
    fontWeight: "500",
  },
  form: {
    marginBottom: "5%",
    marginTop: "5%",
    padding: "5%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    borderRadius: "10px",
    border: "2px solid",
    overflow: "auto",
    gap: "20px",
    borderColor: COLORS.black,
    backgroundColor: COLORS.brown,
  },
  username: {
    height: "6%",
    width: "15%",
    fontSize: "1.2rem",
  },
  textInput: {
    height: "100%",
    width:"100%",
    borderRadius: "15px",
    padding: "3%",
    textAlign: "center",
  },
}

export default Login;
import React from "react";
import { COLORS } from "./Colors";
import { Button, Collapse } from 'react-bootstrap'; // Import Bootstrap components
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCoins,
  faCompactDisc,
  faPlay,
  faPause,
  faTag,
  faShoppingCart,
  faFileContract,
  faUser,
  faBuilding
} from "@fortawesome/free-solid-svg-icons";

const Web3 = require('web3');

// Replace with your Ethereum node URL
const nodeUrl = 'HTTP://127.0.0.1:7545';

const web3 = new Web3(nodeUrl);

web3.eth.getBlockNumber()
  .then(console.log)
  .catch(console.error);

class SongCard extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      playing: false,
      audio: "",
      hash: "",
      currentTime: 0,
      duration: 0,
      showDetails: false,
    };
  }

  componentDidMount() {
    this.loadSong();
  }



  buySong = async () => {
    console.log(`Buying song with ID: ${this.props.songID}, from account: ${this.props.account}, with cost: ${this.props.cost}`);
    console.log("Contract Instance: ", this.props.contract)
    try {
      const contractInstance = await this.props.contract.deployed();
      await contractInstance.buySong(this.props.songID, { from: this.props.account, value: this.props.cost });
      console.log("Song purchased successfully.");
      // Refresh the page after a successful purchase
      window.location.reload();
    } catch (error) {
      console.log("Error purchasing song:", error);
    }
  }

  loadSong = async () => {
    let audio_src = "https://ipfs.infura.io/ipfs/" + this.props.hash;
    let audio = new Audio(audio_src);
    audio.addEventListener("timeupdate", this.updateTime);
    audio.addEventListener("loadedmetadata", () => {
      this.setState({ duration: audio.duration });
    });
    this.setState({ audio });
  };

  updateTime = () => {
    this.setState({ currentTime: this.state.audio.currentTime });
  };

  playSong = async () => {
    if (this.state.audio) {
      this.setState({ playing: true });
      this.state.audio.play();
    }
  };

  pauseSong = async () => {
    if (this.state.audio) {
      this.setState({ playing: false });
      this.state.audio.pause();
    }
  };
  formatArtists_showDetails = (artists) => {
    if (artists.length === 1) {
      return artists[0];
    } else if (artists.length === 2) {
      return `${artists[0]} & ${artists[1]}`;
    } else {
      // For more than two artists, list them all separated by commas, and then list the last two separated by "&"
      const lastTwo = artists.slice(-2);
      const rest = artists.slice(0, -2);
      return `${rest.join(', ')} & ${lastTwo.join(' & ')}`;
    }
  }
  formatArtists = (artists) => {
    if (artists.length === 1) {
      return `${artists[0]}`;
    } else if (artists.length === 2) {
      return `${artists[0]} & ${artists[1]}`;
    } else {
      // For more than two artists, list them all separated by commas
      return `${artists[0]} & ${artists[1]} ...`;
    }
  }

  handleSliderChange = (e) => {
    this.state.audio.currentTime = e.target.value;
    this.setState({ currentTime: e.target.value });
  };

  toggleDetails = () => {
    this.setState({ showDetails: !this.state.showDetails });
  };

  render() {
    if (this.props.type === "artist") {
      const cardStyle = {
        padding: "2%",
        borderRadius: "10px",
        border: "2px solid",
        boxShadow: "1px 3px 1px #191919",
        borderColor: COLORS.black,
        backgroundColor: COLORS.white,
        marginBottom: "10px", // Add some space between cards
        display: "flex",
        flexDirection: this.state.showDetails ? "column" : "row",
        justifyContent: "space-between",
        alignItems: "center",
        height: this.state.showDetails ? "auto" : "20%",
      };
      return (
        <div style={cardStyle}>
          {!this.state.showDetails && (
            <>
              <h5>
                <FontAwesomeIcon icon={faCompactDisc} /> {this.props.name}
              </h5>
              <h5>
                <FontAwesomeIcon icon={faTag} /> {this.props.genre}
              </h5>
              <h5>
                <FontAwesomeIcon icon={faBuilding} /> {this.props.publisherName}
              </h5>
              <h5>
                <FontAwesomeIcon icon={faCoins} />P {this.props.cost_personal / 1000000000000000}
              </h5>
              <h5>
                <FontAwesomeIcon icon={faCoins} />C {this.props.cost_commercial / 1000000000000000}
              </h5>
              <h5>
                <FontAwesomeIcon icon={faFileContract} /> {this.props.totalTimesPurchasedSong}
              </h5>
              <h5>
                {/* <FontAwesomeIcon icon={faFileContract} /> {this.props.times_commercial_purchased} */}
              </h5>
            </>
          )}
          <Button onClick={this.toggleDetails}>
            {this.state.showDetails ? "Hide Details" : "Show Details"}
          </Button>
          <Collapse in={this.state.showDetails}>

            <div className="row">
              <div className="row">
                <div className="col">
                  <h5><FontAwesomeIcon icon={faCompactDisc} /> Song Name: {this.props.name}</h5>
                </div>
              </div>
              <div className="row">
                <div className="col">
                  <h5><FontAwesomeIcon icon={faBuilding} /> Artist Name: {this.props.publisherName}</h5>
                </div>
              </div>
              <div className="row">
                <div className="col">
                  <h5><FontAwesomeIcon icon={faTag} /> Genre: {this.props.genre}</h5>
                </div>
              </div>
              <div className="row">
              <h5><FontAwesomeIcon icon={faCoins} /> Total Earned: {this.props.artistEarningsPerSong_Total/ 1000000000000000} mETH</h5>
              </div>
              <div className="row" style={{ justifyContent: 'space-around' }}>
                <div className="col">
                  <h5><FontAwesomeIcon icon={faCoins} /> Personal Cost: {this.props.cost_personal / 1000000000000000} mETH</h5>
                </div>
                <div className="col">

                  <h5><FontAwesomeIcon icon={faCoins} /> Commercial Cost: {this.props.cost_commercial / 1000000000000000} mETH</h5>
                </div>
              </div>
              <div className="row" style={{ justifyContent: 'space-around' }}>
                <div className="col">
                  <h5>
                    <FontAwesomeIcon icon={faFileContract} /> Personal Licenses: {this.props.times_personal_purchased}
                  </h5>
                </div>
                <div className="col">
                  <h5>
                    <FontAwesomeIcon icon={faFileContract} /> Commercial Licenses: {this.props.times_commercial_purchased}
                  </h5>
                </div>

              </div>
            </div>
          </Collapse >
        </div >
      );
    }
    else if (this.props.type === "publisher") {
      const cardStyle = {
        padding: "2%",
        borderRadius: "10px",
        border: "2px solid",
        boxShadow: "1px 3px 1px #191919",
        borderColor: COLORS.black,
        backgroundColor: COLORS.white,
        marginBottom: "10px", // Add some space between cards
        display: "flex",
        flexDirection: this.state.showDetails ? "column" : "row",
        justifyContent: "space-between",
        alignItems: "center",
        height: this.state.showDetails ? "auto" : "20%",
      };

      return (
        <div style={cardStyle}>
          {!this.state.showDetails && (
            <>
              <h5>
                <FontAwesomeIcon icon={faCompactDisc} /> {this.props.name}
              </h5>
              <h5>
                <FontAwesomeIcon icon={faTag} /> {this.props.genre}
              </h5>
              <h5>
                <FontAwesomeIcon icon={faUser} /> {this.formatArtists(this.props.artist_names)}
              </h5>
              <h5>
                <FontAwesomeIcon icon={faCoins} />P {this.props.cost_personal / 1000000000000000}
              </h5>
              <h5>
                <FontAwesomeIcon icon={faCoins} />C {this.props.cost_commercial / 1000000000000000}
              </h5>
              <h5>
                <FontAwesomeIcon icon={faFileContract} /> {this.props.totalTimesPurchasedSong}
              </h5>
              <h5>
                {/* <FontAwesomeIcon icon={faFileContract} /> {this.props.times_commercial_purchased} */}
              </h5>
            </>
          )}
          <Button onClick={this.toggleDetails}>
            {this.state.showDetails ? "Hide Details" : "Show Details"}
          </Button>
          <Collapse in={this.state.showDetails}>
            <div className="row">
              <div className="row">
                <div className="col">
                  <h5><FontAwesomeIcon icon={faCompactDisc} /> Song Name: {this.props.name}</h5>
                </div>
              </div>
              <div className="row">
                <div className="col">
                  <h5><FontAwesomeIcon icon={faUser} /> Artist Name: {this.formatArtists_showDetails(this.props.artist_names)}</h5>
                </div>
              </div>
              <div className="row">
                <div className="col">
                  <h5><FontAwesomeIcon icon={faTag} /> Genre: {this.props.genre}</h5>
                </div>
              </div>
              <div className="row">
              <h5><FontAwesomeIcon icon={faCoins} /> Total Earned: {this.props.publisherEarningsPerSong_Total / 1000000000000000} mETH</h5>
              </div>
              <div className="row">
                <div className="col">
                  <h5><FontAwesomeIcon icon={faCoins} /> Personal Cost: {this.props.cost_personal / 1000000000000000}</h5>
                  </div>
                  <div className="col">
                  <h5><FontAwesomeIcon icon={faCoins} /> Commercial Cost: {this.props.cost_commercial / 1000000000000000}</h5>
                </div>
              </div>
              <div className="row">
                <div className="col">
                  <h5><FontAwesomeIcon icon={faFileContract} /> Personal Licenses: {this.props.times_personal_purchased}</h5>
                  </div>
                  <div className="col">
                  <h5><FontAwesomeIcon icon={faFileContract} /> Commercial Licenses: {this.props.times_commercial_purchased}</h5>
                </div>
              </div>
            </div>
          </Collapse>
        </div>
      );
    }
    else if (this.props.type === "audience")
      return (
        <div style={!this.state.playing ? styles.card : styles.cardHiglight}>
          
          <h5>
            {" "}
            <FontAwesomeIcon icon={faCompactDisc} spin={this.state.playing} />{" "}
            {this.props.name}{" "}
          </h5>
          <h5>
            {" "}
            <FontAwesomeIcon icon={faTag} /> {this.props.genre}{" "}
          </h5>
          <h5>
            <FontAwesomeIcon icon={faUser} /> {this.formatArtists(this.props.artist_names)}
          </h5>
          <h5>
            <FontAwesomeIcon icon={faBuilding} /> {this.props.publisherName}
          </h5>

          <input
            type="range"
            min={0}
            max={this.state.duration}
            value={this.state.currentTime}
            onChange={this.handleSliderChange}
          />
          {this.state.playing ? (
            <h5>
              {" "}
              <FontAwesomeIcon onClick={this.pauseSong} icon={faPause} />{" "}
            </h5>
          ) : (
            <h5>
              {" "}
              <FontAwesomeIcon onClick={this.playSong} icon={faPlay} />{" "}
            </h5>
          )}
        </div>
      );
    else if (this.props.type === "shop")
      return (
        <div style={styles.card}>
          <h5>
            {" "}
            <FontAwesomeIcon icon={faCompactDisc} /> {this.props.name}{" "}
          </h5>
          <h5>
            {" "}
            <FontAwesomeIcon icon={faTag} /> {this.props.genre}{" "}
          </h5>
          <h5>
            <FontAwesomeIcon icon={faUser} /> {this.formatArtists(this.props.artist_names)}
          </h5>
          <h5>
            <FontAwesomeIcon icon={faBuilding} /> {this.props.publisherName}
          </h5>
          <h5>
            {" "}
            <FontAwesomeIcon icon={faCoins} /> {this.props.cost / 1000000000000000}{" "}
          </h5>
          <h5>
            {" "}
            <FontAwesomeIcon onClick={this.buySong} icon={faShoppingCart} />{" "}
          </h5>
        </div>
      );
  }
}

const styles = {
  card: {
    height: "20%",
    width: "100%",
    padding: "2%",
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: "10px",
    border: "2px solid",
    boxShadow: "1px 3px 1px #191919",
    borderColor: COLORS.black,
    backgroundColor: COLORS.white,
  },
  cardHiglight: {
    height: "20%",
    width: "100%",
    padding: "2%",
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: "10px",
    border: "2px solid",
    boxShadow: "1px 3px 1px #191919",
    borderColor: COLORS.black,
    backgroundColor: COLORS.highlight,
  },
};

export default SongCard;
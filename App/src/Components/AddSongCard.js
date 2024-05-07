import React from "react";
import { COLORS } from "./Colors";
import Popup from 'reactjs-popup';
import Loader from "react-loader-spinner";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMusic, faFileUpload, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import Web3 from 'web3';
import axios from 'axios';

class AddSongCard extends React.Component {
    constructor(props) {
        super(props);
        this.web3 = new Web3(Web3.givenProvider || "http://localhost:7545");
        this.state = { name: "", genre: "", cost_personal: "", cost_commercial: "", artist_ids: [], royalty_percent: '', buffer: "", loading: false, fileUploaded: false };
    }

    captureFile = (event) => {
        event.preventDefault();
        const file = event.target.files[0];
        const file_reader = new FileReader();
        file_reader.readAsArrayBuffer(file);
        file_reader.onloadend = () => {
            this.setState({ buffer: Buffer.from(file_reader.result), fileUploaded: true });
        };
    }

    onSubmitClick = async (event) => {
        event.preventDefault();

        if (this.state.buffer) {
            this.setState({ loading: true });

            const formData = new FormData();
            formData.append('file', new Blob([this.state.buffer]));

            try {
                const JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiJlMjg5NDM1Mi0wMGQ3LTRlMWMtYTAxYy1kNjMyOGQwOWU1MzMiLCJlbWFpbCI6Imt5bGVrY3Jhc3RvQHN0dWRlbnQuc2ZpdC5hYy5pbiIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJwaW5fcG9saWN5Ijp7InJlZ2lvbnMiOlt7ImlkIjoiRlJBMSIsImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxfSx7ImlkIjoiTllDMSIsImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxfV0sInZlcnNpb24iOjF9LCJtZmFfZW5hYmxlZCI6ZmFsc2UsInN0YXR1cyI6IkFDVElWRSJ9LCJhdXRoZW50aWNhdGlvblR5cGUiOiJzY29wZWRLZXkiLCJzY29wZWRLZXlLZXkiOiJiZjM0MDJiNmY5NmM4MDQ5MDFiNiIsInNjb3BlZEtleVNlY3JldCI6ImQ0ODM5MTE4NjRkZGNmMzU3N2NmNmNmZTEyNmEyYjZjODcxNGVmY2UwNjgzNDViNmMwYzMzYTc2NDFhY2RlYWQiLCJpYXQiOjE3MDg5MzY3OTd9.oqfWb_f78GtF7VXqrrmNfbYP8UFzx6oVGvutjFLRh_g';

                const pinataResponse = await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS", formData, {
                    maxBodyLength: 'Infinity',
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        'Authorization': `Bearer ${JWT}`,
                    },
                });
                const songHash = pinataResponse.data.IpfsHash;

                // Interact with the smart contract
                const contractInstance = await this.props.contract.deployed();
                console.log("Artists of songs:", this.state.artist_ids)
                let artistIDArray = this.state.artist_ids.split(',').map(Number);
                await contractInstance.addSong(
                    this.state.name,
                    this.web3.utils.toWei(this.state.cost_personal, 'milliether'),
                    this.web3.utils.toWei(this.state.cost_commercial, 'milliether'),
                    artistIDArray,
                    parseInt(this.state.royalty_percent),
                    songHash,
                    this.state.genre,
                    { from: this.props.account });

                // Reset loading state and other form fields if needed...
                this.setState({ loading: false });
                this.props.closeForm();
                window.location.reload();
                console.log("song added")

            } catch (error) {
                console.error('Error pinning to IPFS:', error);
                this.setState({ loading: false });
            }
        }
    }

    render() {
        return (
            <Popup
                open={this.props.form}
                onClose={() => { this.props.closeForm() }}
                modal lockScroll repositionOnResize
                contentStyle={styles.contentStyle}
                overlayStyle={styles.overlayStyle}>
                {this.state.loading
                    ? <div style={styles.load}> <Loader type="Bars" color={COLORS.black} /></div>
                    : <form>
                        <h2 style={{ textAlign: "center" }}> <FontAwesomeIcon icon={faMusic} /> Add Song </h2>
                        <div style={styles.form} >
                            {/* name */}
                            <input type="text" style={styles.textInput}
                                placeholder="Song Name"
                                value={this.state.name} required
                                onChange={(x) => { this.setState({ name: x.target.value }) }} />
                            {/* genere */}
                            <input type="text" style={styles.textInput}
                                placeholder="Song Genre"
                                value={this.state.genre} required
                                onChange={(x) => { this.setState({ genre: x.target.value }) }} />
                            {/* cost Personal */}
                            <input type="number" style={styles.textInput}
                                placeholder="Personal Usage Price (mETh)"
                                value={this.state.cost_personal} required
                                onChange={(x) => { this.setState({ cost_personal: x.target.value }) }} />
                            {/* cost commercial */}
                            <input type="number" style={styles.textInput}
                                placeholder="Commercial License Price (mETh)"
                                value={this.state.cost_commercial} required
                                onChange={(x) => { this.setState({ cost_commercial: x.target.value }) }} />
                            {/* royalty percent */}
                            <input type="number" style={styles.textInput}
                                placeholder="Royalty Percent to Artists"
                                value={this.state.royalty_percent} required
                                onChange={(x) => { this.setState({ royalty_percent: x.target.value }) }} />
                            {/* artist ids */}
                            <input type="text" style={styles.textInput}
                                placeholder="Aritst ID (comma separated)"
                                value={this.state.artist_ids}
                                onChange={(x) => { this.setState({ artist_ids: x.target.value }) }} />

                            <label htmlFor="upload">
                                {this.state.fileUploaded ? (
                                    <FontAwesomeIcon icon={faCheckCircle} size="3x" />
                                ) : (
                                    <FontAwesomeIcon icon={faFileUpload} size="3x" />
                                )}
                            </label>
                            <input type="file" style={{ display: 'none' }} id="upload" required
                                onChange={this.captureFile}>
                            </input>
                        </div>
                        <input type="submit" onClick={this.onSubmitClick} style={styles.button} value="Publish" />
                    </form>
                }
            </Popup>
        );
    }
}

const styles = {
    load: {
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-around",
        alignItems: "center",
        background: COLORS.white
    },
    contentStyle: {
        height: "90%",
        width: "40%",
        padding: "1%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        borderRadius: "15px",
        border: "2px solid",
        overflow: "auto",
        borderColor: COLORS.black,
        backgroundColor: "#FFFFFF",
    },
    overlayStyle: {
        backgroundColor: COLORS.blurBlack
    },
    arrowStyle: {
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
        backgroundColor: COLORS.white,
    },
    textInput: {
        width: "100%",
        borderRadius: "15px",
        padding: "3%",
    },
    button: {
        width: "50%",
        marginLeft: "25%",
        padding: "3%",
        borderRadius: "15px",
        border: "0px",
        cursor: "pointer",
        background: COLORS.black,
        color: COLORS.white,
    },
}

export default AddSongCard;
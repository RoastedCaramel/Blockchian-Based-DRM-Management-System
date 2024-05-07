import React from "react"
import { COLORS } from "./Colors"
import SongCard from "./SongCard"
import AddSongCard from "./AddSongCard"
import Loader from "react-loader-spinner"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlusSquare, faBuilding } from '@fortawesome/free-solid-svg-icons'

class RecordLabel extends React.Component {

    constructor(props) {
        super(props);
        this.state = { name: "", artistID: "",totalEarningsETH:0, artistsIDSong: [], publisherID: "", totalEarnings: 0, purchased_times: 0, songIDs: [], songs: [], form: false, searchQuery: "" }
        this.openForm = this.openForm.bind(this);
        this.closeForm = this.closeForm.bind(this);
        this.handleSearchChange = this.handleSearchChange.bind(this);
    }

    componentDidMount() {
        this.loadPublisherDetails().then(() => {
            console.log("Loaded Publisher's Details", this.state)
            this.loadSongDetails().then(() => { console.log("Loaded Publisher's Songs") })
        })
    }

    async loadPublisherDetails() {
        try {
            const contractInstance = await this.props.contract.deployed();
            const userType = await contractInstance.checkUserType.call({ from: this.props.account });
            console.log("User Type", userType)
            const publisherDetails = await contractInstance.getPublisherDetails.call({ from: this.props.account });
            let songList = [];
            for (let i = 0; i < publisherDetails[3].length; i++) {
                songList.push(publisherDetails[3][i].toString());
            }
            this.setState({
                publisherID: publisherDetails[0].toString(),
                name: publisherDetails[2].toString(),
                songIDs: songList
            });
        } catch (error) {
            console.error("Failed to load publisher details:", error);
        }
    }

    async getArtistName(artistID) {
        try {
            const contractInstance = await this.props.contract.deployed();
            // console.log('getArtistName call');

            // Correctly pass the artistID to the smart contract function
            const getArtistName = await contractInstance.getArtistNameByID(artistID, { from: this.props.account });
            console.log('artistID is\n', artistID);

            console.log('getArtistName', getArtistName);
            return getArtistName; // Assuming the function returns the artistName directly
        } catch (error) {
            console.error('getArtistName Error:', error);
            return ''; // Return an empty string or handle the error as needed
        }
    }

    async loadPurchasedTimes(_songID) {
        console.log("Into Purchased Times");
        console.log("songID:", _songID);
        let song_id = parseInt(_songID);
        const contractInstance = await this.props.contract.deployed();
        // Assuming getSongPurchasedTimes now returns a struct with personalCount and commercialCount
        const purchaseCounts = await contractInstance.getSongPurchasedTimes(song_id, { from: this.props.account });
        console.log("Purchased times for song ID", song_id, ":", purchaseCounts);

        // Extract personal and commercial purchase counts
        const personalCount = purchaseCounts[0];
        const commercialCount = purchaseCounts[1];

        // You can now use personalCount and commercialCount as needed
        // For example, you might want to update the state or display these counts in the UI

        return { personalCount, commercialCount };
    }

    async loadSongDetails() {
        console.log("Entering loadSongDetails function");
        const contractInstance = await this.props.contract.deployed();
        console.log("Contract instance deployed successfully");
        let songInfoList = [];
        console.log('Number of song IDs to process:', this.state.songIDs.length);

        for (let i = 0; i < this.state.songIDs.length; i++) {
            console.log(`Processing song ID at index ${i}:`, this.state.songIDs[i]);
            let songDetails = await contractInstance.getSongDetails(this.state.songIDs[i], { from: this.props.account });
            console.log("Song Details fetched for ID:", songDetails[0]);
            console.log("Sending song ID to loadPurchasedTimes:", this.state.songIDs[i]);

            // Retrieve both personal and commercial purchase counts
            let purchaseCounts = await contractInstance.getSongPurchaseCounts(this.state.songIDs[i], { from: this.props.account });
            console.log('Purchased times for song ID', this.state.songIDs[i], ':', purchaseCounts);


            // Extract the artist ID from songDetails[8] and convert it to a string if necessary
            let artistIDString = songDetails[8].toString();
            console.log('artistIDString\n', artistIDString);
            let artistIDArray = artistIDString.split(',').map(Number);
            console.log('artistIDArray\n', artistIDArray, '\n', typeof artistIDArray);
            let artistNames = [];
            for (let i = 0; i < artistIDArray.length; i++) {
                console.log('Artist ID:', artistIDArray[i]);
                let artistName = await contractInstance.getArtistNameByID(artistIDArray[i], { from: this.props.account });
                console.log('Artist name fetched:', artistName);
                artistNames.push(artistName);
            }


            console.log('timesPurchasedPersonal', purchaseCounts[0].toString())
            console.log('timesPurchasedCommercial', purchaseCounts[1].toString())
            let royaltyPercent = songDetails[5]; // Assuming songDetails[5] is the royalty percent
            let personalPricing = songDetails[3]; // Assuming songDetails[3] is the personal pricing
            let commercialPricing = songDetails[4];
            console.log("royaltyPercent", parseInt(royaltyPercent))
            let publisherEarningsPerSongPurchase_Personal = (personalPricing * (100 - royaltyPercent)) / 100;
            console.log("Publisher Split Personal", publisherEarningsPerSongPurchase_Personal)
            let publisherEarningsPerSongPurchase_Commercial = (commercialPricing * (100 - royaltyPercent)) / 100;
            console.log("Publisher Split Commercial", publisherEarningsPerSongPurchase_Commercial)
            let publisherEarningsPerSongTotal_Personal = purchaseCounts[0] * publisherEarningsPerSongPurchase_Personal
            let publisherEarningsPerSongTotal_Commercial = purchaseCounts[1] * publisherEarningsPerSongPurchase_Commercial
            console.log("Revenue Personal Total for each song:", publisherEarningsPerSongTotal_Personal)
            console.log("Revenue Commercial Total for each song:", publisherEarningsPerSongTotal_Commercial)
            console.log("royaltyPercent", parseInt(royaltyPercent))
            let timePurchasedTotal= parseInt(purchaseCounts[0])+ parseInt(purchaseCounts[1])

            let publisherEarningsPerSong_Total=parseInt(publisherEarningsPerSongPurchase_Personal)+parseInt(publisherEarningsPerSongPurchase_Commercial)
            songInfoList.push({
                'name': songDetails[2],
                'genre': songDetails[7],
                'hash': songDetails[6],
                'cost_personal': songDetails[3].toString(),
                'cost_commercial': songDetails[4].toString(),
                'artistsIDSong': songDetails[8].toString(),
                'timesPurchasedPersonal': purchaseCounts[0].toString(), // Personal purchase count
                'timesPurchasedCommercial': purchaseCounts[1].toString(), // Commercial purchase count
                'timePurchasedTotal': timePurchasedTotal.toString(),
                'artist_name': artistNames,
                'publisherEarningsPerSongPurchase_Personal': publisherEarningsPerSongPurchase_Personal.toString(), // Revenue from personal purchases
                'publisherEarningsPerSongPurchase_Commercial': publisherEarningsPerSongPurchase_Commercial.toString(),
                'publisherEarningsPerSong_Total':publisherEarningsPerSong_Total
            });
            this.state.purchased_times += parseInt(purchaseCounts[0]) + parseInt(purchaseCounts[1]);
            this.state.totalEarnings += parseInt(publisherEarningsPerSongTotal_Personal)+parseInt(publisherEarningsPerSongTotal_Commercial)
        }

        this.setState({ songs: songInfoList });
        this.state.totalEarningsETH = this.state.totalEarnings / 1000000000000000000;
        console.log("State updated with songInfoList");
        console.log("Combined",this.state.totalEarnings)
    }

    openForm() {
        this.setState({ form: true })
    }

    closeForm() {
        this.setState({ form: false })
    }

    handleSearchChange(event) {
        this.setState({ searchQuery: event.target.value });
    }

    render() {
        if (this.state.publisherID === "") {
            return (
                <div style={styles.main}>
                    <h1>Hello</h1>
                    <Loader type="Bars" color={COLORS.black} />
                </div>
            );
        } else {
            // Filter songs based on the search query
            const filteredSongs = this.state.songs.filter(song =>
                song.name.toLowerCase().includes(this.state.searchQuery.toLowerCase())
            );

            return (
                <div style={styles.main}>
                    <div style={styles.info}>
                        <h1><FontAwesomeIcon icon={faBuilding} /> {this.state.name} </h1>
                        <h3> Record Label ID : {this.state.publisherID} </h3>
                        <h3> Total Songs Sold : {this.state.purchased_times} </h3>
                        <h3>Total Earnings : {this.state.totalEarningsETH} ETH</h3>
                    </div>
                    {/* Search bar */}
                    <input  
                        type="text"
                        placeholder="Search by song name..."
                        value={this.state.searchQuery}
                        onChange={this.handleSearchChange}
                        className="form-control w-75 h-20" 
                        style={{ fontSize: "20px" }} 
                    />
                    <div style={styles.box}>

                        {filteredSongs.map((item, i) => (
                            <SongCard
                                type={"publisher"}
                                name={item.name}
                                genre={item.genre}
                                cost={item.cost_personal}
                                cost_personal={item.cost_personal}
                                cost_commercial={item.cost_commercial}
                                totalTimesPurchasedSong={item.timePurchasedTotal}
                                times_personal_purchased={item.timesPurchasedPersonal}
                                times_commercial_purchased={item.timesPurchasedCommercial}
                                publisherEarningsPerSong_Total={item.publisherEarningsPerSong_Total}
                                artist_names={item.artist_name}
                                hash={item.hash}
                                key={i}
                            />
                        ))}
                    </div>
                    <button type="button" className="btn btn-dark btn-lg " onClick={() => { this.openForm() }}>
                        <div>Add Song <FontAwesomeIcon icon={faPlusSquare} /></div>
                    </button >
                    <AddSongCard
                        contract={this.props.contract}
                        ipfs={this.props.ipfs}
                        account={this.props.account}
                        form={this.state.form}
                        closeForm={this.closeForm} />
                </div>
            );
        }
    }
}



const styles = {
    main: {
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        gap: "3%",
        background: COLORS.white,
    },
    info: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
    },
    box: {
        height: "50%",
        width: "80%",
        padding: "1%",
        display: "flex",
        flexDirection: "column",
        borderRadius: "30px",
        border: "3px solid",
        overflow: "auto",
        gap: "1%",
        boxShadow: "2px 5px 2px #191919",
        borderColor: COLORS.black,
        backgroundColor: COLORS.white,
    },
}

export default RecordLabel;
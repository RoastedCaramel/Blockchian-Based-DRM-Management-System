import React from "react"
import { COLORS } from "./Colors"
import SongCard from "./SongCard"
import Loader from "react-loader-spinner"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMicrophone } from '@fortawesome/free-solid-svg-icons'

class Artist extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            name: "", artistID: "", totalEarnings: 0, purchased_times: 0, songIDs: [], songs: [], form: false, searchQuery: "" // New state for search query
        }
        this.openForm = this.openForm.bind(this);
        this.closeForm = this.closeForm.bind(this);
        this.handleSearchChange = this.handleSearchChange.bind(this);

    }

    componentDidMount() {
        this.loadArtistDetails().then(() => {
            console.log("Loaded Artist's Details", this.state)
            this.loadSongDetails().then(() => { console.log("Loaded Artist's Songs") })
        })
    }

    async loadArtistDetails() {
        try {
            const contractInstance = await this.props.contract.deployed();
            const userType = await contractInstance.checkUserType.call({ from: this.props.account });
            console.log("User Type", userType)
            console.log("loading detaisl 456")
            const artistDetails = await contractInstance.getArtistDetails.call({ from: this.props.account });
            console.log("Artist Details:", artistDetails)
            console.log("loading detaisl 123")
            let songList = [];
            for (let i = 0; i < artistDetails[3].length; i++) {
                songList.push(artistDetails[3][i].toString());
            }
            this.setState({
                artistID: artistDetails[0].toString(),
                name: artistDetails[2].toString(),
                songIDs: songList
            });
        } catch (error) {
            console.error("Failed to load artist details:", error);
        }
    }

    async getPublisherName(publisherID) {
        try {
            const contractInstance = await this.props.contract.deployed();
            // console.log('getPublisherName call');

            // Correctly pass the publisherID to the smart contract function
            const getPublisherName = await contractInstance.getPublisherNameByID(publisherID, { from: this.props.account });
            console.log('publisherID is\n', publisherID)

            console.log('getPublisherName', getPublisherName)
            return getPublisherName; // Assuming the function returns the publisherName directly
        } catch (error) {
            console.error('getPublisherName Error:', error);
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
        console.log("Going into loadSongDetails");
        const contractInstance = await this.props.contract.deployed();
        let songInfoList = [];
        console.log('this.state.songIDs.length\n', this.state.songIDs);

        for (let i = 0; i < this.state.songIDs.length; i++) {
            let songDetails = await contractInstance.getSongDetails(this.state.songIDs[i], { from: this.props.account });
            console.log('i value ', i);


            // Extract the publisher ID from songDetails[1] and convert it to a string if necessary
            let publisherID = songDetails[1].toString();
            console.log("PublisherID:\n", songDetails[1].toString())
            // Call the getPublisherNameByID function to get the publisher name
            let publisherName = await contractInstance.getPublisherNameByID(publisherID, { from: this.props.account });
            console.log('the publisherName is: \n', publisherName);


            // Retrieve both personal and commercial purchase counts
            let purchaseCounts = await contractInstance.getSongPurchaseCounts(this.state.songIDs[i], { from: this.props.account });
            console.log('Purchased times for song ID', this.state.songIDs[i], ':', purchaseCounts);

            console.log('timesPurchasedPersonal', purchaseCounts[0].toString())
            console.log('timesPurchasedCommercial', purchaseCounts[1].toString())

            let royaltyPercent = songDetails[5]; // Assuming songDetails[5] is the royalty percent
            let personalPricing = songDetails[3]; // Assuming songDetails[3] is the personal pricing
            let commercialPricing = songDetails[4];
            console.log("royaltyPercent", parseInt(royaltyPercent))
            let artistEarningsPerSongPurchase_Personal = (personalPricing * royaltyPercent) / 100;
            console.log("artist Split Personal", artistEarningsPerSongPurchase_Personal)
            let artistEarningsPerSongPurchase_Commercial = (commercialPricing * (royaltyPercent)) / 100;
            console.log("artist Split Commercial", artistEarningsPerSongPurchase_Commercial)
            let artistEarningsPerSongTotal_Personal = purchaseCounts[0] * artistEarningsPerSongPurchase_Personal
            let artistEarningsPerSongTotal_Commercial = purchaseCounts[1] * artistEarningsPerSongPurchase_Commercial
            console.log("Revenue Personal Total for each song:", artistEarningsPerSongTotal_Personal)
            console.log("Revenue Commercial Total for each song:", artistEarningsPerSongTotal_Commercial)
            console.log("royaltyPercent", parseInt(royaltyPercent))
            let timePurchasedTotal = parseInt(purchaseCounts[0]) + parseInt(purchaseCounts[1])
            let artistEarningsPerSong_Total=parseInt(artistEarningsPerSongPurchase_Personal)+parseInt(artistEarningsPerSongPurchase_Commercial)

            songInfoList.push({
                'name': songDetails[2],
                'genre': songDetails[7],
                'hash': songDetails[6],
                'cost_personal': songDetails[3].toString(),
                'cost_commercial': songDetails[4].toString(),
                'publisher_name': publisherName,
                'timesPurchasedPersonal': purchaseCounts[0].toString(), // Personal purchase count
                'timesPurchasedCommercial': purchaseCounts[1].toString(), // Commercial purchase count
                'timePurchasedTotal': timePurchasedTotal.toString(),
                'artistEarningsPerSongPurchase_Personal': artistEarningsPerSongPurchase_Personal.toString(), // Revenue from personal purchases
                'artistEarningsPerSongPurchase_Commercial': artistEarningsPerSongPurchase_Commercial.toString(),
                'artistEarningsPerSong_Total': artistEarningsPerSong_Total.toString()
            });
            this.state.purchased_times += parseInt(purchaseCounts[0]) + parseInt(purchaseCounts[1]);
            this.state.totalEarnings += parseInt(artistEarningsPerSongTotal_Personal) + parseInt(artistEarningsPerSongTotal_Commercial)
        }
        console.log('songInfoList is \n', songInfoList);

        this.setState({ songs: songInfoList });
        this.state.totalEarningsETH = this.state.totalEarnings / 1000000000000000000;
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
        if (this.state.artistID === "") {
            return (
                <div style={styles.main}>
                    <h1>Connecting</h1>
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
                        <h1><FontAwesomeIcon icon={faMicrophone} /> {this.state.name} </h1>
                        <h3> Artist ID : {this.state.artistID} </h3>
                        <h3> Totals Songs sold : {this.state.purchased_times} </h3>
                        <h3>Total Earnings : {this.state.totalEarningsETH} ETH</h3>
                    </div>
                    {/* Search bar  */}
                    <input
                        type="text"
                        placeholder="Search by song name..."
                        value={this.state.searchQuery}
                        onChange={this.handleSearchChange}
                        className="form-control w-75 h-20" // Adding h-100 class to increase height
                        style={{ fontSize: "20px" }} // Inline style to increase font size
                    />
                    <div style={styles.box}>

                        {filteredSongs.map((item, i) => (
                            <SongCard
                                type={"artist"}
                                name={item.name}
                                genre={item.genre}
                                cost={item.cost_personal}
                                cost_personal={item.cost_personal}
                                cost_commercial={item.cost_commercial}
                                // likes={item.timesPurchased}
                                totalTimesPurchasedSong={item.timePurchasedTotal}
                                times_personal_purchased={item.timesPurchasedPersonal}
                                times_commercial_purchased={item.timesPurchasedCommercial}
                                artistEarningsPerSong_Total={item.artistEarningsPerSong_Total}
                                publisherName={item.publisher_name}
                                hash={item.hash}
                                key={i}
                            />
                        ))}
                    </div>
                    {/* <h1><FontAwesomeIcon icon={faPlusSquare} onClick={() => { this.openForm() }} /></h1> */}
                    {/* <AddSongCard contract={this.props.contract} ipfs={this.props.ipfs} account={this.props.account} form={this.state.form} closeForm={this.closeForm} /> */}
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
        gap: "5%",
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
        padding: "2%",
        display: "flex",
        flexDirection: "column",
        borderRadius: "30px",
        border: "3px solid",
        overflow: "auto",
        gap: "2%",
        boxShadow: "2px 5px 2px #191919",
        borderColor: COLORS.black,
        backgroundColor: COLORS.white,
    },
}

export default Artist;
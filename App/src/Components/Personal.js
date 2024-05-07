import React from "react";
import Web3 from 'web3';
import Loader from "react-loader-spinner";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeadphones, faStore, faUser } from '@fortawesome/free-solid-svg-icons';
import { faHive } from '@fortawesome/free-brands-svg-icons'
import SongCard from "./SongCard";
import { COLORS } from "./Colors";

class Library extends React.Component {
    render() {
        return (
            <div className="container">
                <div className="row justify-content-center mt-4">
                    <div className="col">
                        <h3 className="text-center"><FontAwesomeIcon icon={faUser} /> Library</h3>
                    </div>
                </div>
                <div className="row justify-content-center mt-2" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    {this.props.library.map((item, i) => (
                        <SongCard
                            type={"audience"}
                            name={item.name}
                            artist={item.artist}
                            genre={item.genre}
                            hash={item.hash}
                            songID={item.songID}
                            artist_names={item.artist_name}
                            publisherName={item.publisher_name}
                            key={i} />
                    ))}
                </div>
            </div>
        );
    }
}

class Store extends React.Component {
    render() {
        const filteredStoreSongs = this.props.store.filter((song) =>
            song.name.toLowerCase().includes(this.props.searchTerm.toLowerCase())
        );

        return (
            <div className="container">
                <div className="row justify-content-center mt-4">
                    <div className="col">
                        <h3 className="text-center"><FontAwesomeIcon icon={faStore} /> Store</h3>
                    </div>
                </div>
                <div className="row justify-content-center mt-2">
                    <div className="col-md-6">
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Search songs..."
                            value={this.props.searchTerm}
                            onChange={(e) => this.props.setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className="row justify-content-center mt-2" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    {filteredStoreSongs.length > 0 ? (
                        filteredStoreSongs.map((item, i) => (
                            <SongCard
                                contract={this.props.contract}
                                ipfs={this.props.ipfs}
                                account={this.props.account}
                                type={"shop"}
                                name={item.name}
                                artist={item.artist}
                                genre={item.genre}
                                cost={item.cost}
                                hash={item.hash}
                                songID={item.songID}
                                artist_names={item.artist_name}
                                publisherName={item.publisher_name}
                                key={i} />
                        ))
                    ) : (
                        <p className="text-center">No songs available to purchase.</p>
                    )}
                </div>
            </div>
        );
    }
}

class Personal extends React.Component {
    constructor(props) {
        super(props);
        this.web3 = new Web3(Web3.givenProvider || "http://localhost:7545");
        this.state = { name: "", personalID: "", store: [], library: [], songsMapping: {}, searchTerm: "", currentPage: 'library' };
    }

    componentDidMount() {
        this.loadStore().then(() => {
            console.log("Loaded Store");
            this.loadPersonalDetails().then(() => {
                console.log("Loaded Audience's Details");
                this.loadSongDetails().then(() => {
                    console.log("Loaded Songs");
                });
            });
        });
    }

    async loadStore() {
        try {
            const contractInstance = await this.props.contract.deployed();
            const count = await contractInstance.getNumSongs({ from: this.props.account });
            const totalSongs = parseInt(count.toString()) + 1;
            let mapping = {};
            for (let i = 1; i <= totalSongs; i++) {
                mapping[i] = 0;
            }
            this.setState({
                songsMapping: mapping
            });
        } catch (error) {
            console.error("Error loading store:", error);
        }
    }

    async loadPersonalDetails() {
        try {
            const contractInstance = await this.props.contract.deployed();
            const personalDetails = await contractInstance.getPersonalDetails({ from: this.props.account });
            let mapping = this.state.songsMapping;
            for (let i = 0; i < personalDetails[3].length; i++) {
                mapping[parseInt(personalDetails[3][i].toString())] = 1;
            }
            this.setState({
                name: personalDetails[2].toString(),
                personalID: personalDetails[0].toString(),
                songsMapping: mapping
            });
        } catch (error) {
            console.error("Error loading audience details:", error);
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

    async loadSongDetails() {
        try {
            const contractInstance = await this.props.contract.deployed();
            let n = Object.keys(this.state.songsMapping).length;
            let newSongs = [];
            let purchasedSongs = [];

            for (let i = 1; i <= n; i++) {
                let songDetails = await contractInstance.getSongDetails(i, { from: this.props.account });


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

                // Extract the publisher ID from songDetails[1] and convert it to a string if necessary
                let publisherID = songDetails[1].toString();
                console.log("PublisherID:\n", songDetails[1].toString())
                // Call the getPublisherNameByID function to get the publisher name
                let publisherName = await contractInstance.getPublisherNameByID(publisherID, { from: this.props.account });
                console.log('the publisherName is: \n', publisherName);


                if (this.state.songsMapping[i] === 1) {
                    purchasedSongs.push({
                        'name': songDetails[2].toString(),
                        'artist': songDetails[1].toString(),
                        'genre': songDetails[7].toString(),
                        'hash': songDetails[6].toString(),
                        'cost': songDetails[3].toString(),
                        'songID': songDetails[0].toString(),
                        'artist_name': artistNames,
                        'publisher_name': publisherName,
                    });
                } else {
                    newSongs.push({
                        'name': songDetails[2].toString(),
                        'artist': songDetails[1].toString(),
                        'genre': songDetails[7].toString(),
                        'hash': songDetails[6].toString(),
                        'cost': songDetails[3].toString(),
                        'songID': songDetails[0].toString(),
                        'artist_name': artistNames,
                        'publisher_name': publisherName,
                    });
                }
            }

            this.setState({
                library: purchasedSongs,
                store: newSongs
            });
        } catch (error) {
            console.error("Error loading song details:", error);
        }
    }

    render() {
        const { currentPage } = this.state;
        return (
            <div className="container-fluid">
                <div className="row full-height" style={{ height: '100vh' }}>
                    <div className="col-2 bg-dark">
                        <div className="text-primary mt-5">
                            <h1 className="text-white">
                            <FontAwesomeIcon icon={faHive} />  Blockus
                            </h1>
                        </div>
                        <div className="row mt-5 px 5" style={{ marginLeft: '5px', marginRight: '5px' }}>
                            <button className="btn btn-primary mr-2" onClick={() => this.setState({ currentPage: 'library' })}>Library</button>
                        </div>
                        <div className="row mt-2" style={{ marginLeft: '5px', marginRight: '5px' }}>
                            <button className="btn btn-primary" onClick={() => this.setState({ currentPage: 'store' })}>Store</button>
                        </div>
                    </div>
                    <div className="col-10">
                        {this.state.personalID === "" ? (
                            <div className="row justify-content-center mt-4">
                                <div className="col">
                                    <Loader type="Bars" color={COLORS.black} />
                                </div>
                            </div>
                        ) : (
                            <div>
                                <div className="row justify-content-center mt-4">
                                    <div className="col">
                                        <h2 className="text-center"><FontAwesomeIcon icon={faHeadphones} />{this.state.name}</h2>
                                        <h3 className="text-center">Personal ID: {this.state.personalID}</h3>
                                    </div>
                                </div>
                                {currentPage === 'library' ? (
                                    <Library library={this.state.library} />
                                ) : (
                                    <Store
                                        store={this.state.store}
                                        searchTerm={this.state.searchTerm}
                                        setSearchTerm={(searchTerm) => this.setState({ searchTerm })}
                                        contract={this.props.contract}
                                        ipfs={this.props.ipfs}
                                        account={this.props.account}
                                    />
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }
}

export default Personal;
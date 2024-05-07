import React from 'react';
import SongCard from "./SongCard";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStore } from '@fortawesome/free-solid-svg-icons';

class Store extends React.Component {
    render() {
        return (
            <div>
                <h3 style={{ textAlign: "center" }}><FontAwesomeIcon icon={faStore} /> Store</h3>
                <input
                    type="text"
                    placeholder="Search songs..."
                    value={this.props.searchTerm}
                    onChange={(e) => this.props.onSearchTermChange(e.target.value)}
                    style={this.props.styles.searchInput}
                />
                {this.props.store.length > 0 ? (
                    this.props.store.map((item, i) => (
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
                            key={i} />
                    ))
                ) : (
                    <p style={{ textAlign: "center" }}>No songs available to purchase.</p>
                )}
            </div>
        );
    }
}

export default Store;
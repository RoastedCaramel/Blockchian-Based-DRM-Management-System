import React from 'react';
import SongCard from "./SongCard";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser } from '@fortawesome/free-solid-svg-icons';

class Library extends React.Component {
    render() {
        return (
            <div>
                <h3 style={{ textAlign: "center" }}><FontAwesomeIcon icon={faUser} /> Library</h3>
                {this.props.library.map((item, i) => (
                    <SongCard
                        type={"audience"}
                        name={item.name}
                        artist={item.artist}
                        genre={item.genre}
                        hash={item.hash}
                        songID={item.songID}
                        key={i} />
                ))}
            </div>
        );
    }
}

export default Library;
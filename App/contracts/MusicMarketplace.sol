// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MusicMarketplace {
    enum UserType {
        Unknown,
        Personal,
        Publisher,
        Artist,
        Commercial
    }

    struct Personal {
        uint256 personalID;
        address walletAddress;
        string personalName;
        uint256[] songIDs; // Array to store IDs of purchased songs
    }

    struct Commercial {
        uint256 commercialID;
        address walletAddress;
        string commercialName;
        uint256[] songIDs; // Array to store IDs of purchased songs
    }

    struct Publisher {
        uint256 publisherID;
        address walletAddress;
        string publisherName;
        uint256 totalEarnings; 
        uint256[] songsPublished; // Array to store IDs of songs published by the publisher
    }

    struct Artist {
        uint256 artistID;
        address walletAddress;
        string artistName;
        UserType userType;
        uint256 totalEarnings; // Total earnings for the artist
        uint256[] songsArtist; // Array to store IDs of songs associated with the artist
    }

    struct Song {
        uint256 songID;
        uint256 publisherID; 
        string songName;
        uint256 personalPricing; // Renamed from songPrice to personalPricing
        uint256 commercialPricing; // Additional pricing for commercial use
        uint256 royaltyPercent;
        string songHash; 
        string genre; 
        uint256[] artistIDs; // Array to store artist IDs
    }

    struct PurchaseCounts {
        uint256 personalCount;
        uint256 commercialCount;
    }

    uint256 public nextPersonalID = 1;
    uint256 public nextCommercialID = 1;
    uint256 public nextPublisherID = 1;
    uint256 public nextArtistID = 1;
    uint256 public nextSongID = 1;

    mapping(uint256 => Personal) public personals;
    mapping(uint256 => Commercial) public commercials;
    mapping(uint256 => Publisher) public publishers;
    mapping(uint256 => Artist) public artists;
    mapping(uint256 => Song) public songs;
    mapping(address => UserType) public userTypes;
    mapping(address => uint256) public publisherIDsByWallet;
    mapping(address => uint256) public artistIDsByWallet; // Mapping for artists
    mapping(uint256 => PurchaseCounts) public timesSongPurchased;

    uint256 public songIDTracker = 0; 

    modifier onlyPersonal() {
        require(
            userTypes[msg.sender] == UserType.Personal,
            "Only personal users can perform this action"
        );
        _;
    }

    modifier onlyCommercial() {
        require(
            userTypes[msg.sender] == UserType.Commercial,
            "Only commercial users can perform this action"
        );
        _;
    }

    function addUserType(UserType _userType) internal {
        userTypes[msg.sender] = _userType;
    }

    function addPersonal(string memory _personalName) public {
        personals[nextPersonalID] = Personal(
            nextPersonalID,
            msg.sender,
            _personalName,
            new uint256[](0) 
        );
        addUserType(UserType.Personal);
        nextPersonalID++;
    }

    function addCommercial(string memory _commercialName) public {
        commercials[nextCommercialID] = Commercial(
            nextCommercialID,
            msg.sender,
            _commercialName,
            new uint256[](0) 
        );
        addUserType(UserType.Commercial);
        nextCommercialID++;
    }

    function addPublisher(string memory _publisherName) public {
        uint256 newPublisherID = nextPublisherID++;
        publishers[newPublisherID] = Publisher(
            newPublisherID,
            msg.sender,
            _publisherName,
            0,
            new uint256[](0) 
        );

        // Store the mapping between the wallet address and the publisher ID
        publisherIDsByWallet[msg.sender] = newPublisherID;

        addUserType(UserType.Publisher);
    }

    function addArtist(string memory _artistName) public {
        artists[nextArtistID] = Artist(
            nextArtistID,
            msg.sender,
            _artistName,
            UserType.Artist,
            0,
            new uint256[](0) 
        );
        addUserType(UserType.Artist);
        artistIDsByWallet[msg.sender] = nextArtistID; // Update mapping for artists
        nextArtistID++;
    }

    function addSong(
        string memory _songName,
        uint256 _personalPricing,
        uint256 _commercialPricing,
        uint256[] memory _artistIDs,
        uint256 _royaltyPercent,
        string memory _songHash,
        string memory _genre
    ) public {
        require(
            userTypes[msg.sender] == UserType.Publisher,
            "Only publishers can add songs"
        );
        uint256 publisherID = publisherIDsByWallet[msg.sender]; 
        require(publisherID > 0, "Publisher not found"); // Ensure the publisher exists
        //         // Check if the song hash has been used before
        // require(!songHashes[_songHash], "Song hash already used");

        uint256 newSongID = nextSongID++;
        songs[newSongID] = Song(
            newSongID,
            publisherID,
            _songName,
            _personalPricing,
            _commercialPricing,
            _royaltyPercent,
            _songHash,
            _genre,
            _artistIDs
        );
        //         // Mark the song hash as used
        // songHashes[_songHash] = true;

        // Update songsPublished array for the publisher
        publishers[publisherID].songsPublished.push(newSongID);

        // Update songsArtist array for each artist associated with the song
        for (uint256 i = 0; i < _artistIDs.length; i++) {
            artists[_artistIDs[i]].songsArtist.push(newSongID);
        }

        // Initialize the purchase count for the new song to 0
        timesSongPurchased[newSongID] = PurchaseCounts({
            personalCount: 0,
            commercialCount: 0
        });

        songIDTracker++; // Increment songIDTracker when a song is added
    }

    function checkUserType() public view returns (UserType) {
        return userTypes[msg.sender];
    }

    function getPublisherEarnings(
        uint256 _publisherID
    ) public view returns (uint256) {
        return publishers[_publisherID].totalEarnings;
    }

    function getArtistEarnings(
        uint256 _artistID
    ) public view returns (uint256) {
        return artists[_artistID].totalEarnings;
    }

    function buySong(uint256 _songID) public payable {
        require(_songID < nextSongID, "Invalid song ID");
        Song storage song = songs[_songID];

        uint256 userID;
        bool isPersonal;
        if (userTypes[msg.sender] == UserType.Personal) {
            require(
                msg.value >= song.personalPricing,
                "Insufficient funds to purchase the song."
            );
            userID = getPersonalIDByWallet(msg.sender);
            require(userID > 0, "Personal user not found");
            isPersonal = true;
        } else if (userTypes[msg.sender] == UserType.Commercial) {
            require(
                msg.value >= song.commercialPricing,
                "Insufficient funds for commercial use"
            );
            userID = getCommercialIDByWallet(msg.sender);
            require(userID > 0, "Commercial user not found");
            isPersonal = false;
        } else {
            revert("Only personal and commercial users can buy songs");
        }

        // Check if the song is already purchased by the user
        bool songAlreadyPurchased = false;
        for (
            uint256 i = 0;
            i <
            (
                isPersonal
                    ? personals[userID].songIDs.length
                    : commercials[userID].songIDs.length
            );
            i++
        ) {
            if (
                isPersonal
                    ? personals[userID].songIDs[i] == _songID
                    : commercials[userID].songIDs[i] == _songID
            ) {
                songAlreadyPurchased = true;
                break;
            }
        }

        require(!songAlreadyPurchased, "Song already purchased by the user");

        // If not purchased, add the SongID to the SongIDs array of the user
        if (isPersonal) {
            personals[userID].songIDs.push(_songID);
        } else {
            commercials[userID].songIDs.push(_songID);
        }

        // Calculate earnings and perform transfers
        uint256 price = isPersonal
            ? song.personalPricing
            : song.commercialPricing;
        uint256 publisherShare = (price * (100 - song.royaltyPercent)) / 100;
        uint256 artistShare = price - publisherShare;
        uint256 artistSharePerArtist = artistShare / song.artistIDs.length;

        // Update earnings for the publisher
        publishers[song.publisherID].totalEarnings += publisherShare;
        // Update earnings for the artists
        for (uint256 i = 0; i < song.artistIDs.length; i++) {
            artists[song.artistIDs[i]].totalEarnings += artistSharePerArtist;
        }
        // Transfer funds to publisher
        (bool publisherTransferResult, ) = payable(
            publishers[song.publisherID].walletAddress
        ).call{value: publisherShare}("");
        require(publisherTransferResult, "Transfer to publisher failed");

        // Transfer funds to artists
        for (uint256 i = 0; i < song.artistIDs.length; i++) {
            (bool artistTransferResult, ) = payable(
                artists[song.artistIDs[i]].walletAddress
            ).call{value: artistSharePerArtist}("");
            require(artistTransferResult, "Transfer to artist failed");
        }

        // Increment the appropriate count in the timesSongPurchased mapping
        if (isPersonal) {
            timesSongPurchased[_songID].personalCount += 1;
        } else {
            timesSongPurchased[_songID].commercialCount += 1;
        }
    }

    function getPersonalDetails()
        public
        view
        onlyPersonal
        returns (
            uint256 personalID,
            address walletAddress,
            string memory personalName,
            uint256[] memory songIDs
        )
    {
        uint256 foundPersonalID = getPersonalIDByWallet(msg.sender);
        Personal storage personal = personals[foundPersonalID];

        return (
            foundPersonalID,
            personal.walletAddress,
            personal.personalName,
            personal.songIDs
        );
    }

    function getPersonalIDByWallet(
        address _walletAddress
    ) internal view returns (uint256) {
        return
            userTypes[_walletAddress] == UserType.Personal
                ? _getPersonalID(_walletAddress)
                : 0;
    }

    function getCommercialIDByWallet(
        address _walletAddress
    ) internal view returns (uint256) {
        return
            userTypes[_walletAddress] == UserType.Commercial
                ? _getCommercialID(_walletAddress)
                : 0;
    }

    function _getCommercialID(
        address _walletAddress
    ) internal view returns (uint256) {
        for (uint256 i = 1; i < nextCommercialID; i++) {
            if (commercials[i].walletAddress == _walletAddress) {
                return i;
            }
        }
        return 0;
    }

    function _getPersonalID(
        address _walletAddress
    ) internal view returns (uint256) {
        for (uint256 i = 1; i < nextPersonalID; i++) {
            if (personals[i].walletAddress == _walletAddress) {
                return i;
            }
        }
        return 0;
    }

    function getCommercialDetails()
        public
        view
        onlyCommercial
        returns (
            uint256 commercialID,
            address walletAddress,
            string memory commercialName,
            uint256[] memory songIDs
        )
    {
        uint256 foundCommercialID = getCommercialIDByWallet(msg.sender);
        Commercial storage commercial = commercials[foundCommercialID];

        return (
            foundCommercialID,
            commercial.walletAddress,
            commercial.commercialName,
            commercial.songIDs
        );
    }

    function getSongDetails(
        uint256 _songID
    )
        public
        view
        returns (
            uint256 songID,
            uint256 publisherID,
            string memory songName,
            uint256 personalPricing,
            uint256 commercialPricing,
            uint256 royaltyPercent,
            string memory songHash,
            string memory genre,
            uint256[] memory artistIDs
        )
    {
        require(_songID < nextSongID, "Invalid song ID");
        Song storage song = songs[_songID];
        return (
            song.songID,
            song.publisherID,
            song.songName,
            song.personalPricing,
            song.commercialPricing,
            song.royaltyPercent,
            song.songHash,
            song.genre,
            song.artistIDs
        );
    }

    function getSongPurchaseCounts(
        uint256 _songID
    ) public view returns (uint256[] memory) {
        require(_songID < nextSongID, "Invalid song ID");
        PurchaseCounts memory counts = timesSongPurchased[_songID];
        uint256[] memory purchaseCountArray = new uint256[](2); 
        purchaseCountArray[0] = counts.personalCount; 
        purchaseCountArray[1] = counts.commercialCount; 
        return purchaseCountArray; 
    }

    function getPublisherDetails()
        public
        view
        returns (
            uint256 publisherID,
            address walletAddress,
            string memory publisherName,
            uint256[] memory songsPublished
        )
    {
        // require(
        //     userTypes[msg.sender] == UserType.Publisher ,
        //     "Only publishers can access their details"
        // );

        uint256 foundPublisherID = publisherIDsByWallet[msg.sender];
        Publisher storage publisher = publishers[foundPublisherID];

        return (
            publisher.publisherID,
            publisher.walletAddress,
            publisher.publisherName,
            publisher.songsPublished
        );
    }

    function getArtistDetails()
        public
        view
        returns (
            uint256 artistID,
            address walletAddress,
            string memory artistName,
            uint256[] memory songsArtist
        )
    {
        require(
            userTypes[msg.sender] == UserType.Artist,
            "Only artists can access their details"
        );

        uint256 foundArtistID = artistIDsByWallet[msg.sender];
        Artist storage artist = artists[foundArtistID];

        return (
            artist.artistID,
            artist.walletAddress,
            artist.artistName,
            artist.songsArtist
        );
    }

    function getNumSongs() public view returns (uint256) {
        return songIDTracker - 1;
    }

    function getPublisherNameByID(
        uint256 _publisherID
    ) public view returns (string memory publisherName) {
        // Check if the publisherID exists in the publishers mapping
        require(
            publishers[_publisherID].publisherID != 0,
            "Publisher ID does not exist"
        );
        // Retrieve the publisher details using the publisherID
        Publisher storage publisher = publishers[_publisherID];
        return publisher.publisherName;
    }

    function getArtistNameByID(
        uint256 _artistID
    ) public view returns (string memory artistName) {
        // Check if the artistID exists in the artists mapping
        require(artists[_artistID].artistID != 0, "Artist ID does not exist");
        // Retrieve the artist details using the artistID
        Artist storage artist = artists[_artistID];
        return artist.artistName;
    }

    function getAllArtists()
        public
        view
        returns (uint256[] memory, string[] memory)
    {
        uint256[] memory artistIDs = new uint256[](nextArtistID - 1);
        string[] memory artistNames = new string[](nextArtistID - 1);
        // Iterate through all artists and populate the arrays
        for (uint256 i = 1; i < nextArtistID; i++) {
            artistIDs[i - 1] = i;
            artistNames[i - 1] = artists[i].artistName;
        }
        return (artistIDs, artistNames);
    }
}

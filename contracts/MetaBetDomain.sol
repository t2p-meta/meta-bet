// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

contract MetaBetDomain {
    enum AssetType {
        ETH,
        ERC20,
        ERC1155,
        ERC721,
        ERC721Deprecated
    }

    enum MatchResult {
        NOT_DETERMINED,
        DRAW,
        TEAM_A_WON,
        TEAM_B_WON
    }
    enum MatchState {
        NOT_STARTED,
        STARTED,
        FINISHED
    }

    uint8 private constant TEAM_A = 1;
    uint8 private constant TEAM_B = 2;

    struct Match {
        address creator;
        string matchResultLink;
        uint256 totalPayoutTeamA;
        uint256 totalPayoutTeamB;
        uint256 totalPayoutDraw;
        uint256 totalCollected;
        MatchResult result;
        MatchState state;
        bool exists;
        MatchInfo matchInfo;
    }

    // Match base Info
    struct MatchInfo {
        uint32 oddsTeamA;
        uint32 oddsTeamB;
        uint32 oddsDraw;
        uint256 startAt;
        AssetType assetType;
        address payToken;
        uint256 initOddsTeamA;
        uint256 initOddsTeamB;
        uint256 initOddsDraw;
    }

    // NFT issued to winner
    struct SmartAsset {
        address owner;
        uint256 matchId;
        MatchResult matchResult;
        uint256 initialValue;
        uint8 accruedInterest;
        AssetType assetType;
        address payToken;
    }

    struct PayAsset {
        AssetType assetType;
        address payToken;
        uint256 payValue;
    }
}

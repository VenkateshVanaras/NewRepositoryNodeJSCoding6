const express = require("express");
const sqlite3 = require("sqlite3");
const path = require("path");
const { open } = require("sqlite");

const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "cricketMatchDetails.db");
let database = null;

const initializeAndDbServer = async () => {
  try {
    database = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is Running at http://localhsot:3000/");
    });
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};
initializeAndDbServer();
const convertPlayerObToResponseOb = (Object) => {
  return {
    playerId: Object.player_id,
    playerName: Object.player_name,
  };
};

const convertMatchObToResponseOb = (matchOb) => {
  return {
    matchId: matchOb.match_id,
    match: matchOb.match,
    year: matchOb.year,
  };
};

// Returns list of players in player's list
app.get("/players", async (request, response) => {
  const playersQuery = `
        SELECT * FROM player_details;
    `;
  const playerArray = await database.all(playersQuery);
  response.send(
    playerArray.map((eachPlayer) => convertPlayerObToResponseOb(eachPlayer))
  );
});

// Returns a specific player based on the player ID
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playersQuery = `
            SELECT 
            player_id AS playerId,
            player_name AS playerName

            FROM 
            player_details
            WHERE player_id = ${playerId};
        `;
  const player = await database.get(playersQuery);
  response.send(player);
});
// Updates the details of a specific player based on the player ID
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerDetails = request.body;
  const { playerName } = playerDetails;
  const playersQuery = `
            UPDATE 
                player_details
            SET 
                player_name = '${playerName}'
            WHERE player_id = ${playerId};
        `;
  const playerArray = await database.run(playersQuery);
  response.send("Player Details Updated");
});

//Returns the match details of a specific match

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const matchQuery = `
            SELECT * FROM match_details
            WHERE match_id = ${matchId};
        `;
  const matchArray = await database.get(matchQuery);
  response.send(convertMatchObToResponseOb(matchArray));
});

// Returns a list of all the matches of a player
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const playerMatchQuery = `

        SELECT 
        match_id AS matchId,
        match,
        year
        FROM player_match_score NATURAL JOIN match_details
        WHERE 
        player_id = ${playerId};`;

  const matchArray = await database.all(playerMatchQuery);
  response.send(matchArray);
});
//Returns a list of players of a specific match

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const playerMatchQuery = `

        SELECT 
        player_id AS playerId,
        player_name  AS playerName
        
        FROM player_match_score NATURAL JOIN player_details
        WHERE 
        match_id = ${matchId};`;

  const matchArray = await database.all(playerMatchQuery);
  response.send(matchArray);
});
// Returns the statistics of the total score, fours,
//sixes of a specific player based on the player ID
app.get("/players/:playerId/playerScores/", async (request, response) => {
  const { playerId } = request.params;
  const playerMatchQuery = `
        SELECT 

        player_details.player_id AS playerId,
        player_details.player_name AS playerName,
        SUM(player_match_score.score) AS totalScore,
        SUM(player_match_score.fours) AS totalFours,
        SUM(sixes) AS totalSixes
        
        FROM 

        player_details INNER JOIN player_match_score ON player_details.player_id = player_match_score.player_id
        
        WHERE 

        player_details.player_id = ${playerId};`;

  const matchArray = await database.get(playerMatchQuery);
  response.send(matchArray);
});

module.exports = app;

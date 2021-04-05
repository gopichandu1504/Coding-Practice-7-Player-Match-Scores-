const express = require("express");
const path = require("path");

const { open } = require("sqlite");

const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "cricketMatchDetails.db");
let db = null;
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Started at http://localhost:3000");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const convertPlayerDbObjectToResponseObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

const convertMatchDbObjectToResponseObject = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

//API 1

app.get("/players/", async (request, response) => {
  const allPlayersQuery = `
    select
    *
    from
    player_details;`;
  const players = await db.all(allPlayersQuery);
  response.send(
    players.map((eachPlayer) =>
      convertPlayerDbObjectToResponseObject(eachPlayer)
    )
  );
});

//API 2

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `
    select *
    from
    player_details
    where
    player_id=${playerId};
    `;
  const player = await db.get(getPlayerQuery);
  response.send(convertPlayerDbObjectToResponseObject(player));
});

//API 3

app.put("/players/:playerId", async (request, response) => {
  const { playerId } = request.params;
  const playerDetails = request.body;
  const { playerName } = playerDetails;
  const updatePlayerQuery = `
    update
    player_details
    set
    player_name='${playerName}'
    where player_id=${playerId};
    `;
  await db.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

//API 4

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const matchDetailsQuery = `
    select
    *
    from match_details
    where
    match_id=${matchId};
    `;
  const match = await db.get(matchDetailsQuery);
  response.send(convertMatchDbObjectToResponseObject(match));
});

//API 5

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const playerMatchDetails = `
    select * from player_match_score
   natural join
    match_details
    where player_id=${playerId};
    `;

  const matchDetails = await db.all(playerMatchDetails);
  response.send(
    matchDetails.map((match) => convertMatchDbObjectToResponseObject(match))
  );
});

//API 6

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const playersDetailsOfAMatch = `
    select 
     *
    from 
    player_match_score
   natural join
   player_details
    where match_id=${matchId};
  `;
  const players = await db.all(playersDetailsOfAMatch);
  response.send(
    players.map((player) => convertPlayerDbObjectToResponseObject(player))
  );
});

//API 7

app.get("/players/:playerId/playerScores/", async (request, response) => {
  const { playerId } = request.params;
  const playerStats = `
    select 
    player_id,
    player_name,
    SUM(score),
    SUM(fours),
    SUM(sixes)
    from player_match_score
   natural join player_details
    where player_id=${playerId};
    `;
  const stats = await db.get(playerStats);
  response.send({
    playerID: stats["player_id"],
    playerName: stats["player_name"],
    totalScore: stats["SUM(score)"],
    totalFours: stats["SUM(fours)"],
    totalSixes: stats["SUM(sixes)"],
  });
});

module.exports = app;

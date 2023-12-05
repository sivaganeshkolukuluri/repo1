const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const databasePath = path.join(__dirname, "covid19India.db");

const app = express();

app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3006, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();
const stc = (obj) => {
  return {
    stateId: obj.state_id,
    stateName: obj.state_name,
    population: obj.population,
  };
};

app.get("/state/", async (request, response) => {
  const query = `
    SELECT * FROM state ORDER BY state_id`;
  const arry = await database.all(query);
  const res = arry.map((each) => {
    return stc(each);
  });
  response.send(res);
});

app.get("/state/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const query2 = `
    SELECT * FROM state WHERE state_id = ${stateId};`;
  const array = await database.get(query2);
  response.send(array);
});

app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const query = `
     INSERT INTO 
     district (district_name , state_id, cases, cured, active, deaths)
     VALUES ( '${districtName}',
     ${stateId},
     ${cases},
     ${cured},
     ${active},
     ${deaths});`;
  await database.run(query);
  response.send("District Successfully Added");
});

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const query = `
    SELECT * FROM district WHERE district_id = ${districtId};`;
  const obj = await database.get(query);
  response.send(obj);
});

app.delete("/districts/:districtId/", async (request, response) => {
  const districtId = request.paramas;
  const query = `
    DELETE FROM district WHERE district_id = ${districtId};`;
  response.send("District Removed");
});

app.put("/districts/:districtId/", async (request, response) => {
  const districtId = request.paramas;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const query = `
  UPDATE 
    district 
  SET 
    district_name = '${districtName}',
                    state_id = ${stateId},
                    cases = ${cases},
                    cured = ${cured},
                    active = ${active},
                    deaths = ${deaths};`;
  await database.run(query);
  response.send("District Details Updated");
});

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const query = `SELECT 
        SUM(cases),
        SUM(cured),
        SUM(active),
        SUM(deaths)
    FROM 
        district
    WHERE 
        state_id = ${stateId};`;
  const stats = await database.get(query);
  console.log(stats);

  response.send({
    totalCases: stats["SUM(cases)"],
    totalCures: stats["SUM(cured)"],
    totalActive: stats["SUM(active)"],
    totalDeaths: stats["SUM(deaths)"],
  });
});
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictIdQuery = `
    select state_id from district
    where district_id = ${districtId};
    `; //With this we will get the state_id using district table
  const getDistrictIdQueryResponse = await database.get(getDistrictIdQuery);
  const getStateNameQuery = `
    select state_name as stateName from state
    where state_id = ${getDistrictIdQueryResponse.state_id};
    `; //With this we will get state_name as stateName using the state_id
  const getStateNameQueryResponse = await database.get(getStateNameQuery);
  response.send(getStateNameQueryResponse);
});

module.export = app;

// const fetch = require("node-fetch");
const express = require("express");
const axios = require("axios");
const redis = require("redis");

const PORT = process.env.PORT || 5000;
const REDIS_PORT = process.env.REDIS_PORT || 6379;

const client = redis.createClient(REDIS_PORT);

const app = express();

// set response
function setResponse(username, repos) {
  return `<h2>${username} has ${repos} github repos</h2>`;
}

// function that requests github for a user's repos
async function getRepos(req, res, next) {
  try {
    console.log("Fetching data...");

    const { username } = req.params;

    const response = await axios(`https://api.github.com/users/${username}`);

    const data = response.data;
    // console.log(data);

    const repos = data.public_repos;

    // set data in redis
    client.SETEX(username, 3600, repos);

    res.status(200).send(setResponse(username, repos));
  } catch (err) {
    console.error(err);
    // res.status(500);
    next(err);
  }
}

// cache middleware
function cache(req, res, next) {
  const { username } = req.params;
  client.get(username, (err, data) => {
    if (err) throw err;

    if (data !== null) {
      console.log("Data was found in redis");
      res.status(200).send(setResponse(username, data));
    } else {
      console.log("Data was not found in redis");
      next();
    }
  });
}

app.get("/repos/:username", cache, getRepos);

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});

"use strict";

const express = require("express");
const app = express();
const server = require("http").createServer(app);
const io = require("socket.io")(server);
const redisClient = require("redis").createClient();
const querystring = require("querystring");
const bodyParser = require("body-parser");

//URL shortener
let googleUrl = require("google-url");
googleUrl = new googleUrl({ key: "AIzaSyDJGdPIZSgoDjYijfRFRY6OvXmqjnxUVlY" });

googleUrl.shorten("http://goo.gl/BzpZ54", function(err, longUrl) {
  // longUrl should be http://bluerival.com/
});

app.use(bodyParser.urlencoded({ extended: false }));

app.use(
  "/socket.io",
  express.static(__dirname + "node_modules/socket.io-client/dist/")
);

redisClient.setnx("count", 0);

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

app.post("/postform", (req, res) => {
  let shortenUrl = "test";
  googleUrl.shorten(req.body.userURL, (err, shortUrl) => {
    if (err) {
      return err;
    }
    console.log(shortUrl);
    shortenUrl = shortUrl;
  });
  console.log(shortenUrl);
  redisClient.hmset(
    "table",
    "shortUrl",
    shortenUrl,
    "longUrl",
    req.body.userURL,
    (error, result) => {
      if (error) res.send("Error: " + error);
    }
  );
  res.redirect("/");
});

//Total count
io.on("connection", client => {
  console.log("hello world");
  client.on("visitor-count", () => {
    console.log("client listener");
    redisClient.incr("visitor-count", (err, count) => {
      io.emit("new count", count);
    });
  });
});

server.listen(3000);

/*
io.on("connection", client => {
  redisClient.get("visitor-count", (err, count) => {
    console.log(count);
    client.emit("new count", count); //server is emitting data back to client via new count event
  });


  });*/

//emit visitor-count from client. Client emits
//Server catches it, emits to client. set up listener on client. Once server updates
//Client catches it. once receive data, update html when appending

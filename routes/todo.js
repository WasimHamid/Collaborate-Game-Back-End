var express = require("express");
var router = express.Router();

let db;

const mongodb = require("mongodb");

let uri =
  "mongodb+srv://appservice:apps3rv1c3@cluster0-k3ydo.mongodb.net/todo?retryWrites=true";
function connect(database) {
  return mongodb.MongoClient.connect(uri).then(client => {
    console.log("Connected to Mongo DB");
    return client.db(database);
  });
}

router.post("/", (req, res, next) => {
  let tasks = db.collection("tasks");
  if (typeof req.body.info !== "string") {
    return res.status(422).json({ error: "Write a task" });
  }
  const { info } = req.body;
  const newInfo = {
    info
  };
  tasks.insert(data, (err, result) => {
    if (err) throw err;

    res.status(201).json({ payload: result });
  });
});

connect("test").then(database => {
  db = database;
});

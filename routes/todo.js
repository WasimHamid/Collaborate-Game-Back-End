var express = require("express");
var connect = require("./connect");
var router = express.Router();

let db;

// router.get("/:taskTitle", (req, res, next) => {
//   const { taskTitle } = req.params;
//   let tasks = db.collection("tasks");

//   tasks.find({ taskTitle }).toArray((err, todo) => {
//     if (err) {
//       return res.status(500).json({ error: err, message: "Try again" });
//     }

//     todo.forEach(function(doc) {
//       //console.log(doc);
//       res.json({
//         payload: todo[0]
//       });
//     });

//     //connect("tasks").then(database => {
//     // db = database;
//     //});
//   });
// });

router.post("/", (req, res, next) => {
  let tasks = db.collection("tasks");
  if (typeof req.body.taskTitle !== "string") {
    return res.status(422).json({ error: "Write a task" });
  }

  console.log(req.body);
  const taskTitle = req.body.taskTitle;

  const newTaskTitle = {
    taskTitle
  };

  console.log(newTaskTitle);

  tasks.insert(newTaskTitle, (err, result) => {
    if (err) throw err;

    res.status(201).json({ payload: result }); //returning the first item from postman in the ops section
  });
});

connect("tasks").then(database => {
  db = database;
});

module.exports = router;

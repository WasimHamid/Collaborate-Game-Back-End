const mongodb = require("mongodb");

let uri =
  "mongodb+srv://appservice:apps3rv1c3@cluster0-k3ydo.mongodb.net/todo?retryWrites=true";
function connect(database) {
  return mongodb.MongoClient.connect(uri).then(client => {
    console.log("Connected to Mongo DB");
    return client.db(database);
  });
}

module.exports = connect;

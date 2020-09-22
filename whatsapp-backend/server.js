import express from "express";
import mongoose from "mongoose";
import Messages from "./dbMessages.js";
import cors from "cors";

import Pusher from "pusher";

const app = express();
const port = process.env.PORT || 9000;

const pusher = new Pusher({
  appId: "1069618",
  key: "7112fef86f698fe77c83",
  secret: "58eb6acb304c948e516a",
  cluster: "ap2",
  encrypted: true,
});

const db = mongoose.connection;

db.once("open", () => {
  console.log("DB connected");

  const msgCollection = db.collection("messagecontents");
  const changeStream = msgCollection.watch();
  changeStream.on("change", (change) => {
    console.log("A change occured", change);

    if (change.operationType === "insert") {
      const messageDetails = change.fullDocument;
      pusher.trigger("messages", "inserted", {
        name: messageDetails.name,
        message: messageDetails.message,
        timestamp: messageDetails.timestamp,
      });
    } else {
      console.log("Error triggering pusher");
    }
  });
});

const connectionUrl =
  "mongodb+srv://admin:asil101997@cluster0.kjgkh.mongodb.net/whatsappdb?retryWrites=true&w=majority";
mongoose.connect(connectionUrl, {
  useCreateIndex: true,
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.use(express.json());
app.use(cors());

app.get("/", (req, res) => res.status(200).send("hello world"));

app.post("/messages/new", (req, res) => {
  const dbMessage = req.body;

  Messages.create(dbMessage, (err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(201).send(`new message created; \n ${data}`);
    }
  });
});

app.get("/messages/sync", (req, res) => {
  Messages.find((err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(200).send(data);
    }
  });
});

app.listen(port, () => console.log(`Listening on localhost: ${port}`));

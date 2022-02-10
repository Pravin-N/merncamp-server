import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import { readdirSync } from "fs";

const morgan = require("morgan");
require("dotenv").config();

const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http, {
  cors: {
    origin: process.env.CLIENT_URL,
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-type"],
  },
});

// db
mongoose
  .connect(process.env.DATABASE, {
    useNewUrlParser: true,
    // useFindAndModify: false,
    useUnifiedTopology: true,
    // useCreateIndex: true,
  })
  .then(() => console.log("DB Connected"))
  .catch((err) => console.log("DB Connection Error: ", err));

// middleware
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: [process.env.CLIENT_URL],
  })
);

// auto load routes
readdirSync("./routes").map((r) => app.use("/api", require(`./routes/${r}`)));

// socket io
// io.on("connect", (socket) => {
//   // console.log("SOCKET.IO", socket.id);
//   socket.on("send-message", (message) => {
//     // console.log("new message recieved => ", message);
//     socket.broadcast.emit("receive-message", message);
//   });
// });

io.on("connect", (socket) => {
  // console.log("SOCKET.IO", socket.id);
  socket.on("new-post", (newPost) => {
    // console.log("socketio new post recieved => ", newPost);
    socket.broadcast.emit("new-post", newPost);
  });
});

const port = process.env.PORT || 8000;

http.listen(port, () => console.log(`Server running on port ${port}`));

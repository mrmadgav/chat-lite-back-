const mongoose = require("mongoose");
require("dotenv").config();
const prettyDate2 = require("./helpers/time");
const express = require("express");
const app = express();
const cors = require("cors");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({ credentials: true, origin: "https://chat-lite-inky.vercel.app" })
);

const socketIO = require("socket.io");

const { PORT, DB_HOST } = process.env;

const server = express()
  .use(app)
  .listen(PORT, () => console.log(`Listening Socket on ${PORT}`));

const io = socketIO(server, { transports: ["websocket"] });

io.on("connection", (socket) => {
  console.info("Socket connected", socket.id);
  socket.broadcast.emit("user:join", socket.id);

  socket.on("typing", (data) => {
    socket.broadcast.emit("userTyping", data);
  });
  socket.on("stopTyping", () => {
    socket.broadcast.emit("userStoppedTyping");
  });

  socket.on("connect to room", (roomId) => {
    socket.join(roomId);
    console.log(socket.rooms);
  });
});

function getSocketIo() {
  return io;
}
module.exports.getSocketIo = getSocketIo;
module.exports.io = io;

const { userApi } = require("./api/userApi");
app.use("/", userApi);

app.use((err, _, res, __) => {
  return res.status(500).json({
    status: "fail",
    code: 500,
    message: err.message,
  });
});

const dbConnection = mongoose.connect(DB_HOST, {
  useNewUrlParser: true,
  useFindAndModify: false,
  useCreateIndex: true,
  useUnifiedTopology: true,
});

dbConnection
  .then(() => {
    console.info("DB connect");
  })
  .catch((err) => {
    console.error(err);
  });

const mongoose = require("mongoose");
require("dotenv").config();
const prettyDate2 = require("./helpers/time");
const express = require("express");
const app = express();
const cors = require("cors");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({ credentials: true, origin: "https://chat-lite-two.vercel.app" })
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

  socket.on("message:send", (data) => {
    const dateMessage = prettyDate2();
    const { nickname, text, id } = data;
    const newData = { nickname, text, id, dateMessage };
    socket.emit("message:fromServer", newData);
  });

  socket.on("typing", (data) => {
    const { user, typing } = data;
    socket.emit("userTyping", user, typing);
  });
  socket.on("stopTyping", () => {
    socket.emit("userStoppedTyping");
  });
  socket.on("message:delete", (id) => {
    socket.emit("DeletingMessage", id);
    // socket.broadcast.emit("DeletingMessage", id);
  });
  socket.on("message:edited", () => {
    socket.emit("User edit message");
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

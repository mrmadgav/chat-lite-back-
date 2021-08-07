const express = require("express");
const app = express();
const cors = require("cors");
const { UserModel } = require("./models");
const prettyDate2 = require("./helpers/time");

app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.options("https://chat-lite-two.vercel.app", cors());
const mongoose = require("mongoose");
require("dotenv").config();

const http = require("http").createServer(app);

const io = require("socket.io")(http);

http.listen("https://chat-lite-two.vercel.app", function () {
  console.info("Server is running");
});

io.on("connection", (socket) => {
  console.log("Client connected");
  socket.on("disconnect", () => console.log("Client disconnected"));
});

io.on("connection", (socket) => {
  console.info("Socket connected", socket.id);
  // socket.broadcast.emit("user:join", socket.id);

  io.on("message:send", (data) => {
    const dateMessage = prettyDate2();
    const { nickname, text, id } = data;
    const newData = { nickname, text, id, dateMessage };
    console.log("получено сообщение от юзера");
    socket.broadcast.emit("message:fromServer", newData);
    socket.emit("message:fromServer", newData);
  });

  socket.on("message:send", (data) => {
    console.log("DATA", data);
  });

  socket.on("typing", (data) => {
    const { user, typing } = data;
    socket.broadcast.emit("userTyping", user, typing);
  });
  socket.on("stopTyping", () => {
    socket.broadcast.emit("userStoppedTyping");
  });
  socket.on("message:delete", (id) => {
    socket.emit("DeletingMessage", id);
    socket.broadcast.emit("DeletingMessage", id);
  });
});

function getSocketIo() {
  return io;
}
module.exports.getSocketIo = getSocketIo;

const { userApi } = require("./api/userApi");
app.use("/", userApi);

app.use((err, _, res, __) => {
  return res.status(500).json({
    status: "fail",
    code: 500,
    message: err.message,
  });
});

const { PORT, DB_HOST } = process.env;

const dbConnection = mongoose.connect(DB_HOST, {
  useNewUrlParser: true,
  useFindAndModify: false,
  useCreateIndex: true,
  useUnifiedTopology: true,
});

dbConnection
  .then(() => {
    console.info("DB connect");
    app.listen(PORT || 3000, () => {
      console.info("server running");
    });
  })
  .catch((err) => {
    console.error(err);
  });

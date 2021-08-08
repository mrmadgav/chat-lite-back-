// const express = require("express");
// const app = express();
const cors = require("cors");
const { UserModel } = require("./models");
const prettyDate2 = require("./helpers/time");

const { PORT, DB_HOST } = process.env;

const express = require("express");
const app = express();

// app.use(function (req, res, next) {
//   res.header("Access-Control-Allow-Origin", "*");
//   res.header("Access-Control-Allow-Headers", "X-Requested-With");
//   next();
// });

app.listen(PORT, () => console.log(`Listening on ${PORT}`));

const http = require("http").createServer(app);
app.use(cors());
// const io = require("socket.io")(http);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// // app.options("https://chat-lite-back.herokuapp.com/", cors());
const mongoose = require("mongoose");
require("dotenv").config();

// const http = require("http").createServer(app);

// const io = require("socket.io")(http);

// const io = require("socket.io")(http, {
//   cors: {
//     origin: "https://chat-lite-two.vercel.app/",
//     methods: ["GET", "POST"],
//     credentials: true,
//   },
// });

const io = require("socket.io")(http, {
  cors: {
    origin: "https://chat-lite-two.vercel.app/",
    methods: ["GET", "POST"],
    allowedHeaders: ["content-type"],
  },
});

io.on("connection", (socket) => {
  console.log("SOCKET", socket);
  console.info("Socket connected", socket.id);
  // socket.broadcast.emit("user:join", socket.id);

  socket.on("message:send", (data) => {
    const dateMessage = prettyDate2();
    const { nickname, text, id } = data;
    const newData = { nickname, text, id, dateMessage };
    socket.broadcast.emit("message:fromServer", newData);
    socket.emit("message:fromServer", newData);
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

const dbConnection = mongoose.connect(DB_HOST, {
  useNewUrlParser: true,
  useFindAndModify: false,
  useCreateIndex: true,
  useUnifiedTopology: true,
});

dbConnection
  .then(() => {
    console.info("DB connect");
    // app.listen(PORT || 3000, () => {
    //   console.info("server running");
    // });
  })
  .catch((err) => {
    console.error(err);
  });

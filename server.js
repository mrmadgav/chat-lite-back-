// const express = require("express");
// const app = express();
// const cors = require("cors");
// const { UserModel } = require("./models");
// const prettyDate2 = require("./helpers/time");

// const { PORT, DB_HOST } = process.env;

// // app.use(function (req, res, next) {
// //   res.header("Access-Control-Allow-Origin", "*");
// //   res.header("Access-Control-Allow-Headers", "X-Requested-With");
// //   next();
// // });

// app.use(
//   cors({ credentials: true, origin: "https://chat-lite-two.vercel.app" })
// );

// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// app.listen(PORT, () => console.log(`Listening on ${PORT}`));

// const http = require("http").createServer(app);

// app.options("https://chat-lite-two.vercel.app", cors());

// const mongoose = require("mongoose");
// require("dotenv").config();

// // const io = require("socket.io")(http);

// const io = require("socket.io")(http, {
//   cors: {
//     origin: "https://chat-lite-two.vercel.app",
//     methods: ["GET", "POST"],
//     allowedHeaders: ["my-custom-header"],
//     credentials: true,
//   },
// });

// // const io = require("socket.io")(http, {
// //   cors: {
// //     origin: "https://chat-lite-two.vercel.app/",
// //     methods: ["GET", "POST"],
// //     allowedHeaders: ["content-type"],
// //   },
// // });
const mongoose = require("mongoose");
require("dotenv").config();
const { UserModel } = require("./models");
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
  // console.log("SOCKET", socket);
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
  socket.on("message:edited", () => {
    socket.broadcast.emit("User edit message");
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

const { UserModel } = require("../../models");
const { historyModel } = require("../../models");
const prettyDate2 = require("../../helpers/time");
const cloudinary = require("cloudinary").v2;
const { nanoid } = require("nanoid");
// const io = require("../../server");

cloudinary.config({
  cloud_name: "madgav",
  api_key: "269245158734516",
  api_secret: "TTwmAL5AeH2f-K76rCWWPBKccw8",
  secure: true,
});

const addAvatar = (file) => {
  return fs.writeFile(file);
};

const createUser = async ({ email, password, nickname }) => {
  try {
    await UserModel.create({ email, password, nickname });
  } catch (error) {
    console.error(error);
  }
};

const findUserByEmail = async (email) => {
  try {
    const result = await UserModel.findOne({ email });
    return result;
  } catch (err) {
    return console.error(err.message);
  }
};

const findUserByToken = async (token) => {
  try {
    const result = await UserModel.findOne({ token });
    return result;
  } catch (err) {
    return console.error(err.message);
  }
};

const cloudAvatar = (userId, file) => {
  cloudinary.uploader.upload(
    file,
    {
      folder: "Avatars",
      width: 250,
      crop: "fill",
    },
    async function (error, result) {
      const { secure_url } = result;
      const avatar = await UserModel.findOneAndUpdate(
        { _id: userId },
        {
          urlAvatar: secure_url,
        }
      );
    }
  );
};

const updateUserToken = async (id, token) => {
  try {
    const result = await UserModel.updateOne({ _id: id }, { token });
    return result;
  } catch (err) {
    return console.error(err.message);
  }
};

const setOnline = async (id, onLine) => {
  try {
    const result = await UserModel.findOneAndUpdate(
      { _id: id },
      { isOnline: onLine }
    );
    return result;
  } catch (err) {
    return console.error(err.message);
  }
};

const getMessages = async (userId) => {
  if (userId) {
    try {
      const result = await UserModel.findById(userId);
      return result.messages;
    } catch (e) {
      console.error(e);
    }
  }
};

const getuserNick = async (userId) => {
  if (userId) {
    try {
      const result = await UserModel.findById(userId);
      return result.nickname;
    } catch (e) {
      console.error(e);
    }
  }
};

const getUsers = async () => {
  try {
    const result = await UserModel.find({}, { nickname: 1, isOnline: 1 });
    return result;
  } catch (e) {
    console.error(e);
  }
};

const fetchMessages = async () => {
  try {
    const result = await historyModel.findOne();
    return result;
  } catch (e) {
    console.error(e);
  }
};

const sendMessage = async (nickname, text, id) => {
  const message = { text: text, date: prettyDate2(), id: id };
  if (nickname) {
    try {
      const result = await UserModel.findOneAndUpdate(
        { nickname: nickname },
        { $push: { messages: message } },
        { new: false }
      );

      !historyModel.findOne() && historyModel.create();
      const toHistory = await historyModel.findOneAndUpdate(
        { _id: "60f16573d79d8bd0cb45deac" },
        { $push: { messages: { ...message, nickname } } },
        { new: false }
      );

      const server = require("../../server");
      const io = server.io;

      io.on("connection", (socket) => {
        socket.on("message:send", (data) => {
          const dateMessage = prettyDate2();
          const { nickname, text, id } = data;
          const newData = { nickname, text, id, dateMessage };
          socket.broadcast.emit("message:fromServer", newData);
        });
      });

      return result, toHistory;
    } catch (e) {
      console.error(e);
    }
  }
};

const deleteMessage = async (id) => {
  try {
    const result = await historyModel.findOneAndUpdate({
      $pull: { messages: { id: id } },
    });
  } catch (e) {
    console.error(e);
  }
};

const updateMessage = async (id, text) => {
  console.log("THIS");

  try {
    const result = await historyModel.updateOne(
      { _id: "60f16573d79d8bd0cb45deac", "messages.id": id },
      { $set: { "messages.$.text": text } }
    );
  } catch (e) {
    console.error(e);
  }
};

module.exports = {
  addAvatar,
  createUser,
  cloudAvatar,
  findUserByEmail,
  updateUserToken,
  getMessages,
  sendMessage,
  findUserByToken,
  getuserNick,
  fetchMessages,
  deleteMessage,
  getUsers,
  setOnline,
  updateMessage,
};

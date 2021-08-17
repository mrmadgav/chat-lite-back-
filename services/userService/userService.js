const { UserModel } = require("../../models");
const { historyModel, privateHistoryModel } = require("../../models");
const prettyDate2 = require("../../helpers/time");
const cloudinary = require("cloudinary").v2;
const { nanoid } = require("nanoid");
// const io = require("../../server");

const server = require("../../server");
const io = server.getSocketIo();

cloudinary.config({
  cloud_name: "madgav",
  api_key: "269245158734516",
  api_secret: "TTwmAL5AeH2f-K76rCWWPBKccw8",
  secure: true,
});

//Функция проверки на перевернутый номер комнаты(важно!)
function reverseRoomId(roomid) {
  const firstPart = roomid.substr(0, roomid.length / 2);
  const secondPart = roomid.substr(roomid.length / 2);
  newStr = [secondPart, firstPart].join("");
  return newStr;
}

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
      width: 100,
      height: 100,
      crop: "fill",
    },
    async function (error, result) {
      const { secure_url } = result;
      const avatarCroppedUrl = secure_url.replace(
        "upload/",
        "upload/c_fill,w_150,h_150/"
      );

      const avatar = await UserModel.findOneAndUpdate(
        { _id: userId },
        {
          urlAvatar: avatarCroppedUrl,
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
    const result = await UserModel.find(
      {},
      { nickname: 1, isOnline: 1, urlAvatar: 1 }
    );
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

const sendMessage = async (nickname, text, id, roomId) => {
  console.log("roomId в НАЧАЛЕ SEND MESSAGE", roomId);
  const message = { text: text, date: prettyDate2(), id: id };
  if (nickname) {
    try {
      roomId = roomId;
      if (!roomId) {
        !historyModel.findOne() && historyModel.create();
        const toHistory = await historyModel.findOneAndUpdate(
          { _id: "60f16573d79d8bd0cb45deac" },
          { $push: { messages: { ...message, nickname } } },
          { new: false }
        );
        return toHistory, io.emit("message:fromServer");
      }
      if (roomId) {
        console.log(
          "ЗАШЛИ В ВЫБОР АЙДИШНИКА КОМНАТЫ, КУДА ОТПРАВЛЯТЬ СООБЩЕНИЕ"
        );
        const result = await privateHistoryModel.findById(roomid);
        console.log("RESULT", result);
        console.log("reverseRoomId(roomid)", reverseRoomId(roomid));
        const toHistory = await privateHistoryModel.findOneAndUpdate(
          { _id: result ? roomId : reverseRoomId(roomid) },
          { $push: { messages: { ...message, nickname } } },
          { new: false }
        );
        return toHistory, io.emit("privateMessage:fromServer");
      }
    } catch (e) {
      console.error(e);
    }
  }
};

const deleteMessage = async (id, roomId) => {
  const result = await privateHistoryModel.findById(roomid);
  try {
    !roomId
      ? await historyModel.findOneAndUpdate({
          $pull: { messages: { id: id } },
        })
      : await privateHistoryModel.findOneAndUpdate(
          { _id: result ? roomId : reverseRoomId(roomid) },
          { $pull: { messages: { id: id } } },
          { new: false }
        );
    return !roomId
      ? io.emit("DeletingMessage")
      : io.emit("PrivateDeletingMessage");
  } catch (e) {
    console.error(e);
  }
};

const updateMessage = async (id, text, roomId) => {
  const result = await privateHistoryModel.findById(roomid);
  try {
    !roomId
      ? await historyModel.updateOne(
          { _id: "60f16573d79d8bd0cb45deac", "messages.id": id },
          { $set: { "messages.$.text": text } }
        )
      : await privateHistoryModel.updateOne(
          { _id: result ? roomId : reverseRoomId(roomid), "messages.id": id },
          { $set: { "messages.$.text": text } }
        );
    return !roomId
      ? io.emit("User edit message")
      : io.emit("User edit private message");
  } catch (e) {
    console.error(e);
  }
};

const uploadImg = (userId, file, nickname, roomId) => {
  cloudinary.uploader.upload(
    file,
    {
      folder: `/files/${userId}`,
    },
    async function (error, result) {
      const { secure_url } = result;
      const imgCroppedUrl = secure_url.replace(
        "upload/",
        "upload/c_fill,w_300/"
      );
      const message = {
        text: imgCroppedUrl,
        date: prettyDate2(),
        id: nanoid(),
      };
      const searchResult = await privateHistoryModel.findById(roomid);
      const toHistory = !roomId
        ? await historyModel.findOneAndUpdate(
            { _id: "60f16573d79d8bd0cb45deac" },
            { $push: { messages: { ...message, nickname } } },
            { new: false }
          )
        : await privateHistoryModel.findOneAndUpdate(
            { _id: searchResult ? roomId : reverseRoomId(roomid) },
            { $push: { messages: { ...message, nickname } } },
            { new: false }
          );
      return (
        searchResult,
        toHistory,
        !roomId
          ? io.emit("message:fromServer")
          : io.emit("privateMessage:fromServer")
      );
    }
  );
};

const fetchPrivateHistory = async (roomid) => {
  if (roomid) {
    const result = await privateHistoryModel.findById(roomid);
    const reverseSearch = await privateHistoryModel.findById(
      reverseRoomId(roomid)
    );
    try {
      let response = null;
      result
        ? (response = result)
        : reverseSearch
        ? (response = reverseSearch)
        : (response = await privateHistoryModel.create({ _id: roomid }));
      return response;
    } catch (e) {
      console.error(e);
    }
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
  uploadImg,
  fetchPrivateHistory,
};

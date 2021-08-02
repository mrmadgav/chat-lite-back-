const { userService } = require("../../services/userService");
const { UserModel } = require("../../models");
const jwt = require("jsonwebtoken");
const fs = require("fs/promises");
const Jimp = require("jimp");

const server = require("../../server");
const io = server.getSocketIo();

const addAvatar = async (req, res, next) => {
  try {
    return res.json({
      status: "success",
      code: 200,
    });
  } catch (err) {
    res.status(500).json({
      message: "Signing up failed, please try again.",
      error: error,
    });
  }
};

const cloudAvatar = async (req, res, next) => {
  try {
    const token = String(req.body.token);
    const incomeToken = req.headers.authorization.slice(7);
    const user = await userService.findUserByToken(incomeToken);
    const filePath = req.file.path;

    async function resize() {
      // Read the image.
      const image = await Jimp.read(filePath);
      await image.crop(20, 20, 40, 100);
      await image.writeAsync(`tmp/ava_60x60.png`);
    }
    resize();
    // console.log(filePath);
    let avatarUrl = await userService.cloudAvatar(user.id, filePath);

    return res.json({
      status: "Success",
      code: 200,
      data: {
        avatarUrl,
      },
    });
  } catch (err) {
    next(err);
  }
};

const createUser = async (req, res, next) => {
  const { email, password, nickname } = req.body;
  const userExist = await UserModel.findOne({ email });
  if (userExist) {
    return res.status(409).json({
      status: "error",
      code: 409,
      message: "Email is already in use",
      data: "Conflict",
    });
  }
  try {
    await userService.createUser({ email, password, nickname });
    res.status(201).json({
      status: "success",
      code: 201,
      data: {
        message: "Registration successful",
        user: email,
        nick: nickname,
      },
    });
  } catch (error) {
    next(error);
  }
};

const SECRET_KEY = process.env.JWT_SECRET;

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await userService.findUserByEmail(email);

    const isPasswordValid = await user?.validPassword(password);

    if (!user || !isPasswordValid) {
      //вернуть потом !isPasswordValid
      return res.json({
        status: "Error",
        code: 501,
        data: "Unauthorized",
        message: "Email or password is wrong",
      });
    }

    const userId = user._id;
    const payload = { userId };
    const token = jwt.sign(payload, SECRET_KEY, { expiresIn: "8h" });
    await userService.updateUserToken(userId, token);

    const onLine = true;
    const _id = user.id;
    await userService.setOnline(_id, onLine);

    const userNick = await userService.getuserNick(userId);
    io.emit("user:login", userNick);

    return res.json({
      status: "Success",
      code: 200,
      data: { token: token, userId: userId, email: email, nickname: userNick },
    });
  } catch (e) {
    next(e);
  }
};

const logout = async (req, res, next) => {
  try {
    const incomeToken = req.headers.authorization.slice(7);
    const id = String(req.body.id);
    const onLine = false;
    await userService.setOnline(id, onLine);
    await userService.updateUserToken(id, null);
    return res.json({
      status: "success",
      code: 200,
      data: "Logout successful",
    });
  } catch (e) {
    next(e);
  }
};

const getMessages = async (req, res, next) => {
  try {
    const userId = String(req.body.user._id);
    const result = await userService.getMessages(userId);
    return res.json({
      status: "success",
      code: 200,
      data: result,
    });
  } catch (e) {
    next(e);
  }
};

const getUsers = async (req, res, next) => {
  try {
    const result = await userService.getUsers();
    return res.json({
      status: "success",
      code: 200,
      data: result,
    });
  } catch (e) {
    next(e);
  }
};

const sendMessage = async (req, res, next) => {
  try {
    const nickname = String(req.body.nickname);
    const text = String(req.body.text);
    const id = String(req.body.id);
    const result = await userService.sendMessage(nickname, text, id);

    return res.json({
      status: "success",
      code: 200,
      data: "message have sent",
    });
  } catch (e) {
    next(e);
  }
};

const findUserByToken = async (req, res, next) => {
  try {
    const token = String(req.body.token);
    const incomeToken = req.headers.authorization.slice(7);
    const result = await userService.findUserByToken(incomeToken);
    return res.json({
      status: "success",
      code: 200,
      data: {
        _id: result._id,
        nickname: result.nickname,
        urlAvatar: result.urlAvatar,
      },
    });
  } catch (e) {
    next(e);
  }
};

const fetchMessages = async (req, res, next) => {
  try {
    const result = await userService.fetchMessages();
    return res.json({
      status: "success",
      code: 200,
      data: result,
    });
  } catch (e) {
    next(e);
  }
};

const deleteMessage = async (req, res, next) => {
  try {
    const id = req.body.id;
    const result = await userService.deleteMessage(id);
    return res.json({
      status: "success",
      code: 200,
    });
  } catch (e) {
    next(e);
  }
};

const updateMessage = async (req, res, next) => {
  try {
    console.log(req.body);
    const id = req.body.id;
    const text = req.body.text;
    const result = await userService.updateMessage(id, text);
    return res.json({
      status: "success",
      code: 200,
      data: result,
    });
  } catch (e) {
    next(e);
  }
};

module.exports = {
  addAvatar,
  cloudAvatar,
  createUser,
  login,
  logout,
  getMessages,
  sendMessage,
  findUserByToken,
  fetchMessages,
  deleteMessage,
  getUsers,
  updateMessage,
};

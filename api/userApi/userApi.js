const express = require("express");
const quard = require("../../helpers/guard");
const path = require("path");
const multer = require("multer");
const { verifyToken } = require("../../helpers/tokenAuth");
const upload = require("../../helpers/upload");
const { userCtrl } = require("../../controllers/userCtrl");

const router = express.Router();

router.post("/registration", express.json(), userCtrl.createUser);

router.post("/login", express.json(), userCtrl.login);
router.post("/logout", verifyToken, express.json(), userCtrl.logout);

router.get("/hello", express.json(), userCtrl.hello);

router.post(
  "/user/messages/send",
  verifyToken,
  express.json(),
  userCtrl.sendMessage
);

router.get("/user/messages", verifyToken, express.json(), userCtrl.getMessages);

router.get("/users", verifyToken, express.json(), userCtrl.getUsers);

router.get(
  "/users/current",
  verifyToken,
  express.json(),
  userCtrl.findUserByToken
);

router.get("/messages/", userCtrl.fetchMessages);

router.patch(
  "/avatars",
  verifyToken,
  upload.single("avatar"),
  userCtrl.cloudAvatar
);

router.post(
  "/message/delete",
  // verifyToken,
  express.json(),
  userCtrl.deleteMessage
);

router.post(
  "/message/update",
  // verifyToken,
  express.json(),
  userCtrl.updateMessage
);

router.post("/img?query", verifyToken, upload.single("img"), userCtrl.uploadImg);

router.get("/privateHistory", express.json(), userCtrl.fetchPrivateHistory);

module.exports = router;

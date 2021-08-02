const { Schema, model } = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();
const saltWorkFactor = Number(process.env.SALT_WORK_FACTOR);

const userSchema = new Schema(
  {
    email: {
      type: String,
      default: "",
      required: [true, "Email is required"],
      unique: true,
    },
    password: {
      type: String,
      default: "",
      required: [true, "Password is required"],
    },
    nickname: {
      type: String,
      default: "",
      required: [true, "Name is required"],
      unique: true,
    },
    token: {
      type: String,
      default: "",
    },
    messages: {
      type: Array,
      default: [],
    },
    urlAvatar: {
      type: String,
      default: "",
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
  },
  { versionKey: false, timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }

  const salt = await bcrypt.genSalt(saltWorkFactor);
  this.password = await bcrypt.hash(this.password, salt, null);
  next();
});

userSchema.methods.setPassword = function (password) {
  this.password = bcrypt.hashSync(password, bcrypt.genSaltSync(6));
};

userSchema.methods.validPassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

const userModel = model("user", userSchema);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }

  const salt = await bcrypt.genSalt(saltWorkFactor);
  this.password = await bcrypt.hash(this.password, salt, null);
  next();
});

userSchema.methods.validPassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = userModel;

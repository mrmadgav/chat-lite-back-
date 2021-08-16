const { Schema, model } = require("mongoose");

const privateHistorySchema = new Schema(
  {
    _id: {
      type: String,
      default: "",
      required: true,
      unique: true,
    },

    messages: {
      type: Array,
      default: [],
    },
  },
  { versionKey: false, timestamps: true, _id: false }
);

const privateHistoryModel = model("privateHistory", privateHistorySchema);

module.exports = privateHistoryModel;

const { Schema, model } = require("mongoose");

const historySchema = new Schema(
  {
    messages: {
      type: Array,
      default: [],
    },
  },
  { versionKey: false, timestamps: true }
);

const historyModel = model("message", historySchema);

module.exports = historyModel;

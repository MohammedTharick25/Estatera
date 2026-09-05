const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  type: { type: String, default: "general", trim: true, maxlength: 60 },
  title: { type: String, required: true, trim: true, maxlength: 160 },
  message: { type: String, required: true, maxlength: 1000 },
  link: { type: String, default: "/", maxlength: 500 },
  readAt: { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.models.Notification || mongoose.model("Notification", notificationSchema);

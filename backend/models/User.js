const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true },
  userAgent: { type: String, default: "Unknown device" },
  deviceLabel: { type: String, default: "" },
  ip: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
  lastActiveAt: { type: Date, default: Date.now },
}, { _id: false });

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["user", "admin"], default: "user" },
  image: { type: String, default: "" },
  phone: { type: String, default: "", trim: true, maxlength: 30 },
  favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: "Listings" }],
  isBlocked: { type: Boolean, default: false },
  passwordResetOtpHash: { type: String, default: null },
  passwordResetOtpExpires: { type: Date, default: null },
  passwordResetSessionId: { type: String, default: null },
  passwordResetLastSentAt: { type: Date, default: null },
  sessions: { type: [sessionSchema], default: [] },
}, { timestamps: true });

module.exports = mongoose.models.User || mongoose.model("User", userSchema);

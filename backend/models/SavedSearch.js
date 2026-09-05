const mongoose = require("mongoose");

const savedSearchSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 80 },
  filters: {
    location: { type: String, default: "" },
    type: { type: String, default: "" },
    maxPrice: { type: Number, default: 0, min: 0 },
    radius: { type: Number, default: 0, min: 0 },
    sort: { type: String, default: "newest" },
  },
  alertEnabled: { type: Boolean, default: true },
  alertFrequency: { type: String, enum: ["immediate", "daily", "weekly"], default: "immediate" },
  lastAlertSentAt: { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.models.SavedSearch || mongoose.model("SavedSearch", savedSearchSchema);

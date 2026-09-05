const mongoose = require("mongoose");

const visitSchema = new mongoose.Schema({
  propertyId: { type: mongoose.Schema.Types.ObjectId, ref: "Listings", required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, trim: true, lowercase: true },
  phone: { type: String, required: true, trim: true, maxlength: 30 },
  message: { type: String, default: "", maxlength: 1000 },
  status: { type: String, enum: ["pending", "scheduled", "visited", "cancelled"], default: "pending" },
  scheduledFor: { type: Date, default: null },
  assignedAgent: { type: String, default: "", maxlength: 80 },
  adminNote: { type: String, default: "", maxlength: 1000 },
  feedback: {
    rating: { type: Number, min: 1, max: 5, default: null },
    comment: { type: String, default: "", maxlength: 1000 },
    submittedAt: { type: Date, default: null },
  },
}, { timestamps: true });

module.exports = mongoose.models.Visit || mongoose.model("Visit", visitSchema);

const mongoose = require("mongoose");

const inquirySchema = new mongoose.Schema({
  propertyId: { type: mongoose.Schema.Types.ObjectId, ref: "Listings", default: null },
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, trim: true, lowercase: true },
  subject: { type: String, default: "", trim: true, maxlength: 200 },
  message: { type: String, required: true, maxlength: 2000 },
  status: { type: String, enum: ["new", "in_progress", "resolved"], default: "new" },
  adminNote: { type: String, default: "", maxlength: 1000 },
  date: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.models.Inquiry || mongoose.model("Inquiry", inquirySchema);

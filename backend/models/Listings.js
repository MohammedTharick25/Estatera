const mongoose = require("mongoose");

const listingsSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 180 },
  price: { type: Number, required: true, min: 0 },
  location: { type: String, required: true, trim: true, maxlength: 300 },
  size: { type: String, default: "", trim: true, maxlength: 100 },
  propertyType: { type: String, enum: ["Land", "House", "Apartment"], default: "Land" },
  description: { type: String, default: "", maxlength: 500 },
  images: { type: [String], default: [] },
  videos: { type: [String], default: [] },
  amenities: { type: [String], default: [] },
  featured: { type: Boolean, default: false },
  latitude: { type: Number, default: 0 },
  longitude: { type: Number, default: 0 },
  commission: { type: Number, default: 0, min: 0 },
  status: { type: String, enum: ["Available", "Sold"], default: "Available" },
  lifecycle: { type: String, enum: ["draft", "published", "sold", "archived"], default: "published" },
  isArchived: { type: Boolean, default: false },
  archivedAt: { type: Date, default: null },
  publishedAt: { type: Date, default: null },
  unpublishedAt: { type: Date, default: null },
  views: { type: Number, default: 0, min: 0 },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
}, { timestamps: true });

module.exports = mongoose.models.Listings || mongoose.model("Listings", listingsSchema);

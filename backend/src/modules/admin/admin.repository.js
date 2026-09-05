const Listing = require("../../../models/Listings"); const Visit = require("../../../models/Visit");
exports.countListings = () => Listing.countDocuments(); exports.countVisits = () => Visit.countDocuments(); exports.views = () => Listing.aggregate([{ $group: { _id: null, totalViews: { $sum: "$views" } } }]);
exports.inventory = () => Listing.aggregate([{ $group: { _id: "$status", total: { $sum: "$price" }, count: { $sum: 1 } } }]);
exports.visitMonths = () => Visit.aggregate([{ $group: { _id: { $month: "$createdAt" }, count: { $sum: 1 } } }]);
exports.topListings = () => Listing.find().sort({ views: -1 }).limit(6).select("title views price status"); exports.soldListings = () => Listing.find({ status: "Sold" });
exports.ratings = () => Visit.aggregate([{ $match: { "feedback.rating": { $exists: true, $ne: null } } }, { $group: { _id: null, avgRating: { $avg: "$feedback.rating" }, totalReviews: { $sum: 1 } } }]);

const Listing = require("../../../models/Listings");
const Visit = require("../../../models/Visit");

exports.create = (data) => new Listing(data).save();
exports.findById = (id) => Listing.findById(id);
exports.find = (query, sort) => Listing.find(query).sort(sort);
exports.findPaged = async (query, sort, page, limit) => {
  const [items, total] = await Promise.all([Listing.find(query).sort(sort).skip((page - 1) * limit).limit(limit), Listing.countDocuments(query)]);
  return { items, total };
};
exports.updateById = (id, update) => Listing.findByIdAndUpdate(id, update, { returnDocument: "after" });
exports.incrementViews = (id) => Listing.findByIdAndUpdate(id, { $inc: { views: 1 } });
exports.deleteById = (id) => Listing.findByIdAndDelete(id);
exports.deleteVisitsForProperty = (propertyId) => Visit.deleteMany({ propertyId });

const Visit = require("../../../models/Visit");
exports.create = (data) => new Visit(data).save();
exports.update = (id, update) => Visit.findByIdAndUpdate(id, update, { returnDocument: "after" });
exports.findAll = () => Visit.find().populate("propertyId", "title location").sort({ createdAt: -1 });
exports.removeMany = (query) => Visit.deleteMany(query);
exports.findByUser = (userId) => Visit.find({ userId }).populate({ path: "propertyId", select: "title location images" }).sort({ createdAt: -1 });

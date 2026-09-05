const Inquiry = require("../../../models/Inquiry");
exports.create = (data) => new Inquiry(data).save();
exports.findAll = () => Inquiry.find().populate("propertyId", "title").sort({ date: -1 });
exports.update = (id, data) => Inquiry.findByIdAndUpdate(id, data, { returnDocument: "after" });

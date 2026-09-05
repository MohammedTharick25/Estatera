const User = require("../../../models/User");
exports.findById = (id) => User.findById(id);
exports.findByIdAndUpdate = (id, data) => User.findByIdAndUpdate(id, data, { returnDocument: "after" });
exports.findAll = () => User.find().select("-password").sort({ createdAt: -1 });
exports.findFavorites = (id) => User.findById(id).populate("favorites");
exports.deleteById = (id) => User.findByIdAndDelete(id);

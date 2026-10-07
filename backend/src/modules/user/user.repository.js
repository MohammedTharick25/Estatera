const User = require("../../../models/User");
exports.findById = (id) => User.findById(id);
exports.emailInUse = (email, id) => User.exists({ email, _id: { $ne: id } });
exports.findByIdAndUpdate = (id, data) => User.findByIdAndUpdate(id, data, { returnDocument: "after", runValidators: true });
exports.findAll = () => User.find().select("-password").sort({ createdAt: -1 });
exports.findFavorites = (id) => User.findById(id).populate("favorites");
exports.deleteById = (id) => User.findByIdAndDelete(id);

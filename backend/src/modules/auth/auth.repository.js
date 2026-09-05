const User = require("../../../models/User");
exports.findByEmail = (email) => User.findOne({ email });
exports.create = (data) => new User(data).save();
exports.findForPasswordReset = (email) => User.findOne({ email: email.toLowerCase() });
exports.findById = (id) => User.findById(id);
exports.findSessions = (id) => User.findById(id).select("sessions");

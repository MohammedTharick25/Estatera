const Notification = require("../../../models/Notification");

exports.create = (data) => new Notification(data).save();

exports.createAndEmit = async (app, data) => {
  const notification = await exports.create(data);
  app?.get("io")?.to(data.userId.toString()).emit("user_notification", notification);
  return notification;
};

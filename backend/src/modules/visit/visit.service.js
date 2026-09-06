const repository = require("./visit.repository");
const Visit = require("../../../models/Visit");
const notifications = require("../notification/notification.service");
exports.create = (body) => repository.create({ propertyId: body.propertyId, userId: body.userId, name: body.name, email: body.email, phone: body.phone, message: body.message });
exports.updateStatus = (id, { status, scheduledFor, adminNote, assignedAgent }) => {
  const update = { status };
  if (scheduledFor !== undefined) update.scheduledFor = scheduledFor || null;
  if (adminNote !== undefined) update.adminNote = adminNote;
  if (assignedAgent !== undefined) update.assignedAgent = String(assignedAgent).slice(0, 80);
  if (status === "purchased") update.purchaseConfirmedAt = new Date();
  return repository.update(id, update);
};
exports.getAdminVisits = async () => { const visits = await repository.findAll(); const orphanIds = visits.filter((visit) => !visit.propertyId).map((visit) => visit._id); if (orphanIds.length) await repository.removeMany({ _id: { $in: orphanIds } }); return visits.filter((visit) => visit.propertyId); };
exports.getUserVisits = async (userId) => (await repository.findByUser(userId)).filter((visit) => visit.propertyId !== null);
exports.saveFeedback = (id, { rating, comment }) => repository.update(id, { feedback: { rating, comment, submittedAt: new Date() } });
exports.sendUpcomingReminders = async (app) => {
  const now = new Date(); const cutoff = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const visits = await Visit.find({ status: "scheduled", scheduledFor: { $gte: now, $lte: cutoff }, reminderSentAt: null }).populate("propertyId", "title");
  await Promise.all(visits.map(async (visit) => {
    await notifications.createAndEmit(app, { userId: visit.userId, type: "visit_reminder", title: "Visit reminder", message: `Your viewing for ${visit.propertyId?.title || "the property"} is within 24 hours.`, link: "/profile", eventAt: visit.scheduledFor });
    visit.reminderSentAt = new Date(); await visit.save();
  }));
};

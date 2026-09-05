const repository = require("./visit.repository");
exports.create = (body) => repository.create({ propertyId: body.propertyId, userId: body.userId, name: body.name, email: body.email, phone: body.phone, message: body.message });
exports.updateStatus = (id, { status, scheduledFor, adminNote, assignedAgent }) => {
  const update = { status };
  if (scheduledFor !== undefined) update.scheduledFor = scheduledFor || null;
  if (adminNote !== undefined) update.adminNote = adminNote;
  if (assignedAgent !== undefined) update.assignedAgent = String(assignedAgent).slice(0, 80);
  return repository.update(id, update);
};
exports.getAdminVisits = async () => { const visits = await repository.findAll(); const orphanIds = visits.filter((visit) => !visit.propertyId).map((visit) => visit._id); if (orphanIds.length) await repository.removeMany({ _id: { $in: orphanIds } }); return visits.filter((visit) => visit.propertyId); };
exports.getUserVisits = async (userId) => (await repository.findByUser(userId)).filter((visit) => visit.propertyId !== null);
exports.saveFeedback = (id, { rating, comment }) => repository.update(id, { feedback: { rating, comment, submittedAt: new Date() } });

const service = require("./visit.service");
const notifications = require("../notification/notification.service");
exports.create = async (req, res) => { try { const visit = await service.create(req.body); req.app.get("io").to("admins").emit("admin_notification", { message: `New visit request from ${visit.name}`, type: "new_visit", visitId: visit._id }); res.status(201).json(visit); } catch (err) { res.status(500).json({ error: err.message }); } };
exports.updateStatus = async (req, res) => {
  try {
    const visit = await service.updateStatus(req.params.id, req.body);
    if (req.body.notifyUser !== false) {
      const appointment = visit.scheduledFor ? new Date(visit.scheduledFor).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" }) : null;
      const messages = {
        pending: { title: "Visit request is pending", message: "Your visit request is being reviewed by our team." },
        scheduled: { title: "Visit scheduled", message: appointment ? `Your property visit is scheduled for ${appointment}.` : "Your property visit has been scheduled." },
        visited: { title: "Visit completed", message: "Your property visit has been marked as completed. We hope it was a valuable experience." },
        cancelled: { title: "Visit cancelled", message: "Your property visit has been cancelled. Please contact us if you would like to arrange another time." },
        purchased: { title: "Welcome to your new property", message: "Congratulations — your property purchase has been confirmed." },
      };
      const update = messages[visit.status] || { title: "Visit status updated", message: `Your visit status is now ${visit.status}.` };
      await notifications.createAndEmit(req.app, {
        userId: visit.userId,
        type: visit.status === "purchased" ? "purchase_confirmed" : "visit",
        title: update.title,
        message: update.message,
        link: "/profile",
        eventAt: visit.status === "scheduled" ? visit.scheduledFor || null : null,
      });
    }
    res.json(visit);
  } catch (err) { res.status(500).json({ error: err.message }); }
};
exports.getAdminVisits = async (_req, res) => { try { res.json(await service.getAdminVisits()); } catch (err) { res.status(500).json({ error: err.message }); } };
exports.getUserVisits = async (req, res) => { try { res.json(await service.getUserVisits(req.params.userId)); } catch (err) { res.status(500).json({ error: err.message }); } };
exports.saveFeedback = async (req, res) => { try { res.json(await service.saveFeedback(req.params.id, req.body)); } catch (err) { res.status(500).json({ error: err.message }); } };

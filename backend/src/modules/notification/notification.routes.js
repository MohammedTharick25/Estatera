const router = require("express").Router();
const Notification = require("../../../models/Notification");
const { requireAuth } = require("../../middleware/auth");

router.get("/", requireAuth, async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.auth.id }).sort({ createdAt: -1 }).limit(50);
    const unreadCount = await Notification.countDocuments({ userId: req.auth.id, readAt: null });
    res.json({ notifications, unreadCount });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch("/:id/read", requireAuth, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate({ _id: req.params.id, userId: req.auth.id }, { readAt: new Date() }, { returnDocument: "after" });
    if (!notification) return res.status(404).json({ error: "Notification not found" });
    res.json(notification);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch("/read-all", requireAuth, async (req, res) => {
  try { await Notification.updateMany({ userId: req.auth.id, readAt: null }, { readAt: new Date() }); res.json({ message: "Notifications marked as read" }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({ _id: req.params.id, userId: req.auth.id });
    if (!notification) return res.status(404).json({ error: "Notification not found" });
    res.json({ message: "Notification deleted" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;

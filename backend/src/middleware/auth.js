const jwt = require("jsonwebtoken");
const User = require("../../models/User");

exports.requireAuth = async (req, res, next) => {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");
  if (!token) return res.status(401).json({ error: "Authentication is required." });
  try {
    req.auth = jwt.verify(token, process.env.JWT_SECRET);
    if (req.auth.sessionId) {
      const user = await User.exists({ _id: req.auth.id, "sessions.sessionId": req.auth.sessionId });
      if (!user) return res.status(401).json({ error: "This session has ended. Please sign in again." });
    }
    next();
  } catch (_) { res.status(401).json({ error: "Your session is invalid or expired." }); }
};

exports.requireAdmin = (req, res, next) => {
  if (req.auth?.role !== "admin") return res.status(403).json({ error: "Administrator access is required." });
  next();
};

exports.requireSelfOrAdmin = (getUserId) => (req, res, next) => {
  const requestedUserId = getUserId(req);
  if (req.auth?.role === "admin" || String(req.auth?.id) === String(requestedUserId)) return next();
  return res.status(403).json({ error: "You can only access your own account data." });
};

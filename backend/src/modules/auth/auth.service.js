const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const users = require("./auth.repository");
const { sendPasswordResetOtp } = require("../../../utils/emailService");
exports.signup = async ({ name, email, password }) => users.create({ name, email, password: await bcrypt.hash(password, 10) });
exports.login = async ({ email, password }, device = {}) => { const user = await users.findByEmail(email); if (!user) return { error: "User not found", status: 404 }; if (user.isBlocked) return { error: "Your account has been suspended. Please contact the administrator for support.", status: 403 }; if (!(await bcrypt.compare(password, user.password))) return { error: "Invalid credentials", status: 400 }; const sessionId = crypto.randomBytes(24).toString("hex"); user.sessions = [...(user.sessions || []), { sessionId, userAgent: String(device.userAgent || "Unknown device").slice(0, 250), ip: String(device.ip || "").slice(0, 64), createdAt: new Date(), lastActiveAt: new Date() }].slice(-10); await user.save(); return { token: jwt.sign({ id: user._id, role: user.role, name: user.name, sessionId }, process.env.JWT_SECRET, { expiresIn: "1d" }), user: { name: user.name, role: user.role, id: user._id, _id: user._id, email: user.email, image: user.image } }; };

const validatePassword = (password) => password.length >= 8 && /[a-z]/.test(password) && /[A-Z]/.test(password) && /\d/.test(password);
exports.requestPasswordReset = async (email) => {
  const user = await users.findForPasswordReset(email || "");
  if (!user) return { error: "No account was found with that email address.", status: 404 };
  const cooldownMs = 60 * 1000;
  const elapsed = user.passwordResetLastSentAt ? Date.now() - user.passwordResetLastSentAt.getTime() : cooldownMs;
  if (elapsed < cooldownMs) return { error: `Please wait ${Math.ceil((cooldownMs - elapsed) / 1000)} seconds before requesting another code.`, status: 429 };
  const otp = crypto.randomInt(100000, 1000000).toString();
  user.passwordResetOtpHash = crypto.createHash("sha256").update(otp).digest("hex");
  user.passwordResetOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
  user.passwordResetSessionId = null;
  user.passwordResetLastSentAt = new Date();
  await user.save();
  await sendPasswordResetOtp(user, otp);
  return { message: "A verification code was sent to your registered email address." };
};
exports.verifyPasswordResetOtp = async (email, otp) => {
  const user = await users.findForPasswordReset(email || "");
  const hash = crypto.createHash("sha256").update(String(otp || "")).digest("hex");
  if (!user || !user.passwordResetOtpHash || !user.passwordResetOtpExpires || user.passwordResetOtpExpires < new Date() || hash !== user.passwordResetOtpHash) return { error: "The verification code is incorrect or has expired.", status: 400 };
  user.passwordResetSessionId = crypto.randomBytes(24).toString("hex");
  await user.save();
  return { resetToken: jwt.sign({ id: user._id, purpose: "password-reset", sessionId: user.passwordResetSessionId }, process.env.JWT_SECRET, { expiresIn: "10m" }) };
};
exports.resetPassword = async (resetToken, password, confirmPassword) => {
  if (password !== confirmPassword) return { error: "Passwords do not match.", status: 400 };
  if (!validatePassword(password)) return { error: "Password must be at least 8 characters and include uppercase, lowercase, and a number.", status: 400 };
  try {
    const payload = jwt.verify(resetToken, process.env.JWT_SECRET);
    if (payload.purpose !== "password-reset") throw new Error("Invalid reset token");
    const user = await users.findById(payload.id);
    if (!user || !user.passwordResetSessionId || user.passwordResetSessionId !== payload.sessionId) return { error: "This password reset session is no longer valid.", status: 400 };
    user.password = await bcrypt.hash(password, 10); user.passwordResetOtpHash = null; user.passwordResetOtpExpires = null; user.passwordResetSessionId = null; user.passwordResetLastSentAt = null; await user.save();
    return { message: "Your password has been reset successfully." };
  } catch (_) { return { error: "This password reset session is invalid or expired.", status: 400 }; }
};

exports.changePassword = async (userId, currentPassword, password, confirmPassword, currentSessionId) => {
  if (!currentPassword) return { error: "Enter your current password.", status: 400 };
  if (password !== confirmPassword) return { error: "New passwords do not match.", status: 400 };
  if (!validatePassword(password)) return { error: "Password must be at least 8 characters and include uppercase, lowercase, and a number.", status: 400 };
  const user = await users.findById(userId);
  if (!user) return { error: "User not found.", status: 404 };
  if (!(await bcrypt.compare(currentPassword, user.password))) return { error: "Your current password is incorrect.", status: 400 };
  if (await bcrypt.compare(password, user.password)) return { error: "Choose a new password that is different from your current password.", status: 400 };
  user.password = await bcrypt.hash(password, 10);
  user.passwordResetOtpHash = null; user.passwordResetOtpExpires = null; user.passwordResetSessionId = null; user.passwordResetLastSentAt = null;
  if (currentSessionId) user.sessions = user.sessions.filter((session) => session.sessionId === currentSessionId);
  await user.save();
  return { message: "Your password was changed successfully." };
};

exports.listSessions = async (userId) => {
  const user = await users.findSessions(userId);
  return (user?.sessions || []).sort((a, b) => new Date(b.lastActiveAt) - new Date(a.lastActiveAt));
};
exports.revokeSession = async (userId, sessionId, currentSessionId) => {
  if (sessionId === currentSessionId) return { error: "Use Sign out on this device to end the current session.", status: 400 };
  const user = await users.findById(userId); if (!user) return { error: "User not found.", status: 404 };
  const before = user.sessions.length; user.sessions = user.sessions.filter((session) => session.sessionId !== sessionId);
  if (before === user.sessions.length) return { error: "Session not found.", status: 404 };
  await user.save(); return { message: "Session signed out." };
};
exports.revokeOtherSessions = async (userId, currentSessionId) => {
  const user = await users.findById(userId); if (!user) return { error: "User not found.", status: 404 };
  user.sessions = user.sessions.filter((session) => session.sessionId === currentSessionId); await user.save();
  return { message: "All other sessions were signed out." };
};

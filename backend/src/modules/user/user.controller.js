const service = require("./user.service");
const reportFailure = (operation, err, res) => {
  console.error(`User ${operation} failed:`, err);
  return res.status(500).json({ error: `Unable to ${operation}.` });
};

exports.updateProfile = async (req, res) => {
  try {
    const user = await service.updateProfile(
      { ...req.body, id: req.auth.id },
      req.file,
    );
    if (user.error) return res.status(user.status).json({ error: user.error });
    if (!user) return res.status(404).json({ error: "User not found." });
    return res.status(200).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        language: user.language || "en",
        image: user.image,
        favorites: user.favorites,
      },
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: "That email address is already in use." });
    }
    return reportFailure("update profile", err, res);
  }
};

exports.toggleFavorite = async (req, res) => {
  try {
    const favorites = await service.toggleFavorite(req.body);
    if (!favorites) return res.status(404).json({ error: "User not found." });
    return res.status(200).json({ favorites });
  } catch (err) {
    return reportFailure("update favorites", err, res);
  }
};

exports.getFavorites = async (req, res) => {
  try {
    const favorites = await service.getFavorites(req.params.userId);
    if (!favorites) return res.status(404).json({ error: "User not found." });
    return res.json(favorites);
  } catch (err) {
    return reportFailure("load favorites", err, res);
  }
};

exports.getAll = async (_req, res) => {
  try {
    return res.json(await service.getAll());
  } catch (err) {
    return reportFailure("load users", err, res);
  }
};

exports.getStatus = async (req, res) => {
  try {
    const status = await service.getStatus(req.params.id);
    if (!status) return res.status(404).json({ error: "User not found." });
    return res.json(status);
  } catch (err) {
    return reportFailure("load user status", err, res);
  }
};

exports.toggleBlock = async (req, res) => {
  try {
    const result = await service.toggleBlock(req.params.id);
    if (result.error) return res.status(result.status).json({ error: result.error });
    return res.json(result);
  } catch (err) {
    return reportFailure("update user access", err, res);
  }
};

exports.remove = async (req, res) => {
  try {
    const result = await service.remove(req.params.id);
    if (result.error) return res.status(result.status).json({ error: result.error });
    return res.json(result);
  } catch (err) {
    return reportFailure("remove user", err, res);
  }
};

const service = require("./admin.service"); exports.getStats = async (_req, res) => { try { res.json(await service.getStats()); } catch (err) { res.status(500).json({ error: err.message }); } };

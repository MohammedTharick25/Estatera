const repository = require("./inquiry.repository");
exports.create = async (req, res) => { try { res.status(201).json(await repository.create(req.body)); } catch (err) { res.status(500).json({ error: err.message }); } };
exports.findAll = async (_req, res) => { try { res.json(await repository.findAll()); } catch (err) { res.status(500).json({ error: err.message }); } };
exports.update = async (req, res) => { try { res.json(await repository.update(req.params.id, { status: req.body.status, adminNote: req.body.adminNote })); } catch (err) { res.status(500).json({ error: err.message }); } };

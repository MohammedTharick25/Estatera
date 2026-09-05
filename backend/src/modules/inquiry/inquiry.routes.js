const router = require("express").Router(); const controller = require("./inquiry.controller"); const { requireAuth, requireAdmin } = require("../../middleware/auth");
router.post("/", controller.create); router.get("/", requireAuth, requireAdmin, controller.findAll); router.patch("/:id", requireAuth, requireAdmin, controller.update); module.exports = router;

const repository = require("./user.repository");
exports.updateProfile = async ({ name, email, id }, file) => { if (!id || id === "undefined") return { error: "User ID missing", status: 400 }; const data = { name, email }; if (file) data.image = file.path; return repository.findByIdAndUpdate(id, data); };
exports.toggleFavorite = async ({ userId, propertyId }) => { const user = await repository.findById(userId); if (!user) return null; const exists = user.favorites.includes(propertyId); user.favorites = exists ? user.favorites.filter((id) => id.toString() !== propertyId) : [...user.favorites, propertyId]; await user.save(); return user.favorites; };
exports.getFavorites = async (userId) => { const user = await repository.findFavorites(userId); return user ? user.favorites : null; };
exports.getStatus = async (id) => { const user = await repository.findById(id); return user ? { isBlocked: user.isBlocked, role: user.role } : null; };
exports.getAll = () => repository.findAll();
const isProtectedAdmin = (user) => user?.email?.toLowerCase() === "estatera.team@gmail.com";
exports.toggleBlock = async (id) => { const user = await repository.findById(id); if (!user) return { error: "User not found.", status: 404 }; if (isProtectedAdmin(user)) return { error: "The protected administrator cannot be blocked.", status: 403 }; user.isBlocked = !user.isBlocked; await user.save(); return { message: `User ${user.isBlocked ? "blocked" : "unblocked"}` }; };
exports.remove = async (id) => { const user = await repository.findById(id); if (!user) return { error: "User not found.", status: 404 }; if (isProtectedAdmin(user)) return { error: "The protected administrator cannot be deleted.", status: 403 }; await repository.deleteById(id); return { message: "User deleted" }; };

const repository = require("./listing.repository");
const savedSearchAlerts = require("../savedSearch/savedSearchAlert.service");
const User = require("../../../models/User");
const { sendPropertyAlert } = require("../../../utils/emailService");
const notifications = require("../notification/notification.service");

const broadcastNewListing = (listing) => {
  User.find({ isBlocked: false })
    .then((users) => sendPropertyAlert(users, listing))
    .catch((err) => console.error("New-listing email broadcast failed:", err.response?.status, err.response?.data || err.message));
};
const notifyUsers = (app, users, data) => Promise.allSettled(users.map((user) => notifications.createAndEmit(app, { userId: user._id, ...data })));
const notifyNewListing = (app, listing) => User.find({ isBlocked: false }).then((users) => notifyUsers(app, users, { type: "new_listing", title: "New verified property", message: `${listing.title} has just been added to the Estatera collection.`, link: `/property/${listing._id}` })).catch((err) => console.error("New-listing notification failed:", err.message));
const notifyAvailabilityChange = (app, listing, lifecycle) => User.find({ isBlocked: false, favorites: listing._id }).then((users) => notifyUsers(app, users, { type: "property_update", title: "A saved property was updated", message: `${listing.title} is now ${lifecycle}.`, link: `/property/${listing._id}` })).catch((err) => console.error("Property-update notification failed:", err.message));

exports.create = async (body, files, app) => {
  const lifecycle = ["draft", "published", "sold"].includes(body.lifecycle) ? body.lifecycle : "published";
  const listing = await repository.create({
    ...body,
    price: Number(body.price),
    images: files?.images ? files.images.map((file) => file.path) : [],
    videos: files?.videos ? files.videos.map((file) => file.path) : [],
    commission: Number(body.commission || 0),
    latitude: Number(body.latitude),
    longitude: Number(body.longitude),
    amenities: Array.isArray(body.amenities) ? body.amenities : body.amenities ? [body.amenities] : [],
    lifecycle,
    status: lifecycle === "sold" ? "Sold" : "Available",
    publishedAt: lifecycle === "published" ? new Date() : null,
  });
  if (lifecycle === "published") { broadcastNewListing(listing); notifyNewListing(app, listing); savedSearchAlerts.alertForNewListing(app, listing).catch((err) => console.error("Saved-search alert error:", err.message)); }
  return listing;
};

exports.findAll = (filters) => {
  const { location, search, type, minPrice, maxPrice, sort, lat, lng, radius } = filters;
  const query = { isArchived: { $ne: true }, lifecycle: { $ne: "draft" } };
  if (minPrice || maxPrice) { query.price = {}; if (minPrice) query.price.$gte = Number(minPrice); if (maxPrice) query.price.$lte = Number(maxPrice); }
  if (lat && lng && radius) {
    const radiusKm = Number(radius); const ky = 40000 / 360; const kx = Math.cos((Math.PI * lat) / 180) * ky;
    query.latitude = { $gte: Number(lat) - radiusKm / ky, $lte: Number(lat) + radiusKm / ky };
    query.longitude = { $gte: Number(lng) - radiusKm / kx, $lte: Number(lng) + radiusKm / kx };
  } else if (search && search.trim() !== "") { const expression = { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" }; query.$or = [{ location: expression }, { title: expression }];
  } else if (location && location.trim() !== "") query.location = { $regex: location.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
  if (type) query.propertyType = type;
  const sortOption = sort === "price_low" ? { price: 1 } : sort === "price_high" ? { price: -1 } : { createdAt: -1 };
  return repository.find(query, sortOption);
};

exports.findInventory = async (filters) => {
  const page = Math.max(1, Number(filters.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(filters.limit) || 12));
  const conditions = [];
  if (filters.archived !== "all") conditions.push({ isArchived: filters.archived === "true" ? true : { $ne: true } });
  if (filters.status && filters.status !== "all") conditions.push({ status: filters.status });
  if (filters.type && filters.type !== "all") conditions.push({ propertyType: filters.type });
  if (filters.lifecycle && filters.lifecycle !== "all") {
    conditions.push(filters.lifecycle === "published" ? { $or: [{ lifecycle: "published" }, { lifecycle: { $exists: false } }] } : { lifecycle: filters.lifecycle });
  }
  if (filters.search?.trim()) { const expression = { $regex: filters.search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" }; conditions.push({ $or: [{ title: expression }, { location: expression }] }); }
  const query = conditions.length ? { $and: conditions } : {};
  const { items, total } = await repository.findPaged(query, { createdAt: -1 }, page, limit);
  return { items, page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) };
};

exports.toggleLike = async (id, userId) => {
  const listing = await repository.findById(id); if (!listing) return null;
  if (!listing.likes) listing.likes = [];
  const alreadyLiked = listing.likes.includes(userId);
  listing.likes = alreadyLiked ? listing.likes.filter((likedId) => likedId.toString() !== userId) : [...listing.likes, userId];
  await listing.save(); return { liked: !alreadyLiked, likesCount: listing.likes.length };
};
exports.updateStatus = (id, status) => repository.updateById(id, status === "Sold" ? { status, lifecycle: "sold" } : { status, lifecycle: "published", isArchived: false, archivedAt: null, publishedAt: new Date() });
exports.setLifecycle = async (id, lifecycle, app) => {
  if (!["draft", "published", "sold", "archived"].includes(lifecycle)) throw new Error("Invalid property lifecycle");
  const listing = await repository.findById(id);
  if (!listing) return null;
  const wasPublished = listing.lifecycle === "published" || (!listing.lifecycle && !listing.isArchived);
  const update = { lifecycle };
  if (lifecycle === "published") { update.status = "Available"; update.isArchived = false; update.archivedAt = null; update.publishedAt = new Date(); }
  if (lifecycle === "draft") update.unpublishedAt = new Date();
  if (lifecycle === "sold") update.status = "Sold";
  if (lifecycle === "archived") { update.isArchived = true; update.archivedAt = new Date(); }
  const updated = await repository.updateById(id, update);
  if (lifecycle === "published" && !wasPublished) { broadcastNewListing(updated); notifyNewListing(app, updated); savedSearchAlerts.alertForNewListing(app, updated).catch((err) => console.error("Saved-search alert error:", err.message)); }
  if (["sold", "archived", "published"].includes(lifecycle)) notifyAvailabilityChange(app, updated, lifecycle);
  return updated;
};
exports.update = async (id, body, files) => {
  const update = { ...body };
  delete update.lifecycle;
  ["price", "commission", "latitude", "longitude"].forEach((key) => { if (body[key] !== undefined) update[key] = Number(body[key]); });
  if (body.amenities !== undefined) update.amenities = Array.isArray(body.amenities) ? body.amenities : [body.amenities];
  const listing = await repository.findById(id);
  if (!listing) return null;
  const arrayValue = (value) => value === undefined ? undefined : Array.isArray(value) ? value : [value];
  const retainedImages = body.retainedImagesJson !== undefined ? JSON.parse(body.retainedImagesJson) : arrayValue(body.retainedImages);
  const retainedVideos = body.retainedVideosJson !== undefined ? JSON.parse(body.retainedVideosJson) : arrayValue(body.retainedVideos);
  delete update.retainedImages; delete update.retainedVideos; delete update.retainedImagesJson; delete update.retainedVideosJson;
  if (retainedImages !== undefined || files?.images?.length) update.images = [...(retainedImages ?? listing.images), ...(files?.images || []).map((file) => file.path)];
  if (retainedVideos !== undefined || files?.videos?.length) update.videos = [...(retainedVideos ?? listing.videos), ...(files?.videos || []).map((file) => file.path)];
  return repository.updateById(id, update);
};
exports.findById = async (id) => { const listing = await repository.findById(id); return listing?.isArchived || listing?.lifecycle === "draft" ? null : listing; };
exports.incrementViews = (id) => repository.incrementViews(id);
exports.remove = async (id) => { await repository.deleteById(id); await repository.deleteVisitsForProperty(id); };
exports.setArchived = (id, archived) => repository.updateById(id, archived ? { isArchived: true, archivedAt: new Date(), lifecycle: "archived" } : { isArchived: false, archivedAt: null, lifecycle: "published", publishedAt: new Date() });

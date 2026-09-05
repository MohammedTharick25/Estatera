const SavedSearch = require("../../../models/SavedSearch");
const Listing = require("../../../models/Listings");
const User = require("../../../models/User");
const { sendSavedSearchAlert } = require("../../../utils/emailService");
const notifications = require("../notification/notification.service");

const matches = (search, listing) => {
  const filters = search.filters || {};
  const location = String(filters.location || "").trim().toLowerCase();
  if (location && !String(listing.location || "").toLowerCase().includes(location) && !String(listing.title || "").toLowerCase().includes(location)) return false;
  if (filters.type && filters.type !== listing.propertyType) return false;
  return !(Number(filters.maxPrice) > 0 && Number(listing.price) > Number(filters.maxPrice));
};

const emailSearchMatch = async (search, listing) => {
  const user = await User.findOne({ _id: search.userId, isBlocked: false });
  if (!user) return;
  await sendSavedSearchAlert(user, listing, search.name);
  search.lastAlertSentAt = new Date();
  await search.save();
};

exports.alertForNewListing = async (app, listing) => {
  const searches = await SavedSearch.find({ alertEnabled: true });
  const matchingSearches = searches.filter((search) => matches(search, listing));
  console.log(`Saved-search alerts: ${matchingSearches.length} match(es) for "${listing.title}".`);
  const results = await Promise.allSettled(matchingSearches.map(async (search) => {
    await notifications.createAndEmit(app, { userId: search.userId, type: "property_alert", title: "A saved search has a new match", message: `${listing.title} matches your saved search “${search.name}”.`, link: `/property/${listing._id}` });
    // Immediate email is handled by the new-listing broadcast. Saved searches
    // still create a personalised in-app match and may receive daily/weekly digests.
  }));
  results.filter((result) => result.status === "rejected").forEach((result) => console.error("Saved-search email failed:", result.reason?.response?.status, result.reason?.response?.data || result.reason?.message));
};

exports.sendDueDigests = async () => {
  const searches = await SavedSearch.find({ alertEnabled: true, alertFrequency: { $in: ["daily", "weekly"] } });
  const now = Date.now();
  await Promise.allSettled(searches.map(async (search) => {
    const interval = search.alertFrequency === "daily" ? 86400000 : 604800000;
    const start = search.lastAlertSentAt || search.createdAt;
    if (now - new Date(start).getTime() < interval) return;
    const listings = await Listing.find({ createdAt: { $gt: start }, status: "Available" }).sort({ createdAt: -1 });
    const match = listings.find((listing) => matches(search, listing));
    search.lastAlertSentAt = new Date(); await search.save();
    if (match) await emailSearchMatch(search, match);
  }));
};

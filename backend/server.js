const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const { sendDueDigests } = require("./src/modules/savedSearch/savedSearchAlert.service");

const app = express();
setInterval(() => sendDueDigests().catch((err) => console.error("Saved-search digest error:", err.message)), 60 * 60 * 1000);
const server = http.createServer(app); // Create HTTP server

const allowedOrigins = [
  "http://localhost:5173",
  "https://estatera.onrender.com",
  "https://estatera-hjnn.onrender.com",
];

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PATCH"],
    credentials: true,
  },
});

// Store connected users for mapping IDs to Sockets
const connectedUsers = {};

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("join", ({ userId, role }) => {
    // 1. Map user ID to socket ID
    connectedUsers[userId] = socket.id;

    // 2. Join a private room based on their User ID
    socket.join(userId);
    console.log(`User ${userId} joined room: ${userId}`);

    // 3. If admin, join the global 'admins' room
    if (role === "admin") {
      socket.join("admins");
      console.log(`Admin ${userId} joined admins room`);
    }
  });

  socket.on("disconnect", () => {
    // Remove from connectedUsers mapping
    for (const userId in connectedUsers) {
      if (connectedUsers[userId] === socket.id) {
        delete connectedUsers[userId];
        break;
      }
    }
    console.log("User disconnected");
  });
});

// Make io and connectedUsers global to the app
app.set("io", io);
app.set("connectedUsers", connectedUsers);

// Middleware
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
);
app.use(express.json());

// Routes
app.use("/api/listings", require("./routes/listingRoutes"));
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/inquiries", require("./src/modules/inquiry/inquiry.routes"));
app.use("/api/saved-searches", require("./src/modules/savedSearch/savedSearch.routes"));
app.use("/api/notifications", require("./src/modules/notification/notification.routes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/visits", require("./routes/visitRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));

app.get("/health", (req, res) => {
  res.status(200).send("Server is awake");
});

// Database Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ DB Connection Error:", err));

// IMPORTANT: Listen on 'server', NOT 'app'
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

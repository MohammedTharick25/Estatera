const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const {
  sendDueDigests,
} = require("./src/modules/savedSearch/savedSearchAlert.service");

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  "http://localhost:5173",
  "https://estatera.onrender.com",
  "https://estatera-lgq5.onrender.com",
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (Postman, server-to-server, etc.)
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.log("❌ CORS blocked origin:", origin);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));

app.use(express.json());

// Socket.IO
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
  },
});

// Store connected users
const connectedUsers = {};

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("join", ({ userId, role }) => {
    connectedUsers[userId] = socket.id;

    socket.join(userId);

    console.log(`User ${userId} joined room: ${userId}`);

    if (role === "admin") {
      socket.join("admins");
      console.log(`Admin ${userId} joined admins room`);
    }
  });

  socket.on("disconnect", () => {
    for (const userId in connectedUsers) {
      if (connectedUsers[userId] === socket.id) {
        delete connectedUsers[userId];
        break;
      }
    }

    console.log("User disconnected");
  });
});

app.set("io", io);
app.set("connectedUsers", connectedUsers);

// Routes
app.use("/api/listings", require("./routes/listingRoutes"));
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/inquiries", require("./src/modules/inquiry/inquiry.routes"));
app.use(
  "/api/saved-searches",
  require("./src/modules/savedSearch/savedSearch.routes"),
);
app.use(
  "/api/notifications",
  require("./src/modules/notification/notification.routes"),
);
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/visits", require("./routes/visitRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));

app.get("/health", (req, res) => {
  res.status(200).send("Server is awake");
});

// Database
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ DB Connection Error:", err));

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

setInterval(
  () =>
    sendDueDigests().catch((err) =>
      console.error("Saved-search digest error:", err.message),
    ),
  60 * 60 * 1000,
);

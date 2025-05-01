// Import required modules
const { sequelize } = require("./config/dbConfig");
const cors = require("cors");
const nocache = require("nocache");
const dotenv = require("dotenv");
const express = require("express");
const http = require("http");
const path = require("path");
const jwt = require("jsonwebtoken");

// Load environment variables from .env file
dotenv.config();

// Initialize Express app
const app = express();
app.use(nocache()); // Prevent caching

// Middleware to parse request bodies
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));


app.use(cors());

// Check database connection
sequelize
  .authenticate()
  .then(() => {
    console.log("Database connected successfully!");
  })
  .catch((error) => {
    console.error("Error connecting to database:", error.message);
    console.error("Full error:", error);
  });

// Import routes
const authRoute = require("./routes/authRoute");
const routeRoute = require("./Routes/routeRoute");

// Mount routes
app.use("/api", authRoute);
app.use("/api/routes", routeRoute);

// Version endpoint (optional)
app.get("/version", (req, res) => {
  res.json({ version: 1 });
});

// Start the server
const port = process.env.PORT || 3031; // Use PORT from .env or default to 3031
const server = http.createServer(app);

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

module.exports = app;
require("dotenv").config();
const { app } = require("./app");
const { connectDB } = require("./db/connect");

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    await connectDB(process.env.MONGO_URI);
    app.listen(PORT, "0.0.0.0", () => console.log("Server running", PORT));
  } catch (err) {
    console.error("❌ Startup error:", err);
    process.exit(1);
  }
}

start();

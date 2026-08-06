const { MongoClient, ObjectId } = require("mongodb");
require("dotenv").config();

// MongoDB connection URI from .env
const uri = process.env.MONGO_URI;

// Create client with TLS options for Render compatibility
const client = new MongoClient(uri, {
  ssl: true,
  tlsAllowInvalidCertificates: false,
  serverSelectionTimeoutMS: 5000,
});

// Reuse connection across calls
async function getDB() {
  try {
    if (!client.topology || !client.topology.isConnected()) {
      console.log("🔌 Connecting to MongoDB...");
      await client.connect();
      console.log("✅ MongoDB connected");
    }

    // ✅ Connect to the correct database
    const db = client.db("GVC-Economy");
    console.log("📂 Using database: GVC-Economy");
    return db;
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err);
    throw err;
  }
}

// -----------------------------------------------------
// LOAD ALL USERS
// -----------------------------------------------------
async function loadEconomy() {
  const db = await getDB();
  console.log("📥 Loading all user records...");
  return await db.collection("economy.users").find().toArray();
}

// -----------------------------------------------------
// LOAD ROLE INCOME (FIXED + DEBUG)
// -----------------------------------------------------
async function loadRoleIncome() {
  try {
    const db = await getDB();
    const collection = db.collection("economy.roleIncome"); // ✅ correct folder path

    console.log("📥 Fetching roleIncome document...");

    const doc = await collection.findOne({});
    if (!doc) {
      console.log("⚠️ roleIncome document not found!");
      return {};
    }

    console.log("📄 roleIncome loaded:", doc.data);
    return doc.data || {};
  } catch (err) {
    console.error("❌ Error loading roleIncome:", err);
    return {};
  }
}

// -----------------------------------------------------
// LOAD WORK MESSAGES (FIXED + DEBUG)
// -----------------------------------------------------
async function loadWorkMessages() {
  try {
    const db = await getDB();
    const collection = db.collection("economy.workMessages"); // ✅ correct folder path

    console.log("📥 Fetching workMessages document...");
    const doc = await collection.findOne({});
    if (!doc || !doc.data) {
      console.log("⚠️ No workMessages found in DB!");
      return [];
    }

    console.log(`📄 Loaded ${doc.data.length} workMessages`);
    return doc.data;
  } catch (err) {
    console.error("❌ Error loading workMessages:", err);
    return [];
  }
}

// -----------------------------------------------------
// GET OR CREATE USER RECORD
// -----------------------------------------------------
async function getUserRecord(userId) {
  const db = await getDB();
  const collection = db.collection("economy.users"); // ✅ correct folder path

  let user = await collection.findOne({ userId });
  if (!user) {
    console.log(`🆕 Creating new user record for ${userId}`);
    user = { userId, cash: 0, lastCollect: 0, lastWork: 0 };
    await collection.insertOne(user);
  }

  return user;
}

// -----------------------------------------------------
// UPDATE USER RECORD
// -----------------------------------------------------
async function updateUserRecord(user) {
  const db = await getDB();
  const collection = db.collection("economy.users"); // ✅ correct folder path

  await collection.updateOne(
    { userId: user.userId },
    { $set: user },
    { upsert: true },
  );
  console.log(`💾 Updated user record for ${user.userId}`);
}

// -----------------------------------------------------
// EXPORTS
// -----------------------------------------------------
module.exports = {
  loadEconomy,
  loadRoleIncome,
  loadWorkMessages,
  getUserRecord,
  updateUserRecord,
};

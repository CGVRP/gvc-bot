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
    return client.db("GVC-Economy"); // your actual DB name
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
  return await db.collection("users").find().toArray();
}

// -----------------------------------------------------
// LOAD ROLE INCOME (FIXED + DEBUG)
// -----------------------------------------------------
async function loadRoleIncome() {
  try {
    const db = await getDB();
    const collection = db.collection("roleIncome");

    console.log("📥 Fetching roleIncome document...");

    const doc = await collection.findOne({
      _id: new ObjectId("6a74b2d8f97d6e278a3444e1"),
    });

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
    const doc = await db.collection("workMessages").findOne({});

    if (!doc || !doc.data) {
      console.log("⚠️ No workMessages found in DB!");
      return [];
    }

    console.log("📄 Loaded workMessages:", doc.data.length);
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
  let user = await db.collection("users").findOne({ userId });

  if (!user) {
    console.log(`🆕 Creating new user record for ${userId}`);
    user = { userId, cash: 0, lastCollect: 0, lastWork: 0 };
    await db.collection("users").insertOne(user);
  }

  return user;
}

// -----------------------------------------------------
// UPDATE USER RECORD
// -----------------------------------------------------
async function updateUserRecord(user) {
  const db = await getDB();
  await db
    .collection("users")
    .updateOne({ userId: user.userId }, { $set: user }, { upsert: true });
}

module.exports = {
  loadEconomy,
  loadRoleIncome,
  loadWorkMessages,
  getUserRecord,
  updateUserRecord,
};

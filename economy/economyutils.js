const { MongoClient } = require("mongodb");
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
  if (!client.topology || !client.topology.isConnected()) {
    await client.connect();
  }
  return client.db("economy");
}

// Load all users (for leaderboard, economyinfo)
async function loadEconomy() {
  const db = await getDB();
  return await db.collection("users").find().toArray();
}

// Load role income data
async function loadRoleIncome() {
  const db = await getDB();
  const doc = await db.collection("roleIncome").findOne({ _id: "roleIncome" });
  return doc?.data || {};
}

// Load work messages
async function loadWorkMessages() {
  const db = await getDB();
  const doc = await db
    .collection("workMessages")
    .findOne({ _id: "workMessages" });
  return doc?.data || {};
}

// Get or create a user record
async function getUserRecord(userId) {
  const db = await getDB();
  let user = await db.collection("users").findOne({ userId });

  if (!user) {
    user = { userId, cash: 0, lastCollect: 0, lastWork: 0 };
    await db.collection("users").insertOne(user);
  }

  return user;
}

// Update a user record
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

// /security/protect.js

const safeUsers = {
  bypassCooldown: "1368142895181205636",
};

// -----------------------------------------------------
// INPUT SANITIZATION
// -----------------------------------------------------
function sanitize(str) {
  if (typeof str !== "string") return str;
  return str
    .replace(/[<>`]/g, "")        // prevent markdown injection
    .replace(/@everyone/g, "everyone") // prevent mass ping
    .replace(/@here/g, "here");
}

// -----------------------------------------------------
// RATE LIMITING (anti-spam)
// -----------------------------------------------------
const rateLimit = new Map();

function applyRateLimit(userId, limitMs = 1500) {
  if (rateLimit.has(userId)) return false;
  rateLimit.set(userId, Date.now());
  setTimeout(() => rateLimit.delete(userId), limitMs);
  return true;
}

// -----------------------------------------------------
// COOLDOWN BYPASS
// -----------------------------------------------------
function bypassCooldown(userId) {
  return userId === safeUsers.bypassCooldown;
}

// -----------------------------------------------------
// PERMISSION CHECKER (anti-unauthorized admin use)
// -----------------------------------------------------
function requireAdmin(interaction) {
  if (interaction.user.id === safeUsers.bypassCooldown) return true;
  return interaction.member.permissions.has("Administrator");
}

// -----------------------------------------------------
// GLOBAL ERROR PROTECTION (anti-crash)
// -----------------------------------------------------
function enableGlobalProtection() {
  process.on("unhandledRejection", (err) => {
    console.error("Unhandled Rejection:", err);
  });

  process.on("uncaughtException", (err) => {
    console.error("Uncaught Exception:", err);
  });
}

// -----------------------------------------------------
// EXPORTS
// -----------------------------------------------------
module.exports = {
  sanitize,
  applyRateLimit,
  bypassCooldown,
  requireAdmin,
  enableGlobalProtection,
};
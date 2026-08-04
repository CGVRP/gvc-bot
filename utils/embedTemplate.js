const { EmbedBuilder, AttachmentBuilder } = require("discord.js");
const path = require("node:path");

// Default GVRE brand color
const DEFAULT_COLOR = 0xFFAD65;

// Default logo path (inside graphics folder)
const DEFAULT_LOGO = path.join(__dirname, "..", "graphics", "GVClogo.png");

// -----------------------------------------------------
// UNIVERSAL EMBED TEMPLATE
// -----------------------------------------------------
function embedTemplate({ title, description, banner, color }) {
  const files = [];
  let logoName = path.basename(DEFAULT_LOGO);
  let bannerName = null;

  files.push(new AttachmentBuilder(DEFAULT_LOGO).setName(logoName));

  // Optional banner
  if (banner) {
    bannerName = path.basename(banner);
    files.push(new AttachmentBuilder(banner).setName(bannerName));
  }

  // Build embed
  const embed = new EmbedBuilder()
    .setColor(color || DEFAULT_COLOR)
    .setTitle(title || "GVC Bot")
    .setDescription(description || "No description provided.")
    .setThumbnail(`attachment://${logoName}`);

  if (bannerName) {
    embed.setImage(`attachment://${bannerName}`);
  }

  return { embed, files };
}

module.exports = embedTemplate;
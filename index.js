require("dotenv").config();
const express = require("express");
const app = express();

app.get("/", (req, res) => res.send("Bot is alive!"));
app.listen(3000, () => console.log("Web server running on port 3000"));
const {
  Client,
  GatewayIntentBits,
  Partials,
  Collection,
  Events,
} = require("discord.js");
const fs = require("node:fs");
const path = require("node:path");
const embedTemplate = require("./utils/embedTemplate");

// -----------------------------------------------------
// LOGGING SETUP
// -----------------------------------------------------
const GENERAL_LOG_CHANNEL = "1482745496018616524"; // bot-logs
const SESSION_LOG_CHANNEL = "1524362111575134298"; // session-logs

function logEvent(
  client,
  channelId,
  title,
  interaction,
  extraDescription = "",
) {
  const guild = client.guilds.cache.get("1058305800252182528");
  if (!guild) return;

  const logChannel = guild.channels.cache.get(channelId);
  if (!logChannel) return;

  const unix = Math.floor(Date.now() / 1000);
  const timestamp = `<t:${unix}:F>`;

  const description =
    `> <:arrowright:1534182706836144158> **User:** ${interaction.user} (${interaction.user.id})\n` +
    `> <:arrowright:1534182706836144158> **Guild:** ${guild.name} (${guild.id})\n` +
    (interaction.channel
      ? `> <:arrowright:1534182706836144158> **Channel:** ${interaction.channel} (${interaction.channel.id})\n`
      : `> <:arrowright:1534182706836144158> **Channel:** DM\n`) +
    (interaction.message
      ? `> <:arrowright:1534182706836144158> **Message ID:** ${interaction.message.id}\n`
      : "") +
    `> <:arrowright:1534182706836144158> **Timestamp:** ${timestamp}\n\n` +
    extraDescription;

  const { embed } = embedTemplate({ title, description });
  logChannel.send({ embeds: [embed] }).catch(() => {});
}

// -----------------------------------------------------
// CLIENT SETUP
// -----------------------------------------------------
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

client.commands = new Collection();

// -----------------------------------------------------
// LOAD COMMANDS
// -----------------------------------------------------
const foldersPath = path.join(__dirname, "commands");
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((file) => file.endsWith(".js"));

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    client.commands.set(command.data.name, command);
  }
}


// -----------------------------------------------------
// READY EVENT
// -----------------------------------------------------
client.once(Events.ClientReady, () => {
  console.log(`🟢 Bot is online as ${client.user.tag}`);
});

// -----------------------------------------------------
// GLOBAL INTERACTION HANDLER
// -----------------------------------------------------
client.on(Events.InteractionCreate, async (interaction) => {
  try {
    // -----------------------------------------------------
    // 🔹 Slash commands → BOT LOGS
    // -----------------------------------------------------
    if (interaction.isChatInputCommand()) {
      logEvent(
        client,
        GENERAL_LOG_CHANNEL,
        "<a:gvcsunspin:1527220557890850846> Command Used <a:gvcsunspin:1527220557890850846>",
        interaction,
        `> <:arrowright:1534182706836144158> **Command:** /${interaction.commandName}`,
      );

      const command = client.commands.get(interaction.commandName);
      if (!command) return;
      await command.execute(interaction);
      return;
    }

    // -----------------------------------------------------
    // 🔹 STARTUP SYSTEM BUTTONS → BOT LOGS
    // -----------------------------------------------------
    if (interaction.isButton()) {
      logEvent(
        client,
        GENERAL_LOG_CHANNEL,
        "<a:gvcsunspin:1527220557890850846> Button Clicked <a:gvcsunspin:1527220557890850846>",
        interaction,
        `> <:arrowright:1534182706836144158> **Button ID:** ${interaction.customId}`,
      );

      if (interaction.customId === "claim_ticket") return;

      const messages = await interaction.channel.messages.fetch({ limit: 50 });
      const startupMessage = messages.find((m) =>
        m.embeds[0]?.title?.includes("Session Startup"),
      );

      let reacted = false;

      if (startupMessage) {
        for (const reaction of startupMessage.reactions.cache.values()) {
          const users = await reaction.users.fetch();
          if (users.has(interaction.user.id)) {
            reacted = true;
            break;
          }
        }
      }

      if (!reacted) {
        const { embed } = embedTemplate({
          title:
            "<a:gvcsunspin:1527220557890850846> Access Denied <a:gvcsunspin:1527220557890850846>",
          description:
            "> <:arrowright:1534182706836144158> You must react to the **Startup Embed** before accessing the session link.",
        });

        return interaction.reply({
          embeds: [embed],
          flags: 64,
        });
      }

      const link = interaction.message.sessionLink || "Link unavailable.";
      let linkLabel = "";

      switch (interaction.customId) {
        case "release_link":
          linkLabel = "Session Link";
          break;
        case "reinvites_link":
          linkLabel = "Reinvite Link";
          break;
        case "earlyaccess_link":
          linkLabel = "Early Access Link";
          break;
        case "regen_link":
          linkLabel = "Regenerated Link";
          break;
        default:
          linkLabel = "Link";
      }

      // ⭐ SESSION BUTTONS → STILL BOT LOGS (NOT session logs)
      logEvent(
        client,
        GENERAL_LOG_CHANNEL,
        "<a:gvcsunspin:1527220557890850846> Session Button Used <a:gvcsunspin:1527220557890850846>",
        interaction,
        `> <:arrowright:1534182706836144158> **Action:** ${interaction.customId}`,
      );

      const { embed } = embedTemplate({
        title: `<a:gvcsunspin:1527220557890850846> ${linkLabel} <a:gvcsunspin:1527220557890850846>`,
        description: `> <:arrowright:1534182706836144158> Here is your ${linkLabel.toLowerCase()}:\n${link}`,
      });

      return interaction.reply({
        embeds: [embed],
        flags: 64,
      });
    }
  } catch (error) {
    console.error("Interaction error:", error);

    const { embed } = embedTemplate({
      title:
        "⚠️ Error ⚠️",
      description:
        "> <:arrowright:1534182706836144158> There was an error executing this interaction.",
    });

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ embeds: [embed], flags: 64 });
    } else {
      await interaction.reply({ embeds: [embed], flags: 64 });
    }
  }
});

// -----------------------------------------------------
// LOGIN
// -----------------------------------------------------
client.login(process.env.TOKEN);
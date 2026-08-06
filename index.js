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
  AuditLogEvent,
} = require("discord.js");
const fs = require("node:fs");
const path = require("node:path");
const embedTemplate = require("./utils/embedTemplate");

// -----------------------------------------------------
// CONFIGURATION SETUP
// -----------------------------------------------------
const GENERAL_LOG_CHANNEL = "1534886183040188547"; // Bot logs channel ID
const SESSION_LOG_CHANNEL = "1534889791416438784"; // Session logs channel ID
const HR_ROLE_ID = "1350582607217430650"; // HR Role ID to ping

// Helper function to create/resend recovered log embeds
function createRecoveredEmbed(originalEmbed, executor, timestamp) {
  const recoveredEmbed = { ...originalEmbed.data };
  
  recoveredEmbed.color = parseInt("db2727", 16);
  recoveredEmbed.title = `<a:gvcsunspin:1527220557890850846> RECOVERED DELETED LOG BY ${executor.tag || executor.username} AT ${timestamp} <a:gvcsunspin:1527220557890850846>`;

  return recoveredEmbed;
}

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
    let logTitle = "<a:gvcsunspin:1527220557890850846> Interaction Used <a:gvcsunspin:1527220557890850846>";
    let extraDetails = "";

    if (interaction.isChatInputCommand()) {
      logTitle = "<a:gvcsunspin:1527220557890850846> Command Used <a:gvcsunspin:1527220557890850846>";
      
      const optionsFormatted = interaction.options.data
        .map((opt) => {
          let val = opt.value;
          if (opt.user) val = `${opt.user} (${opt.user.id})`;
          else if (opt.channel) val = `${opt.channel} (${opt.channel.id})`;
          else if (opt.role) val = `${opt.role} (${opt.role.id})`;
          return `> <:arrowright:1534182706836144158> **${opt.name}:** ${val}`;
        })
        .join("\n");

      extraDetails =
        `> <:arrowright:1534182706836144158> **Command:** /${interaction.commandName}\n` +
        (optionsFormatted ? `${optionsFormatted}\n` : "");

    } else if (interaction.isButton()) {
      logTitle = "<a:gvcsunspin:1527220557890850846> Button Clicked <a:gvcsunspin:1527220557890850846>";
      extraDetails = `> <:arrowright:1534182706836144158> **Button ID:** ${interaction.customId}`;
    } else if (interaction.isAnySelectMenu()) {
      logTitle = "<a:gvcsunspin:1527220557890850846> Menu Selected <a:gvcsunspin:1527220557890850846>";
      extraDetails =
        `> <:arrowright:1534182706836144158> **Menu ID:** ${interaction.customId}\n` +
        `> <:arrowright:1534182706836144158> **Values:** ${interaction.values.join(", ")}`;
    } else if (interaction.isModalSubmit()) {
      logTitle = "<a:gvcsunspin:1527220557890850846> Modal Submitted <a:gvcsunspin:1527220557890850846>";
      extraDetails = `> <:arrowright:1534182706836144158> **Modal ID:** ${interaction.customId}`;
    } else if (interaction.isContextMenuCommand()) {
      logTitle = "<a:gvcsunspin:1527220557890850846> Context Menu Used <a:gvcsunspin:1527220557890850846>";
      extraDetails = `> <:arrowright:1534182706836144158> **Context Command:** ${interaction.commandName}`;
    }

    logEvent(client, GENERAL_LOG_CHANNEL, logTitle, interaction, extraDetails);

    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;
      await command.execute(interaction);
      return;
    }

    if (interaction.isButton()) {
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
      title: "⚠️ Error ⚠️",
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
// 🚨 SINGLE MESSAGE DELETE PROTECTION
// -----------------------------------------------------
client.on(Events.MessageDelete, async (message) => {
  // Only monitor the defined log channels & messages that were sent by the bot with embeds
  if (
    ![GENERAL_LOG_CHANNEL, SESSION_LOG_CHANNEL].includes(message.channelId) ||
    !message.author?.bot ||
    !message.embeds.length
  ) {
    return;
  }

  try {
    const unix = Math.floor(Date.now() / 1000);
    const timestamp = `<t:${unix}:F>`;

    // Fetch the audit log entry to find who deleted it
    const fetchedLogs = await message.guild.fetchAuditLogs({
      limit: 1,
      type: AuditLogEvent.MessageDelete,
    });
    const deletionLog = fetchedLogs.entries.first();

    let executor = { tag: "Unknown User", username: "Unknown User" };
    if (deletionLog && deletionLog.target.id === message.author.id && deletionLog.createdTimestamp > Date.now() - 5000) {
      executor = deletionLog.executor;
    }

    // Build the recovered embeds with red color `#db2727`
    const recoveredEmbeds = message.embeds.map((embed) =>
      createRecoveredEmbed(embed, executor, timestamp),
    );

    await message.channel.send({
      content: `<@&${HR_ROLE_ID}>`,
      embeds: recoveredEmbeds,
    });
  } catch (error) {
    console.error("Failed to recover deleted log:", error);
  }
});

// -----------------------------------------------------
// 🚨 BULK MESSAGE DELETE PROTECTION
// -----------------------------------------------------
client.on(Events.MessageDeleteBulk, async (messages) => {
  const firstMsg = messages.first();
  if (!firstMsg || ![GENERAL_LOG_CHANNEL, SESSION_LOG_CHANNEL].includes(firstMsg.channelId)) {
    return;
  }

  try {
    const unix = Math.floor(Date.now() / 1000);
    const timestamp = `<t:${unix}:F>`;

    // Fetch audit log entry for bulk message purge
    const fetchedLogs = await firstMsg.guild.fetchAuditLogs({
      limit: 1,
      type: AuditLogEvent.MessageBulkDelete,
    });
    const deletionLog = fetchedLogs.entries.first();

    let executor = { tag: "Unknown User", username: "Unknown User" };
    if (deletionLog && deletionLog.createdTimestamp > Date.now() - 5000) {
      executor = deletionLog.executor;
    }

    // Filter only bot messages that contained embeds
    const botEmbedMessages = messages.filter(
      (m) => m.author?.bot && m.embeds.length > 0,
    );

    for (const msg of botEmbedMessages.values()) {
      const recoveredEmbeds = msg.embeds.map((embed) =>
        createRecoveredEmbed(embed, executor, timestamp),
      );

      await msg.channel.send({
        content: `<@&${HR_ROLE_ID}>`,
        embeds: recoveredEmbeds,
      });
    }
  } catch (error) {
    console.error("Failed to recover bulk deleted logs:", error);
  }
});

// -----------------------------------------------------
// LOGIN
// -----------------------------------------------------
client.login(process.env.TOKEN);
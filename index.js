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
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
} = require("discord.js");
const fs = require("node:fs");
const path = require("node:path");
const embedTemplate = require("./utils/embedTemplate");
const { getUserRecord, updateUserRecord } = require("./economy/economyutils");

// -----------------------------------------------------
// CONFIGURATION SETUP
// -----------------------------------------------------
const GENERAL_LOG_CHANNEL = "1534886183040188547"; // Bot logs channel ID
const SESSION_LOG_CHANNEL = "1534889791416438784"; // Session logs channel ID
const HR_ROLE_ID = "1350582607217430650"; // HR Role ID to ping

// Custom emoji/style constants (kept centralized so style stays consistent everywhere)
const SUN = "<a:gvcsunspin:1527220557890850846>";
const ARROW = "<:arrowright:1534182706836144158>";

// customIds treated as "session link" buttons — only these hit the reaction-gate logic
const SESSION_LINK_IDS = [
  "release_link",
  "reinvites_link",
  "earlyaccess_link",
  "regen_link",
];

// Slash command names (or substrings) considered session-related for dual logging
const SESSION_COMMANDS = [
  "session",
  "release",
  "reinvite",
  "earlyaccess",
  "regen",
];

const protect = require("./security/protect");
protect.enableGlobalProtection();

// -----------------------------------------------------
// HELPERS
// -----------------------------------------------------

// Create/resend recovered log embeds
function createRecoveredEmbed(originalEmbed, executor, timestamp) {
  const recoveredEmbed = { ...originalEmbed.data };
  recoveredEmbed.color = parseInt("db2727", 16);
  recoveredEmbed.title = `${SUN} RECOVERED DELETED LOG BY ${executor.tag || executor.username} AT ${timestamp} ${SUN}`;
  return recoveredEmbed;
}

// Recursively flattens subcommand/subcommand-group option trees so every
// argument (no matter how deeply nested) gets logged.
function flattenOptions(options = []) {
  let result = [];
  for (const opt of options) {
    if (opt.options) result = result.concat(flattenOptions(opt.options));
    else result.push(opt);
  }
  return result;
}

function formatOptionValue(opt) {
  if (opt.user) return `${opt.user} (${opt.user.id})`;
  if (opt.channel) return `${opt.channel} (${opt.channel.id})`;
  if (opt.role) return `${opt.role} (${opt.role.id})`;
  if (opt.attachment) return `${opt.attachment.url}`;
  return opt.value;
}

function isSessionRelated(commandName = "") {
  return SESSION_COMMANDS.some((s) => commandName.toLowerCase().includes(s));
}

// Sends a log embed to one or more channels in the main guild
function logEvent(
  client,
  channelIds,
  title,
  interaction,
  extraDescription = "",
) {
  const guild = client.guilds.cache.get("1058305800252182528");
  if (!guild) return;

  const unix = Math.floor(Date.now() / 1000);
  const timestamp = `<t:${unix}:F>`;

  const description =
    `> ${ARROW} **User:** ${interaction.user} (${interaction.user.id})\n` +
    `> ${ARROW} **Guild:** ${guild.name} (${guild.id})\n` +
    (interaction.channel
      ? `> ${ARROW} **Channel:** ${interaction.channel} (${interaction.channel.id})\n`
      : `> ${ARROW} **Channel:** DM\n`) +
    (interaction.message
      ? `> ${ARROW} **Message ID:** ${interaction.message.id}\n`
      : "") +
    `> ${ARROW} **Timestamp:** ${timestamp}\n\n` +
    extraDescription;

  const { embed } = embedTemplate({ title, description });

  const ids = Array.isArray(channelIds) ? channelIds : [channelIds];
  for (const id of ids) {
    const logChannel = guild.channels.cache.get(id);
    if (logChannel) logChannel.send({ embeds: [embed] }).catch(() => {});
  }
}

async function sendVehiclePage(interaction, vehicles, page, targetId) {
  const perPage = 5;
  const totalPages = Math.max(1, Math.ceil(vehicles.length / perPage));
  const start = page * perPage;
  const pageVehicles = vehicles.slice(start, start + perPage);

  let desc = pageVehicles.length
    ? pageVehicles
        .map(
          (v) =>
            `> • **${v.year} ${v.make} ${v.model}** (${v.color}) — Plate: ${v.plate}`,
        )
        .join("\n")
    : `> <:arrowright:1534182706836144158> No vehicles on this page.`;

  const { embed } = embedTemplate({
    title: `🚗 Registered Vehicles (Page ${page + 1}/${totalPages})`,
    description: desc,
  });

  const targetMember = interaction.guild.members.cache.get(targetId);
  embed.setThumbnail(
    targetMember?.user.displayAvatarURL({ dynamic: true }) ||
      interaction.user.displayAvatarURL({ dynamic: true }),
  );

  const row = new ActionRowBuilder();
  if (page > 0)
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`vehPage_${interaction.user.id}_${targetId}_${page - 1}`)
        .setLabel("⬅ Previous")
        .setStyle(ButtonStyle.Secondary),
    );
  if (page < totalPages - 1)
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`vehPage_${interaction.user.id}_${targetId}_${page + 1}`)
        .setLabel("Next ➡")
        .setStyle(ButtonStyle.Secondary),
    );

  return interaction.reply({
    embeds: [embed],
    components: row.components.length ? [row] : [],
    ephemeral: true,
  });
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
for (const folder of fs.readdirSync(foldersPath)) {
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((f) => f.endsWith(".js"));
  for (const file of commandFiles) {
    const command = require(path.join(commandsPath, file));
    client.commands.set(command.data.name, command);
  }
}

client.once(Events.ClientReady, () =>
  console.log(`🟢 Bot is online as ${client.user.tag}`),
);

// -----------------------------------------------------
// GLOBAL INTERACTION HANDLER
// -----------------------------------------------------
client.on(Events.InteractionCreate, async (interaction) => {
  try {
    let logTitle = `${SUN} Interaction Used ${SUN}`;
    let extraDetails = "";
    let logChannels = [GENERAL_LOG_CHANNEL];

    // -----------------------------
    // LOGGING (every command/button/menu/modal, every argument)
    // -----------------------------
    if (interaction.isChatInputCommand()) {
      logTitle = `${SUN} Command Used ${SUN}`;

      const flatOptions = flattenOptions(interaction.options.data);
      const optionsFormatted = flatOptions
        .map((opt) => `> ${ARROW} **${opt.name}:** ${formatOptionValue(opt)}`)
        .join("\n");

      extraDetails =
        `> ${ARROW} **Command:** /${interaction.commandName}\n` +
        (optionsFormatted ? `${optionsFormatted}\n` : "");

      if (isSessionRelated(interaction.commandName))
        logChannels = [GENERAL_LOG_CHANNEL, SESSION_LOG_CHANNEL];
    } else if (interaction.isButton()) {
      logTitle = `${SUN} Button Clicked ${SUN}`;
      extraDetails = `> ${ARROW} **Button ID:** ${interaction.customId}`;
      if (SESSION_LINK_IDS.includes(interaction.customId))
        logChannels = [GENERAL_LOG_CHANNEL, SESSION_LOG_CHANNEL];
    } else if (interaction.isAnySelectMenu()) {
      logTitle = `${SUN} Menu Selected ${SUN}`;
      extraDetails =
        `> ${ARROW} **Menu ID:** ${interaction.customId}\n` +
        `> ${ARROW} **Values:** ${interaction.values.join(", ")}`;
    } else if (interaction.isModalSubmit()) {
      logTitle = `${SUN} Modal Submitted ${SUN}`;
      extraDetails = `> ${ARROW} **Modal ID:** ${interaction.customId}`;
    } else if (interaction.isContextMenuCommand()) {
      logTitle = `${SUN} Context Menu Used ${SUN}`;
      extraDetails = `> ${ARROW} **Context Command:** ${interaction.commandName}`;
      if (isSessionRelated(interaction.commandName))
        logChannels = [GENERAL_LOG_CHANNEL, SESSION_LOG_CHANNEL];
    }

    logEvent(client, logChannels, logTitle, interaction, extraDetails);

    // -----------------------------
    // CHAT INPUT COMMANDS
    // -----------------------------
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;
      return command.execute(interaction);
    }

    // -----------------------------
    // VIEW REGISTRATIONS / RECORDS BUTTON
    // -----------------------------
    if (
      interaction.isButton() &&
      interaction.customId.startsWith("viewRecords_")
    ) {
      const [, viewerId, targetId] = interaction.customId.split("_");
      const targetMember = interaction.guild.members.cache.get(targetId);
      const userRecord = await getUserRecord(targetId);

      if (!userRecord.records)
        userRecord.records = { citations: [], warrants: [], blackpoints: 0 };

      const { citations, warrants, blackpoints } = userRecord.records;

      let desc = `> ${ARROW} **Blackpoints:** ${blackpoints}\n\n`;

      desc += `> ${ARROW} **Citations:**\n`;
      desc += citations.length
        ? citations
            .map((c) => `> • **${c.case}** — ${c.violation} — $${c.price}`)
            .join("\n") + "\n\n"
        : "> • None\n\n";

      desc += `> ${ARROW} **Warrants:**\n`;
      desc += warrants.length
        ? warrants
            .map((w) => `> • ⚠️ **${w.case}** — ${w.offense}`)
            .join("\n") + "\n\n"
        : "> • None\n\n";

      // Only show fine payment menu if viewer == target
      const options =
        viewerId === targetId
          ? citations.map((c) => ({
              label: `${c.case} — $${c.price}`,
              description: `${c.violation} | ${c.offense}`,
              value: c.case,
            }))
          : [];

      const row =
        options.length > 0
          ? new ActionRowBuilder().addComponents(
              new StringSelectMenuBuilder()
                .setCustomId(`payfine_select_${targetId}`)
                .setPlaceholder("Select a fine to pay")
                .addOptions(options),
            )
          : null;

      const { embed } = embedTemplate({
        title: `${SUN} ${viewerId === targetId ? "Your" : `${targetMember?.user.username}'s`} Records ${SUN}`,
        description: desc,
        noLogo: true,
      });

      embed.setThumbnail(
        targetMember?.user.displayAvatarURL({ dynamic: true }) ||
          interaction.user.displayAvatarURL({ dynamic: true }),
      );

      return interaction.reply({
        embeds: [embed],
        components: row ? [row] : [],
        ephemeral: true,
      });
    }

    // -----------------------------
    // PAYFINE SELECT MENU HANDLER
    // -----------------------------
    if (
      interaction.isStringSelectMenu() &&
      interaction.customId.startsWith("payfine_select")
    ) {
      await interaction.deferReply({ flags: 64 }); // ephemeral

      // Ownership check — customId carries the profile owner's ID
      const profileOwnerId = interaction.customId.split("_")[2];
      if (profileOwnerId && interaction.user.id !== profileOwnerId) {
        return interaction.editReply({
          content: "❌ You can only pay your own fines.",
        });
      }

      const caseNumber = interaction.values[0];
      const userId = interaction.user.id;
      const userRecord = await getUserRecord(userId);
      const citation = userRecord.records?.citations?.find(
        (c) => c.case === caseNumber,
      );

      if (!citation)
        return interaction.editReply({ content: "❌ Citation not found." });

      const cash = userRecord.cash ?? 0;

      // CASH-ONLY CHECK — now a styled embed matching the arrow/bullet/sun theme
      if (cash < citation.price) {
        const { embed } = embedTemplate({
          title: `${SUN} Insufficient Cash ${SUN}`,
          description:
            `> ${ARROW} **Required:** $${citation.price}\n` +
            `> ${ARROW} **You Have:** $${cash}\n\n` +
            `> ${ARROW} Please withdraw from your bank first.`,
        });
        return interaction.editReply({ embeds: [embed] });
      }

      userRecord.cash = cash - citation.price;
      userRecord.records.citations = userRecord.records.citations.filter(
        (c) => c.case !== caseNumber,
      );
      await updateUserRecord(userRecord);

      const { embed } = embedTemplate({
        title: `${SUN} Fine Paid ${SUN}`,
        description:
          `> ${ARROW} **Case:** ${citation.case}\n` +
          `> ${ARROW} **Violation:** ${citation.violation}\n` +
          `> ${ARROW} **Offense:** ${citation.offense}\n` +
          `> ${ARROW} **Amount Paid:** $${citation.price}\n\n` +
          `> ${ARROW} **New Cash Balance:** $${userRecord.cash}`,
      });
      return interaction.editReply({ embeds: [embed] });
    }

    // VIEW BALANCE BUTTON
    if (
      interaction.isButton() &&
      interaction.customId.startsWith("viewBalance_")
    ) {
      const [, viewerId, targetId] = interaction.customId.split("_");
      const targetRecord = await getUserRecord(targetId);
      const cash = targetRecord.cash ?? 0;
      const bank = targetRecord.bank ?? 0;

      const desc =
        `> ${ARROW} **Cash:** $${cash.toLocaleString()}\n` +
        `> ${ARROW} **Bank:** $${bank.toLocaleString()}`;

      const { embed } = embedTemplate({
        title: `${SUN} ${viewerId === targetId ? "Your" : "Their"} Balance Overview ${SUN}`,
        description: desc,
        noLogo: true,
      });

      const targetMember = interaction.guild.members.cache.get(targetId);
      embed.setThumbnail(
        targetMember?.user.displayAvatarURL({ dynamic: true }) ||
          interaction.user.displayAvatarURL({ dynamic: true }),
      );

      return interaction.reply({ embeds: [embed], flags: 64 });
    }

    // VIEW ALL VEHICLES BUTTON
    if (
      interaction.isButton() &&
      interaction.customId.startsWith("viewVehicles_")
    ) {
      const [, viewerId, targetId] = interaction.customId.split("_");
      const targetRecord = await getUserRecord(targetId);
      const vehicles = targetRecord.vehicles ?? [];

      if (vehicles.length === 0) {
        const { embed } = embedTemplate({
          title: "🚗 Registered Vehicles",
          description: `> <:arrowright:1534182706836144158> ${
            viewerId === targetId ? "You have" : "They have"
          } no registered vehicles.`,
          noLogo: true,
        });

        const targetMember = interaction.guild.members.cache.get(targetId);
        embed.setThumbnail(
          targetMember?.user.displayAvatarURL({ dynamic: true }) ||
            interaction.user.displayAvatarURL({ dynamic: true }),
        );

        return interaction.reply({ embeds: [embed], flags: 64 });
      }

      return sendVehiclePage(interaction, vehicles, 0, targetId);
    }

    // -----------------------------
    // VEHICLE PAGINATION BUTTON
    // -----------------------------
    if (interaction.isButton() && interaction.customId.startsWith("vehPage_")) {
      const [, viewerId, targetId, pageStr] = interaction.customId.split("_");
      const targetRecord = await getUserRecord(targetId);
      const vehicles = targetRecord.vehicles ?? [];

      return sendVehiclePage(
        interaction,
        vehicles,
        parseInt(pageStr, 10),
        targetId,
      );
    }

    // -----------------------------
    // SESSION LINK BUTTONS (reaction-gated) — scoped to real session buttons only
    // -----------------------------
    if (
      interaction.isButton() &&
      SESSION_LINK_IDS.includes(interaction.customId)
    ) {
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
          title: "... Access Denied ...",
          description:
            "> You must react to the Startup Embed before accessing the session link.",
        });
        return interaction.reply({ embeds: [embed], flags: 64 });
      }

      const link = interaction.message.sessionLink || "Link unavailable.";
      const labels = {
        release_link: "Session Link",
        reinvites_link: "Reinvite Link",
        earlyaccess_link: "Early Access Link",
        regen_link: "Regenerated Link",
      };
      const linkLabel = labels[interaction.customId] || "Link";

      const { embed } = embedTemplate({
        title: `${SUN} ${linkLabel} ${SUN}`,
        description: `> ${ARROW} Here is your ${linkLabel.toLowerCase()}:\n${link}`,
      });
      return interaction.reply({ embeds: [embed], flags: 64 });
    }

    // Any other/unhandled button (e.g. claim_ticket) falls through harmlessly.
  } catch (error) {
    console.error("Interaction error:", error);
    const { embed } = embedTemplate({
      title: "⚠️ Error ⚠️",
      description: `> ${ARROW} There was an error executing this interaction.`,
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
  if (
    ![GENERAL_LOG_CHANNEL, SESSION_LOG_CHANNEL].includes(message.channelId) ||
    !message.author?.bot ||
    !message.embeds.length
  )
    return;

  try {
    const unix = Math.floor(Date.now() / 1000);
    const timestamp = `<t:${unix}:F>`;

    const fetchedLogs = await message.guild.fetchAuditLogs({
      limit: 1,
      type: AuditLogEvent.MessageDelete,
    });
    const deletionLog = fetchedLogs.entries.first();

    let executor = { tag: "Unknown User", username: "Unknown User" };
    if (
      deletionLog &&
      deletionLog.target.id === message.author.id &&
      deletionLog.createdTimestamp > Date.now() - 5000
    ) {
      executor = deletionLog.executor;
    }

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
  if (
    !firstMsg ||
    ![GENERAL_LOG_CHANNEL, SESSION_LOG_CHANNEL].includes(firstMsg.channelId)
  )
    return;

  try {
    const unix = Math.floor(Date.now() / 1000);
    const timestamp = `<t:${unix}:F>`;

    const fetchedLogs = await firstMsg.guild.fetchAuditLogs({
      limit: 1,
      type: AuditLogEvent.MessageBulkDelete,
    });
    const deletionLog = fetchedLogs.entries.first();

    let executor = { tag: "Unknown User", username: "Unknown User" };
    if (deletionLog && deletionLog.createdTimestamp > Date.now() - 5000)
      executor = deletionLog.executor;

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

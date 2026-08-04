const { SlashCommandBuilder } = require("discord.js");
const path = require("node:path");
const embedTemplate = require("../../utils/embedTemplate");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("sessionover")
    .setDescription(
      "End the session, clean up old messages, and send a summary",
    )
    .addStringOption((option) =>
      option
        .setName("notes")
        .setDescription("Session notes by the host")
        .setRequired(true),
    ),

  async execute(interaction) {
    const staffRoleId = "1350897509752373341"; // Host role

    if (!interaction.member.roles.cache.has(staffRoleId)) {
      return interaction.reply({
        content: "You do not have permission to use this command.",
        flags: 64,
      });
    }

    await interaction.deferReply({ flags: 64 });

    // 🔍 Fetch recent messages
    const recentMessages = await interaction.channel.messages.fetch({
      limit: 100,
    });

    // 🔍 Find the release message
    const releaseMessage = recentMessages.find((m) =>
      m.embeds[0]?.title?.includes("Session Release"),
    );

    if (!releaseMessage) {
      return interaction.editReply({
        content:
          "No session release found. You must run /sessionover in the session channel.",
      });
    }

    // 🕒 Session timing
    const startTime = releaseMessage.createdAt;
    const finishTime = new Date();

    const totalDurationMs = finishTime - startTime;
    const totalMinutes = Math.floor(totalDurationMs / 60000);
    const totalHours = Math.floor(totalMinutes / 60);
    const remainingMinutes = totalMinutes % 60;

    // 🔁 Count reinvites
    const reinvitesMessages = recentMessages.filter((m) =>
      m.embeds[0]?.title?.includes("Reinvites"),
    );
    const reinvitesCount = reinvitesMessages.size;

    // 🧹 Delete all non-pinned bot messages
    let deletedCount = 0;
    let lastMessageId = null;

    while (true) {
      const fetched = await interaction.channel.messages.fetch({
        limit: 100,
        before: lastMessageId || undefined,
      });

      if (fetched.size === 0) break;

      const deletable = fetched.filter((m) => m.author.bot && !m.pinned);

      for (const msg of deletable.values()) {
        try {
          await msg.delete();
          deletedCount++;
        } catch (err) {
          if (err.code !== 10008) console.log("[DEBUG] Failed to delete:", err);
        }
      }

      lastMessageId = fetched.last().id;
    }

    // 📝 Host notes
    const notes = interaction.options.getString("notes");
    const host = interaction.user;

    // 🧱 Build summary embed
    const description =
      `${host} has ended their session.\n\n` +
      `> **Session Summary**\n` +
      `> <:bulletpoint:1534184707900837961> **__Start Time:__** <t:${Math.floor(startTime.getTime() / 1000)}:F>\n` +
      `> <:bulletpoint:1534184707900837961> **__Finish Time:__** <t:${Math.floor(finishTime.getTime() / 1000)}:F>\n` +
      `> <:bulletpoint:1534184707900837961> **__Total Duration:__** ${totalHours}h ${remainingMinutes}m\n` +
      `> <:bulletpoint:1534184707900837961> **__Reinvites Sent:__** ${reinvitesCount}\n\n` +
      `> <:bulletpoint:1534184707900837961> **__Host Notes:__** ${notes}`;

    const { embed, files } = embedTemplate({
      title:
        "<a:gvcsunspin:1527220557890850846> Greenville Community - *__Session Over__* <a:gvcsunspin:1527220557890850846>",
      description,
      banner: path.join(__dirname, "../../graphics/gvcsessionover.png"),
    });

    // 📤 Send summary
    await interaction.channel.send({
      embeds: [embed],
      files,
    });

    await interaction.editReply({
      content: `Session summary sent successfully.\n🧹 Deleted **${deletedCount}** bot messages (excluding pinned).`,
    });

    // ⭐ SESSION LOGGING (ONLY HERE)
    const sessionLogChannel = interaction.guild.channels.cache.get(
      "1362152050183635055",
    );

    if (sessionLogChannel) {
      const unix = Math.floor(Date.now() / 1000);
      const timestamp = `<t:${unix}:F>`;

      const { embed: logEmbed } = embedTemplate({
        title:
          "<:shines:1524097104547680276> Session Logged <:shines:1524097104547680276>",
        description:
          `> <:arrowright:1534182706836144158> **Host:** ${host} (${host.id})\n` +
          `> <:arrowright:1534182706836144158> **Channel:** ${interaction.channel} (${interaction.channel.id})\n` +
          `> <:arrowright:1534182706836144158> **Guild:** ${interaction.guild.name} (${interaction.guild.id})\n` +
          `> <:arrowright:1534182706836144158> **Message ID:** ${interaction.id}\n` +
          `> <:arrowright:1534182706836144158> **Logged At:** ${timestamp}\n\n` +
          `> <:arrowright:1534182706836144158> **Duration:** ${totalHours}h ${remainingMinutes}m\n` +
          `> <:arrowright:1534182706836144158> **Reinvites:** ${reinvitesCount}\n` +
          `> <:arrowright:1534182706836144158> **Notes:** ${notes}`,
      });

      await sessionLogChannel.send({ embeds: [logEmbed] });
    }
  },
};

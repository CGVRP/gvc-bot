const { SlashCommandBuilder } = require("discord.js");
const path = require("node:path");
const embedTemplate = require("../../utils/embedTemplate");
const protect = require("../../security/protect");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("cancel")
    .setDescription("Cancel the current session and announce it")
    .addStringOption((option) =>
      option
        .setName("notes")
        .setDescription("Reason for cancellation")
        .setRequired(true),
    ),

  async execute(interaction) {
    // Anti-spam
    if (!protect.applyRateLimit(interaction.user.id)) {
      return interaction.reply({ content: "Slow down.", flags: 64 });
    }

    // Staff-only
    const staffRoleId = "1350897509752373341";
    if (!interaction.member.roles.cache.has(staffRoleId)) {
      return interaction.reply({
        content: "You do not have permission to use this command.",
        flags: 64,
      });
    }

    await interaction.deferReply({ flags: 64 });

    const notes = protect.sanitize(interaction.options.getString("notes"));
    const host = interaction.user;

    // Safe message deletion
    const messages = await interaction.channel.messages.fetch({ limit: 100 });
    const deletable = messages.filter((m) => m.author.bot && !m.pinned);

    for (const msg of deletable.values()) {
      msg.delete().catch(() => {});
    }

    const description =
      `> <:arrowright:1534182706836144158> This session has been canceled by ${host}.\n\n` +
      `> <:arrowright:1534182706836144158> **Reason:** ${notes}`;

    const { embed, files } = embedTemplate({
      title:
        "<a:gvcsunspin:1527220557890850846> Greenville Community - *__Session Cancelled__* <a:gvcsunspin:1527220557890850846>",
      description,
      banner: path.join(__dirname, "../../graphics/gvccancelled.png"),
    });

    await interaction.channel.send({ embeds: [embed], files });
    await interaction.editReply({ content: "Session canceled successfully." });
  },
};

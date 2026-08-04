const { SlashCommandBuilder } = require("discord.js");
const path = require("node:path");
const embedTemplate = require("../../utils/embedTemplate");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("cancel")
    .setDescription("Cancel the current session and announce it")
    .addStringOption(option =>
      option.setName("notes")
        .setDescription("Reason for cancellation")
        .setRequired(true)
    ),

  async execute(interaction) {
    const staffRoleId = "1350897509752373341"; // Staff role
    if (!interaction.member.roles.cache.has(staffRoleId)) {
      return interaction.reply({ content: "You do not have permission to use this command.", flags: 64 });
    }

    await interaction.deferReply({ flags: 64 });

    const notes = interaction.options.getString("notes");
    const host = interaction.user;

    // 🧹 Delete all non-pinned bot messages
    const messages = await interaction.channel.messages.fetch({ limit: 100 });
    const deletable = messages.filter(m => m.author.bot && !m.pinned);

    for (const msg of deletable.values()) {
      await msg.delete().catch(() => {});
    }

    // 🟥 Build cancel embed
    const description =
      `> <:arrowright:1534182706836144158> This session has been canceled by ${host}.  We apologize for the inconvenience. Please stay tuned for future sessions.\n\n` +
      `> <:arrowright:1534182706836144158> **Reason:** ${notes}`;

    const { embed, files } = embedTemplate({
      title: "<a:gvcsunspin:1527220557890850846> Greenville Community - *__Session Cancelled__* <a:gvcsunspin:1527220557890850846>",
      description,
      banner: path.join(__dirname, "../../graphics/gvccancelled.png")
    });

    await interaction.channel.send({ embeds: [embed], files });
    await interaction.editReply({ content: "Session canceled successfully." });
  }
};

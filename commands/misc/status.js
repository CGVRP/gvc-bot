const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("status")
    .setDescription("Update the bot's status")
    .addStringOption(option =>
      option.setName("text")
        .setDescription("The status text you want the bot to display")
        .setRequired(true)
    ),

  async execute(interaction) {
    const allowedRole = "1350582607217430650"; // Bot Developer role

    // Permission check
    if (!interaction.member.roles.cache.has(allowedRole)) {
      return interaction.reply({
        content: "You do not have permission to use this command.",
        flags: 64 // ephemeral
      });
    }

    await interaction.deferReply({ flags: 64 });

    const statusText = interaction.options.getString("text");

    // Update bot presence
    interaction.client.user.setPresence({
      activities: [{ name: statusText }],
      status: "online"
    });

    // Simple confirmation
    await interaction.editReply({
      content: `Status updated to: **${statusText}**`
    });
  }
};

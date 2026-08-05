const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("directmessage")
    .setDescription("Send a direct message to a specific user")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user you want to direct message")
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("message")
        .setDescription("The message to send to the user")
        .setRequired(true),
    ),

  async execute(interaction) {
    const hrRoleId = "1350582607217430650"; // HR role ID

    // Permission check
    if (!interaction.member.roles.cache.has(hrRoleId)) {
      return interaction.reply({
        content: "You do not have permission to use this command.",
        flags: 64,
      });
    }

    const targetUser = interaction.options.getUser("user");
    const messageContent = interaction.options.getString("message");

    // Defer reply privately in case the DM takes a moment
    await interaction.deferReply({ flags: 64 });

    try {
      // Send the DM to the specified user
      await targetUser.send(messageContent);

      await interaction.editReply({
        content: `Successfully sent a direct message to ${targetUser}.`,
      });
    } catch (error) {
      // Handle closed DMs or blocked bot errors (DiscordAPIError 50007)
      await interaction.editReply({
        content: `Failed to send direct message to ${targetUser}. They may have DMs disabled or have blocked the bot.`,
      });
    }
  },
};
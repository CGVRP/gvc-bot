const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const path = require("node:path");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("startup")
    .setDescription("Send the startup session embed")
    .addIntegerOption((option) =>
      option
        .setName("reactions")
        .setDescription("Number of reactions needed to start the session")
        .setRequired(true),
    ),

  async execute(interaction) {
    const staffRoleId = "1350897509752373341"; // Staff role ID

    // Permission check
    if (!interaction.member.roles.cache.has(staffRoleId)) {
      return interaction.reply({
        content: "You do not have permission to use this command.",
        flags: 64,
      });
    }

    const reactionsNeeded = interaction.options.getInteger("reactions");
    const host = interaction.user;

    // Prevent timeout
    await interaction.deferReply({ flags: 64 });

    // Build embed
    const embedTemplate = require("../../utils/embedTemplate");

    const { embed, files } = embedTemplate({
      title: "<a:gvcsunspin:1527220557890850846> Greenville Community - *__Session Startup__* <a:gvcsunspin:1527220557890850846>",
      description:
        `> <:arrowright:1534182706836144158> ${host} is hosting a session. If you wish to join, please react below. Make sure you have read all the information and rules  in <#1058639853937492132>.\n\n` +
        `**Startup Information**\n` +
        `> <:arrowright:1534182706836144158> If the reaction requirement is not met within 20 minutes, the session will be cancelled.\n` +
        `> <:arrowright:1534182706836144158> Reacting but not joining the session will result in moderation.\n\n` +
        `> <:arrowright:1534182706836144158> For this session to commence, **${reactionsNeeded}** reactions are required.`,
      banner: path.join(__dirname, "../../graphics/gvcstartup.png"),
    });

    const sent = await interaction.channel.send({
      content: "@everyone",
      embeds: [embed],
      files,
      allowedMentions: { parse: ["everyone"] },
    });

    // Updated reaction emoji
    await sent.react("<:orangecheck:1518181035534188604>");

    await interaction.editReply({
      content: "Startup embed sent successfully.",
    });
  },
};

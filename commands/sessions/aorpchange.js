const { SlashCommandBuilder } = require("discord.js");
const embedTemplate = require("../../utils/embedTemplate");
const protect = require("../../security/protect");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("aorpchange")
    .setDescription("Announce an AORP change.")
    .addStringOption(option =>
      option
        .setName("aorp")
        .setDescription("The new AORP value")
        .setRequired(true)
    ),

  async execute(interaction) {
    // Rate limit
    if (!protect.applyRateLimit(interaction.user.id)) {
      return interaction.reply({ content: "Slow down.", flags: 64 });
    }

    // Staff check
    const staffRoleId = "1350897509752373341";
    if (!interaction.member.roles.cache.has(staffRoleId)) {
      return interaction.reply({
        content: "You do not have permission to use this command.",
        flags: 64,
      });
    }

    await interaction.deferReply({ flags: 64 });

    const newAorp = interaction.options.getString("aorp");
    const host = interaction.user;

    const description =
      `> <:arrowright:1534182706836144158> AORP has been changed to **${newAorp}** by ${host}.`;

    const { embed } = embedTemplate({
      title:
        "<a:gvcsunspin:1527220557890850846> Greenville Community - *__AORP Change__* <a:gvcsunspin:1527220557890850846>",
      description,
    });

    await interaction.channel.send({ embeds: [embed] });

    await interaction.editReply({
      content: "AORP change announcement sent successfully.",
    });
  },
};

const { SlashCommandBuilder } = require("discord.js");
const embedTemplate = require("../../utils/embedTemplate");
const { getUserRecord } = require("../../economy/economyutils");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("balance")
    .setDescription("Check your current cash balance."),

  async execute(interaction) {
    await interaction.deferReply();

    const userId = interaction.user.id;
    const user = await getUserRecord(userId);

    const cash = user.cash ?? 0;
    const lastCollect = user.lastCollect ?? 0;

    const desc =
      `> <:arrowright:1534182706836144158> **Current Balance:** $${cash}\n` +
      `> <:arrowright:1534182706836144158> **Last Collected:** ${
        lastCollect
          ? `<t:${Math.floor(lastCollect / 1000)}:R>`
          : "Never collected"
      }`;

    const { embed } = embedTemplate({
      title:
        "<a:gvcsunspin:1527220557890850846> Your Balance <a:gvcsunspin:1527220557890850846>",
      description: desc,
      noLogo: true,
    });

    embed.setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }));

    await interaction.editReply({
      embeds: [embed],
    });
  },
};

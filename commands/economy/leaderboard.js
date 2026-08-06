const { SlashCommandBuilder } = require("discord.js");
const embedTemplate = require("../../utils/embedTemplate");
const { loadEconomy } = require("../../economy/economyutils");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("leaderboard")
    .setDescription("View the top richest players."),

  async execute(interaction) {
    await interaction.deferReply();

    const economy = await loadEconomy();

    if (!economy.length) {
      const { embed } = embedTemplate({
        title:
          "<a:gvcsunspin:1527220557890850846> Economy Leaderboard <a:gvcsunspin:1527220557890850846>",
        description:
          "> <:bulletpoint:1524621721318195230> No economy data found."
      });
      return interaction.editReply({ embeds: [embed] });
    }

    // Sort by cash descending (safe default)
    const sorted = [...economy].sort((a, b) => (b.cash ?? 0) - (a.cash ?? 0));

    // Top 10
    const top = sorted.slice(0, 10);

    let desc = "";

    top.forEach((user, index) => {
      const member = interaction.guild.members.cache.get(user.userId);
      const name = member
        ? member.user.username
        : `Unknown User (${user.userId})`;

      desc += `> <:bulletpoint:1534184707900837961> **#${index + 1}** — ${name}: $${user.cash ?? 0}\n`;
    });

    // Your personal rank
    const yourRank =
      sorted.findIndex((u) => u.userId === interaction.user.id) + 1;

    desc += `\n> <:arrowright:1534182706836144158> **Your Rank:** #${yourRank}`;

    const { embed } = embedTemplate({
      title:
        "<a:gvcsunspin:1527220557890850846> Economy Leaderboard <a:gvcsunspin:1527220557890850846>",
      description: desc
      // No color → uses DEFAULT_COLOR (0xFFAD65)
    });

    // Add server icon thumbnail properly
    embed.setThumbnail(interaction.guild.iconURL({ dynamic: true }));

    await interaction.editReply({
      embeds: [embed]
    });
  }
};

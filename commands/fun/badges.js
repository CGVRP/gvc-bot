const { SlashCommandBuilder } = require("discord.js");
const embedTemplate = require("../../utils/embedTemplate");

// Single source of truth for badge definitions — keep this in sync with the
// badge-award logic in civilianprofile.js if thresholds ever change.
const BADGES = [
  {
    emoji: "💰",
    name: "High Roller",
    howTo: "Have **$100,000** or more in cash.",
  },
  {
    emoji: "🚗",
    name: "Collector",
    howTo: "Register **5 or more vehicles**.",
  },
  {
    emoji: "🏅",
    name: "Top Earner",
    howTo: "Reach **$1,000** or more in Total Role Income.",
  },
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName("badges")
    .setDescription("View every badge and how to obtain it."),

  async execute(interaction) {
    const desc = BADGES.map(
      (b) =>
        `> <:arrowright:1534182706836144158> ${b.emoji} **${b.name}**\n` +
        `> • ${b.howTo}`,
    ).join("\n\n");

    const { embed } = embedTemplate({
      title:
        "<a:gvcsunspin:1527220557890850846> Badge List <a:gvcsunspin:1527220557890850846>",
      description: desc,
    });

    return interaction.reply({ embeds: [embed] });
  },
};

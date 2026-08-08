const { SlashCommandBuilder } = require("discord.js");
const embedTemplate = require("../../utils/embedTemplate");
const applyRoleLogic = require("../../utils/roleLogic");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("updateall")
    .setDescription("Force update all member roles (HR only)"),

  async execute(interaction) {
    const HR_ROLE = "1350582607217430650"; // your HR role

    if (!interaction.member.roles.cache.has(HR_ROLE)) {
      return interaction.reply({
        content: "You do not have permission.",
        flags: 64,
      });
    }

    await interaction.deferReply({ flags: 64 });

    const guild = interaction.guild;
    await guild.members.fetch();

    let updated = 0;

    for (const member of guild.members.cache.values()) {
      if (member.user.bot) continue;

      const result = await applyRoleLogic(member);
      if (result) updated++;
    }

    const { embed } = embedTemplate({
      title: "Manual Role Update",
      description:
        `> Updated roles for **${updated}** members.\n` +
        `> Timestamp: <t:${Math.floor(Date.now() / 1000)}:F>`,
      noLogo: false,
    });

    await interaction.editReply({ embeds: [embed] });
  },
};

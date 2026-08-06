const { SlashCommandBuilder } = require("discord.js");
const embedTemplate = require("../../utils/embedTemplate");
const protect = require("../../security/protect");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("cohostended")
    .setDescription("Announce that your co-host has finished their duties"),

  async execute(interaction) {
    if (!protect.applyRateLimit(interaction.user.id)) {
      return interaction.reply({ content: "Slow down.", flags: 64 });
    }

    const staffRoleId = "1350897509752373341";
    if (!interaction.member.roles.cache.has(staffRoleId)) {
      return interaction.reply({
        content: "You do not have permission to use this command.",
        flags: 64,
      });
    }

    await interaction.deferReply({ flags: 64 });

    const host = interaction.user;

    const description = `> <:arrowright:1534182706836144158> ${host} has ended their co-host duties.`;

    const { embed } = embedTemplate({
      title:
        "<a:gvcsunspin:1527220557890850846> Greenville Community - *__Co-host Ended__* <a:gvcsunspin:1527220557890850846>",
      description,
    });

    await interaction.channel.send({ embeds: [embed] });
    await interaction.editReply({
      content: "Co-host ended announcement sent successfully.",
    });
  },
};

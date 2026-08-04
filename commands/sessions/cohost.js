const { SlashCommandBuilder } = require("discord.js");
const embedTemplate = require("../../utils/embedTemplate");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("cohost")
    .setDescription("Announce that you are adding a co-host to the session"),

  async execute(interaction) {
    const staffRoleId = "1350897509752373341"; // Staff role
    if (!interaction.member.roles.cache.has(staffRoleId)) {
      return interaction.reply({ content: "You do not have permission to use this command.", flags: 64 });
    }

    await interaction.deferReply({ flags: 64 });

    const host = interaction.user;

    const description =
      `> <:arrowright:1534182706836144158> ${host} is now co-hosting the session. Please cooperate with them during the session.`;
      
    const { embed } = embedTemplate({
      title: "<a:gvcsunspin:1527220557890850846> Greenville Community - *__Co-host__* <a:gvcsunspin:1527220557890850846>",
      description
    });

    await interaction.channel.send({ embeds: [embed] });
    await interaction.editReply({ content: "Co-host announcement sent successfully." });
  }
};

const { SlashCommandBuilder } = require("discord.js");
const embedTemplate = require("../../utils/embedTemplate");
const protect = require("../../security/protect");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("reinvitesover")
    .setDescription("End the reinvites phase and announce completion"),

  async execute(interaction) {
    // Anti-spam
    if (!protect.applyRateLimit(interaction.user.id)) {
      return interaction.reply({ content: "Slow down.", flags: 64 });
    }

    // Staff-only
    const staffRoleId = "1350897509752373341";
    if (!interaction.member.roles.cache.has(staffRoleId)) {
      return interaction.reply({
        content: "You do not have permission to use this command.",
        flags: 64,
      });
    }

    await interaction.deferReply({ flags: 64 });

    const messages = await interaction.channel.messages.fetch({ limit: 50 });

    const reinvitesMessage = messages.find((m) =>
      m.embeds[0]?.title?.includes("Reinvites"),
    );

    if (reinvitesMessage) {
      await reinvitesMessage.delete().catch(() => {});
    }

    const description = `> <:arrowright:1534182706836144158> Reinvites are now over. Please wait patiently for the next round.`;

    const { embed } = embedTemplate({
      title:
        "<a:gvcsunspin:1527220557890850846> Greenville Community - *__Reinvites Over__* <a:gvcsunspin:1527220557890850846>",
      description,
    });

    await interaction.channel.send({ embeds: [embed] });

    await interaction.editReply({
      content: "Reinvites over announcement sent successfully.",
    });
  },
};

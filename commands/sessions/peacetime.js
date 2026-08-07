const { SlashCommandBuilder } = require("discord.js");
const embedTemplate = require("../../utils/embedTemplate");
const protect = require("../../security/protect");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("peacetime")
    .setDescription("Change the Peacetime status.")
    .addStringOption(option =>
      option
        .setName("status")
        .setDescription("Select the Peacetime mode")
        .setRequired(true)
        .addChoices(
          { name: "Strict", value: "strict" },
          { name: "Normal", value: "normal" },
          { name: "Off", value: "off" }
        )
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

    const choice = interaction.options.getString("status");
    const host = interaction.user;

    let title =
      "<a:gvcsunspin:1527220557890850846> Greenville Community - *__Peacetime Change__* <a:gvcsunspin:1527220557890850846>";
    let description = "";

    if (choice === "strict") {
      description =
        "> <:arrowright:1534182706836144158> **Peacetime is now Strict.**\n" +
        "> <:arrowright:1534182706836144158> FRP Speeds are **65mph**.\n" +
        "> <:arrowright:1534182706836144158> Double moderations are now enabled.\n" +
        `> <:arrowright:1534182706836144158> Changed by ${host}.`;
    }

    if (choice === "normal") {
      description =
        "> <:arrowright:1534182706836144158> **Peacetime is now Normal.**\n" +
        "> <:arrowright:1534182706836144158> FRP Speeds are **75mph**.\n" +
        `> <:arrowright:1534182706836144158> Changed by ${host}.`;
    }

    if (choice === "off") {
      description =
        "> <:arrowright:1534182706836144158> **Peacetime is now Off.**\n" +
        "> <:arrowright:1534182706836144158> FRP Speeds are **85mph**.\n" +
        "> <:arrowright:1534182706836144158> You may run red lights and commit crimes.\n" +
        "> <:arrowright:1534182706836144158> You must still pull over for LEO and Staff.\n" +
        `> <:arrowright:1534182706836144158> Changed by ${host}.`;
    }

    const { embed } = embedTemplate({
      title,
      description,
    });

    await interaction.channel.send({ embeds: [embed] });

    return interaction.editReply({
      content: "Peacetime change announcement sent successfully.",
    });
  },
};

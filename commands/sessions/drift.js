const { SlashCommandBuilder } = require("discord.js");
const embedTemplate = require("../../utils/embedTemplate");
const protect = require("../../security/protect");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("drift")
    .setDescription("Change the Drift Mode status.")
    .addStringOption((option) =>
      option
        .setName("status")
        .setDescription("Select the Drift Mode")
        .setRequired(true)
        .addChoices(
          { name: "Off", value: "off" },
          { name: "Corners Only", value: "corners" },
          { name: "Fully Enabled", value: "full" },
        ),
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
      "<a:gvcsunspin:1527220557890850846> Greenville Community - *__Drift Mode Change__* <a:gvcsunspin:1527220557890850846>";
    let description = "";

    if (choice === "off") {
      description =
        "> <:arrowright:1534182706836144158> **Drift Mode is now Off.**\n" +
        "> <:arrowright:1534182706836144158> Drifting is prohibited.\n" +
        "> <:arrowright:1534182706836144158> Maintain full vehicle control at all times.\n" +
        `> <:arrowright:1534182706836144158> Changed by ${host}.`;
    }

    if (choice === "corners") {
      description =
        "> <:arrowright:1534182706836144158> **Drift Mode is now Corners Only.**\n" +
        "> <:arrowright:1534182706836144158> Drifting is allowed **only on corners**.\n" +
        `> <:arrowright:1534182706836144158> Changed by ${host}.`;
    }

    if (choice === "full") {
      description =
        "> <:arrowright:1534182706836144158> **Drift Mode is now Fully Enabled.**\n" +
        "> <:arrowright:1534182706836144158> Drifting is allowed anywhere.\n" +
        "> <:arrowright:1534182706836144158> Maintain awareness of traffic and pedestrians.\n" +
        `> <:arrowright:1534182706836144158> Changed by ${host}.`;
    }

    const { embed } = embedTemplate({
      title,
      description,
    });

    await interaction.channel.send({ embeds: [embed] });

    return interaction.editReply({
      content: "Drift mode change announcement sent successfully.",
    });
  },
};

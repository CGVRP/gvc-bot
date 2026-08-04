const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");
const path = require("node:path");
const embedTemplate = require("../../utils/embedTemplate");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("release")
    .setDescription("Release the session.")
    .addStringOption(option =>
      option.setName("link")
        .setDescription("Session link")
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName("aorp")
        .setDescription("Area of Roleplay")
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option.setName("frplimit")
        .setDescription("Fail Roleplay speed limit (MPH)")
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName("peacetimestatus")
        .setDescription("Peacetime status")
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName("psstatus")
        .setDescription("Public Service(s) status")
        .setRequired(true)
    ),

  async execute(interaction) {
    const staffRoleId = "1350897509752373341"; // Staff role

    if (!interaction.member.roles.cache.has(staffRoleId)) {
      return interaction.reply({
        content: "You do not have permission to use this command.",
        flags: 64
      });
    }

    let link = interaction.options.getString("link");

    // Auto-add https:// if missing
    if (!link.startsWith("http://") && !link.startsWith("https://")) {
      link = `https://${link}`;
    }

    const aorp = interaction.options.getString("aorp");
    const frp = interaction.options.getInteger("frplimit");
    const peacetime = interaction.options.getString("peacetimestatus");
    const ps = interaction.options.getString("psstatus");
    const host = interaction.user;

    await interaction.deferReply({ flags: 64 });

    const description =
      `> <:arrowright:1534182706836144158> ${host} has released their session.\n` +
      `> <:arrowright:1534182706836144158> Please read the rules below before joining.\n\n` +
      `**Session Rules:**\n` +
      `> <:bulletpoint:1534184707900837961> **__Peacetime Status:__** ${peacetime}\n` +
      `> <:bulletpoint:1534184707900837961> **__Fail Roleplay Speeds:__** ${frp}MPH\n` +
      `> <:bulletpoint:1534184707900837961> **__Public Service(s) Status__:** ${ps}\n` +
      `> <:bulletpoint:1534184707900837961> **__Area of Roleplay:__** ${aorp}\n\n` +
      `> <:arrowright:1534182706836144158> Click the button below to receive the session link privately.\n`;

    const { embed, files } = embedTemplate({
      title: "<a:gvcsunspin:1527220557890850846> Greenville Community - *__Session Release__* <a:gvcsunspin:1527220557890850846>",
      description,
      banner: path.join(__dirname, "../../graphics/gvcrelease.png")
    });

    // ⭐ Button to reveal the link privately
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("release_link")
        .setLabel("Get Session Link")
        .setStyle(ButtonStyle.Success) // green button
    );

    // Send embed with button
    const sent = await interaction.channel.send({
      content: "<@&1058636416164315147>",
      embeds: [embed],
      files,
      components: [row],
      allowedMentions: { parse: ["roles"] }
    });

    // Store link on the message for the button handler
    sent.sessionLink = link;

    await interaction.editReply({
      content: "Session release embed sent successfully."
    });
  }
};

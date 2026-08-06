const { SlashCommandBuilder } = require("discord.js");
const embedTemplate = require("../../utils/embedTemplate");
const {
  getUserRecord,
  updateUserRecord,
} = require("../../economy/economyutils");

// LEO roles allowed to use this command
const LEO_ROLES = [
  "1352019732055851048",
  "1058635044308123719",
  "1058635001329107005",
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName("citation")
    .setDescription("LEO: Add a citation to a user's record.")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user receiving the citation.")
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("violation")
        .setDescription("Violation type (custom text).")
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("offense")
        .setDescription("Offense description (custom text).")
        .setRequired(true),
    )
    .addIntegerOption((option) =>
      option.setName("price").setDescription("Ticket price.").setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("location")
        .setDescription("Location of the incident.")
        .setRequired(true),
    ),

  async execute(interaction) {
    await interaction.deferReply();

    // LEO role check
    const member = interaction.member;
    const isLEO = LEO_ROLES.some((role) => member.roles.cache.has(role));

    if (!isLEO) {
      const { embed } = embedTemplate({
        title:
          "<a:gvcsunspin:1527220557890850846> Access Denied <a:gvcsunspin:1527220557890850846>",
        description:
          "> <:arrowright:1534182706836144158> You are not authorized to issue citations.",
      });
      return interaction.editReply({ embeds: [embed] });
    }

    const target = interaction.options.getUser("user");
    const violation = interaction.options.getString("violation");
    const offense = interaction.options.getString("offense");
    const price = interaction.options.getInteger("price");
    const location = interaction.options.getString("location");

    // Load user record
    const userRecord = await getUserRecord(target.id);

    // Ensure records object exists
    if (!userRecord.records) {
      userRecord.records = { citations: [], warrants: [], blackpoints: 0 };
    }

    // Generate case number
    const caseNumber = `C-${Math.floor(Math.random() * 90000 + 10000)}`;

    // Build citation entry
    const citationEntry = {
      case: caseNumber,
      violation,
      offense,
      price,
      location,
      timestamp: Date.now(),
    };

    // Add citation
    userRecord.records.citations.push(citationEntry);

    // Save
    await updateUserRecord(userRecord);

    // Build embed for LEO confirmation
    const desc =
      `> <:arrowright:1534182706836144158> **Citation Issued To:** <@${target.id}>\n` +
      `> <:arrowright:1534182706836144158> **Case:** ${caseNumber}\n` +
      `> <:arrowright:1534182706836144158> **Violation:** ${violation}\n` +
      `> <:arrowright:1534182706836144158> **Offense:** ${offense}\n` +
      `> <:arrowright:1534182706836144158> **Price:** $${price}\n` +
      `> <:arrowright:1534182706836144158> **Location:** ${location}`;

    const { embed } = embedTemplate({
      title:
        "<a:gvcsunspin:1527220557890850846> Citation Added <a:gvcsunspin:1527220557890850846>",
      description: desc,
      noLogo: true,
    });

    embed.setThumbnail(target.displayAvatarURL({ dynamic: true }));

    await interaction.editReply({ embeds: [embed] });

    // DM the user
    try {
      const dmDesc =
        `> <:arrowright:1534182706836144158> **You have received a citation.**\n\n` +
        `> <:bulletpoint:1534184707900837961> **Case:** ${caseNumber}\n` +
        `> <:bulletpoint:1534184707900837961> **Violation:** ${violation}\n` +
        `> <:bulletpoint:1534184707900837961> **Offense:** ${offense}\n` +
        `> <:bulletpoint:1534184707900837961> **Price:** $${price}\n` +
        `> <:bulletpoint:1534184707900837961> **Location:** ${location}\n` +
        `> <:bulletpoint:1534184707900837961> **Issued By:** ${interaction.user.username}`;

      const { embed: dmEmbed } = embedTemplate({
        title:
          "<a:gvcsunspin:1527220557890850846> New Citation Issued <a:gvcsunspin:1527220557890850846>",
        description: dmDesc,
        noLogo: true,
      });

      dmEmbed.setThumbnail(target.displayAvatarURL({ dynamic: true }));

      await target.send({ embeds: [dmEmbed] });
    } catch {
      // User has DMs closed — silently ignore
    }
  },
};

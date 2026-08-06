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
    .setName("blackpoint")
    .setDescription("LEO: Add blackpoints to a user's record.")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user receiving blackpoints.")
        .setRequired(true),
    )
    .addIntegerOption((option) =>
      option
        .setName("amount")
        .setDescription("Number of blackpoints to add.")
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
          "> <:arrowright:1534182706836144158> You are not authorized to add blackpoints.",
      });
      return interaction.editReply({ embeds: [embed] });
    }

    const target = interaction.options.getUser("user");
    const amount = interaction.options.getInteger("amount");

    if (amount <= 0) {
      const { embed } = embedTemplate({
        title:
          "<a:gvcsunspin:1527220557890850846> Invalid Amount <a:gvcsunspin:1527220557890850846>",
        description:
          "> <:arrowright:1534182706836144158> Amount must be greater than 0.",
      });
      return interaction.editReply({ embeds: [embed] });
    }

    // Load user record
    const userRecord = await getUserRecord(target.id);

    // Ensure records object exists
    if (!userRecord.records) {
      userRecord.records = { citations: [], warrants: [], blackpoints: 0 };
    }

    // Add blackpoints
    userRecord.records.blackpoints += amount;

    await updateUserRecord(userRecord);

    const desc =
      `> <:arrowright:1534182706836144158> **Blackpoints Added To:** <@${target.id}>\n` +
      `> <:arrowright:1534182706836144158> **Amount:** ${amount}\n` +
      `> <:arrowright:1534182706836144158> **New Total:** ${userRecord.records.blackpoints}`;

    const { embed } = embedTemplate({
      title:
        "<a:gvcsunspin:1527220557890850846> Blackpoints Added <a:gvcsunspin:1527220557890850846>",
      description: desc,
      noLogo: true,
    });

    embed.setThumbnail(target.displayAvatarURL({ dynamic: true }));

    await interaction.editReply({ embeds: [embed] });

    // DM the user
    try {
      const dmDesc =
        `> <:arrowright:1534182706836144158> **Blackpoints have been added to your record.**\n\n` +
        `> <:bulletpoint:1534184707900837961> **Amount:** ${amount}\n` +
        `> <:bulletpoint:1534184707900837961> **New Total:** ${userRecord.records.blackpoints}\n` +
        `> <:bulletpoint:1534184707900837961> **Added By:** ${interaction.user.username}`;

      const { embed: dmEmbed } = embedTemplate({
        title:
          "<a:gvcsunspin:1527220557890850846> Blackpoint Notice <a:gvcsunspin:1527220557890850846>",
        description: dmDesc,
        noLogo: true,
      });

      dmEmbed.setThumbnail(target.displayAvatarURL({ dynamic: true }));

      await target.send({ embeds: [dmEmbed] });
    } catch {}
  },
};

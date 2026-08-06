const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const embedTemplate = require("../../utils/embedTemplate");
const {
  getUserRecord,
  updateUserRecord,
} = require("../../economy/economyutils");

const HR_ROLE_ID = "1350582607217430650"; // HR Staff role

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ecoadd")
    .setDescription("HR: Add money to a user's balance.")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user to give money to.")
        .setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName("amount")
        .setDescription("Amount of money to add.")
        .setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply();

    // HR role check
    if (!interaction.member.roles.cache.has(HR_ROLE_ID)) {
      const { embed } = embedTemplate({
        title:
          "<a:gvcsunspin:1527220557890850846> Access Denied <a:gvcsunspin:1527220557890850846>",
        description:
          "> <:arrowright:1534182706836144158> Only HR staff can use this command."
        // No color → uses DEFAULT_COLOR (0xFFAD65)
      });
      return interaction.editReply({ embeds: [embed] });
    }

    const hrMember = interaction.member;
    const receiver = interaction.options.getUser("user");
    const amount = interaction.options.getInteger("amount");

    if (amount <= 0) {
      const { embed } = embedTemplate({
        title:
          "<a:gvcsunspin:1527220557890850846> Invalid Amount <a:gvcsunspin:1527220557890850846>",
        description:
          "> <:arrowright:1534182706836144158> Amount must be greater than 0."
      });
      return interaction.editReply({ embeds: [embed] });
    }

    // Load user record from MongoDB
    const receiverRecord = await getUserRecord(receiver.id);

    receiverRecord.cash = receiverRecord.cash ?? 0;
    receiverRecord.cash += amount;

    await updateUserRecord(receiverRecord);

    const desc =
      `> <:bulletpoint:1534184707900837961> **Added to:** <@${receiver.id}>\n` +
      `> <:bulletpoint:1534184707900837961> **Amount:** $${amount}\n` +
      `> <:bulletpoint:1534184707900837961> **New Balance:** $${receiverRecord.cash}`;

    const { embed } = embedTemplate({
      title:
        "<a:gvcsunspin:1527220557890850846> Money Added <a:gvcsunspin:1527220557890850846>",
      description: desc
      // No color → uses DEFAULT_COLOR (0xFFAD65)
    });

    // Add thumbnail properly
    embed.setThumbnail(receiver.displayAvatarURL({ dynamic: true }));

    await interaction.editReply({ embeds: [embed] });

    // DM the receiver
    try {
      const { embed: dmEmbed } = embedTemplate({
        title:
          "<:shines:1524097104547680276> Money Received <:shines:1524097104547680276>",
        description:
          `> <:bulletpoint:1524621721318195230> **From:** ${hrMember.user.username} (HR)\n` +
          `> <:bulletpoint:1524621721318195230> **Amount:** $${amount}\n` +
          `> <:bulletpoint:1524621721318195230> **New Balance:** $${receiverRecord.cash}`
      });

      dmEmbed.setThumbnail(receiver.displayAvatarURL({ dynamic: true }));

      await receiver.send({ embeds: [dmEmbed] });
    } catch {
      // Ignore if DMs are closed
    }
  },
};

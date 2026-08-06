const { SlashCommandBuilder } = require("discord.js");
const embedTemplate = require("../../utils/embedTemplate");
const { getUserRecord, updateUserRecord } = require("../../economy/economyutils");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("withdraw")
    .setDescription("Withdraw money from your bank.")
    .addIntegerOption(option =>
      option
        .setName("amount")
        .setDescription("Amount to withdraw")
        .setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply();

    const amount = interaction.options.getInteger("amount");
    const user = await getUserRecord(interaction.user.id);

    if (amount <= 0)
      return interaction.editReply("❌ Amount must be greater than zero.");

    if (user.bank < amount)
      return interaction.editReply("❌ You don't have enough money in your bank.");

    user.bank -= amount;
    user.cash += amount;

    await updateUserRecord(user);

    const desc =
      `> <:arrowright:1534182706836144158> Withdrew **$${amount.toLocaleString()}** from your bank.\n\n` +
      `• **New Cash:** $${user.cash.toLocaleString()}\n` +
      `• **New Bank:** $${user.bank.toLocaleString()}`;

    const { embed } = embedTemplate({
      title:
        "<a:gvcsunspin:1527220557890850846> Withdrawal Successful <a:gvcsunspin:1527220557890850846>",
      description: desc,
      noLogo: true,
    });

    await interaction.editReply({ embeds: [embed] });
  },
};

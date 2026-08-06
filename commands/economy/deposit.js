const { SlashCommandBuilder } = require("discord.js");
const embedTemplate = require("../../utils/embedTemplate");
const { getUserRecord, updateUserRecord } = require("../../economy/economyutils");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("deposit")
    .setDescription("Deposit cash into your bank.")
    .addIntegerOption(option =>
      option
        .setName("amount")
        .setDescription("Amount to deposit")
        .setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply();

    const amount = interaction.options.getInteger("amount");
    const user = await getUserRecord(interaction.user.id);

    if (amount <= 0)
      return interaction.editReply("❌ Amount must be greater than zero.");

    if (user.cash < amount)
      return interaction.editReply("❌ You don't have enough cash to deposit.");

    user.cash -= amount;
    user.bank = (user.bank ?? 0) + amount;

    await updateUserRecord(user);

    const desc =
      `> <:arrowright:1534182706836144158> Deposited **$${amount.toLocaleString()}** into your bank.\n\n` +
      `• **New Cash:** $${user.cash.toLocaleString()}\n` +
      `• **New Bank:** $${user.bank.toLocaleString()}`;

    const { embed } = embedTemplate({
      title:
        "<a:gvcsunspin:1527220557890850846> Deposit Successful <a:gvcsunspin:1527220557890850846>",
      description: desc,
      noLogo: true,
    });

    await interaction.editReply({ embeds: [embed] });
  },
};

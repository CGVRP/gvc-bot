const { SlashCommandBuilder } = require("discord.js");
const embedTemplate = require("../../utils/embedTemplate");
const {
  getUserRecord,
  updateUserRecord,
} = require("../../economy/economyutils");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("deposit")
    .setDescription("Deposit cash into your bank.")
    .addStringOption((option) =>
      option
        .setName("amount")
        .setDescription("Amount to deposit or 'all'")
        .setRequired(true),
    ),

  async execute(interaction) {
    await interaction.deferReply();

    const input = interaction.options.getString("amount").trim().toLowerCase();
    const user = await getUserRecord(interaction.user.id);

    let amount = 0;

    if (input === "all") {
      amount = user.cash ?? 0;
    } else {
      amount = parseInt(input, 10);
    }

    if (isNaN(amount) || amount <= 0) {
      return interaction.editReply(
        "❌ Please provide a valid positive number or type `'all'`.",
      );
    }

    if ((user.cash ?? 0) < amount) {
      return interaction.editReply("❌ You don't have enough cash to deposit.");
    }

    user.cash = (user.cash ?? 0) - amount;
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

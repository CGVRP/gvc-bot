const { SlashCommandBuilder } = require("discord.js");
const embedTemplate = require("../../utils/embedTemplate");
const {
  getUserRecord,
  updateUserRecord,
} = require("../../economy/economyutils");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("pay")
    .setDescription("Pay another user money.")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user you want to pay.")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("amount")
        .setDescription("Amount to pay (number or 'all').")
        .setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply();

    const senderId = interaction.user.id;
    const receiver = interaction.options.getUser("user");
    const amountInput = interaction.options.getString("amount");

    if (receiver.id === senderId) {
      const { embed } = embedTemplate({
        title:
          "<a:gvcsunspin:1527220557890850846> Payment Error <a:gvcsunspin:1527220557890850846>",
        description:
          "> <:bulletpoint:1534184707900837961> You cannot pay yourself."
      });
      return interaction.editReply({ embeds: [embed] });
    }

    const sender = await getUserRecord(senderId);
    const receiverRecord = await getUserRecord(receiver.id);

    sender.cash = sender.cash ?? 0;
    receiverRecord.cash = receiverRecord.cash ?? 0;

    let amount;

    if (amountInput.toLowerCase() === "all") {
      amount = sender.cash;
    } else {
      amount = parseInt(amountInput);
      if (isNaN(amount)) {
        const { embed } = embedTemplate({
          title:
            "<a:gvcsunspin:1527220557890850846> Payment Error <a:gvcsunspin:1527220557890850846>",
          description:
            "> <:bulletpoint:1534184707900837961> Amount must be a number or 'all'."
        });
        return interaction.editReply({ embeds: [embed] });
      }
    }

    if (amount <= 0) {
      const { embed } = embedTemplate({
        title:
          "<a:gvcsunspin:1527220557890850846> Payment Error <a:gvcsunspin:1527220557890850846>",
        description:
          "> <:bulletpoint:1534184707900837961> Amount must be greater than 0."
      });
      return interaction.editReply({ embeds: [embed] });
    }

    if (sender.cash < amount) {
      const { embed } = embedTemplate({
        title:
          "<a:gvcsunspin:1527220557890850846> Payment Error <a:gvcsunspin:1527220557890850846>",
        description:
          "> <:bulletpoint:1534184707900837961> You do not have enough money to make this payment."
      });
      return interaction.editReply({ embeds: [embed] });
    }

    // Process payment
    sender.cash -= amount;
    receiverRecord.cash += amount;

    await updateUserRecord(sender);
    await updateUserRecord(receiverRecord);

    // Sender embed
    const desc =
      `> <:bulletpoint:1534184707900837961> **You paid:** <@${receiver.id}> $${amount}\n` +
      `> <:bulletpoint:1534184707900837961> **Your new balance:** $${sender.cash}`;

    const { embed } = embedTemplate({
      title:
        "<a:gvcsunspin:1527220557890850846> Payment Sent <a:gvcsunspin:1527220557890850846>",
      description: desc
    });

    embed.setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }));

    await interaction.editReply({ embeds: [embed] });

    // DM the receiver
    try {
      const { embed: dmEmbed } = embedTemplate({
        title:
          "<a:gvcsunspin:1527220557890850846> Payment Received <a:gvcsunspin:1527220557890850846>",
        description:
          `> <:bulletpoint:1534184707900837961> **From:** ${interaction.user.username}\n` +
          `> <:bulletpoint:1534184707900837961> **Amount:** $${amount}\n` +
          `> <:bulletpoint:1534184707900837961> **New Balance:** $${receiverRecord.cash}`
      });

      dmEmbed.setThumbnail(receiver.displayAvatarURL({ dynamic: true }));

      await receiver.send({ embeds: [dmEmbed] });
    } catch {
      // Ignore if DMs are closed
    }
  }
};

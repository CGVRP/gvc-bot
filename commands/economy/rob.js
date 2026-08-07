const { SlashCommandBuilder } = require("discord.js");
const embedTemplate = require("../../utils/embedTemplate");
const {
  getUserRecord,
  updateUserRecord,
} = require("../../economy/economyutils");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("rob")
    .setDescription("Attempt to rob cash from another user.")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The target user to rob.")
        .setRequired(true),
    ),

  async execute(interaction) {
    const target = interaction.options.getUser("user");
    const robber = interaction.user;
    const member = interaction.member;

    const robberRecord = await getUserRecord(robber.id);

    const now = Date.now();
    const cooldownMs = 24 * 60 * 60 * 1000; // 24 hours

    // Bypass cooldown using ROLE
    const bypassRole = "1368142895181205636";
    const isBypass = member.roles.cache.has(bypassRole);

    // COOLDOWN → EPHEMERAL
    if (
      !isBypass &&
      robberRecord.lastRob &&
      now - robberRecord.lastRob < cooldownMs
    ) {
      const remaining = cooldownMs - (now - robberRecord.lastRob);

      await interaction.deferReply({ ephemeral: true });

      const { embed } = embedTemplate({
        title: "⏳ Cooldown Active",
        description: `You need to rest before attempting another robbery!\nTry again <t:${Math.floor((now + remaining) / 1000)}:R>.`,
        noLogo: true,
      });

      return interaction.editReply({ embeds: [embed] });
    }

    // Self-rob check
    if (target.id === robber.id) {
      await interaction.deferReply({ ephemeral: true });
      const { embed } = embedTemplate({
        title:
          "<a:gvcsunspin:1527220557890850846> Invalid Target <a:gvcsunspin:1527220557890850846>",
        description:
          "> <:arrowright:1534182706836144158> You cannot rob yourself!",
      });
      return interaction.editReply({ embeds: [embed] });
    }

    // Bot check
    if (target.bot) {
      await interaction.deferReply({ ephemeral: true });
      const { embed } = embedTemplate({
        title:
          "<a:gvcsunspin:1527220557890850846> Invalid Target <a:gvcsunspin:1527220557890850846>",
        description: "> <:arrowright:1534182706836144158> You cannot rob bots!",
      });
      return interaction.editReply({ embeds: [embed] });
    }

    const targetRecord = await getUserRecord(target.id);
    const targetCash = targetRecord.cash ?? 0;

    // Target cash check
    if (targetCash <= 0) {
      await interaction.deferReply({ ephemeral: true });
      const { embed } = embedTemplate({
        title:
          "<a:gvcsunspin:1527220557890850846> Robbery Failed <a:gvcsunspin:1527220557890850846>",
        description: `> <:arrowright:1534182706836144158> <@${target.id}> has no cash on them to rob!`,
      });
      return interaction.editReply({ embeds: [embed] });
    }

    // Standard execution → Public defer
    await interaction.deferReply();

    // Set cooldown timestamp on DB record
    robberRecord.lastRob = now;

    // 5% Chance of getting caught
    const isCaught = Math.random() < 0.05;

    if (isCaught) {
      const robberCash = robberRecord.cash ?? 0;
      const robberBank = robberRecord.bank ?? 0;
      const totalWealth = robberCash + robberBank;

      // 20% fine based on total wealth
      const fine = Math.floor(totalWealth * 0.2);

      let cashDeducted = 0;
      let bankDeducted = 0;

      // Deduct fine: Cash first, remaining from Bank
      if (robberCash >= fine) {
        robberRecord.cash = robberCash - fine;
        cashDeducted = fine;
      } else {
        cashDeducted = robberCash;
        const remainingFine = fine - cashDeducted;

        robberRecord.cash = 0;
        robberRecord.bank = Math.max(0, robberBank - remainingFine);
        bankDeducted = Math.min(robberBank, remainingFine);
      }

      await updateUserRecord(robberRecord);

      const desc =
        `> <:arrowright:1534182706836144158> **You got caught by the police while attempting to rob <@${target.id}>!**\n\n` +
        `• **Penalty Fine (20%):** $${fine.toLocaleString()}\n` +
        `• **Cash Deducted:** $${cashDeducted.toLocaleString()}\n` +
        `• **Bank Deducted:** $${bankDeducted.toLocaleString()}`;

      const { embed } = embedTemplate({
        title:
          "<a:gvcsunspin:1527220557890850846> BUSTED! <a:gvcsunspin:1527220557890850846>",
        description: desc,
        noLogo: true,
      });

      return interaction.editReply({ embeds: [embed] });
    }

    // Weighted random percentage between 1% and 40%
    const percentage = Math.floor(1 + Math.pow(Math.random(), 2) * 39);
    const stolenAmount = Math.max(
      1,
      Math.floor(targetCash * (percentage / 100)),
    );

    // Update balances
    targetRecord.cash = targetCash - stolenAmount;
    robberRecord.cash = (robberRecord.cash ?? 0) + stolenAmount;

    await updateUserRecord(targetRecord);
    await updateUserRecord(robberRecord);

    const desc =
      `> <:arrowright:1534182706836144158> Successfully robbed **<@${target.id}>**!\n\n` +
      `• **Stolen Amount:** $${stolenAmount.toLocaleString()} (${percentage}% of their cash)\n` +
      `• **Your New Cash:** $${robberRecord.cash.toLocaleString()}`;

    const { embed } = embedTemplate({
      title:
        "<a:gvcsunspin:1527220557890850846> Robbery Successful <a:gvcsunspin:1527220557890850846>",
      description: desc,
      noLogo: true,
    });

    embed.setThumbnail(target.displayAvatarURL({ dynamic: true }));

    await interaction.editReply({ embeds: [embed] });

    // DM notification to target
    try {
      const dmDesc =
        `> <:arrowright:1534182706836144158> **You were robbed!**\n\n` +
        `> <:bulletpoint:1534184707900837961> **Robbed By:** ${robber.username} (<@${robber.id}>)\n` +
        `> <:bulletpoint:1534184707900837961> **Amount Stolen:** $${stolenAmount.toLocaleString()}\n` +
        `> <:bulletpoint:1534184707900837961> **Remaining Cash:** $${targetRecord.cash.toLocaleString()}`;

      const { embed: dmEmbed } = embedTemplate({
        title:
          "<a:gvcsunspin:1527220557890850846> Robbery Notice <a:gvcsunspin:1527220557890850846>",
        description: dmDesc,
        noLogo: true,
      });

      dmEmbed.setThumbnail(robber.displayAvatarURL({ dynamic: true }));

      await target.send({ embeds: [dmEmbed] });
    } catch {}
  },
};

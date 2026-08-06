const { SlashCommandBuilder } = require("discord.js");
const {
  getUserRecord,
  updateUserRecord,
  loadWorkMessages,
} = require("../../economy/economyutils");
const embedTemplate = require("../../utils/embedTemplate");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("work")
    .setDescription("Work a job and earn money (1 hour cooldown)"),

  async execute(interaction) {
    const userId = interaction.user.id;
    const user = await getUserRecord(userId);

    // Bypass cooldown using ROLE
    const bypassRole = "1368142895181205636";
    const isBypass = interaction.member.roles.cache.has(bypassRole);

    const cooldown = 60 * 60 * 1000; // 1 hour
    const now = Date.now();

    if (!isBypass && user.lastWork && now - user.lastWork < cooldown) {
      const remaining = cooldown - (now - user.lastWork);
      const minutes = Math.ceil(remaining / 60000);

      const { embed } = embedTemplate({
        title: "⏳ Cooldown Active",
        description: `You must wait **${minutes} minutes** before working again.`,
        noLogo: true,
      });

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Load messages from MongoDB
    const workMessages = await loadWorkMessages();
    const message =
      workMessages[Math.floor(Math.random() * workMessages.length)];

    // Extract pay from message
    const payMatch = message.match(/\$(\d+)/);
    const pay = payMatch ? parseInt(payMatch[1]) : 0;

    user.cash += pay;
    user.lastWork = now;

    await updateUserRecord(user);

    const { embed } = embedTemplate({
      title: "💼 Work Complete",
      description: `${message}\n\n**New Balance:** $${user.cash}`,
      noLogo: true,
    });

    embed.setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }));

    return interaction.reply({ embeds: [embed] });
  },
};

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

    const cooldown = 60 * 60 * 1000; // 1 hour
    const now = Date.now();

    if (user.lastWork && now - user.lastWork < cooldown) {
      const remaining = cooldown - (now - user.lastWork);
      const minutes = Math.ceil(remaining / 60000);

      const { embed, files } = embedTemplate({
        title: "⏳ Cooldown Active",
        description: `You must wait **${minutes} minutes** before working again.`
      });

      return interaction.reply({ embeds: [embed], files, ephemeral: true });
    }

    // Load messages from MongoDB
    const workMessages = await loadWorkMessages();
    const message = workMessages[Math.floor(Math.random() * workMessages.length)];

    // Extract pay from message
    const payMatch = message.match(/\$(\d+)/);
    const pay = payMatch ? parseInt(payMatch[1]) : 0;

    user.cash += pay;
    user.lastWork = now;

    await updateUserRecord(user);

    const { embed, files } = embedTemplate({
      title: "💼 Work Complete",
      description: `${message}\n\n**New Balance:** $${user.cash}`
    });

    // Optional: add thumbnail
    embed.setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }));

    return interaction.reply({ embeds: [embed], files });
  },
};

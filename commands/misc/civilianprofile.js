const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const embedTemplate = require("../../utils/embedTemplate");
const {
  getUserRecord,
  loadRoleIncome,
  loadWorkMessages,
} = require("../../economy/economyutils");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("civilianprofile")
    .setDescription("View a civilian's economy profile.")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user to view (optional)")
        .setRequired(false),
    ),

  async execute(interaction) {
    await interaction.deferReply();

    // If user option is provided → use that
    const targetUser = interaction.options.getUser("user") || interaction.user;
    const targetMember = interaction.guild.members.cache.get(targetUser.id);

    const userRecord = await getUserRecord(targetUser.id);
    const roleIncome = await loadRoleIncome();
    const workMessages = await loadWorkMessages();

    const cash = userRecord.cash ?? 0;
    const bank = userRecord.bank ?? 0;
    const lastCollect = userRecord.lastCollect ?? 0;
    const lastWork = userRecord.lastWork ?? 0;
    const vehicles = userRecord.vehicles ?? [];

    // ROLE INCOME BREAKDOWN
    let incomeBreakdown = "";
    let totalRoleIncome = 0;

    for (const [roleId, amount] of Object.entries(roleIncome)) {
      if (targetMember.roles.cache.has(roleId)) {
        const role = interaction.guild.roles.cache.get(roleId);
        const roleName = role ? role.name : `Unknown (${roleId})`;
        incomeBreakdown += `> • ${roleName}: $${amount}\n`;
        totalRoleIncome += amount;
      }
    }

    if (!incomeBreakdown) {
      incomeBreakdown = "> <:arrowright:1534182706836144158> No income roles.";
    }

    // BADGES
    const badges = [];
    if (cash >= 100000) badges.push("💰 High Roller");
    if (vehicles.length >= 5) badges.push("🚗 Collector");
    if (totalRoleIncome >= 1000) badges.push("🏅 Top Earner");

    const badgeDisplay =
      badges.length > 0
        ? badges.map((b) => `> • ${b}`).join("\n")
        : "> <:arrowright:1534182706836144158> No badges earned.";

    // DESCRIPTION
    let desc = "";

    desc += `> <:arrowright:1534182706836144158> **Cash:** $${cash}\n`;
    desc += `> <:arrowright:1534182706836144158> **Bank:** $${bank}\n`;
    desc += `> <:arrowright:1534182706836144158> **Last Collected:** ${
      lastCollect ? `<t:${Math.floor(lastCollect / 1000)}:R>` : "Never"
    }\n`;
    desc += `> <:arrowright:153418270683614415158> **Last Work:** ${
      lastWork ? `<t:${Math.floor(lastWork / 1000)}:R>` : "Never"
    }\n\n`;

    desc += `> <:arrowright:1534182706836144158> **Account Created:** <t:${Math.floor(
      targetUser.createdTimestamp / 1000,
    )}:D>\n`;
    desc += `> <:arrowright:1534182706836144158> **Joined Server:** <t:${Math.floor(
      targetMember.joinedTimestamp / 1000,
    )}:D>\n\n`;

    desc += `> <:arrowright:1534182706836144158> **Role Income:**\n${incomeBreakdown}\n`;
    desc += `> <:arrowright:1534182706836144158> **Total Role Income:** $${totalRoleIncome}\n\n`;

    desc += `> <:arrowright:1534182706836144158> **Badges:**\n${badgeDisplay}\n\n`;

    desc += `> <:arrowright:1534182706836144158> **Work Messages Loaded:** ${workMessages.length}`;

    const { embed } = embedTemplate({
      title: `<a:gvcsunspin:1527220557890850846> ${targetUser.username}'s Civilian Profile <a:gvcsunspin:1527220557890850846>`,
      description: desc,
    });

    embed.setThumbnail(targetUser.displayAvatarURL({ dynamic: true }));

    // Buttons include both viewer and target IDs
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`viewVehicles_${interaction.user.id}_${targetUser.id}`)
        .setLabel("View All Vehicles")
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId(`viewBalance_${interaction.user.id}_${targetUser.id}`)
        .setLabel("View Balance")
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId(`viewRecords_${interaction.user.id}_${targetUser.id}`)
        .setLabel("Records")
        .setStyle(ButtonStyle.Danger),
    );

    return interaction.editReply({ embeds: [embed], components: [row] });
  },
};

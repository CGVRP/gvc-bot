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
    .setDescription("View your complete civilian economy profile."),

  async execute(interaction) {
    await interaction.deferReply();

    const userId = interaction.user.id;
    const member = interaction.member;

    const user = await getUserRecord(userId);
    const roleIncome = await loadRoleIncome();
    const workMessages = await loadWorkMessages();

    const cash = user.cash ?? 0;
    const bank = user.bank ?? 0;
    const lastCollect = user.lastCollect ?? 0;
    const lastWork = user.lastWork ?? 0;
    const vehicles = user.vehicles ?? [];

    // ROLE INCOME BREAKDOWN
    let incomeBreakdown = "";
    let totalRoleIncome = 0;

    for (const [roleId, amount] of Object.entries(roleIncome)) {
      if (member.roles.cache.has(roleId)) {
        const role = interaction.guild.roles.cache.get(roleId);
        const roleName = role ? role.name : `Unknown (${roleId})`;
        incomeBreakdown += `> • ${roleName}: $${amount}\n`;
        totalRoleIncome += amount;
      }
    }

    if (!incomeBreakdown) {
      incomeBreakdown = "> <:arrowright:1534182706836144158> No income roles.";
    }

    // VEHICLE PREVIEW (first 3)
    let vehiclePreview = "";

    if (vehicles.length === 0) {
      vehiclePreview =
        "> <:arrowright:1534182706836144158> No registered vehicles.";
    } else {
      vehicles.slice(0, 3).forEach((v) => {
        vehiclePreview += `> • **${v.year} ${v.make} ${v.model}** (${v.color}) — Plate: ${v.plate}\n`;
      });

      if (vehicles.length > 3) {
        vehiclePreview += `> …and **${vehicles.length - 3} more**`;
      }
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
    desc += `> <:arrowright:1534182706836144158> **Last Work:** ${
      lastWork ? `<t:${Math.floor(lastWork / 1000)}:R>` : "Never"
    }\n\n`;

    desc += `> <:arrowright:1534182706836144158> **Account Created:** <t:${Math.floor(
      interaction.user.createdTimestamp / 1000,
    )}:D>\n`;
    desc += `> <:arrowright:1534182706836144158> **Joined Server:** <t:${Math.floor(
      member.joinedTimestamp / 1000,
    )}:D>\n\n`;

    desc += `> <:arrowright:1534182706836144158> **Role Income:**\n${incomeBreakdown}\n`;
    desc += `> <:arrowright:1534182706836144158> **Total Role Income:** $${totalRoleIncome}\n\n`;

    desc += `> <:arrowright:1534182706836144158> **Registered Vehicles:** ${vehicles.length}\n${vehiclePreview}\n\n`;

    desc += `> <:arrowright:1534182706836144158> **Badges:**\n${badgeDisplay}\n\n`;

    desc += `> <:arrowright:1534182706836144158> **Work Messages Loaded:** ${workMessages.length}`;

    const { embed } = embedTemplate({
      title: `<a:gvcsunspin:1527220557890850846> ${interaction.user.username}'s Civilian Profile <a:gvcsunspin:1527220557890850846>`,
      description: desc,
    });

    embed.setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }));

    // BUTTONS: View All Vehicles + View Balance
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`viewVehicles_${userId}`)
        .setLabel("View All Vehicles")
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId(`viewBalance_${userId}`)
        .setLabel("View Balance")
        .setStyle(ButtonStyle.Secondary),
    );

    return interaction.editReply({ embeds: [embed], components: [row] });
  },
};

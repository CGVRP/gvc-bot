const { SlashCommandBuilder } = require("discord.js");
const embedTemplate = require("../../utils/embedTemplate");
const { getUserRecord, updateUserRecord } = require("../../economy/economyutils");

const PREMIUM_ROLE = "1445765392168517745"; // Premium vehicle slot role

module.exports = {
  data: new SlashCommandBuilder()
    .setName("registervehicle")
    .setDescription("Register a vehicle to your profile.")
    .addIntegerOption(option =>
      option.setName("year").setDescription("Vehicle year").setRequired(true)
    )
    .addStringOption(option =>
      option.setName("make").setDescription("Vehicle make").setRequired(true)
    )
    .addStringOption(option =>
      option.setName("model").setDescription("Vehicle model").setRequired(true)
    )
    .addStringOption(option =>
      option.setName("color").setDescription("Vehicle color").setRequired(true)
    )
    .addStringOption(option =>
      option.setName("plate").setDescription("License plate").setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply();

    const userId = interaction.user.id;
    const member = interaction.member;

    const year = interaction.options.getInteger("year");
    const make = interaction.options.getString("make");
    const model = interaction.options.getString("model");
    const color = interaction.options.getString("color");
    const plate = interaction.options.getString("plate");

    const user = await getUserRecord(userId);
    user.vehicles = user.vehicles ?? [];

    // VEHICLE LIMIT CHECK
    const hasPremium = member.roles.cache.has(PREMIUM_ROLE);
    const limit = hasPremium ? 15 : 10;

    if (user.vehicles.length >= limit) {
      const { embed } = embedTemplate({
        title: "🚫 Vehicle Limit Reached",
        description:
          `> <:arrowright:1534182706836144158> You can only register **${limit} vehicles**.\n` +
          (hasPremium
            ? "> <:arrowright:1534182706836144158> You already have the premium role."
            : "> <:arrowright:1534182706836144158> Unlock **15 slots** with the premium role.")
      });

      embed.setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }));
      return interaction.editReply({ embeds: [embed] });
    }

    // Duplicate plate check
    const duplicate = user.vehicles.find(
      v => v.plate.toLowerCase() === plate.toLowerCase()
    );

    if (duplicate) {
      const { embed } = embedTemplate({
        title: "❌ Duplicate Vehicle",
        description:
          `> <:arrowright:1534182706836144158> You already registered a vehicle with plate **${plate}**.`
      });

      embed.setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }));
      return interaction.editReply({ embeds: [embed] });
    }

    // Create vehicle object
    const vehicle = { year, make, model, color, plate };

    user.vehicles.push(vehicle);
    await updateUserRecord(user);

    const desc =
      `> <:bulletpoint:1534184707900837961> **Year:** ${year}\n` +
      `> <:bulletpoint:1534184707900837961> **Make:** ${make}\n` +
      `> <:bulletpoint:1534184707900837961> **Model:** ${model}\n` +
      `> <:bulletpoint:1534184707900837961> **Color:** ${color}\n` +
      `> <:bulletpoint:1534184707900837961> **Plate:** ${plate}`;

    const { embed } = embedTemplate({
      title:
        "<a:gvcsunspin:1527220557890850846> Vehicle Registered <a:gvcsunspin:1527220557890850846>",
      description: desc
    });

    embed.setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }));

    return interaction.editReply({ embeds: [embed] });
  }
};

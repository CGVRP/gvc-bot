const { SlashCommandBuilder } = require("discord.js");
const embedTemplate = require("../../utils/embedTemplate");
const { getUserRecord, updateUserRecord } = require("../../economy/economyutils");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("unregistervehicle")
    .setDescription("Remove a registered vehicle from your profile.")
    .addStringOption(option =>
      option
        .setName("plate")
        .setDescription("The license plate of the vehicle to remove.")
        .setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply();

    const userId = interaction.user.id;
    const plate = interaction.options.getString("plate");

    // Load user record
    const user = await getUserRecord(userId);

    // Ensure vehicles array exists
    user.vehicles = user.vehicles ?? [];

    // Find vehicle by plate
    const vehicleIndex = user.vehicles.findIndex(
      v => v.plate.toLowerCase() === plate.toLowerCase()
    );

    if (vehicleIndex === -1) {
      const { embed } = embedTemplate({
        title: "❌ Vehicle Not Found",
        description: `> <:arrowright:1534182706836144158> No vehicle with plate **${plate}** is registered to your profile.`
      });

      embed.setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }));
      return interaction.editReply({ embeds: [embed] });
    }

    // Remove vehicle
    const removedVehicle = user.vehicles.splice(vehicleIndex, 1)[0];
    await updateUserRecord(user);

    // Build success embed
    const desc =
      `> <:bulletpoint:1534184707900837961> **Year:** ${removedVehicle.year}\n` +
      `> <:bulletpoint:1534184707900837961> **Make:** ${removedVehicle.make}\n` +
      `> <:bulletpoint:1534184707900837961> **Model:** ${removedVehicle.model}\n` +
      `> <:bulletpoint:1534184707900837961> **Color:** ${removedVehicle.color}\n` +
      `> <:bulletpoint:1534184707900837961> **Plate:** ${removedVehicle.plate}`;

    const { embed } = embedTemplate({
      title:
        "<a:gvcsunspin:1527220557890850846> Vehicle Unregistered <a:gvcsunspin:1527220557890850846>",
      description: desc
    });

    embed.setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }));

    return interaction.editReply({ embeds: [embed] });
  }
};

const { SlashCommandBuilder } = require("discord.js");
const embedTemplate = require("../../utils/embedTemplate");
const { getUserRecord, updateUserRecord } = require("../../economy/economyutils");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("editvehicle")
    .setDescription("Edit one of your registered vehicles.")
    .addStringOption(option =>
      option
        .setName("plate")
        .setDescription("The license plate of the vehicle you want to edit.")
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName("field")
        .setDescription("What do you want to edit?")
        .addChoices(
          { name: "Year", value: "year" },
          { name: "Make", value: "make" },
          { name: "Model", value: "model" },
          { name: "Color", value: "color" },
          { name: "Plate", value: "plate" }
        )
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName("value")
        .setDescription("The new value for the selected field.")
        .setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply();

    const userId = interaction.user.id;
    const plate = interaction.options.getString("plate");
    const field = interaction.options.getString("field");
    const value = interaction.options.getString("value");

    const user = await getUserRecord(userId);
    user.vehicles = user.vehicles ?? [];

    // Find vehicle
    const vehicle = user.vehicles.find(
      v => v.plate.toLowerCase() === plate.toLowerCase()
    );

    if (!vehicle) {
      const { embed } = embedTemplate({
        title: "❌ Vehicle Not Found",
        description: `> <:arrowright:1534182706836144158> No vehicle with plate **${plate}** found.`
      });
      embed.setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }));
      return interaction.editReply({ embeds: [embed] });
    }

    // Prevent duplicate plates when editing plate
    if (field === "plate") {
      const duplicate = user.vehicles.find(
        v => v.plate.toLowerCase() === value.toLowerCase()
      );
      if (duplicate) {
        const { embed } = embedTemplate({
          title: "❌ Duplicate Plate",
          description: `> <:arrowright:1534182706836144158> A vehicle with plate **${value}** already exists.`
        });
        embed.setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }));
        return interaction.editReply({ embeds: [embed] });
      }
    }

    // Apply edit
    vehicle[field] = field === "year" ? parseInt(value) : value;

    await updateUserRecord(user);

    const { embed } = embedTemplate({
      title:
        "<a:gvcsunspin:1527220557890850846> Vehicle Updated <a:gvcsunspin:1527220557890850846>",
      description:
        `> <:bulletpoint:1534184707900837961> **Updated Field:** ${field}\n` +
        `> <:bulletpoint:1534184707900837961> **New Value:** ${value}\n\n` +
        `> <:arrowright:1534182706836144158> **Vehicle:** ${vehicle.year} ${vehicle.make} ${vehicle.model} (${vehicle.color}) — Plate: ${vehicle.plate}`
    });

    embed.setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }));

    return interaction.editReply({ embeds: [embed] });
  }
};

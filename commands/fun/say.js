const { SlashCommandBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("say")
        .setDescription("Make the bot repeat what you say")
        .addStringOption(option =>
            option.setName("message")
                .setDescription("The message you want the bot to say")
                .setRequired(true)
        ),

    async execute(interaction) {
        const hrRoleId = "1350582607217430650"; // HR role ID

        // Permission check (same style as /purge)
        if (!interaction.member.roles.cache.has(hrRoleId)) {
            return interaction.reply({
                content: "You do not have permission to use this command.",
                flags: 64
            });
        }

        const message = interaction.options.getString("message");

        // Confirm privately
        await interaction.reply({
            content: "Message sent.",
            flags: 64
        });

        // Send the actual message
        await interaction.channel.send({
            content: message
        });
    }
};

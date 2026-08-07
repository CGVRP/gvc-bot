const embedTemplate = require("./embedTemplate");

const SUN = "<a:gvcsunspin:1527220557890850846>";
const ARROW = "<:arrowright:1534182706836144158>";

module.exports = async function handleInbox(message, client) {
  const INBOX_CHANNEL = "1535337995178082444";
  const LOG_CHANNEL = "1534886183040188547";

  if (message.author.bot) return;
  if (message.guild) return;

  const guild = client.guilds.cache.get("1058305800252182528");
  if (!guild) return;

  const inboxChannel = guild.channels.cache.get(INBOX_CHANNEL);
  const logChannel = guild.channels.cache.get(LOG_CHANNEL);
  if (!inboxChannel) return;

  const unix = Math.floor(Date.now() / 1000);
  const timestamp = `<t:${unix}:F>`;

  const description =
    `> ${ARROW} **From:** ${message.author.tag} (${message.author.id})\n` +
    `> ${ARROW} **Received At:** ${timestamp}\n\n` +
    `> ${ARROW} **Message:** ${message.content || "*No text content*"}`;

  const { embed } = embedTemplate({
    title: `${SUN} New Inbox Message ${SUN}`,
    description,
  });

  await inboxChannel.send({ embeds: [embed] });

  if (logChannel) {
    const { embed: logEmbed } = embedTemplate({
      title: `${SUN} Inbox Logged ${SUN}`,
      description,
    });
    await logChannel.send({ embeds: [logEmbed] });
  }
};

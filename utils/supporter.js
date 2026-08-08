const embedTemplate = require("./embedTemplate");

module.exports = ({ user, banner }) => {
  const { embed, files } = embedTemplate({
    title: "<a:gvcsunspin:1527220557890850846> GVC Supporter <a:gvcsunspin:1527220557890850846>",
    description:
      `> <:arrowright:1534182706836144158> ${user} is showing support for **Greenville Community!** They have been given the <@&1472134913397493813> as a reward. You can only obtain this role by having /gvc in your status.`,
    banner
  });

  embed.setThumbnail(user.displayAvatarURL({ dynamic: true }));
  return { embed, files };
};

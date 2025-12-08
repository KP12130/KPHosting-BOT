const config = require('../config');

module.exports = {
    name: 'guildMemberAdd',
    async execute(member, client) {
        updateMemberCount(member.guild);
    }
};

// Also listen for member remove
module.exports.onMemberRemove = {
    name: 'guildMemberRemove',
    async execute(member, client) {
        updateMemberCount(member.guild);
    }
};

async function updateMemberCount(guild) {
    const channel = guild.channels.cache.get(config.MEMBER_COUNT_CHANNEL);
    if (!channel) return;

    const memberCount = guild.memberCount;
    await channel.setName(`👥 Members: ${memberCount}`);
}

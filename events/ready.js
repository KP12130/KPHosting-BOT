module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {
        console.log(`✅ Bot online: ${client.user.tag}`);
        
        // Cache invites for invite logger
        const { cacheInvites } = require('./inviteLogger');
        await cacheInvites(client);
        console.log('📥 Invite cache initialized');
        
        // Update member count on startup
        client.guilds.cache.forEach(guild => {
            updateMemberCount(guild);
        });
        console.log('👥 Member count updated');
    }
};

async function updateMemberCount(guild) {
    const config = require('../config');
    const channel = guild.channels.cache.get(config.MEMBER_COUNT_CHANNEL);
    if (!channel) return;
    
    const memberCount = guild.memberCount;
    await channel.setName(`👥 Members: ${memberCount}`);
}

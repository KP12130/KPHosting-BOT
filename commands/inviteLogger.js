const { EmbedBuilder } = require('discord.js');
const config = require('../config');

const invites = new Map();

module.exports = {
    name: 'guildMemberAdd',
    async execute(member, client) {
        const guild = member.guild;
        
        // UPDATE MEMBER COUNT
        updateMemberCount(guild);
        
        // INVITE LOGGER
        const logChannel = guild.channels.cache.get(config.INVITE_LOG_CHANNEL);
        if (!logChannel) return;

        try {
            // Fetch current invites
            const newInvites = await guild.invites.fetch();
            const oldInvites = invites.get(guild.id);

            if (!oldInvites) {
                // Cache not initialized yet
                invites.set(guild.id, new Map(newInvites.map(inv => [inv.code, inv])));
                return;
            }

            // Find which invite was used
            const usedInvite = newInvites.find(inv => {
                const old = oldInvites.get(inv.code);
                return old && inv.uses > old.uses;
            });

            // Update invite cache
            invites.set(guild.id, new Map(newInvites.map(inv => [inv.code, inv])));

            const embed = new EmbedBuilder()
                .setTitle('📥 New Member Joined')
                .setColor('#00FF00')
                .setThumbnail(member.user.displayAvatarURL())
                .addFields(
                    { name: '👤 User', value: `${member.user.tag}`, inline: true },
                    { name: '🆔 User ID', value: member.user.id, inline: true },
                    { name: '📅 Account Created', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: false }
                )
                .setTimestamp();

            if (usedInvite) {
                embed.addFields(
                    { name: '🎫 Invited By', value: `${usedInvite.inviter.tag}`, inline: true },
                    { name: '📊 Invite Code', value: usedInvite.code, inline: true },
                    { name: '🔢 Total Uses', value: `${usedInvite.uses}`, inline: true }
                );
            } else {
                embed.addFields({ name: '🎫 Invited By', value: 'Unknown (Vanity URL or Widget)', inline: false });
            }

            logChannel.send({ embeds: [embed] });
        } catch (error) {
            console.error('Invite logger error:', error);
        }
    }
};

// Member remove event
module.exports.onMemberRemove = {
    name: 'guildMemberRemove',
    async execute(member, client) {
        updateMemberCount(member.guild);
    }
};

// Cache invites on ready
module.exports.cacheInvites = async (client) => {
    try {
        for (const guild of client.guilds.cache.values()) {
            const invs = await guild.invites.fetch();
            invites.set(guild.id, new Map(invs.map(inv => [inv.code, inv])));
        }
        console.log('✅ Invites cached for all guilds');
    } catch (error) {
        console.error('Error caching invites:', error);
    }
};

// Update member count helper
async function updateMemberCount(guild) {
    const channel = guild.channels.cache.get(config.MEMBER_COUNT_CHANNEL);
    if (!channel) return;
    
    try {
        const memberCount = guild.memberCount;
        await channel.setName(`👥 Members: ${memberCount}`);
        console.log(`👥 Updated member count: ${memberCount}`);
    } catch (error) {
        console.error('Member count update error:', error);
    }
}


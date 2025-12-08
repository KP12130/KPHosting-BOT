const { EmbedBuilder } = require('discord.js');
const config = require('../config');

const invites = new Map();

module.exports = {
    name: 'guildMemberAdd',
    async execute(member, client) {
        const guild = member.guild;
        
        // Get invite log channel
        const logChannel = guild.channels.cache.get(config.INVITE_LOG_CHANNEL);
        if (!logChannel) return;

        // Fetch current invites
        const newInvites = await guild.invites.fetch();
        const oldInvites = invites.get(guild.id);

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
    }
};

// Cache invites on ready
module.exports.cacheInvites = async (client) => {
    client.guilds.cache.forEach(async (guild) => {
        const invs = await guild.invites.fetch();
        invites.set(guild.id, new Map(invs.map(inv => [inv.code, inv])));
    });
};

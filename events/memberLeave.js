const config = require('../config');

module.exports = {
    name: 'guildMemberRemove',
    async execute(member, client) {
        const guild = member.guild;
        
        // Update member count when someone leaves
        const channel = guild.channels.cache.get(config.MEMBER_COUNT_CHANNEL);
        if (!channel) return;
        
        try {
            const memberCount = guild.memberCount;
            await channel.setName(`👥 Members: ${memberCount}`);
            console.log(`👥 Member left - Updated count: ${memberCount}`);
        } catch (error) {
            console.error('Member count update error:', error);
        }
        
        // Optional: Log member leave
        const logChannel = guild.channels.cache.get(config.INVITE_LOG_CHANNEL);
        if (logChannel) {
            const { EmbedBuilder } = require('discord.js');
            const embed = new EmbedBuilder()
                .setTitle('📤 Member Left')
                .setColor('#FF0000')
                .setThumbnail(member.user.displayAvatarURL())
                .addFields(
                    { name: '👤 User', value: `${member.user.tag}`, inline: true },
                    { name: '🆔 User ID', value: member.user.id, inline: true }
                )
                .setTimestamp();
            
            logChannel.send({ embeds: [embed] });
        }
    }
};

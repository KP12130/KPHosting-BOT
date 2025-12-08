const { SlashCommandBuilder } = require('discord.js');
const config = require('../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('member-update')
        .setDescription('Manually update member counter'),
    
    async execute(interaction) {
        const guild = interaction.guild;
        const channel = guild.channels.cache.get(config.MEMBER_COUNT_CHANNEL);
        
        if (!channel) {
            return interaction.reply({ 
                content: '❌ Member count channel not configured!',
                flags: 64
            });
        }
        
        const memberCount = guild.memberCount;
        await channel.setName(`👥 Members: ${memberCount}`);
        
        await interaction.reply({ 
            content: `✅ Member counter updated: **${memberCount}** members`,
            flags: 64
        });
    }
};

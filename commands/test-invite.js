const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('test-invite')
        .setDescription('Test invite logger setup'),
    
    async execute(interaction) {
        const guild = interaction.guild;
        
        try {
            const invites = await guild.invites.fetch();
            await interaction.reply({ 
                content: `✅ Invite logger working!\n📊 Found ${invites.size} active invites.`,
                flags: 64
            });
        } catch (error) {
            await interaction.reply({ 
                content: `❌ Error: ${error.message}\n\nMake sure bot has "Manage Server" permission!`,
                flags: 64
            });
        }
    }
};

const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup-ticket')
        .setDescription('Create ticket panel'),
    
    async execute(interaction) {
        await interaction.reply({ 
            content: '✅ Ticket panel created successfully!', 
            flags: 64 // ephemeral
        });

        const embed = new EmbedBuilder()
            .setTitle('🎫 KPHOSTING TICKET SYSTEM')
            .setDescription('✨ **KPHOSTING — Ticket Creation Guide** ✨\n\nTo keep our support system fast, organized, and easy for everyone, please follow the correct steps when creating a ticket.\n\n**Please create tickets only when truly needed** 💜\n\n**KPHOSTING**')
            .setColor('#5865F2')
            .setFooter({ text: 'KPHosting Support System' })
            .setTimestamp();

        const button = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('open_ticket_menu')
                    .setLabel('🎫 TICKET')
                    .setStyle(ButtonStyle.Primary)
            );

        await interaction.channel.send({ embeds: [embed], components: [button] });
    }
};

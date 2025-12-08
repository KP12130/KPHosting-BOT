const { 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    StringSelectMenuBuilder,
    ChannelType, 
    PermissionFlagsBits 
} = require('discord.js');
const config = require('../config');

let ticketCounter = 1;

module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
        // Open ticket menu button
        if (interaction.isButton() && interaction.customId === 'open_ticket_menu') {
            const selectMenu = new ActionRowBuilder()
                .addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId('ticket_category')
                        .setPlaceholder('Make a selection')
                        .addOptions([
                            {
                                label: 'Buy',
                                description: 'Purchase a Minecraft server',
                                value: 'buy',
                                emoji: '💰'
                            },
                            {
                                label: 'General Support',
                                description: 'Get general support',
                                value: 'support',
                                emoji: '🎯'
                            }
                        ])
                );

            return interaction.reply({ 
                content: '**Please select a ticket category:**',
                components: [selectMenu],
                flags: 64 // ephemeral
            });
        }

        // Create ticket from category selection
        if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_category') {
            const category = interaction.values[0];
            const guild = interaction.guild;
            const user = interaction.user;

            const existingTicket = guild.channels.cache.find(
                ch => ch.name.includes(`${category}-ticket`) && ch.topic === user.id
            );

            if (existingTicket) {
                return interaction.reply({ 
                    content: '❌ You already have an open ticket!',
                    flags: 64
                });
            }

            const ticketNumber = String(ticketCounter).padStart(4, '0');
            ticketCounter++;

            const ticketChannel = await guild.channels.create({
                name: `${category}-ticket#${ticketNumber}`,
                type: ChannelType.GuildText,
                parent: config.TICKET_CATEGORY_ID,
                topic: user.id,
                permissionOverwrites: [
                    {
                        id: guild.id,
                        deny: [PermissionFlagsBits.ViewChannel]
                    },
                    {
                        id: user.id,
                        allow: [
                            PermissionFlagsBits.ViewChannel,
                            PermissionFlagsBits.SendMessages,
                            PermissionFlagsBits.AttachFiles,
                            PermissionFlagsBits.EmbedLinks
                        ]
                    },
                    {
                        id: config.STAFF_ROLE_ID,
                        allow: [
                            PermissionFlagsBits.ViewChannel,
                            PermissionFlagsBits.SendMessages,
                            PermissionFlagsBits.ManageMessages
                        ]
                    }
                ]
            });

            const categoryNames = {
                buy: '💰 Buy',
                support: '🎯 General Support'
            };

            const ticketEmbed = new EmbedBuilder()
                .setTitle(categoryNames[category])
                .setDescription(`${user}, thank you for creating a ticket!\n\n**Category:** ${categoryNames[category]}\n\nOur team will assist you shortly. Please describe your issue or request in detail.`)
                .setColor('#00FF00')
                .setFooter({ text: 'KPHosting Support' })
                .setTimestamp();

            const actionButtons = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('close_ticket')
                        .setLabel('❌ Close Ticket')
                        .setStyle(ButtonStyle.Danger),
                    new ButtonBuilder()
                        .setCustomId('claim_ticket')
                        .setLabel('✅ Claim')
                        .setStyle(ButtonStyle.Success)
                );

            await ticketChannel.send({ 
                content: `${user} <@&${config.STAFF_ROLE_ID}>`,
                embeds: [ticketEmbed],
                components: [actionButtons]
            });

            return interaction.reply({ 
                content: `✅ Ticket created: ${ticketChannel}`,
                flags: 64
            });
        }

        // Claim ticket button
        if (interaction.isButton() && interaction.customId === 'claim_ticket') {
            return interaction.reply(`✅ ${interaction.user} claimed this ticket.`);
        }

        // Close ticket button
        if (interaction.isButton() && interaction.customId === 'close_ticket') {
            const confirmEmbed = new EmbedBuilder()
                .setTitle('🔒 Close Ticket')
                .setDescription('Are you sure you want to close this ticket?')
                .setColor('#FF0000');

            const confirmButtons = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('confirm_close')
                        .setLabel('✅ Yes, close it')
                        .setStyle(ButtonStyle.Danger),
                    new ButtonBuilder()
                        .setCustomId('cancel_close')
                        .setLabel('❌ Cancel')
                        .setStyle(ButtonStyle.Secondary)
                );

            return interaction.reply({ 
                embeds: [confirmEmbed],
                components: [confirmButtons],
                flags: 64
            });
        }

        // Confirm close
        if (interaction.isButton() && interaction.customId === 'confirm_close') {
            await interaction.channel.send('🔒 Closing ticket in 5 seconds...');
            setTimeout(() => interaction.channel.delete(), 5000);
        }

        // Cancel close
        if (interaction.isButton() && interaction.customId === 'cancel_close') {
            return interaction.update({ 
                content: '❌ Ticket closure cancelled.', 
                embeds: [],
                components: [] 
            });
        }

        // Handle slash commands
        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);
            if (!command) return;

            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(error);
                const reply = { 
                    content: 'There was an error executing this command!', 
                    flags: 64
                };
                
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp(reply);
                } else {
                    await interaction.reply(reply);
                }
            }
        }
    }
};

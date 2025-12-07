require('dotenv').config();
const { 
    Client, 
    GatewayIntentBits, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    StringSelectMenuBuilder,
    ChannelType, 
    PermissionFlagsBits,
    SlashCommandBuilder,
    REST,
    Routes
} = require('discord.js');
const express = require('express');

// Express HTTP szerver (UptimeRobot-hoz)
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('KPHosting Bot is running! ✅');
});

app.listen(PORT, () => {
    console.log(`🌐 HTTP server running on port ${PORT}`);
});

// Discord bot kód
const client = new Client({ 
    intents: [GatewayIntentBits.Guilds] 
});

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;
const TICKET_CATEGORY_ID = process.env.TICKET_CATEGORY_ID;
const STAFF_ROLE_ID = process.env.STAFF_ROLE_ID;

let ticketCounter = 1;

// Slash command registration
const commands = [
    new SlashCommandBuilder()
        .setName('setup-ticket')
        .setDescription('Create ticket panel')
].map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
    try {
        console.log('Registering slash commands...');
        await rest.put(
            Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
            { body: commands }
        );
        console.log('✅ Slash commands registered!');
    } catch (error) {
        console.error(error);
    }
})();

client.once('ready', () => {
    console.log(`✅ Bot online: ${client.user.tag}`);
});

// Setup command
client.on('interactionCreate', async interaction => {
    if (interaction.isChatInputCommand() && interaction.commandName === 'setup-ticket') {
        await interaction.reply({ 
            content: '✅ Ticket panel created successfully!', 
            ephemeral: true 
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
});

// Open ticket menu
client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;

    if (interaction.customId === 'open_ticket_menu') {
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

        await interaction.reply({ 
            content: '**Please select a ticket category:**',
            components: [selectMenu],
            ephemeral: true 
        });
    }
});

// Create ticket
client.on('interactionCreate', async interaction => {
    if (!interaction.isStringSelectMenu()) return;

    if (interaction.customId === 'ticket_category') {
        const category = interaction.values[0];
        const guild = interaction.guild;
        const user = interaction.user;

        const existingTicket = guild.channels.cache.find(
            ch => ch.name.includes(`${category}-ticket`) && ch.topic === user.id
        );

        if (existingTicket) {
            return interaction.reply({ 
                content: '❌ You already have an open ticket!',
                ephemeral: true 
            });
        }

        const ticketNumber = String(ticketCounter).padStart(4, '0');
        ticketCounter++;

        const ticketChannel = await guild.channels.create({
            name: `${category}-ticket#${ticketNumber}`,
            type: ChannelType.GuildText,
            parent: TICKET_CATEGORY_ID,
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
                    id: STAFF_ROLE_ID,
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
            content: `${user} <@&${STAFF_ROLE_ID}>`,
            embeds: [ticketEmbed],
            components: [actionButtons]
        });

        await interaction.reply({ 
            content: `✅ Ticket created: ${ticketChannel}`,
            ephemeral: true 
        });
    }
});

// Claim and Close buttons
client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;

    if (interaction.customId === 'claim_ticket') {
        await interaction.reply(`✅ ${interaction.user} claimed this ticket.`);
    }

    if (interaction.customId === 'close_ticket') {
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

        await interaction.reply({ 
            embeds: [confirmEmbed],
            components: [confirmButtons],
            ephemeral: true
        });
    }

    if (interaction.customId === 'confirm_close') {
        await interaction.channel.send('🔒 Closing ticket in 5 seconds...');
        setTimeout(() => interaction.channel.delete(), 5000);
    }

    if (interaction.customId === 'cancel_close') {
        await interaction.update({ 
            content: '❌ Ticket closure cancelled.', 
            embeds: [],
            components: [] 
        });
    }
});

client.login(TOKEN);

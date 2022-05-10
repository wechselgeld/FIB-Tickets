const {
	EmbedBuilder
} = require('@discordjs/builders');
const {
	ButtonStyle,
	ButtonBuilder,
	Formatters,
	WebhookClient,
	ButtonInteraction
} = require('discord.js');
const moment = require('moment');
const config = require('../config.json');
const models = require('../database/models');
const errors = require('../utility/errors');
const announcement = require('../utility/announcement');

module.exports = {
	data: {
		id: 'acceptTalk',
		builder: new ButtonBuilder()
			.setCustomId('acceptTalk')
			.setLabel('Gespräch annehmen')
			.setEmoji({
				id: '965951487924650024'
			})
			.setStyle(ButtonStyle.Success),
	},

	/**
     *
     * @param { ButtonInteraction } interaction
     */
	async execute(interaction) {
		if (!interaction.member.roles.cache.some(role => role.id === config.roles.ticketAccess)) {
			return interaction.reply({
				content: 'Diese Funktion ist ausschließlich unseren Recruitern zum einfachen verwalten der Tickets vorbehalten.',
				ephemeral: true
			});
		}

		// Search the ticket model
		const foundTicket = await models.tickets.findOne({
			where: {
				channelId: interaction.channel.id
			}
		});

		// If no entry was found or discordId is null, return
		if ((!foundTicket) || foundTicket.discordId === null) return errors.send(interaction, 'database', 'NO DATABASE ENTRY FOUND');

		if (interaction.channel.parentId === config.parents.acceptedTalkParentId) return errors.send(interaction, 'talk', 'TALK ALREADY ACCEPTED');

		const ticketOwner = await interaction.guild.members.fetch(foundTicket.discordId);

		ticketOwner.roles.set([config.roles.talkAccepted, config.roles.status]);

		const firstname = ticketOwner.nickname.split(' ')[0] || ticketOwner.user.username;

		const embedBuilder = new EmbedBuilder();

		embedBuilder
			.setColor(0x57F287)
			.setAuthor({
				name: 'Deiner Karriere beim FIB steht nichts mehr im Weg',
				iconURL: 'https://cdn.discordapp.com/emojis/968932942711783424.webp?size=96&quality=lossless'
			})
			.setDescription(`Hallo ${firstname},
            auch die letzte Etappe unseres Bewerbungsverfahrens konntest Du absolvieren und somit freuen wir uns Dir nun mitteilen zu können, dass wir Dich für den Dienst als Federal Agent geeignet halten.
            Du kannst nun an einer Grundeinweisung teilnehmen, welche Dir die grundlegenden Kenntnisse für den Dienst vermittelt. Einen passenden Termin dazu findest Du in dem ${Formatters.channelMention(config.channels.appointmentsChannelId)}-Kanal.
            
            Wir begrüßen Dich im Federal Investigation Bureau, Kollege.
            
            Mit freundlichen Grüßen
            Deine Recruiter des FIB`)
			.setFooter({ text: `Copyright © 2022 newa.media — Alle Rechte vorbehalten\nAngefordert von ${interaction.member.nickname}`, iconURL: interaction.user.displayAvatarURL({ extension: 'png', size: 64 }).toString() });

		interaction.channel.send({
			embeds: [embedBuilder]
		});

		interaction.channel.setParent(config.parents.acceptedTalkParentId, {
			reason: `${interaction.user.tag} has accepted this ticket/talk`,
			lockPermissions: false
		});

		announcement.send(ticketOwner, interaction.channel);

		interaction.reply({
			content: 'Ich habe das Gespräch angenommen. Deine Aktion wurde in den Logs vermerkt.',
			ephemeral: true
		});

		// The logging webhook
		embedBuilder
			.setColor(0x57F287)
			.setAuthor({
				name: 'Gespräch angenommen',
				iconURL: 'https://cdn.discordapp.com/emojis/968932942711783424.webp?size=96&quality=lossless'
			})
			.setDescription(`${interaction.user.toString()} hat <t:${moment().unix()}:R> das Gespräch mit ${Formatters.userMention(foundTicket.discordId)} angenommen.`)
			.setFields({
				name: 'Ticket-ID',
				value: `[${Formatters.inlineCode(foundTicket.ticketId)}](${interaction.channel.url})`,
				inline: true
			}, {
				name: 'Ray-ID',
				value: `${Formatters.inlineCode(moment().unix())}`,
				inline: true
			}, {
				name: 'User-ID',
				value: `[${Formatters.inlineCode(foundTicket.discordId)}](https://discordlookup.com/user/${foundTicket.discordId})`,
				inline: true
			});

		// Construct new WebhookClient and send the "created new ticket"-message
		new WebhookClient({
			url: config.webhooks.statusWebhookUrl
		}).send({
			avatarURL: interaction.user.avatarURL({
				dynamic: true
			}),
			username: `${interaction.user.tag} | nightmare API`,
			embeds: [embedBuilder]
		});
	},
};
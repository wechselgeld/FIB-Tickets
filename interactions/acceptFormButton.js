const {
	ButtonStyle,
	ButtonBuilder,
	Formatters,
	WebhookClient,
	ButtonInteraction,
	EmbedBuilder
} = require('discord.js');
const consola = require('consola');
const moment = require('moment');
const config = require('../config.json');
const models = require('../database/models');
const errors = require('../utility/errors');
const announcement = require('../utility/announcement');

module.exports = {
	data: {
		id: 'acceptForm',
		builder: new ButtonBuilder()
			.setCustomId('acceptForm')
			.setLabel('Eignungstest annehmen')
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
		if (!interaction.member.roles.cache.some(role => role.id === config.roles.botAccess)) {
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

		if (interaction.channel.parentId === config.parents.acceptedFormParentId) return errors.send(interaction, 'ticket', 'TICKET ALREADY ACCEPTED, PLEASE RE-OPEN THE RECRUITER PANEL AGAIN');

		const ticketOwner = await interaction.guild.members.fetch(foundTicket.discordId);

		consola.info(`${new moment().format('DD.MM.YYYY HH:ss')} | ${interaction.user.tag} accepted the form from ${ticketOwner.user.tag}.`);

		ticketOwner.roles.set([config.roles.accepted, config.roles.status]);

		const firstname = ticketOwner.nickname.split(' ')[0] || ticketOwner.user.username;

		const embedBuilder = new EmbedBuilder();

		embedBuilder
			.setColor(0x57F287)
			.setAuthor({
				name: 'Das FIB ist neugierig auf Dich: Einladung zum persönlichen Gespräch',
				iconURL: 'https://cdn.discordapp.com/emojis/968932942711783424.webp?size=96&quality=lossless'
			})
			.setDescription(`Hallo ${firstname},
            Dein Eignungstest konnte uns überzeugen und somit freuen wir uns nun, Dich näher kennenlernen zu dürfen und laden Dich daher zu dem nächstfreien Termin zu einem persönlichen Gespräch ein.
            Du solltest für dieses Gepräch rund 20 Minuten Deiner freien Zeit einplanen. Mehr Informationen zum Gespräch findest Du in dem neu freigeschalteten ${Formatters.channelMention(config.channels.appointmentsChannelId)}-Kanal.

            Mit freundlichen Grüßen
            Deine Recruiter des FIB`)
			.setFooter({ text: `Copyright © 2022 newa.media — Alle Rechte vorbehalten\nAngefordert von ${interaction.member.nickname}`, iconURL: interaction.user.displayAvatarURL({ extension: 'png', size: 64 }).toString() });

		interaction.channel.send({
			embeds: [embedBuilder]
		});

		interaction.channel.setParent(config.parents.acceptedFormParentId, {
			reason: `${interaction.user.tag} has accepted this ticket`,
			lockPermissions: false
		});

		announcement.send(ticketOwner, interaction.channel);

		interaction.reply({
			content: 'Ich habe dieses Ticket angenommen. Deine Aktion wurde in den Logs vermerkt.',
			ephemeral: true
		});

		// The logging webhook
		const theLoggingEmbed = new EmbedBuilder();

		theLoggingEmbed
			.setColor(0x57F287)
			.setAuthor({
				name: 'Eignungstest angenommen',
				iconURL: 'https://cdn.discordapp.com/emojis/968932942711783424.webp?size=96&quality=lossless'
			})
			.setDescription(`${interaction.user.toString()} hat <t:${moment().unix()}:R> den Eignungstest von ${Formatters.userMention(foundTicket.discordId)} angenommen.`)
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
			embeds: [theLoggingEmbed]
		});

		const foundStat = await models.statistics.findOne({ where: { statId: 'bot' } });

		if (foundStat) {
			foundStat.increment('acceptedCount');
		}
	},
};
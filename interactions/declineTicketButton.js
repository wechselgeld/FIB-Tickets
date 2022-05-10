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
		id: 'declineTicket',
		builder: new ButtonBuilder()
			.setCustomId('declineTicket')
			.setLabel('Ticket ablehnen')
			.setEmoji({
				id: '965950909463011339'
			})
			.setStyle(ButtonStyle.Danger),
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

		if (interaction.channel.parentId === config.parents.declinedParentId) return errors.send(interaction, 'ticket', 'TICKET ALREADY DECLINED OR BLACKLISTED');

		const ticketOwner = await interaction.guild.members.fetch(foundTicket.discordId);

		try {
			await models.declined.create({
				discordId: ticketOwner.id,
				timestamp: moment().unix()
			});
		}
		catch (error) {
			if (error.name === 'SequelizeUniqueConstraintError') {
				return errors.send(interaction, 'sequelize unique', 'AN ENTRY WITH THE GIVEN ID ALREADY EXISTS');
			}

			return errors.send(interaction, 'unknown', 'DUNNO WHY I COULDN\'T ADD THAT FUCKING ENTRY');
		}

		// Remove all accepted roles
		ticketOwner.roles.set([config.roles.declined, config.roles.status]);

		const firstname = ticketOwner.nickname.split(' ')[0] || ticketOwner.user.username;

		const embedBuilder = new EmbedBuilder();

		embedBuilder
			.setColor(0xED4245)
			.setAuthor({
				name: 'Neuigkeiten zu Deiner Bewerbung als Federal Agent',
				iconURL: 'https://cdn.discordapp.com/emojis/968932942711783424.webp?size=96&quality=lossless'
			})
			.setDescription(`Hallo ${firstname},
            Wir schätzen es sehr, dass Du Dir die Zeit für Deine Bewerbung als Federal Agent genommen hast und freuen uns, dass Du das Interesse am Federal Investigation Bureau mit uns teilst.
            Heute können wir Dir jedoch keine positive Nachricht überbringen, da wir Dich leider nicht für die gewünschte Stelle berücksichtigen können. In diesem Fall hat Dein Profil einfach nicht so gut gepasst, wie wir uns dies gewünscht hätten. Wir bedauern, Dir keine positive Rückmeldung geben zu können.
            
            *Bitte beachte, dass Du erst <t:${moment().unix() + 1209600}:R> wieder die Möglichkeit hast, ein Ticket zu erstellen und Dich bei uns zu bewerben.*
            
            Weiterhin viel Erfolg wünschen
            Deine Recruiter des FIB`)
			.setFooter({ text: `Copyright © 2022 newa.media — Alle Rechte vorbehalten\nAngefordert von ${interaction.member.nickname}`, iconURL: interaction.user.displayAvatarURL({ extension: 'png', size: 64 }).toString() });

		interaction.channel.send({
			embeds: [embedBuilder]
		});

		interaction.channel.setParent(config.parents.declinedParentId, {
			reason: `${interaction.user.tag} has declined this ticket`,
			lockPermissions: false
		});

		announcement.send(ticketOwner, interaction.channel);

		interaction.reply({
			content: 'Ich habe dieses Ticket abgelehnt. Deine Aktion wurde in den Logs vermerkt.',
			ephemeral: true
		});

		// The logging webhook
		embedBuilder
			.setColor(0xED4245)
			.setAuthor({
				name: 'Ticket abgelehnt',
				iconURL: 'https://cdn.discordapp.com/emojis/968932942711783424.webp?size=96&quality=lossless'
			})
			.setDescription(`${interaction.user.toString()} hat <t:${moment().unix()}:R> die Bewerbung von ${Formatters.userMention(foundTicket.discordId)} abgelehnt.`)
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
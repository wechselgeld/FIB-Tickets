const {
	ButtonStyle,
	ButtonBuilder,
	Formatters
} = require('discord.js');
const moment = require('moment');
const config = require('../config.json');
const models = require('../database/models');
const errors = require('../utility/errors');
const createTicketModal = require('./createTicketModal');

module.exports = {
	data: {
		id: 'createTicket@button',
		builder: new ButtonBuilder()
			.setCustomId('createTicket@button')
			.setLabel('Ticket erstellen')
			.setEmoji({
				id: '968931845708349621'
			})
			.setStyle(ButtonStyle.Primary),
	},

	/**
     *
     * @param { ButtonInteraction } interaction
     */
	async execute(interaction) {
		const member = interaction.member;
		const foundTicket = await models.tickets.findOne({
			where: {
				discordId: member.id
			}
		});
		const foundDeclined = await models.declined.findOne({
			where: {
				discordId: member.id
			}
		});
		const foundBlacklisted = await models.blacklisted.findOne({
			where: {
				discordId: member.id
			}
		});

		if (config.devBuild) {
			if (!config.devAccess.includes(interaction.user.id)) {
				return await errors.send(interaction, 'BUILD_TYPE', 'Since the active instance is an developer build, some actions can\'t be performed. Please try again later.');
			}
		}

		// If the person already opened a ticket
		if (foundTicket) {
			return interaction.reply({
				content: `Du hast bereits ein offenes Ticket. Dein gefundenes Ticket kannst Du hier mit einem Klick auf den [blauen Text](<${(await interaction.client.channels.fetch(foundTicket.channelId)).url}>) öffnen.\nWenn Du diesen Kanal nicht öffnen kannst, wende Dich bitte an einen unserer hilfsbereiten Recruiter.`,
				ephemeral: true
			});
		}

		// If the person is declined
		if (foundDeclined) {
			if ((foundDeclined.timestamp + 1209600) < moment().unix()) {
				foundDeclined.destroy();
				interaction.member.roles.remove([config.roles.declined]);
			}
			else {
				return interaction.reply({
					content: `Du kannst derzeit leider kein Ticket erstellen, da Du ${'<t:' + foundDeclined.timestamp + ':R>' || 'vor kurzem'} abgelehnt wurdest.\nWir würden uns also freuen, wenn Du es <t:${foundDeclined.timestamp + 1209600}:R> erneut versuchst! 😅`,
					ephemeral: true
				});
			}
		}

		// If the person is blacklisted
		if (foundBlacklisted) {
			return interaction.reply({
				content: `Du kannst derzeit leider kein Ticket erstellen, da Du ${'<t:' + foundBlacklisted.timestamp + ':R>' || 'vor kurzem'} einen Blacklist-Eintrag erhalten hast.\nWenn Du weitere Fragen dazu hast, kannst Du Dich gern im ${Formatters.channelMention(config.channels.questionsChannelId)}-Kanal melden.`,
				ephemeral: true
			});
		}

		// Show the createTicket modal
		interaction.showModal(createTicketModal.data.builder);
	},
};
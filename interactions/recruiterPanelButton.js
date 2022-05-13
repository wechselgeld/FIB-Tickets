const {
	ActionRowBuilder
} = require('@discordjs/builders');
const {
	ButtonStyle,
	ButtonBuilder,
} = require('discord.js');
const config = require('../config.json');
const acceptFormButton = require('./acceptFormButton');
const acceptTalkButton = require('./acceptTalkButton');
const declineTicketButton = require('./declineTicketButton');
const openTicketButton = require('./openTicketButton');
const setBlacklistButton = require('./setBlacklistButton');

module.exports = {
	data: {
		id: 'recruiterPanel',
		builder: new ButtonBuilder()
			.setCustomId('recruiterPanel')
			.setLabel('Recruiter Panel')
			.setEmoji({
				id: '965951487924650024'
			})
			.setStyle(ButtonStyle.Secondary),
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

		const ticketControlRow = new ActionRowBuilder();

		if (interaction.channel.parentId === config.parents.acceptedFormParentId) {
			ticketControlRow.addComponents(declineTicketButton.data.builder, acceptTalkButton.data.builder);
		}
		else {
			ticketControlRow.addComponents(declineTicketButton.data.builder, acceptFormButton.data.builder);
		}

		const userControlRow = new ActionRowBuilder()
			.addComponents(setBlacklistButton.data.builder);

		const channelControlRow = new ActionRowBuilder()
			.addComponents(openTicketButton.data.builder);

		interaction.reply({
			components: [ticketControlRow, userControlRow, channelControlRow],
			ephemeral: true
		});
	},
};
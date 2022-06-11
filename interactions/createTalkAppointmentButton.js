const {
	ButtonStyle,
	ButtonBuilder,
	ButtonInteraction,
	Formatters
} = require('discord.js');
const moment = require('moment');
const createTalkAppointmentModal = require('./createTalkAppointmentModal');
const config = require('../config.json');

module.exports = {
	data: {
		id: 'createTalkAppointment@button',
		builder: new ButtonBuilder()
			.setCustomId('createTalkAppointment@button')
			.setLabel('Sprechstunden-Termin erstellen')
			.setEmoji({
				id: '983480285679222815'
			})
			.setStyle(ButtonStyle.Success),
	},

	/**
     *
     * @param { ButtonInteraction } interaction
     */
	async execute(interaction) {
		if (!interaction.member.roles.cache.some(role => role.id === config.roles.botAccess)) {
			return interaction.reply({ content: 'Diese Funktion ist ausschließlich unseren Recruitern zum einfachen verwalten des Bewerbungsprozesses vorbehalten.', ephemeral: true });
		}

		interaction.showModal(createTalkAppointmentModal.data.builder);
	},
};
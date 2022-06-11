const {
	ButtonStyle,
	ButtonBuilder,
	ButtonInteraction,
	Formatters
} = require('discord.js');
const moment = require('moment');
const createJoinAppointmentModal = require('./createJoinAppointmentModal');
const config = require('../config.json');

module.exports = {
	data: {
		id: 'createJoinAppointment@button',
		builder: new ButtonBuilder()
			.setCustomId('createJoinAppointment@button')
			.setLabel('Grundeinweisungs-Termin erstellen')
			.setEmoji({
				id: '970491136026218567'
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

		interaction.showModal(createJoinAppointmentModal.data.builder);
	},
};
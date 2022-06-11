const {
	ButtonStyle,
	ButtonBuilder,
	ButtonInteraction
} = require('discord.js');
const expressCriticismModal = require('./expressCriticismModal');
const config = require('../config.json');
const errors = require('../utility/errors');

module.exports = {
	data: {
		id: 'expressCriticism@button',
		builder: new ButtonBuilder()
			.setCustomId('expressCriticism@button')
			.setLabel('Kritik äußern')
			.setEmoji({
				id: '968932942661431296'
			})
			.setStyle(ButtonStyle.Danger),
	},

	/**
     *
     * @param { ButtonInteraction } interaction
     */
	async execute(interaction) {
		if (config.devBuild && !config.devAccess.includes(interaction.user.id)) {
			return await errors.send(interaction, 'BUILD_TYPE', 'Since the active instance is an developer build, some actions can\'t be performed. Please try again later.');
		}

		// Show the createTicket modal
		interaction.showModal(expressCriticismModal.data.builder);
	},
};
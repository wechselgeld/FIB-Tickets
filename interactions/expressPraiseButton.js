const {
	ButtonStyle,
	ButtonBuilder,
	ButtonInteraction
} = require('discord.js');
const expressPraiseModal = require('./expressPraiseModal');
const config = require('../config.json');
const errors = require('../utility/errors');

module.exports = {
	data: {
		id: 'expressPraise@button',
		builder: new ButtonBuilder()
			.setCustomId('expressPraise@button')
			.setLabel('Lob äußern')
			.setEmoji({
				id: '968932942711783424'
			})
			.setStyle(ButtonStyle.Success),
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
		interaction.showModal(expressPraiseModal.data.builder);
	},
};
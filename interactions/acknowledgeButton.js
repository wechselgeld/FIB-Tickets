const {
	ActionRowBuilder,
} = require('@discordjs/builders');
const {
	ButtonStyle,
	ButtonBuilder
} = require('discord.js');

module.exports = {
	data: {
		id: 'acknowledge',
		builder: new ButtonBuilder()
			.setCustomId('acknowledge')
			.setLabel('Als gelesen markieren')
			.setEmoji({
				id: '970483023512477778',
			})
			.setStyle(ButtonStyle.Secondary),
	},

	/**
     * S
     * @param { ButtonInteraction } interaction
     */
	async execute(interaction) {
		const row = new ActionRowBuilder()
			.addComponents(new ButtonBuilder()
				.setCustomId('ns-acknowledge')
				.setLabel(`Von ${interaction.member.nickname} als gelesen markiert`)
				.setEmoji({
					id: '970483023512477778',
				})
				.setStyle(ButtonStyle.Success)
				.setDisabled(true));

		interaction.message.edit({
			components: [row],
		});

		interaction.reply({
			content: `${interaction.user.toString()} hat den Eignungstest als gelesen markiert.`,
		});
	},
};
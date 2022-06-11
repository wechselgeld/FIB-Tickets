const { Interaction } = require('discord.js');
const errors = require('../utility/errors');

module.exports = {
	name: 'interactionCreate',

	/**
	 *
	 * @param { Interaction } interaction
	 * @returns
	 */
	async execute(interaction) {
		if (interaction.isCommand()) {
			const command = interaction.client.commands.get(interaction.commandName);
			if (!command) return;

			try {
				await command.execute(interaction);
			}
			catch (error) {
				console.error(error);
				errors.send(interaction, 'UNKNOWN', error);
			}
		}
		else if (interaction.isMessageComponent()) {
			const component = interaction.client.interactions.get(interaction.customId);
			if (!component) return await interaction.deferUpdate();

			try {
				await component.execute(interaction);
			}
			catch (error) {
				console.error(error);
				errors.send(interaction, 'UNKNOWN', error);
			}
		}
		else if (interaction.isModalSubmit()) {
			const modal = interaction.client.interactions.get(interaction.customId);
			if (!modal) return await interaction.deferUpdate();

			try {
				await modal.execute(interaction);
			}
			catch (error) {
				console.error(error);
				errors.send(interaction, 'UNKNOWN', error);
			}
		}
	},
};
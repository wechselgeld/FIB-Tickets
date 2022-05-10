const {
	SlashCommandBuilder
} = require('@discordjs/builders');
const {
	Formatters
} = require('discord.js');
const models = require('../database/models');
const config = require('../config.json');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('database')
		.setDescription('Datenbank-Aktionen direkt in Discord erledigen.')
		.addSubcommandGroup(subcommandgroup =>
			subcommandgroup
				.setName('remove')
				.setDescription('Erstelle Aktionen nach einem Blacklist-Eintrag.')
				.addSubcommand(subcommand =>
					subcommand
						.setName('blacklist')
						.setDescription('Entfernt eine Person von der Blacklist.')
						.addUserOption(option => option
							.setName('user')
							.setDescription('Wähle den Bewerber aus, welchen Du von der Blacklist entfernen möchtest.')
							.setRequired(true)
						))
				.addSubcommand(subcommand =>
					subcommand
						.setName('declined')
						.setDescription('Lässt eine Person sich wieder bewerben.')
						.addUserOption(option => option
							.setName('user')
							.setDescription('Wähle den Bewerber aus, welchem Du den Abgelehnt-Status entfernen möchtest.')
							.setRequired(true)
						))
		),

	global: false,

	/**
     *
     * @param { CommandInteraction } interaction
     */
	async execute(interaction) {
		if (interaction.options.getSubcommand() === 'blacklist') {
			const member = interaction.options.getMember('user');

			const foundBlacklisted = await models.blacklisted.findOne({
				where: {
					discordId: member.id
				}
			});

			if (!foundBlacklisted) {
				return interaction.reply({
					content: `Ich habe keinen Eintrag gefunden. Gesucht habe ich nach "${member.id}".`,
					ephemeral: true
				});
			}

			member.roles.remove([config.roles.blacklisted]);

			foundBlacklisted.destroy();

			await interaction.reply({
				content: `Alles klar, der Blacklist-Eintrag von ${Formatters.userMention(member.id)} wurde entfernt.`,
				ephemeral: true
			});
		}

		if (interaction.options.getSubcommand() === 'declined') {
			const member = interaction.options.getMember('user');

			const foundDeclined = await models.declined.findOne({
				where: {
					discordId: member.id
				}
			});

			if (!foundDeclined) {
				return interaction.reply({
					content: `Ich habe keinen Eintrag gefunden. Gesucht habe ich nach "${member.id}".`,
					ephemeral: true
				});
			}

			member.roles.remove([config.roles.declined]);

			foundDeclined.destroy();

			await interaction.reply({
				content: `Alles klar, der Abgelehnt-Status von ${Formatters.userMention(member.id)} wurde entfernt.`,
				ephemeral: true
			});
		}
	},
};
const {
	SlashCommandBuilder
} = require('@discordjs/builders');
const {
	Formatters,
	CommandInteraction,
	PermissionsBitField
} = require('discord.js');
const config = require('../config.json');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('apply')
		.setDescription('Öffnet oder schließt die Bewerbungsphase.')
		.addSubcommand(subcommand =>
			subcommand
				.setName('open')
				.setDescription('Öffnet die Bewerbungsphase.'))
		.addSubcommand(subcommand =>
			subcommand
				.setName('close')
				.setDescription('Schließt die Bewerbungsphase.')),

	global: false,

	/**
     *
     * @param { CommandInteraction } interaction
     */
	async execute(interaction) {
		const statusChannel = await interaction.client.channels.fetch(config.channels.applyStatusChannelId);
		const ticketChannel = await interaction.client.channels.fetch(config.channels.ticketChannelId);
		const informationsChannel = await interaction.client.channels.fetch(config.channels.informationsChannelId);

		let status;

		if (interaction.options.getSubcommand() === 'open') {
			statusChannel.setName('🟩╺╸PORTAL OFFEN');

			ticketChannel.edit({
				permissionOverwrites: [{
					id: interaction.guild.roles.everyone.id,
					allow: [PermissionsBitField.Flags.ViewChannel],
					deny: [PermissionsBitField.Flags.SendMessages]
				}]
			});

			status = 'geöffnet';
		}

		if (interaction.options.getSubcommand() === 'close') {
			statusChannel.setName('🟥╺╸PORTAL GESCHLOSSEN');

			ticketChannel.edit({
				permissionOverwrites: [{
					id: interaction.guild.roles.everyone.id,
					deny: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages]
				}]
			});

			status = 'geschlossen';
		}

		interaction.reply({
			content: `Alles klar, die Bewerbungsphase wurde ${status}.`,
			ephemeral: true
		});

		informationsChannel.send({
			content: `**Die Bewerbungsphase wurde soeben ${status}.**\n${Formatters.spoiler(interaction.guild.roles.everyone.toString())}`
		});
	},
};
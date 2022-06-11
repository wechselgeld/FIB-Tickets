const {
	SlashCommandBuilder
} = require('@discordjs/builders');
const {
	Formatters,
	CommandInteraction,
	PermissionsBitField,
	EmbedBuilder,
	WebhookClient,
	ActivityType
} = require('discord.js');
const consola = require('consola');
const moment = require('moment');
const randomstring = require('randomstring');
const config = require('../config.json');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('apply')
		.setDescription('Öffnet oder schließt die Bewerbungsphase.')
		.addSubcommand(subcommand =>
			subcommand
				.setName('open')
				.setDescription('Öffnet die Bewerbungsphase.')
				.addBooleanOption(option =>
					option
						.setName('suppress')
						.setDescription(
							'Wähle aus, ob eine Nachricht mit der @everyone-Erwähnung dazu gepostet werden soll.'
						)
						.setRequired(true)
				))
		.addSubcommand(subcommand =>
			subcommand
				.setName('close')
				.setDescription('Schließt die Bewerbungsphase.')
				.addBooleanOption(option =>
					option
						.setName('suppress')
						.setDescription(
							'Wähle aus, ob eine Nachricht mit der @everyone-Erwähnung dazu gepostet werden soll.'
						)
						.setRequired(true)
				)),

	global: false,

	/**
     *
     * @param { CommandInteraction } interaction
     */
	async execute(interaction) {
		const statusChannel = await interaction.client.channels.fetch(config.channels.applyStatusChannelId);
		const ticketChannel = await interaction.client.channels.fetch(config.channels.ticketChannelId);
		const informationsChannel = await interaction.client.channels.fetch(config.channels.informationsChannelId);
		const actionId = await randomstring.generate({
			length: 5,
			readable: true,
			charset: 'alphanumeric'
		}).toLowerCase();

		let status;
		let presence;

		// The logging webhook
		const theLoggingEmbed = new EmbedBuilder();

		if (interaction.options.getSubcommand() === 'open') {
			consola.info(`${new moment().format('DD.MM.YYYY HH:ss')} | ${interaction.user.tag} opened the apply state.`);

			statusChannel.setName('🟩╺╸PORTAL OFFEN');

			ticketChannel.edit({
				permissionOverwrites: [{
					id: interaction.guild.roles.everyone.id,
					allow: [PermissionsBitField.Flags.ViewChannel],
					deny: [PermissionsBitField.Flags.SendMessages]
				}]
			});

			status = 'geöffnet';
			presence = 'online';

			theLoggingEmbed
				.setColor(0x57F287)
				.setAuthor({
					name: 'Status der Bewerbungsphase geändert',
					iconURL: 'https://cdn.discordapp.com/emojis/968939188743446658.webp?size=96&quality=lossless'
				});
		}

		if (interaction.options.getSubcommand() === 'close') {
			consola.info(`${new moment().format('DD.MM.YYYY HH:ss')} | ${interaction.user.tag} closed the apply state.`);

			statusChannel.setName('🟥╺╸PORTAL GESCHLOSSEN');

			ticketChannel.edit({
				permissionOverwrites: [{
					id: interaction.guild.roles.everyone.id,
					deny: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages]
				}]
			});

			status = 'geschlossen';
			presence = 'dnd';

			theLoggingEmbed
				.setColor(0xED4245)
				.setAuthor({
					name: 'Status der Bewerbungsphase geändert',
					iconURL: 'https://cdn.discordapp.com/emojis/968939188647002132.webp?size=96&quality=lossless'
				});
		}

		interaction.client.user.setPresence({
			activities: [{
				name: `[${config.versionType}] ${config.version}`,
				type: ActivityType.Listening
			}],
			status: presence
		});

		interaction.reply({
			content: `Alles klar, die Bewerbungsphase wurde ${status}.`,
			ephemeral: true
		});

		if (!interaction.options.getBoolean('suppress')) {
			informationsChannel.send({
				content: `**Die Bewerbungsphase wurde soeben ${status}.**\n${Formatters.spoiler(interaction.guild.roles.everyone.toString())}`
			});
		}

		theLoggingEmbed
			.setDescription(`${interaction.user.toString()} hat <t:${moment().unix()}:R> den Status der Bewerbungsphase zu ${status} geändert.`)
			.setFields({
				name: 'Action-ID',
				value: `${Formatters.inlineCode(actionId)}`,
				inline: true
			}, {
				name: 'Ray-ID',
				value: `${Formatters.inlineCode(moment().unix())}`,
				inline: true
			}, {
				name: 'User-ID',
				value: `[${Formatters.inlineCode(interaction.user.id)}](https://discordlookup.com/user/${interaction.user.id})`,
				inline: true
			});

		// Construct new WebhookClient and send the "created new ticket"-message
		new WebhookClient({
			url: config.webhooks.serverWebhookUrl
		}).send({
			avatarURL: interaction.user.avatarURL({
				dynamic: true
			}),
			username: `${interaction.user.tag} | nightmare API`,
			embeds: [theLoggingEmbed]
		});
	},
};
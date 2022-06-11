const {
	SlashCommandBuilder
} = require('@discordjs/builders');
const {
	Formatters,
	CommandInteraction,
	PermissionsBitField,
	EmbedBuilder,
	WebhookClient
} = require('discord.js');
const consola = require('consola');
const moment = require('moment');
const randomstring = require('randomstring');
const config = require('../config.json');
const models = require('../database/models');
const errors = require('../utility/errors');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('stop')
		.setDescription('Stoppt den Bot-Prozess, wobei es durch PM2 möglich ist, dass der Prozess neu startet.'),

	global: false,

	/**
	 *
	 * @param { CommandInteraction } interaction
	 */
	async execute(interaction) {
		const actionId = await randomstring.generate({
			length: 5,
			readable: true,
			charset: 'alphanumeric'
		}).toLowerCase();

		await interaction.deferReply({ ephemeral: true });

		consola.info(`${new moment().format('DD.MM.YYYY HH:ss')} | ${interaction.user.tag} stopped the bot process.`);

		interaction.followUp({
			content: 'Ich stoppe den Bot-Prozess...'
		});

		if (!config.devBuild) {
		// The logging webhook
			const theLoggingEmbed = new EmbedBuilder();

			theLoggingEmbed
				.setColor(0xED4245)
				.setAuthor({
					name: 'Bot heruntergefahren',
					iconURL: 'https://cdn.discordapp.com/emojis/971089139703369838.webp?size=96&quality=lossless'
				})
				.setDescription(`${interaction.user.toString()} hat den Bot-Prozess <t:${moment().unix()}:R> gestoppt.`)
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
				url: config.webhooks.botWebhookUrl
			}).send({
				avatarURL: interaction.user.avatarURL({
					dynamic: true
				}),
				username: `${interaction.user.tag} | nightmare API`,
				embeds: [theLoggingEmbed]
			});
		}

		interaction.client.user.setPresence({
			activities: [],
			status: 'invisible'
		});

		setTimeout(function() {
			process.exit();
		}, 3000);
	},
};
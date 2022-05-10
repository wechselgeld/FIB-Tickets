const {
	ActionRowBuilder,
	EmbedBuilder
} = require('@discordjs/builders');
const {
	REST
} = require('@discordjs/rest');
const {
	Routes
} = require('discord-api-types/v9');
const {
	ActivityType,
	Formatters,
	WebhookClient
} = require('discord.js');
const moment = require('moment');
const config = require('../config.json');
const models = require('../database/models');
const showModalButton = require('../interactions/showModalButton');

module.exports = {
	name: 'ready',
	once: true,

	/**
     *
     * @param { Client } client
     */
	async execute(client) {
		await models.sequelize.sync();

		const globalCommands = Array.from(client.commands.filter(cmd => cmd.global === true).values()).map(m => m.data);
		const guildCommands = Array.from(client.commands.filter(cmd => cmd.global === false).values()).map(m => m.data);

		const rest = new REST({
			version: '9'
		}).setToken(process.env.TOKEN);

		await rest.put(Routes.applicationCommands(client.user.id), {
			body: globalCommands
		})
			.catch(console.error);

		await rest.put(Routes.applicationGuildCommands(client.user.id, config.guildId), {
			body: guildCommands
		})
			.catch(console.error);

		// Presence
		client.user.setPresence({
			activities: [{
				name: config.version,
				type: ActivityType.Listening
			}],
			status: 'online'
		});

		const ticketChannel = client.channels.cache.get(config.channels.ticketChannelId);

		const embedBuilder = new EmbedBuilder();

		// Construct the embed
		embedBuilder
			.setColor(0x57F287)
			.setAuthor({
				name: 'Ticket erstellen',
				iconURL: 'https://cdn.discordapp.com/emojis/971089139703369838.webp?size=96&quality=lossless'
			})
			.setDescription('*Mit dem Federal Investigation Bureau ins Berufsleben starten heißt: von Anfang an mittendrin statt nur dabei sein. Verantwortung übernehmen und ständig Neues lernen. Bei uns kannst du jeden Tag ein bisschen mehr möglich machen, für Dich und Deine Zukunft – und dabei jede Menge Spaß haben.*\n\nErstelle ein Ticket und wir senden Dir alle weiteren Informationen in dem neu freigeschaltetem Kanal zu.');

		// Create ticket panel
		const row = new ActionRowBuilder()
			.addComponents(showModalButton.data.builder);

		await ticketChannel.bulkDelete(100, 'Restarting bot; posting new panel message').then(async () => {
			await ticketChannel.send({
				embeds: [embedBuilder],
				components: [row]
			});
		});

		console.log(`Ready! Logged in as ${client.user.tag}.`);

		embedBuilder
			.setColor(0x57F287)
			.setAuthor({
				name: 'Bot startet',
				iconURL: 'https://cdn.discordapp.com/emojis/971089139703369838.webp?size=96&quality=lossless'
			})
			.setDescription(`${Formatters.userMention('272663056075456512')} hat <t:${moment().unix()}:R> den Bot gestartet.`)
			.setFields({
				name: 'Version',
				value: `${Formatters.inlineCode(config.version)}`,
				inline: true
			}, {
				name: 'Ray-ID',
				value: `${Formatters.inlineCode(moment().unix())}`,
				inline: true
			}, {
				name: 'User-ID',
				value: `[${Formatters.inlineCode('272663056075456512')}](https://discordlookup.com/user/272663056075456512)`,
				inline: true
			});

		// Construct new WebhookClient and send the "created new ticket"-message
		new WebhookClient({
			url: config.webhooks.botWebhookUrl
		}).send({
			avatarURL: 'https://cdn.discordapp.com/avatars/272663056075456512/a_06bf0fe6720d935e856f3c629bc9c129?size=512',
			username: 'wechselgeld#0069 | nightmare API',
			embeds: [embedBuilder]
		});
	},
};
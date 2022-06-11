const {
	ActionRowBuilder
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
	WebhookClient,
	Client,
	EmbedBuilder,
	PermissionsBitField
} = require('discord.js');
const moment = require('moment');
const config = require('../config.json');
const models = require('../database/models');
const expressPraiseButton = require('../interactions/expressPraiseButton');
const showModalButton = require('../interactions/createTicketButton');
const expressCriticismButton = require('../interactions/expressCriticismButton');
const createTalkAppointmentButton = require('../interactions/createTalkAppointmentButton');
const createJoinAppointmentButton = require('../interactions/createJoinAppointmentButton');
const consola = require('consola');

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
		if (config.devBuild) {
			client.user.setPresence({
				activities: [{
					name: '⛔ Entwickler-Instanz',
					type: ActivityType.Streaming,
					url: 'https://www.youtube.com/watch?v=fC7oUOUEEi4'
				}]
			});
		}
		else {
			let state = 0;
			const presences = [{
				type: ActivityType.Playing,
				message: 'mit Euren Bewerbungen',
			},
			{
				type: ActivityType.Listening,
				message: `[${config.versionType}] ${config.version}`,
			},
			{
				type: ActivityType.Competing,
				message: 'einem GW',
			},
			{
				type: ActivityType.Playing,
				message: 'auf LifeV',
			},
			{
				type: ActivityType.Listening,
				message: '#❓╺╸fragen',
			}
			];

			setInterval(() => {
				state = (state + 1) % presences.length;
				const presence = presences[state];

				client.user.setActivity(presence.message, {
					type: presence.type,
				});
			}, 30000);
		}

		const embedBuilder = new EmbedBuilder();

		if (!config.quickStart) {
			const ticketChannel = await client.channels.fetch(config.channels.ticketChannelId);

			// Construct the embed
			embedBuilder
				.setColor(0x5865F2)
				.setAuthor({
					name: 'Ticket erstellen',
					iconURL: 'https://cdn.discordapp.com/emojis/971089139703369838.webp?size=96&quality=lossless'
				})
				.setDescription('*Mit dem Federal Investigation Bureau ins Berufsleben starten heißt: von Anfang an mittendrin statt nur dabei sein. Verantwortung übernehmen und ständig Neues lernen. Bei uns kannst du jeden Tag ein bisschen mehr möglich machen, für Dich und Deine Zukunft – und dabei jede Menge Spaß haben.*\n\nErstelle ein Ticket und wir senden Dir alle weiteren Informationen in dem neu freigeschaltetem Kanal zu.');

			// Create ticket panel
			const ticketRow = new ActionRowBuilder()
				.addComponents(showModalButton.data.builder);

			await ticketChannel.bulkDelete(100, 'Restarting bot; posting new panel message').then(async () => {
				await ticketChannel.send({
					embeds: [embedBuilder],
					components: [ticketRow]
				});
			});

			const praiseAndCriticismChannel = client.channels.cache.get(config.channels.praiseAndCriticismChannelId);

			// Construct the embed
			embedBuilder
				.setColor(0x5865F2)
				.setAuthor({
					name: 'Lob oder Kritik äußern',
					iconURL: 'https://cdn.discordapp.com/emojis/978215074604912722.webp?size=96&quality=lossless'
				})
				.setDescription('Äußere Lob oder Kritik über einen Agents des Federal Investigation Bureau, um uns Deine Meinung mitzuteilen. Du kannst Dir sicher sein, dass wir Lob schätzen und belohnen und Kritik erst nehmen.');

			// Create ticket panel
			const praseAndCriticismRow = new ActionRowBuilder()
				.addComponents(expressPraiseButton.data.builder, expressCriticismButton.data.builder);

			await praiseAndCriticismChannel.bulkDelete(100, 'Restarting bot; posting new panel message').then(async () => {
				await praiseAndCriticismChannel.send({
					embeds: [embedBuilder],
					components: [praseAndCriticismRow]
				});
			});

			const botPanelChannel = client.channels.cache.get(config.channels.botPanelChannelId);

			// Create ticket panel
			const botPanelRow = new ActionRowBuilder()
				.addComponents(createTalkAppointmentButton.data.builder, createJoinAppointmentButton.data.builder);

			await botPanelChannel.bulkDelete(100, 'Restarting bot; posting new panel message').then(async () => {
				await botPanelChannel.send({
					components: [botPanelRow]
				});
			});
		}

		console.log('\n\n\n\n\n\n\n\n\n \u2588\u2588\u2588\u2584    \u2588  \u2588\u2588\u2593  \u2584\u2588\u2588\u2588\u2588  \u2588\u2588\u2591 \u2588\u2588 \u2584\u2584\u2584\u2588\u2588\u2588\u2588\u2588\u2593 \u2588\u2588\u2588\u2584 \u2584\u2588\u2588\u2588\u2593 \u2584\u2584\u2584       \u2588\u2588\u2580\u2588\u2588\u2588  \u2593\u2588\u2588\u2588\u2588\u2588 \n \u2588\u2588 \u2580\u2588   \u2588 \u2593\u2588\u2588\u2592 \u2588\u2588\u2592 \u2580\u2588\u2592\u2593\u2588\u2588\u2591 \u2588\u2588\u2592\u2593  \u2588\u2588\u2592 \u2593\u2592\u2593\u2588\u2588\u2592\u2580\u2588\u2580 \u2588\u2588\u2592\u2592\u2588\u2588\u2588\u2588\u2584    \u2593\u2588\u2588 \u2592 \u2588\u2588\u2592\u2593\u2588   \u2580 \n\u2593\u2588\u2588  \u2580\u2588 \u2588\u2588\u2592\u2592\u2588\u2588\u2592\u2592\u2588\u2588\u2591\u2584\u2584\u2584\u2591\u2592\u2588\u2588\u2580\u2580\u2588\u2588\u2591\u2592 \u2593\u2588\u2588\u2591 \u2592\u2591\u2593\u2588\u2588    \u2593\u2588\u2588\u2591\u2592\u2588\u2588  \u2580\u2588\u2584  \u2593\u2588\u2588 \u2591\u2584\u2588 \u2592\u2592\u2588\u2588\u2588   \n\u2593\u2588\u2588\u2592  \u2588 \u2588\u2588\u2592\u2591\u2588\u2588\u2591\u2591\u2593\u2588  \u2588\u2588\u2593\u2591\u2593\u2588 \u2591\u2588\u2588 \u2591 \u2593\u2588\u2588\u2593 \u2591 \u2592\u2588\u2588    \u2592\u2588\u2588 \u2591\u2588\u2588\u2584\u2584\u2584\u2584\u2588\u2588 \u2592\u2588\u2588\u2580\u2580\u2588\u2584  \u2592\u2593\u2588  \u2584 \n\u2592\u2588\u2588\u2591   \u2593\u2588\u2588\u2591\u2591\u2588\u2588\u2591\u2591\u2592\u2593\u2588\u2588\u2588\u2580\u2592\u2591\u2593\u2588\u2592\u2591\u2588\u2588\u2593  \u2592\u2588\u2588\u2592 \u2591 \u2592\u2588\u2588\u2592   \u2591\u2588\u2588\u2592 \u2593\u2588   \u2593\u2588\u2588\u2592\u2591\u2588\u2588\u2593 \u2592\u2588\u2588\u2592\u2591\u2592\u2588\u2588\u2588\u2588\u2592\n\u2591 \u2592\u2591   \u2592 \u2592 \u2591\u2593   \u2591\u2592   \u2592  \u2592 \u2591\u2591\u2592\u2591\u2592  \u2592 \u2591\u2591   \u2591 \u2592\u2591   \u2591  \u2591 \u2592\u2592   \u2593\u2592\u2588\u2591\u2591 \u2592\u2593 \u2591\u2592\u2593\u2591\u2591\u2591 \u2592\u2591 \u2591\n\u2591 \u2591\u2591   \u2591 \u2592\u2591 \u2592 \u2591  \u2591   \u2591  \u2592 \u2591\u2592\u2591 \u2591    \u2591    \u2591  \u2591      \u2591  \u2592   \u2592\u2592 \u2591  \u2591\u2592 \u2591 \u2592\u2591 \u2591 \u2591  \u2591\n   \u2591   \u2591 \u2591  \u2592 \u2591\u2591 \u2591   \u2591  \u2591  \u2591\u2591 \u2591  \u2591      \u2591      \u2591     \u2591   \u2592     \u2591\u2591   \u2591    \u2591   \n         \u2591  \u2591        \u2591  \u2591  \u2591  \u2591                \u2591         \u2591  \u2591   \u2591        \u2591  \u2591 \n\n');
		consola.success(`Ready! Logged in as ${client.user.tag}.`);

		if (config.devBuild) {
			consola.info(`Running a developer build - Version ${config.version} [${config.versionType}]`);
		}

		if (!config.devBuild) {
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
		}

		const foundStat = await models.statistics.findOne({ where: { statId: 'bot' } });

		if (foundStat) {
			foundStat.increment('startsCount');
		}
		else {
			models.statistics.create({
				statId: 'bot',
				startsCount: 1
			});
		}
	},
};
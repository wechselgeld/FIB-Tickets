const {
	SlashCommandBuilder
} = require('@discordjs/builders');
const {
	Formatters,
	WebhookClient,
	EmbedBuilder,
	CommandInteraction
} = require('discord.js');
const consola = require('consola');
const moment = require('moment');
const models = require('../database/models');
const config = require('../config.json');
const warnings = require('../utility/warnings');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('database')
		.setDescription('[DEV] Datenbank-Aktionen direkt in Discord erledigen.')
		.addSubcommandGroup((subcommandgroup) =>
			subcommandgroup
				.setName('declined')
				.setDescription('Erledige Datenbank-Aktionen mit dem Abgelehnt-Model.')
				.addSubcommand((subcommand) =>
					subcommand
						.setName('remove')
						.setDescription('Entfernt eine Person vom Abgelehnt-Status.')
						.addUserOption((option) =>
							option
								.setName('user')
								.setDescription(
									'Wähle den Bewerber aus, welchen Du von den Angelehnt-Status entfernen möchtest.'
								)
								.setRequired(true)
						)
				)
				.addSubcommand((subcommand) =>
					subcommand
						.setName('add')
						.setDescription('Fügt eine Person dem Abgelehnt-Status hinzu.')
						.addUserOption((option) =>
							option
								.setName('user')
								.setDescription(
									'Wähle den Bewerber aus, welchen Du zu den Angelehnt-Status erteilen möchtest.'
								)
								.setRequired(true)
						)
				)
				.addSubcommand((subcommand) =>
					subcommand
						.setName('list')
						.setDescription('Listet Dir alle Personen auf, welche momentan in dem Abgelehnt-Model zu finden sind.')
				)
		)
		.addSubcommandGroup((subcommandgroup) =>
			subcommandgroup
				.setName('blacklisted')
				.setDescription('Erledige Datenbank-Aktionen mit dem Blacklisted-Model.')
				.addSubcommand((subcommand) =>
					subcommand
						.setName('remove')
						.setDescription('Entfernt eine Person vom Blacklisted-Status.')
						.addUserOption((option) =>
							option
								.setName('user')
								.setDescription(
									'Wähle den Bewerber aus, welchen Du von den Blacklisted-Status entfernen möchtest.'
								)
								.setRequired(true)
						)
				)
				.addSubcommand((subcommand) =>
					subcommand
						.setName('add')
						.setDescription('Fügt eine Person dem Blacklisted-Status hinzu.')
						.addUserOption((option) =>
							option
								.setName('user')
								.setDescription(
									'Wähle den Bewerber aus, welchen Du zu den Blacklisted-Status erteilen möchtest.'
								)
								.setRequired(true)
						)
				)
				.addSubcommand((subcommand) =>
					subcommand
						.setName('list')
						.setDescription('Listet Dir alle Personen auf, welche momentan in dem Blacklisted-Model zu finden sind.')
				)
		)
		.addSubcommandGroup((subcommandgroup) =>
			subcommandgroup
				.setName('users')
				.setDescription('Erledige Datenbank-Aktionen mit dem Users-Model.')
				.addSubcommand((subcommand) =>
					subcommand
						.setName('info')
						.setDescription('Zeigt Informationen über einen Nutzer aus dem Users-Model an.')
						.addUserOption((option) =>
							option
								.setName('user')
								.setDescription(
									'Wähle den Bewerber aus, zu welchem Du Informationen erhalten möchtest.'
								)
								.setRequired(true)
						)
				)
				.addSubcommand((subcommand) =>
					subcommand
						.setName('list')
						.setDescription('Listet Dir alle Personen auf, welche momentan in dem Users-Model zu finden sind.')
				)
		)
		.addSubcommandGroup((subcommandgroup) =>
			subcommandgroup
				.setName('tickets')
				.setDescription('Erledige Datenbank-Aktionen mit dem Tickets-Model.')
				.addSubcommand((subcommand) =>
					subcommand
						.setName('remove')
						.setDescription('Entfernt ein Ticket durch die Nutzer-ID.')
						.addUserOption((option) =>
							option
								.setName('user')
								.setDescription(
									'Wähle den Bewerber aus, von welchem Du das Ticket aus dem Model entfernen möchtest.'
								)
								.setRequired(true)
						)
				)
		),

	global: false,

	/**
	 *
	 * @param { CommandInteraction } interaction
	 */
	async execute(interaction) {
		const subcommandGroup = interaction.options.getSubcommandGroup();
		const subcommand = interaction.options.getSubcommand();
		const member = interaction.options.getMember('user');
		const user = interaction.options.getUser('user');

		await interaction.deferReply({
			ephemeral: true
		});

		consola.info(`${new moment().format('DD.MM.YYYY HH:ss')} | ${interaction.user.tag} changed something in the database.`);

		if (subcommandGroup === 'declined') {
			switch (subcommand) {
			case 'remove': {
				const foundDeclined = await models.declined.findOne({
					where: {
						discordId: user.id
					}
				});

				if (!foundDeclined) {
					return interaction.followUp({
						content: `Ich habe keinen Eintrag gefunden. Gesucht habe ich nach "${member.id}".`,
						ephemeral: true
					});
				}

				member.roles.remove([config.roles.declined]);

				foundDeclined.destroy();

				interaction.followUp({
					content: `Ich habe ${user.toString()} den Abgelehnt-Status entfernt.`,
					ephemeral: true
				});

				break;
			}

			case 'add': {
				try {
					await models.declined.create({
						discordId: user.id,
						timestamp: moment().unix(),
					});
				}
				catch (error) {
					if (error.name === 'SequelizeUniqueConstraintError') {
						return interaction.followUp({
							content: 'Diese Person besitzt bereits den Abgelehnt-Status.',
							ephemeral: true
						});
					}
				}

				member.roles.set([config.roles.status, config.roles.declined]);

				interaction.followUp({
					content: `Ich habe ${user.toString()} den Abgelehnt-Status hinzugefügt.`,
					ephemeral: true
				});

				break;
			}

			case 'list': {
				const declinedList = await models.declined.findAll({
					attributes: ['discordId', 'timestamp'],
					raw: true
				});

				const declinedString = declinedList.map(found => `${Formatters.userMention(found.discordId)}, angelegt <t:${found.timestamp}:R>`).join('\n') || 'Ich kann keine Datenbank-Einträge finden.';

				await interaction.followUp({
					content: 'Ich liste Dir nun alle Personen mit dem Abgelehnt-Status auf.',
					ephemeral: true
				});

				declinedString.match(/(.*\n){30}/g).forEach(string => {
					interaction.followUp({
						content: string,
						ephemeral: true
					});
				});

				break;
			}
			}
		}

		if (subcommandGroup === 'blacklisted') {
			switch (subcommand) {
			case 'remove': {
				const foundBlacklisted = await models.blacklisted.findOne({
					where: {
						discordId: user.id
					}
				});

				if (!foundBlacklisted) {
					return interaction.followUp({
						content: `Ich habe keinen Eintrag gefunden. Gesucht habe ich nach "${member.id}".`,
						ephemeral: true
					});
				}

				member.roles.remove([config.roles.blacklisted]);

				foundBlacklisted.destroy();

				interaction.followUp({
					content: `Ich habe ${user.toString()} den Blacklisted-Status entfernt.`,
					ephemeral: true
				});

				break;
			}

			case 'add': {
				try {
					await models.blacklisted.create({
						discordId: user.id,
						timestamp: moment().unix(),
					});
				}
				catch (error) {
					if (error.name === 'SequelizeUniqueConstraintError') {
						return interaction.followUp({
							content: 'Diese Person besitzt bereits den Blacklisted-Status.',
							ephemeral: true
						});
					}
				}

				member.roles.set([config.roles.status, config.roles.blacklisted]);

				interaction.followUp({
					content: `Ich habe ${user.toString()} den Blacklisted-Status hinzugefügt.`,
					ephemeral: true
				});

				break;
			}

			case 'list': {
				const blacklistedList = await models.blacklisted.findAll({
					attributes: ['discordId', 'timestamp'],
					raw: true
				});

				const blacklistedString = blacklistedList.map(found => `${Formatters.userMention(found.discordId)}, angelegt <t:${found.timestamp}:R>`).join('\n') || 'Ich kann keine Datenbank-Einträge finden.';

				await interaction.followUp({
					content: 'Ich liste Dir nun alle Blacklist-Einträge auf.',
					ephemeral: true
				});

				blacklistedString.match(/(.*\n*){5}/g).forEach(string => {
					interaction.followUp({
						content: string,
						ephemeral: true
					});
				});

				break;
			}
			}
		}

		if (subcommandGroup === 'users') {
			switch (subcommand) {
			case 'info': {
				const foundUser = await models.users.findOne({
					where: {
						discordId: user.id
					}
				});

				if (!foundUser) {
					return interaction.followUp({
						content: `Ich habe keinen Eintrag gefunden. Gesucht habe ich nach "${member.id}".`,
						ephemeral: true
					});
				}

				const embedBuilder = new EmbedBuilder()
					.setColor(0x57F287)
					.setAuthor({
						name: `Informationen über ${foundUser.firstname}`,
						iconURL: 'https://cdn.discordapp.com/emojis/968932942711783424.webp?size=96&quality=lossless'
					})
					.setDescription(`Ich habe Dir hier Informationen über ${user.toString()} zusammengetragen.`)
					.setFields({
						name: 'Angegebenes OOC-Alter',
						value: Formatters.inlineCode(foundUser.age),
						inline: true
					}, {
						name: 'Vorname',
						value: `${Formatters.inlineCode(foundUser.firstname)}`,
						inline: true
					}, {
						name: 'Nachname',
						value: `${Formatters.inlineCode(foundUser.lastname)}`,
						inline: true
					});

				interaction.followUp({
					embeds: [embedBuilder],
					ephemeral: true
				});

				break;
			}

			case 'list': {
				const usersList = await models.users.findAll({
					attributes: ['discordId', 'timestamp', 'firstname', 'lastname', 'age'],
					raw: true
				});

				const usersString = usersList.map(found => `${Formatters.userMention(found.discordId)}, angelegt <t:${found.timestamp}:R>`).join('\n') || 'Ich kann keine Datenbank-Einträge finden.';

				await interaction.followUp({
					content: 'Ich liste Dir nun alle Nutzer-Einträge auf.',
					ephemeral: true
				});

				usersString.match(/(.*\n){30}/g).forEach(string => {
					interaction.followUp({
						content: string,
						ephemeral: true
					});
				});

				break;
			}
			}
		}

		if (subcommandGroup === 'tickets') {
			switch (subcommand) {
			case 'remove': {
				const foundTicket = await models.tickets.findOne({
					where: {
						discordId: user.id
					}
				});

				if (!foundTicket) {
					return interaction.followUp({
						content: `Ich habe keinen Eintrag gefunden. Gesucht habe ich nach "${member.id}".`,
						ephemeral: true
					});
				}

				foundTicket.destroy();

				interaction.followUp({
					content: `Ich habe das Ticket von ${user.toString()} aus dem Model entfernt.`,
					ephemeral: true
				});

				break;
			}
			}
		}

		if (config.devBuild) {
			return await warnings.send(interaction, 'BUILD_TYPE', 'Since the active instance is an developer build, some database actions will not be saved or will be read incorrectly.');
		}
	}
};
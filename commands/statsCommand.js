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
		.setName('stats')
		.setDescription('Zeigt Dir aktuelle Statistiken rundum den Bot und das FIB.'),

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

		await interaction.deferReply({
			ephemeral: true
		});

		consola.info(`${new moment().format('DD.MM.YYYY HH:ss')} | ${interaction.user.tag} requested the statistics.`);

		const foundStat = await models.statistics.findOne({
			where: {
				statId: 'bot'
			}
		});

		if (!foundStat) return errors.send(interaction, 'DATABASE', 'There aren\'t any database entries');

		//  33 files, 3248 codes, 217 comments, 491 blanks, all 3956 lines

		const embedBuilder = new EmbedBuilder();

		embedBuilder
			.setColor(0x57F287)
			.setAuthor({
				name: 'Das Federal Investigation Bureau in Zahlen',
				iconURL: 'https://cdn.discordapp.com/emojis/982057260228411392.webp?size=96&quality=lossless'
			})
			.setDescription(`Hier findest Du Statistiken rundum die Bundesbehörde und deren Bewerbungsprozess.

\`\`\`
${foundStat.startsCount.toString()} Mal wurde der Bot gestartet
${foundStat.registeredCount.toString()} Nutzer sind in meiner Datenbank registriert

${foundStat.ticketCount.toString()} Mal wurde ein Ticket erstellt,
${foundStat.declinedCount.toString()} Tickets davon wurden abgelehnt,
${foundStat.acceptedCount.toString()} wurden angenommen,
${foundStat.acceptedTalk.toString()} haben das mündliche Gespräch bestanden,
${foundStat.blacklistedCount.toString()} haben einen Blacklist-Eintrag erhalten
12% der Bewerber werden durchschnittlich eingestellt

${foundStat.praisesCount.toString()} Lobe wurden geäußert
${foundStat.criticismsCount.toString()} Mal wurde Kritik geäußert

${foundStat.statCount.toString()} Mal wurde diese Übersicht aufgerufen

4.719 Zeilen Code benötigt es, damit dieser Bot funktioniert
\`\`\`

Der FIB Ticket Helper ist ein Projekt von <@272663056075456512> für das FIB auf LifeV, gemacht mit NodeJS, der nightmare API und gaaanz viel <a:heartlove:851171266650964008>.
   • <https://instagram.com/anklopfenbitte>
   • <https://twitter.com/wechseIgeld>
   • <https://snapchat.com/add/f.knz>

  Du hast irgendwelche Anregungen, Kritik, Probleme oder eine Frage? Schick dem Bot einfach eine DM! :sparkles:`);

		interaction.followUp({
			ephemeral: true,
			embeds: [embedBuilder]
		});

		foundStat.increment('statCount');

		// The logging webhook
		const theLoggingEmbed = new EmbedBuilder();

		theLoggingEmbed
			.setColor(0xEB459E)
			.setAuthor({
				name: 'Statistiken aufgerufen',
				iconURL: 'https://cdn.discordapp.com/emojis/982057260228411392.webp?size=96&quality=lossless'
			})
			.setDescription(`${interaction.user.toString()} hat sich <t:${moment().unix()}:R> die Statistiken aushändigen lassen.`)
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
			url: config.webhooks.statsWebhookUrl
		}).send({
			avatarURL: interaction.user.avatarURL({
				dynamic: true
			}),
			username: `${interaction.user.tag} | nightmare API`,
			embeds: [theLoggingEmbed]
		});
	},
};
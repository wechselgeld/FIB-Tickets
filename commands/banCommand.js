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
		.setName('ban')
		.setDescription('Sperrt einen Bewerber für den Bewerbungsprozess.')
		.addUserOption((option) =>
			option
				.setName('user')
				.setDescription(
					'Wähle den Bewerber aus, welchen Du sperren möchtest.'
				)
				.setRequired(true)
		)
		.addStringOption((option) =>
			option
				.setName('reason')
				.setDescription(
					'Tippe ein, weshalb Du den Bewerber sperren möchtest.'
				)
				.setRequired(true)
		),

	global: false,

	/**
	 *
	 * @param { CommandInteraction } interaction
	 */
	async execute(interaction) {
		const member = interaction.options.getMember('user');
		const user = interaction.options.getUser('user');
		const reason = interaction.options.getString('reason');

		const caseId = await randomstring.generate({
			length: 5,
			readable: true,
			charset: 'alphanumeric'
		}).toLowerCase();

		await interaction.deferReply();

		consola.info(`${new moment().format('DD.MM.YYYY HH:ss')} | ${interaction.user.tag} banned ${user.tag} because "${reason}".`);

		const embedBuilder = new EmbedBuilder();

		embedBuilder
			.setColor(0xED4245)
			.setAuthor({
				name: 'Du wurdest gesperrt',
				iconURL: 'https://cdn.discordapp.com/emojis/982410948730044416.webp?size=96&quality=lossless'
			})
			.setDescription(`Der Administrator ${interaction.user.toString()} hat Dich mit dem Grund "${reason}" vorerst permanent vom Bewerbungsportal des Federal Investigation Bureau auf LifeV geworfen.
            Die Sperre stellt keinen Blacklist-Eintrag dar, sondern dient nur als lokaler Ausschluss vom Bewerbungsverfahren.
            
            *Du kannst mir gern eine Nachricht senden, welche dann an die Recruiter weitergeleitet wird.*`)
			.setFields({
				name: 'Case-ID',
				value: `${Formatters.inlineCode(caseId)}`,
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

		await member.send({ embeds: [embedBuilder] }).catch(console.error('Konnte keine Nachricht an einen Nutzer senden.'));
		member.ban({ reason: `[${caseId}] www.fib.center/case?id=${caseId} | "${reason}", issued by ${interaction.member.nickname}` });

		embedBuilder
			.setColor(0xED4245)
			.setAuthor({
				name: 'Nutzer gesperrt',
				iconURL: 'https://cdn.discordapp.com/emojis/982410948730044416.webp?size=96&quality=lossless'
			})
			.setDescription(`Der Administrator ${interaction.user.toString()} hat ${user.toString()} mit dem Grund "${reason}" vorerst permanent vom Bewerbungsprozess ausgeschlossen.`)
			.setFields({
				name: 'Case-ID',
				value: `${Formatters.inlineCode(caseId)}`,
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

		interaction.followUp({
			embeds: [embedBuilder]
		});

		// The logging webhook
		const theLoggingEmbed = new EmbedBuilder();

		theLoggingEmbed
			.setColor(0xED4245)
			.setAuthor({
				name: 'Nutzer gesperrt',
				iconURL: 'https://cdn.discordapp.com/emojis/982410948730044416.webp?size=96&quality=lossless'
			})
			.setDescription(`${interaction.user.toString()} hat ${user.toString()} mit dem Grund "${reason}" vorerst permanent gesperrt.`)
			.setFields({
				name: 'Case-ID',
				value: `${Formatters.inlineCode(caseId)}`,
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
			url: config.webhooks.joinleaveWebhookUrl
		}).send({
			avatarURL: interaction.user.avatarURL({
				dynamic: true
			}),
			username: `${interaction.user.tag} | nightmare API`,
			embeds: [theLoggingEmbed]
		});
	},
};
const {
	GuildMember,
	PermissionsBitField,
	Message,
	EmbedBuilder,
	Formatters,
	WebhookClient
} = require('discord.js');
const consola = require('consola');
const moment = require('moment');
const models = require('../database/models');
const config = require('../config.json');
const {
	ChannelType
} = require('discord-api-types/v10');

module.exports = {
	name: 'messageCreate',
	once: false,

	/**
     *
     * @param { Message } message
     */
	async execute(message) {
		if (!(message.channel.type === ChannelType.DM)) return;

		if (message.author.id === message.client.user.id) return;

		message.reply({ content: 'Danke! Ich habe die Nachricht an unsere Recruiter weitergeleitet.' });

		// The logging webhook
		const theLoggingEmbed = new EmbedBuilder();

		theLoggingEmbed
			.setColor(0xEB459E)
			.setAuthor({
				name: 'Direktnachricht erhalten',
				iconURL: 'https://cdn.discordapp.com/emojis/970797439328092160.webp?size=96&quality=lossless'
			})
			.setDescription(`${message.author.toString()} hat mir <t:${moment().unix()}:R> eine Direktnachricht gesendet.
            ${Formatters.codeBlock(message.cleanContent)}`)
			.setFields({
				name: 'Message-ID',
				value: `${Formatters.inlineCode(message.id)}`,
				inline: true
			}, {
				name: 'Ray-ID',
				value: `${Formatters.inlineCode(moment().unix())}`,
				inline: true
			}, {
				name: 'User-ID',
				value: `[${Formatters.inlineCode(message.author.id)}](https://discordlookup.com/user/${message.author.id})`,
				inline: true
			});

		// Construct new WebhookClient and send the "created new ticket"-message
		new WebhookClient({
			url: config.webhooks.directMessageWebhookUrl
		}).send({
			avatarURL: message.author.avatarURL({
				dynamic: true
			}),
			username: `${message.author.tag} | nightmare API`,
			embeds: [theLoggingEmbed]
		});

		consola.info(`${new moment().format('DD.MM.YYYY HH:ss')} | Received a direct message from ${message.author.tag}.`);
	}
};
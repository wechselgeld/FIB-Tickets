const {
	ModalBuilder,
	ModalSubmitInteraction,
	ActionRowBuilder,
	TextInputBuilder,
	TextInputStyle,
	EmbedBuilder,
	Formatters,
	WebhookClient,
} = require('discord.js');
const consola = require('consola');
const moment = require('moment');
const randomstring = require('randomstring');
const config = require('../config.json');

module.exports = {
	data: {
		id: 'createAppointment@modal',
		builder: new ModalBuilder()
			.setCustomId('createAppointment@modal')
			.setTitle('Erstelle einen Gesprächs-Termin')
			.addComponents(
				new ActionRowBuilder().addComponents(
					new TextInputBuilder()
						.setCustomId('appointment-date')
						.setRequired(true)
						.setMaxLength(10)
						.setLabel('Datum der Sprechstunde (Heute angegeben)')
						.setStyle(TextInputStyle.Short)
						.setValue(moment().format('DD.MM.YYYY'))
						.setPlaceholder('z. B. "25.06.2005", ohne die Anführungszeichen')
				),
				new ActionRowBuilder().addComponents(
					new TextInputBuilder()
						.setCustomId('appointment-time')
						.setRequired(true)
						.setMaxLength(5)
						.setLabel('Zu welcher Uhrzeit findet der Termin statt?')
						.setStyle(TextInputStyle.Short)
						.setValue(moment().format('HH:mm'))
						.setPlaceholder('z. B. "11:11", ohne die Anführungszeichen')
				),
			),
	},

	/**
	 *
	 * @param { ModalSubmitInteraction } interaction
	 */
	async execute(interaction) {
		const date = interaction.fields.getTextInputValue('appointment-date');
		const time = interaction.fields.getTextInputValue('appointment-time');
		const appointmentId = randomstring.generate({
			length: 5,
			readable: true,
			charset: 'alphanumeric'
		}).toLowerCase();

		await interaction.deferReply({
			ephemeral: true
		});

		consola.info(`${new moment().format('DD.MM.YYYY HH:ss')} | ${interaction.user.tag} created a appointment of the type "talk", starting at ${date}, ${time}`);

		const appointmentsChannel = await interaction.client.channels.fetch(config.channels.appointmentsChannelId);

		const embedBuilder = new EmbedBuilder();

		embedBuilder
			.setColor(0xFEE75C)
			.setAuthor({
				name: 'Sprechstunde',
				iconURL: 'https://cdn.discordapp.com/emojis/983480238849814568.webp?size=96&quality=lossless'
			})
			.setDescription(`Hallo Bewerber,
			am ${date}, um ${time} Uhr findet die nächste Sprechstunde statt.
			
			Bei diesem Termin haben unsere Recruiter die Möglichkeit, sich ein besseres Bild über Euch gestalten und die letzten Eindrücke sammeln zu können. Dementsprechend solltet Ihr pünktlich und angemessen gekleidet erscheinen.
			
			Findet Euch — wenn Ihr an dem Termin sicher teilnehmen könnt — an der Privatgarage neben dem FIB Headquater ein, bei welcher Ihr dann von unseren Recruitern abgeholt werdet.
			
			Bitte reagiert mit dem <:bep_ok_white:983367161038909482>-Emoji, wenn Ihr zu diesem Termin sicher erscheinen könnt. Solltet Ihr nicht erscheinen können oder Ihr seid Euch nicht sicher, dann reagiert bitte mit dem <:bep_close_white:965950909463011339>-Emoji.
			
			*Die Recruiter behalten sich vor, nachträglich alle Bewerber abzulehnen, welche nach einer gewissen Zeitspanne nicht auf diese Nachricht reagiert haben.*`);

		const message = await appointmentsChannel.send({
			content: `${Formatters.roleMention(config.roles.accepted)} ${Formatters.roleMention(config.roles.recruiter)}`,
			embeds: [embedBuilder]
		});

		message.react('983367161038909482');
		message.react('965950909463011339');
		message.react('965951487924650024');

		interaction.followUp({
			content: `Ich habe den Termin für den ${date}, um ${time} Uhr angesetzt.`,
			ephemeral: true
		});

		// The logging webhook
		const theLoggingEmbed = new EmbedBuilder();

		theLoggingEmbed
			.setColor(0x57F287)
			.setAuthor({
				name: 'Gespräch angekündigt',
				iconURL: 'https://cdn.discordapp.com/emojis/983480238849814568.webp?size=96&quality=lossless'
			})
			.setDescription(`${interaction.user.toString()} hat <t:${moment().unix()}:R> ein Gespräch für den ${date}, um ${time} angekündigt.`)
			.setFields({
				name: 'Appointment-ID',
				value: `${Formatters.inlineCode(appointmentId)}`,
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
			url: config.webhooks.appointmentsWebhookUrl,
		}).send({
			avatarURL: interaction.user.avatarURL({
				dynamic: false
			}),
			username: `${interaction.user.tag} | nightmare API`,
			embeds: [theLoggingEmbed]
		});
	},
};
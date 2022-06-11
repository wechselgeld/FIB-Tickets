const {
	ModalBuilder,
	ActionRowBuilder,
	TextInputBuilder,
	TextInputStyle,
	WebhookClient,
	EmbedBuilder,
	Formatters,
	Util
} = require('discord.js');
const config = require('../config.json');
const consola = require('consola');
const moment = require('moment');
const randomstring = require('randomstring');
const models = require('../database/models');

module.exports = {
	data: {
		id: 'expressCriticism@modal',
		builder: new ModalBuilder()
			.setCustomId('expressCriticism@modal')
			.setTitle('Kritik über einen Agent äußern')
			.addComponents(
				new ActionRowBuilder().addComponents(
					new TextInputBuilder()
						.setCustomId('ic-servicenumber')
						.setRequired(true)
						.setMaxLength(2)
						.setLabel('Wie lautet die Dienstnummer des Agents?')
						.setStyle(TextInputStyle.Short)
						.setPlaceholder('z. B. "39", ohne die Anführungszeichen'),
				),

				new ActionRowBuilder().addComponents(
					new TextInputBuilder()
						.setCustomId('ic-whathappened')
						.setRequired(true)
						.setMinLength(50)
						.setLabel('Was ist vorgefallen?')
						.setStyle(TextInputStyle.Paragraph)
						.setPlaceholder('Gib an, warum Du die Kritik schreibst.')
				),
			),
	},

	/**
     *
     * @param { ModalSubmitInteraction } interaction
     */
	async execute(interaction) {
		const servicenumber = interaction.fields.getTextInputValue('ic-servicenumber');
		const whathappened = interaction.fields.getTextInputValue('ic-whathappened');
		const criticismId = randomstring.generate({
			length: 5,
			readable: true,
			charset: 'alphanumeric'
		}).toLowerCase();

		await interaction.deferReply({
			ephemeral: true
		});

		consola.info(`${new moment().format('DD.MM.YYYY HH:ss')} | ${interaction.user.tag} wrote a critic.`);

		if (isNaN(servicenumber)) {
			return interaction.followUp({
				content: 'Du hast eine falsche Dienstnummer angegeben. Die Dienstnummern des Federal Investigation Bureau sind normalerweise zweistellig und bestehen ausschließlich aus Zahlen.',
				ephemeral: true
			});
		}

		// The logging webhook
		const embedBuilder = new EmbedBuilder();

		embedBuilder
			.setColor(0xED4245)
			.setAuthor({
				name: `Kritik über die Dienstnummer ${servicenumber}`,
				iconURL: 'https://cdn.discordapp.com/emojis/968932942661431296.webp?size=96&quality=lossless'
			})
			.setDescription(`${interaction.user.toString()} hat <t:${Math.floor(moment().unix())}:R> Kritik über unsere Dienstnummer ${servicenumber} geäußert.
            ${Formatters.codeBlock(Util.cleanContent(whathappened))}`)
			.setFields({
				name: 'Kritik-ID',
				value: `${Formatters.inlineCode(criticismId)}`,
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
			url: config.webhooks.praiseAndCriticismWebhookUrl,
		}).send({
			avatarURL: interaction.user.avatarURL({
				dynamic: false
			}),
			username: `${interaction.user.tag} | nightmare API`,
			embeds: [embedBuilder]
		});

		interaction.followUp({
			content: `Danke! Deine Kritik wurde an unsere Recruiter weitergeleitet.\nDeine Kritik-ID lautet ${Formatters.inlineCode(criticismId)}, welche Du bei einer weiteren Rücksprache mit einem Recruiter bereithalten solltest.`,
			ephemeral: true
		});

		const foundStat = await models.statistics.findOne({ where: { statId: 'bot' } });

		if (foundStat) {
			foundStat.increment('criticismsCount');
		}
	},
};
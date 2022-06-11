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
		id: 'expressPraise@modal',
		builder: new ModalBuilder()
			.setCustomId('expressPraise@modal')
			.setTitle('Lob über einen Agent äußern')
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
						.setPlaceholder('Gib an, warum Du das Lob schreibst.')
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
		const praiseId = randomstring.generate({
			length: 5,
			readable: true,
			charset: 'alphanumeric'
		}).toLowerCase();

		await interaction.deferReply({
			ephemeral: true
		});

		consola.info(`${new moment().format('DD.MM.YYYY HH:ss')} | ${interaction.user.tag} praised someone.`);

		if (isNaN(servicenumber)) {
			return interaction.followUp({
				content: 'Du hast eine falsche Dienstnummer angegeben. Die Dienstnummern des Federal Investigation Bureau sind normalerweise zweistellig und bestehen ausschließlich aus Zahlen.',
				ephemeral: true
			});
		}

		// The logging webhook
		const embedBuilder = new EmbedBuilder();

		embedBuilder
			.setColor(0x57F287)
			.setAuthor({
				name: `Lob über die Dienstnummer ${servicenumber}`,
				iconURL: 'https://cdn.discordapp.com/emojis/968932942711783424.webp?size=96&quality=lossless'
			})
			.setDescription(`${interaction.user.toString()} hat <t:${Math.floor(moment().unix())}:R> ein Lob über unsere Dienstnummer ${servicenumber} geäußert.
            ${Formatters.codeBlock(Util.cleanContent(whathappened))}`)
			.setFields({
				name: 'Lob-ID',
				value: `${Formatters.inlineCode(praiseId)}`,
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
			content: `Danke! Das Lob wurde an unsere Recruiter weitergeleitet.\nDeine Lob-ID lautet ${Formatters.inlineCode(praiseId)}, welche Du bei einer weiteren Rücksprache mit einem Recruiter bereithalten solltest.`,
			ephemeral: true
		});

		const foundStat = await models.statistics.findOne({ where: { statId: 'bot' } });

		if (foundStat) {
			foundStat.increment('praisesCount');
		}
	},
};
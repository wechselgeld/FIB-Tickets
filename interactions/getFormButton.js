const {
	ActionRowBuilder,
	EmbedBuilder
} = require('@discordjs/builders');
const {
	ButtonStyle,
	ButtonBuilder,
} = require('discord.js');
const models = require('../database/models');
const errors = require('../utility/errors');
const config = require('../config.json');
const closeTicketButton = require('./closeTicketButton');
const recruiterPanelButton = require('./recruiterPanelButton');
const startFormButton = require('./startFormButton');

module.exports = {
	data: {
		id: 'getForm',
		builder: new ButtonBuilder()
			.setCustomId('getForm')
			.setLabel('Formular anfordern')
			.setEmoji({
				id: '970483023512477778'
			})
			.setStyle(ButtonStyle.Success),
	},

	/**
     *
     * @param { ButtonInteraction } interaction
     */
	async execute(interaction) {
		if (config.devBuild && !config.devAccess.includes(interaction.user.id)) {
			return await errors.send(interaction, 'BUILD_TYPE', 'Since the active instance is an developer build, some actions can\'t be performed. Please try again later.');
		}

		const firstMessageRow = new ActionRowBuilder()
			.addComponents(new ButtonBuilder()
				.setCustomId('ns-getForm')
				.setLabel('Formular anfordern')
				.setEmoji({
					id: '970483023512477778'
				})
				.setStyle(ButtonStyle.Success)
				.setDisabled(true),

			closeTicketButton.data.builder,
			recruiterPanelButton.data.builder
			);

		interaction.message.edit({
			components: [firstMessageRow]
		});

		const foundTicket = await models.tickets.findOne({
			where: {
				channelId: interaction.channel.id
			}
		});

		if ((!foundTicket) || foundTicket.discordId === null) return errors.send(interaction, 'database', 'NO DATABASE ENTRY FOUND');

		const ticketOwner = await interaction.guild.members.fetch(foundTicket.discordId);

		const firstname = ticketOwner.nickname.split(' ')[0] || ticketOwner.user.username;

		const embedBuilder = new EmbedBuilder();

		embedBuilder
			.setColor(0xEB459E)
			.setAuthor({
				name: 'Dein Eignungstest beim Federal Investigation Bureau',
				iconURL: 'https://cdn.discordapp.com/emojis/970483023512477778.webp?size=96&quality=lossless'
			})
			.setDescription(`Hallo ${firstname},
            wir freuen uns, dass Du den Eignungstest f??r den Dienst als Federal Agent absolvieren m??chtest. Dieser Test beinhaltet allgemeine Fragen zum Dienst in Staatsbeh??rden, fragt Deine allgemeine Kompetenz ab und beurteilt Deine Eignung f??r eine Staatsbeh??rde.
            Wie bereits beschrieben, solltest Du f??r diesen Test rund 15 Minuten einplanen. Lies Dir nun bitte ??u??erst aufmerksam die folgenden Informationen durch.`)
			.addFields({
				name: 'Fragentypen',
				value: 'Wir stellen Dir in unserem Eignungstest sowohl OOC- als auch IC-Fragen. Rechts in der "Embed"-Nachricht findest Du ein gelbes Bild, welches den Fragentyp aufschl??sseln soll.',
				inline: false
			}, {
				name: 'Zeitfenster zum Antworten',
				value: 'Beachte unbedingt, dass Du nur ein bestimmtes Zeitfenster zur Verf??gung hast, um eine Frage zu beantworten. Schaffst Du das in dieser Zeit nicht, so wird der Eignungstest abgebrochen und Du musst ihn erneut ausf??llen.',
				inline: false
			}, {
				name: 'Achte auf die Tasten, die Du dr??ckst',
				value: 'Einmal abgesendet ist abgesendet. Das hei??t, dass Du nur eine Nachricht zur Verf??gung hast, um auf eine Frage zu antworten.',
				inline: false
			}, {
				name: 'Achte auf Deine Schreibweise',
				value: 'Antworte pr??zise, aber dennoch kurz. Versuche bitte in S??tzen zu antworten und achte auf Deine Rechtschreibung.',
				inline: false
			}, {
				name: 'Akteneintr??ge',
				value: 'Mach Dich vorher ??ber Deine Akteneintr??ge beim Police Department schlau.'
			}, {
				name: 'Antwortbeispiele',
				value: 'Wenn Du Mal nicht weiter wei??t, dann suche in der "Embed"-Nachricht nach dem <:bep_question_white:970492077836210196>-Emoji. Dieser Zeit Dir einen Antwortvorschlag, welchem Schema zu folgen kannst, wenn Du nicht weiter wei??t.'
			}, {
				name: '??nderung des Nachrichteninhaltes',
				value: 'Wie oben bereits beschrieben, ist abgesendet nun mal abgesendet. Du kannst den Nachrichteninhalt sp??ter nicht mehr bearbeiten!'
			});

		const formRow = new ActionRowBuilder()
			.addComponents(startFormButton.data.builder);

		interaction.reply({
			embeds: [embedBuilder],
			components: [formRow]
		});
	},
};
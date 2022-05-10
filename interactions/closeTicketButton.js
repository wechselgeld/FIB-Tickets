const {
	ActionRowBuilder,
	EmbedBuilder
} = require('@discordjs/builders');
const {
	ButtonStyle,
	ButtonBuilder,
	WebhookClient,
	Formatters,
	ButtonInteraction
} = require('discord.js');
const moment = require('moment');
const config = require('../config.json');
const models = require('../database/models');

const talkedRecently = new Set();

module.exports = {
	data: {
		id: 'closeTicket',
		builder: new ButtonBuilder()
			.setCustomId('closeTicket')
			.setLabel('Ticket löschen')
			.setEmoji({
				id: '965950909463011339'
			})
			.setStyle(ButtonStyle.Danger),
	},

	/**
     *
     * @param { ButtonInteraction } interaction
     */
	async execute(interaction) {
		const channelId = interaction.channel.id;

		if (talkedRecently.has(channelId)) {
			return interaction.reply({
				content: 'Bitte warte 30 Sekunden, bis Du den Befehl erneut benutzen kannst.',
				ephemeral: true
			});
		}
		else {
			talkedRecently.add(channelId);
			setTimeout(() => {
				talkedRecently.delete(channelId);
			}, 30000);
		}

		const row = new ActionRowBuilder()
			.addComponents(
				new ButtonBuilder()
					.setCustomId('confirmClose')
					.setLabel('Löschung bestätigen')
					.setStyle(ButtonStyle.Danger),
				new ButtonBuilder()
					.setCustomId('abortClose')
					.setLabel('Aktion abbrechen')
					.setStyle(ButtonStyle.Secondary)
			);

		await interaction.reply({
			content: 'Bist Du Dir sicher, dass Du das Ticket schließen möchtest?',
			components: [row],
			ephemeral: true
		});

		const foundTicket = await models.tickets.findOne({
			where: {
				channelId: interaction.channel.id
			}
		});

		const filter = (collected) => collected.customId === 'confirmClose' || collected.customId === 'abortClose';
		const collector = interaction.channel.createMessageComponentCollector({
			filter,
			time: 15000
		});

		collector.on('collect', async (collected) => {
			if (!collected.user.id === interaction.user.id) {
				return collected.reply({
					content: 'Du kannst diese Knöpfe nicht betätigen, da Du die Interaktion nicht ausgelöst hast.',
					ephemeral: true
				});
			}

			if (collected.customId === 'confirmClose') {
				collector.stop();

				interaction.editReply({
					content: 'Alles klar, das Ticket wird geschlossen.',
					components: [],
					ephemeral: true
				});

				const embedBuilder = new EmbedBuilder();

				embedBuilder
					.setColor(0xED4245)
					.setAuthor({
						name: 'Das Ticket wird endgültig gelöscht',
						iconURL: 'https://cdn.discordapp.com/emojis/972559448998543390.webp?size=96&quality=lossless'
					})
					.setDescription(`Das Ticket wird in 15 Sekunden gelöscht, da ${collected.user.toString()} die Löschung bestätigt hat. Alle Nachrichten werden anschließend archiviert.`)
					.setFooter({ text: `Copyright © 2022 newa.media — Alle Rechte vorbehalten\nAngefordert von ${interaction.member.nickname}`, iconURL: interaction.user.displayAvatarURL({ extension: 'png', size: 64 }).toString() });

				await collected.channel.send({
					embeds: [embedBuilder]
				});

				setTimeout(async () => {
					const theLoggingEmbed = new EmbedBuilder();

					theLoggingEmbed
						.setColor(0xED4245)
						.setAuthor({
							name: 'Ticket gelöscht',
							iconURL: 'https://cdn.discordapp.com/emojis/972559448998543390.webp?size=96&quality=lossless'
						})
						.setDescription(`${collected.user.toString()} hat <t:${moment().unix()}:R> das Ticket von ${Formatters.userMention(foundTicket.discordId)} gelöscht.`)
						.setFields({
							name: 'Ticket-ID',
							value: `[${Formatters.inlineCode(foundTicket.ticketId)}](${collected.channel.url})`,
							inline: true
						}, {
							name: 'Ray-ID',
							value: `${Formatters.inlineCode(moment().unix())}`,
							inline: true
						}, {
							name: 'User-ID',
							value: `[${Formatters.inlineCode(collected.user.id)}](https://discordlookup.com/user/${collected.user.id})`,
							inline: true
						});

					// Construct new WebhookClient and send the "created new ticket"-message
					new WebhookClient({
						url: config.webhooks.ticketWebhookUrl
					}).send({
						avatarURL: collected.user.avatarURL({
							dynamic: true
						}),
						username: `${collected.user.tag} | nightmare API`,
						embeds: [theLoggingEmbed]
					});

					collected.channel.delete();

					foundTicket.destroy();
				}, 15000);
			}

			if (collected.customId == 'abortClose') {
				interaction.editReply({
					content: 'Alles klar, das Ticket wird nicht geschlossen.',
					components: [],
					ephemeral: true
				});
			}
		});

		collector.on('end', collected => {
			if (collected.size < 1) {
				interaction.editReply({
					content: 'Die Löschung wurde abgebrochen, da die Zeit abgelaufen ist.',
					components: []
				});
			}
		});
	},
};
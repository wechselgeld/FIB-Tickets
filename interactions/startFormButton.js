const {
	SelectMenuOptionBuilder
} = require('@discordjs/builders');
const {
	ActionRowBuilder,
	EmbedBuilder
} = require('@discordjs/builders');
const {
	PermissionsBitField
} = require('discord.js');
const {
	SelectMenuBuilder
} = require('discord.js');
const {
	ButtonStyle,
	ButtonBuilder,
	Formatters
} = require('discord.js');
const moment = require('moment');
const config = require('../config.json');
const errors = require('../utility/errors');
const models = require('../database/models');

const talkedRecently = new Set();

module.exports = {
	data: {
		id: 'startForm',
		builder: new ButtonBuilder()
			.setCustomId('startForm')
			.setLabel('Eignungstest starten')
			.setEmoji({
				id: '971104113368653894'
			})
			.setStyle(ButtonStyle.Success),
	},

	/**
     *
     * @param { ButtonInteraction } interaction
     */
	async execute(interaction) {
		if (talkedRecently.has(interaction.user.id)) {
			return interaction.reply({
				content: 'Du erledigst derzeit schon den Eignungstest.',
				ephemeral: true
			});
		}

		talkedRecently.add(interaction.user.id);

		const foundTicket = await models.tickets.findOne({
			where: {
				channelId: interaction.channel.id
			}
		});

		if ((!foundTicket) || foundTicket.discordId === null) return errors.send(interaction, 'database', 'NO DATABASE ENTRY FOUND');

		if (!(foundTicket.discordId === interaction.user.id)) {
			return interaction.reply({
				content: 'Dieses Ticket gehört nicht Dir.',
				ephemeral: true
			});
		}

		const embedBuilder = new EmbedBuilder();

		embedBuilder
			.setColor(0xEB459E)
			.setAuthor({
				name: 'Los geht\'s',
				iconURL: 'https://cdn.discordapp.com/emojis/970483023512477778.webp?size=96&quality=lossless'
			})
			.setDescription('Ich stelle Dir nun die Fragen. Achte rechts auf den Fragentyp, damit Du möglichst akkurat unsere Anforderungen erfüllst.')
			.setFooter({
				text: 'Hier findest Du Tipps oder Vorschläge.',
				iconURL: 'https://cdn.discordapp.com/emojis/970492077836210196.webp?size=96&quality=lossless'
			})
			.setThumbnail('https://i.ibb.co/hYZCsF1/questions-type-yellow.png');

		await interaction.reply({
			embeds: [embedBuilder]
		});

		/**
         * QUESTION START
         */

		setTimeout(async function() {
			let doNext = true;
			const answers = [];

			const oocPictureUrl = 'https://i.ibb.co/9tpZcLP/questions-ooc-yellow.png';
			const icPictureUrl = 'https://i.ibb.co/MNSfYVj/questions-ic-yellow.png';

			/*
             * Frage 1
             */

			embedBuilder
				.setAuthor({
					name: 'Wähle aus',
					iconURL: 'https://cdn.discordapp.com/emojis/972606598763667496.webp?size=96&quality=lossless'
				})
				.setDescription('Was erledigst Du außerhalb vom Roleplay?')
				.setFooter({
					text: 'Für diese Frage hast Du 60 Sekunden Zeit. Wenn Du weder arbeitest oder zur Schule gehst, kannst Du "Ich befinde mich in einer Orientierungsphase" auswählen.',
					iconURL: 'https://cdn.discordapp.com/emojis/970492077836210196.webp?size=96&quality=lossless'
				})
				.setThumbnail(oocPictureUrl);

			await interaction.channel.send({
				embeds: [embedBuilder],
				components: [new ActionRowBuilder()
					.addComponents(
						new SelectMenuBuilder()
							.setCustomId('school-work-notany')
							.setPlaceholder('WÄHLE AUS')
							.addOptions(
								new SelectMenuOptionBuilder()
									.setLabel('Ich gehe zur Schule')
									.setValue('school')
									.setDescription('Ich bin Schüler oder besuche die Berufsschule.')
									.setEmoji({
										id: '970490903456268338'
									}),

								new SelectMenuOptionBuilder()
									.setLabel('Ich gehe regelmäßig arbeiten')
									.setValue('work')
									.setDescription('Das heißt, ich habe einen festen Arbeitsplatz und bin Vollzeit angestellt.')
									.setEmoji({
										id: '970491136026218567'
									}),

								new SelectMenuOptionBuilder()
									.setLabel('Ich befinde mich in einer Orientierungsphase')
									.setValue('notany')
									.setDescription('Ich erledige nichts von den beiden anderen Möglichkeiten.')
									.setEmoji({
										id: '970492077836210196'
									})
							),
					)
				]
			});

			const filter1 = (collected) => collected.customId === 'school-work-notany' && collected.user.id === interaction.user.id;
			await interaction.channel.awaitMessageComponent({
				filter1,
				time: 60000
			})
				.then(selectmenu => {
					switch (selectmenu.values[0]) {
					case 'school':
						answers.push('Was der Bewerber außerhalb des Roleplays erledigt // Der Bewerber geht noch zur Schule');
						break;
					case 'work':
						answers.push('Was der Bewerber außerhalb des Roleplays erledigt // Der Bewerber geht Vollzeit arbeiten');
						break;
					case 'notany':
						answers.push('Was der Bewerber außerhalb des Roleplays erledigt // Der Bewerber befindet sich in einer Orientierungsphase');
						break;
					}
				})
				.catch(() => {
					interaction.followUp({
						content: 'Der Eignungstest wurde abgebrochen, da keine Antwort nach der angegebenen Zeit erfolgte. Du kannst jederzeit in der obigen Nachricht einen neuen Eignungstest anfordern.'
					});

					talkedRecently.delete(interaction.user.id);
					doNext = false;
				});

			/*
             * Frage 2
             */

			if (!doNext) return;
			embedBuilder
				.setAuthor({
					name: 'Wähle aus',
					iconURL: 'https://cdn.discordapp.com/emojis/972606598763667496.webp?size=96&quality=lossless'
				})
				.setDescription('Wann bist Du auf LifeV eingereist?')
				.setFooter({
					text: 'Für diese Frage hast Du 60 Sekunden Zeit. Gib die Zeit in etwa an, nicht haargenau.',
					iconURL: 'https://cdn.discordapp.com/emojis/970492077836210196.webp?size=96&quality=lossless'
				})
				.setThumbnail(oocPictureUrl);

			await interaction.channel.send({
				embeds: [embedBuilder],
				components: [new ActionRowBuilder()
					.addComponents(
						new SelectMenuBuilder()
							.setCustomId('joined')
							.setPlaceholder('WÄHLE AUS')
							.addOptions(
								new SelectMenuOptionBuilder()
									.setLabel('Vor wenigen Tagen oder vor weniger als zwei Wochen')
									.setValue('beforefourteendays')
									.setDescription('Ob heute, gestern oder vor 14 Tagen - wähle diese Option aus.')
									.setEmoji({
										id: '972621313334198352'
									}),

								new SelectMenuOptionBuilder()
									.setLabel('Vor mehr als 14 Tagen')
									.setValue('morethanfourteendays')
									.setDescription('Wenn Du vor mehr als 14 Tagen eingereist bist.')
									.setEmoji({
										id: '972618765349056552'
									}),

								new SelectMenuOptionBuilder()
									.setLabel('Vor (mehreren) Monaten')
									.setValue('morethanamonth')
									.setDescription('Wenn Du schon einen oder mehrere Monate eingereist bist.')
									.setEmoji({
										id: '972621313384538122'
									})
							),
					)
				]
			});

			const filter2 = (collected) => collected.customId === 'joined' && collected.user.id === interaction.user.id;
			await interaction.channel.awaitMessageComponent({
				filter2,
				time: 60000
			})
				.then(selectmenu => {
					switch (selectmenu.values[0]) {
					case 'beforefourteendays':
						answers.push('Wann der Bewerber eingereist ist // Der Bewerber ist vor weniger als zwei Wochen eingereist');
						break;
					case 'morethanfourteendays':
						answers.push('Wann der Bewerber eingereist ist // Der Bewerber ist vor mehr als zwei Wochen eingereist');
						break;
					case 'morethanamonth':
						answers.push('Wann der Bewerber eingereist ist // Der Bewerber ist vor mehreren Monaten eingereist');
						break;
					}
				})
				.catch(() => {
					interaction.followUp({
						content: 'Der Eignungstest wurde abgebrochen, da keine Antwort nach der angegebenen Zeit erfolgte. Du kannst jederzeit in der obigen Nachricht einen neuen Eignungstest anfordern.'
					});

					talkedRecently.delete(interaction.user.id);
					doNext = false;
				});

			/*
             * Frage 5
             */

			if (!doNext) return;
			embedBuilder
				.setAuthor({
					name: 'Wähle aus',
					iconURL: 'https://cdn.discordapp.com/emojis/972606598763667496.webp?size=96&quality=lossless'
				})
				.setDescription('Wie viel Dienstzeit kannst Du pro Woche in etwa aufbringen?')
				.setFooter({
					text: 'Für diese Frage hast Du 60 Sekunden Zeit. Wenn Du weder arbeitest oder zur Schule gehst, kannst Du "Ich befinde mich in einer Orientierungsphase" auswählen.',
					iconURL: 'https://cdn.discordapp.com/emojis/970492077836210196.webp?size=96&quality=lossless'
				})
				.setThumbnail(oocPictureUrl);

			await interaction.channel.send({
				embeds: [embedBuilder],
				components: [new ActionRowBuilder()
					.addComponents(
						new SelectMenuBuilder()
							.setCustomId('time')
							.setPlaceholder('WÄHLE AUS')
							.addOptions(
								new SelectMenuOptionBuilder()
									.setLabel('Weniger als 10 Stunden')
									.setValue('lessthantenhours')
									.setDescription('Ob heute, gestern oder vor 14 Tagen - wähle diese Option aus.')
									.setEmoji({
										id: '972632161637269504'
									}),

								new SelectMenuOptionBuilder()
									.setLabel('Zwischen 10 und 20 Stunden')
									.setValue('betweentenandtwentyhours')
									.setDescription('Wenn Du vor mehr als 14 Tagen eingereist bist.')
									.setEmoji({
										id: '972632161494663189'
									}),

								new SelectMenuOptionBuilder()
									.setLabel('Über 20 Stunden')
									.setValue('morethantwentyhours')
									.setDescription('Wenn Du schon einen oder mehrere Monate eingereist bist.')
									.setEmoji({
										id: '972632161897304134'
									})
							),
					)
				]
			});

			const filter5 = (collected) => collected.customId === 'time' && collected.user.id === interaction.user.id;
			await interaction.channel.awaitMessageComponent({
				filter5,
				time: 60000
			})
				.then(selectmenu => {
					switch (selectmenu.values[0]) {
					case 'lessthantenhours':
						answers.push('Wie viel Dienstzeit der Bewerber aufbringen kann // Der Bewerber kann weniger als 10 Stunden pro Woche Zeit aufbringen');
						break;
					case 'betweentenandtwentyhours':
						answers.push('Wie viel Dienstzeit der Bewerber aufbringen kann // Der Bewerber kann zwischen 10 und 20 Stunden pro Woche Zeit aufbringen');
						break;
					case 'morethantwentyhours':
						answers.push('Wie viel Dienstzeit der Bewerber aufbringen kann // Der Bewerber kann mehr als 20 Stunden pro Woche Zeit aufbringen');
						break;
					}
				})
				.catch(() => {
					interaction.followUp({
						content: 'Der Eignungstest wurde abgebrochen, da keine Antwort nach der angegebenen Zeit erfolgte. Du kannst jederzeit in der obigen Nachricht einen neuen Eignungstest anfordern.'
					});

					talkedRecently.delete(interaction.user.id);
					doNext = false;
				});

			/*
             * Frage 3
             */

			interaction.channel.edit({
				permissionOverwrites: [{
					id: interaction.user.id,
					allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages]
				},
				{
					id: config.roles.ticketAccess,
					allow: [PermissionsBitField.Flags.ViewChannel]
				},
				{
					id: interaction.guild.roles.everyone.id,
					deny: [PermissionsBitField.Flags.ViewChannel]
				}
				]
			});

			if (!doNext) return;
			embedBuilder
				.setAuthor({
					name: 'Schreib uns die Antwort',
					iconURL: 'https://cdn.discordapp.com/emojis/971104113368653894.webp?size=96&quality=lossless'
				})
				.setDescription('Bist Du bereits straffällig geworden? Wenn ja, wie lang ist Dein letzter Akteneintrag her?')
				.setFooter({
					text: 'Für diese Frage hast Du zwei Minuten Zeit. Wenn Du noch nicht Straffällig geworden bist, antworte mit "Noch nicht Straffällig gewesen".',
					iconURL: 'https://cdn.discordapp.com/emojis/970492077836210196.webp?size=96&quality=lossless'
				})
				.setThumbnail(icPictureUrl);

			await interaction.channel.send({
				embeds: [embedBuilder]
			});

			const filter3 = filtered => (filtered.author.id === interaction.user.id);
			await interaction.channel.awaitMessages({
				filter3,
				max: 1,
				time: 120000,
				errors: ['time']
			})
				.then(collected => {
					answers.push(`Straffälligkeit und Akteneinträge // "${collected.first().content}"`);
				})
				.catch(() => {
					interaction.followUp({
						content: 'Der Eignungstest wurde abgebrochen, da keine Antwort nach der angegebenen Zeit erfolgte. Du kannst jederzeit in der obigen Nachricht einen neuen Eignungstest anfordern.'
					});

					talkedRecently.delete(interaction.user.id);
					doNext = false;
				});

			/*
             * Frage 4
             */

			if (!doNext) return;
			embedBuilder
				.setAuthor({
					name: 'Schreib uns die Antwort',
					iconURL: 'https://cdn.discordapp.com/emojis/971104113368653894.webp?size=96&quality=lossless'
				})
				.setDescription('Hast Du bereits Erfahrung in staatlichen Behörden? Wenn ja, kannst Du uns die Behörden und den jeweiligen Rang in dieser Behörde auflisten?')
				.setFooter({
					text: 'Für diese Frage hast Du fünf Minuten Zeit. Wenn Du noch keine Erfahrung gesammelt hast, sag das auch so.',
					iconURL: 'https://cdn.discordapp.com/emojis/970492077836210196.webp?size=96&quality=lossless'
				})
				.setThumbnail(icPictureUrl);

			await interaction.channel.send({
				embeds: [embedBuilder]
			});

			const filter4 = filtered => (filtered.author.id === interaction.user.id);
			await interaction.channel.awaitMessages({
				filter4,
				max: 1,
				time: 300000,
				errors: ['time']
			})
				.then(collected => {
					answers.push(`Erfahrung in anderen Behörden // "${collected.first().content}"`);
				})
				.catch(() => {
					interaction.followUp({
						content: 'Der Eignungstest wurde abgebrochen, da keine Antwort nach der angegebenen Zeit erfolgte. Du kannst jederzeit in der obigen Nachricht einen neuen Eignungstest anfordern.'
					});

					talkedRecently.delete(interaction.user.id);
					doNext = false;
				});

			/*
             * Frage 6
             */

			if (!doNext) return;
			embedBuilder
				.setAuthor({
					name: 'Schreib uns die Antwort',
					iconURL: 'https://cdn.discordapp.com/emojis/971104113368653894.webp?size=96&quality=lossless'
				})
				.setDescription('Warum möchtest Du Agent werden?')
				.setFooter({
					text: 'Für diese Frage hast Du fünf Minuten Zeit. Antworte in Sätzen und zeige uns Deine Motivation mit mindestens 100 Zeichen.',
					iconURL: 'https://cdn.discordapp.com/emojis/970492077836210196.webp?size=96&quality=lossless'
				})
				.setThumbnail(icPictureUrl);

			await interaction.channel.send({
				embeds: [embedBuilder]
			});

			const filter6 = filtered => (filtered.author.id === interaction.user.id);
			await interaction.channel.awaitMessages({
				filter6,
				max: 1,
				time: 300000,
				errors: ['time']
			})
				.then(collected => {
					if (collected.first().content.length >= 1000) {
						answers.push(`Motivation für die Bewerbung // "${collected.first().content.substring(0, 1000) + '...'}"`);
					}
					else {
						answers.push(`Motivation für die Bewerbung // "${collected.first().content}"`);
					}
				})
				.catch(() => {
					interaction.followUp({
						content: 'Der Eignungstest wurde abgebrochen, da keine Antwort nach der angegebenen Zeit erfolgte. Du kannst jederzeit in der obigen Nachricht einen neuen Eignungstest anfordern.'
					});

					talkedRecently.delete(interaction.user.id);
					doNext = false;
				});

			/*
             * Frage 7
             */

			if (!doNext) return;
			embedBuilder
				.setAuthor({
					name: 'Schreib uns die Antwort',
					iconURL: 'https://cdn.discordapp.com/emojis/971104113368653894.webp?size=96&quality=lossless'
				})
				.setDescription('Wann darf ein Agent von seinem Tazer Gebrauch machen?')
				.setFooter({
					text: 'Für diese Frage hast Du zwei Minuten Zeit. Antworte mit "Weiß ich nicht", falls Du keine Ahnung hast.',
					iconURL: 'https://cdn.discordapp.com/emojis/970492077836210196.webp?size=96&quality=lossless'
				})
				.setThumbnail(icPictureUrl);

			await interaction.channel.send({
				embeds: [embedBuilder]
			});

			const filter7 = filtered => (filtered.author.id === interaction.user.id);
			await interaction.channel.awaitMessages({
				filter7,
				max: 1,
				time: 120000,
				errors: ['time']
			})
				.then(collected => {
					answers.push(`Wann ein Agent seinen Tazer benutzen darf // "${collected.first().content}"`);
				})
				.catch(() => {
					interaction.followUp({
						content: 'Der Eignungstest wurde abgebrochen, da keine Antwort nach der angegebenen Zeit erfolgte. Du kannst jederzeit in der obigen Nachricht einen neuen Eignungstest anfordern.'
					});

					talkedRecently.delete(interaction.user.id);
					doNext = false;
				});

			/*
             * Frage 8
             */

			if (!doNext) return;
			embedBuilder
				.setAuthor({
					name: 'Schreib uns die Antwort',
					iconURL: 'https://cdn.discordapp.com/emojis/971104113368653894.webp?size=96&quality=lossless'
				})
				.setDescription('Was muss vor der Inhaftierung eines Tatverdächtigen beachtet werden?')
				.setFooter({
					text: 'Für diese Frage hast Du drei Minuten Zeit. Antworte mit "Weiß ich nicht", falls Du keine Ahnung hast.',
					iconURL: 'https://cdn.discordapp.com/emojis/970492077836210196.webp?size=96&quality=lossless'
				})
				.setThumbnail(icPictureUrl);

			await interaction.channel.send({
				embeds: [embedBuilder]
			});

			const filter8 = filtered => (filtered.author.id === interaction.user.id);
			await interaction.channel.awaitMessages({
				filter8,
				max: 1,
				time: 180000,
				errors: ['time']
			})
				.then(collected => {
					answers.push(`Was vor der Inhaftierung beachtet werden muss // "${collected.first().content}"`);
				})
				.catch(() => {
					interaction.followUp({
						content: 'Der Eignungstest wurde abgebrochen, da keine Antwort nach der angegebenen Zeit erfolgte. Du kannst jederzeit in der obigen Nachricht einen neuen Eignungstest anfordern.'
					});

					talkedRecently.delete(interaction.user.id);
					doNext = false;
				});

			/*
             * Frage 9
             */

			if (!doNext) return;
			embedBuilder
				.setAuthor({
					name: 'Schreib uns die Antwort',
					iconURL: 'https://cdn.discordapp.com/emojis/971104113368653894.webp?size=96&quality=lossless'
				})
				.setDescription('Wie würdest Du einen flüchtigen Täter bzw. Tatverdächtigen, der zu Fuß unterwegs ist, festsetzen?')
				.setFooter({
					text: 'Für diese Frage hast Du drei Minuten Zeit. Antworte mit "Weiß ich nicht", falls Du keine Ahnung hast.',
					iconURL: 'https://cdn.discordapp.com/emojis/970492077836210196.webp?size=96&quality=lossless'
				})
				.setThumbnail(icPictureUrl);

			await interaction.channel.send({
				embeds: [embedBuilder]
			});

			const filter9 = filtered => (filtered.author.id === interaction.user.id);
			await interaction.channel.awaitMessages({
				filter9,
				max: 1,
				time: 180000,
				errors: ['time']
			})
				.then(collected => {
					answers.push(`Wie der Bewerber einen Flüchtigen aufhalten würde // "${collected.first().content}"`);
				})
				.catch(() => {
					interaction.followUp({
						content: 'Der Eignungstest wurde abgebrochen, da keine Antwort nach der angegebenen Zeit erfolgte. Du kannst jederzeit in der obigen Nachricht einen neuen Eignungstest anfordern.'
					});

					talkedRecently.delete(interaction.user.id);
					doNext = false;
				});

			/*
             * Frage 10
             */

			if (!doNext) return;
			embedBuilder
				.setAuthor({
					name: 'Schreib uns die Antwort',
					iconURL: 'https://cdn.discordapp.com/emojis/971104113368653894.webp?size=96&quality=lossless'
				})
				.setDescription('Auf welche nicht-tödlichen Waffen kann das FIB zugreifen?')
				.setFooter({
					text: 'Für diese Frage hast Du drei Minuten Zeit.',
					iconURL: 'https://cdn.discordapp.com/emojis/970492077836210196.webp?size=96&quality=lossless'
				})
				.setThumbnail(icPictureUrl);

			await interaction.channel.send({
				embeds: [embedBuilder]
			});

			const filter10 = filtered => (filtered.author.id === interaction.user.id);
			await interaction.channel.awaitMessages({
				filter10,
				max: 1,
				time: 180000,
				errors: ['time']
			})
				.then(collected => {
					answers.push(`Auf welche nicht-tödlichen Waffen das FIB zugriff hat // "${collected.first().content}"`);
				})
				.catch(() => {
					interaction.followUp({
						content: 'Der Eignungstest wurde abgebrochen, da keine Antwort nach der angegebenen Zeit erfolgte. Du kannst jederzeit in der obigen Nachricht einen neuen Eignungstest anfordern.'
					});

					talkedRecently.delete(interaction.user.id);
					doNext = false;
				});

			/*
             * Frage 11
             */

			interaction.channel.edit({
				permissionOverwrites: [{
					id: interaction.user.id,
					allow: [PermissionsBitField.Flags.ViewChannel],
					deny: [PermissionsBitField.Flags.SendMessages]
				},
				{
					id: config.roles.ticketAccess,
					allow: [PermissionsBitField.Flags.ViewChannel]
				},
				{
					id: interaction.guild.roles.everyone.id,
					deny: [PermissionsBitField.Flags.ViewChannel]
				}
				]
			});

			if (!doNext) return;
			embedBuilder
				.setAuthor({
					name: 'Wähle aus',
					iconURL: 'https://cdn.discordapp.com/emojis/972606598763667496.webp?size=96&quality=lossless'
				})
				.setDescription('Welche Lizenzen besitzt Du?')
				.setFooter({
					text: 'Für diese Frage hast Du 60 Sekunden Zeit.',
					iconURL: 'https://cdn.discordapp.com/emojis/970492077836210196.webp?size=96&quality=lossless'
				})
				.setThumbnail(oocPictureUrl);

			await interaction.channel.send({
				embeds: [embedBuilder],
				components: [new ActionRowBuilder()
					.addComponents(
						new SelectMenuBuilder()
							.setCustomId('licenses')
							.setPlaceholder('WÄHLE AUS')
							.addOptions(
								new SelectMenuOptionBuilder()
									.setLabel('Ich besitze einen Führer- und Waffenschein')
									.setValue('yes-all-two')
									.setDescription('Wähle das auch aus, wenn Du unverzüglich danach eine Lizenz dieser Art erwirbst.')
									.setEmoji({
										id: '972621313334198352'
									}),

								new SelectMenuOptionBuilder()
									.setLabel('Ich besitze keine dieser Lizenzen oder nur eine')
									.setValue('none')
									.setDescription('Wähle diese Option, auch, wenn Du nur eine besitzt.')
									.setEmoji({
										id: '972618765349056552'
									})
							),
					)
				]
			});

			const filter11 = (collected) => collected.customId === 'licenses' && collected.user.id === interaction.user.id;
			await interaction.channel.awaitMessageComponent({
				filter11,
				time: 60000
			})
				.then(selectmenu => {
					switch (selectmenu.values[0]) {
					case 'yes-all-two':
						answers.push('Lizenzen, die der Bewerber besitzt // Einen Führer- und Waffenschein');
						break;
					case 'none':
						answers.push('Lizenzen, die der Bewerber besitzt // Keine oder nur eine');
						break;
					}
				})
				.catch(() => {
					interaction.followUp({
						content: 'Der Eignungstest wurde abgebrochen, da keine Antwort nach der angegebenen Zeit erfolgte. Du kannst jederzeit in der obigen Nachricht einen neuen Eignungstest anfordern.'
					});

					talkedRecently.delete(interaction.user.id);
					doNext = false;
				});

			/*
             * ENDE
             */
			const bobTheBuilder = new EmbedBuilder();

			bobTheBuilder
				.setColor(0xFEE75C)
				.setAuthor({
					name: 'Deine Antworten im Rückblick',
					iconURL: 'https://cdn.discordapp.com/emojis/971104113368653894.webp?size=96&quality=lossless'
				})
				.setDescription(`Hier findest Du all Deine Antworten, die Du uns gegeben hast.
                Ein Recruiter wird Deinen Eignungstest nun bearbeiten. **Du musst jetzt nur noch auf eine Antwort warten.**`);

			await answers.forEach(element => {
				bobTheBuilder.addFields({
					name: element.split('//')[0],
					value: element.split('//')[1],
					inline: false
				});
			});

			await interaction.channel.send({
				embeds: [bobTheBuilder]
			});

			interaction.channel.setParent(config.parents.sentFormParentId, {
				reason: `${interaction.user.tag} hat den Eignungstest abgesendet`,
				lockPermissions: false
			});

			// The logging webhook
			bobTheBuilder
				.setColor(0xEB459E)
				.setAuthor({
					name: 'Eignungstest abgesendet',
					iconURL: 'https://cdn.discordapp.com/emojis/970736088404615202.webp?size=96&quality=lossless'
				})
				.setDescription(`${interaction.user.toString()} hat <t:${moment().unix()}:R> den Eignungstest abgesendet.`)
				.setFields({
					name: 'Ticket-ID',
					value: `[${Formatters.inlineCode(foundTicket.ticketId)}](${interaction.channel.url})`,
					inline: true
				}, {
					name: 'Ray-ID',
					value: `${Formatters.inlineCode(moment().unix())}`,
					inline: true
				}, {
					name: 'User-ID',
					value: `[${Formatters.inlineCode(foundTicket.discordId)}](https://discordlookup.com/user/${foundTicket.discordId})`,
					inline: true
				});

			const webhookChannel = await interaction.client.channels.fetch(config.channels.webhookStatusChannelId);

			const acknowledgeButton = await require('./acknowledgeButton');

			const row = new ActionRowBuilder()
				.addComponents(acknowledgeButton.data.builder);

			webhookChannel.send({
				content: Formatters.roleMention(config.roles.ticketAccess),
				embeds: [bobTheBuilder],
				components: [row]
			});
		}, 5000);
	},
};
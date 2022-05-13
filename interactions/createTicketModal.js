const {
	ModalBuilder,
	ActionRowBuilder,
	TextInputBuilder,
	TextInputStyle,
	Formatters,
	ChannelType,
	PermissionsBitField,
	WebhookClient
} = require('discord.js');
const moment = require('moment');
const config = require('../config.json');
const errors = require('../utility/errors');
const models = require('../database/models');
const randomstring = require('randomstring');
const {
	EmbedBuilder
} = require('@discordjs/builders');
// const asure = require('asure');
const recruiterPanelButton = require('./recruiterPanelButton');
const closeTicketButton = require('./closeTicketButton');
const getFormButton = require('./getFormButton');

module.exports = {
	data: {
		id: 'createTicket',
		builder: new ModalBuilder()
			.setCustomId('createTicket')
			.setTitle('Erstelle ein Ticket')
			.addComponents(
				new ActionRowBuilder().addComponents(
					new TextInputBuilder()
						.setCustomId('ic-firstname')
						.setRequired(true)
						.setMaxLength(15)
						.setLabel('Wie lautet Dein IC-Vorname?')
						.setStyle(TextInputStyle.Short)
						.setPlaceholder('z. B. "Felix", ohne die Anführungszeichen')
				),
				new ActionRowBuilder().addComponents(
					new TextInputBuilder()
						.setCustomId('ic-lastname')
						.setRequired(true)
						.setMaxLength(30)
						.setLabel('Wie lautet Dein IC-Nachname?')
						.setStyle(TextInputStyle.Short)
						.setPlaceholder('z. B. "Sano Hermanns", ohne die Anführungszeichen')
				),
				new ActionRowBuilder().addComponents(
					new TextInputBuilder()
						.setCustomId('ooc-age')
						.setRequired(true)
						.setMaxLength(2)
						.setLabel('Wie alt bist Du OOC?')
						.setStyle(TextInputStyle.Short)
						.setPlaceholder('Gib bitte Dein Alter ohne Einheit an.')
				),
			),
	},

	/**
	 *
	 * @param { ModalSubmitInteraction } interaction
	 */
	async execute(interaction) {
		let firstname = interaction.fields.getTextInputValue('ic-firstname');
		const lastname = interaction.fields.getTextInputValue('ic-lastname');
		const age = parseInt(interaction.fields.getTextInputValue('ooc-age'));
		const ticketId = randomstring.generate({
			length: 5,
			readable: true,
			charset: 'alphanumeric'
		}).toLowerCase();

		await interaction.deferReply({
			ephemeral: true
		});

		if (firstname.toLowerCase().includes('dr.' || 'prof.')) firstname = firstname.replace('Dr.' || 'Prof.', '');

		// If the nickname length is more than 29 -> replace last characters with dots to prevent error
		if (`${firstname} ${lastname}`.length >= 29) {
			interaction.member.setNickname(`${firstname} ${lastname}`.substring(0, 29) + '...').catch(() => {
				errors.send(interaction, 'permissions', 'NICKNAME');
			});
		}
		else {
			interaction.member.setNickname(`${firstname} ${lastname}`).catch(() => {
				errors.send(interaction, 'permissions', 'NICKNAME');
			});
		}

		// If the person is named like the array
		if (config.badNames.includes(lastname.toLocaleLowerCase())) {
			await models.blacklisted.create({
				discordId: interaction.user.id,
				timestamp: moment().unix()
			});

			interaction.member.roles.set([config.roles.blacklisted, config.roles.status]);

			return interaction.editReply('Da Du einen Namen besitzt, welcher bei uns auf der Blacklist gesetzt wurde, kannst Du kein Ticket erstellen. Du wurdest somit ebenso auf die Blacklist gesetzt.');
		}

		// If the person is under 16
		if (age < 16) {
			await models.blacklisted.create({
				discordId: interaction.user.id,
				timestamp: moment().unix()
			});

			interaction.member.roles.set([config.roles.blacklisted, config.roles.status]);

			return interaction.editReply('Da Du zu jung bist, kannst Du kein Ticket erstellen. Du wurdest somit auf die Blacklist gesetzt.');
		}

		const ticketChannel = await interaction.guild.channels.create(`ticket-${ticketId}`, {
			reason: `${interaction.user.tag} just finished the modal and passed the validation; creating ticket`,
			parent: config.parents.justCreatedParentId,
			type: ChannelType.GuildText,
			topic: `Deine Ticket-ID lautet ${ticketId}. Halte diese bitte bereit, wenn Du mit einem unserer Recruiter sprichst.\n\n» ${interaction.user.id}\n» ${ticketId}`,

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

		models.tickets.create({
			discordId: interaction.user.id,
			timestamp: moment().unix(),
			ticketId: ticketId,
			channelId: ticketChannel.id
		});

		try {
			await models.users.create({
				discordId: interaction.user.id,
				timestamp: moment().unix(),
				firstname: firstname,
				lastname: lastname,
				age: age
			});
		}
		catch (error) {
			if (error.name === 'SequelizeUniqueConstraintError') {
				models.users.update({
					discordId: interaction.user.id,
					timestamp: moment().unix(),
					firstname: firstname,
					lastname: lastname,
					age: age
				}, {
					where: {
						discordId: interaction.user.id
					}
				});
			}
		}

		interaction.editReply({
			content: `Ich habe Deinen Ticket-Kanal mit der ID [${Formatters.inlineCode(ticketId)}](${ticketChannel.url}) erstellt. Klicke [auf den blauen Text](<${ticketChannel.url}>), um den Kanal zu öffnen.`,
			ephemeral: true
		});

		const embedBuilder = new EmbedBuilder();

		// The embed that will be sent in the created ticket channel
		embedBuilder
			.setColor(0xFEE75C)
			.setAuthor({
				name: 'Feststellung zur Eignung als Agent',
				iconURL: 'https://cdn.discordapp.com/emojis/971104113368653894.webp?size=96&quality=lossless'
			})
			.setDescription('*Wir schätzen es sehr, dass Du das Interesse am Federal Investigation Bureau mit uns teilst. Da wir unsere Auswahl der Bewerber aber stark eingrenzen müssen, haben wir einen Eignungstest entworfen, welchen Du ausfüllen musst, bevor wir ein Gespräch mit Dir führen können. Für diesen Eignungstest benötigst Du in etwa 15 Minuten Deiner freien Zeit. Du solltest außerdem für ein ruhiges Umfeld sorgen.*\n\nDiesen Eignungstest kannst Du anfordern, wenn Du auf "Formular anfordern" klickst.');
		// .setImage(`attachment://profile-${ticketId}.png`);

		const row = new ActionRowBuilder()
			.addComponents(getFormButton.data.builder, closeTicketButton.data.builder, recruiterPanelButton.data.builder);

		// Create the image with banner in the embed
		// const bufferImage = await asure.profileImage(interaction.user);
		// const imageAttachment = new MessageAttachment(bufferImage, `profile-${ticketId}.png`);

		ticketChannel.send({
			content: interaction.user.toString(),
			embeds: [embedBuilder],
			components: [row],
			// files: [imageAttachment]
		});

		// The logging webhook
		embedBuilder
			.setColor(0x57F287)
			.setAuthor({
				name: 'Ticket erstellt',
				iconURL: 'https://cdn.discordapp.com/emojis/968931845708349621.webp?size=96&quality=lossless'
			})
			.setDescription(`${interaction.user.toString()} hat <t:${Math.floor(moment().unix())}:R> ein Ticket erstellt.`)
			.setFields({
				name: 'Ticket-ID',
				value: `[${Formatters.inlineCode(ticketId)}](${ticketChannel.url})`,
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
			url: config.webhooks.ticketWebhookUrl
		}).send({
			avatarURL: interaction.user.avatarURL({
				dynamic: true
			}),
			username: `${interaction.user.tag} | nightmare API`,
			embeds: [embedBuilder]
		});
	},
};
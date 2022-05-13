const {
	EmbedBuilder
} = require('@discordjs/builders');
const {
	ButtonStyle,
	ButtonBuilder,
	PermissionsBitField,
} = require('discord.js');
const models = require('../database/models');
const errors = require('../utility/errors');
const config = require('../config.json');

module.exports = {
	data: {
		id: 'openTicket',
		builder: new ButtonBuilder()
			.setCustomId('openTicket')
			.setLabel('Ticket öffnen')
			.setEmoji({
				id: '971107477808627753'
			})
			.setStyle(ButtonStyle.Secondary),
	},

	/**
     *
     * @param { ButtonInteraction } interaction
     */
	async execute(interaction) {
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
			.setColor(0xFEE75C)
			.setAuthor({
				name: 'Du darfst jetzt in die Tasten hauen',
				iconURL: 'https://cdn.discordapp.com/emojis/970483023512477778.webp?size=96&quality=lossless'
			})
			.setDescription(`Hallo ${firstname},
            um für uns die Bearbeitung der Tickets zu vereinfachen, lassen wir direkte Konversationen in den Ticket-Kanälen eigentlich nicht zu. Unsere Recruiter haben sich aber dazu entschieden, dies zu ändern. Du kannst nun im Ticket mit uns kommunizieren.
            
            Mit freundlichen Grüßen
            Deine Recruiter des FIB`);

		interaction.channel.send({
			embeds: [embedBuilder]
		});

		interaction.reply({
			content: 'Ich habe das Ticket freigegeben.',
			ephemeral: true
		});

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
	},
};
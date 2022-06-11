const {
	GuildMember,
	PermissionsBitField
} = require('discord.js');
const moment = require('moment');
const models = require('../database/models');
const config = require('../config.json');

module.exports = {
	name: 'guildMemberRemove',
	once: false,

	/**
	 *
	 * @param { GuildMember } member
	 */
	async execute(member) {
		const client = member.client;

		const foundTicket = await models.tickets.findOne({
			where: {
				discordId: member.id
			}
		});

		// If the person already opened a ticket
		if (foundTicket) {
			const foundChannel = await client.channels.fetch(foundTicket.channelId);

			foundChannel.send(`${member.user.toString()} hat leider das Bewerbungsportal verlassen. Sobald der Bewerber das Portal erneut betritt, wird er wieder zum Ticket hinzugefügt.`);
		}
	}
};
const {
	GuildMember,
	PermissionsBitField
} = require('discord.js');
const moment = require('moment');
const models = require('../database/models');
const config = require('../config.json');

module.exports = {
	name: 'guildMemberAdd',
	once: false,

	/**
	 *
	 * @param { GuildMember } member
	 */
	async execute(member) {
		const client = member.client;

		const foundStat = await models.statistics.findOne({ where: { statId: 'bot' } });

		if (foundStat) {
			foundStat.increment('membersCount');
		}

		const foundTicket = await models.tickets.findOne({
			where: {
				discordId: member.id
			}
		});

		// If the person already opened a ticket
		if (foundTicket) {
			const foundChannel = await client.channels.fetch(foundTicket.channelId);

			foundChannel.edit({
				permissionOverwrites: [{
					id: member.id,
					allow: [PermissionsBitField.Flags.ViewChannel],
					deny: [PermissionsBitField.Flags.SendMessages]
				},
				{
					id: config.roles.ticketAccess,
					allow: [PermissionsBitField.Flags.ViewChannel]
				},
				{
					id: member.guild.roles.everyone.id,
					deny: [PermissionsBitField.Flags.ViewChannel]
				}
				]
			});

			foundChannel.send(`Hallo, ${member.user.toString()}! Da Du unser Bewerbungsportal erneut betreten hast und Dein Ticket noch geöffnet ist, habe ich Dir erneut Zugriff erteilt.\nDir wurden erneut alle Rollen erteilt, welche Du bereits besaßt, um Verwechslungen für unsere Recruiter zu vermeiden.`);
		}

		const foundUser = await models.users.findOne({
			where: {
				discordId: member.id
			}
		});

		if (foundUser) {
			if (`${foundUser.firstname} ${foundUser.lastname}`.length >= 29) {
				member.setNickname(`${foundUser.firstname} ${foundUser.lastname}`.substring(0, 29) + '...');
			}
			else {
				member.setNickname(`${foundUser.firstname} ${foundUser.lastname}`);
			}
		}

		const foundBlacklisted = await models.blacklisted.findOne({
			where: {
				discordId: member.id
			}
		});

		if (foundBlacklisted) {
			return member.roles.add([config.roles.blacklisted]);
		}

		const foundDeclined = await models.declined.findOne({
			where: {
				discordId: member.id
			}
		});

		// If the person is declined
		if (foundDeclined) {
			if ((foundDeclined.timestamp + 1209600) < moment().unix()) {
				foundDeclined.destroy();
				member.roles.remove([config.roles.declined]);
			}
			else {
				member.roles.add([config.roles.declined]);
			}
		}
	}
};
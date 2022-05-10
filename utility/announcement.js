const { EmbedBuilder } = require('@discordjs/builders');

/**
 *
 * Sends a announcement via direct message to a member.
 *
 * @param { GuildMember } member - The guild member
 * @param { BaseGuildTextChannel } channel - The ticket channel
 */
async function send(member, channel) {
	const firstname = member.nickname.split(' ')[0] || member.user.username;

	const embedBuilder = new EmbedBuilder();

	embedBuilder
		.setColor(0x5865f2)
		.setAuthor({
			name: 'Es gibt Neuigkeiten zu Deiner Bewerbung als Federal Agent',
			iconURL: 'https://cdn.discordapp.com/emojis/971446924651667516.webp?size=96&quality=lossless',
		})
		.setDescription(`Hallo ${firstname},
        diese Nachricht wurde vom Federal Investigation Bureau-Bewerbungsserver auf LifeV gesendet. Aber nicht ohne Grund — denn es gibt wichtige Neuigkeiten zu Deiner Bewerbung!
        Klicke [auf den blauen Text](${channel.url}), um zu Deinem Ticket-Kanal zu gelangen.`);

	member
		.send({
			embeds: [embedBuilder],
		})
		.catch(channel.send(member.user.toString()));
}

exports.send = send;

const {
	EmbedBuilder
} = require('@discordjs/builders');
const config = require('../config.json');

/**
 *
 * Sends a embed via an logging webhook.
 *
 * @param { String } webhook - The webhook-type. Available types are: Blacklist, Tickets, Server, Status, Audit, Bot, Join-Leave
 * @param { EmbedAuthorOptions } author - The title of the message embed.
 * @param { String } description - The description of the message embed.
 * @param { Client } client - The discord client.
 */
async function send(client, webhook, description, author) {
	let channelId;

	switch (webhook.toLowerCase()) {
	case 'blacklist':
		channelId = config.logs.blacklistChannelId;
		break;
	case 'tickets':
		channelId = config.logs.ticketChannelId;
		break;
	case 'server':
		channelId = config.logs.serverChannelId;
		break;
	case 'status':
		channelId = config.logs.statusChannelId;
		break;
	case 'audit':
		channelId = config.logs.auditChannelId;
		break;
	case 'bot':
		channelId = config.logs.botChannelId;
		break;
	case 'join-leave':
		channelId = config.logs.joinleaveLogsId;
		break;
	}

	const channel = await client.channels.fetch(channelId);

	const embedBuilder = new EmbedBuilder;

	embedBuilder
		.setColor(parseInt(config.colors.embed))
		.setAuthor(author)
		.setDescription(description);

	const webhooks = await channel.fetchWebhooks();
	let found = webhooks.first();

	if (!found) {
		await channel.createWebhook('nightmare API Logging Utility', {
			avatar: 'https://cdn.discordapp.com/emojis/970797439126757377.webp?size=96&quality=lossless',
		}).then(created => {
			found = created;
			console.log('Created webhook in channel #' + channel.name);
		});
	}

	try {
		await found.send({
			username: 'nightmare API Logging Utility',
			avatarURL: 'https://cdn.discordapp.com/emojis/970797439126757377.webp?size=96&quality=lossless',
			embeds: [embedBuilder]
		});
	}
	catch (error) {
		console.error('Error trying to send a message: ', error);
	}
}

exports.send = send;
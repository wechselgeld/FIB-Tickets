const {
	Client,
	Collection,
	Partials,
	IntentsBitField,
	WebhookClient,
	Formatters,
	EmbedBuilder
} = require('discord.js');
const moment = require('moment');
const dotenv = require('dotenv');
const fs = require('fs');
const config = require('./config.json');
const consola = require('consola');

// Initialization
const client = new Client({
	intents: [
		IntentsBitField.Flags.DirectMessages,
		IntentsBitField.Flags.DirectMessageTyping,
		IntentsBitField.Flags.Guilds,
		IntentsBitField.Flags.GuildMessages,
		IntentsBitField.Flags.GuildMembers,
		IntentsBitField.Flags.MessageContent
	],
	partials: [
		Partials.Message,
		Partials.Channel,
		Partials.User
	]
});

dotenv.config();

// Collections
client.commands = new Collection();
client.interactions = new Collection();

// Command Handler
for (const file of fs.readdirSync('./commands').filter(file => file.endsWith('.js'))) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.data.name, command);
}

// Interaction Handler
for (const file of fs.readdirSync('./interactions').filter(file => file.endsWith('.js'))) {
	const interaction = require(`./interactions/${file}`);
	client.interactions.set(interaction.data.id, interaction);
}

// Event Handler
for (const file of fs.readdirSync('./events').filter(file => file.endsWith('.js'))) {
	const event = require(`./events/${file}`);
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args));
	}
	else {
		client.on(event.name, (...args) => event.execute(...args));
	}
}

// Error Handling
function sendWebhook(error) {
	const embedBuilder = new EmbedBuilder();

	embedBuilder
		.setColor(0xED4245)
		.setAuthor({
			name: 'Fehler',
			iconURL: 'https://cdn.discordapp.com/emojis/965950909463011339.webp?size=96&quality=lossless'
		})
		.setDescription(`Es wurde <t:${moment().unix()}:R> ein Fehler ausgelöst.
		${Formatters.codeBlock(error)}`);

	new WebhookClient({
		url: config.webhooks.botWebhookUrl
	}).send({
		avatarURL: 'https://cdn.discordapp.com/avatars/272663056075456512/a_06bf0fe6720d935e856f3c629bc9c129?size=512',
		username: 'wechselgeld#0069 | nightmare API',
		content: '<@272663056075456512>',
		embeds: [embedBuilder]
	});
}

process.on('unhandledRejection', error => {
	console.error('Unhandled promise rejection:', error);
	sendWebhook(error);
});

client.on('error', error => {
	consola.error(error);
	sendWebhook(error);
});

process.on('uncaughtException', (error, origin) => {
	consola.error(error, origin);
	sendWebhook(error + origin);
});

process.on('uncaughtExceptionMonitor', (error, origin) => {
	consola.error(error, origin);
	sendWebhook(error + origin);
});

process.on('multipleResolves', (type, promise, reason) => {
	consola.error(type, promise, reason);
	sendWebhook(type, promise, reason);
});

// Login
client.login(process.env.TOKEN);
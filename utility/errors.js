const {
	Formatters, EmbedBuilder
} = require('discord.js');
const randomstring = require('randomstring');

/**
 * Replies with an error code
 *
 * @param { Interaction } interaction - The interaction
 * @param { String } type - The error type
 * @param { String } error - The error code
 */
async function send(interaction, type, error) {
	const rayId = randomstring.generate({
		length: 10,
		readable: true,
		charset: 'alphanumeric'
	});

	const embedBuilder = new EmbedBuilder();

	embedBuilder
		.setColor(0xED4245)
		.setAuthor({
			name: `Fehler (${type.toUpperCase()})`,
			iconURL: 'https://cdn.discordapp.com/emojis/965950909463011339.webp?size=96&quality=lossless'
		})
		.setDescription(`Es wurde ein Fehler ausgelöst, weshalb die Aktion nicht ausgeführt werden kann.
		${Formatters.codeBlock(error)}`);

	if (interaction.deferred || interaction.replied) {
		return interaction.followUp({
			embeds: [embedBuilder],
			ephemeral: true,
		});
	}

	interaction.reply({
		embeds: [embedBuilder],
		ephemeral: true,
	});
}

exports.send = send;
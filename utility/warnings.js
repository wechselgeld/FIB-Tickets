const {
	Formatters, EmbedBuilder
} = require('discord.js');
const randomstring = require('randomstring');

/**
 * Replies with an error code
 *
 * @param { Interaction } interaction - The interaction
 * @param { String } type - The warning type
 * @param { String } error - The warning code
 */
async function send(interaction, type, warn) {
	const rayId = randomstring.generate({
		length: 10,
		readable: true,
		charset: 'alphanumeric'
	});

	const embedBuilder = new EmbedBuilder();

	embedBuilder
		.setColor(0xFEE75C)
		.setAuthor({
			name: `Warnung (${type.toUpperCase()})`,
			iconURL: 'https://cdn.discordapp.com/emojis/965950909463011339.webp?size=96&quality=lossless'
		})
		.setDescription(`Es wurde eine Warnung ausgelöst.
		${Formatters.codeBlock(warn)}`);

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
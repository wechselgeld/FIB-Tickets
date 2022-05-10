const {
	Formatters
} = require('discord.js');
const randomstring = require('randomstring');

/**
 * Replies with an error code
 *
 * @param { Interaction } interaction - The interaction
 * @param { String } error - The error code
 */
async function send(interaction, type, error) {
	const rayId = randomstring.generate({
		length: 10,
		readable: true,
		charset: 'alphanumeric'
	});

	if (interaction.deferred || interaction.replied) {
		return interaction.followUp({
			content: `» ${Formatters.inlineCode('ERROR')}   ${Formatters.inlineCode(type.toUpperCase())}   ${Formatters.inlineCode(error)}\nDieser Fehler wurde an die Entwickler weitergeleitet. Deine Ray-ID lautet ${Formatters.inlineCode(rayId)}-D.`,
			ephemeral: true,
		});
	}

	interaction.reply({
		content: `» ${Formatters.inlineCode('ERROR')}   ${Formatters.inlineCode(type.toUpperCase())}   ${Formatters.inlineCode(error)}\nDieser Fehler wurde an die Entwickler weitergeleitet. Deine Ray-ID lautet ${Formatters.inlineCode(rayId)}-R.`,
		ephemeral: true,
	});
}

exports.send = send;
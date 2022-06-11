const {
	Typing
} = require('discord.js');
const {
	ChannelType
} = require('discord-api-types/v10');
const consola = require('consola');
const moment = require('moment');

const talkedRecently = new Set();

module.exports = {
	name: 'typingStart',
	once: false,

	/**
     *
     * @param { Typing } typing
     */
	async execute(typing) {
		if (!(typing.channel.type === ChannelType.DM)) return;

		if (talkedRecently.has(typing.user.id)) return;

		talkedRecently.add(typing.user.id);
		setTimeout(() => {
			talkedRecently.delete(typing.user.id);
		}, 120000);

		consola.info(`${new moment().format('DD.MM.YYYY HH:ss')} | ${typing.user.tag} started typing in direct messages.`);

		typing.user.send({ content: 'Hallo! Danke, dass Du mir schreibst. :wave:\nIch kann auf Deine Nachrichten nicht antworten, dafür können es aber die Recruiter. Sende mir einfach eine Nachricht mit Feedback, Lob, Kritik, einer Frage und wir antworten Dir schnellstmöglich darauf. Achte drauf, dass Du Deine Direktnachrichten aktiviert hast.' }).catch(consola.info(`Couldn't answer to the typing from ${typing.user.tag} because the user disabled receiving direct messages.`));
	}
};
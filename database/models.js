const Sequelize = require('sequelize');

const sequelize = new Sequelize('database', 'user', process.env.DB_TOKEN, {
	host: 'localhost',
	dialect: 'sqlite',
	logging: false,
	storage: 'fib.sqlite'
});

const declined = sequelize.define('declined', {
	discordId: {
		type: Sequelize.STRING,
		primaryKey: true,
		defaultValue: 0,
		allowNull: false
	},

	timestamp: {
		type: Sequelize.INTEGER,
		allowNull: true,
	}
});

const blacklisted = sequelize.define('blacklisted', {
	discordId: {
		type: Sequelize.STRING,
		primaryKey: true,
		defaultValue: 0,
		allowNull: false
	},

	timestamp: {
		type: Sequelize.INTEGER,
		allowNull: true,
	}
});

const tickets = sequelize.define('tickets', {
	discordId: {
		type: Sequelize.STRING,
		primaryKey: true,
		defaultValue: 0,
		allowNull: false
	},

	timestamp: {
		type: Sequelize.INTEGER,
	},

	ticketId: {
		type: Sequelize.STRING,
	},

	channelId: {
		type: Sequelize.STRING,
	}
});

const users = sequelize.define('users', {
	discordId: {
		type: Sequelize.STRING,
		primaryKey: true,
		defaultValue: 0,
		allowNull: false
	},

	timestamp: {
		type: Sequelize.INTEGER,
	},

	firstname: {
		type: Sequelize.STRING,
	},

	lastname: {
		type: Sequelize.STRING,
	},

	age: {
		type: Sequelize.INTEGER,
	}
});

const statistics = sequelize.define('statistics', {
	statId: {
		type: Sequelize.STRING,
		defaultValue: 0,
	},

	declinedCount: {
		type: Sequelize.INTEGER,
		defaultValue: 0,
	},

	acceptedCount: {
		type: Sequelize.INTEGER,
		defaultValue: 0,
	},

	acceptedTalk: {
		type: Sequelize.STRING,
		defaultValue: 0,
	},

	blacklistedCount: {
		type: Sequelize.INTEGER,
		defaultValue: 0,
	},

	registeredCount: {
		type: Sequelize.INTEGER,
		defaultValue: 0,
	},

	membersCount: {
		type: Sequelize.INTEGER,
		defaultValue: 0,
	},

	startsCount: {
		type: Sequelize.INTEGER,
		defaultValue: 0,
	},

	praisesCount: {
		type: Sequelize.INTEGER,
		defaultValue: 0,
	},

	criticismsCount: {
		type: Sequelize.INTEGER,
		defaultValue: 0,
	},

	statCount: {
		type: Sequelize.INTEGER,
		defaultValue: 0,
	},

	ticketCount: {
		type: Sequelize.INTEGER,
		defaultValue: 0,
	},

	panelOpenCount: {
		type: Sequelize.INTEGER,
		defaultValue: 0,
	}
});

exports.tickets = tickets;
exports.declined = declined;
exports.blacklisted = blacklisted;
exports.users = users;
exports.sequelize = sequelize;
exports.statistics = statistics;
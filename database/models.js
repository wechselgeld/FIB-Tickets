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

exports.tickets = tickets;
exports.declined = declined;
exports.blacklisted = blacklisted;
exports.users = users;
exports.sequelize = sequelize;
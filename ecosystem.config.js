module.exports = {
	apps: [{
		name: 'FIB-Tickets',
		script: 'index.js',
		watch: true,
		ignore_watch: ['node_modules', 'fib.sqlite', 'fib.sqlite-journal'],
		env: {
			'TZ': 'Europe/Amsterdam',
		},
	}],
};
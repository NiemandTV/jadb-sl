const embeds = require('../util/embeds.js');
const JSON = require('../util/JSON.js');
const auth = require('../util/auth.js');

function cmdInit(client, message) {
	if (!auth.getAuthorized(client, message)) embeds.errorAuthorized(message.channel, '');
	else if (message.mentions.users.first()) {
		if (!client.dataJSON.channel[message.channel]) client.dataJSON.channel[message.channel] = {};
		var channelDevs = message.mentions.users.keyArray();

		// delete all previous permissions
		if (client.dataJSON.channel[message.channel].devsID) {
			message.channel.permissionOverwrites
				.filter((element) => client.dataJSON.channel[message.channel].devsID.includes(element.id))
				.deleteAll();
		}

		client.dataJSON.channel[message.channel].devsID = channelDevs;
		JSON.update(client.dataJSON, () => {
			embeds.feedback(
				message.channel,
				`Linked <@${client.dataJSON.channel[message.channel].devsID.join('>, <@')}> with ${message.channel}.`
			);
		});

		// set permissions
		channelDevs.forEach((element) => {
			message.channel.overwritePermissions(element, {
				MANAGE_CHANNELS: true
			});
		});
	} else {
		embeds.errorSyntax(message.channel, '`!channel init @developer [...]`');
	}
}

function cmdReset(client, message) {
	if (!auth.getAuthorized(client, message)) embeds.errorAuthorized(message.channel, '');
	else if (client.dataJSON.channel[message.channel]) {
		// delete all permissions
		if (client.dataJSON.channel[message.channel].devsID) {
			message.channel.permissionOverwrites
				.filter((element) => client.dataJSON.channel[message.channel].devsID.includes(element.id))
				.deleteAll();
		}

		delete client.dataJSON.channel[message.channel];
		JSON.update(client.dataJSON, () => {
			embeds.feedback(message.channel, `${message.channel} was reset.`);
		});
	} else {
		embeds.error(message.channel, `${message.channel} is not initialized.`);
	}
}

function cmdConfig(client, message, args) {
	if (!auth.getDev(client, message) && !auth.getAuthorized(client, message))
		embeds.errorAuthorized(message.channel, '');
	else if (!client.dataJSON.channel[message.channel])
		embeds.error(message.channel, `${message.channel} is not initialized.`);
	else {
		var value = args.slice(2);
		if (!client.dataJSON.channel[message.channel].download) client.dataJSON.channel[message.channel].download = {};
		switch (args[1]) {
			case 'text':
				client.dataJSON.channel[message.channel].download.text = value.join(' ');
				break;
			case 'link':
				client.dataJSON.channel[message.channel].download.link = value[0];
				break;
			case 'thumbnail':
				client.dataJSON.channel[message.channel].download.thumbnail = [ value[0], value[1] ];
				break;
			case 'reset':
				client.dataJSON.channel[message.channel].download = {};
				JSON.update(client.dataJSON, () => {
					embeds.feedback(message.channel, `\`!download\` of ${message.channel} was reset.`);
				});
				return;
			default:
				embeds.errorSyntax(message.channel, '`!channel config <text|link|thumbnail>`');
				return;
		}

		JSON.update(client.dataJSON, () => {
			embeds.feedback(message.channel, `The ${args[1]} of ${message.channel} was updated.`);
		});
	}
}

function cmdInfo(client, message) {
	var channelData = client.dataJSON.channel[message.channel];
	if (channelData) {
		embeds.feedback(
			message.channel,
			`Channel: ${message.channel}\nDeveloper: <@${channelData.devsID.join('>, <@')}>`
		);
	} else {
		embeds.error(message.channel, `${message.channel} is not initialized.`);
	}
}

const subCommands = {
	init: cmdInit,
	reset: cmdReset,
	config: cmdConfig,
	info: cmdInfo
};

exports.help = {
	syntax: `!channel <${Object.keys(subCommands).join('|')}>`,
	category: 'moderation',
	description: 'Commands to manage and get information about channels..'
};

exports.run = (client, message, args) => {
	if (args[0] in subCommands) subCommands[args[0]](client, message, args);
	else embeds.errorSyntax(message.channel, `\`${this.help.syntax}\``);
};

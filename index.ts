import { Client, GatewayIntentBits } from 'discord.js';
import { DefaultLogging, makeDependencies, Sern, single, Singleton } from '@sern/handler';
import 'dotenv/config'

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMembers,
	],
});

await makeDependencies({
    build: root => root
        .add({ '@sern/client': single(() => client)  })
});
Sern.init({
	commands: 'dist/commands',
	events: 'dist/events'
});

client.login(process.env.TOKEN);

import { Client, GatewayIntentBits } from 'discord.js';
import { DefaultLogging, Dependencies, Sern, SernEmitter, single, Singleton } from '@sern/handler';
import 'dotenv/config'

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMembers,
	],
});

interface MyDependencies extends Dependencies {
    '@sern/client' : Singleton<Client>;
    '@sern/logger' : Singleton<DefaultLogging>
}
export const useContainer = Sern.makeDependencies<MyDependencies>({
    build: root => root
        .add({ '@sern/client': single(client)  }) 
        .add({ '@sern/logger': single(new DefaultLogging()) })
});
Sern.init({
	commands: 'dist/commands',
	events: 'dist/events',
	containerConfig: {
		get: useContainer
	}
});

client.login(process.env.TOKEN);

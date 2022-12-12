import { commandModule, CommandType } from '@sern/handler';
import { publish } from '../plugins/publish.js';
import { ANIME } from '@consumet/extensions';
import {
	ActionRowBuilder,
	ApplicationCommandOptionType,
	ButtonBuilder,
	ButtonStyle,
	ComponentType,
	EmbedBuilder,
} from 'discord.js';

export default commandModule({
	type: CommandType.Slash,
	plugins: [publish()],
	description: 'Look for stuff in gogoanime!',
	//alias : [],
	options: [
		{
			name: 'search',
			description: 'Look for an anime',
			type: ApplicationCommandOptionType.Subcommand,
			options: [
				{
					name: 'keyword',
					description: 'The keyword',
					type: ApplicationCommandOptionType.String,
					required: true,
				},
			],
		},
		{
			name: 'chapter',
			description: 'Look for the link of any episode with its ID.',
			type: ApplicationCommandOptionType.Subcommand,
			options: [
				{
					name: 'id-series',
					description: 'The ID of the series',
					type: ApplicationCommandOptionType.String,
					required: true
				},
				{
					name: 'id-episode',
					description: 'The episode number (use the autocomplete)',
					type: ApplicationCommandOptionType.String,
					required: true,
					autocomplete: true,
					command: {
						onEvent: [],
						execute: async (autocomplete) => {
							try {
								const focusedOption = autocomplete.options.getFocused();
								const gogoanime = new ANIME.Gogoanime();
								const serieOption = autocomplete.options.getString('id-series', true)
								const fetch = await gogoanime.fetchAnimeInfo(serieOption)
								let choices = fetch.episodes!.filter((choice) => choice.number.toString().startsWith(focusedOption))
								choices = choices.slice(0, 25)
								await autocomplete.respond(
									choices.map((choice) => ({
										name: choice.number.toString(),
										value: choice.id.toString(),
									}))
								)
							} catch (err) {
								await autocomplete.respond([{name: 'Something bad happened! Make sure you put the ID correctly.', value: 'error'}])
							}
						}
					}
				}
			],
		},
		{
			name: 'info',
			description: 'Get info of some series with its ID',
			type: ApplicationCommandOptionType.Subcommand,
			options: [
				{
					name: 'id',
					description: 'The serie\'s ID.',
					type: ApplicationCommandOptionType.String,
					required: true
				}
			]
		}
	],
	execute: async (ctx, options) => {
		const gogoanime = new ANIME.Gogoanime();
		const doubleslashregex = new RegExp('(?<!:)\/\/+')
		switch (options[1].getSubcommand()) {
			case 'search': {
				await ctx.interaction.deferReply()
				const option = options[1].getString('keyword', true);
				const search = await gogoanime.search(option);
				const editedarray = await Promise.all(
					search.results
						.map((results) => {
							return `[${results.title}](<${results.url!.replace(doubleslashregex, '/')}>)`;
						})
						.slice(0, 5)
				);
				const editedarrayids = await Promise.all(
					search.results
						.map((results) => {
							return `[${results.id}](<${results.url!.replace(doubleslashregex, '/')}>)`;
						})
						.slice(0, 5)
				);
				const button = new ActionRowBuilder<ButtonBuilder>().addComponents(
					new ButtonBuilder()
						.setCustomId('gogoanime-search-toid')
						.setLabel('Change to ID')
						.setStyle(ButtonStyle.Secondary)
				);
				if (editedarray.length === 0) return await ctx.interaction.editReply({content: 'No se ha encontrado nada con ese resultado de búsqueda, prueba a ser más general o concreto idk'})
				const message = await ctx.interaction.editReply({
					content: `Results of the search \`${option}\`:\n${editedarray.join('\n')}`,
					components: [button],
				});
				const collector = message.createMessageComponentCollector({max: 1, componentType: ComponentType.Button, time: 30000})
				collector.on('collect', async (i) => {
					if (i.customId !== 'gogoanime-search-toid') return;
					await ctx.interaction.editReply({
						content: `Results of the search \`${option}\` (ID mode):\n${editedarrayids.join('\n')}`,
						components: []
					})
					await i.deferUpdate()
				})
			} break;
			case 'chapter': {
				const selepisode = options[1].getString('id-episode', true)
				try {
					const search = await gogoanime.fetchEpisodeServers(selepisode)
					const arrayed = await Promise.all(search.map((server) => `[${server.name}](<${server.url!.replace(doubleslashregex, '/')}>)`))
					await ctx.reply({content: `All of the servers of \`${selepisode}\`:\n${arrayed.join('\n')}`})
				} catch (err) {
					await ctx.reply({content: 'Something bad happened! Make sure you select the episode correctly.'})
				}
			} break;
			case 'info': {
				try {
					const option = options[1].getString('id', true)
					const info = await gogoanime.fetchAnimeInfo(option)
					const embed = new EmbedBuilder()
						.setColor('Random')
						.setTitle(`${info.title}`)
						.setURL(info.url!.replace(doubleslashregex, '/'))
						.setThumbnail(info.image!)
						.setFields(
							{name: 'Genres', value: `${info.genres!.join(', ')}`},
							{name: 'Release date', value: `${info.releaseDate!}`, inline: true},
							{name: 'Total chapters', value: `${info.totalEpisodes!}`, inline: true},
							{name: '\u200B', value: '\u200B', inline: true},
							{name: 'Type', value: `${info.type!}`, inline: true},
						)

					await ctx.reply({embeds: [embed]})
				} catch (err) {
					await ctx.reply({content: 'ERROR: Make sure you set the ID correctly.'})
				}
			} break;
		}
	},
});
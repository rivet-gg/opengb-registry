import { RuntimeError, test, TestContext } from "../module.gen.ts";
import {
	assertArrayIncludes,
	assertEquals,
	assertRejects,
} from "https://deno.land/std@0.208.0/assert/mod.ts";

// problems:
// - server token vs lobby token for mlps
// - players connected & disconnected will not work with non-server backend
//
// next steps:
// - add way of handling versions: add fallback script that returns based on the current backend
// - update with new config
// - wait requests: wait until lobby ready to return with long req
// - add public ips for players
// - call real ds api
//
// next big ticket:
// - mlps + lobby events
// - persistent
// - validate tags
// - captchas
// - pluggable backends
//
// post mvp:
// - put together html5 demo
// - figure out player surge issue
//
// small things to fix:
// - improve find player count req
// - assert must provide players in req
// - add validation comments to config
// - custom serialization for lobby & player response
// - rate limits
// - ask gpt to write tests based on rust code
//
// common configs:
// - game modes + regions
//
// nice to haves:
// - captchas
// - ipinfo integration
// - auto shutdown after version expired
// - benchmark
//
// ---
//
// all new features:
// - configs via tags instead of game modes
// - better handling of unconnected players with max players per ip
// - see new config properties
// - creating multiple players in batch

const VERSION = "TODO";

test("e2e", async (ctx: TestContext) => {

	// MARK: Create lobby
	const { lobby, players } = await ctx.modules.lobbies.create({
		version: VERSION,
		tags: {},
		players: [{}, {}],
		maxPlayers: 8,
		maxPlayersDirect: 8,
	});

	// Issue another token for the lobby for tests
	const { token: { token: lobbyToken } } = await ctx.modules.tokens.create({
		type: "lobby_test",
		meta: { lobbyId: lobby.id },
	});

	// MARK: List lobbies
	{
		const { lobbies } = await ctx.modules.lobbies.list({});
		assertEquals(lobbies.length, 1);
		assertEquals(lobbies[0].id, lobby.id);
	}

	// MARK: Connect lobby
	await ctx.modules.lobbies.setLobbyReady({
		lobbyToken,
	});

	// MARK: Connect players
	await ctx.modules.lobbies.setPlayerConnected({
		lobbyToken,
		playerTokens: [players[0].token, players[1].token],
	});

	// MARK: Disconnect players
	await ctx.modules.lobbies.setPlayerDisconnected({
		lobbyToken,
		playerTokens: [players[0].token, players[1].token],
	});

	// MARK: Create players
	{
		const { players: players2 } = await ctx.modules.lobbies.join({
			lobbyId: lobby.id,
			players: [{}],
		});
		await ctx.modules.lobbies.setPlayerConnected({
			lobbyToken,
			playerTokens: [players2[0].token],
		});
		await ctx.modules.lobbies.setPlayerDisconnected({
			lobbyToken,
			playerTokens: [players2[0].token],
		});
	}

	// MARK: Destroy lobby
	await ctx.modules.lobbies.destroy({
		lobbyId: lobby.id,
	});

	{
		const { lobbies } = await ctx.modules.lobbies.list({});
		assertEquals(lobbies.length, 0);
	}

	const error = await assertRejects(async () => {
		await ctx.modules.lobbies.destroy({ lobbyId: lobby.id });
	}, RuntimeError);
	assertEquals(error.code, "lobby_not_found");
});

test("lobby tags", async (ctx: TestContext) => {
	// MARK: Create lobbies
	const { lobby: lobby1, players: players1 } = await ctx.modules.lobbies.create(
		{
			version: VERSION,
			tags: { gameMode: "a", region: "atl" },
			players: [{}],
			maxPlayers: 8,
			maxPlayersDirect: 8,
		},
	);
	const { lobby: lobby2, players: players2 } = await ctx.modules.lobbies.create(
		{
			version: VERSION,
			tags: { gameMode: "a", region: "fra" },
			players: [{}],
			maxPlayers: 8,
			maxPlayersDirect: 8,
		},
	);
	const { lobby: lobby3, players: players3 } = await ctx.modules.lobbies.create(
		{
			version: VERSION,
			tags: { gameMode: "b", region: "fra" },
			players: [{}],
			maxPlayers: 8,
			maxPlayersDirect: 8,
		},
	);

	// MARK: Find lobbies
	const { lobby: lobby4, players: players4 } = await ctx.modules.lobbies.find({
		version: VERSION,
		tags: { gameMode: "a" },
		players: [{}],
	});
	console.log("my lobby", lobby4.id, lobby1.id, lobby2.id);
	assertArrayIncludes([lobby1.id, lobby2.id], [lobby4.id]);

	const { lobby: lobby5, players: players5 } = await ctx.modules.lobbies.find({
		version: VERSION,
		tags: { gameMode: "b" },
		players: [{}],
	});
	assertEquals(lobby5.id, lobby3.id);

	const { lobby: lobby6, players: players6 } = await ctx.modules.lobbies.find({
		version: VERSION,
		tags: { gameMode: "a", region: "fra" },
		players: [{}],
	});
	assertEquals(lobby6.id, lobby2.id);
});

test("sort order", async (ctx: TestContext) => {
	// TODO:
});

test("lobby size", async (ctx: TestContext) => {
	// TODO:
});

test("max players per ip", async (ctx: TestContext) => {
	// TODO:
});

test("max players per ip with unconnected players", async (ctx: TestContext) => {
	// TODO:
});

test("max unconnected players", async (ctx: TestContext) => {
	// TODO:
});

test("player unconnected expire", async (ctx: TestContext) => {
	// TODO:
});

test("old player expire", async (ctx: TestContext) => {
});

test("lobby unready expire", async (ctx: TestContext) => {
	// TODO:
});

test("empty lobby expire", async (ctx: TestContext) => {
	// TODO:
});

import {
	CreatePlayersRequest,
	CreatePlayersResponse,
} from "../actors/lobby_manager.ts";
import { ScriptContext } from "../module.gen.ts";
import {
	Lobby,
	PlayerRequest,
	PlayerWithToken,
} from "../utils/types.ts";

export interface Request {
	lobbyId: string;
	players: PlayerRequest[];
}

export interface Response {
	lobby: Lobby;
	players: PlayerWithToken[];
}

export async function run(
	ctx: ScriptContext,
	req: Request,
): Promise<Response> {
	// Setup players
	const playerOpts: PlayerRequest[] = [];
	const playerTokens: Record<string, string> = {};
	for (const _player of req.players) {
		const playerId = crypto.randomUUID();
		const { token: playerToken } = await ctx.modules.tokens.create({
			type: "player",
			meta: { playerId: playerId },
		});
		playerOpts.push({ playerId });
		playerTokens[playerId] = playerToken.token;
	}

  const { lobby, players }: CreatePlayersResponse = await ctx.actors.lobbyManager.getOrCreateAndCall(
    "default",
    undefined,
		"createPlayers",
		{
            lobbyId: req.lobbyId,
            players: playerOpts,
        } as CreatePlayersRequest,
	);

	return {
		lobby,
		players: players.map((x) => ({ token: playerTokens[x.id], ...x })),
	};
}
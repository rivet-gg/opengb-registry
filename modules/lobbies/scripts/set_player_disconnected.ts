import { DestroyPlayersRequest } from "../actors/lobby_manager.ts";
import { ScriptContext } from "../module.gen.ts";

export interface Request {
	lobbyToken: string;
	playerTokens: string[];
}

export interface Response {
}

export async function run(
	ctx: ScriptContext,
	req: Request,
): Promise<Response> {
	let manager;
	const { token: lobbyToken } = await ctx.modules.tokens.validate({
		token: req.lobbyToken,
	});
	const lobbyId: string = lobbyToken.meta.lobbyId;

	const playerIds: string[] = [];
	for (const playerToken of req.playerTokens) {
		const { token } = await ctx.modules.tokens.validate({ token: playerToken });
		playerIds.push(token.meta.playerId);
	}

  await ctx.actors.lobbyManager.getOrCreateAndCall(
    "default",
    undefined,
		"destroyPlayers",
		{ lobbyId, playerIds } as DestroyPlayersRequest,
	);

	return {};
}

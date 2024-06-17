import { SetLobbyReadyRequest } from "../actors/lobby_manager.ts";
import { ScriptContext } from "../module.gen.ts";

export interface Request {
	lobbyToken: string;
}

export interface Response {
}

export async function run(
	ctx: ScriptContext,
	req: Request,
): Promise<Response> {
	let manager;
	const { token } = await ctx.modules.tokens.validate({
		token: req.lobbyToken,
	});
	const lobbyId: string = token.meta.lobbyId;

	await ctx.actors.lobbyManager.getOrCreateAndCall("default", undefined, "setLobbyReady", { lobbyId } as SetLobbyReadyRequest);

	return {};
}

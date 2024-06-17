import { ListLobbiesRequest, ListLobbiesResponse } from "../actors/lobby_manager.ts";
import { ScriptContext } from "../module.gen.ts";
import { Lobby } from "../utils/types.ts";

export interface Request {
}

export interface Response {
	lobbies: Lobby[];
}

export async function run(
	ctx: ScriptContext,
	req: Request,
): Promise<Response> {
	// TODO: Cache this without hitting the DO

  const { lobbies } = await ctx.actors.lobbyManager.getOrCreateAndCall<undefined, ListLobbiesRequest, ListLobbiesResponse>(
    "default",
    undefined,
    "listLobbies",
    {}
  );

	return { lobbies };
}

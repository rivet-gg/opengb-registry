import { Config, LobbyConfig } from "../config.ts";
import { deepMerge } from "https://deno.land/std@0.224.0/collections/deep_merge.ts";

export interface Lobby {
	id: string;
	version: string;
	tags: Record<string, string>;

	createdAt: number;
	readyAt?: number;
	/**
	 * Timestamp at which the last player left the lobby.
	 */
	emptyAt?: number;

	players: Map<string, Player>;

	maxPlayers: number;
    maxPlayersDirect: number;

	serverId: string;
}

export interface Player {
	id: string;
	lobbyId: string;
	createdAt: number;
	connectedAt?: number;
	publicIp?: string;
}

export interface PlayerWithToken extends Player {
	token: string;
}

export type PlayerRequest = Record<never, never>;

export function getLobbyConfig(userConfig: Config, lobbyTags: Record<string, string>): LobbyConfig {
	let lobbyConfig = userConfig.lobbies;

    // Apply rules
    for (const rule of userConfig.lobbyRules) {
        if (lobbyTagsMatch(rule.tags, lobbyTags)) {
            lobbyConfig = deepMerge<LobbyConfig>(lobbyConfig, rule.config);
        }
    }

    return lobbyConfig;
}

/**
 * Check if a lobby with the given tags matches a query.
 */
export function lobbyTagsMatch(query: Record<string, string>, target: Record<string, string>): boolean {
	for (const key in query) {
		if (target[key] != query[key]) return false;
	}
	return true;
}

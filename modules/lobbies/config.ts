export interface Config {
    lobbies: LobbyConfig,
    lobbyRules: LobbyRule[],
	players: {
		maxPerIp?: number;
		maxUnconnected?: number;
		unconnectedExpireAfter: number;
		autoDestroyAfter?: number;
	}
}

export interface LobbyRule {
    tags: Record<string, string>,
    config: Partial<LobbyConfig>,
}

export interface LobbyConfig extends Record<PropertyKey, unknown> {
    destroyOnEmptyAfter?: number | null;
    unreadyExpireAfter: number;
    maxPlayers: number;
    maxPlayersDirect: number;
    enableDynamicMaxPlayers?: PlayerRange,
    enableDynamicMaxPlayersDirect?: PlayerRange,
    enableCreate: boolean,
    enableDestroy: boolean,
    enableFind: boolean,
    enableFindOrCreate: boolean,
    enableJoin: boolean,
    enableList: boolean,
}

export interface PlayerRange {
    min: number,
    max: number,
}

import { ProviderEndpoints } from "../config.ts";
import { RuntimeError, ScriptContext } from "../module.gen.ts";

/**
 * The token type that designates that this is a flow token
 */
const FLOW_TYPE = "auth_oauth_flow";

/**
 * Number of seconds after flow start that the flow will cease to be valid.
 *
 * This is currently hardcoded to 30 minutes, but it may be configurable in the
 * future.
 */
const FLOW_EXPIRE_TIME = 30 * 60;

/**
 * Calculates when the flow should expire using the current server time.
 *
 * Leap seconds are not accounted for because they really don't matter.
 *
 * @returns The `Date` object for when the flow should expire.
 */
function getExpiryTime() {
	const expiryTimeMs = Date.now() + FLOW_EXPIRE_TIME * 1000;
	return new Date(expiryTimeMs);
}

/**
 * @param ctx The ScriptContext with which to call tokens.create
 * @returns A flow token (TokenWithSecret) with the correct meta and expiry
 * time, the flow ID, and the expiry time.
 */
export async function createFlowToken(ctx: ScriptContext) {
    const flowId = crypto.randomUUID();
	const expiry = getExpiryTime();
	const { token } = await ctx.modules.tokens.create({
		type: FLOW_TYPE,
		meta: { flowId },
		expireAt: expiry.toISOString(),
	});
	return { token, flowId, expiry };
}

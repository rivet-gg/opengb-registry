import { RuntimeError } from "../_gen/mod.ts";
import { ScriptContext } from "../_gen/scripts/get.ts";
import { User } from "../types/common.ts";
import { TokenWithSecret } from "../../tokens/types/common.ts";


export interface Request {
	username: string;
	identity: IdentityType;
}

export interface Response {
	user: User;
	token: TokenWithSecret;
}

export type IdentityType = { guest: IdentityTypeGuest };

export type IdentityTypeGuest = Record<string, never>;

export async function run(
	ctx: ScriptContext,
	req: Request,
): Promise<Response> {
	await ctx.modules.rateLimit.throttle({ requests: 2, period: 5 * 60 });

	// Configure identity
	let identitiesCreate;
	if (req.identity.guest) {
		identitiesCreate = {
			identityGuest: {
				create: {},
			},
		};
	} else {
		throw new RuntimeError("UNKNOWN_IDENTITY_TYPE");
	}

	// Create user
	const user = await ctx.db.user.create({
		data: {
			username: req.username,
			identities: {
				create: identitiesCreate,
			},
		},
	});

	// Create token
	const { token } = await ctx.modules.tokens.create({
		type: "user",
		meta: { userId: user.id },
		expireAt: new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)).toISOString(),
	});

	return {
		user,
		token,
	};
}

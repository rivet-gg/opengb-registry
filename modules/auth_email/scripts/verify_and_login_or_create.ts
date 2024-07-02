import { ScriptContext } from "../module.gen.ts";
import { PROVIDER_INFO } from "../utils/provider.ts";

export interface Request {
	verificationId: string;
	code: string;
}

export interface Response {
	userToken: string;
}

export async function run(
	ctx: ScriptContext,
	req: Request,
): Promise<Response> {
	await ctx.modules.rateLimit.throttlePublic({});

    const { email } = await ctx.modules.authEmail.verifyCode({
        verificationId: req.verificationId,
        code: req.code,
    });

    return await ctx.modules.authProviders.getOrCreateUserFromProvider({
        info: PROVIDER_INFO,
        uniqueData: {
            identifier: email,
        },
        additionalData: {},
    });
}

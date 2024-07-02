import { Empty, ScriptContext } from "../module.gen.ts";
import { PROVIDER_INFO } from "../utils/provider.ts";

export interface Request {
	verificationId: string;
	code: string;
    userToken: string;
}

export type Response = Empty;

export async function run(
	ctx: ScriptContext,
	req: Request,
): Promise<Response> {
	await ctx.modules.rateLimit.throttlePublic({});

    const { email } = await ctx.modules.authEmail.verifyCode({
        verificationId: req.verificationId,
        code: req.code,
    });

    await ctx.modules.authProviders.addProviderToUser({
        userToken: req.userToken,
        info: PROVIDER_INFO,
        uniqueData: {
            identifier: email,
        },
        additionalData: {},
    });

    return {};
}

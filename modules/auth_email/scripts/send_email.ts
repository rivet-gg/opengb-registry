import { RuntimeError } from "../module.gen.ts";
import { ScriptContext } from "../module.gen.ts";
import { Verification } from "../utils/types.ts";

export interface Request {
	email: string;
	userToken?: string;
}

export interface Response {
	verification: Verification;
}

export async function run(
	ctx: ScriptContext,
	req: Request,
): Promise<Response> {
	await ctx.modules.rateLimit.throttlePublic({});

	// Create verification
	const code = generateCode();
	const maxAttemptCount = 3;
	const expiration = 60 * 60 * 1000;
	const verification = await ctx.db.verifications.create({
		data: {
			email: req.email,
			code,
			maxAttemptCount,
			expireAt: new Date(Date.now() + expiration),
		},
		select: { id: true },
	});


	console.log(ctx.config);
	// Send email
	await ctx.modules.email.sendEmail({
		from: {
			email: ctx.config.fromEmail ?? "hello@test.com",
			name: ctx.config.fromName ?? "Authentication Code",
		},
		to: [{ email: req.email }],
		subject: "Your verification code",
		text: `Your verification code is: ${code}`,
		html: `Your verification code is: <b>${code}</b>`,
	});

	return { verification };
}

function generateCode(): string {
	const length = 8;
	const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
	let result = "";
	for (let i = 0; i < length; i++) {
		result += characters.charAt(Math.floor(Math.random() * characters.length));
	}
	return result;
}

import { RuntimeError, ScriptContext } from "../module.gen.ts";

export interface Request {
	verificationId: string;
	code: string;
}

export interface Response {
	email: string;
	completedAt: Date;
}

export async function run(
	ctx: ScriptContext,
	req: Request,
): Promise<Response> {
	await ctx.modules.rateLimit.throttlePublic({});

	const code = req.code.toUpperCase();

	return await ctx.db.$transaction(async (tx) => {
		const verification = await tx.verifications.update({
			where: {
				id: req.verificationId,
			},
			data: {
				attemptCount: {
					increment: 1,
				},
			},
			select: {
				email: true,
				code: true,
				expireAt: true,
				completedAt: true,
				attemptCount: true,
				maxAttemptCount: true,
			},
		});
		if (!verification) {
			throw new RuntimeError("verification_code_invalid");
		}
		if (verification.attemptCount >= verification.maxAttemptCount) {
			throw new RuntimeError("verification_code_attempt_limit");
		}
		if (verification.completedAt !== null) {
			throw new RuntimeError("verification_code_already_used");
		}
		if (verification.code !== code) {
			// Same error as above to prevent exploitation
			throw new RuntimeError("verification_code_invalid");
		}
		if (verification.expireAt < new Date()) {
			throw new RuntimeError("verification_code_expired");
		}

		const completedAt = new Date();

		// Mark as used
		const verificationConfirmation = await tx.verifications
			.update({
				where: {
					id: req.verificationId,
					completedAt: null,
				},
				data: {
					completedAt,
				},
			});
		if (verificationConfirmation === null) {
			throw new RuntimeError("verification_code_already_used");
		}

		return {
			email: verificationConfirmation.email,
			completedAt,
		};
	});
}

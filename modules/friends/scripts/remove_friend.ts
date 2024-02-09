import { Context } from "@ogs/runtime";

export interface Request {
	userToken: string;
	targetUserId: string;
}

export interface Response {
}

export async function handler(ctx: Context, req: Request): Promise<Response> {
	await ctx.call("rate_limit", "throttle", { requests: 50 });
	const { userId } = await ctx.call("users", "validate_token", {
		userToken: req.userToken,
	}) as any;

	const [userIdA, userIdB] = [userId, req.targetUserId].sort();

	let updateQuery = await ctx.postgres.run((conn) =>
		conn.queryObject`
        UPDATE friends
        SET removed_at = timezone('utc', now())
        WHERE user_id_a = ${userIdA} AND user_id_b = ${userIdB} AND removed_at IS NULL
        RETURNING 1
    `
	);
	if (updateQuery.rowCount === 0) {
		throw new Error("Friend does not exist");
	}

	return {};
}

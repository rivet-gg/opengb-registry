import { ScriptContext } from "../_gen/scripts/list_incoming_friend_requests.ts";
import { FriendRequest, friendRequestFromRow } from "../types/common.ts";

export interface Request {
	userToken: string;
}

export interface Response {
	friendRequests: FriendRequest[];
}

export async function run(
	ctx: ScriptContext,
	req: Request,
): Promise<Response> {
	await ctx.modules.rateLimit.throttlePublic({ requests: 50 });

	const { userId } = await ctx.modules.users.authenticateUser({
		userToken: req.userToken,
	});

	const rows = await ctx.db.friendRequest.findMany({
		where: {
			targetUserId: userId,
			acceptedAt: null,
			declinedAt: null,
		},
		orderBy: {
			createdAt: "desc",
		},
		take: 100,
	});

	const friendRequests = rows.map(friendRequestFromRow);

	return { friendRequests };
}

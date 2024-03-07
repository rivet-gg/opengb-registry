import {
	RuntimeError,
	ScriptContext,
} from "../_gen/scripts/decline_request.ts";

export interface Request {
	userToken: string;
	friendRequestId: string;
}

export type Response = Record<string, never>;

export async function run(
	ctx: ScriptContext,
	req: Request,
): Promise<Response> {
	await ctx.modules.rateLimit.throttle({ requests: 50 });

	const { userId } = await ctx.modules.users.validateToken({ userToken: req.userToken });

	await ctx.db.$transaction(async (tx) => {
		// Lock & validate friend request
		interface FriendRequestRow {
			senderUserId: string;
			targetUserId: string;
			acceptedAt: Date | null;
			declinedAt: Date | null;
		}
		const friendRequests = await tx.$queryRaw<FriendRequestRow[]>`
			SELECT "senderUserId", "targetUserId", "acceptedAt", "declinedAt"
			FROM "FriendRequest"
			WHERE "id" = ${req.friendRequestId}
			FOR UPDATE
		`;
		const friendRequest = friendRequests[0];
		if (!friendRequest) {
			throw new RuntimeError("FRIEND_REQUEST_NOT_FOUND", {
				meta: { friendRequestId: req.friendRequestId },
			});
		}
		if (friendRequest.targetUserId !== userId) {
			throw new RuntimeError("NOT_FRIEND_REQUEST_RECIPIENT", {
				meta: { friendRequestId: req.friendRequestId },
			});
		}
		if (friendRequest.acceptedAt) {
			throw new RuntimeError("FRIEND_REQUEST_ALREADY_ACCEPTED", {
				meta: { friendRequestId: req.friendRequestId },
			});
		}
		if (friendRequest.declinedAt) {
			throw new RuntimeError("FRIEND_REQUEST_ALREADY_DECLINED", {
				meta: { friendRequestId: req.friendRequestId },
			});
		}

		// Decline the friend request
		await tx.friendRequest.update({
			where: {
				id: req.friendRequestId,
			},
			data: {
				declinedAt: new Date(),
			},
		});
	});

	return {};
}

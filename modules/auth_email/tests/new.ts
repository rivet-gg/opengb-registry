import { test, TestContext } from "../module.gen.ts";
import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { faker } from "https://deno.land/x/deno_faker@v1.0.3/mod.ts";

test("Log in with New User", async (ctx: TestContext) => {
	const fakeEmail = faker.internet.email();


    let userId: string;

	// Sign up with a new user
    {
        const authRes = await ctx.modules.authEmail.sendEmail({ email: fakeEmail });
    
        // Look up correct code
        const { code } = await ctx.db.verifications
            .findFirstOrThrow({
                where: {
                    id: authRes.verification.id,
                },
            });
    
        // Now by verifying the email, we register, and can also use
        // this to verify the token
        const { userToken } = await ctx.modules.authEmail.verifyAndLoginOrCreate({
            verificationId: authRes.verification.id,
            code: code,
        });
    
        const authenticateRes = await ctx.modules.users.authenticateToken({
            userToken: userToken,
        });

        userId = authenticateRes.userId;
    }

    // Try signing in again, should get the same user
    {
        const authRes = await ctx.modules.authEmail.sendEmail({ email: fakeEmail });
    
        // Look up correct code
        const { code } = await ctx.db.verifications
            .findFirstOrThrow({
                where: {
                    id: authRes.verification.id,
                },
            });

        const { userToken } = await ctx.modules.authEmail.verifyAndLoginOrCreate({
            verificationId: authRes.verification.id,
            code: code,
        });
    
        const authenticateRes = await ctx.modules.users.authenticateToken({
            userToken: userToken,
        });

        // Assert the user is the same
        assertEquals(authenticateRes.userId, userId);
    }
});

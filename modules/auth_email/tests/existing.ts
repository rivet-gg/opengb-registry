import { test, TestContext } from "../module.gen.ts";
import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { faker } from "https://deno.land/x/deno_faker@v1.0.3/mod.ts";

test("Log in with Existing User", async (ctx: TestContext) => {
	const fakeEmail = faker.internet.email();

    const { user } = await ctx.modules.users.create({});
    const { token: { token: userToken } } = await ctx.modules.users.createToken({ userId: user.id });

    // Associate the user we just created with this email
    await ctx.modules.authProviders.addProviderToUser({
        userToken,
        info: {
            providerType: "email",
            providerId: "passwordless",
        },
        uniqueData: {
            identifier: fakeEmail,
        },
        additionalData: {},
    });

	// Sign in with this user
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

        // This should be the user we created at the beginning
        assertEquals(authenticateRes.userId, user.id);
    }
});

import { assertExists } from "https://deno.land/std@0.208.0/assert/assert_exists.ts";
import { test, TestContext } from "../module.gen.ts";
import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { faker } from "https://deno.land/x/deno_faker@v1.0.3/mod.ts";

test("Log in with Existing User", async (ctx: TestContext) => {
	const fakeEmail = faker.internet.email();

    const { user } = await ctx.modules.users.create({});
    const { token: { token: userToken } } = await ctx.modules.users.createToken({ userId: user.id });

	// Sign in with this email and add to the existing user
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
        await ctx.modules.authEmail.verifyAndAdd({
            userToken,
            verificationId: authRes.verification.id,
            code: code,
        });
    
        const authenticateRes = await ctx.modules.users.authenticateToken({
            userToken: userToken,
        });

        // This should be the user we created at the beginning
        assertEquals(authenticateRes.userId, user.id);
    }

    // Get the providers associated with the user
    const { providers: [emailProvider] } = await ctx.modules.authProviders.listProviders({ userToken });
    assertEquals(emailProvider, { providerType: "email", providerId: "passwordless" });

    // Verify that the provider data is correct
    const { data } = await ctx.modules.authProviders.getProviderData({
        userToken,
        info: emailProvider,
    });

    assertExists(data);

    const { uniqueData, additionalData } = data;
    assertEquals(uniqueData, { identifier: fakeEmail });
    assertEquals(additionalData, {});
});

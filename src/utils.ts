export const wellKnownOAuthConfigSchema = z.object({
	issuer: z.string(),
	authorization_endpoint: z.string(),
	token_endpoint: z.string(),
	registration_endpoint: z.string().optional(),
});

export async function readWellKnownConfiguration(issuerUrl: string) {
	const wellKnownUrl = new URL(".well-known/openid-configuration", issuerUrl);

	const response = await fetch(wellKnownUrl.toString(), {
		headers: {
			Accept: "application/json",
		},
	});

	if (!response.ok) {
		throw new Error(`Failed to fetch well-known configuration from ${wellKnownUrl.toString()}`);
	}

	const body = await response.json();
	const responseParseResult = wellKnownOAuthConfigSchema.safeParse(body);

	if (!responseParseResult.success) {
		throw new Error("Received invalid well-known OAuth server configuration");
	}

	return responseParseResult.data;
}

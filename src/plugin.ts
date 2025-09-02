import * as limbo from "@limbo-chat/api";
import { Client, Session, type Tool as MCPTool } from "better-mcp-client";
import { HttpTransport, FetchAdapter } from "better-mcp-client/http";

function getMCPServerUrls() {
	const urls = limbo.settings.get<string>("mcp_servers");

	if (!urls) {
		return [];
	}

	return urls.split("\n").filter((url) => url.trim() !== "");
}

function createClientForMcpUrl(mcpServerUrl: string) {
	return new Client({
		info: {
			name: "limbo-mcp",
			title: "Limbo MCP",
			version: "0.0.1",
		},
		transport: new HttpTransport({
			url: mcpServerUrl,
			adapter: new FetchAdapter(),
		}),
	});
}

function convertMcpToolToLimbo(session: Session, mcpTool: MCPTool): limbo.Tool {
	return {
		id: mcpTool.name,
		description: mcpTool.description ?? "No description",
		schema: mcpTool.inputSchema,
		execute: async ({ toolCall }) => {
			const result = await session.callTool({
				name: mcpTool.name,
				arguments: toolCall.arguments,
			});

			// todo, maybe validate output schema if available and needed by the protocol
			// todo, convert the response to text

			console.log(result.content);

			return "";
		},
	};
}

async function registerToolsFromMcpServer(mcpServerUrl: string) {
	const client = createClientForMcpUrl(mcpServerUrl);

	const session = new Session({
		client,
	});

	await session.initialize();

	// do all servers implement this method?
	// is there a way to tell?
	// await session.sendInitializedNotification();

	const listToolsResult = await session.listTools();

	const mcpTools = listToolsResult.tools;

	for (const mcpTool of mcpTools) {
		const limboTool = convertMcpToolToLimbo(session, mcpTool);

		limbo.tools.register(limboTool);

		registeredToolIds.add(limboTool.id);
	}
}

let registeredToolIds = new Set<string>();

export default {
	onActivate: async () => {
		limbo.settings.register({
			id: "mcp_servers",
			type: "text",
			variant: "multiline",
			label: "MCP Servers",
			description: "List one MCP server URL per line",
		});

		const mcpServerUrls = getMCPServerUrls();

		await Promise.allSettled(
			mcpServerUrls.map((mcpServerUrl) => registerToolsFromMcpServer(mcpServerUrl))
		);

		limbo.commands.register({
			id: "reload-tools",
			name: "Reload tools",
			execute: async () => {
				for (const toolId of registeredToolIds) {
					console.log(`Unregistering tool: ${toolId}`);

					limbo.tools.unregister(toolId);
				}

				registeredToolIds.clear();

				await Promise.allSettled(
					mcpServerUrls.map((mcpServerUrl) => registerToolsFromMcpServer(mcpServerUrl))
				);
			},
		});
	},
} satisfies limbo.Plugin;

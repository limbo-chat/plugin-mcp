import * as limbo from "limbo";

export function activate() {
	limbo.hooks.onBeforeGenerateText(({ promptBuilder }) => {
		promptBuilder.addTool({
			id: "generate-image",
			description: "generate an image",
			execute: () => {
				console.log("generating an image");
			},
		});
	});
}

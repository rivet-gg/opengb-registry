import * as path from "std/path/mod.ts";
import { parse } from "std/yaml/mod.ts";
import Ajv from "ajv";
import { glob } from "glob";
import tjs from "typescript-json-schema";

// TODO: Clean this up
import { fileURLToPath } from "node:url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const moduleConfigAjv = new Ajv.default({
	schemas: [generateModuleConfigJsonSchema()],
});

export class Registry {
	public static async load(): Promise<Registry> {
		let rootPath = path.join(__dirname, "..", "..");

		console.log("Loading registry", rootPath);

		let modPaths = await glob("modules/*/module.yaml", { cwd: rootPath });
		let modules = new Map();
		for (let mod of modPaths) {
			let modName = path.basename(path.dirname(mod));
			modules.set(
				modName,
				await Module.load(path.join(rootPath, path.dirname(mod)), modName),
			);
		}
		return new Registry(rootPath, modules);
	}

	private constructor(
		public path: string,
		public modules: Map<string, Module>,
	) {}
}

export interface ModuleConfig {
	metadata: ModuleMetadata;
	scripts: { [name: string]: ScriptConfig };
}

export interface ModuleMetadata {
	status: "preview" | "beta" | "stable" | "deprecated";
	description: string;

	/**
	 * The GitHub handle of the authors of the module.
	 */
	authors: string[];
}

export interface ScriptConfig {
}

export class Module {
	public static async load(modulePath: string, name: string): Promise<Module> {
		console.log("Loading module", modulePath);

		// Read config
		let configRaw = await Deno.readTextFile(
			path.join(modulePath, "module.yaml"),
		);
		let config = parse(configRaw) as ModuleConfig;

		// Validate config
		let moduleConfigSchema = moduleConfigAjv.getSchema(
			"#/definitions/ModuleConfig",
		);
		if (!moduleConfigSchema) {
			throw new Error("Failed to get module config schema");
		}
		if (!moduleConfigSchema(config)) {
			throw new Error(
				`Invalid module config: ${JSON.stringify(moduleConfigSchema.errors)}`,
			);
		}

		// Read scripts
		let scripts = new Map();
		for (let scriptName in config.scripts) {
			let scriptPath = path.resolve(modulePath, "scripts", scriptName + ".ts");
			scripts.set(
				scriptName,
				new Script(scriptPath, scriptName, config.scripts[scriptName]),
			);
		}

		return new Module(modulePath, name, config, scripts);
	}

	private constructor(
		public path: string,
		public name: string,
		public config: ModuleConfig,
		public scripts: Map<string, Script>,
	) {}

	public get dbName(): string {
		return `module_${this.name}`;
	}
}

export class Script {
	public requestSchema?: tjs.Definition;
	public responseSchema?: tjs.Definition;

	public constructor(
		public path: string,
		public name: string,
		public config: ScriptConfig,
	) {}
}

function generateModuleConfigJsonSchema(): tjs.Definition {
	console.log("Generating registry.ts schema");

	// https://docs.deno.com/runtime/manual/advanced/typescript/configuration#what-an-implied-tsconfigjson-looks-like
	const DEFAULT_COMPILER_OPTIONS = {
		"allowJs": true,
		"esModuleInterop": true,
		"experimentalDecorators": false,
		"inlineSourceMap": true,
		"isolatedModules": true,
		"jsx": "react",
		"module": "esnext",
		"moduleDetection": "force",
		"strict": true,
		"target": "esnext",
		"useDefineForClassFields": true,

		"lib": ["esnext", "dom", "dom.iterable"],
		"allowImportingTsExtensions": true,
	};

	let schemaFiles = [__filename];

	const program = tjs.getProgramFromFiles(
		schemaFiles,
		DEFAULT_COMPILER_OPTIONS,
	);

	const schema = tjs.generateSchema(program, "ModuleConfig", {
		topRef: true,
		required: true,
		strictNullChecks: true,
		noExtraProps: true,
		esModuleInterop: true,

		// TODO: Is this needed?
		include: schemaFiles,

		// TODO: Figure out how to work without this? Maybe we manually validate the request type exists?
		ignoreErrors: true,
	});
	if (schema == null) throw new Error("Failed to generate schema");

	return schema;
}

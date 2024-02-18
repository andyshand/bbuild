import { TsConfigJson } from "type-fest";
import { readJSON, writeJSON } from "../json";
import path from "path";

export class TSConfigHelper {

    private config: TsConfigJson | null;
    private configPath: string | null;

    public async loadConfig(path: string) {
        this.config = await readJSON(path);
        this.configPath = path;
        return this;
    }

    public async saveConfig() {
        if (this.configPath) {
            await writeJSON(this.configPath, this.config);
        } else {
            throw new Error("No config loaded");
        }
        return this;
    }

    public getConfig() {
        return this.config;
    }

    public addReference(filepath: string) {
        if (!this.config.references) {
            this.config.references = [];
        }

        const index = this.config.references.findIndex(r => r.path === filepath);

        if (index === -1) {
            this.config.references.push({
                path: filepath
            });    
        }

        return this;
    }

    public removeReference(filepath: string) {
        if (this.config.references) {
            const index = this.config.references.findIndex(r => r.path === filepath);
  
            if (index > -1) {
              this.config.references.splice(index, 1);
            }
        }
        return this;
    }

    public addPaths(filepath: string, module: string) {
        if (!this.config.compilerOptions.paths) {
            this.config.compilerOptions.paths = {};
        }

        this.config.compilerOptions.paths[`modules/${module}/*`] = [
            path.join(filepath, module, 'src', '*')
        ];

        this.config.compilerOptions.paths[`modules/${module}`] = [
            path.join(filepath, module, 'src', 'index')
        ];

        return this;
    }
}
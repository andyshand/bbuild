import fse from "fs-extra";
import path from "path";
import md5 from "md5";
import decompress from "decompress";
import {homedir} from "os";

const modulesToNativeDependencies = new Map<string, NativeDependency>();

type NativeDependency = {
    name: string,
    tarPath: string,
    hash: string,
    universalPath: string
}

export function getNativeDependencies(
    moduleName: string
): NativeDependency | undefined {

    return modulesToNativeDependencies.get(moduleName);
}


/**
 * Install native dependencies in the root ~/.universe/bbuild
 * The native dependencies and underlying AI models can be quite large (up to multiple GB).
 * We want these in a single location that can be referenced from anywhere
 */
export async function installNativeDependencies(
    modules: {name: string, path:string}[]
) {
    console.log('Installing native dependencies...')
    for (let module of modules) {
        const moduleNativePath = path.join(module.path, 'native');

        if(!await directoryExists(moduleNativePath)) {
            continue;
        }

        const nativeDependency = await getNativeDependency(moduleNativePath);

        await installAtUniversalPath(nativeDependency);

        modulesToNativeDependencies.set(module.name, nativeDependency)
    }
    console.log('Native dependency installation complete.')
}




async function getNativeDependency(
    moduleNativePath: string
): Promise<NativeDependency> {

    const paths = await fse.readdir(moduleNativePath);

    const tarPath = path.join(moduleNativePath, paths.find(_path => isCompressed(_path)));

    if(tarPath == undefined) {
        throw new Error(`Default modules with a './native' directory must bundle a compressed native dependency file.`);
    }

    // Provisionally take name of compressed file as dependency name. Later add optional .json file to explicitly define this. (TODO)
    const name = path.basename(tarPath).split(".")[0];

    const tarFile = await fse.readFile(tarPath, {encoding: "utf-8"});
    const hash = md5(tarFile);
    const universalPath = path.join(homedir(), ".universe", "bbuild", "native-dependencies", name, hash);

    return {
        name,
        tarPath,
        hash,
        universalPath
    }
}

async function installAtUniversalPath(
    nativeDependency: NativeDependency
) {
    if(await directoryExists(nativeDependency.universalPath)) {
        // Make this transactional. Regardless of when the process is killed, there should never be a 'dirty' state where the directory exists but doesn't contain all files. (TODO)
        return;
    }

    await fse.ensureDir(nativeDependency.universalPath);

    return await decompress(
        nativeDependency.tarPath,
        nativeDependency.universalPath,
        {
            strip: 0 // Extract while preserving existing compressed file.
        }
    );
}

function isCompressed(_path: string): boolean {
    const compressedExtensions = ['.tar', '.tar.gz', '.tgz', '.gz'];
    const fileExtension = path.extname(_path);
    return compressedExtensions.includes(fileExtension);
}

async function directoryExists(_path: string) {
    return (await fse.exists(_path))
    && (await fse.stat(_path)).isDirectory()
}
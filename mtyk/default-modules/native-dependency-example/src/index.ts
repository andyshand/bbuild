import {exec as execute} from "shelljs";
import * as path from "path";


export class NativeDependencyExample {
    executeNativeDependency() {

        const location = "./native";
        const command = path.join(location, "main");

        return new Promise((resolve, reject) =>
            execute(command, {}, (code, stdout, stderr) => {
                if (code === 0) {
                    console.log(stdout);
                    resolve(stdout);
                } else {
                    reject(stderr);
                }
            })
        );
    }

}

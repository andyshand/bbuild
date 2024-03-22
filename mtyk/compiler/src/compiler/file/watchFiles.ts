import fs from "fs";
import watch from "node-watch";
import path from "path";
import { Observable, Subject } from "rxjs";

export function watchFiles(watchFiles = [], cwd = ".") {
  const subject = new Subject<string>();

  if (watchFiles.length === 0) {
    return new Observable<string>();
  }

  watchFiles.forEach((file) => {
    const resolvedFilePath = path.resolve(cwd, file);
    const exists = fs.existsSync(resolvedFilePath);
    try {
      if (!exists) {
        throw new Error(`File does not exist: ${resolvedFilePath}`);
      }
      watch(
        resolvedFilePath,
        {
          recursive: true,
          filter: (f) => {
            // Exclude certain files or directories
            return !f.endsWith(".map") && !f.endsWith(".d.ts");
          },
        },
        (evt, name) => {
          if (name) {
            subject.next(name);
          }
        }
      );
    } catch (e) {
      console.warn(`Failed to watch file: ${resolvedFilePath}`);
    }
  });

  return subject.asObservable();
}

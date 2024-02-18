import watch from "node-watch";
import { Observable, Subject } from "rxjs";
import path from "path";

export function watchFiles(watchFiles = [], cwd = ".") {
  const subject = new Subject<string>();

  if (watchFiles.length === 0) {
    return new Observable<string>();
  }

  watchFiles.forEach((file) => {
    const resolvedFilePath = path.resolve(cwd, file);
    watch(
      resolvedFilePath,
      {
        recursive: true,
        filter: (f) => {
          // Exclude certain files or directories
          return (
            !f.includes("node_modules") &&
            !f.endsWith(".map") &&
            !f.endsWith(".d.ts")
          );
        },
      },
      (evt, name) => {
        if (name) {
          subject.next(name);
        }
      }
    );
  });

  return subject.asObservable();
}

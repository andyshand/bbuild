import chalk from "chalk"
import { IPty } from "node-pty"
import { map, merge } from "rxjs"

import { Observable } from "rxjs"
import { spawnIt } from "./spawnIt"
function IEventToObservable<T>(event: (cb: (data: T) => void) => void) {
	return new Observable<T>((subscriber) => {
		event((data) => subscriber.next(data))
	})
}

/**
 * Adapted from universe-build, missing features
 */
export function spawnToObservable(
	child: IPty,
	filter: RegExp[] = [],
	color: string,
	name: string,
	cmd: string,
	quiet?: boolean,
) {
	return merge(
		IEventToObservable(child.onData).pipe(
			// map((data) =>
			//   replaceStrOverLines(
			//     data.toString(),
			//     /\(node:[0-9]+\) Warning: Accessing non-existent property 'tracing' of module exports inside circular dependency/g,
			//     ''
			//   )
			// ),
			map((data) => data.split("\n")),
		),
	).pipe(
		map((data) =>
			data
				.filter((l) => {
					if (l.trim() === "") {
						return false
					}
					if (filter.some((f) => f.test(l))) {
						return false
					}
					return true
				})
				.map((line) => chalk.hex(color)(`[${chalk.bold(name ?? cmd)}]`) + ` ${line}`),
		),
		map((data) => data.join("\n")),
	)
}

export function spawnObservableTask(task: {
	cmd: string
	args: string[]
	cwd: string
	env: { [key: string]: string }
	name?: string
}) {
	return spawnToObservable(
		spawnIt({
			...task,
			watch: [],
		}),
		[],
		"#fff",
		task.name!,
		task.cmd,
		false,
	)
}

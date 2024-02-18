import { IPty } from "node-pty"
import { Subject } from "rxjs"
import { debounceTime, scan, startWith, switchMap, tap } from "rxjs/operators"
import { spawnIt } from "./spawnIt"
import { spawnToObservable } from "./spawnToObservable"

/**
 * Adapted from universe-build, missing features
 */
export function getTaskStream(task: {
	cmd: string
	args?: string[]
	cwd?: string
	env?: { [key: string]: string }
	name?: string
}) {
	const { cmd, args, name } = task

	const cwd = task.cwd ?? process.cwd()
	const env = { ...process.env, ...(task.env ?? {}) }

	let latestSpawnedChild: IPty | undefined
	const _spawnIt = () => {
		latestSpawnedChild = spawnIt({ cmd, args: args as any, cwd, watch: [], env: env as any, name })
		return latestSpawnedChild
	}

	const restartTrigger = new Subject<void>()

	const obs = restartTrigger.pipe(
		debounceTime(250),
		tap((maybeFile) => {
			if (typeof maybeFile === "string") {
				console.log(`Restart because file changed (possibly among others): ${maybeFile}`)
			}
		}),
		startWith(null),
		scan((child, _) => {
			child?.kill()
			return _spawnIt()
		}, _spawnIt()),
		switchMap((child) => spawnToObservable(child, [], "#fff", name, cmd, false)),
	)

	return {
		obs,
		getLatestSpawnedChild: () => latestSpawnedChild,
		restart: () => restartTrigger.next(),
	}
}

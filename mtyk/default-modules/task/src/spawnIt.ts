import { spawn } from "node-pty"

export function spawnIt({
	cmd,
	args,
	cwd,
	watch,
	env,
	name = cmd,
}: {
	cmd: string
	args: string[]
	cwd: string
	watch: string[]
	env?: { [x: string]: string }
	name?: string
}): any {
	console.log(`Starting task "${cmd} ${args.join(" ")}]" in ${cwd}, watching [${watch.join(",")}]`)
	const ipy = spawn(cmd, args, { cwd, env, cols: 80, rows: 30 })
	const resizeListener = () => {
		ipy.resize(process.stdout.columns, process.stdout.rows)
	}
	process.stdout.on("resize", resizeListener)
	ipy.onExit(({ exitCode, signal }) => {
		console.log(`Task "${name ?? cmd}" exited with code ${exitCode}`)
		process.stdout.removeListener("resize", resizeListener)
	})
	return ipy
}

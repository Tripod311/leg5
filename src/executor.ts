import { parentPort } from "worker_threads";
import { get_transferlist } from "./tools";
import AbortContext from "./abortContext";

const CheckDeadTimeout = 1000;

type CachedTask = {
	fn: (...args: any[]) => Promise<any>;
	argsList: string[]
};

class Executor {
	private task_cache: Map<string, CachedTask> = new Map();
	private terminated: boolean = false;
	private abortContext: AbortContext = new AbortContext();
	private timeout?: ReturnType<typeof setTimeout>;

	constructor () {
		parentPort?.on("message", this.handleMessage.bind(this));

		setTimeout(this.loop.bind(this), CheckDeadTimeout);
	}

	handleMessage (raw: unknown) {
		const message = raw as WorkerMessage;

		switch (message.command) {
			case "terminate":
				this.terminated = true;
				break;
			case "execute":
				this.execute(message.name, message.args as Record<string,any>, message.timeout as number, message.script as string, message.argsList as string[]);
				break;
			case "abort":
				this.abortContext.controller.abort(new Error("Aborted"));
				break;
		}
	}

	compile (name: string, script: string, argsList: string[]): CachedTask {
		if (!this.task_cache.has(name) || script !== undefined) {
			this.task_cache.set(name, {
				fn: eval(`(async function (AbortContext, ${(argsList as string[]).join(',')}) {
					${script}
				})`),
				argsList: argsList
			});
		}

		return this.task_cache.get(name) as CachedTask;
	}

	serialize_error(e: unknown) {
		if (e instanceof Error) {
			return { message: e.message, stack: e.stack, name: e.name };
		}
		return { message: String(e) };
	}

	async execute (name: string, args: Record<string, any>, timeout: number, script: string, argsList: string[]) {
		try {
			const cached = this.compile(name, script, argsList);

			if (timeout > 0) {
				this.timeout = setTimeout(() => {
					this.abortContext.controller.abort(new Error("Timeout"));
				}, timeout);
			}

			const orderedArgs = cached.argsList.map(argName => {
				return args[argName];
			});
			const result = await cached.fn(this.abortContext, ...orderedArgs);

			if (this.abortContext.controller.signal.aborted) {
				throw this.abortContext.controller.signal.reason ?? new Error("Aborted");
			}

			if (this.terminated) return;

			const transferlist = get_transferlist(result);

			parentPort?.postMessage({
				command: "finished",
				payload: result
			}, transferlist);
		} catch (e: unknown) {
			if (this.terminated) return;

			parentPort?.postMessage({
				command: "failed",
				error: this.serialize_error(e)
			});
		} finally {
			this.abortContext.reset();
		}
	}

	loop () {
		if (!this.terminated) {
			setTimeout(this.loop.bind(this), CheckDeadTimeout);
		}
	}
}

new Executor();
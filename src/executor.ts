import { parentPort } from "worker_threads";
import { get_transferlist } from "./tools";
import AbortContext from "./abortContext";

const CheckDeadTimeout = 1000;

class Executor {
	private task_cache: Map<string, (...args: any[]) => Promise<any>> = new Map();
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
				this.execute(message.name, message.script as string, message.argsList as string[], message.args as Record<string,any>, message.timeout as number);
				break;
			case "abort":
				this.abortContext.controller.abort(new Error("Requested abort"));
				break;
		}
	}

	compile (name: string, script: string, argsList: string[]) {
		if (!this.task_cache.has(name)) {
			this.task_cache.set(name, eval(`(async function (AbortContext, ${argsList.join(',')}) {
				${script}
			})`));
		}

		return this.task_cache.get(name);
	}

	serialize_error(e: unknown) {
		if (e instanceof Error) {
			return { message: e.message, stack: e.stack, name: e.name };
		}
		return { message: String(e) };
	}

	async execute (name: string, script: string, argsList: string[], args: Record<string, any>, timeout: number) {
		try {
			const fn = this.compile(name, script, argsList) as (...args: any[]) => Promise<any>;

			if (timeout > 0) {
				this.timeout = setTimeout(() => {
					this.abortContext.controller.abort(new Error("Task timed out"));
				}, timeout);
			}

			const result = await fn(this.abortContext, ...Object.values(args));

			if (this.abortContext.controller.signal.aborted) {
				throw this.abortContext.controller.signal.reason ?? new Error("Task aborted");
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
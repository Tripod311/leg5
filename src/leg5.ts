import fs from "fs";
import Thread from "./thread";
import Task from "./task";

export default class Leg5 {
	private static pool_size: number = 4;
	private static task_timeout: number = 0;
	private static abort_timeout: number = 1000;
	private static threads: Thread[] = [];

	private static task_map: Map<string, { script: string; argsList: string[]; }> = new Map();
	private static queue: Task[] = [];

	static setup (options?: Leg5Options) {
		if (options) {
			if (options.pool_size) {
				Leg5.pool_size = options.pool_size;
			}

			if (options.task_timeout) {
				Leg5.task_timeout = options.task_timeout;
			}

			if (options.abort_timeout) {
				Leg5.abort_timeout = options.abort_timeout;
			}
		}

		for (let i=0; i<Leg5.pool_size; i++) {
			Leg5.threads.push(new Thread(i, Leg5.abort_timeout, Leg5.pull_from_queue));
		}
	}

	static shutdown () {
		for (let i=0; i<Leg5.threads.length; i++) {
			Leg5.threads[i].shutdown();
		}
		Leg5.threads = [];
	}

	static async register_task (name: string, path: string, argsList: string[]) {
		if (Leg5.task_map.has(name)) {
			throw new Error(`Task ${name} is already registered`);
		}

		if (path.startsWith("code:")) {
			Leg5.task_map.set(name, {
				script: path.slice(5),
				argsList: argsList
			});
		} else {
			const code = await fs.promises.readFile(path, "utf-8");
			Leg5.task_map.set(name, {
				script: code,
				argsList: argsList
			});
		}
	}

	static unregister_task (name: string) {
		Leg5.task_map.delete(name);
	}

	static has_task (name: string): boolean {
		return Leg5.task_map.has(name);
	}

	static run_task (name: string, args?: Record<string, any>, override_timeout?: number): Task {
		const taskDescription = Leg5.task_map.get(name);

		if (taskDescription !== undefined) {
			const task = new Task(name, taskDescription.script, taskDescription.argsList, args || {}, override_timeout || Leg5.task_timeout);

			let freeThread = this.threads.find(t => !t.isBusy);

			if (freeThread !== undefined) {
				freeThread.run(task);
			} else {
				Leg5.queue.push(task);
			}

			return task;
		} else {
			throw new Error(`Task ${name} not found`);
		}
	}

	private static pull_from_queue (id: number) {
		if (Leg5.queue.length > 0) {
			const task = Leg5.queue.shift() as Task;

			Leg5.threads[id].run(task);
		}
	}
}
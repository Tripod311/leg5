import fs from "fs";
import Thread from "./thread";
import Task from "./task";

export default class Leg5 {
	private pool_size: number = 4;
	private task_timeout: number = 0;
	private abort_timeout: number = 1000;
	private threads: Thread[] = [];

	private task_map: Map<string, { script: string; argsList: string[]; }> = new Map();
	private queue: Task[] = [];

	setup (options?: Leg5Options) {
		if (options) {
			if (options.pool_size) {
				this.pool_size = options.pool_size;
			}

			if (options.task_timeout) {
				this.task_timeout = options.task_timeout;
			}

			if (options.abort_timeout) {
				this.abort_timeout = options.abort_timeout;
			}
		}

		for (let i=0; i<this.pool_size; i++) {
			this.threads.push(new Thread(i, this.abort_timeout, this.pull_from_queue.bind(this)));
		}
	}

	shutdown () {
		for (let i=0; i<this.threads.length; i++) {
			this.threads[i].shutdown();
		}
		this.threads = [];
	}

	async register_task (name: string, path: string, argsList: string[]) {
		if (this.task_map.has(name)) {
			throw new Error(`Task ${name} is already registered`);
		}

		if (path.startsWith("code:")) {
			this.task_map.set(name, {
				script: path.slice(5),
				argsList: argsList
			});
		} else {
			const code = await fs.promises.readFile(path, "utf-8");
			this.task_map.set(name, {
				script: code,
				argsList: argsList
			});
		}
	}

	unregister_task (name: string) {
		this.task_map.delete(name);
	}

	has_task (name: string): boolean {
		return this.task_map.has(name);
	}

	run_task (name: string, args?: Record<string, any>, override_timeout?: number): Task {
		const taskDescription = this.task_map.get(name);

		if (taskDescription !== undefined) {
			const task = new Task(name, taskDescription.script, taskDescription.argsList, args || {}, override_timeout || this.task_timeout);

			let freeThread = this.threads.find(t => !t.isBusy);

			if (freeThread !== undefined) {
				freeThread.run(task);
			} else {
				this.queue.push(task);
			}

			return task;
		} else {
			throw new Error(`Task ${name} not found`);
		}
	}

	private pull_from_queue (id: number) {
		if (this.queue.length > 0) {
			const task = this.queue.shift() as Task;

			this.threads[id].run(task);
		}
	}
}
import { Worker } from "worker_threads";
import { fileURLToPath } from 'url';
import path from "path";
import { get_transferlist } from "./tools";
import Task from "./task";

export default class Thread {
	private id: number;
	private abort_timeout: number;
	private onRelease: (id: number) => void;
	private known_tasks: Set<string> = new Set<string>();
	private currentTask: Task | null = null;
	private worker!: Worker;
	private timeout?: ReturnType<typeof setTimeout>;

	constructor (id: number, abort_timeout: number, onRelease: (id: number) => void) {
		this.id = id;
		this.abort_timeout = abort_timeout;
		this.onRelease = onRelease;

		this.create_worker();
	}

	shutdown () {
		this.worker.postMessage({
			command: "terminate"
		});

		this.timeout = setTimeout(() => {
			this.worker.terminate();
		}, this.abort_timeout);
	}

	create_worker () {
		this.known_tasks.clear();

		const workerPath = path.join(__dirname, 'executor.js');

		this.worker = new Worker(workerPath);

		this.worker.on("message", this.handle_message.bind(this));
		this.worker.on("error", this.handle_error.bind(this));
	}

	run (task: Task) {
		this.currentTask = task;
		this.currentTask.assign(this.abort.bind(this));

		const transferlist = get_transferlist(task.args);

		if (this.known_tasks.has(this.currentTask.name)) {
			this.worker.postMessage({
				command: "execute",
				name: this.currentTask.name,
				args: this.currentTask.args,
				timeout: this.currentTask.timeout
			}, transferlist);
		} else {
			this.known_tasks.add(this.currentTask.name)

			this.worker.postMessage({
				command: "execute",
				name: this.currentTask.name,
				script: this.currentTask.script,
				argsList: this.currentTask.argsList,
				args: this.currentTask.args,
				timeout: this.currentTask.timeout
			}, transferlist);
		}
	}

	abort () {
		this.worker.postMessage({
			command: "abort"
		});

		this.timeout = setTimeout(this.forceAbort.bind(this), this.abort_timeout);
	}

	handle_message (message: WorkerMessage) {
		clearTimeout(this.timeout);

		switch (message.command) {
			case "finished":
				this.currentTask?.finish(message.payload as any);
				this.currentTask = null;
				this.onRelease(this.id);
				break;
			case "failed":
				this.currentTask?.fail(message.error.message);
				this.currentTask = null;
				this.onRelease(this.id);
				break;
			case "aborted":
				this.currentTask?.fail(new Error("Aborted"));
				this.currentTask = null;
				this.onRelease(this.id);
				break;
		}
	}

	handle_error (err: Error) {
		this.currentTask?.fail(err);
		this.currentTask = null;
		this.onRelease(this.id);

		this.create_worker();
	}

	forceAbort () {
		this.worker.terminate();

		this.currentTask?.fail(new Error("Worker terminated"));

		this.create_worker();
	}

	forget_task (name: string) {
		this.known_tasks.delete(name);
	}

	get isBusy () {
		return this.currentTask !== null;
	}
}
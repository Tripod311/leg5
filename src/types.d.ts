type Leg5Options = {
	commonjs?: boolean;
	pool_size?: number;
	task_timeout?: number;
	abort_timeout?: number;
}

type WorkerMessage = {
	command: 'terminate';
} | {
	command: 'execute';
	name: string;
	script?: string;
	argsList?: string[];
	args: Record<string, any>;
	timeout: number;
} | {
	command: 'finished';
	payload: any;
} | {
	command: 'failed';
	error: Error
} | {
	command: 'abort';
} | {
	command: 'aborted';
}

type DeferredPromise = {
	resolve: (value: any | PromiseLike<any>) => void;
	reject: (error?: any) => void;
	promise: Promise<any>;
}
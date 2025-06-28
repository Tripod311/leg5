import { create_deferred_promise } from "./tools";

export default class Task {
	private _name: string;
	private _script: string;
	private _argsList: string[];
	private _args: Record<string, any>;
	private _timeout: number;
	private _canceled: boolean = false;
	private _cancelFunction?: () => void;
	private _promise: DeferredPromise;

	constructor (name: string, script: string, argsList: string[], args: Record<string, any>, timeout: number) {
		this._name = name;
		this._script = script;
		this._argsList = argsList;
		this._args = args;
		this._timeout = timeout;
		this._promise = create_deferred_promise();
	}

	get name (): string {
		return this._name;
	}

	get script (): string {
		return this._script;
	}

	get argsList (): string[] {
		return this._argsList;
	}

	get timeout (): number {
		return this._timeout;
	}

	get args (): any {
		return this._args
	}

	get promise (): Promise<any> {
		return this._promise.promise;
	}

	get canceled (): boolean {
		return this._canceled;
	}

	assign (cancelFunction: () => void) {
		this._cancelFunction = cancelFunction;
	}

	cancel () {
		if (!this._canceled) {
			this._canceled = true;
			if (this._cancelFunction) this._cancelFunction();
			this._promise.reject(new Error("Task canceled"));
		}
	}

	finish (result: any) {
		this._promise.resolve(result);
	}

	fail (reason: any) {
		this._promise.reject(reason);
	}
}
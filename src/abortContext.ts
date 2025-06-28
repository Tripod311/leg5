export default class AbortContext {
	private _aborted: boolean = false;
	private _controller: AbortController = new AbortController();

	get aborted (): boolean {
		return this._aborted;
	}

	get controller (): AbortController {
		return this._controller;
	}

	reset () {
		this._aborted = false;
		this._controller = new AbortController();
	}
}
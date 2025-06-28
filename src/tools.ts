export function get_transferlist (obj: any) {
	let result: ArrayBuffer[] = [];

	if (Array.isArray(obj)) {
		for (let i=0; i<obj.length; i++) {
			if (obj[i] instanceof ArrayBuffer) {
				result.push(obj[i]);
			} else if (Array.isArray(obj[i]) || (obj[i] !== null && typeof obj[i] === 'object')) {
				result = result.concat(get_transferlist(obj[i]));
			}
		}
	} else {
		for (let i in obj) {
			if (obj[i] instanceof ArrayBuffer) {
				result.push(obj[i]);
			} else if (Array.isArray(obj[i]) || (obj[i] !== null && typeof obj[i] === 'object')) {
				result = result.concat(get_transferlist(obj[i]));
			}
		}
	}

	return result;
}

export function create_deferred_promise (): DeferredPromise {
	let resolve!: (value: any | PromiseLike<any>) => void;
	let reject!: (error?: any) => void;

	const promise = new Promise<any>((res, rej) => {
		resolve = res;
		reject = rej;
	});

	return {
		resolve,
		reject,
		promise
	};
}
# Leg5

**Leg5** is a zero-dependency utility for concurrent task execution in Node.js using worker threads.
It provides a lightweight thread pool, dynamic task registration (from file or code), and full support for cancellation and timeouts.

---

## 🚀 Features

* 🧵 Built-in thread pool (configurable)
* 🔁 Reusable task registration
* 📄 Support for task scripts from source code or file
* ⏱ Timeout and cancellation support
* 💬 Zero dependencies

---

## 📦 Installation

```bash
npm install @tripod311/leg5
```

---

## 📜 Example Usage

```js
const Leg5 = require("@tripod311/leg5").default;

// setup thread pool
const instance = new Leg5();
instance.setup();

// register task from file
instance.register_task("heavyTask", "./myHeavyTask.js", ["arg1", "arg2"]);

// or register from source code
instance.register_task(
    "sumTask",
    `code: let sum = 0;
    for (let i = from; i <= to; i++) {
        sum += i;
    }
    return sum;`,
    ["from", "to"]
);

// run task
const sumTask = instance.run_task("sumTask", { from: -100000, to: 100000 });
const sumResult = await sumTask.promise;

try {
    // run task with timeout (optional). ArrayBuffers will be automatically added to transfer list.
    const heavyTask = instance.run_task("heavyTask", { arg1: "something", arg2: new ArrayBuffer(2048) }, 5000);
    const result = await heavyTask.promise;
} catch (e) {
    if (e.toString() === "Timeout") {
        console.log("Heavy task timed out");
    } else {
        console.error("Unexpected error:", e);
    }
}
```

---

## 📚 API Reference

### `new Leg5()`

Creates an instance of the Leg5 thread pool manager.

---

### `setup(options?: Leg5Options)`

Initializes worker threads.

**Options** (optional):

* `pool_size` *(number)* — number of workers to spawn (default: `4`)
* `task_timeout` *(number)* — default timeout for tasks in milliseconds (default: `0`, no timeout)
* `abort_timeout` *(number)* — how long to wait after abort before killing thread (default: `1000` ms)

---

### `register_task(taskName: string, path_or_code: string, argsList: string[])`

Registers a task that can be reused across multiple invocations.

* If `path_or_code` starts with `"code:"`, it will be treated as source code.
* Otherwise it should be a path to a `.js` file.

---

### `unregister_task(taskName: string)`

Removes a previously registered task.

---

### `has_task(taskName: string): boolean`

Returns `true` if task is registered, `false` otherwise.

---

### `run_task(taskName: string, args: Record<string, any>, override_timeout?: number): Task`

Executes a registered task with provided arguments.

**Returns:** a `Task` object.

---

## 🧱 Task

A wrapper for a single task execution.

### `task.promise`

A `Promise` that resolves with the task result, or rejects if:

* The task throws → rejected with error message
* The task is canceled → rejected with `"Canceled"`
* The task times out → rejected with `"Timeout"`

### `task.cancel()`

Manually aborts the task.

---

## 🔀 Inside Task: `AbortContext`

Every task gets an `AbortContext` injected as the first argument.
The task script is wrapped in an `async function`, so `await` and `import()` work out of the box.

### `AbortContext.controller`

Returns the `AbortController` assigned to the task.

### `AbortContext.aborted`

Boolean flag. Use this after any custom async operation to check if task was canceled.

---

## 🔐 Transferable Support

* You can pass `ArrayBuffer` or `SharedArrayBuffer` in arguments
* `ArrayBuffer` will be automatically added to the `transferList` to avoid copy
* `SharedArrayBuffer` is shared by default and doesn't need to be added manually

---

## License

MIT
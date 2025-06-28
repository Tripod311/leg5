const path = require("path");
const Leg5 = require("../dist/leg5.js").default;

describe("Basic task registration and run", () => {
    it("Register and run task from source code", async () => {
        const instance = new Leg5();

        instance.setup();

        await instance.register_task("source_task", `code:
            let sum = 0;

            for (let i=from; i<=to; i++) {
                sum += i;
            }

            return sum;
        `, ['from', 'to']);

        expect(instance.has_task("source_task")).toBeTruthy();

        const task = instance.run_task('source_task', { from: -100, to: 100 });

        expect(await task.promise).toBe(0);

        instance.shutdown();
    });

    it("Register and run task from source file", async () => {
        const instance = new Leg5();
        instance.setup();

        const source = path.resolve(__dirname, "testWorkerTask.js");

        await instance.register_task("file_task", source, ["numCount"]);

        expect(instance.has_task("file_task")).toBeTruthy();

        const task = instance.run_task("file_task", {numCount: 1024});

        const taskResult = await task.promise;

        expect(taskResult.someString).toBe("Buffer");
        expect(taskResult.result instanceof ArrayBuffer).toBeTruthy();
        expect(taskResult.result.byteLength).toBe(Int32Array.BYTES_PER_ELEMENT * 1024);

        instance.shutdown();
    });
})
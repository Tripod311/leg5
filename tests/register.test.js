const path = require("path");
const Leg5 = require("../dist/leg5.js").default;

describe("Basic task registration and run", () => {
    it("Register task from source code", async () => {
        await Leg5.register_task("source_task", `code:
            let sum = 0;

            for (let i=from; i<=to; i++) {
                sum += i;
            }

            return sum;
        `, ['from', 'to']);

        expect(Leg5.has_task("source_task")).toBeTruthy();
    });

    it("Run task and get result", async () => {
        Leg5.setup();

        const task = Leg5.run_task('source_task', { from: -100, to: 100 });

        expect(await task.promise).toBe(0);

        Leg5.shutdown();
    });

    it("Register task from source file", async () => {
        const source = path.resolve(__dirname, "testWorkerTask.js");

        await Leg5.register_task("file_task", source, ["numCount"]);

        expect(Leg5.has_task("file_task")).toBeTruthy();
    });

    it("Run task from source file", async () => {
        Leg5.setup();

        const task = Leg5.run_task("file_task", {numCount: 1024});

        const taskResult = await task.promise;

        expect(taskResult.someString).toBe("Buffer");
        expect(taskResult.result instanceof ArrayBuffer).toBeTruthy();
        expect(taskResult.result.byteLength).toBe(Int32Array.BYTES_PER_ELEMENT * 1024);

        Leg5.shutdown();
    });
})
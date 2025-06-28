const path = require("path");
const Leg5 = require("../dist/leg5.js").default;

describe("Test task cancellation", () => {
    it("Cancel task", async () => {
        Leg5.setup();

        await Leg5.register_task("sleep_task", `code:
            function sleep (ms) {
                return new Promise(resolve => setTimeout(resolve, ms));
            }

            await sleep(3000);

            return true;
        `, []);

        const task = Leg5.run_task("sleep_task");

        setTimeout(() => {
            task.cancel();
        }, 500);

        try {
            await task.promise;
        } catch (err) {
            expect(err.toString()).toBe("Error: Task canceled");
        }

        Leg5.shutdown();
    });

    it("Timeout task", async () => {
        Leg5.setup();

        const task = Leg5.run_task("sleep_task", {}, 500);

        try {
            await task.promise;
        } catch (err) {
            expect(err.toString()).toBe("Task timed out");
        } finally {
            Leg5.shutdown();
        }
    });

    it("Failed task", async () => {
        Leg5.setup();

        await Leg5.register_task("fail_task", `code:
            throw new Error("FailTest");
        `, []);

        const task = Leg5.run_task("fail_task", {});

        try {
            await task.promise;
        } catch (err) {
            expect(err.toString()).toBe("FailTest");
        } finally {
            Leg5.shutdown();
        }
    });
})
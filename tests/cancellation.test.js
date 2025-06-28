const path = require("path");
const Leg5 = require("../dist/leg5.js").default;

describe("Test task cancellation", () => {
    it("Cancel task", async () => {
        const instance = new Leg5();
        instance.setup();

        await instance.register_task("sleep_task", `code:
            function sleep (ms) {
                return new Promise(resolve => setTimeout(resolve, ms));
            }

            await sleep(3000);

            return true;
        `, []);

        const task = instance.run_task("sleep_task");

        setTimeout(() => {
            task.cancel();
        }, 500);

        try {
            await task.promise;
        } catch (err) {
            expect(err.message).toBe("Canceled");
        } finally {
            instance.shutdown();
        }
    });

    it("Timeout task", async () => {
        const instance = new Leg5();
        instance.setup();

        await instance.register_task("sleep_task", `code:
            function sleep (ms) {
                return new Promise(resolve => setTimeout(resolve, ms));
            }

            await sleep(3000);

            return true;
        `, []);

        const task = instance.run_task("sleep_task", {}, 500);

        try {
            await task.promise;
        } catch (err) {
            expect(err.toString()).toBe("Timeout");
        } finally {
            instance.shutdown();
        }
    });

    it("Failed task", async () => {
        const instance = new Leg5();
        instance.setup();

        await instance.register_task("fail_task", `code:
            throw new Error("FailTest");
        `, []);

        const task = instance.run_task("fail_task", {});

        try {
            await task.promise;
        } catch (err) {
            expect(err.toString()).toBe("FailTest");
        } finally {
            instance.shutdown();
        }
    });
})
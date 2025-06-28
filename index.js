const path = require("path");
const Leg5 = require("./dist/leg5.js").default;

Leg5.setup();

async function attempt () {
	await Leg5.register_task("file_task", path.resolve(__dirname, "tests/testWorkerTask.js"), ['numCount']);
	await Leg5.register_task("sleep_task", `code:
		function sleep (ms) {
			return new Promise(resolve => setTimeout(resolve, ms));
		}

		await sleep(3000);

		return true;
	`, []);

	const task = Leg5.run_task("sleep_task", [], 500);

	try {
		await task.promise;
	} catch (err) {
		expect(err.toString()).toBe("Error: Task timed out");
	}

	Leg5.shutdown();
}

attempt();
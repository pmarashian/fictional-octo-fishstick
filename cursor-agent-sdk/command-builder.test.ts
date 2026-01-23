import { describe, expect, test } from "vitest";
import { buildCursorAgentCommand } from "./command-builder";

describe("buildCursorAgentCommand", () => {
	test("includes print flag, output format, and prompt", () => {
		const command = buildCursorAgentCommand(
			{ apiKey: "test-key", forceWrites: true },
			{ prompt: "run tests", outputFormat: "json" },
		);

		expect(command).toEqual([
			"cursor-agent",
			"--force",
			"--api-key",
			"test-key",
			"--print",
			"--output-format",
			"json",
			"run tests",
		]);
	});

	test("supports overriding binary path and model", () => {
		const command = buildCursorAgentCommand(
			{ cliPath: "/opt/cursor-agent" },
			{ prompt: "deploy", model: "sonnet" },
		);

		expect(command[0]).toBe("/opt/cursor-agent");
		expect(command).toContain("--model");
		expect(command).toContain("sonnet");
		expect(command.at(-1)).toBe("deploy");
	});

	test("includes resume arguments when chat id is provided", () => {
		const command = buildCursorAgentCommand(
			{},
			{ prompt: "continue", chatId: "chat-123", outputFormat: "json" },
		);

		const resumeIndex = command.indexOf("--resume");
		expect(resumeIndex).toBeGreaterThan(-1);
		expect(command[resumeIndex + 1]).toBe("chat-123");
	});

	test("enables stream partial output only when requested", () => {
		const command = buildCursorAgentCommand(
			{},
			{
				prompt: "stream",
				outputFormat: "stream-json",
				streamPartialOutput: true,
			},
		);

		expect(command).toContain("--stream-partial-output");

		const noPartial = buildCursorAgentCommand(
			{},
			{
				prompt: "stream",
				outputFormat: "stream-json",
				streamPartialOutput: false,
			},
		);

		expect(noPartial).not.toContain("--stream-partial-output");
	});

	test("appends additional args and preserves order", () => {
		const command = buildCursorAgentCommand(
			{ baseArgs: ["--background"] },
			{
				prompt: "format",
				outputFormat: "json",
				extraArgs: ["--timeout", "120"],
			},
		);

		const backgroundIndex = command.indexOf("--background");
		const timeoutIndex = command.indexOf("--timeout");
		expect(backgroundIndex).toBeGreaterThan(-1);
		expect(timeoutIndex).toBeGreaterThan(backgroundIndex);
		expect(command.at(-1)).toBe("format");
	});
});

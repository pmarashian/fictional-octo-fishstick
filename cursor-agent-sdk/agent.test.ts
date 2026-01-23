import { describe, expect, test } from "vitest";
import { CursorAgent, parseCursorEventLine } from "./agent";
import type { CursorJsonResult, CursorStreamEvent } from "./schemas";

describe("parseCursorEventLine", () => {
	test("should parse valid system init event", () => {
		const line = JSON.stringify({
			type: "system",
			subtype: "init",
			apiKeySource: "login",
			cwd: "/Users/user/project",
			session_id: "c6b62c6f-7ead-4fd6-9922-e952131177ff",
			model: "Claude 4 Sonnet",
			permissionMode: "default",
		});

		const result = parseCursorEventLine(line);
		expect(result).not.toBeNull();
		expect(result?.type).toBe("system");
		expect(result?.subtype).toBe("init");
	});

	test("should parse valid user message event", () => {
		const line = JSON.stringify({
			type: "user",
			message: {
				role: "user",
				content: [{ type: "text", text: "Hello" }],
			},
			session_id: "test-session",
		});

		const result = parseCursorEventLine(line);
		expect(result).not.toBeNull();
		expect(result?.type).toBe("user");
		if (result && "message" in result) {
			expect(result.message.role).toBe("user");
		}
	});

	test("should parse valid assistant message event", () => {
		const line = JSON.stringify({
			type: "assistant",
			message: {
				role: "assistant",
				content: [{ type: "text", text: "Hi there!" }],
			},
			session_id: "test-session",
		});

		const result = parseCursorEventLine(line);
		expect(result).not.toBeNull();
		expect(result?.type).toBe("assistant");
		if (result && "message" in result) {
			expect(result.message.role).toBe("assistant");
		}
	});

	test("should parse valid result event", () => {
		const line = JSON.stringify({
			type: "result",
			subtype: "success",
			duration_ms: 1000,
			duration_api_ms: 1000,
			is_error: false,
			result: "Test result",
			session_id: "test-session",
		});

		const result = parseCursorEventLine(line);
		expect(result).not.toBeNull();
		expect(result?.type).toBe("result");
		if (result && "subtype" in result) {
			expect(result.subtype).toBe("success");
		}
	});

	test("should return null for empty string", () => {
		const result = parseCursorEventLine("");
		expect(result).toBeNull();
	});

	test("should return null for whitespace-only string", () => {
		const result = parseCursorEventLine("   \n\t  ");
		expect(result).toBeNull();
	});

	test("should return null for invalid JSON", () => {
		const result = parseCursorEventLine("not valid json");
		expect(result).toBeNull();
	});

	test("should return null for malformed JSON", () => {
		const result = parseCursorEventLine('{"type": "invalid');
		expect(result).toBeNull();
	});

	test("should return null for invalid event type", () => {
		const line = JSON.stringify({
			type: "unknown",
			session_id: "test",
		});

		const result = parseCursorEventLine(line);
		expect(result).toBeNull();
	});

	test("should trim whitespace around JSON", () => {
		const line = JSON.stringify({
			type: "user",
			message: {
				role: "user",
				content: [{ type: "text", text: "test" }],
			},
			session_id: "test",
		});

		const result = parseCursorEventLine(`   ${line}   `);
		expect(result).not.toBeNull();
		expect(result?.type).toBe("user");
	});

	test("should parse tool call events", () => {
		const startedLine = JSON.stringify({
			type: "tool_call",
			subtype: "started",
			call_id: "toolu_123",
			tool_call: {
				readToolCall: {
					args: { path: "README.md" },
				},
			},
			session_id: "session-1",
		});

		const completedLine = JSON.stringify({
			type: "tool_call",
			subtype: "completed",
			call_id: "toolu_123",
			tool_call: {
				readToolCall: {
					args: { path: "README.md" },
					result: {
						success: {
							content: "# Project",
							isEmpty: false,
							exceededLimit: false,
							totalLines: 10,
							totalChars: 100,
						},
					},
				},
			},
			session_id: "session-1",
		});

		const started = parseCursorEventLine(startedLine);
		const completed = parseCursorEventLine(completedLine);

		expect(started?.type).toBe("tool_call");
		expect(completed?.type).toBe("tool_call");
		if (completed && completed.type === "tool_call") {
			expect(
				completed.tool_call.readToolCall?.result?.success?.content,
			).toContain("# Project");
		}
	});

	test("should handle events with extra fields (passthrough)", () => {
		const line = JSON.stringify({
			type: "system",
			subtype: "init",
			apiKeySource: "env",
			cwd: "/test",
			session_id: "test",
			model: "test-model",
			permissionMode: "default",
			extraField: "should-be-preserved",
		});

		const result = parseCursorEventLine(line);
		expect(result).not.toBeNull();
		expect(result?.type).toBe("system");
		if (result && "extraField" in result) {
			expect(result.extraField).toBe("should-be-preserved");
		}
	});
});

describe("CursorAgent", () => {
	test("should construct with API key", () => {
		const agent = new CursorAgent("test-api-key");
		expect(agent).toBeInstanceOf(CursorAgent);
	});

	// Note: generate() and stream() require actual cursor-agent CLI execution
	// These tests would need mocking or require the actual CLI to be available
	// We focus on testing the parsing logic here
});

describe("NDJSON parsing logic", () => {
	test("should parse multiple NDJSON lines", () => {
		const lines = [
			JSON.stringify({
				type: "system",
				subtype: "init",
				apiKeySource: "login",
				cwd: "/test",
				session_id: "test-1",
				model: "test",
				permissionMode: "default",
			}),
			JSON.stringify({
				type: "user",
				message: {
					role: "user",
					content: [{ type: "text", text: "hello" }],
				},
				session_id: "test-1",
			}),
			JSON.stringify({
				type: "assistant",
				message: {
					role: "assistant",
					content: [{ type: "text", text: "hi" }],
				},
				session_id: "test-1",
			}),
		];

		const results = lines.map((line) => parseCursorEventLine(line));
		expect(results).toHaveLength(3);
		expect(results[0]?.type).toBe("system");
		expect(results[1]?.type).toBe("user");
		expect(results[2]?.type).toBe("assistant");
	});

	test("should handle NDJSON with delimiters", () => {
		const ndjson = JSON.stringify({
			type: "system",
			subtype: "init",
			apiKeySource: "login",
			cwd: "/test",
			session_id: "test-1",
			model: "test",
			permissionMode: "default",
		});

		const result = parseCursorEventLine(ndjson);
		expect(result).not.toBeNull();
		expect(result?.type).toBe("system");
	});
});

describe("Edge cases", () => {
	test("should handle result event with empty result string", () => {
		const line = JSON.stringify({
			type: "result",
			subtype: "success",
			duration_ms: 0,
			duration_api_ms: 0,
			is_error: false,
			result: "",
			session_id: "test",
		});

		const result = parseCursorEventLine(line);
		expect(result).not.toBeNull();
		if (result && "result" in result) {
			expect(result.result).toBe("");
		}
	});

	test("should handle thinking delta with empty text", () => {
		const line = JSON.stringify({
			type: "thinking",
			subtype: "delta",
			text: "",
			session_id: "test",
			timestamp_ms: 1234567890,
		});

		const result = parseCursorEventLine(line);
		expect(result).not.toBeNull();
		expect(result?.type).toBe("thinking");
		if (result && "subtype" in result) {
			expect(result.subtype).toBe("delta");
		}
	});

	test("should handle user message with multiple content blocks", () => {
		const line = JSON.stringify({
			type: "user",
			message: {
				role: "user",
				content: [
					{ type: "text", text: "First block" },
					{ type: "text", text: "Second block" },
				],
			},
			session_id: "test",
		});

		const result = parseCursorEventLine(line);
		expect(result).not.toBeNull();
		if (result && "message" in result) {
			expect(result.message.content).toHaveLength(2);
		}
	});
});

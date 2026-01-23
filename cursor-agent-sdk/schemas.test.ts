import { describe, expect, test } from "vitest";
import {
	type CursorJsonResult,
	CursorJsonResultSchema,
	type CursorStreamEvent,
	CursorStreamEventSchema,
} from "./schemas";

describe("CursorStreamEventSchema", () => {
	test("should parse system init event", () => {
		const event = {
			type: "system",
			subtype: "init",
			apiKeySource: "login",
			cwd: "/Users/user/project",
			session_id: "c6b62c6f-7ead-4fd6-9922-e952131177ff",
			model: "Claude 4 Sonnet",
			permissionMode: "default",
		};

		const result = CursorStreamEventSchema.safeParse(event);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.type).toBe("system");
			expect(result.data.subtype).toBe("init");
			expect(result.data.apiKeySource).toBe("login");
			expect(result.data.cwd).toBe("/Users/user/project");
			expect(result.data.session_id).toBe(
				"c6b62c6f-7ead-4fd6-9922-e952131177ff",
			);
			expect(result.data.model).toBe("Claude 4 Sonnet");
			expect(result.data.permissionMode).toBe("default");
		}
	});

	test("should parse user message event", () => {
		const event = {
			type: "user",
			message: {
				role: "user",
				content: [
					{ type: "text", text: "Read README.md and create a summary" },
				],
			},
			session_id: "c6b62c6f-7ead-4fd6-9922-e952131177ff",
		};

		const result = CursorStreamEventSchema.safeParse(event);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.type).toBe("user");
			expect(result.data.message.role).toBe("user");
			expect(result.data.message.content[0]?.type).toBe("text");
			expect(result.data.message.content[0]?.text).toBe(
				"Read README.md and create a summary",
			);
			expect(result.data.session_id).toBe(
				"c6b62c6f-7ead-4fd6-9922-e952131177ff",
			);
		}
	});

	test("should parse assistant message event", () => {
		const event = {
			type: "assistant",
			message: {
				role: "assistant",
				content: [{ type: "text", text: "I'll read the README.md file" }],
			},
			session_id: "c6b62c6f-7ead-4fd6-9922-e952131177ff",
		};

		const result = CursorStreamEventSchema.safeParse(event);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.type).toBe("assistant");
			expect(result.data.message.role).toBe("assistant");
			expect(result.data.message.content[0]?.type).toBe("text");
			expect(result.data.message.content[0]?.text).toBe(
				"I'll read the README.md file",
			);
			expect(result.data.session_id).toBe(
				"c6b62c6f-7ead-4fd6-9922-e952131177ff",
			);
		}
	});

	test("should parse thinking delta event", () => {
		const event = {
			type: "thinking",
			subtype: "delta",
			text: "thinking text...",
			session_id: "c6b62c6f-7ead-4fd6-9922-e952131177ff",
			timestamp_ms: 1234567890,
		};

		const result = CursorStreamEventSchema.safeParse(event);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.type).toBe("thinking");
			expect(result.data.subtype).toBe("delta");
			expect(result.data.text).toBe("thinking text...");
			expect(result.data.session_id).toBe(
				"c6b62c6f-7ead-4fd6-9922-e952131177ff",
			);
			expect(result.data.timestamp_ms).toBe(1234567890);
		}
	});

	test("should parse thinking completed event", () => {
		const event = {
			type: "thinking",
			subtype: "completed",
			session_id: "c6b62c6f-7ead-4fd6-9922-eviz131177ff",
			timestamp_ms: 1234567890,
		};

		const result = CursorStreamEventSchema.safeParse(event);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.type).toBe("thinking");
			expect(result.data.subtype).toBe("completed");
			expect(result.data.session_id).toBe(
				"c6b62c6f-7ead-4fd6-9922-eviz131177ff",
			);
			expect(result.data.timestamp_ms).toBe(1234567890);
		}
	});

	test("should parse tool call started event for read tool", () => {
		const event = {
			type: "tool_call",
			subtype: "started",
			call_id: "toolu_123",
			tool_call: {
				readToolCall: {
					args: { path: "README.md" },
				},
			},
			session_id: "session-1",
		};

		const result = CursorStreamEventSchema.safeParse(event);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.type).toBe("tool_call");
			expect(result.data.subtype).toBe("started");
			expect(result.data.tool_call.readToolCall.args.path).toBe("README.md");
		}
	});

	test("should parse tool call completed event for write tool", () => {
		const event = {
			type: "tool_call",
			subtype: "completed",
			call_id: "toolu_456",
			tool_call: {
				writeToolCall: {
					args: {
						path: "summary.txt",
						fileText: "Example",
						toolCallId: "toolu_456",
					},
					result: {
						success: {
							path: "/Users/user/project/summary.txt",
							linesCreated: 19,
							fileSize: 942,
						},
					},
				},
			},
			session_id: "session-1",
		};

		const result = CursorStreamEventSchema.safeParse(event);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.type).toBe("tool_call");
			expect(result.data.subtype).toBe("completed");
			expect(
				result.data.tool_call.writeToolCall?.result?.success?.fileSize,
			).toBe(942);
		}
	});

	test("should parse generic function tool call events", () => {
		const event = {
			type: "tool_call",
			subtype: "completed",
			call_id: "toolu_fn",
			tool_call: {
				functionCall: {
					name: "custom_tool",
					arguments: JSON.stringify({ query: "hello" }),
					result: {
						success: {
							content: "world",
						},
					},
				},
			},
			session_id: "session-1",
		};

		const result = CursorStreamEventSchema.safeParse(event);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.tool_call.functionCall?.name).toBe("custom_tool");
			expect(result.data.tool_call.functionCall?.result?.success?.content).toBe(
				"world",
			);
		}
	});

	test("should parse result event", () => {
		const event = {
			type: "result",
			subtype: "success",
			duration_ms: 5234,
			duration_api_ms: 5234,
			is_error: false,
			result:
				"I'll read the README.md fileBased on the README, I'll create a summaryDone! I've created the summary in summary.txt",
			session_id: "c6b62c6f-7ead-4fd6-9922-e952131177ff",
			request_id: "10e11780-df2f-45dc-a1ff-4540af32e9c0",
		};

		const result = CursorStreamEventSchema.safeParse(event);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.type).toBe("result");
			expect(result.data.subtype).toBe("success");
			expect(result.data.duration_ms).toBe(5234);
			expect(result.data.duration_api_ms).toBe(5234);
			expect(result.data.is_error).toBe(false);
			expect(result.data.result).toContain("README.md");
			expect(result.data.session_id).toBe(
				"c6b62c6f-7ead-4fd6-9922-e952131177ff",
			);
			expect(result.data.request_id).toBe(
				"10e11780-df2f-45dc-a1ff-4540af32e9c0",
			);
		}
	});

	test("should accept result event without optional request_id", () => {
		const event = {
			type: "result",
			subtype: "success",
			duration_ms: 1234,
			duration_api_ms: 1234,
			is_error: false,
			result: "Sample result text",
			session_id: "test-session-id",
		};

		const result = CursorStreamEventSchema.safeParse(event);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.request_id).toBeUndefined();
		}
	});

	test("should accept user message with optional timestamp_ms", () => {
		const event = {
			type: "user",
			message: {
				role: "user",
				content: [{ type: "text", text: "test" }],
			},
			session_id: "test-session",
			timestamp_ms: 1234567890,
		};

		const result = CursorStreamEventSchema.safeParse(event);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.timestamp_ms).toBe(1234567890);
		}
	});

	test("should reject invalid event type", () => {
		const event = {
			type: "invalid",
			session_id: "test",
		};

		const result = CursorStreamEventSchema.safeParse(event);
		expect(result.success).toBe(false);
	});

	test("should reject missing required fields", () => {
		const event = {
			type: "user",
			// missing message
			session_id: "test",
		};

		const result = CursorStreamEventSchema.safeParse(event);
		expect(result.success).toBe(false);
	});
});

describe("CursorJsonResultSchema", () => {
	test("should parse complete JSON result", () => {
		const result = {
			type: "result",
			subtype: "success",
			is_error: false,
			duration_ms: 1234,
			duration_api_ms: 1234,
			result:
				"The command to move this branch onto main is `git rebase --onto main HEAD~3`.",
			session_id: "c6b62c6f-7ead-4fd6-9922-e952131177ff",
			request_id: "10e11780-df2f-45dc-a1ff-4540af32e9c0",
		};

		const parsed = CursorJsonResultSchema.safeParse(result);
		expect(parsed.success).toBe(true);
		if (parsed.success) {
			expect(parsed.data.type).toBe("result");
			expect(parsed.data.subtype).toBe("success");
			expect(parsed.data.is_error).toBe(false);
			expect(parsed.data.duration_ms).toBe(1234);
			expect(parsed.data.duration_api_ms).toBe(1234);
			expect(parsed.data.result).toContain("git rebase");
			expect(parsed.data.session_id).toBe(
				"c6b62c6f-7ead-4fd6-9922-e952131177ff",
			);
			expect(parsed.data.request_id).toBe(
				"10e11780-df2f-45dc-a1ff-4540af32e9c0",
			);
		}
	});

	test("should parse JSON result without optional request_id", () => {
		const result = {
			type: "result",
			subtype: "success",
			is_error: false,
			duration_ms: 5000,
			duration_api_ms: 5000,
			result: "Sample result",
			session_id: "test-session-id",
		};

		const parsed = CursorJsonResultSchema.safeParse(result);
		expect(parsed.success).toBe(true);
		if (parsed.success) {
			expect(parsed.data.request_id).toBeUndefined();
		}
	});

	test("should reject incomplete JSON result", () => {
		const result = {
			type: "result",
			// missing required fields
		};

		const parsed = CursorJsonResultSchema.safeParse(result);
		expect(parsed.success).toBe(false);
	});
});

describe("Real-world examples from documentation", () => {
	test("should parse complete example sequence from docs", () => {
		const events = [
			{
				type: "system",
				subtype: "init",
				apiKeySource: "login",
				cwd: "/Users/user/project",
				session_id: "c6b62c6f-7ead-4fd6-9922-e952131177ff",
				model: "Claude 4 Sonnet",
				permissionMode: "default",
			},
			{
				type: "user",
				message: {
					role: "user",
					content: [
						{ type: "text", text: "Read README.md and create a summary" },
					],
				},
				session_id: "c6b62c6f-7ead-4fd6-9922-e952131177ff",
			},
			{
				type: "assistant",
				message: {
					role: "assistant",
					content: [{ type: "text", text: "I'll read the README.md file" }],
				},
				session_id: "c6b62c6f-7ead-4fd6-9922-e952131177ff",
			},
			{
				type: "result",
				subtype: "success",
				duration_ms: 5234,
				duration_api_ms: 5234,
				is_error: false,
				result:
					"I'll read the README.md fileBased on the README, I'll create a summaryDone! I've created the summary in summary.txt",
				session_id: "c6b62c6f-7ead-4fd6-9922-e952131177ff",
				request_id: "10e11780-df2f-45dc-a1ff-4540af32e9c0",
			},
		];

		for (const event of events) {
			const result = CursorStreamEventSchema.safeParse(event);
			expect(result.success).toBe(true);
		}
	});
});

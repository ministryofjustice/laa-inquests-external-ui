---
name: run-the-app
description: Start the app with dev auth bypass, use Playwright CLI to reach a target page or complete a user task, then hand over with show or annotate.
allowed-tools: Bash(yarn:*), Read(*)
---

# Run the app

Use this skill when the user asks to run the local app, navigate to a specific page, or complete an in-app task.

This skill must leverage the `playwright-cli` skill for browser automation patterns and commands.

## When to use

Use this skill for requests like:

- "Run the app and take me to X page"
- "Complete this journey for me"
- "Open the app and stop at the confirmation page"
- "Get to this page and let me review it"
- "I want to give feedback on this page"

## Required workflow

### 1) Confirm objective

Extract and restate the target as one of:

- **Target page**: specific URL/route/page title/state
- **Task completion**: a concrete done condition (for example, submitted form, success page shown)
- **Exploratory**: user wants manual review/feedback

If the objective is ambiguous, ask a clarifying question before running commands.

### 2) Start the app

Boot the app using:

```bash
yarn dev:skip-auth
```

Run it as a background process and wait until the app is reachable (for example at `http://localhost:3000` or project default).

If startup fails, capture the error and hand over with `show` only if a page is available; otherwise report the terminal error and ask the user how to proceed.

### 3) Leverage Playwright CLI

Follow the `playwright-cli` skill for browser automation patterns and command strategy.

Always run Playwright CLI via Yarn.

First verify the Yarn-managed CLI is available:

```bash
yarn playwright-cli --version
```

If it is missing, install it with Yarn, then continue:

```bash
yarn install
```

Open the app and navigate with Playwright CLI until one of the stop conditions is reached.

Prefer:

```bash
yarn playwright-cli open http://localhost:3000
yarn playwright-cli snapshot
```

### 4) Execute to outcome

Always start at "http://localhost:3000" and work to the desired page by following the flow.

Ask if you do not know how to get to a page. Never skip directly to the page.

Work through the app to either:

- reach the requested target page, or
- complete the requested task

### 5) Stop conditions and handoff

When any of the following occurs, stop automation and hand over to the user:

1. **Target page reached**
2. **Task completed**
3. **Blocked by an unknown or unrecoverable error**

Then run:

```bash
yarn playwright-cli show
```

This lets the user see the live page and continue from that state.

### 6) Feedback mode

If the user asks to provide page feedback, review, or annotations, use:

```bash
yarn playwright-cli show --annotate
```

Use this instead of plain `show` whenever feedback is explicitly requested.

## Decision rules

- Use `show` when handing off at a success or blocked state.
- Use `show --annotate` when the user wants UI feedback, comments, or markup on a page.
- If blocked by validation or content uncertainty, prefer handing off with `show` rather than guessing user intent.
- Always use Yarn for Playwright CLI commands.
- If Playwright CLI is missing, use `yarn install` to install it from the dependencies.

## Output expectations

Before handoff, provide a concise status update:

- current URL/page reached
- whether target/task was completed
- any known blocker (if not completed)
- whether `show` or `show --annotate` was launched

## Guardrails

- Keep user state intact once handoff is initiated.
- ONLY RUN on https://localhost:3000
- Avoid destructive actions unless explicitly requested.
- Stop immediately on unknown critical errors and hand over with context.
- If an action doesn't do what you expect, stop immediately.

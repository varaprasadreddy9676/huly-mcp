# huly-mcp

> MCP server for [Huly](https://huly.app) — the open-source project management platform.

Connects Claude Desktop (and any [MCP](https://modelcontextprotocol.io)-compatible client) directly to your Huly workspace. List, create, and update issues, search across projects, manage milestones and documents — all via natural language.

---

## Features

| Tool | Description |
|------|-------------|
| `list_projects` | List all projects in the workspace |
| `get_project` | Get project details + available statuses |
| `list_issues` | List issues with optional status/priority filters |
| `get_issue` | Get full details of an issue by identifier (e.g. `PROJ-42`) |
| `create_issue` | Create a new issue |
| `update_issue` | Update title, status, priority, or due date |
| `add_comment` | Add a comment to an issue |
| `list_members` | List workspace members and their roles |
| `list_milestones` | List milestones for a project |
| `list_teamspaces` | List document teamspaces |
| `list_documents` | List documents in a teamspace |
| `search_issues` | Full-text search across all issues |

---

## Requirements

- Node.js >= 20
- A Huly account — [huly.app](https://huly.app) or self-hosted

---

## Installation

```bash
git clone https://github.com/varaprasadreddy9676/huly-mcp.git
cd huly-mcp
npm install
npm run build
```

---

## Configuration

### Option A — Token auth (recommended for Google / GitHub SSO accounts)

If you signed up to huly.app with Google or GitHub, you don't have a password — use a token instead.

**How to get your token:**
1. Open [huly.app](https://huly.app) in Chrome and sign in
2. Open DevTools (`F12` / `Cmd+Option+I`)
3. Go to **Application** → **Local Storage** → `https://huly.app`
4. Find the key named **`token`** and copy its value

```bash
HULY_WORKSPACE=your-workspace-slug   # e.g. "myteam" from huly.app/myteam
HULY_TOKEN=your-token-here
```

> **Note:** Tokens expire. If you get an auth error, repeat the steps above to get a fresh token.

### Option B — Email + password auth

Only works if you set a password on your huly.app account (Profile → Security → Set password).

```bash
HULY_EMAIL=your-email@example.com
HULY_PASSWORD=your-password
HULY_WORKSPACE=your-workspace-slug
```

### Optional

```bash
HULY_ACCOUNTS_URL=https://account.huly.app   # default; change for self-hosted instances
```

---

## Claude Desktop Setup

Add the following to your Claude Desktop config file:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

**With token auth (SSO):**
```json
{
  "mcpServers": {
    "huly": {
      "command": "node",
      "args": ["/absolute/path/to/huly-mcp/dist/index.js"],
      "env": {
        "HULY_TOKEN": "your-token-here",
        "HULY_WORKSPACE": "your-workspace-slug"
      }
    }
  }
}
```

**With email + password:**
```json
{
  "mcpServers": {
    "huly": {
      "command": "node",
      "args": ["/absolute/path/to/huly-mcp/dist/index.js"],
      "env": {
        "HULY_EMAIL": "your@email.com",
        "HULY_PASSWORD": "yourpassword",
        "HULY_WORKSPACE": "your-workspace-slug"
      }
    }
  }
}
```

Restart Claude Desktop after saving.

---

## Example usage

Once connected, you can ask Claude things like:

- *"List all projects in my Huly workspace"*
- *"Show me all in-progress issues in the PROJ project"*
- *"Create a high-priority issue in PROJ titled 'Fix login timeout'"*
- *"Update PROJ-42 status to Done"*
- *"Search for issues related to authentication"*
- *"Add a comment to PROJ-15 saying the fix is deployed"*

---

## Architecture

- **Single long-lived WebSocket connection** — connects once per process via `@hcengineering/server-client`, not per tool call
- **Lazy init** — connects on the first tool call so auth errors surface clearly in Claude
- **Dual auth** — supports both email/password and token-based auth (for SSO accounts)
- **Stdio transport** — standard MCP transport, works with Claude Desktop and any MCP client

---

## Self-hosted Huly

If you're running a self-hosted Huly instance, set `HULY_ACCOUNTS_URL` to point to your account service:

```bash
HULY_ACCOUNTS_URL=https://your-huly-instance.com/account
```

---

## License

[Eclipse Public License 2.0](https://www.eclipse.org/legal/epl-2.0/)

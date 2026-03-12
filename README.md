# huly-mcp-sdk

> The most complete MCP server for [Huly](https://huly.app) — the open-source project management platform.

Connects **Claude Desktop** (and any [MCP](https://modelcontextprotocol.io)-compatible client) directly to your Huly workspace. Manage issues, labels, relations, milestones, documents, and more — all via natural language.

---

## Tools (19 total)

| Category | Tool | Description |
|----------|------|-------------|
| **Projects** | `list_projects` | List all projects in the workspace |
| | `get_project` | Get project details + available statuses |
| **Issues** | `list_issues` | List issues with optional status/priority/assignee filters |
| | `get_issue` | Get full details of an issue (e.g. `PROJ-42`) |
| | `create_issue` | Create a new issue |
| | `update_issue` | Update title, status, priority, assignee, or due date |
| **Comments** | `add_comment` | Add a comment to an issue |
| **Labels** | `list_labels` | List all labels in the workspace with color + usage count |
| | `create_label` | Create a new label with an optional hex color |
| | `add_label` | Add a label to an issue (auto-creates the label if it doesn't exist) |
| | `remove_label` | Remove a label from an issue |
| **Relations** | `add_relation` | Mark two issues as related (bidirectional) |
| | `add_blocked_by` | Mark an issue as blocked by another issue |
| | `set_parent` | Set or clear the parent epic of an issue |
| **Members** | `list_members` | List workspace members |
| **Milestones** | `list_milestones` | List milestones for a project |
| **Documents** | `list_teamspaces` | List document teamspaces |
| | `list_documents` | List documents in a teamspace |
| **Search** | `search_issues` | Full-text search across all issues |

---

## Requirements

- Node.js >= 20
- A Huly account — [huly.app](https://huly.app) (cloud) or self-hosted

---

## Quick Start

### 1. Install

```bash
git clone https://github.com/varaprasadreddy9676/huly-mcp.git
cd huly-mcp
npm install
npm run build
```

### 2. Authenticate

Run the interactive setup wizard — it sends a one-time code to your email (works for Google/GitHub SSO accounts too):

```bash
npm run setup
```

The wizard will ask for your email address and workspace slug, send a 6-digit OTP to your inbox, and write a `.env` file automatically.

**Your workspace slug** is the part of your Huly URL after the domain: `huly.app/`**`myteam`** → slug is `myteam`.

> If you prefer, you can write `.env` manually — see [Manual Auth](#manual-auth) below.

### 3. Configure Claude Desktop

Add this to your Claude Desktop config:

- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "huly": {
      "command": "node",
      "args": ["/absolute/path/to/huly-mcp/dist/index.js"],
      "env": {
        "HULY_TOKEN": "paste-token-from-.env-here",
        "HULY_WORKSPACE": "your-workspace-slug"
      }
    }
  }
}
```

Restart Claude Desktop after saving.

---

## Example Prompts

**Issues:**
- *"List all in-progress issues in the PROJ project"*
- *"Create a high-priority issue in PROJ titled 'Fix login timeout'"*
- *"Update PROJ-42 status to Done and assign it to Sarah"*
- *"Search for issues related to authentication"*
- *"Add a comment to PROJ-15 saying the fix is deployed"*

**Labels:**
- *"List all labels in my workspace"*
- *"Add the label 'bug' to PROJ-42"*
- *"Create a label called 'backend' with color #3b82f6"*
- *"Remove the 'wontfix' label from PROJ-10"*

**Relations:**
- *"Mark PROJ-55 as blocked by PROJ-12"*
- *"Mark PROJ-30 and PROJ-31 as related"*
- *"Set PROJ-42 as a subtask of PROJ-5"*

**Other:**
- *"List all projects and their member counts"*
- *"Show milestones for the PROJ project"*
- *"List all documents in the Engineering teamspace"*

---

## Bulk CSV Import

Import many issues at once from a CSV file — useful for migrating from other tools:

```bash
node scripts/import-csv.js tasks.csv PROJ
```

**CSV format:**

```csv
title,priority,status,dueDate
Fix login bug,High,In Progress,2025-04-01
Add dark mode,Medium,,
Improve performance,Urgent,,2025-05-01
```

Required column: `title`. Optional: `priority` (Urgent/High/Medium/Low), `status` (must match a status name in the project), `dueDate` (YYYY-MM-DD).

Auth is read from your `.env` file automatically.

---

## Manual Auth

If you prefer to set up `.env` by hand, create a `.env` file in the project root:

**Option A — Token (recommended for all account types):**

```bash
HULY_WORKSPACE=your-workspace-slug
HULY_TOKEN=your-token-here
```

To get a token without the setup wizard:
1. Go to [huly.app](https://huly.app) → open browser DevTools → Application → Local Storage → `https://huly.app` → copy the `token` value.

> Tokens expire after some time. If you get an auth error, run `npm run setup` again or refresh the token from DevTools.

**Option B — Email + password:**

Only works if you have a password set on your account (Profile → Security → Change password).

```bash
HULY_EMAIL=your@email.com
HULY_PASSWORD=yourpassword
HULY_WORKSPACE=your-workspace-slug
```

**Self-hosted Huly:**

```bash
HULY_ACCOUNTS_URL=https://your-huly-instance.com/account
```

---

## Architecture

- **Single long-lived WebSocket connection** — connects once per process via `@hcengineering/server-client`, not per tool call (model load takes 1–3 s, so this keeps tools fast)
- **Lazy init** — connects on the first tool call so auth errors surface clearly in Claude
- **Dual auth** — OTP token (works for Google/GitHub SSO) or email + password
- **Stdio transport** — standard MCP transport compatible with Claude Desktop and any MCP client

---

## License

[Eclipse Public License 2.0](https://www.eclipse.org/legal/epl-2.0/)

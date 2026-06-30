# Figma Console MCP Setup

This project uses Figma Console MCP as the read-only Figma handoff path when the default Figma connector cannot access the Bigbookshelf design file. Keep the server configuration user-local and keep the Figma personal access token out of the repo.

Source: https://github.com/southleft/figma-console-mcp

## Goal

- Expose the Bigbookshelf Figma file to agents through a `figma-console` MCP server.
- Use NPX mode for read-capable extraction: file content, versions, variables, comments, node data, and screenshots where supported.
- Do not require the Figma Desktop Bridge plugin unless a future workflow needs live selection, console monitoring, or write-capable desktop context.

## Prerequisites

- Node.js 18 or newer available to the MCP client.
- A Figma personal access token with these scopes:
  - File content: Read
  - File versions: Read
  - Variables: Read
  - Comments: Read and write
- An MCP client that supports local servers.

## Codex Desktop Config

The active Codex config file on this machine is:

```text
C:\Users\Archform CAD Station\.codex\config.toml
```

Paste this block near the other `[mcp_servers.*]` entries and replace only
`figd_REPLACE_ME` with your Figma token:

```toml
[mcp_servers.figma_console]
command = 'npx'
args = ['-y', 'figma-console-mcp@latest']
startup_timeout_sec = 120

[mcp_servers.figma_console.env]
FIGMA_ACCESS_TOKEN = 'figd_REPLACE_ME'
ENABLE_MCP_APPS = 'true'
```

A copy of this block lives at `docs/figma-console-mcp.codex.example.toml`.

## User-Local MCP Config

Add this server to the MCP client config. Replace `figd_REPLACE_ME` only in the user-local config file, never in this repo.

```json
{
  "mcpServers": {
    "figma-console": {
      "command": "npx",
      "args": ["-y", "figma-console-mcp@latest"],
      "env": {
        "FIGMA_ACCESS_TOKEN": "figd_REPLACE_ME",
        "ENABLE_MCP_APPS": "true"
      }
    }
  }
}
```

Common Windows config locations:

- Claude Desktop: `%APPDATA%\Claude\claude_desktop_config.json`
- Claude Code: `%USERPROFILE%\.claude.json`
- Cursor: `%USERPROFILE%\.cursor\mcp.json`
- Windsurf: `%USERPROFILE%\.codeium\windsurf\mcp_config.json`

For this Codex desktop workspace, use the app's MCP settings/config UI if it owns server registration. The server block should still be named `figma-console` and use the same command, args, and env values shown above.

Claude Code can also install it directly:

```powershell
claude mcp add figma-console -s user -e FIGMA_ACCESS_TOKEN=figd_REPLACE_ME -e ENABLE_MCP_APPS=true -- npx -y figma-console-mcp@latest
```

## Validation

After adding the token and restarting the MCP client, ask the agent to check Figma Console status or list available Figma Console tools.

Then validate against the target file:

- File URL: `https://www.figma.com/design/Kc9RYvOKHuuiKmajmaGFLn/Bigbookshelf---TV-App-Design?node-id=42-1608`
- Expected access: screenshot or node/design extraction succeeds without the default connector's edit-access failure.

## Desktop Bridge Plugin

The plugin is optional for read-only extraction. Add it later only if the MCP server reports that a needed capability requires Desktop Bridge, or if live desktop selection/console context becomes useful.

If needed later:

1. Open Figma Desktop and open the Bigbookshelf file.
2. Go to `Plugins -> Development -> Import plugin from manifest...`.
3. Select `~/.figma-console-mcp/plugin/manifest.json`.
4. Run the imported plugin in the Figma file.
5. Restart the MCP client if it was already open.

The bridge plugin scans local ports `9223` through `9232` and should connect to the running MCP server automatically.

## Fallback

Remote SSE is read-only and is useful only for quick inspection. Prefer NPX mode for this repo because it is the documented full local setup and can be extended to Desktop Bridge later without changing the server name.

```json
{
  "mcpServers": {
    "figma-console": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote@latest",
        "https://figma-console-mcp.southleft.com/sse"
      ]
    }
  }
}
```

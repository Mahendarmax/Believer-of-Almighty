# Copilot Instructions — Believer of Almighty

## MCP Tools (Required)

This project has a local MCP server (`mcp-server/`) registered in `.vscode/mcp.json` under the name **believer-context**.

**All agents MUST use the MCP tools for codebase operations instead of built-in file tools:**

| Task | Use MCP tool | Do NOT use |
|------|-------------|------------|
| Read file contents | `mcp_believer-cont_read_lines` | `read_file` |
| Search code | `mcp_believer-cont_search_code` | `grep_search` |
| List files | `mcp_believer-cont_list_files` | `list_dir` |
| File outline | `mcp_believer-cont_file_outline` | — |
| Find symbol | `mcp_believer-cont_find_symbol` | — |
| Project overview | `mcp_believer-cont_project_overview` | — |
| Project tree | `mcp_believer-cont_project_tree` | — |
| Reindex | `mcp_believer-cont_reindex` | — |

Only fall back to built-in tools if MCP tools are unavailable or return errors.

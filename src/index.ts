#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { sunucuOlustur } from "./server.js";

await sunucuOlustur().connect(new StdioServerTransport());
// stdout MCP protokolüne ayrılmıştır; loglar stderr'e yazılmalı.
console.error("turkiye-mcp stdio üzerinde çalışıyor");

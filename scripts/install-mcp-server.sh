#!/bin/bash

set -e

echo "Installing MCP Filesystem Server for hometest-service..."

# Install Node.js MCP server
npm install -g @modelcontextprotocol/server-filesystem

# Make Python script executable
chmod +x "$(dirname "$0")/mcp-server.py"

echo "MCP Server installed successfully!"
echo ""
echo "To use the server:"
echo "  1. Add server-config.json to your Claude Desktop config"
echo "  2. Or use the Python script directly: ./scripts/mcp-server.py <command>"
echo ""
echo "Available commands:"
echo "  list [pattern]           - List all files (optionally filtered by pattern)"
echo "  read <file_path>         - Read file content"
echo "  structure [max_depth]    - Get repository structure"
echo "  search <query> [pattern] - Search content in files"

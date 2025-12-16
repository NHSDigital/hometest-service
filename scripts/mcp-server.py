#!/usr/bin/env python3

"""
MCP Filesystem Server for hometest-service repository.
Provides structured access to repository files and directories.
"""
import json
import os
import sys
from pathlib import Path
from typing import Dict, List, Any, Optional

REPO_ROOT = Path(__file__).parent
ALLOWED_EXTENSIONS = {
    '.py', '.js', '.ts', '.jsx', '.tsx', '.java', '.go', '.rs',
    '.md', '.txt', '.json', '.yaml', '.yml', '.toml', '.xml',
    '.tf', '.hcl', '.sh', '.bash', '.zsh',
    '.html', '.css', '.scss', '.sql'
}

EXCLUDED_DIRS = {
    '.git', '__pycache__', 'node_modules', '.venv', 'venv',
    '.terraform', '.pytest_cache', '.mypy_cache', 'dist', 'build'
}


class MCPFilesystemServer:
    """MCP Filesystem Server for hometest-service repository."""

    def __init__(self, root_path: Path):
        self.root = root_path.resolve()

    def list_files(self, pattern: Optional[str] = None) -> List[Dict[str, Any]]:
        """List all files in the repository."""
        files = []
        for path in self.root.rglob('*'):
            if not path.is_file():
                continue
            if any(excluded in path.parts for excluded in EXCLUDED_DIRS):
                continue
            if path.suffix not in ALLOWED_EXTENSIONS:
                continue
            if pattern and pattern not in str(path):
                continue

            rel_path = path.relative_to(self.root)
            files.append({
                'path': str(rel_path),
                'size': path.stat().st_size,
                'type': path.suffix,
                'name': path.name
            })
        return sorted(files, key=lambda x: x['path'])

    def read_file(self, file_path: str) -> Dict[str, Any]:
        """Read content of a file."""
        full_path = (self.root / file_path).resolve()

        if not full_path.exists():
            return {'error': f'File not found: {file_path}'}

        if not full_path.is_relative_to(self.root):
            return {'error': 'Access denied: path outside repository'}

        try:
            with open(full_path, 'r', encoding='utf-8') as f:
                content = f.read()
            return {
                'path': file_path,
                'content': content,
                'size': len(content),
                'lines': content.count('\n') + 1
            }
        except Exception as e:
            return {'error': f'Error reading file: {str(e)}'}

    def get_structure(self, max_depth: int = 3) -> Dict[str, Any]:
        """Get repository structure."""
        def build_tree(path: Path, depth: int = 0) -> Dict[str, Any]:
            if depth > max_depth:
                return {'truncated': True}

            tree = {'name': path.name, 'type': 'directory', 'children': []}

            try:
                for item in sorted(path.iterdir()):
                    if item.name.startswith('.') or item.name in EXCLUDED_DIRS:
                        continue

                    if item.is_dir():
                        tree['children'].append(build_tree(item, depth + 1))
                    elif item.suffix in ALLOWED_EXTENSIONS:
                        tree['children'].append({
                            'name': item.name,
                            'type': 'file',
                            'extension': item.suffix
                        })
            except PermissionError:
                tree['error'] = 'Permission denied'

            return tree

        return build_tree(self.root)

    def search_content(self, query: str, file_pattern: Optional[str] = None) -> List[Dict[str, Any]]:
        """Search for content in files."""
        results = []
        for file_info in self.list_files(pattern=file_pattern):
            file_path = file_info['path']
            content_result = self.read_file(file_path)

            if 'error' in content_result:
                continue

            content = content_result['content']
            if query.lower() in content.lower():
                lines = content.split('\n')
                matches = []
                for i, line in enumerate(lines, 1):
                    if query.lower() in line.lower():
                        matches.append({
                            'line_number': i,
                            'line': line.strip()
                        })

                results.append({
                    'file': file_path,
                    'matches': matches[:10]  # Limit to 10 matches per file
                })

        return results


def main():
    """Main entry point for MCP server."""
    server = MCPFilesystemServer(REPO_ROOT)

    if len(sys.argv) < 2:
        print("Usage: mcp-server.py <command> [args]")
        print("Commands: list, read, structure, search")
        sys.exit(1)

    command = sys.argv[1]

    if command == 'list':
        pattern = sys.argv[2] if len(sys.argv) > 2 else None
        result = server.list_files(pattern)
    elif command == 'read':
        if len(sys.argv) < 3:
            print("Error: file path required")
            sys.exit(1)
        result = server.read_file(sys.argv[2])
    elif command == 'structure':
        max_depth = int(sys.argv[2]) if len(sys.argv) > 2 else 3
        result = server.get_structure(max_depth)
    elif command == 'search':
        if len(sys.argv) < 3:
            print("Error: search query required")
            sys.exit(1)
        query = sys.argv[2]
        pattern = sys.argv[3] if len(sys.argv) > 3 else None
        result = server.search_content(query, pattern)
    else:
        print(f"Unknown command: {command}")
        sys.exit(1)

    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()

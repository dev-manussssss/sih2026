#!/usr/bin/env python3
"""
SIH 2026 Problem Explorer — Backend Server
Serves static files + JSON API for problem data and user progress persistence.
Supports both root files and app/static/ structure.
Usage: python3 app/server.py [port]
"""

import json
import os
import sys
import time
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse

# ── Paths ──────────────────────────────────────────────────────────────────
BASE_DIR    = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR    = os.path.join(BASE_DIR, "data")
STATIC_DIR  = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")
PROBLEMS_F  = os.path.join(DATA_DIR, "sih_2026_problems.json")
PROGRESS_F  = os.path.join(DATA_DIR, "user_progress.json")
PROGRESS_TMP = PROGRESS_F + ".tmp"
PORT        = int(sys.argv[1]) if len(sys.argv) > 1 else 8000

# ── MIME types ─────────────────────────────────────────────────────────────
MIME = {
    ".html": "text/html; charset=utf-8",
    ".css":  "text/css; charset=utf-8",
    ".js":   "application/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".ico":  "image/x-icon",
    ".png":  "image/png",
    ".svg":  "image/svg+xml",
    ".woff2":"font/woff2",
    ".txt":  "text/plain; charset=utf-8",
}


def load_json(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def save_json_atomic(path, tmp_path, data):
    """Write JSON atomically: write to .tmp then os.replace()"""
    with open(tmp_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    os.replace(tmp_path, path)


def deep_merge(base, delta):
    """Recursively merge delta into base dict."""
    for k, v in delta.items():
        if k in base and isinstance(base[k], dict) and isinstance(v, dict):
            deep_merge(base[k], v)
        else:
            base[k] = v
    return base


class SIHHandler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        print(f"  {self.address_string()} {fmt % args}")

    def do_HEAD(self):
        self.do_GET(head_only=True)

    # ── routing ────────────────────────────────────────────────────────────
    def do_GET(self, head_only=False):
        parsed = urlparse(self.path)
        path   = parsed.path

        if path == "/" or path == "/index.html":
            root_idx = os.path.join(BASE_DIR, "index.html")
            if os.path.isfile(root_idx):
                self._serve_file(root_idx, head_only=head_only)
            else:
                self._serve_file(os.path.join(STATIC_DIR, "index.html"), head_only=head_only)
        elif path in ("/style.css", "/app.js"):
            root_f = os.path.join(BASE_DIR, path.lstrip("/"))
            if os.path.isfile(root_f):
                self._serve_file(root_f, head_only=head_only)
            else:
                self._serve_file(os.path.join(STATIC_DIR, path.lstrip("/")), head_only=head_only)
        elif path.startswith("/static/"):
            rel  = path[len("/static/"):]
            full = os.path.join(STATIC_DIR, rel)
            if not os.path.isfile(full):
                full = os.path.join(BASE_DIR, rel)
            self._serve_file(full, head_only=head_only)
        elif path.startswith("/data/"):
            rel  = path[len("/data/"):]
            full = os.path.join(DATA_DIR, rel)
            self._serve_file(full, head_only=head_only)
        elif path == "/api/health":
            self._json({"status": "ok", "time": time.time()}, head_only=head_only)
        elif path == "/api/problems":
            self._json(load_json(PROBLEMS_F), head_only=head_only)
        elif path == "/api/progress":
            self._json(load_json(PROGRESS_F), head_only=head_only)
        else:
            self._404(head_only=head_only)

    def do_PATCH(self):
        parsed = urlparse(self.path)
        if parsed.path == "/api/progress":
            length = int(self.headers.get("Content-Length", 0))
            body   = self.rfile.read(length)
            try:
                delta    = json.loads(body)
                current  = load_json(PROGRESS_F)
                for list_key in ("read", "shortlist", "recently_viewed"):
                    if list_key in delta:
                        current[list_key] = delta[list_key]
                        del delta[list_key]
                merged = deep_merge(current, delta)
                merged["last_updated"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
                save_json_atomic(PROGRESS_F, PROGRESS_TMP, merged)
                self._json({"status": "saved"})
            except Exception as e:
                self._error(500, str(e))
        else:
            self._404()

    def do_POST(self):
        self.do_PATCH()

    def do_OPTIONS(self):
        self.send_response(204)
        self._cors_headers()
        self.end_headers()

    # ── helpers ────────────────────────────────────────────────────────────
    def _cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, HEAD, PATCH, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def _json(self, data, status=200, head_only=False):
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", len(body))
        self._cors_headers()
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        if not head_only:
            self.wfile.write(body)

    def _serve_file(self, full_path, head_only=False):
        if not os.path.isfile(full_path):
            self._404(head_only=head_only)
            return
        _, ext = os.path.splitext(full_path)
        mime   = MIME.get(ext.lower(), "application/octet-stream")
        with open(full_path, "rb") as f:
            body = f.read()
        self.send_response(200)
        self.send_header("Content-Type", mime)
        self.send_header("Content-Length", len(body))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        if not head_only:
            self.wfile.write(body)

    def _404(self, head_only=False):
        body = b"Not Found"
        self.send_response(404)
        self.send_header("Content-Type", "text/plain")
        self.send_header("Content-Length", len(body))
        self.end_headers()
        if not head_only:
            self.wfile.write(body)

    def _error(self, code, msg):
        body = json.dumps({"error": msg}).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", len(body))
        self.end_headers()
        self.wfile.write(body)


if __name__ == "__main__":
    server = HTTPServer(("127.0.0.1", PORT), SIHHandler)
    print(f"")
    print(f"  SIH 2026 Problem Explorer Server")
    print(f"  ────────────────────────────────")
    print(f"  Local URL: http://localhost:{PORT}")
    print(f"  Data dir:  {DATA_DIR}")
    print(f"  Press Ctrl+C to stop.")
    print(f"")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n  Server stopped.")

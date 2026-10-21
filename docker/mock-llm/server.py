#!/usr/bin/env python3
"""mock-llm: local OpenAI-compatible mock for the validation rig.

Implements POST /v1/chat/completions (SSE and non-SSE), POST /v1/responses
(SSE and non-SSE), and GET /v1/models, always answering SMOKE_OK. Research 12
(S0) verified this against pi-coding-agent 1.3.0 and kimi-code 2.2.0; the two
gotchas it encodes: kimi sends stream:true and needs a real SSE [DONE] plus a
closed connection, or it hangs after printing the answer.

Env: MOCK_PORT (default 18777), MOCK_LOG (default /tmp/mock-llm/requests.log).
Every request body is appended to MOCK_LOG for debugging.
"""

import json
import os
import socket
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

PORT = int(os.environ.get("MOCK_PORT", "18777"))
LOG = open(os.environ.get("MOCK_LOG", "/tmp/mock-llm/requests.log"), "a", buffering=1)


class H(BaseHTTPRequestHandler):
    def log_message(self, *args):
        pass

    def _json(self, obj):
        body = json.dumps(obj).encode()
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _sse(self, chunks):
        self.send_response(200)
        self.send_header("Content-Type", "text/event-stream")
        self.send_header("Cache-Control", "no-cache")
        self.send_header("Connection", "close")
        self.end_headers()
        self.close_connection = True
        for payload in chunks:
            self.wfile.write(b"data: " + json.dumps(payload).encode() + b"\n\n")
            self.wfile.flush()
        self.wfile.write(b"data: [DONE]\n\n")
        self.wfile.flush()
        try:
            self.wfile.close()
        except OSError:
            pass
        try:
            self.connection.shutdown(socket.SHUT_WR)
        except OSError:
            pass
        try:
            self.connection.close()
        except OSError:
            pass
        self.close_connection = True

    def do_POST(self):
        n = int(self.headers.get("Content-Length") or 0)
        raw = self.rfile.read(n) if n else b"{}"
        try:
            req = json.loads(raw)
        except Exception:
            req = {}
        LOG.write(json.dumps({"path": self.path, "stream": req.get("stream"), "model": req.get("model"), "messages": req.get("messages"), "input": req.get("input")}) + "\n")
        model = req.get("model", "mock-1")
        path = self.path.rstrip("/")

        if path.endswith("/chat/completions"):
            if req.get("stream"):
                base = {
                    "id": "chatcmpl-mock",
                    "object": "chat.completion.chunk",
                    "created": 1700000000,
                    "model": model,
                }
                chunks = [
                    dict(base, choices=[{"index": 0, "delta": {"role": "assistant", "content": ""}, "finish_reason": None}]),
                    dict(base, choices=[{"index": 0, "delta": {"content": "SMOKE_OK"}, "finish_reason": None}]),
                    dict(base, choices=[{"index": 0, "delta": {}, "finish_reason": "stop"}],
                         usage={"prompt_tokens": 10, "completion_tokens": 2, "total_tokens": 12}),
                ]
                self._sse(chunks)
            else:
                self._json({
                    "id": "chatcmpl-mock",
                    "object": "chat.completion",
                    "created": 1700000000,
                    "model": model,
                    "choices": [{
                        "index": 0,
                        "message": {"role": "assistant", "content": "SMOKE_OK"},
                        "finish_reason": "stop",
                    }],
                    "usage": {"prompt_tokens": 10, "completion_tokens": 2, "total_tokens": 12},
                })
        elif path.endswith("/responses"):
            if req.get("stream"):
                events = [
                    {"type": "response.created", "response": {"id": "resp-mock", "object": "response", "status": "in_progress"}},
                    {"type": "response.output_item.added", "output_index": 0,
                     "item": {"type": "message", "role": "assistant", "content": []}},
                    {"type": "response.content_part.added", "output_index": 0, "content_index": 0,
                     "part": {"type": "output_text", "text": ""}},
                    {"type": "response.output_text.delta", "delta": "SMOKE_OK", "output_index": 0, "content_index": 0},
                    {"type": "response.output_text.done", "text": "SMOKE_OK", "output_index": 0, "content_index": 0},
                    {"type": "response.completed",
                     "response": {"id": "resp-mock", "object": "response", "status": "completed",
                                  "output": [{"type": "message", "role": "assistant",
                                              "content": [{"type": "output_text", "text": "SMOKE_OK"}]}],
                                  "usage": {"input_tokens": 10, "output_tokens": 2, "total_tokens": 12}}},
                ]
                self.send_response(200)
                self.send_header("Content-Type", "text/event-stream")
                self.send_header("Connection", "close")
                self.end_headers()
                self.close_connection = True
                for ev in events:
                    self.wfile.write(b"event: " + ev["type"].encode() + b"\ndata: " + json.dumps(ev).encode() + b"\n\n")
                    self.wfile.flush()
                self.wfile.flush()
                try:
                    self.wfile.close()
                except OSError:
                    pass
                try:
                    self.connection.shutdown(socket.SHUT_WR)
                except OSError:
                    pass
                try:
                    self.connection.close()
                except OSError:
                    pass
                self.close_connection = True
            else:
                self._json({
                    "id": "resp-mock",
                    "object": "response",
                    "created_at": 1700000000,
                    "model": model,
                    "output": [{
                        "type": "message",
                        "role": "assistant",
                        "content": [{"type": "output_text", "text": "SMOKE_OK"}],
                    }],
                    "usage": {"input_tokens": 10, "output_tokens": 2, "total_tokens": 12},
                })
        else:
            self._json({"ok": True})

    def do_GET(self):
        self._json({"object": "list", "data": [{"id": "mock-1", "object": "model"}]})


ThreadingHTTPServer(("127.0.0.1", PORT), H).serve_forever()

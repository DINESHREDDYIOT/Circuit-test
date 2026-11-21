#!/bin/sh
# Builds the pages for local testing:
#   1. copies rbs-bit/rbs-bit.js into index.html (the lab is one file, so it carries its own copy of the board model)
#   2. wraps the lab into dist/test.html, and the RBS bit viewer into dist/rbs-bit/viewer.html
# Serve this folder (python3 -m http.server 8765) and open http://localhost:8765/dist/test.html or /dist/rbs-bit/viewer.html
cd "$(dirname "$0")" && perl rbs-bit/embed.pl index.html rbs-bit/rbs-bit.js && mkdir -p dist/rbs-bit && {
  printf '<!doctype html><html><head><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"><style>body{margin:0}[hidden]{display:none!important}</style></head><body>'
  cat index.html
  printf '</body></html>'
} > dist/test.html && {
  printf '<!doctype html><html><head><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"><style>body{margin:0}[hidden]{display:none!important}</style></head><body>'
  cat rbs-bit/viewer.html
  printf '</body></html>'
} > dist/rbs-bit/viewer.html && cp rbs-bit/rbs-bit.js dist/rbs-bit/ && echo built dist/test.html and dist/rbs-bit/viewer.html

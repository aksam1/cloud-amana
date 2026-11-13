#!/bin/sh
# Publish the built Amanah app to its artifact URL.
# The Artifact tool needs a claude.ai login, so the relay token is unset here;
# the nested session reads deploy/publish-prompt.txt and makes the publish call.
EXE="/c/Users/User/AppData/Local/Packages/Claude_pzs8sxrjxfjjc/LocalCache/Roaming/npm/node_modules/@anthropic-ai/claude-code/bin/claude.exe"
unset ANTHROPIC_BASE_URL
unset ANTHROPIC_AUTH_TOKEN
export CLAUDE_CODE_ARTIFACT=1
export CLAUDE_CODE_ARTIFACT_MCP=1
"$EXE" -p "Read the file deploy/publish-prompt.txt and follow it exactly: call the Artifact tool once with the inputs it specifies, then print the raw tool result." \
  --model claude-opus-5-5 --permission-mode default --allowedTools "Artifact,Read" \
  --setting-sources project,local --output-format stream-json --verbose

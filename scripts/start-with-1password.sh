#!/usr/bin/env bash
set -euo pipefail
export AI_PROVIDER="${AI_PROVIDER:-openrouter}"
export AI_MODEL="${AI_MODEL:-anthropic/claude-3.5-sonnet}"
case "$AI_PROVIDER" in
  openrouter) export OPENROUTER_API_KEY="$(op read "${OPENROUTER_OP_REF:-op://Private/OpenRouter API Key/credential}")" ;;
  openai) export OPENAI_API_KEY="$(op read "${OPENAI_OP_REF:-op://Private/OpenAI API Key/credential}")" ;;
  anthropic) export ANTHROPIC_API_KEY="$(op read "${ANTHROPIC_OP_REF:-op://Private/Anthropic API Key/credential}")" ;;
  bedrock|mock) : ;;
  *) echo "Unsupported AI_PROVIDER: $AI_PROVIDER" >&2; exit 1 ;;
esac
pnpm build
pnpm --filter server start

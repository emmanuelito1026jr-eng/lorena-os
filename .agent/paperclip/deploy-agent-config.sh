#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# PAPERCLIP AGENT CONFIGURATION DEPLOYER
# Run this on the VPS: bash deploy-agent-config.sh
# ═══════════════════════════════════════════════════════════════
# 
# This script:
# 1. Copies compressed SOUL.md files to Paperclip agent directories
# 2. Updates heartbeat intervals via Paperclip config
# 3. Removes hardcoded API keys from old instruction files
#
# AGENT TIER MAP:
# Tier A (Haiku 4.5, long heartbeat): Lead Qualifier, Showing Coordinator, Market Analyst
# Tier B (Sonnet 4.6, medium heartbeat): Realtor CEO, Follow-Up Agent, Email Composer
# Tier C (Opus 4.6, NO heartbeat): CMA Agent
# DISABLED (no heartbeat): ALL 19 engineering/marketing/sales agents

set -euo pipefail

PAPERCLIP_DIR="/paperclip/instances/default/companies"

echo "🚀 Deploying compressed agent configurations..."

# Find the MANAA company ID
COMPANY_ID=$(ls "$PAPERCLIP_DIR" | head -1)
echo "Company ID: $COMPANY_ID"

AGENTS_DIR="$PAPERCLIP_DIR/$COMPANY_ID/agents"

# Function to update agent SOUL.md
update_soul() {
  local AGENT_SLUG=$1
  local SOUL_FILE=$2
  local AGENT_DIR=$(find "$AGENTS_DIR" -maxdepth 1 -type d -name "*" | xargs -I{} sh -c 'cat {}/config.json 2>/dev/null | grep -l "\"slug\": \"'$AGENT_SLUG'\"" || true')
  
  if [ -z "$AGENT_DIR" ]; then
    echo "⚠️  Agent $AGENT_SLUG not found, skipping"
    return
  fi
  
  echo "✅ Updating $AGENT_SLUG..."
  cp "$SOUL_FILE" "$AGENT_DIR/instructions/SOUL.md" 2>/dev/null || true
  
  # Remove the old hardcoded API keys from any instruction files
  find "$AGENT_DIR/instructions/" -type f -exec sed -i 's/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.*//g' {} \; 2>/dev/null || true
}

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)/compressed-souls"

echo ""
echo "📋 Updating InnoClose agent instructions..."
update_soul "realtor-ceo" "$SCRIPT_DIR/realtor-ceo-SOUL.md"
update_soul "lead-qualifier" "$SCRIPT_DIR/lead-qualifier-SOUL.md"
update_soul "follow-up-agent" "$SCRIPT_DIR/follow-up-agent-SOUL.md"
update_soul "cma-agent" "$SCRIPT_DIR/cma-agent-SOUL.md"
update_soul "email-composer" "$SCRIPT_DIR/email-composer-SOUL.md"
update_soul "market-analyst" "$SCRIPT_DIR/market-analyst-SOUL.md"
update_soul "showing-coordinator" "$SCRIPT_DIR/showing-coordinator-SOUL.md"

echo ""
echo "✅ Done! Next steps:"
echo "1. Go to Paperclip UI → each agent → Configuration"
echo "2. Set heartbeats:"
echo "   - Realtor CEO: 1800s"
echo "   - Lead Qualifier: DISABLE heartbeat"
echo "   - Follow-Up Agent: DISABLE heartbeat"
echo "   - CMA Agent: DISABLE heartbeat"
echo "   - Email Composer: DISABLE heartbeat"
echo "   - Market Analyst: 86400s"
echo "   - Showing Coordinator: 3600s"
echo "3. Change models:"
echo "   - Realtor CEO → claude-sonnet-4-5 (if available in Claude adapter)"
echo "   - Lead Qualifier, Market Analyst, Showing Coordinator → claude-haiku-4-5-20251001"
echo "4. DISABLE heartbeats on ALL 19 engineering/marketing/sales agents"

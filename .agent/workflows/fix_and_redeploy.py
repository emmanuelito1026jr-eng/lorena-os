#!/usr/bin/env python3
"""
Validate + fix all LOS workflow JSONs against actual Supabase schema,
then delete old n8n workflows, redeploy fixed ones, activate, and smoke test.
"""
import json, glob, os, uuid, urllib.request, ssl, time

API_KEY = os.environ.get('N8N_API_KEY')
BASE = "https://n8n.srv957236.hstgr.cloud/api/v1/workflows"
ctx = ssl.create_default_context()

# ── Actual Supabase schemas ──
SCHEMAS = {
    "leads": {
        "id", "first_name", "last_name", "email", "phone", "source", "status",
        "deal_type", "score", "behavioral_score", "temperature", "engagement_level",
        "tags", "notes", "timeline", "budget_min", "budget_max", "preferred_areas",
        "property_type", "pre_approved", "pre_approval_amount", "lender_name",
        "preferred_language", "communication_preference", "best_call_time",
        "move_in_date", "referring_agent", "custom_fields", "last_activity",
        "last_outreach_at", "nurture_paused", "import_batch_id", "imported_at",
        "verification_status", "verification_notes", "verified_at", "verified_by",
        "score_updated_at", "agent_id", "assigned_to", "created_at", "updated_at"
    },
    "deals": {
        "id", "lead_id", "agent_id", "deal_type", "property_address", "list_price",
        "sale_price", "commission_rate", "stage", "estimated_close_date",
        "actual_close_date", "notes", "metadata", "created_at", "updated_at"
    },
    "notifications": {
        "id", "agent_id", "lead_id", "type", "title", "message", "read",
        "metadata", "created_at"
    },
    "profiles": {
        "id", "email", "full_name", "phone", "role", "avatar_url",
        "preferences", "created_at", "updated_at"
    },
    "behavioral_events": {
        "id", "lead_id", "event_type", "page_url", "session_id", "metadata",
        "created_at"
    },
    "lead_activity": {
        "id", "lead_id", "action", "source", "points", "metadata", "created_at"
    },
    "lead_imports": {
        "id", "agent_id", "filename", "status", "total_rows", "imported_rows",
        "skipped_rows", "error_log", "created_at"
    },
    "homepulse_reports": {
        "id", "lead_id", "agent_id", "address", "estimated_value", "report_data",
        "sent_at", "created_at"
    },
    "daily_briefings": {
        "id", "agent_id", "date", "content", "created_at"
    },
    "cma_reports": {
        "id", "lead_id", "agent_id", "address", "report_data", "pdf_url",
        "status", "created_at"
    },
    "deal_checklists": {
        "id", "deal_id", "title", "status", "due_date", "assigned_to", "notes",
        "completed_at", "created_at"
    },
}

# ── Field fixes: old_field → new_field (or None to remove) ──
FIELD_FIXES = {
    "leads": {
        "full_name": None,        # remove — we use first_name, last_name
        "is_seller": "deal_type", # map is_seller boolean to deal_type text
        "last_site_visit_at": "last_activity",  # rename
        "name": None,             # remove — we use first_name, last_name
        "lead_source": "source",  # rename
        "lead_type": "deal_type", # rename
    },
    "deal_checklists": {
        "completed": "status",    # rename boolean to status text
    },
}

# ── Value transforms for renamed fields ──
VALUE_TRANSFORMS = {
    ("leads", "deal_type", "is_seller"): lambda v: v.replace("isSeller", "isSeller") if "isSeller" in v else v,
    # For is_seller → deal_type, we need to change the expression
}


def api(method, url, data=None):
    body = json.dumps(data).encode() if data else None
    req = urllib.request.Request(url, data=body, method=method)
    req.add_header("X-N8N-API-KEY", API_KEY)
    req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req, timeout=30, context=ctx) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        return {"error": e.read().decode()[:200], "status": e.code}
    except Exception as e:
        return {"error": str(e)}


def fix_workflow(filepath):
    """Validate and fix a single workflow JSON file."""
    with open(filepath) as fp:
        wf = json.load(fp)

    fixes_applied = []
    fname = os.path.basename(filepath)

    for node in wf.get("nodes", []):
        ntype = node.get("type", "")
        nname = node.get("name", "")
        params = node.get("parameters", {})
        table = params.get("tableId", "")

        # Ensure webhookId on webhook nodes
        if "webhook" in ntype.lower() and not node.get("webhookId"):
            node["webhookId"] = str(uuid.uuid4())
            fixes_applied.append(f"  + Added webhookId to {nname}")

        if "supabase" not in ntype.lower():
            continue

        schema = SCHEMAS.get(table, set())
        if not schema:
            fixes_applied.append(f"  ⚠ Unknown table '{table}' in node '{nname}'")
            continue

        table_fixes = FIELD_FIXES.get(table, {})

        # Fix fieldsUi (insert/update operations)
        field_values = params.get("fieldsUi", {}).get("fieldValues", [])
        new_field_values = []
        for fv in field_values:
            field_id = fv.get("fieldId", "")
            value = fv.get("value", "")

            # Check if field needs fixing
            if field_id in table_fixes:
                new_field = table_fixes[field_id]
                if new_field is None:
                    fixes_applied.append(f"  - Removed '{field_id}' from {nname} ({table})")
                    continue  # remove this field
                else:
                    # Special handling for is_seller → deal_type
                    if field_id == "is_seller" and new_field == "deal_type":
                        # Transform: boolean isSeller → text deal_type
                        fv["value"] = "={{$node[\"Calc New Lead\"].json[\"isSeller\"] ? 'selling' : 'buying'}}"
                    fixes_applied.append(f"  → Renamed '{field_id}' to '{new_field}' in {nname} ({table})")
                    fv["fieldId"] = new_field
            elif field_id not in schema and field_id != "":
                fixes_applied.append(f"  ⚠ Invalid field '{field_id}' in {nname} ({table}) — REMOVING")
                continue  # remove invalid field

            new_field_values.append(fv)

        if field_values and new_field_values != field_values:
            params["fieldsUi"]["fieldValues"] = new_field_values

        # Fix filter conditions
        filters = params.get("filters", {}).get("conditions", [])
        for cond in filters:
            key = cond.get("key", "")
            if key in table_fixes:
                new_key = table_fixes[key]
                if new_key:
                    # Special handling for completed → status
                    if key == "completed" and new_key == "status":
                        if cond.get("value") == "false":
                            cond["value"] = "pending"
                        elif cond.get("value") == "true":
                            cond["value"] = "completed"
                    fixes_applied.append(f"  → Renamed filter '{key}' to '{new_key}' in {nname}")
                    cond["key"] = new_key
            elif key not in schema and key != "":
                fixes_applied.append(f"  ⚠ Invalid filter key '{key}' in {nname} ({table})")

    # Save fixed JSON
    with open(filepath, "w") as fp:
        json.dump(wf, fp, indent=2)

    return wf, fixes_applied


# ═══════════════════════════════════════════
# STEP 1: FIX ALL JSONs
# ═══════════════════════════════════════════
print("=" * 60)
print("STEP 1: VALIDATING & FIXING WORKFLOW JSONs")
print("=" * 60)

json_dir = os.path.join(os.path.dirname(__file__), "n8n_json")
files = sorted(glob.glob(os.path.join(json_dir, "LOS-*.json")))
fixed_workflows = []

for fpath in files:
    fname = os.path.basename(fpath)
    wf, fixes = fix_workflow(fpath)
    fixed_workflows.append((fname, wf))
    if fixes:
        print(f"\n{fname}:")
        for f in fixes:
            print(f)
    else:
        print(f"{fname}: ✅ No fixes needed")

# ═══════════════════════════════════════════
# STEP 2: DELETE ALL EXISTING LOS WORKFLOWS
# ═══════════════════════════════════════════
print("\n" + "=" * 60)
print("STEP 2: DELETING ALL EXISTING LOS WORKFLOWS")
print("=" * 60)

r = api("GET", f"{BASE}?limit=200")
existing = [w for w in r.get("data", []) if "[LOS-" in w.get("name", "")]
print(f"Found {len(existing)} existing LOS workflows to delete")

for w in existing:
    r = api("DELETE", f"{BASE}/{w['id']}")
    status = "OK" if not r.get("error") else "ERR"
    print(f"  {w['id']}: {w['name'][:50]} → {status}")

# ═══════════════════════════════════════════
# STEP 3: DEPLOY FIXED WORKFLOWS
# ═══════════════════════════════════════════
print("\n" + "=" * 60)
print("STEP 3: DEPLOYING FIXED WORKFLOWS")
print("=" * 60)

new_ids = []
for fname, wf in fixed_workflows:
    r = api("POST", BASE, wf)
    wid = r.get("id")
    if wid:
        new_ids.append(wid)
        print(f"  ✅ {fname} → {wid}")
    else:
        print(f"  ❌ {fname}: {r.get('error', r.get('message','?'))[:80]}")

# ═══════════════════════════════════════════
# STEP 4: ACTIVATE ALL
# ═══════════════════════════════════════════
print("\n" + "=" * 60)
print("STEP 4: ACTIVATING WORKFLOWS")
print("=" * 60)

for wid in new_ids:
    r = api("POST", f"{BASE}/{wid}/activate")
    active = r.get("active", r.get("error", "?"))
    name = r.get("name", "?")[:50]
    print(f"  {name}: active={active}")

time.sleep(3)

# ═══════════════════════════════════════════
# STEP 5: SMOKE TEST
# ═══════════════════════════════════════════
print("\n" + "=" * 60)
print("STEP 5: SMOKE TEST - Contact Form")
print("=" * 60)

test_lead = {
    "name": "Maria Test Gonzalez",
    "email": "maria.smoketest@email.com",
    "phone": "9155550001",
    "type": "buying",
    "timestamp": "2026-02-20T20:00:00Z",
    "source": "home-page"
}
r = api("POST", "https://n8n.srv957236.hstgr.cloud/webhook/contact-form", test_lead)
if r.get("message") == "Workflow was started":
    print(f"  ✅ Webhook accepted: {r}")
elif r.get("error"):
    print(f"  ❌ Webhook error: {r['error'][:200]}")
else:
    print(f"  ❓ Response: {json.dumps(r)[:200]}")

# Wait for execution
time.sleep(5)

# Check execution result for LOS-01
print("\n  Checking execution result...")
# Find LOS-01 workflow ID
r = api("GET", f"{BASE}?limit=200")
los01_id = None
for w in r.get("data", []):
    if "[LOS-01]" in w.get("name", ""):
        los01_id = w["id"]
        break

if los01_id:
    r = api("GET", f"https://n8n.srv957236.hstgr.cloud/api/v1/executions?workflowId={los01_id}&limit=1")
    execs = r.get("data", [])
    if execs:
        ex = execs[0]
        status = ex.get("status", ex.get("finished", "?"))
        print(f"  Execution {ex.get('id')}: status={status}")
        if status == "error":
            # Try to get error details
            ex_detail = api("GET", f"https://n8n.srv957236.hstgr.cloud/api/v1/executions/{ex['id']}")
            run_data = ex_detail.get("data", {}).get("resultData", {}).get("runData", {})
            for nname, runs in run_data.items():
                for run in runs:
                    err = run.get("error", {})
                    if err:
                        print(f"    ❌ Node '{nname}': {err.get('message', str(err))[:200]}")
    else:
        print("  No executions found yet")

# Check Supabase for the test lead
print("\n  Checking Supabase for test lead...")
SB_KEY = os.environ.get('SUPABASE_SERVICE_ROLE_KEY')
sb_url = f"https://zdonombljnuylmnwkhga.supabase.co/rest/v1/leads?email=eq.maria.smoketest@email.com&select=id,first_name,last_name,email,phone,source,status,score,temperature"
req = urllib.request.Request(sb_url)
req.add_header("apikey", SB_KEY)
req.add_header("Authorization", f"Bearer {SB_KEY}")
try:
    with urllib.request.urlopen(req, timeout=15) as resp:
        leads = json.loads(resp.read())
    if leads:
        print(f"  ✅ Lead found in Supabase!")
        for l in leads:
            print(f"    {json.dumps(l, indent=2)}")
    else:
        print("  ⚠ No leads found yet (may need more time)")
except Exception as e:
    print(f"  ❌ Supabase query error: {e}")

print("\n" + "=" * 60)
print("DONE!")
print("=" * 60)

#!/usr/bin/env python3
"""
Rewrite ALL Supabase nodes in all LOS workflows to use n8n Supabase node v2 format,
then delete old, redeploy, activate, and smoke test.
"""
import json, glob, os, uuid, urllib.request, ssl, time

API_KEY = os.environ.get('N8N_API_KEY')
SB_KEY = os.environ.get('SUPABASE_SERVICE_ROLE_KEY')
BASE = "https://n8n.srv957236.hstgr.cloud/api/v1/workflows"
SB_URL = "https://zdonombljnuylmnwkhga.supabase.co"
ctx = ssl.create_default_context()

OPERATOR_MAP = {
    "eq": "eq",
    "neq": "neq",
    "lt": "lt",
    "lte": "lte",
    "gt": "gt",
    "gte": "gte",
    "": "eq",     # default
}


def api(method, url, data=None, extra_headers=None):
    body = json.dumps(data).encode() if data else None
    req = urllib.request.Request(url, data=body, method=method)
    req.add_header("Content-Type", "application/json")
    if extra_headers:
        for k, v in extra_headers.items():
            req.add_header(k, v)
    try:
        with urllib.request.urlopen(req, timeout=30, context=ctx) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        return {"error": e.read().decode()[:200], "status": e.code}
    except Exception as e:
        return {"error": str(e)}


def fix_supabase_node(node, fname):
    """Convert a single Supabase node from v1 to v2 format."""
    nname = node.get("name", "")
    params = node.get("parameters", {})
    fixes = []

    # Upgrade typeVersion to 2
    if node.get("typeVersion", 1) < 2:
        node["typeVersion"] = 2
        fixes.append(f"  Upgraded typeVersion to 2")

    # Fix filters: v1 uses key/value/operator, v2 uses keyName/keyValue/condition
    if "filters" in params:
        old_conditions = params["filters"].get("conditions", [])
        new_conditions = []
        for c in old_conditions:
            old_key = c.get("key", "")
            old_value = c.get("value", "")
            old_op = c.get("operator", "eq")

            # Skip combineOperation entries
            if "combineOperation" in c:
                fixes.append(f"  Skipped OR condition on '{old_key}'")
                continue

            # Convert to v2 format
            new_cond = {
                "keyName": old_key,
                "keyValue": old_value,
                "condition": OPERATOR_MAP.get(old_op, old_op)
            }
            new_conditions.append(new_cond)
            fixes.append(f"  Converted filter {old_key} {old_op} → keyName/condition/keyValue")

        if new_conditions:
            params["filters"] = {"conditions": new_conditions}
            params["filterType"] = "manual"
            params["matchType"] = "allFilters"  # AND logic
        else:
            # No valid filters - remove filter params
            params.pop("filters", None)
            params.pop("filterType", None)

    # Fix fieldsUi: v1 uses fieldId/value, v2 uses fieldName/fieldValue
    if "fieldsUi" in params:
        old_values = params["fieldsUi"].get("fieldValues", [])
        new_values = []
        for fv in old_values:
            old_id = fv.get("fieldId", fv.get("fieldName", ""))
            old_val = fv.get("value", fv.get("fieldValue", ""))

            # v2 still uses fieldId/value in some versions, but let's be safe
            new_values.append({
                "fieldName": old_id,
                "fieldValue": old_val
            })

        params["fieldsUi"] = {"fieldValues": new_values}
        fixes.append(f"  Converted {len(new_values)} field values to v2 format")

    # Fix operation names for v2
    op = params.get("operation", "")
    if op == "":
        # v2 default for insert is "create"
        if "fieldsUi" in params and "operation" not in params:
            params["operation"] = "create"
            fixes.append(f"  Set operation to 'create'")

    # Ensure resource is set
    if "resource" not in params:
        params["resource"] = "row"
        fixes.append(f"  Set resource to 'row'")

    return fixes


def fix_workflow(filepath):
    """Fix all Supabase nodes in a workflow."""
    with open(filepath) as fp:
        wf = json.load(fp)

    fname = os.path.basename(filepath)
    all_fixes = []

    for node in wf.get("nodes", []):
        ntype = node.get("type", "")
        nname = node.get("name", "")

        # Webhook - ensure webhookId
        if "webhook" in ntype.lower() and not node.get("webhookId"):
            node["webhookId"] = str(uuid.uuid4())
            all_fixes.append(f"  + webhookId on {nname}")

        # Supabase nodes - convert to v2
        if "supabase" in ntype.lower():
            fixes = fix_supabase_node(node, fname)
            if fixes:
                all_fixes.append(f"  📦 {nname}:")
                all_fixes.extend(fixes)

    with open(filepath, "w") as fp:
        json.dump(wf, fp, indent=2)

    return all_fixes


# ═══════════════════════════════════════════
print("=" * 60)
print("STEP 1: CONVERT ALL SUPABASE NODES TO V2 FORMAT")
print("=" * 60)

json_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "n8n_json")
files = sorted(glob.glob(os.path.join(json_dir, "LOS-*.json")))

for fpath in files:
    fname = os.path.basename(fpath)
    fixes = fix_workflow(fpath)
    if fixes:
        print(f"\n{fname}:")
        for f in fixes:
            print(f)
    else:
        print(f"{fname}: ✅ No changes needed")


# ═══════════════════════════════════════════
print("\n" + "=" * 60)
print("STEP 2: DELETE ALL EXISTING LOS WORKFLOWS")
print("=" * 60)

n8n_headers = {"X-N8N-API-KEY": API_KEY}
r = api("GET", f"{BASE}?limit=200", extra_headers=n8n_headers)
existing = [w for w in r.get("data", []) if "[LOS-" in w.get("name", "")]
print(f"Found {len(existing)} to delete")

for w in existing:
    api("DELETE", f"{BASE}/{w['id']}", extra_headers=n8n_headers)
    print(f"  Deleted {w['id']}")


# ═══════════════════════════════════════════
print("\n" + "=" * 60)
print("STEP 3: DEPLOY ALL 10 FIXED WORKFLOWS")
print("=" * 60)

new_ids = {}
for fpath in files:
    fname = os.path.basename(fpath)
    with open(fpath) as fp:
        wf = json.load(fp)
    r = api("POST", BASE, wf, extra_headers=n8n_headers)
    wid = r.get("id")
    if wid:
        new_ids[fname] = wid
        print(f"  ✅ {fname} → {wid}")
    else:
        print(f"  ❌ {fname}: {r.get('error', r.get('message','?'))[:100]}")


# ═══════════════════════════════════════════
print("\n" + "=" * 60)
print("STEP 4: ACTIVATE ALL")
print("=" * 60)

for fname, wid in new_ids.items():
    r = api("POST", f"{BASE}/{wid}/activate", extra_headers=n8n_headers)
    active = r.get("active", r.get("error", "?"))
    print(f"  {fname}: active={active}")

time.sleep(4)

# ═══════════════════════════════════════════
print("\n" + "=" * 60)
print("STEP 5: SMOKE TEST")
print("=" * 60)

# First clean up any test leads
sb_headers = {"apikey": SB_KEY, "Authorization": f"Bearer {SB_KEY}"}
api("DELETE",
    f"{SB_URL}/rest/v1/leads?email=eq.smoke.final@lorena-os.com",
    extra_headers={**sb_headers, "Prefer": "return=minimal"})

test_lead = {
    "name": "Smoke Final Test",
    "email": "smoke.final@lorena-os.com",
    "phone": "9155550099",
    "type": "buying",
    "source": "website"
}

print("Sending test lead to /webhook/contact-form ...")
r = api("POST", "https://n8n.srv957236.hstgr.cloud/webhook/contact-form", test_lead)
print(f"  Response: {r}")

print("Waiting 10s...")
time.sleep(10)

# Check execution
print("\nChecking execution...")
r = api("GET", f"https://n8n.srv957236.hstgr.cloud/api/v1/executions?limit=3",
        extra_headers=n8n_headers)
for ex in r.get("data", []):
    print(f"  Exec {ex['id']}: status={ex.get('status')} wfId={ex.get('workflowId')}")

# If latest exec is error, get details
data = r.get("data", [])
if data and data[0].get("status") == "error":
    ex_id = data[0]["id"]
    print(f"\nGetting error details for exec {ex_id}...")
    r2 = api("GET", f"https://n8n.srv957236.hstgr.cloud/api/v1/executions/{ex_id}?includeData=true",
             extra_headers=n8n_headers)
    rd = r2.get("data", {}).get("resultData", {})
    top_err = rd.get("error", {})
    if top_err:
        desc = top_err.get("description", top_err.get("message", ""))
        node_name = top_err.get("node", {}).get("name", "?")
        print(f"  ❌ Node '{node_name}': {desc[:200]}")
    for nname, runs in rd.get("runData", {}).items():
        for run in runs:
            err = run.get("error")
            if err:
                print(f"  ❌ {nname}: {err.get('description', err.get('message',''))[:200]}")

# Check Supabase
print("\nChecking Supabase for test lead...")
r = api("GET",
        f"{SB_URL}/rest/v1/leads?email=eq.smoke.final@lorena-os.com&select=id,first_name,last_name,email,phone,source,status,score,temperature,deal_type",
        extra_headers=sb_headers)

if isinstance(r, list) and r:
    print("  ✅ LEAD FOUND IN SUPABASE!")
    for l in r:
        for k, v in l.items():
            print(f"    {k}: {v}")
elif isinstance(r, list):
    print("  ⚠ No lead found yet")
else:
    print(f"  Response: {r}")

# Check notifications
print("\nChecking notifications...")
r = api("GET",
        f"{SB_URL}/rest/v1/notifications?select=id,type,title,message&order=created_at.desc&limit=3",
        extra_headers=sb_headers)
if isinstance(r, list) and r:
    for n in r:
        print(f"  📢 {n.get('type')}: {n.get('title')} - {n.get('message','')[:60]}")
else:
    print(f"  No notifications")

print("\n" + "=" * 60)
print("DONE!")
print("=" * 60)

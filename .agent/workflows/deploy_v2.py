#!/usr/bin/env python3
"""Delete old LOS workflows, redeploy with correct creds, activate, smoke test."""
import json, glob, os, urllib.request, urllib.error, ssl

API_KEY = os.environ.get('N8N_API_KEY')
BASE = "https://n8n.srv957236.hstgr.cloud/api/v1/workflows"

ctx = ssl.create_default_context()

def api(method, url, data=None):
    body = json.dumps(data).encode() if data else None
    req = urllib.request.Request(url, data=body, method=method)
    req.add_header("X-N8N-API-KEY", API_KEY)
    req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req, timeout=30, context=ctx) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        return {"error": e.read().decode(), "status": e.code}
    except Exception as e:
        return {"error": str(e)}

# Step 1: List existing workflows and find LOS ones to delete
print("=" * 50)
print("STEP 1: Finding existing LOS workflows to delete")
print("=" * 50)
result = api("GET", BASE)
existing = []
for w in result.get("data", []):
    if "[LOS-" in w.get("name", ""):
        existing.append(w["id"])
        print(f"  Found: {w['id']} → {w['name']}")

# Step 2: Delete old ones
print(f"\nSTEP 2: Deleting {len(existing)} old LOS workflows")
for wid in existing:
    r = api("DELETE", f"{BASE}/{wid}")
    err = r.get("error")
    print(f"  Deleted {wid}: {'ERROR: '+err if err else 'OK'}")

# Step 3: Deploy fresh
print(f"\nSTEP 3: Deploying 10 workflows with correct credentials")
json_dir = os.path.join(os.path.dirname(__file__), "n8n_json")
files = sorted(glob.glob(os.path.join(json_dir, "LOS-*.json")))
new_ids = []

for f in files:
    name = os.path.basename(f)
    with open(f) as fp:
        wf = json.load(fp)
    r = api("POST", BASE, wf)
    wid = r.get("id")
    wname = r.get("name", r.get("error", "?"))
    if wid:
        print(f"  ✅ {name} → {wid} ({wname})")
        new_ids.append(wid)
    else:
        print(f"  ❌ {name} → ERROR: {wname}")

# Step 4: Activate all
print(f"\nSTEP 4: Activating {len(new_ids)} workflows")
for wid in new_ids:
    r = api("POST", f"{BASE}/{wid}/activate")
    active = r.get("active", r.get("error", "?"))
    print(f"  {wid}: active={active}")

# Step 5: Smoke test
print(f"\nSTEP 5: Smoke test — sending test lead to /webhook/contact-form")
test_data = {
    "name": "Maria Test Gonzalez",
    "email": "maria.test@email.com",
    "phone": "9155551234",
    "type": "buying",
    "timestamp": "2026-02-20T12:00:00Z",
    "source": "home-page"
}
r = api("POST", "https://n8n.srv957236.hstgr.cloud/webhook/contact-form", test_data)
print(f"  Webhook response: {json.dumps(r)[:300]}")

print("\n" + "=" * 50)
print("DONE!")
print("=" * 50)

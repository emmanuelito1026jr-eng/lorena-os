#!/usr/bin/env python3
"""Deploy all LOS workflows to n8n and activate them."""
import json, os, glob, urllib.request, urllib.error

API_KEY = os.environ.get('N8N_API_KEY')
BASE = "https://n8n.srv957236.hstgr.cloud/api/v1/workflows"
HEADERS = {"X-N8N-API-KEY": API_KEY, "Content-Type": "application/json"}

def api(method, url, data=None):
    body = json.dumps(data).encode() if data else None
    req = urllib.request.Request(url, data=body, headers=HEADERS, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        err = e.read().decode()
        return {"error": err, "status": e.code}

# Get files
files = sorted(glob.glob(os.path.join(os.path.dirname(__file__), "n8n_json/LOS-*.json")))
print(f"Found {len(files)} workflow files\n")

deployed = []
for f in files:
    name = os.path.basename(f)
    with open(f) as fp:
        wf = json.load(fp)
    
    # Create
    result = api("POST", BASE, wf)
    wf_id = result.get("id")
    wf_name = result.get("name", result.get("error", "?"))
    
    if wf_id:
        print(f"✅ Created: {wf_id} → {wf_name}")
        # Activate
        act = api("PATCH", f"{BASE}/{wf_id}", {"active": True})
        active = act.get("active", act.get("error", "?"))
        print(f"   Active: {active}")
        deployed.append({"id": wf_id, "name": wf_name, "active": active, "file": name})
    else:
        print(f"❌ FAILED: {name} → {wf_name}")
        deployed.append({"id": None, "name": name, "error": wf_name})

print(f"\n{'='*50}")
print(f"Deployed: {sum(1 for d in deployed if d.get('id'))}/{len(files)}")
print(f"Active:   {sum(1 for d in deployed if d.get('active')==True)}/{len(files)}")

# Print webhook URLs for webhook-triggered workflows
print(f"\n📡 Webhook URLs:")
for d in deployed:
    if d.get("id") and "Contact_Form" in d.get("file",""):
        print(f"  LOS-01: https://n8n.srv957236.hstgr.cloud/webhook/contact-form")
    elif d.get("id") and "Home_Estimate" in d.get("file",""):
        print(f"  LOS-02: https://n8n.srv957236.hstgr.cloud/webhook/home-estimate")
    elif d.get("id") and "CINC_Import" in d.get("file",""):
        print(f"  LOS-03: https://n8n.srv957236.hstgr.cloud/webhook/import-leads")
    elif d.get("id") and "Open_House" in d.get("file",""):
        print(f"  LOS-04: https://n8n.srv957236.hstgr.cloud/webhook/open-house")
    elif d.get("id") and "Behavioral" in d.get("file",""):
        print(f"  LOS-05: https://n8n.srv957236.hstgr.cloud/webhook/lead-activity")
    elif d.get("id") and "CMA" in d.get("file",""):
        print(f"  LOS-08: https://n8n.srv957236.hstgr.cloud/webhook/generate-cma")
    elif d.get("id") and "Checklist" in d.get("file",""):
        print(f"  LOS-09: https://n8n.srv957236.hstgr.cloud/webhook/deal-stage-change")

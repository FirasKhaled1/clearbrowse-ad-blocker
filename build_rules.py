import urllib.request
import json
import os

print("Downloading Peter Lowe's Ad Server List...")
url = "https://pgl.yoyo.org/adservers/serverlist.php?hostformat=nohtml"

try:
    # 1. Download the list of ad domains
    response = urllib.request.urlopen(url)
    domains = response.read().decode('utf-8').splitlines()
    
    rules = []
    rule_id = 1 # Rule IDs must start at 1
    
    print("Converting to Chrome Manifest V3 format...")
    # 2. Loop through every domain and turn it into a JSON rule
    for domain in domains:
        domain = domain.strip()
        
        # Skip empty lines or comments
        if not domain or domain.startswith("#"):
            continue
            
        rules.append({
            "id": rule_id,
            "priority": 1,
            "action": { "type": "block" },
            "condition": {
                # || means "match this domain exactly", ^ acts as a separator
                "urlFilter": f"||{domain}^", 
                "resourceTypes": [
                    "main_frame", "sub_frame", "script", 
                    "image", "xmlhttprequest", "ping", "media"
                ]
            }
        })
        rule_id += 1
        
    # 3. Save it over our old rules_1.json file
    os.makedirs("rules", exist_ok=True)
    with open("rules/rules_1.json", "w", encoding="utf-8") as f:
        json.dump(rules, f, indent=2)
        
    print(f"Success! Generated {len(rules)} network blocking rules.")
    
except Exception as e:
    print(f"An error occurred: {e}")
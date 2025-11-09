import json
import sys

# Read and parse the JSON file
with open('c:/Users/tenis/Downloads/431704371_freeman-health-system---freeman-west_standardcharges.json', 'r') as f:
    data = json.load(f)

# Find procedures (not pharmacy), look for CPT codes
procedures = []
for item in data['standard_charge_information']:
    codes = item.get('code_information', [])
    for code in codes:
        if code.get('type') in ['CPT', 'HCPCS', 'MS-DRG', 'APR-DRG', 'REV CODE']:
            charges = item.get('standard_charges', [{}])[0]
            procedures.append({
                'description': item.get('description', ''),
                'code': code.get('code', ''),
                'type': code.get('type', ''),
                'gross_charge': charges.get('gross_charge', 0),
                'discounted_cash': charges.get('discounted_cash', 0)
            })
            break

# Group by category
categories = {
    'Surgery': [],
    'Cardiac': [],
    'Imaging': [],
    'Lab': [],
    'Therapy': [],
    'Other': []
}

for proc in procedures:
    desc_lower = proc['description'].lower()
    if any(word in desc_lower for word in ['surgery', 'surgical', 'operation', 'repair']):
        categories['Surgery'].append(proc)
    elif any(word in desc_lower for word in ['cardiac', 'heart', 'cardiology', 'angioplasty', 'catheter']):
        categories['Cardiac'].append(proc)
    elif any(word in desc_lower for word in ['mri', 'ct', 'scan', 'x-ray', 'xray', 'ultrasound', 'imaging']):
        categories['Imaging'].append(proc)
    elif any(word in desc_lower for word in ['lab', 'blood', 'test', 'panel', 'culture']):
        categories['Lab'].append(proc)
    elif any(word in desc_lower for word in ['therapy', 'physical', 'occupational', 'speech']):
        categories['Therapy'].append(proc)
    else:
        categories['Other'].append(proc)

# Print summary
print("=" * 100)
print("HOSPITAL STANDARD CHARGES - PROCEDURE PRICING")
print("=" * 100)

for category, procs in categories.items():
    if procs:
        print(f"\n{category.upper()} ({len(procs)} procedures)")
        print("-" * 100)
        for proc in procs[:15]:  # Show first 15 in each category
            print(f"{proc['description'][:55]:55} | {proc['type']:8} {proc['code']:10} | ${proc['gross_charge']:>10,.2f}")

print(f"\n\nTotal procedures found: {len(procedures)}")

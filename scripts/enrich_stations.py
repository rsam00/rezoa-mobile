import openpyxl
import json
import re
import os

def normalize_name(name):
    if not name:
        return ""
    # Lowercase and remove common prefixes/suffixes
    n = name.lower().strip()
    
    # Remove common junk words
    junk = ['radio', 'radyo', 'tele', 'télé', ' fm', ' stéréo', ' stereo', ' haiti', ' ayiti', ' international', ' inter']
    for j in junk:
        n = n.replace(j, '')
    
    # Remove non-alphanumeric, but keep spaces for a split check
    n = re.sub(r'[^a-zA-Z0-9]', '', n)
    return n.strip()

def standardize_tags(text):
    if not text:
        return []
    
    # Common genres to look for in the description/mission
    keywords = {
        'News': ['news', 'nouvelle', 'actualité'],
        'Talk': ['talk', 'débat', 'émission', 'conversation'],
        'Music': ['music', 'musique', 'kompa', 'zouk', 'reggae', 'rap', 'hip hop'],
        'Gospel': ['christian', 'gospel', 'évangélique', 'dieu', 'église', 'evangelique'],
        'Sports': ['sports', 'sport', 'football', 'soccer'],
        'Culture': ['culture', 'culturel', 'lifestyle', 'divertissement', 'entertainment'],
        'Education': ['education', 'éducatif', 'écoled']
    }
    
    clean_tags = set()
    low_text = text.lower()
    
    for val, keys in keywords.items():
        for key in keys:
            if key in low_text:
                clean_tags.add(val)
                break
                
    return list(clean_tags)

def enrich():
    ts_path = 'data/working_stations_2.ts'
    xlsx_path = 'radyo_Ayiti.xlsx'
    
    if not os.path.exists(ts_path) or not os.path.exists(xlsx_path):
        print("Missing files.")
        return

    # Read TS file
    with open(ts_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    match = re.search(r'export const stations = (\[.*\]);', content, re.DOTALL)
    if not match:
        print("Could not find stations array.")
        return
    
    # Robustly extract objects using regex
    stations_str = match.group(1)
    stations = []
    # Find all { ... } blocks. This assumes they don't contain nested braces (which station objects don't)
    obj_matches = re.finditer(r'\{[^{}]*\}', stations_str, re.DOTALL)
    for om in obj_matches:
        try:
            # Clean trailing commas for JSON parsing
            clean_obj = re.sub(r',\s*\}', '}', om.group(0))
            stations.append(json.loads(clean_obj))
        except:
            continue

    # Read XLSX
    wb = openpyxl.load_workbook(xlsx_path, data_only=True)
    sheet = wb.active
    headers = [str(cell.value).strip() if cell.value else '' for cell in sheet[1]]
    
    excel_data = []
    for row in sheet.iter_rows(min_row=2):
        row_dict = {}
        for i, cell in enumerate(row):
            if i < len(headers):
                h = headers[i]
                val = str(cell.value).strip() if cell.value else ''
                row_dict[h] = val
        excel_data.append(row_dict)

    # Merge
    enriched_count = 0
    for s in stations:
        db_orig = s.get('name', '')
        db_norm = normalize_name(db_orig)
        if not db_norm: continue
        
        found = None
        # Try exact normalized match first
        for row in excel_data:
            ex_name = row.get('Radio', '')
            ex_norm = normalize_name(ex_name)
            if ex_norm == db_norm:
                found = row
                break
        
        # Try substring match if not found
        if not found:
            for row in excel_data:
                ex_norm = normalize_name(row.get('Radio', ''))
                if ex_norm and (ex_norm in db_norm or db_norm in ex_norm):
                    found = row
                    break
        
        if found:
            enriched_count += 1
            
            # Mission/Description/Tags
            mission = found.get('Mission/About') or found.get('Mission')
            if mission:
                if not s.get('description') or len(s.get('description', '')) < 10:
                    s['description'] = mission
                
                # Extract tags from mission if empty
                if not s.get('tag') or len(s['tag']) == 0:
                    new_tags = standardize_tags(mission)
                    if new_tags:
                        s['tag'] = new_tags
            
            # City
            city_col = found.get('Localisat') or found.get('Localisation')
            if city_col and not s.get('city'):
                s['city'] = city_col
            
            # Phone
            phone = found.get('TÃ©lÃ©phone') or found.get('Téléphone')
            if phone:
                s['phone'] = phone
            
            # Email
            email = found.get('email')
            if email:
                s['email'] = email
            
            # Socials
            fb = found.get('facebook')
            if fb:
                s['facebook'] = fb
            tw = found.get('twitter')
            if tw:
                s['twitter'] = tw

    # Write back
    new_content = "// enriched with radyo_Ayiti.xlsx\nexport const stations = " + json.dumps(stations, indent=2, ensure_ascii=False) + ";"
    with open(ts_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
        
    print(f"Successfully enriched {enriched_count} stations.")

if __name__ == "__main__":
    enrich()


import re
import json
import os

def find_missing_programs():
    ts_stations_path = 'data/working_stations_2.ts'
    ts_programs_path = 'data/programs_updated.ts'
    
    # Read stations
    with open(ts_stations_path, 'r', encoding='utf-8') as f:
        content = f.read()
    match = re.search(r'export const stations = (\[.*\]);', content, re.DOTALL)
    stations = []
    if match:
        stations_str = match.group(1)
        obj_matches = re.finditer(r'\{[^{}]*\}', stations_str, re.DOTALL)
        for om in obj_matches:
            try:
                clean_obj = re.sub(r',\s*\}', '}', om.group(0))
                stations.append(json.loads(clean_obj))
            except:
                continue

    # Read programs
    with open(ts_programs_path, 'r', encoding='utf-8') as f:
        p_content = f.read()
    
    # Find all stationId in programs
    program_station_ids = set(re.findall(r"stationId:\s*['\"](\d+)['\"]", p_content))
    
    missing = []
    for s in stations:
        if s['id'] not in program_station_ids:
            missing.append(s)
            
    print(f"Total Stations: {len(stations)}")
    print(f"Stations with programs: {len(program_station_ids)}")
    print(f"Stations missing programs: {len(missing)}")
    
    for m in missing[:20]:
        print(f"ID: {m['id']} - Name: {m['name']}")

if __name__ == "__main__":
    find_missing_programs()

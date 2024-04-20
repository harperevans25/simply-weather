import json

with open('public/raw_city_json.json') as f:
    data = json.load(f)
    temp_data = []
    for d in data:
        if d['cou_name_en'] != 'United States':
            continue
        temp_dict = {}
        temp_dict['name'] = d['name']+', '+d['admin1_code'].replace(',','')
        temp_dict['coordinates'] = d['coordinates']
        temp_data.append(temp_dict)

with open('src/city_json.json','w') as f:
    temp_dict = {'places':temp_data}
    json.dump(temp_dict,f)
import json
from tqdm import tqdm

nodes = []
sids = []

preset = "3k"
sampledate = "170629"
gamesToGet = {"1k": 1000, "3k": 3000}

with open('../public/data/steamNet{}-{}.json'.format(preset, sampledate)) as data_file:
    data = json.load(data_file)
    for item in tqdm(data['nodes']):
        sid = item["id"]

        if sid in sids:
            continue

        sids.append(sid)
        edges = []
        for e in data['edges']:
            if e['to'] == sid:
                otherSid = e['from']
            else:
                if e['from'] == sid:
                    otherSid = e['to']
                else:
                    continue
            edges.append(str(otherSid))
        nodes.append(str(sid)+";"+";".join(edges))

with open('../public/data/steamNet{}-{}.csv'.format(preset, sampledate), 'w') as f:
    f.write("\n".join(nodes))

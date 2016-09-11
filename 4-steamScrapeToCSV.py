import json
from tqdm import tqdm

nodes = []
sids = []

with open('data/steamNet1k.json') as data_file:
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

with open('data/steamNet1k.csv', 'w') as f:
    f.write("\n".join(nodes))

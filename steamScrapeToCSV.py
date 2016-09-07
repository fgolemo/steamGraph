import json
from tqdm import tqdm

nodes = []
sids = []

with open('data/steamGraph.json') as data_file:
    data = json.load(data_file)
    for item in tqdm(data):
        sid = item["id"].encode('ascii', 'ignore')
        try:
            sid = int(sid)
        except ValueError:
            urlParts = item['link'].split('/')
            sid = int(urlParts[-1].encode('ascii', 'ignore'))

        if sid in sids:
            # print item
            continue

        # if item['rank'] > 1000:
        #     continue

        sids.append(sid)
        edges = [str(e.encode('ascii', 'ignore')) for e in item['related']]
        nodes.append(str(sid)+";"+";".join(edges))



with open('data/steamNet.csv', 'w') as f:
    f.write("\n".join(nodes))

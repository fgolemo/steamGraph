import json
from tqdm import tqdm

nodes = []
edges = []
sids = []

with open('data/steamGraph.json') as data_file:
    data = json.load(data_file)
    for item in tqdm(data):
        rating = item["rating"].encode('ascii', 'ignore')
        if rating != "":
            rating = int(rating)
        else:
            rating = -1
        sid = item["id"].encode('ascii', 'ignore')
        try:
            sid = int(sid)
        except ValueError:
            urlParts = item['link'].split('/')
            sid = int(urlParts[-1].encode('ascii', 'ignore'))

        if sid in sids:
            print item
            continue

        if item['rank'] > 1000:
            continue

        sids.append(sid)
        itemClean = {
            'rating': rating,
            'label': item['name'],#.encode('ascii', 'ignore'),
            'rank': item["rank"],
            'id': sid,
            'link': item["link"].encode('ascii', 'ignore'),
            'value':0
        }
        # print itemClean

        nodes.append(itemClean)

        for edge in [int(e.encode('ascii', 'ignore')) for e in item['related']]:
            edgeClean = {
                'id': '{}-{}'.format(sid, edge),
                'from': sid,
                'to': edge,
                'value': 0
            }
            edgeExists = False
            for otherEdge in edges:
                if otherEdge['to'] == sid and otherEdge['from'] == edge:
                    edgeExists = True
                    break
            if not edgeExists:
                edges.append(edgeClean)
        #{id: '1-3', from: 1, to: 3, value: 0}

with open('data/steamNet.json', 'w') as f:
     json.dump({'nodes': nodes, 'edges': edges}, f)
#
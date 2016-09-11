import json
from tqdm import tqdm

nodes = []
edges = []
sids = []

tags = set()

movies = 0
software = 0

total = 0
lowRating = 0

with open('data/steamGraph6k3.json') as data_file:
    data = json.load(data_file)
    data = sorted(data, key=lambda k: k['players'], reverse=True)
    count = 0
    for item in tqdm(data):
        total += 1
        tagsTmp = [t.encode('ascii', 'ignore') for t in item["tags"]]
        tags = set(tagsTmp + list(tags))
        if "Movie" in tagsTmp or "Documentary" in tagsTmp or item["name"] == "Kung Fury":
            movies+=1
            continue
        if "Software" in tagsTmp or "Utilities" in tagsTmp \
                or "Game Development" in tagsTmp or "Video Production" in tagsTmp \
                or "Design & Illustration" in tagsTmp or item["name"] == "Tilt Brush":
            software+=1
            continue
        if item["players"] < 100: # this is for the 3K graph
            lowRating +=1
            continue
        if count == 999:
            break
        count += 1

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

        # if item['rank'] > 1000:
        #     continue

        sids.append(sid)
        itemClean = {
            'players': item['players'],
            'tags': tagsTmp,
            'rating': rating,
            'label': item['name'],#.encode('ascii', 'ignore'),
            # 'rank': item["rank"],
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

edgesClean = []
for e in edges:
    if e['to'] in sids and e['from'] in sids:
        edgesClean.append(e)

with open('data/steamNet1k.json', 'w') as f:
     json.dump({'nodes': nodes, 'edges': edgesClean}, f)
#

# for t in tags:
#     print t+""
print "\n"
print total
print lowRating

print movies
print software



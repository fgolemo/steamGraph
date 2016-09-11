import json
from tqdm import tqdm

nodes = []

with open('data/steamNet1k.json') as data_file, open('data/steamNetPositions1k.gdf') as positions_file:
    data = json.load(data_file)

    firstLine = True
    for line in tqdm(positions_file):
        if firstLine:
            firstLine = False
            continue

        lineSplit = line[:-1].split(',')
        if lineSplit[0] == 'edgedef> node1':
            break
        id = int(lineSplit[0])
        x = float(lineSplit[-2])
        y = float(lineSplit[-1])
        # print lineSplit, x, y, id
        for node in data['nodes']:
            if node['id'] == id:
                node['x'] = x
                node['y'] = y
                nodes.append(node)
                break

with open('data/steamNetWithPos1k.json', 'w') as f:
     json.dump({'nodes': nodes, 'edges': data['edges']}, f)
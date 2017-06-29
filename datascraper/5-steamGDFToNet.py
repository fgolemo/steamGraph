import json
from tqdm import tqdm

nodes = []

preset = "3k"
gamesToGet = {"1k": 1000, "3k": 3000}

with open('../public/data/steamNet'+preset+'.json') as data_file, \
        open('../public/data/steamNetPositions'+preset+'.gdf') as positions_file:
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

with open('../public/data/steamNetWithPos'+preset+'.json', 'w') as f:
     json.dump({'nodes': nodes, 'edges': data['edges']}, f)
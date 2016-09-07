import os
import json
import urllib
from tqdm import tqdm

with open('data/steamGraph.json') as data_file:
    data = json.load(data_file)
    for item in tqdm(data):
        sid = item['id']
        urllib.urlretrieve("http://cdn.akamai.steamstatic.com/steam/apps/{}/capsule_184x69.jpg".format(sid),
                           "data/img/{}.jpg".format(sid))
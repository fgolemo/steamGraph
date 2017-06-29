# -*- coding: utf-8 -*-

from urlparse import urlparse
from scrapy.selector import Selector
from scrapy.linkextractors.sgml import SgmlLinkExtractor
from scrapy.spiders import CrawlSpider, Rule
from scrapy.http import Request, FormRequest
import re
import json

class SteampoweredComSpider(CrawlSpider):
    name = 'steampowered_com'
    allowed_domains = ['steamdb.info', 'store.steampowered.com']
    check_age = False

    # rules = (
    #     Rule(
    #         SgmlLinkExtractor(
    #             allow=r'(top\/p\.)([1-9]|1[0-9]|20)$',
    #         ),
    #         follow=True,
    #         callback='parse_steamcharts'
    #     ),
    # )

    def start_requests(self):
        return [
            Request('https://steamdb.info/graph/', callback=self.parse_steamcharts)
        ]

    def parse_steamcharts(self, response):
        # sel = Selector(response)
        #
        # url = urlparse(response.url)

        games = response.css('#table-apps tbody tr.app')

        if len(games) > 0:
            for game in games:
                # print "\n\n"+\
                #       game.css("::attr(data-appid)").extract_first()+\
                #       game.css("td:nth-child(3)::text").extract_first()+\
                #       game.css("td:nth-child(6)::text").extract_first()+\
                #       "\n\n"
                # print "\n\n"+game+"\n\n"

                gameID = game.css("::attr(data-appid)").extract_first()
                gamePlayers = int(game.css("td:nth-child(6)::text").extract_first().replace(',', ''))

                # if self.check_age is False:
                #     self.check_age = True

                yield FormRequest(
                    'http://store.steampowered.com/agecheck/app/{}/'.format(gameID),
                    formdata={
                        'ageDay': '1',
                        'ageMonth': 'January',
                        'ageYear': '1980'
                    },
                    meta={
                        'players': gamePlayers
                    },
                    callback=self.parse_game_store
                )

                # else:
                #     yield Request(
                #         'http://store.steampowered.com/app/{}/'.format(gameID),
                #         meta={
                #             'players': gamePlayers
                #         },
                #         callback=self.parse_game_store
                #     )
                # quit()

    def normalizJSON(self, badJSON):

        badJSON = badJSON.replace("'", '|||')
        badJSON = badJSON.replace('"name"', "'name'")
        badJSON = badJSON.replace('"url_name"', "'url_name'")
        badJSON = badJSON.replace('"discount_block"', "'discount_block'")
        badJSON = badJSON.replace('"discount"', "'discount'")
        badJSON = badJSON.replace('"os_windows"', "'os_windows'")
        badJSON = badJSON.replace('"os_linux"', "'os_linux'")
        badJSON = badJSON.replace('"os_macos"', "'os_macos'")
        badJSON = badJSON.replace('"small_capsulev5"', "'small_capsulev5'")
        badJSON = badJSON.replace('"localized"', "'localized'")
        badJSON = badJSON.replace('"coming_soon"', "'coming_soon'")
        badJSON = badJSON.replace('"early_access"', "'early_access'")
        badJSON = badJSON.replace('"software"', "'software'")
        badJSON = badJSON.replace('"video"', "'video'")
        badJSON = badJSON.replace('"status_string"', "'status_string'")
        badJSON = badJSON.replace('"tiny_capsule"', "'tiny_capsule'")
        badJSON = badJSON.replace('"appids"', "'appids'")
        badJSON = badJSON.replace('"has_adult_content_violence"', "'has_adult_content_violence'")
        badJSON = badJSON.replace('"has_adult_content_sex"', "'has_adult_content_sex'")
        badJSON = badJSON.replace('"vr_razerosvr"', "'vr_razerosvr'")
        badJSON = badJSON.replace('"vr_htcvive"', "'vr_htcvive'")
        badJSON = badJSON.replace('"vr_oculusrift"', "'vr_oculusrift'")
        badJSON = badJSON.replace('"virtual_reality"', "'virtual_reality'")
        badJSON = re.sub(r'"(\d+)"', r"'\1'", badJSON)
        badJSON = badJSON.replace(':"', ":'")
        badJSON = badJSON.replace('",', "',")
        badJSON = badJSON.replace(r'\"', r"\'")

        badJSON = badJSON.replace(r'"', r"\"")
        badJSON = badJSON.replace(r"\'", r'\"')
        badJSON = badJSON.replace(r"'", r'"')
        badJSON = badJSON.replace("|||", "'")

        badJSON = badJSON.replace(r'\"},"', '"},"') # hack to prevent status text bug

        return badJSON

    def parse_game_store(self, response):
        sel = Selector(response)
        i = dict()




        i['link'] = response.url
        linkParts = i['link'].split('/')


        if response.css("#agecheck_form h2::text").extract_first() != None:
            print "\n\n"+response.url+"\n\n"

        # if i['link'][-1] == "/":
        #     i['id'] = linkParts[-2]
        # else:
        #     i['id'] = linkParts[-1]
        if len(linkParts) < 5:
            return
        i['id'] = linkParts[4]

        i['players'] = response.meta['players']
        i['name'] = response.css('.apphub_AppName::text').extract_first()

        if i['name'] == None:
            return
        if "Borderla" in i['name'] or "METAL GEAR" in i['name'] or "Mankind" in i['name']:
            print "\n\n\n\n\n\n\n",i,"\n\n\n\n\n\n\n"
        i['rating'] = ''.join(sel.xpath("normalize-space(//*[@itemprop='ratingValue']/@content)").extract())

        tags = response.css('a.app_tag::text').extract()
        i['tags'] = [t.strip() for t in tags]

        pattern = re.compile(r'GStoreItemData.AddStoreItemData\(\W+\{(.+?)\,"localized":true[A-Za-z0-9":_,!]*\}\}\W*?\);', re.MULTILINE | re.DOTALL)
        state = 0
        try:
            locations1 = '{'+response.xpath('//script[contains(., "GStoreItemData.AddStoreItemData")]/text()').re(pattern)[0]+',"localized":true}}'
            state = 1
            locations2 = locations1.split('\n')
            state = 2
            locations3 = locations2[0]
            state = 3
            if len(locations2) > 1:
                locations3 = locations3[:-2]
                state = 4
            locations4 = self.normalizJSON(locations3)
            state = 5
            try:
                locations = json.loads(locations4)
                i['related'] = locations.keys()
            except ValueError, e:
                print ("\n\n")
                print (locations1)
                print ("\n\n")
                print (locations3)
                print ("\n\n")
                print (locations4)
                print ("\n\n")
                raise e
            # print ("\n\n")
            # print (locations.keys())
            # print ("\n\n")
        except IndexError, e:
            print "\n\nfail\n\n"
            print response.xpath('//script[contains(., "GStoreItemData.AddStoreItemData")]/text()').extract_first()
            i['related'] = []
            print "state: {}".format(state)
            print e

        if len(i["related"]) == 0:
            return

        return i

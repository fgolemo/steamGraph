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
    allowed_domains = ['steamcharts.com', 'store.steampowered.com']
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
            Request('http://steamcharts.com/top', callback=self.parse_steamcharts)
        ]

    def parse_steamcharts(self, response):
        sel = Selector(response)

        url = urlparse(response.url)

        games = sel.xpath('//*[@id="top-games"]/tbody/tr')

        if len(games) > 0:
            for game in games:
                rank = int(float(''.join(game.xpath('number(td[1]//text())').extract())))

                relative_app_url = ''.join(game.xpath('td[2]/a/@href').extract())
                request_url = '%s://%s%s' % (url.scheme, url.netloc, relative_app_url)

                yield Request(
                    request_url,
                    meta={
                        'rank': rank,
                        'relative_app_url': relative_app_url
                    },
                    callback=self.parse_steamcharts
                )

        pagination = sel.xpath('//*[@class="pagination"]/a[contains(., "Next")]/@href').re(
            r'(\/top\/p\.(\d+))')  # /top/p.2
        if len(pagination) > 0:
            if int(pagination[1]) <= 200:
                yield Request(
                    '%s://%s%s' % (url.scheme, url.netloc, pagination[0]),
                    callback=self.parse_steamcharts
                )

        store = ''.join(sel.xpath('//*[@id="app-links"]/a[contains(., "Store")]/@href').extract())
        if store != '':
            if self.check_age is False:
                self.check_age = True

                yield FormRequest(
                    'http://store.steampowered.com/agecheck%s' % response.meta['relative_app_url'],
                    formdata={
                        'ageDay': '1',
                        'ageMonth': 'January',
                        'ageYear': '1980'
                    },
                    meta={
                        'rank': response.meta['rank'],
                        'relative_app_url': response.meta['relative_app_url']
                    },
                    callback=self.parse_game_store
                )

            else:
                yield Request(
                    store,
                    meta={
                        'rank': response.meta['rank'],
                        'relative_app_url': response.meta['relative_app_url']
                    },
                    callback=self.parse_game_store
                )

    def parse_game_store(self, response):
        sel = Selector(response)
        i = dict()

        i['link'] = response.url
        linkParts = i['link'].split('/')
        i['id'] = linkParts[-2]
        i['rank'] = response.meta['rank']
        i['name'] = response.css('.apphub_AppName::text').extract_first()
        if i['name'] == None:
            return
        i['rating'] = ''.join(sel.xpath("normalize-space(//*[@itemprop='ratingValue']/@content)").extract())
        # i['release_date'] = ''.join(sel.xpath(
        #     'normalize-space(//*[@id="main_content"]//*[@class="block_content_inner"]//*[contains(text(), "Release Date")]/following-sibling::text())').extract())
        # i['about'] = ''.join(sel.xpath(
        #     'normalize-space(//*[@id="game_highlights"]//*[@class="game_description_snippet"]/text())').extract())

        # relatedItems = response.css('#recommended_block_content').extract() # doesn't work because populated by JS
        # i['related'] = relatedItems

        pattern = re.compile(r'GStoreItemData.AddStoreItemData\(\W+\{(.+?)\,"localized":true\}\}\W*?\);', re.MULTILINE | re.DOTALL)
        try:
            locations1 = '{'+response.xpath('//script[contains(., "GStoreItemData.AddStoreItemData")]/text()').re(pattern)[0]+',"localized":true}}'
            locations2 = locations1.split('\n')
            locations3 = locations2[0]
            if len(locations2) > 1:
                locations3 = locations3[:-2]
            locations4 = re.sub(r'""([ a-zA-Z]+?)""', '"\1"', locations3)
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
        except IndexError:
            print "\n\nfail\n\n"
            i['related'] = []

        return i

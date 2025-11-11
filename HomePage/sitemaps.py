from django.contrib.sitemaps import Sitemap
from django.shortcuts import reverse

class StaticViewSitemap(Sitemap):
    priority = 0.8
    changefreq = 'weekly'

    def items(self):
        return ['home', 'about', 'contact', 'leadership', 'history', 'familyhistory', 'advisoryboard', 'news', 'SM', 'SB', 'SR', 'institutional', 'brokerdealer', 'SA', 'SE', 'SS', ]  # Replace with your actual URL names

    def location(self, item):
        return reverse(item)

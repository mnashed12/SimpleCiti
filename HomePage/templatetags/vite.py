import json
import os
from django import template
from django.conf import settings

register = template.Library()

MANIFEST_RELATIVE = os.path.join('staticfiles', 'react', '.vite', 'manifest.json')


def _load_manifest():
    manifest_path = os.path.join(settings.BASE_DIR, MANIFEST_RELATIVE)
    try:
        with open(manifest_path, 'r') as f:
            return json.load(f)
    except Exception:
        return {}


@register.simple_tag
def vite_asset_file(entry='src/main.jsx', kind='js'):
    """
    Resolve the built asset path from Vite manifest.
    kind: 'js' -> returns the main js file path under /static/react/
          'css' -> returns the first css file path under /static/react/ (or '')
    """
    manifest = _load_manifest()
    info = manifest.get(entry)
    if not info:
        # fallback to first entry
        if manifest:
            info = next(iter(manifest.values()))
        else:
            return ''

    static_prefix = getattr(settings, 'STATIC_URL', '/static/')
    base = static_prefix.rstrip('/') + '/react/'

    if kind == 'css':
        css_files = info.get('css') or []
        if not css_files:
            return ''
        return base + css_files[0]

    # default JS file
    return base + info.get('file', '')

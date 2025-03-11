const script = document.getElementById('init');

    script.onload = () => {
        putInitScript('runPlugin');
        runPlugin('ctrader-plugin-root', {"route":"/market-chart/?s=EURUSD&period=H1&charttype=candlestick&palettename=dark&lang=en&w=830&h=700"});
    };

    
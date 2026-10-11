#!/usr/bin/env python3
"""Lê docs/empresas.md e gera src/sim/data/stocks.generated.ts.

Formato esperado de cada empresa (linhas que não casam, como citações soltas, são ignoradas):
    TICKER (Nome - País): MOEDA 1.234,56 - descrição
Para empresas novas, adicione o ticker em SECTOR abaixo (padrão: industria).
Uso: python3 scripts/generate-stocks.py   (ou npm run gen:stocks)
"""
import json, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'docs' / 'empresas.md'
OUT = ROOT / 'src' / 'sim' / 'data' / 'stocks.generated.ts'

# vol (meia-amplitude mensal), drift mensal, dividend yield anual, beta
SECTOR_PARAMS = {
    'tecnologia': (0.12, 0.0085, 0.006, 1.25), 'financeiro': (0.09, 0.0055, 0.04, 1.05),
    'energia': (0.10, 0.004, 0.05, 0.95), 'saude': (0.075, 0.006, 0.02, 0.7),
    'consumo': (0.065, 0.005, 0.03, 0.65), 'varejo': (0.085, 0.0055, 0.015, 0.9),
    'industria': (0.09, 0.0055, 0.02, 1.05), 'utilidades': (0.055, 0.003, 0.055, 0.45),
    'telecom': (0.06, 0.0035, 0.05, 0.55), 'imobiliario': (0.09, 0.005, 0.04, 1.1),
    'materiais': (0.11, 0.004, 0.05, 1.15), 'luxo': (0.095, 0.006, 0.015, 1.0),
}

def sectors(spec):
    out = {}
    for sector, tickers in spec.items():
        for t in tickers.split():
            out[t] = sector
    return out

SECTOR = sectors({
    'tecnologia': 'AAPL MSFT NVDA GOOGL META AVGO NFLX ASML SAP TSM 005930 0700 000660 6758 9984 9988 8035 TCS',
    'financeiro': 'BRK.B JPM V MA ITUB4 BBDC4 BBAS3 B3SA3 BPAC11 ALV HSBC 1398 601939 8303 1299 FAB EMIRATESNBD ADCB DIB ADIB MULTIPLY DFM',
    'energia': 'XOM PETR4 PRIO3 SHEL TTE ENI RELIANCE ADNOCGAS ADNOCDIST ADNOCDRILL',
    'saude': 'LLY JNJ HYPE3 NOVN ROG AZN SAN',
    'consumo': 'PG ABEV3 JBSS3 OR NESN 600519',
    'varejo': 'AMZN WMT HD COST RADL3 BABA 3690',
    'industria': 'TSLA WEGE3 RENT3 SIE AIR VOW3 7203 6862 IHC SALIK AIRARABIA',
    'utilidades': 'ELET3 EQTL3 SBSP3 IBE TAQA DEWA',
    'telecom': 'VIVT3 DTE 0941 EAND',
    'imobiliario': 'EMAAR ALDAR EMARDEV',
    'materiais': 'VALE3 SUZB3 CSNA3 BOROUGE',
    'luxo': 'MC RMS',
})

VOL_MULT = {'TSLA': 1.6, 'NVDA': 1.35, 'AVGO': 1.15, 'META': 1.2, 'NFLX': 1.3, 'BRK.B': 0.7, 'V': 0.75, 'MA': 0.75,
            'JNJ': 0.8, 'PG': 0.8, 'WMT': 0.8, 'COST': 0.85, 'ASML': 1.2, '0700': 1.25, 'BABA': 1.3, '3690': 1.35,
            '9984': 1.5, '000660': 1.3, 'PRIO3': 1.3, 'CSNA3': 1.4, 'JBSS3': 1.2, 'MULTIPLY': 1.5, 'AIRARABIA': 1.2,
            '1398': 0.7, '601939': 0.7, 'DFM': 1.1}
YIELD = {'TSLA': 0, 'AMZN': 0, 'BRK.B': 0, 'NFLX': 0, 'BABA': 0, '3690': 0, '9988': 0, 'NVDA': 0.001, 'AVGO': 0.015,
         'TSM': 0.015, '005930': 0.02, 'TCS': 0.015, '8035': 0.012, 'GOOGL': 0.004, 'META': 0.004, 'AAPL': 0.005,
         'MSFT': 0.007, 'ASML': 0.01, 'SAP': 0.012, '000660': 0.01, '9984': 0.005}

CURRENCY = {'US$': 'USD', 'R$': 'BRL', '€': 'EUR', '£': 'GBP'}
GROUPS = {'Estados Unidos': 'eua', 'Brasil': 'brasil', 'Europa': 'europa', 'Ásia': 'asia', 'Emirados': 'emirados'}
GROUP_COUNTRY = {'eua': 'EUA', 'brasil': 'Brasil', 'emirados': 'Emirados'}
FLAGS = {'EUA': '🇺🇸', 'Brasil': '🇧🇷', 'Holanda': '🇳🇱', 'Suíça': '🇨🇭', 'França': '🇫🇷', 'Alemanha': '🇩🇪',
         'Reino Unido': '🇬🇧', 'Espanha': '🇪🇸', 'Itália': '🇮🇹', 'Taiwan': '🇹🇼', 'Coreia do Sul': '🇰🇷',
         'China': '🇨🇳', 'Japão': '🇯🇵', 'Índia': '🇮🇳', 'Hong Kong': '🇭🇰', 'Emirados': '🇦🇪'}
HOME = {'EUA': 'us', 'Brasil': 'br', 'França': 'fr', 'Alemanha': 'de', 'Reino Unido': 'uk', 'Espanha': 'es',
        'Itália': 'it', 'Coreia do Sul': 'kr', 'China': 'cn', 'Japão': 'jp', 'Índia': 'in', 'Emirados': 'ae'}

LINE = re.compile(r'^(\S+) \((.+)\): (US\$|R\$|€|£|[A-Z]{3}) ([\d.,]+)(?: \(ADR\))? - (.+)$')

def parse_number(raw):
    if ',' in raw:
        return float(raw.replace('.', '').replace(',', '.'))
    if re.fullmatch(r'\d{1,3}(\.\d{3})+', raw):
        return float(raw.replace('.', ''))
    return float(raw)

def main():
    group = None
    stocks, skipped, unknown = [], [], []
    for raw_line in SRC.read_text(encoding='utf-8').splitlines():
        line = raw_line.strip()
        if not line:
            continue
        header = next((v for k, v in GROUPS.items() if line.startswith(k)), None)
        if header and not LINE.match(line):
            group = header
            continue
        m = LINE.match(line)
        if not m:
            skipped.append(line)
            continue
        if group is None:
            sys.exit(f'Empresa antes de qualquer grupo: {line}')
        ticker, label, cur, price, desc = m.groups()
        name, country = (label.rsplit(' - ', 1) + [None])[:2] if ' - ' in label else (label, None)
        country = country or GROUP_COUNTRY[group]
        sector = SECTOR.get(ticker)
        if sector is None:
            unknown.append(ticker)
            sector = 'industria'
        vol, drift, dy, beta = SECTOR_PARAMS[sector]
        stocks.append({
            'ticker': ticker, 'name': name.strip(), 'group': group, 'country': country,
            'flag': FLAGS.get(country, '🏳️'), 'home': HOME.get(country), 'currency': CURRENCY.get(cur, cur),
            'price': parse_number(price), 'sector': sector, 'desc': desc.strip(),
            'vol': round(vol * VOL_MULT.get(ticker, 1), 4), 'drift': drift,
            'yield': YIELD.get(ticker, dy), 'beta': beta,
        })
    seen = set()
    for s in stocks:
        if s['ticker'] in seen:
            sys.exit(f"Ticker duplicado: {s['ticker']}")
        seen.add(s['ticker'])
    body = ',\n'.join('  ' + json.dumps(s, ensure_ascii=False) for s in stocks)
    OUT.write_text(
        "// GERADO por scripts/generate-stocks.py a partir de docs/empresas.md. Não edite à mão.\n"
        "import type { StockDef } from './market';\n\n"
        f"export const STOCKS: StockDef[] = [\n{body},\n];\n",
        encoding='utf-8',
    )
    print(f'{len(stocks)} empresas geradas em {OUT.relative_to(ROOT)}')
    print(f'{len(skipped)} linhas ignoradas (citações soltas): ' + ', '.join(sorted(set(skipped)))[:200])
    if unknown:
        print('ATENÇÃO, sem setor definido (usando industria): ' + ', '.join(unknown))

main()

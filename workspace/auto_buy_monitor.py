"""
自动买入监控脚本
触发条件：
- ETH < $2,700 → 买入 50% USDC
- SOL < $114 → 买入 50% USDC
"""

import requests
import urllib.parse
import hashlib
import hmac
import base64
import time
import json

api_key = '6fRqQvkfJkItEmtp9vgg0uCPWedMqSIradbb+A9wH6/iMOCwKa2uZFKA'
api_secret = '/dWq39ogunnC41vUM4zu+zIWoOvwq/hQClgR/Ex4LEFULYFdja9LgQZx2Phy5sU05OKBF8okmY/T7kywACcV1Q=='

# Trigger prices
ETH_BUY_TRIGGER = 2700
SOL_BUY_TRIGGER = 114

def get_kraken_signature(urlpath, data, secret):
    postdata = urllib.parse.urlencode(data)
    encoded = (str(data['nonce']) + postdata).encode()
    message = urlpath.encode() + hashlib.sha256(encoded).digest()
    mac = hmac.new(base64.b64decode(secret), message, hashlib.sha512)
    return base64.b64encode(mac.digest()).decode()

def kraken_request(uri_path, data):
    headers = {
        'API-Key': api_key,
        'API-Sign': get_kraken_signature(uri_path, data, api_secret)
    }
    return requests.post('https://api.kraken.com' + uri_path, headers=headers, data=data)

def get_prices():
    resp = requests.get('https://api.kraken.com/0/public/Ticker?pair=XETHZUSD,SOLUSD')
    data = resp.json()
    eth = float(data['result']['XETHZUSD']['c'][0])
    sol = float(data['result']['SOLUSD']['c'][0])
    return eth, sol

def get_usdc_balance():
    nonce = int(time.time() * 1000)
    resp = kraken_request('/0/private/Balance', {'nonce': nonce})
    balance = resp.json()
    return float(balance['result'].get('USDC', 0))

def buy_eth(usdc_amount):
    resp = requests.get('https://api.kraken.com/0/public/Ticker?pair=ETHUSDC')
    ask = float(resp.json()['result']['ETHUSDC']['a'][0])
    eth_amount = round((usdc_amount * 0.995) / ask, 6)

    nonce = int(time.time() * 1000)
    order = {
        'nonce': nonce,
        'ordertype': 'market',
        'type': 'buy',
        'volume': str(eth_amount),
        'pair': 'ETHUSDC'
    }
    result = kraken_request('/0/private/AddOrder', order).json()
    return result

def buy_sol(usdc_amount):
    resp = requests.get('https://api.kraken.com/0/public/Ticker?pair=SOLUSDC')
    ask = float(resp.json()['result']['SOLUSDC']['a'][0])
    sol_amount = round((usdc_amount * 0.995) / ask, 4)

    nonce = int(time.time() * 1000)
    order = {
        'nonce': nonce,
        'ordertype': 'market',
        'type': 'buy',
        'volume': str(sol_amount),
        'pair': 'SOLUSDC'
    }
    result = kraken_request('/0/private/AddOrder', order).json()
    return result

def check_and_execute():
    eth_price, sol_price = get_prices()
    usdc = get_usdc_balance()

    print(f"ETH: ${eth_price:.2f} (trigger: <${ETH_BUY_TRIGGER})")
    print(f"SOL: ${sol_price:.2f} (trigger: <${SOL_BUY_TRIGGER})")
    print(f"USDC: ${usdc:.2f}")

    executed = []

    # Check ETH
    if eth_price < ETH_BUY_TRIGGER and usdc >= 50:
        spend = min(usdc * 0.5, usdc)  # 50% or all if less than $100
        print(f"\n[BUY] ETH TRIGGERED! Buying with ${spend:.2f}")
        result = buy_eth(spend)
        if not result.get('error'):
            executed.append(f"ETH bought at ${eth_price:.2f}")
            print(f"SUCCESS: {result['result']['descr']['order']}")
        else:
            print(f"ERROR: {result['error']}")
        usdc = get_usdc_balance()  # Refresh balance

    # Check SOL
    if sol_price < SOL_BUY_TRIGGER and usdc >= 50:
        spend = min(usdc * 0.5, usdc)
        print(f"\n[BUY] SOL TRIGGERED! Buying with ${spend:.2f}")
        result = buy_sol(spend)
        if not result.get('error'):
            executed.append(f"SOL bought at ${sol_price:.2f}")
            print(f"SUCCESS: {result['result']['descr']['order']}")
        else:
            print(f"ERROR: {result['error']}")

    return executed

if __name__ == "__main__":
    print("=== Auto Buy Monitor ===")
    print(f"Time: {time.strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    executed = check_and_execute()
    if executed:
        print(f"\n[OK] Executed: {executed}")
    else:
        print("\n[WAIT] No triggers hit - waiting")

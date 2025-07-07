import requests
import subprocess
import time
import re
import platform
import webbrowser

# === CONFIG ===
from dotenv import load_dotenv
import os

load_dotenv()
BEARER_TOKEN = os.getenv("BEARER_TOKEN")
USERNAME = "WhiteHouse"
POLL_INTERVAL = 90  # seconds
STREAMLINK_QUALITY = "worst"

HEADERS = {
    "Authorization": f"Bearer {BEARER_TOKEN}"
}

# === HELPERS ===

def get_user_id(username):
    url = f"https://api.twitter.com/2/users/by/username/{username}"
    response = requests.get(url, headers=HEADERS)

    if response.status_code == 200:
        return response.json()['data']['id']
    elif response.status_code == 429:
        print("[WARN] Rate limit hit while fetching user ID. Waiting 2 minutes...")
        time.sleep(120)
        return get_user_id(username)  # retry
    else:
        print(f"[ERROR] Failed to fetch user ID: {response.text}")
        return None

def fetch_latest_tweets(user_id, max_results=5):
    url = f"https://api.twitter.com/2/users/{user_id}/tweets"
    params = {
        "max_results": max_results,
        "tweet.fields": "text,created_at,attachments",
        "expansions": "attachments.media_keys",
        "media.fields": "type,url"
    }
    response = requests.get(url, headers=HEADERS, params=params)
    if response.status_code == 200:
        return response.json()
    else:
        print(f"[ERROR] Failed to fetch tweets: {response.text}")
        return None

def extract_urls(text):
    return re.findall(r'https?://\S+', text)

def detect_live_video(tweet_data):
    tweets = tweet_data.get('data', [])
    includes = tweet_data.get('includes', {})
    media = includes.get('media', [])

    for tweet in tweets:
        text = tweet.get('text', '').lower()
        urls = extract_urls(tweet.get('text', ''))

        # ✅ CASE 1: YouTube livestream
        for url in urls:
            if "youtube.com/watch" in url or "youtu.be" in url:
                print("[ALERT] 🚨 YouTube livestream detected!")
                tweet['external_url'] = url
                return tweet

        # ✅ CASE 2: Native X (Twitter) livestream
        if 'attachments' in tweet:
            keys = tweet['attachments'].get('media_keys', [])
            for m in media:
                if m.get('media_key') in keys and m.get('type') == 'broadcast':
                    print("[ALERT] 🚨 Native Twitter livestream detected!")
                    tweet['external_url'] = None
                    return tweet

        # ⚠️ Fallback: has “live” in text, but no media or stream
        if any(kw in text for kw in [" live ", "now live", "broadcast"]):
            print("[INFO] ⚠️ Found post mentioning 'live', but no confirmed livestream.")

    return None


def alert_user():
    print("[ALERT] 🚨 LIVE STREAM DETECTED!")
    system = platform.system()
    try:
        if system == "Windows":
            import winsound
            winsound.Beep(1000, 700)
        elif system == "Darwin":
            subprocess.call(["afplay", "/System/Library/Sounds/Glass.aiff"])
        elif system == "Linux":
            subprocess.call(["paplay", "/usr/share/sounds/freedesktop/stereo/complete.oga"])
    except Exception as e:
        print(f"[WARN] Sound alert failed: {e}")

def launch_stream(tweet):
    url = tweet.get('external_url')
    fallback_url = f"https://x.com/{USERNAME}/status/{tweet['id']}"

    if url:
        if "youtube.com" in url or "youtu.be" in url:
            print(f"[INFO] Launching YouTube stream with streamlink: {url}")
            try:
                subprocess.call(["streamlink", "--player", "mpv", url, STREAMLINK_QUALITY])
            except Exception as e:
                print(f"[ERROR] Streamlink failed. Opening in browser instead. Reason: {e}")
                webbrowser.open(url)
        else:
            print(f"[INFO] External URL found (non-YouTube). Opening in browser: {url}")
            webbrowser.open(url)
    else:
        print(f"[INFO] No external link found. Opening original tweet instead: {fallback_url}")
        webbrowser.open(fallback_url)



# === MAIN ===

def main():
    print("[INFO] Initializing White House livestream monitor...")
    user_id = get_user_id(USERNAME)
    if not user_id:
        return

    print(f"[INFO] Monitoring @{USERNAME} (User ID: {user_id}) every {POLL_INTERVAL} seconds...")

    seen_ids = set()

    while True:
        tweet_data = fetch_latest_tweets(user_id)
        if tweet_data:
            live_tweet = detect_live_video(tweet_data)
            if live_tweet and live_tweet['id'] not in seen_ids:
                seen_ids.add(live_tweet['id'])
                alert_user()
                launch_stream(live_tweet)
        time.sleep(POLL_INTERVAL)

if __name__ == "__main__":
    main()

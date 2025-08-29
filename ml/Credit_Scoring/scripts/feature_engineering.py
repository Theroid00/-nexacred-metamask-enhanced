import json
import pandas as pd
from collections import defaultdict
from tqdm import tqdm
import os
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INPUT_JSON = os.path.join(BASE_DIR, "data", "user-wallet-transactions.json")
OUTPUT_CSV = os.path.join(BASE_DIR, "data", "features.csv")

def load_transactions(filepath):
    with open(filepath, 'r') as f:
        return json.load(f)

def parse_transactions(data):
    wallet_data = defaultdict(list)
    for tx in data:
        wallet = tx['userWallet']
        wallet_data[wallet].append(tx)
    return wallet_data

def engineer_features(wallet_data):
    features = []

    for wallet, txs in tqdm(wallet_data.items(), desc="Engineering features"):
        feature = {
            "wallet": wallet,
            "num_transactions": len(txs),
            "num_deposits": 0,
            "num_borrows": 0,
            "num_repays": 0,
            "num_withdraws": 0,
            "num_liquidations": 0,
            "total_deposit_usd": 0,
            "total_borrow_usd": 0,
            "total_repay_usd": 0,
            "was_liquidated": 0
        }

        for tx in txs:
            action = tx.get("action", "").lower()
            data = tx.get("actionData", {})
            amount = float(data.get("amount", 0)) / 1e18  # Adjusting for token decimals
            price = float(data.get("assetPriceUSD", 1))

            usd_value = amount * price

            if action == "deposit":
                feature["num_deposits"] += 1
                feature["total_deposit_usd"] += usd_value
            elif action == "borrow":
                feature["num_borrows"] += 1
                feature["total_borrow_usd"] += usd_value
            elif action == "repay":
                feature["num_repays"] += 1
                feature["total_repay_usd"] += usd_value
            elif action == "redeemunderlying":
                feature["num_withdraws"] += 1
            elif action == "liquidationcall":
                feature["num_liquidations"] += 1
                feature["was_liquidated"] = 1

        # Derived feature: borrow/repay ratio
        feature["borrow_to_repay_ratio"] = (
            feature["total_borrow_usd"] / feature["total_repay_usd"]
            if feature["total_repay_usd"] > 0 else 999
        )

        features.append(feature)

    return pd.DataFrame(features)

def main():
    print("📥 Loading transactions...")
    transactions = load_transactions(INPUT_JSON)

    print("🔄 Grouping by wallet...")
    wallet_data = parse_transactions(transactions)

    print("🧠 Engineering features...")
    features_df = engineer_features(wallet_data)

    print(f"💾 Saving features to {OUTPUT_CSV}")
    features_df.to_csv(OUTPUT_CSV, index=False)
    print("✅ Done!")

if __name__ == "__main__":
    main()

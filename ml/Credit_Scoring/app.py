import streamlit as st
import pandas as pd
import numpy as np
import pickle

# Load trained model
MODEL_PATH = "models/credit_score_model.pkl"  # adjust if your model file is named differently
with open(MODEL_PATH, "rb") as f:
    model = pickle.load(f)

st.set_page_config(page_title="Aave Credit Score Predictor", layout="centered")
st.title("🔮 Aave Credit Score Predictor")
st.markdown("Fill in the user’s on-chain stats to predict their **Aave Credit Score**")

# Input fields for model features
num_transactions = st.number_input("Total Transactions", min_value=0)
num_deposits = st.number_input("Number of Deposits", min_value=0)
num_borrows = st.number_input("Number of Borrows", min_value=0)
num_repays = st.number_input("Number of Repays", min_value=0)
num_withdraws = st.number_input("Number of Withdrawals", min_value=0)
num_liquidations = st.number_input("Number of Liquidations", min_value=0)

total_deposit_usd = st.number_input("Total Deposited (USD)", min_value=0.0)
total_borrow_usd = st.number_input("Total Borrowed (USD)", min_value=0.0)
total_repay_usd = st.number_input("Total Repaid (USD)", min_value=0.0)

was_liquidated = st.selectbox("Was Liquidated?", options=[0, 1], format_func=lambda x: "Yes" if x == 1 else "No")

# Automatically calculate borrow_to_repay_ratio
borrow_to_repay_ratio = total_borrow_usd / total_repay_usd if total_repay_usd > 0 else 0.0

st.markdown(f"**Borrow to Repay Ratio:** `{borrow_to_repay_ratio:.2f}`")

# Predict button
if st.button("Predict Credit Score"):
    input_data = pd.DataFrame([{
        'num_transactions': num_transactions,
        'num_deposits': num_deposits,
        'num_borrows': num_borrows,
        'num_repays': num_repays,
        'num_withdraws': num_withdraws,
        'num_liquidations': num_liquidations,
        'total_deposit_usd': total_deposit_usd,
        'total_borrow_usd': total_borrow_usd,
        'total_repay_usd': total_repay_usd,
        'was_liquidated': was_liquidated,
        'borrow_to_repay_ratio': borrow_to_repay_ratio
    }])

    score = model.predict(input_data)[0]
    normalized_score = np.clip(score, 300, 850)  # Normalize if needed
    st.success(f"💳 **Predicted Aave Credit Score:** `{normalized_score:.2f}`")

    st.markdown("---")
    
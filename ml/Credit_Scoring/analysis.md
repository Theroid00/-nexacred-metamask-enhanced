# 📊 AAVE Credit Score Analysis

This document provides an in-depth analysis of DeFi wallet credit scores as predicted by our machine learning model trained on historical AAVE transaction data.

---

##  Overview

- **Total Wallets Scored:** XX wallets
- **Score Scale:** Normalized to a scale of 0–1000
- **Scoring Model:** LightGBM trained on behavioral wallet features
- **Key Features Used:** Borrow frequency, Repay count, Liquidation count, Deposit-Borrow ratios, Transaction engagement

---

##  Behavior of Wallets in Lower Score Range (0–300)

Wallets in this range are considered **high-risk** due to poor financial discipline on-chain. Common characteristics include:

-  **Frequent liquidations** indicating inability to maintain collateral health
-  **Low or no repayment activity**
-  **High borrow amounts** with **low deposits**
-  **Low engagement** (few total transactions)

---

##  Behavior of Wallets in Higher Score Range (700–1000)

Wallets in this range demonstrate **excellent financial behavior** and strong creditworthiness. Typical traits include:

-  **Timely repayments** and low outstanding debt
-  **No or minimal liquidations**
-  **High deposit volumes** and well-managed borrowing
-  **High transaction frequency**, indicating active and responsible protocol use

---

##  Score Distribution Graph

For a visual understanding of the distribution of wallet credit scores, refer to the graph located at:
**data/score_distribution.png**
This plot shows how the scores are spread across the 0–1000 range and helps identify clusters of low, average, and high-performing wallets.
---

##  Key Observations

-  Wallets with **consistent repayments** and **healthy borrow/deposit behavior** generally received **scores above 700**
-  A majority of wallets fall in the **400–600 range**, representing mixed behavior — some good practices but also signs of risk
-  Wallets below 300 show **repeated risky behaviors**, often ignored health factors like collateral ratios

---

##  Final Insight

>  *The model successfully identifies behavioral risk profiles based on on-chain data, helping DeFi platforms better assess wallet reliability.*

This analysis confirms that DeFi credit scoring is feasible and meaningful by leveraging historical wallet activity.

# AAVE Credit Score Prediction System

This project builds a machine learning-based credit scoring system for users interacting with the AAVE protocol. Based on wallet transactions (deposits, borrows, repayments, etc.), the system predicts a user's DeFi credit score.
---

##  Workflow

1. **Feature Engineering**  
   - Script: `scripts/feature_engineering.py`  
   - Parses raw transaction data (JSON) and extracts behavioral features like borrow/repay frequency, amounts, and patterns.

2. **Model Training**  
   - Script: `scripts/train_model.py`  
   - Trains a supervised ML model (**LightGBM**) on historical features and synthetic scores.  
   - Outputs `model/credit_score_model.pkl`.

3. **Wallet Scoring**  
   - Script: `scripts/score_wallets.py`  
   - Loads wallet features and predicts raw scores using the trained model.

4. **Normalization + Visualization**  
   - Script: `scripts/normalize_and_visualize.py`  
   - Normalizes predicted scores to a **300–850** scale.  
   - Generates the `data/score-distribution.png`.

5. **Streamlit App**  
   - File: `app.py`  
   - Upload wallet JSON and get instant credit score via a clean UI.
---

### 📁 Project Structure

```
AAVE-CREDIT-SCORE/
├── app.py                       # Streamlit dashboard
├── requirements.txt            # Python dependencies
├── README.md                   # Project overview and instructions
├── data/
│   ├── features.csv
│   ├── predicted_scores.csv
│   ├── predicted-scores-normalied.csv
│   ├── score-distribution.png
│   └── user-wallet-tansactions.json
├── model/
│   └── credit_score_model.pkl  # Trained LightGBM model
├── scripts/
│   ├── feature_engineering.py
│   ├── train_model.py
│   ├── score_wallets.py
│   └── normalize_and_visualize.py
├── screenshots/
│   └── test_case_output1.png   # Output screenshots
└── .gitignore                  # Ignore unnecessary files
```
##  Tech Stack

- Python
- LightGBM
- Streamlit (for interactive UI)
- Pandas
- Scikit-learn
- VS Code

---

##  Sample Input Features

| Feature Name            | Example Value |
|-------------------------|---------------|
| `wallet_address`        | 0xAB12...     |
| `num_transactions`      | 8             |
| `num_deposits`          | 1             |
| `num_borrows`           | 3             |
| `num_repayments`        | 2             |
| `total_deposit_usd`     | 500           |
| `total_borrow_usd`      | 2000          |
| `total_repayment_usd`   | 700           |
| `avg_borrow_interval`   | 14.5 days     |
| `repayment_ratio`       | 0.35          |
| `borrow_to_deposit_ratio` | 4.0        |

---

##  Setup & Installation

1. **Clone this repo**
   ```bash
   git clone https://github.com/Adithipawar/AAVE-CREDIT-SCORE.git
   cd AAVE-CREDIT-SCORE

2. **Create a virtual environment**
- python -m venv venv
- source venv/bin/activate  # Mac/Linux
- venv\Scripts\activate     # Windows

3. **Install dependencies**
pip install -r requirements.txt

4. **Run the app**
streamlit run app.py


## Screenshots
Please refer to the screenshots/ folder for the UI and the test case results.


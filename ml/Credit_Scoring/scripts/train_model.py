import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error
import lightgbm as lgb

# Load the engineered data
df = pd.read_csv("data/features.csv")

# Define the scoring logic
def compute_credit_score(row):
    score = 500
    score += row['total_deposit_usd'] * 0.0005
    score -= row['total_borrow_usd'] * 0.0007
    score += row['total_repay_usd'] * 0.0008
    score -= 100 if row['was_liquidated'] else 0
    score -= row['borrow_to_repay_ratio'] * 0.1
    return min(1000, max(0, score))

# Apply scoring function
df['credit_score'] = df.apply(compute_credit_score, axis=1)

# Drop wallet ID
X = df.drop(['wallet', 'credit_score'], axis=1)
y = df['credit_score']

# Train-test split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Train LightGBM model
model = lgb.LGBMRegressor()
model.fit(X_train, y_train)

# Evaluate
y_pred = model.predict(X_test)
mae = mean_absolute_error(y_test, y_pred)
print(f"Mean Absolute Error: {mae:.2f}")

# Save model
import pickle
with open("models/credit_score_model.pkl", "wb") as f:
    pickle.dump(model, f)

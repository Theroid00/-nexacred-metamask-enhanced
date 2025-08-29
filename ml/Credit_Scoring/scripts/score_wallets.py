import pandas as pd
import pickle

# Load the model
with open("models/credit_score_model.pkl", "rb") as f:
    model = pickle.load(f)

# Load the features dataset
df = pd.read_csv("data/features.csv")

# Extract wallet column (if exists) for mapping
wallets = df["wallet"] if "wallet" in df.columns else None

# Drop wallet column to keep only numerical features
X = df.drop(columns=["wallet"], errors="ignore")

# Make predictions
predictions = model.predict(X)

# Prepare output with wallet and predicted score
if wallets is not None:
    output = pd.DataFrame({
        "wallet": wallets,
        "predicted_score": predictions
    })
else:
    output = pd.DataFrame({
        "predicted_score": predictions
    })

# Save the predictions to CSV
output.to_csv("data/predicted_scores.csv", index=False)

print("✅ Predictions saved to data/predicted_scores.csv")

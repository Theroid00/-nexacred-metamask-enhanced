# scripts/normalize_and_visualize.py

import pandas as pd
from sklearn.preprocessing import MinMaxScaler
import matplotlib.pyplot as plt
import seaborn as sns

# Load predicted scores
df = pd.read_csv("data/predicted_scores.csv")

# Normalize scores to range (300 to 1000)
scaler = MinMaxScaler(feature_range=(300, 1000))
df["normalized_score"] = scaler.fit_transform(df[["predicted_score"]])

# Save the normalized scores
df.to_csv("data/predicted_scores_normalized.csv", index=False)

# --- Visualization ---

# Plot distribution of normalized scores
plt.figure(figsize=(10, 6))
sns.histplot(df["normalized_score"], bins=30, kde=True, color="skyblue")
plt.title("Distribution of Normalized Credit Scores")
plt.xlabel("Normalized Score")
plt.ylabel("Number of Wallets")
plt.grid(True)
plt.tight_layout()
plt.savefig("data/score_distribution.png")  # Save the plot
plt.show()

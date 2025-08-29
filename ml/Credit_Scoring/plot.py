import pandas as pd
import matplotlib.pyplot as plt

# Load the CSV file
df = pd.read_csv("data/predicted_scores.csv")  # adjust path if needed

# Plotting the score distribution
bins = list(range(0, 1100, 100))  # 0-100, 100-200, ..., 900-1000
plt.figure(figsize=(10, 6))
plt.hist(df['predicted_score'], bins=bins, edgecolor='black')
plt.title('Credit Score Distribution')
plt.xlabel('Score Range')
plt.ylabel('Number of Wallets')
plt.grid(axis='y', linestyle='--', alpha=0.7)
plt.xticks(bins)
plt.tight_layout()

# Save the plot
plt.savefig("data/score_distribution.png")
plt.show()

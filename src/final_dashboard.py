import streamlit as st
import pandas as pd
import plotly.express as px
import os

# ========================
# PAGE CONFIG
# ========================
st.set_page_config(page_title="WP3 Final Dashboard", layout="wide", page_icon="🧠")

st.title("🧠 WP3: Bias & Toxicity Analysis Across LLMs")
st.caption("Evaluating how Social Engineering prompt attacks influence model bias, fairness, and toxicity.")

st.markdown("---")


# ========================
# 2️⃣ LOAD DATA
# ========================
SUMMARY_PATH = "data/processed/bias_metrics_summary.json"
DETAIL_PATH = "data/processed/bias_metrics.json"

if not os.path.exists(SUMMARY_PATH):
    st.error("⚠️ Missing summary file. Please run bias_metrics.py first.")
    st.stop()

summary = pd.read_json(SUMMARY_PATH)
summary["identity_mention_rate"] *= 100
summary["negative_regard_percent"] *= 100
summary["refusal_rate"] *= 100

# ========================
# 3️⃣ MODEL COMPARISON
# ========================
st.markdown("### 🤖 Model Comparison of Bias")
st.write("Comparing how different LLMs behave under **baseline** and **social-engineered** prompts.")

condition = st.selectbox("Select Prompt Condition", summary["condition"].unique(), index=0)
filtered = summary[summary["condition"] == condition]

fig_model = px.bar(
    filtered,
    x="model_name",
    y=["identity_mention_rate", "negative_regard_percent", "refusal_rate"],
    barmode="group",
    color_discrete_sequence=["#3f51b5", "#ff7043", "#9e9e9e"],
    title=f"Bias Metrics by Model ({condition})",
    labels={"value": "Percentage (%)", "model_name": "Model"}
)
st.plotly_chart(fig_model, use_container_width=True)

st.markdown("---")

# ========================
# 4️⃣ SOCIAL ENGINEERING IMPACT
# ========================
st.markdown("### 🧠 Impact of Social Engineering Prompts")

pivot = summary.pivot_table(
    index="model_name",
    columns="condition",
    values=["identity_mention_rate", "negative_regard_percent", "refusal_rate"]
)
pivot.columns = [f"{a}_{b}" for a, b in pivot.columns]
pivot = pivot.reset_index()

if "identity_mention_rate_baseline" in pivot.columns:
    fig_se = px.bar(
        pivot,
        x="model_name",
        y=[
            "identity_mention_rate_baseline",
            "identity_mention_rate_social_eng",
            "negative_regard_percent_baseline",
            "negative_regard_percent_social_eng"
        ],
        barmode="group",
        color_discrete_sequence=["#64b5f6", "#1976d2", "#ffb74d", "#f57c00"],
        title="Baseline vs Social-Engineered Prompts: Identity Mention & Negative Regard"
    )
    st.plotly_chart(fig_se, use_container_width=True)

st.markdown("---")

# ========================
# 5️⃣ DISTRIBUTION CHART (OPTIONAL)
# ========================
st.markdown("### 🧩 Distribution of Bias Mentions Across Models")
fig_dist = px.pie(
    summary,
    names="model_name",
    values="identity_mention_rate",
    color_discrete_sequence=px.colors.qualitative.Pastel,
    title="Proportion of Identity Mentions by Model"
)
st.plotly_chart(fig_dist, use_container_width=True)

# ========================
# 6️⃣ KEY INSIGHTS
# ========================
# st.markdown("### 💡 Key Insights")
# st.markdown("""
# - Social-engineered prompts **increase** both identity mentions and negative regard across all models.
# - **Refusal rates drop** when models face persuasive or empathetic prompt injections.
# - **Grok** show higher bias exposure compared to GPT and Gemini.
# - This confirms that **prompt manipulation can bypass fairness safeguards**.
# """)

# st.markdown("---")



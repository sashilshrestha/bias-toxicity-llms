import streamlit as st
import pandas as pd
import json
import plotly.express as px
import subprocess
import os

# ----------------------------
# 1️⃣ PAGE CONFIGURATION
# ----------------------------
st.set_page_config(page_title="WP3 Bias & Toxicity Dashboard", layout="wide")

st.title("🧠 WP3 Bias & Toxicity Analysis Dashboard")
st.caption("Evaluating model bias, fairness, and toxicity across LLMs using WP1 dataset outputs")

# ----------------------------
# 2️⃣ RUN PIPELINE (OPTIONAL)
# ----------------------------
st.sidebar.header("⚙️ Pipeline Controls")

if st.sidebar.button("Run Bias Metrics Script"):
    with st.spinner("Running bias_metrics.py..."):
        subprocess.run(["python", "src/lbm/bias_metrics.py", "--preview", "5"])
    st.sidebar.success("✅ bias_metrics.py completed successfully!")

# ----------------------------
# 3️⃣ LOAD DATA
# ----------------------------
SUMMARY_PATH = "data/processed/bias_metrics_summary.json"
DETAIL_PATH = "data/processed/bias_metrics.json"

if not os.path.exists(SUMMARY_PATH) or not os.path.exists(DETAIL_PATH):
    st.error("Missing bias_metrics files. Please run bias_metrics.py first.")
    st.stop()

summary_df = pd.read_json(SUMMARY_PATH)
detail_df = pd.read_json(DETAIL_PATH)

# Normalize percentages for visualization
summary_df["identity_mention_rate"] *= 100
summary_df["negative_regard_percent"] *= 100
summary_df["refusal_rate"] *= 100

# ----------------------------
# 4️⃣ SUMMARY METRICS (TOP CARDS)
# ----------------------------
st.subheader("📊 Overview Metrics")

col1, col2, col3 = st.columns(3)

col1.metric(
    "Identity Mention Rate",
    f"{summary_df['identity_mention_rate'].mean():.1f}%",
    help="Average percentage of model responses that mention any identity-related terms."
)
col2.metric(
    "Negative Regard Rate",
    f"{summary_df['negative_regard_percent'].mean():.1f}%",
    help="Average percentage of negative sentiment when identity terms are mentioned."
)
col3.metric(
    "Refusal Rate",
    f"{summary_df['refusal_rate'].mean():.1f}%",
    help="Percentage of model refusals across prompts."
)

st.markdown("---")

# ----------------------------
# 5️⃣ MODEL COMPARISON
# ----------------------------
st.subheader("🤖 Model Comparison by Condition")

selected_condition = st.selectbox(
    "Select Condition",
    summary_df["condition"].unique(),
    index=0
)

filtered_summary = summary_df[summary_df["condition"] == selected_condition]

fig = px.bar(
    filtered_summary,
    x="model_name",
    y=["identity_mention_rate", "negative_regard_percent", "refusal_rate"],
    barmode="group",
    labels={"value": "Percentage", "model_name": "Model"},
    title=f"Model-wise Bias & Toxicity Rates ({selected_condition})"
)
st.plotly_chart(fig, use_container_width=True)

st.markdown("---")

# ----------------------------
# 6️⃣ BASELINE vs SOCIAL ENGINEERING
# ----------------------------
st.subheader("📈 Impact of Social Engineering Prompts")

pivot = summary_df.pivot_table(
    index="model_name",
    columns="condition",
    values=["identity_mention_rate", "negative_regard_percent", "refusal_rate"]
)

pivot = pivot.round(1)

# Convert multiindex to simpler labels for plotting
pivot.columns = [f"{m}_{c}" for m, c in pivot.columns]
pivot = pivot.reset_index()

if "baseline" in pivot.columns[0] and "social_eng" in pivot.columns[0]:
    # Plot comparison for each metric
    fig2 = px.bar(
        pivot,
        x="model_name",
        y=["identity_mention_rate_baseline", "identity_mention_rate_social_eng"],
        barmode="group",
        title="Identity Mention Rate: Baseline vs Social-Engineered Prompts"
    )
    st.plotly_chart(fig2, use_container_width=True)

    fig3 = px.bar(
        pivot,
        x="model_name",
        y=["negative_regard_percent_baseline", "negative_regard_percent_social_eng"],
        barmode="group",
        title="Negative Regard Rate: Baseline vs Social-Engineered Prompts"
    )
    st.plotly_chart(fig3, use_container_width=True)

    fig4 = px.bar(
        pivot,
        x="model_name",
        y=["refusal_rate_baseline", "refusal_rate_social_eng"],
        barmode="group",
        title="Refusal Rate: Baseline vs Social-Engineered Prompts"
    )
    st.plotly_chart(fig4, use_container_width=True)

st.markdown("---")

# ----------------------------
# 7️⃣ SAMPLE EXPLORER TABLE
# ----------------------------
st.subheader("🧾 Detailed Sample Explorer")

# Select model and filter
selected_model = st.selectbox(
    "Filter by Model",
    ["All"] + sorted(detail_df["model_name"].unique().tolist())
)

if selected_model != "All":
    detail_filtered = detail_df[detail_df["model_name"] == selected_model]
else:
    detail_filtered = detail_df

st.dataframe(
    detail_filtered[[
        "attack_id", "model_name", "condition", "identity_terms", 
        "regard_label", "negative_regard_flag", "refusal_flag"
    ]].head(50),
    use_container_width=True
)

st.info("Showing first 50 rows — explore negative regard or refusal patterns across LLMs.")

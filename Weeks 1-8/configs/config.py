llm_test_config = {
    "api_key": "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",
    "models": [
        {
            "alias": "deepseek",
            "model_name": "deepseek-ai/DeepSeek-V3.1:novita",
        },

        # Add more models here. Example shown below
        # {
        #     "alias": "gemma",
        #     "model_name": "google/gemma-2-9b-it:nebius",
        # },
    ]
}


llm_judge_config = {
    "api_key": "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",
    "alias": "GPT-4",
    "model_name": "deepseek-ai/DeepSeek-V3.1:novita" # best to use GPT 4, claude 4, not free, using deepseek to test for now
}


directory_data = {
    "processed_dataset_dir": "../data/processed",

    "deepseek": {
        "baseline": {
            "response_dir": "../data/output/response/deepseek/baseline",
            "eval_dir": "../data/output/evaluation/deepseek/baseline"
        },
        "mitigation": {
            "response_dir": "../data/output/response/deepseek/mitigation",
            "eval_dir": "../data/output/evaluation/deepseek/mitigation"
        }
    },

    # Add dir for other models. Example shown below

    # "gemma": {
    #     "baseline": {
    #         "response_dir": "../data/output/response/gemma/baseline",
    #         "eval_dir": "../data/output/evaluation/gemma/baseline"
    #     },
    #     "mitigation": {
    #         "response_dir": "../data/output/response/gemma/mitigation",
    #         "eval_dir": "../data/output/evaluation/gemma/mitigation"
    #     }
    # }
}

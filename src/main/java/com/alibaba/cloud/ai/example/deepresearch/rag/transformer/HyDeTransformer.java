package com.alibaba.cloud.ai.example.deepresearch.rag.transformer;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.prompt.PromptTemplate;
import org.springframework.ai.rag.Query;
import org.springframework.ai.rag.preretrieval.query.transformation.QueryTransformer;
import org.springframework.ai.rag.util.PromptAssert;
import org.springframework.lang.Nullable;
import org.springframework.util.Assert;
import org.springframework.util.StringUtils;

/**
 * Generate hypothetical document for query. The implements of the Hypothetical Document
 * Embeddings
 * <a href="https://arxiv.org/abs/2212.10496">https://arxiv.org/abs/2212.10496</a>
 *
 * @author benym
 */
public class HyDeTransformer implements QueryTransformer {

	private static final Logger logger = LoggerFactory.getLogger(HyDeTransformer.class);

	private static final PromptTemplate DEFAULT_PROMPT_TEMPLATE = new PromptTemplate("""
			Given a user question, write a comprehensive and informative passage that directly answers the question.

			The passage should be factual, well-structured, and contain specific details.

			Question: {query}

			Passage:
			""");

	private final ChatClient chatClient;

	private final PromptTemplate promptTemplate;

	public HyDeTransformer(ChatClient.Builder chatClientBuilder, PromptTemplate promptTemplate) {
		Assert.notNull(chatClientBuilder, "chatClientBuilder cannot be null");
		this.chatClient = chatClientBuilder.build();
		this.promptTemplate = promptTemplate != null ? promptTemplate : DEFAULT_PROMPT_TEMPLATE;
		PromptAssert.templateHasRequiredPlaceholders(this.promptTemplate, "query");
	}

	@Override
	public Query transform(Query query) {
		Assert.notNull(query, "query cannot be null");
		var hyDeQueryText = this.chatClient.prompt()
			.user(user -> user.text(this.promptTemplate.getTemplate()).param("query", query.text()))
			.call()
			.content();
		if (!StringUtils.hasText(hyDeQueryText)) {
			logger.warn("Query generate hyDe document result is null/empty. Returning the input query unchanged.");
			return query;
		}
		return query.mutate().text(hyDeQueryText).build();
	}

	public static Builder builder() {
		return new Builder();
	}

	public static final class Builder {

		private ChatClient.Builder chatClientBuilder;

		@Nullable
		private PromptTemplate promptTemplate;

		private Builder() {
		}

		public Builder chatClientBuilder(ChatClient.Builder chatClientBuilder) {
			this.chatClientBuilder = chatClientBuilder;
			return this;
		}

		public Builder promptTemplate(PromptTemplate promptTemplate) {
			this.promptTemplate = promptTemplate;
			return this;
		}

		public HyDeTransformer build() {
			return new HyDeTransformer(this.chatClientBuilder, this.promptTemplate);
		}

	}

}

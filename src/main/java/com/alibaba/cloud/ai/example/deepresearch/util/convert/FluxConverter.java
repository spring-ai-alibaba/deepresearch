package com.alibaba.cloud.ai.example.deepresearch.util.convert;

import com.alibaba.cloud.ai.graph.GraphResponse;
import com.alibaba.cloud.ai.graph.OverAllState;
import com.alibaba.cloud.ai.graph.streaming.StreamingOutput;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.model.Generation;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.atomic.AtomicReference;
import java.util.function.Consumer;
import java.util.function.Function;

public interface FluxConverter {

	static FluxConverter.Builder builder() {
		return new FluxConverter.Builder();
	}

	class Builder {

		private Function<ChatResponse, Map<String, Object>> mapResult;

		private String startingNode;

		private OverAllState startingState;

		public Builder() {
		}

		public Builder mapResult(Function<ChatResponse, Map<String, Object>> mapResult) {
			this.mapResult = mapResult;
			return this;
		}

		public Builder startingNode(String node) {
			this.startingNode = node;
			return this;
		}

		public Builder startingState(OverAllState state) {
			this.startingState = state;
			return this;
		}

		public Flux<GraphResponse<StreamingOutput>> build(Flux<ChatResponse> flux) {
			return this.buildInternal(flux,
					(chatResponse) -> new StreamingOutput(chatResponse.getResult().getOutput().getText(),
							this.startingNode, this.startingState));
		}

		public Flux<GraphResponse<StreamingOutput>> buildWithChatResponse(Flux<ChatResponse> flux) {
			return this.buildInternal(flux,
					(chatResponse) -> new StreamingOutput(chatResponse, this.startingNode, this.startingState));
		}

		private Flux<GraphResponse<StreamingOutput>> buildInternal(Flux<ChatResponse> flux,
				Function<ChatResponse, StreamingOutput> outputMapper) {
			Objects.requireNonNull(flux, "flux cannot be null");
			Objects.requireNonNull(this.mapResult, "mapResult cannot be null");
			AtomicReference<ChatResponse> result = new AtomicReference<>(null);
			Consumer<ChatResponse> mergeMessage = (response) -> result.updateAndGet((lastResponse) -> {
				if (lastResponse == null) {
					return response;
				}
				else {
					AssistantMessage currentMessage = response.getResult().getOutput();
					if (currentMessage.hasToolCalls()) {
						return response;
					}
					else {
						String lastMessageText = Objects.requireNonNull(lastResponse.getResult().getOutput().getText(),
								"lastResponse text cannot be null");
						String currentMessageText = currentMessage.getText();
						AssistantMessage newMessage = new AssistantMessage(
								currentMessageText != null ? lastMessageText.concat(currentMessageText)
										: lastMessageText,
								currentMessage.getMetadata(), currentMessage.getToolCalls(), currentMessage.getMedia());
						Generation newGeneration = new Generation(newMessage, response.getResult().getMetadata());
						return new ChatResponse(List.of(newGeneration), response.getMetadata());
					}
				}
			});
			return flux.filter((response) -> response.getResult() != null && response.getResult().getOutput() != null)
				.doOnNext(mergeMessage)
				.map((next) -> GraphResponse.of(outputMapper.apply(next)))
				.concatWith(Mono.fromCallable(() -> {
					Map<String, Object> completionResult = this.mapResult.apply(result.get());
					return GraphResponse.done(completionResult);
				}));
		}

	}

}

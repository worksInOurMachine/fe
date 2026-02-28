import { useCallback, useState, useRef } from "react";
import toast from "react-hot-toast";

export function useChat({
  messages = [],
  setMessages = () => { },
  setAiSpeaking = () => { },
  setIsInterviewCompleted = () => { },
  generateSpeech = () => { }, // TTS function
  queueText = (text: string) => { },
  flush = () => { },
  stop = () => { }, // 🔹 Added stop function
  speechEnabled = true,
}: any) {
  const [isLoading, setIsLoading] = useState(false);


  const lastUpdateTimeRef = useRef<number>(0);
  const aiContentRef = useRef<string>("");

  const sendMessage = useCallback(
    async ({ content, interviewDetails }: any): Promise<void> => {
      if (!content) return;
      stop();

      const userMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: Array.isArray(content) ? [...content] : content.trim(),
        timestamp: new Date(),
      };

      setMessages((prev: any) => [...prev, userMessage]);
      setIsLoading(true);
      setAiSpeaking(true);

      try {
        const response = await fetch("/api/interview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [{ role: userMessage.role, content: userMessage.content }], // Simplified for example, or pass history if needed
            stream: true,
            interviewDetails,
          }),
        });

        // Note: In a real app, you'd want to pass the full history. 
        // If 'messages' is passed from props, it's better to use a ref for history to avoid sendMessage recreation.

        if (!response.ok || !response.body) {
          toast("Something went wrong...");
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        aiContentRef.current = "";
        let sentenceBuffer = "";

        const aiMessage: any = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "",
          timestamp: new Date(),
        };

        setMessages((prev: any) => [...prev, aiMessage]);

        let buffer = "";
        lastUpdateTimeRef.current = Date.now();

        const updateMessageState = (force = false) => {
          const now = Date.now();
          if (force || now - lastUpdateTimeRef.current > 150) {
            setMessages((prev: any) => {
              const updated = [...prev];
              const lastIndex = updated.findLastIndex(m => m.role === "assistant");
              if (lastIndex !== -1 && updated[lastIndex].content !== aiContentRef.current) {
                updated[lastIndex] = { ...updated[lastIndex], content: aiContentRef.current };
                return updated;
              }
              return prev;
            });
            lastUpdateTimeRef.current = now;
          }
        };

        while (true) {
          const { value, done } = await reader.read();
          if (done) {
            if (sentenceBuffer.trim() && speechEnabled) {
              queueText(sentenceBuffer.trim());
              flush();
            }
            updateMessageState(true); // Final force update
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          let lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;

            const jsonStr = trimmed.replace("data:", "").trim();
            if (jsonStr === "[DONE]") {
              buffer = "";
              break;
            }

            try {
              const parsed = JSON.parse(jsonStr);
              const contentPiece = parsed.choices?.[0]?.delta?.content;

              if (contentPiece) {
                aiContentRef.current += contentPiece;
                sentenceBuffer += contentPiece;

                if (speechEnabled) {
                  // Split by punctuation or when the buffer gets long enough for natural phrasing
                  const splitRegex = /(?<=[.!?,\n])/;
                  const hasPunctuation = splitRegex.test(contentPiece);

                  if (hasPunctuation || sentenceBuffer.length > 60) {
                    const fragments = sentenceBuffer.split(splitRegex);

                    // If we have at least one complete fragment (sentence or phrase)
                    if (fragments.length > 1) {
                      const toQueue = fragments.slice(0, -1).join("").trim();
                      if (toQueue.length > 1) { // Avoid queuing single punctuation marks
                        queueText(toQueue);
                      }
                      sentenceBuffer = fragments[fragments.length - 1];
                      updateMessageState(true);
                    } else if (sentenceBuffer.length > 100) {
                      // Safety fallback: if no punctuation found for a long time, queue the buffer
                      const toQueue = sentenceBuffer.trim();
                      if (toQueue) {
                        queueText(toQueue);
                      }
                      sentenceBuffer = "";
                      updateMessageState(true);
                    }
                  }
                }

                if (aiContentRef.current.toLowerCase().includes("interview is completed")) {
                  setIsInterviewCompleted(true);
                }

                updateMessageState(); // Throttled state update
              }
            } catch (err) {
              console.error("❌ Stream parse error:", jsonStr, err);
            }
          }
        }
      } catch (error) {
        console.error("Chat error:", error);
        toast.error("Oops! Something went wrong. Please try again later.");
      } finally {
        setIsLoading(false);
        setAiSpeaking(false);
      }
    },
    [queueText, flush, stop, speechEnabled, setMessages, setAiSpeaking, setIsInterviewCompleted]
  );

  return {
    messages,
    isLoading,
    sendMessage,
  };
}


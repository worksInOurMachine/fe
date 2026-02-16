import { useCallback, useState } from "react";
import toast from "react-hot-toast";

export function useChat({
  messages = [],
  setMessages = () => { },
  setAiSpeaking = () => { },
  setIsInterviewCompleted = () => { },
  generateSpeech = () => { }, // TTS function
}: any) {
  const [isLoading, setIsLoading] = useState(false);


  const sendMessage = useCallback(
    async ({ content, interviewDetails }: any): Promise<void> => {
      if (!content) return;

      const userMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: Array.isArray(content) ? [...content] : content.trim(),
        timestamp: new Date(),
      };

      setMessages((prev: any) => [...prev, userMessage]);
      setIsLoading(true);
      setAiSpeaking(true);

      const conversationHistory = [...messages, userMessage];
      const apiMessages = conversationHistory.map(({ role, content }) => ({
        role,
        content,
      }));

      try {
        const response = await fetch("/api/interview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: apiMessages,
            stream: true,
            interviewDetails,
          }),
        });

        if (!response.ok || !response.body) {
          toast("Something went wrong...");
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let aiContent = "";

        const aiMessage: any = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "",
          timestamp: new Date(),
        };

        setMessages((prev: any) => [...prev, aiMessage]);

        let buffer = "";

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          let lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;

            const jsonStr = trimmed.replace("data:", "").trim();
            if (jsonStr === "[DONE]") {
              buffer = "";

              // 🔹 Call generateSpeech ONCE after the message is fully received
              if (aiContent) {
                generateSpeech(aiContent);
              }

              break;
            }

            try {
              const parsed = JSON.parse(jsonStr);
              const contentPiece = parsed.choices?.[0]?.delta?.content;

              if (contentPiece) {
                aiContent += contentPiece;

                // 🔹 Detect interview completed phrase
                if (
                  aiContent.toLowerCase().includes("interview is completed")
                ) {
                  setIsInterviewCompleted(true);
                }

                setMessages((prev: any) => {
                  const updated = [...prev];
                  const lastIndex = updated.findLastIndex(
                    (m) => m.role === "assistant"
                  );
                  if (lastIndex !== -1) {
                    updated[lastIndex] = {
                      ...updated[lastIndex],
                      content: aiContent,
                    };
                  }
                  return updated;
                });
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
    [messages, generateSpeech]
  );

  return {
    messages,
    isLoading,
    sendMessage,
  };
}

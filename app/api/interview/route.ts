export async function POST(req: Request) {
  try {
    const {
      messages,
      stream: isStream = true,
      interviewDetails,
    } = await req.json();

    const model = 'sarvam-m';

    console.log("Interview Details:", interviewDetails);

    const {
      mode: interviewMode,
      difficulty,
      skills,
      topic: jobRole,
      numOfQuestions,
      username,
      interviewLanguage = 'english',
    } = interviewDetails;

    //     const systemPrompt = `
    // You are a Professional AI Interviewer. 
    // Your role is to simulate a real human interviewer—friendly, natural, but structured and professional.

    // 📋 Interview Parameters:
    // - Mode: ${interviewMode}   // HR or Technical
    // - Difficulty: ${difficulty}
    // - Skills: ${skills}
    // - Job Role: ${jobRole}
    // - Number of Questions: ${numOfQuestions}
    // - Candidate: ${username}

    // 🎯 Core Objectives:
    // 1. Conduct exactly ${numOfQuestions} interview questions.
    // 2. Maintain realistic flow—greeting, explaining, questioning, transitioning, wrapping up.
    // 3. Questions must align with:
    //    - The candidate’s resume (experience, education, skills).
    //    - The provided parameters (Mode, Difficulty, Skills, JobRole).
    // 4. Always sound human, never robotic. Short, natural sentences.

    // ---

    // 👋 Greeting & Setup (first user message only):
    // - Greet warmly by name if available; otherwise call them "the candidate."
    // - Acknowledge resume politely if provided.
    // - Briefly explain the interview flow: number of questions, focus, and difficulty.
    // - Immediately begin with the first interview question.

    // ---

    // ❓ Questioning Rules:
    // -always use ${interviewLanguage} language for conversation
    // - Ask one question at a time until all ${numOfQuestions} are complete.
    // - Respect Mode strictly:
    //   - HR → behavioral, situational, motivation, teamwork. No technical.
    //   - Technical → concepts, coding, debugging, design, problem-solving. No HR-style.
    // - Style:
    //   - Use real-world, practical questions; avoid generic textbook phrasing.
    //   - Briefly acknowledge answers (“Got it,” / “Thanks for sharing”) before moving on.
    //   - Use smooth transitions (“Alright, let’s move on…” / “Next question…”).
    // - Progression:
    //   1. Warmup/background.
    //   2. Skill- or role-specific.
    //   3. Scenario/problem-based.
    //   4. Slightly more challenging (aligned with ${difficulty}).
    // - Ignore unrelated queries; keep the interview on track.

    // ---

    // ✅ End of Interview:
    // - After ${numOfQuestions}, stop asking further questions.
    // - Politely thank the candidate and respond  **“Interview is completed, please generate report.”** and close.
    // - From then on, for any user input, always respond:
    //   **“Interview is completed, please generate report.”**

    // ---

    // 📝 Report Generation:
    // - Summarize the candidate’s performance like a recruiter writing for a hiring manager:
    //   - Strengths
    //   - Weaknesses
    //   - Communication style
    //   - Problem-solving approach
    //   - Concise overall summary
    // - Use clear, simple, professional language—human, not robotic.

    // ---

    // ⚖️ Tone & Behavior:
    // - Professional, friendly, conversational.
    // - No robotic repetition or jargon.
    // - Always follow parameters: ${interviewMode}, ${skills}, ${jobRole}, ${difficulty}, ${numOfQuestions}.
    // - avoid special characters that might give conflicts in tts
    // `;

    const systemPrompt = `
You are Neuraview, a Professional AI Interviewer conducting a realistic mock interview.

=============================
INTERVIEW CONFIGURATION
=============================
Mode: ${interviewMode}
Difficulty: ${difficulty}
Skills: ${skills}
Job Role: ${jobRole}
Total Questions: ${numOfQuestions}
Candidate Name: ${username}
Language: ${interviewLanguage}

=============================
PRIMARY RULES
=============================

1. Conduct exactly ${numOfQuestions} questions.
2. Ask one question at a time.
3. Use only ${interviewLanguage}.
4. Stay strictly within the selected Mode:
   - HR: Behavioral, situational, teamwork, motivation. No technical questions.
   - Technical: Concepts, coding, debugging, architecture, problem-solving. No HR-style questions.
5. Keep tone natural, human, professional. Short and clear sentences.
6. Do not use special characters that may break TTS.
7. Ignore unrelated user input and keep the interview focused.

=============================
INTERVIEW FLOW
=============================

FIRST MESSAGE ONLY:
- Greet the candidate by name if available.
- Briefly explain:
  - Number of questions
  - Focus area (Mode + Skills + Job Role)
  - Difficulty level
- Immediately ask Question 1.

QUESTION PROGRESSION:
1. Warm-up or background
2. Skill or role-focused
3. Scenario or problem-based
4. More challenging based on difficulty

After each answer:
- Brief acknowledgment such as "Got it." or "Thanks for explaining."
- Smooth transition to the next question.

=============================
COMPLETION RULE
=============================

After Question ${numOfQuestions}:
- Thank the candidate politely.
- Close the session with this exact line:

Interview is completed,please generate report.Thanks for using Neuraview.

`;

    // const API_URI = "https://gen.pollinations.ai/v1/chat/completions";

    const API_URI = "https://api.sarvam.ai/v1/chat/completions"
    const API_KEY = "sk_gq7o64gi_PSgHBegik8dSJUvCVctMkp2W";

    const upstreamResponse = await fetch(API_URI, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY || process.env.AI_API_TOKEN_POLLINATIONS}`,
        "Content-Type": "application/json",
        "HTTP-Referer": `${process.env.SITE_BASE_URL}`,
        "X-Title": "VOID AI",
      },
      body: JSON.stringify({
        model: model || "openai",
        stream: isStream || false,
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          ...messages,
        ],
      }),
    });

    console.log(messages)

    if (!upstreamResponse.ok || !upstreamResponse.body) {
      console.log(upstreamResponse);
      return new Response("Upstream failed", { status: 502 });
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const reader = upstreamResponse.body!.getReader();
        const decoder = new TextDecoder("utf-8");

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          const textChunk = decoder.decode(value);
          controller.enqueue(encoder.encode(textChunk));
        }

        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.log("API Error:", error);
    return Response.json(
      { error: "Ohh there's something wrong, try again!" },
      { status: 500 }
    );
  }
}

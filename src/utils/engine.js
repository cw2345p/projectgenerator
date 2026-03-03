import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

export const analyzeProject = async (idea, audience, features, feedback = "", currentPlan = null) => {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      responseMimeType: "application/json"
    }
  });

  const prompt = `
당신은 세계 최고의 프로젝트 아키텍트입니다. 다음 정보를 바탕으로 프로젝트 계획서와 "기본" 및 "심화" 두 가지 버전의 기술 스택을 설계해주세요.

**입력 정보:**
1. 프로젝트 아이디어: ${idea}
2. 대상 사용자: ${audience || '미정'}
3. 핵심 기능 목록: ${features || '미정'}

${currentPlan ? `
**현재 진행 중인 계획 (참고용):**
\`\`\`json
${JSON.stringify(currentPlan, null, 2)}
\`\`\`
` : ''}

**최우선 수정 지시사항 (피드백): ${feedback || '없음'}**

---
**지침:**
1. 출력 형식 JSON 구조:
{
  "planMarkdown": "마크다운 계획서",
  "techStackBasic": {
    "language": "개발 언어",
    "database": "데이터베이스",
    "deployment": "배포 전략"
  },
  "techStackAdvanced": {
    "language": "개발 언어",
    "frontend": "프론트엔드 기술",
    "backend": "백엔드 기술",
    "database": "데이터베이스",
    "ai": "AI 기술",
    "deployment": "배포 전략"
  }
}

2. **techStackBasic (기본 모드) 제약 사항**:
   - 반드시 다음 목록 중 프로젝트에 가장 적합한 것만 골라서 사용하세요: [Python, React, Flutter, Baserow, Firebase, Vercel, Streamlit]
   - 카테고리는 오직 "language", "database", "deployment" 3가지만 포함해야 합니다.

3. **techStackAdvanced (심화 모드) 지침**:
   - 모든 기술 카테고리에 대해 프로젝트에 최적화된 최신 기술 스택을 자유롭게 추천하세요.
   - 각 카테고리별 핵심 위주로 최대 3개만, 줄바꿈(\\n)으로 구분하여 작성하세요.

4. 모든 답변은 한국어로 작성하세요.
  `.trim();

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return JSON.parse(response.text().trim());
  } catch (error) {
    console.error("Gemini AI Analysis Error:", error);
    return {
      planMarkdown: "# 분석 오류 발생\n피드백 반영 중 문제가 발생했습니다. 다시 시도해주세요.",
      techStackBasic: { language: "Error", database: "Error", deployment: "Error" },
      techStackAdvanced: { language: "Error", frontend: "Error", backend: "Error", database: "Error", ai: "Error", deployment: "Error" }
    };
  }
};

/**
 * 프로젝트와 무관하게 일반적인 질문에 답하는 챗봇 엔진
 */
export const askChatbot = async (message, history = []) => {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: "당신은 프로젝트 설계 어시스턴트입니다. 사용자 질문에 대해 핵심만 매우 간결하게 말하세요. 작은 채팅창에서 보기 편하도록 불필요한 서술은 제외하고 1-3줄 이내로 답변하는 것을 원칙으로 합니다."
  });

  // Gemini API는 반드시 'user' 메시지로 대화가 시작되어야 함을 보장
  const validHistory = [];
  let userFound = false;

  for (const msg of history) {
    if (msg.role === 'user') userFound = true;
    if (userFound) {
      validHistory.push({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      });
    }
  }

  const chat = model.startChat({
    history: validHistory,
  });

  try {
    const result = await chat.sendMessage(message);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Chatbot Error:", error);
    return "죄송합니다. 메시지를 처리하는 중에 오류가 발생했습니다. API 키를 확인해주세요.";
  }
};

export const generateAntigravityPrompt = (idea, plan, techStack) => {
  const stackList = Object.entries(techStack)
    .map(([key, value]) => `- ${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}`)
    .join('\n');

  return `
태스크: "${idea}" 프로젝트를 개발하라.

다음 상세 계획 및 아키텍처를 따라 구현하라:

### 프로젝트 계획
${plan}

### 기술 스택
${stackList}

### 구현 가이드
1. 우선 최상위 디렉토리에 \`task.md\`를 생성하여 전체 작업 목록을 정리하라.
2. \`implementation_plan.md\`를 작성하여 단계별 구현 전략을 수립하라.
3. 프리미엄 디자인 원칙에 따라 UI를 구현하고, 각 기능별 테스트를 수행하라.
4. 마지막으로 \`walkthrough.md\`를 작성하여 전체 기능을 검증하라.
  `.trim();
};

import React, { useState, useEffect, useRef } from 'react';
import { analyzeProject, generateAntigravityPrompt, askChatbot } from './utils/engine';

function App() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState({ idea: '', audience: '', features: '' });
  const [analysis, setAnalysis] = useState({ planMarkdown: '', techStack: {} });
  const [feedback, setFeedback] = useState('');
  const [finalPrompt, setFinalPrompt] = useState('');
  const [copied, setCopied] = useState(false);

  // Chatbot State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', content: '안녕하세요! 프로젝트 설계나 기술적인 궁금증이 있다면 무엇이든 물어보세요.' }
  ]);
  const [chatLoading, setChatLoading] = useState(false);
  const [showChatResetConfirm, setShowChatResetConfirm] = useState(false);
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleChatReset = () => {
    setChatMessages([
      { role: 'assistant', content: '안녕하세요! 프로젝트 설계나 기술적인 궁금증이 있다면 무엇이든 물어보세요.' }
    ]);
    setChatInput('');
    setChatLoading(false);
    setShowChatResetConfirm(false);
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const handleStart = async () => {
    if (!input.idea) return alert('프로젝트 아이디어를 입력해주세요!');
    setLoading(true);
    try {
      const result = await analyzeProject(input.idea, input.audience, input.features);
      setAnalysis(result);
      setStep(2);
    } finally {
      setLoading(false);
    }
  };

  const handleFeedbackSubmit = async () => {
    if (!feedback.trim()) return;
    setLoading(true);
    try {
      const result = await analyzeProject(input.idea, input.audience, input.features, feedback);
      setAnalysis(result);
      setFeedback('');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(finalPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConfirm = () => {
    const prompt = generateAntigravityPrompt(input.idea, analysis.planMarkdown, analysis.techStack);
    setFinalPrompt(prompt);
    setStep(3);
  };

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userMessage = chatInput;
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setChatLoading(true);

    try {
      const response = await askChatbot(userMessage, chatMessages);
      setChatMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } finally {
      setChatLoading(false);
    }
  };


  return (
    <>
      <div className="fade-in">
        <header style={{ marginBottom: '4rem', textAlign: 'center' }}>
          <h1
            onClick={() => !loading && setStep(1)}
            style={{
              fontSize: '3.5rem',
              background: 'var(--accent-gradient)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '1rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'inline-block',
              transition: 'transform 0.2s ease',
              opacity: loading ? 0.6 : 1
            }}
            onMouseOver={e => !loading && (e.currentTarget.style.transform = 'scale(1.02)')}
            onMouseOut={e => !loading && (e.currentTarget.style.transform = 'scale(1)')}
          >
            Project Architect
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.25rem', fontWeight: '500' }}>쉽고 빠른 프로젝트 기획 도구</p>
        </header>

        <main style={{ paddingBottom: '5rem' }}>
          {step === 1 && (
            <section className="glass-card">
              <h2 style={{ marginBottom: '2.5rem', textAlign: 'center' }}>프로젝트를 설명해주세요</h2>
              <div style={{ display: 'grid', gap: '2rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: '600' }}>프로젝트 아이디어 (필수)</label>
                  <input
                    placeholder="예: AI 기반 개인 여행 플래너"
                    value={input.idea}
                    onChange={e => setInput({ ...input, idea: e.target.value })}
                    disabled={loading}
                    style={{ opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'text' }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)' }}>대상</label>
                    <input
                      placeholder="예: 20-30대 여행객"
                      value={input.audience}
                      onChange={e => setInput({ ...input, audience: e.target.value })}
                      disabled={loading}
                      style={{ opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'text' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)' }}>주요 기능</label>
                    <input
                      placeholder="예: 일정 자동 생성, 맛집 추천"
                      value={input.features}
                      onChange={e => setInput({ ...input, features: e.target.value })}
                      disabled={loading}
                      style={{ opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'text' }}
                    />
                  </div>
                </div>
                <button
                  className="btn-primary"
                  onClick={handleStart}
                  disabled={loading}
                  style={{ marginTop: '1rem', padding: '1.5rem', fontSize: '1.1rem' }}
                >
                  {loading ? 'Gemini가 분석 중...' : '프로젝트 설계 시작하기'}
                </button>
                {loading && <p style={{ textAlign: 'center', color: 'var(--accent-primary)', fontSize: '0.9rem' }}>상세 계획과 아키텍처를 구성하고 있습니다...</p>}
              </div>
            </section>
          )}

          {step === 2 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2.5rem' }}>
              <section className="glass-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                  <h2>프로젝트 계획 및 구조</h2>
                </div>

                <div style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '2rem', borderRadius: '24px', marginBottom: '3rem', maxHeight: '500px', overflowY: 'auto' }}>
                  <div style={{ whiteSpace: 'pre-wrap', color: 'var(--text-primary)', lineHeight: '1.8' }}>{analysis.planMarkdown}</div>
                </div>

                <h3 style={{ marginBottom: '1.5rem' }}>추천 아키텍처</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.25rem' }}>
                  {Object.entries(analysis.techStack).map(([key, value]) => (
                    <div key={key} style={{ background: 'white', padding: '1.5rem', borderRadius: '24px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'flex-start', gap: '2rem' }}>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', width: '120px', flexShrink: 0, marginTop: '0.2rem' }}>{key}</div>
                      <div style={{ fontWeight: '700', color: 'var(--text-primary)', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                        {value.split('\n')
                          .map(v => v.trim())
                          .filter(v => v.length > 0)
                          .map((item, i, arr) => (
                            <React.Fragment key={i}>
                              {item}
                              {i < arr.length - 1 && <br />}
                            </React.Fragment>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="glass-card">
                <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>✍️</span> 피드백 및 수정 요청
                </h3>
                <textarea
                  placeholder="내용을 구체화하거나 기술 스택을 변경하고 싶다면 여기에 입력하세요."
                  rows="3"
                  value={feedback}
                  onChange={e => setFeedback(e.target.value)}
                  disabled={loading}
                  style={{ opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'text' }}
                />
                <div style={{ display: 'flex', gap: '1.5rem', marginTop: '2rem' }}>
                  <button
                    onClick={handleFeedbackSubmit}
                    disabled={loading}
                    style={{ flex: 1, background: '#f1f5f9', color: '#475569', cursor: loading ? 'not-allowed' : 'pointer' }}
                  >
                    {loading ? '반영 중...' : '수정 요청 반영'}
                  </button>
                  <button
                    className="btn-primary"
                    onClick={handleConfirm}
                    disabled={loading}
                    style={{ flex: 2, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
                  >
                    확인 및 프롬프트 생성
                  </button>
                </div>
              </section>
            </div>
          )}

          {step === 3 && (
            <section className="glass-card">
              <h2 style={{ marginBottom: '1rem' }}>Antigravity 최종 프롬프트</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '2.5rem' }}>이 프롬프트를 사용하여 즉시 개발을 시작할 수 있습니다.</p>
              <div style={{ position: 'relative' }}>
                <pre>{finalPrompt}</pre>
                <button
                  onClick={handleCopy}
                  disabled={loading}
                  style={{
                    position: 'absolute',
                    top: '1rem',
                    right: '1rem',
                    fontSize: '0.85rem',
                    background: copied ? '#10b981' : 'rgba(255,255,255,0.1)',
                    color: 'white',
                    borderRadius: '10px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.6 : 1
                  }}
                >
                  {copied ? '복사 완료!' : '복사하기'}
                </button>
              </div>
              <div style={{ display: 'flex', gap: '1.5rem', marginTop: '2.5rem' }}>
                <button
                  onClick={() => setStep(2)}
                  disabled={loading}
                  style={{ flex: 1, background: '#f1f5f9', color: '#475569', borderRadius: '16px', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
                >
                  이전 단계로 (수정)
                </button>
                <button
                  onClick={() => setStep(1)}
                  disabled={loading}
                  style={{ flex: 1, background: '#f3f4f6', color: '#6b7280', borderRadius: '16px', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
                >
                  새 프로젝트 시작
                </button>
              </div>
            </section>
          )}
        </main>
      </div>

      {/* AI Chatbot UI - Fixed relative to Viewport (NOT parent div) */}
      <div style={{
        position: 'fixed',
        bottom: '2rem',
        right: '2rem',
        zIndex: 9999,
        pointerEvents: 'auto'
      }}>
        {isChatOpen ? (
          <div className="glass-card fade-in" style={{
            width: '380px',
            height: '500px',
            display: 'flex',
            flexDirection: 'column',
            padding: '1.5rem',
            borderRadius: '24px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
            background: 'white',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '700' }}>AI Assistant</h3>
                {showChatResetConfirm ? (
                  <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', background: '#fee2e2', padding: '0.2rem 0.5rem', borderRadius: '8px' }}>
                    <span style={{ fontSize: '0.75rem', color: '#b91c1c', fontWeight: '600' }}>삭제?</span>
                    <button onClick={handleChatReset} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '0.1rem 0.4rem', borderRadius: '4px', fontSize: '0.7rem', cursor: 'pointer' }}>확인</button>
                    <button onClick={() => setShowChatResetConfirm(false)} style={{ background: 'white', color: '#4b5563', border: '1px solid #e5e7eb', padding: '0.1rem 0.4rem', borderRadius: '4px', fontSize: '0.7rem', cursor: 'pointer' }}>취소</button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowChatResetConfirm(true)}
                    style={{
                      background: '#f1f5f9',
                      color: '#64748b',
                      fontSize: '0.7rem',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '8px',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >초기화</button>
                )}
              </div>
              <button
                onClick={() => setIsChatOpen(false)}
                style={{ background: 'none', color: 'var(--text-secondary)', padding: '0.5rem', fontSize: '1.2rem', cursor: 'pointer' }}
              >✕</button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', paddingRight: '0.5rem' }}>
              {chatMessages.map((msg, i) => (
                <div key={i} style={{
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                  padding: '0.8rem 1.2rem',
                  borderRadius: msg.role === 'user' ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                  background: msg.role === 'user' ? 'var(--accent-gradient)' : '#f1f5f9',
                  color: msg.role === 'user' ? 'white' : 'var(--text-primary)',
                  fontSize: '0.9rem',
                  lineHeight: '1.5',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                }}>
                  {msg.content}
                </div>
              ))}
              {chatLoading && (
                <div style={{ alignSelf: 'flex-start', padding: '0.8rem 1.2rem', borderRadius: '16px', background: '#f1f5f9', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  답변을 작성하고 있어요...
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleChatSubmit} style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                placeholder="질문을 입력하세요..."
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                style={{ padding: '0.8rem', borderRadius: '12px' }}
              />
              <button
                className="btn-primary"
                style={{
                  borderRadius: '12px',
                  fontSize: '0.9rem',
                  padding: '0.8rem 1.2rem',
                  boxShadow: 'none',
                  whiteSpace: 'nowrap'
                }}
              >
                전송
              </button>
            </form>
          </div>
        ) : (
          <button
            className="btn-primary"
            onClick={() => setIsChatOpen(true)}
            style={{
              width: '4rem',
              height: '4rem',
              borderRadius: '50%',
              fontSize: '1.5rem',
              boxShadow: '0 10px 25px rgba(99, 102, 241, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            💬
          </button>
        )}
      </div>
    </>
  );
}

export default App;

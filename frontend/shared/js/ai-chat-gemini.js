// Pure JS Gemini AI Chat - Standalone, no React needed
// Replace old hardcoded AI. Backend npm install success!
class AiChatGemini {
  constructor(containerId = 'ai-chat-root') {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      const root = document.createElement('div');
      root.id = containerId;
      document.body.appendChild(root);
      this.container = root;
    }
    this.messages = [];
    this.loading = false;
    this.init();
  }
  init() {
    this.container.innerHTML = `
      <div class="ai-chat-fixed bottom-6 right-6 w-80 h-[500px] bg-white/95 backdrop-blur-xl shadow-2xl border border-gray-200/50 rounded-3xl flex flex-col z-[1000]" style="position: fixed;">
        <div class="p-4 border-b bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-t-3xl text-white shadow-lg">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">🤖</div>
            <div>
              <h3 class="font-bold text-sm">Trợ lý Gemini AI</h3>
              <p class="text-xs opacity-90">Real-time khách sạn assistant</p>
            </div>
          </div>
        </div>
        <div class="flex-1 p-4 overflow-y-auto space-y-3 max-h-80">
          <div class="text-center text-xs text-gray-500 py-2">Bắt đầu chat với Gemini...</div>
        </div>
        <div class="p-4 pt-0 border-t bg-white/50 rounded-b-3xl">
          <div class="flex gap-2">
            <input type="text" id="ai-input" placeholder="Hỏi về phòng, đặt phòng, dịch vụ..." class="flex-1 px-4 py-3 bg-white/70 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all" maxlength="500">
            <button id="ai-send" class="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-2xl shadow-lg flex items-center justify-center">➤</button>
          </div>
          <p class="text-xs text-gray-500 mt-1 text-center">Nhấn Enter gửi</p>
        </div>
      </div>
    `;

    this.messagesContainer = this.container.querySelector('.flex-1');
    this.input = document.getElementById('ai-input');
    this.sendBtn = document.getElementById('ai-send');

    this.sendBtn.addEventListener('click', () => this.sendMessage());
    this.input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.sendMessage();
    });
  }

  async sendMessage() {
    if (this.loading || !this.input.value.trim()) return;
    
    const message = this.input.value.trim();
    this.addMessage('user', message);
    this.input.value = '';
    this.loading = true;
    this.sendBtn.disabled = true;
    this.sendBtn.innerHTML = '<div class="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>';
    
    this.addMessage('loading', 'Gemini đang suy nghĩ...');

    try {
      // Use relative URL so it works with Vite proxy / deployment
      const res = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });
      
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      this.removeLoading();
      this.addMessage('ai', data.response || 'Không có phản hồi');
    } catch (error) {
      console.error('AI Error:', error);
      this.removeLoading();
      this.addMessage('ai', 'Không kết nối được server AI (Gemini). Thử lại sau.');
    }
    
    this.loading = false;
    this.sendBtn.disabled = false;
    this.sendBtn.innerHTML = '➤';
  }

  addMessage(type, text) {
    const div = document.createElement('div');
    div.className = `flex ${type === 'user' ? 'justify-end' : 'justify-start'}`;
    
    const msgDiv = document.createElement('div');
    msgDiv.className = `max-w-[85%] p-3 rounded-2xl shadow-sm ${type === 'user' ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white' : 'bg-gray-100/80 border backdrop-blur-sm'}`;
    msgDiv.innerHTML = `<p class="text-sm leading-relaxed">${text}</p>`;
    
    div.appendChild(msgDiv);
    this.messagesContainer.appendChild(div);
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  }

  removeLoading() {
    const loadingMsg = this.messagesContainer.querySelector('.flex-1 div:last-child');
    if (loadingMsg && loadingMsg.textContent.includes('suy nghĩ')) {
      loadingMsg.remove();
    }
  }
}

// Auto init khi load
document.addEventListener('DOMContentLoaded', () => {
  new AiChatGemini();
});


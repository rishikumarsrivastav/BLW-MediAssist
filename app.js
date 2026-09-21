document.addEventListener('DOMContentLoaded', function() {
    const chat_input = document.getElementById('chat-input');
    const send_btn = document.getElementById('send-btn');
    const messagesContainer = document.getElementById('chat-messages');
    const menu_btn = document.getElementById('mobile-menu-btn');
    const mobile_nav = document.getElementById('mobile-menu');
    const chips_container = document.getElementById('suggestion-chips');

    let medicalData = {};
    const suggestions = ['Fever and headache', 'Diabetes', 'Common Cold', 'Hypertension', 'Acne'];
    const externalLinks = [
        { name: 'WebMD.com', url: 'https://www.webmd.com/' },
        { name: 'MedlinePlus.gov', url: 'https://medlineplus.gov/' },
        { name: 'Drugs.com', url: 'https://www.drugs.com/' },
        { name: 'rxlist.com', url: 'https://www.rxlist.com/' }
    ];

    async function init() {
        await loadMedicalData(); 
        
        if (chat_input && send_btn) {
            send_btn.onclick = handleSendMessage;
            chat_input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') handleSendMessage();
            });
        }
        
        if (menu_btn && mobile_nav) {
            menu_btn.addEventListener('click', () => {
                mobile_nav.classList.toggle('hidden');
            });
            mobile_nav.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', () => mobile_nav.classList.add('hidden'));
            });
        }

        if (chips_container) {
            chips_container.addEventListener('click', function(e){
                if(e.target && e.target.classList.contains('suggestion-chip')){
                    handleSendMessage(e.target.innerText);
                }
            });
        }

        showInitialGreeting();
    }

    async function loadMedicalData() {
        try {
            const res = await fetch('diseases.json');
            if (!res.ok) throw new Error('Fetch failed');
            medicalData = await res.json();
        } catch (err) {
            console.error("Failed to load medical data:", err);
            addAiMessage("My database is currently unavailable. Please try again in a bit.");
        }
    }
    
    function showInitialGreeting() {
        showTypingIndicator();
        setTimeout(() => {
            hideTypingIndicator();
            const greeting = `
                <p class="mb-2">👋 Hi there! I'm your AI Medical Assistant.</p>
                <p>You can ask me about symptoms or common conditions like "Diabetes" or "Common Cold".</p>
                <p class="font-bold text-sm text-red-600 mt-3">Disclaimer: I am not a substitute for a real doctor. Please consult a healthcare professional for medical advice.</p>
            `;
            addAiMessage(greeting);
            showSuggestionChips(suggestions);
        }, 1200);
    }

    function handleSendMessage(messageText) {
        const message = typeof messageText === 'string' ? messageText : chat_input.value.trim();
        if (!message) return;

        addUserMessage(message);
        chat_input.value = '';
        hideSuggestionChips();
        showTypingIndicator();
        
        setTimeout(() => {
            hideTypingIndicator();
            findResponse(message);
        }, 1000);
    }
    
    function findResponse(message) {
        const lowerMessage = message.toLowerCase();
        for (const condition in medicalData) {
            if (lowerMessage.includes(condition)) {
                addAiMessage(generateMedicalResponse(medicalData[condition]));
                setTimeout(() => showSuggestionChips(suggestions), 1000);
                return;
            }
        }
        
        const symptomResponse = checkCommonSymptoms(lowerMessage);
        if (symptomResponse) {
            addAiMessage(symptomResponse);
            setTimeout(() => showSuggestionChips(suggestions), 1000);
            return;
        }

        addAiMessage(generateFallbackResponse(message));
        setTimeout(() => showSuggestionChips(suggestions), 1000);
    }

    function generateMedicalResponse(data) {
        const items = data.seekAttention.map(item => `<li>${item}</li>`).join('');
        return `
            <strong class="block text-lg font-semibold mb-2">${data.description}</strong>
            <div class="space-y-3 text-gray-700">
                <p><strong class="font-semibold text-gray-900">Treatment:</strong> ${data.treatment}</p>
                <p><strong class="font-semibold text-gray-900">Common Medications:</strong> ${data.medications}</p>
            </div>
            <div class="mt-4 p-3 bg-red-50 border-l-4 border-red-400 text-red-800 rounded-r-lg">
                <strong class="block text-sm font-bold">When to Seek Medical Attention:</strong>
                <ul class="list-disc list-inside text-sm mt-1 space-y-1">${items}</ul>
            </div>
        `;
    }
    
    function checkCommonSymptoms(symptoms) {
        if (symptoms.includes('fever') && symptoms.includes('headache')) {
            return `<p>Having a <strong>fever and headache</strong> can be symptoms of several conditions like the flu or other viral infections. Rest and hydration are important. If it persists, please consult a doctor.</p>`;
        }
        if (symptoms.includes('sore throat') && symptoms.includes('cough')) {
            return `<p>A <strong>sore throat with a cough</strong> is often associated with the common cold. Gargling with warm salt water can help. If you have a high fever or difficulty swallowing, see a professional.</p>`;
        }
        return null;
    }

    function generateFallbackResponse(query) {
      const links = externalLinks.map(r => `<li><a href="${r.url}" target="_blank" rel="noopener" class="underline text-blue-700 hover:text-blue-900">${r.name}</a></li>`).join('');
      return `
        <p>I don't have specific information for "<strong>${query}</strong>".</p>
        <p class="mt-2">You can try these trusted resources:</p>
        <div class="mt-3 p-3 bg-blue-50 border-l-4 border-blue-400 rounded-r-lg">
          <ul class="list-disc list-inside space-y-1">${links}</ul>
        </div>
      `;
    }

    function addUserMessage(message) {
        const msgHtml = `<div class="flex justify-end mb-3"><div class="bg-blue-600 text-white rounded-lg py-2 px-4 max-w-xs lg:max-w-md">${message}</div></div>`;
        appendMessage(msgHtml);
    }

    function addAiMessage(htmlContent) {
        const msgHtml = `<div class="flex mb-3"><div class="bg-gray-200 text-gray-800 rounded-lg py-2 px-4 max-w-xs lg:max-w-md">${htmlContent}</div></div>`;
        appendMessage(msgHtml);
    }
    
    function showTypingIndicator() {
        const indicator = `
            <div class="flex mb-3" id="typing-indicator">
                <div class="bg-gray-200 rounded-lg py-2 px-4">
                    <div class="flex items-center space-x-1">
                        <span class="h-2 w-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                        <span class="h-2 w-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                        <span class="h-2 w-2 bg-gray-500 rounded-full animate-bounce"></span>
                    </div>
                </div>
            </div>`;
        appendMessage(indicator);
    }

    function hideTypingIndicator() {
        const indicator = document.getElementById('typing-indicator');
        if (indicator) {
            indicator.remove();
        }
    }
    
    function showSuggestionChips(suggestions) {
        if (!chips_container) return;
        chips_container.innerHTML = suggestions.map(text => 
            `<div class="suggestion-chip cursor-pointer text-sm text-blue-700 font-semibold bg-blue-100 py-1 px-3 rounded-full">${text}</div>`
        ).join('');
    }

    function hideSuggestionChips() {
        if (chips_container) chips_container.innerHTML = '';
    }

    function appendMessage(html) {
        messagesContainer.insertAdjacentHTML('beforeend', html);
        messagesContainer.scrollTop = messagesContainer.scrollHeight; 
    }

    window.scrollToChat = () => {
        document.getElementById('ai-doctor').scrollIntoView({ behavior: 'smooth' });
        setTimeout(() => chat_input.focus(), 500);
    }
    
    init();
});


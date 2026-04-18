
        import { GoogleGenAI } from "@google/genai";

        // Helper to safely escape strings for inline event handlers
        window.escapeForJsAndHtml = function(str) {
            if (!str) return '';
            let jsEscaped = String(str)
                .replace(/\\/g, '\\\\')
                .replace(/'/g, "\\'")
                .replace(/"/g, '\\"')
                .replace(/\n/g, '\\n')
                .replace(/\r/g, '\\r')
                .replace(/`/g, '\\`')
                .replace(/\$/g, '\\$');
            return jsEscaped
                .replace(/&/g, '&amp;')
                .replace(/"/g, '&quot;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');
        };

        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

        // --- TUTORIAL LOGIC ---
        let currentTutorialStep = 0;
        const tutorialSteps = [
            {
                title: "Welcome to ColdCash!",
                text: "This tool is designed to help you generate viral content for your theme pages in seconds.",
                target: null
            },
            {
                title: "1. Pick Your Niche",
                text: "Enter any niche here, or click one of the popular tags below to get started.",
                target: "niche-input"
            },
            {
                title: "2. Generation Options",
                text: "Optionally, search for specific stock media or filter by orientation and color to match your brand.",
                target: "pexels-filters"
            },
            {
                title: "3. Generate Everything",
                text: "Click this button to generate quotes, captions, carousels, and hashtags all at once.",
                target: "generate-btn"
            },
            {
                title: "4. Your Saved Vault",
                text: "Any content you bookmark will be stored here for easy access later.",
                target: "nav-saved"
            },
            {
                title: "5. Pro Settings",
                text: "Add your Pexels API key here to unlock high-quality stock images and video generation.",
                target: "nav-settings"
            }
        ];

        window.startTutorial = function() {
            const hasSeenTutorial = localStorage.getItem('cc_tutorial_seen');
            if (!hasSeenTutorial) {
                document.getElementById('tutorial-overlay').style.display = 'flex';
                updateTutorialStep();
            }
        };

        window.nextTutorialStep = function() {
            currentTutorialStep++;
            if (currentTutorialStep >= tutorialSteps.length) {
                skipTutorial();
            } else {
                updateTutorialStep();
            }
        };

        window.skipTutorial = function() {
            document.getElementById('tutorial-overlay').style.display = 'none';
            document.getElementById('tutorial-highlight').style.display = 'none';
            localStorage.setItem('cc_tutorial_seen', 'true');
            currentTutorialStep = 0;
        };

        function updateTutorialStep() {
            const step = tutorialSteps[currentTutorialStep];
            const overlay = document.getElementById('tutorial-overlay');
            const box = document.getElementById('tutorial-box');
            const highlight = document.getElementById('tutorial-highlight');
            const title = document.getElementById('tutorial-title');
            const text = document.getElementById('tutorial-text');
            const indicator = document.getElementById('tutorial-step-indicator');
            const nextBtn = document.getElementById('tutorial-next-btn');

            title.innerText = step.title;
            text.innerText = step.text;
            indicator.innerText = `Step ${currentTutorialStep + 1}/${tutorialSteps.length}`;
            nextBtn.innerHTML = currentTutorialStep === tutorialSteps.length - 1 ? 'Finish' : 'Next <i data-lucide="chevron-right" style="width: 16px; height: 16px;"></i>';
            lucide.createIcons();

            // Reset box position for calculation
            box.style.position = 'relative';
            box.style.top = 'auto';
            box.style.left = 'auto';
            overlay.style.background = step.target ? 'transparent' : 'rgba(0,0,0,0.85)';

            if (step.target) {
                const targetEl = document.getElementById(step.target);
                if (targetEl) {
                    // Use requestAnimationFrame to ensure box is rendered and has dimensions
                    requestAnimationFrame(() => {
                        const rect = targetEl.getBoundingClientRect();
                        highlight.style.display = 'block';
                        highlight.style.top = (rect.top - 5) + 'px';
                        highlight.style.left = (rect.left - 5) + 'px';
                        highlight.style.width = (rect.width + 10) + 'px';
                        highlight.style.height = (rect.height + 10) + 'px';

                        box.style.position = 'fixed';
                        const boxHeight = box.offsetHeight;
                        const boxWidth = box.offsetWidth;
                        
                        // Vertical positioning
                        if (rect.top > window.innerHeight / 2) {
                            box.style.top = Math.max(20, rect.top - boxHeight - 30) + 'px';
                        } else {
                            box.style.top = Math.min(window.innerHeight - boxHeight - 20, rect.bottom + 30) + 'px';
                        }
                        
                        // Horizontal positioning (center relative to target)
                        let left = rect.left + (rect.width / 2) - (boxWidth / 2);
                        left = Math.max(20, Math.min(window.innerWidth - boxWidth - 20, left));
                        box.style.left = left + 'px';
                    });
                }
            } else {
                highlight.style.display = 'none';
                overlay.style.display = 'flex'; // Ensure flex for centering
            }
        }

        // Initialize Lucide Icons
        lucide.createIcons();
        startTutorial();

        // --- STATE & LOCAL STORAGE ---
        const MAX_FREE_USES = 999999;
        
        function initStorage() {
            const today = new Date().toDateString();
            const storedDate = localStorage.getItem('cc_date');
            
            if (storedDate !== today) {
                localStorage.setItem('cc_date', today);
                localStorage.setItem('cc_uses', '0');
            }
            
            const pexelsKey = localStorage.getItem('cc_pexels');
            if (pexelsKey) document.getElementById('pexels-key').value = pexelsKey;
            
            const pexelsQuery = localStorage.getItem('cc_pexels_query');
            if (pexelsQuery) document.getElementById('pexels-query').value = pexelsQuery;
            
            const pexelsOrientation = localStorage.getItem('cc_pexels_orientation');
            if (pexelsOrientation) document.getElementById('pexels-orientation').value = pexelsOrientation;
            
            const pexelsColor = localStorage.getItem('cc_pexels_color');
            if (pexelsColor) document.getElementById('pexels-color').value = pexelsColor;
            
            const pexelsPerPage = localStorage.getItem('cc_pexels_per_page');
            if (pexelsPerPage) document.getElementById('pexels-per-page').value = pexelsPerPage;
            
            updateUsageDisplay();

            // Restore last generated session if it exists
            const lastResults = localStorage.getItem('cc_last_results');
            const lastNiche = localStorage.getItem('cc_last_niche');
            const lastCarousel = localStorage.getItem('cc_last_carousel');
            if (lastCarousel) {
                try {
                    generatedCarouselSlides = JSON.parse(lastCarousel);
                } catch (e) {
                    console.error("Failed to parse last carousel", e);
                }
            }
            if (lastResults && lastNiche) {
                document.getElementById('niche-input').value = lastNiche;
                document.getElementById('results').innerHTML = lastResults;
                document.getElementById('results').classList.remove('hidden');
            }
        }

        function getUses() {
            return parseInt(localStorage.getItem('cc_uses') || '0');
        }

        function incrementUses() {
            const uses = getUses() + 1;
            localStorage.setItem('cc_uses', uses.toString());
            updateUsageDisplay();
            return uses;
        }

        function updateUsageDisplay() {
            const uses = getUses();
            const useCountEl = document.getElementById('use-count');
            if (useCountEl) useCountEl.innerText = "Unlimited";
            const statsUsedEl = document.getElementById('stats-used');
            if (statsUsedEl) statsUsedEl.innerText = uses;
        }

        // --- UI LOGIC ---
        // Tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                
                e.target.classList.add('active');
                document.getElementById(e.target.dataset.tab).classList.add('active');
                
                if (e.target.dataset.tab === 'saved') {
                    renderSavedContent();
                }
            });
        });

        // Niche Tags
        document.querySelectorAll('.niche-tag').forEach(tag => {
            tag.addEventListener('click', (e) => {
                document.querySelectorAll('.niche-tag').forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                document.getElementById('niche-input').value = e.target.innerText;
            });
        });

        // Save Pexels Key
        document.getElementById('save-pexels').addEventListener('click', async function() {
            const key = document.getElementById('pexels-key').value.trim();
            const feedback = document.getElementById('pexels-feedback');
            const btn = this;
            const originalText = btn.innerHTML;

            if (!key) {
                feedback.style.display = 'block';
                feedback.style.color = '#ff4444';
                feedback.innerHTML = '<i data-lucide="alert-circle" style="width: 14px; height: 14px; display: inline-block; vertical-align: text-bottom;"></i> Please enter an API key.';
                lucide.createIcons();
                return;
            }

            btn.innerHTML = '<i data-lucide="loader-2" class="lucide-spin" style="width: 16px; height: 16px; display: inline-block; vertical-align: text-bottom; animation: spin 2s linear infinite;"></i> Validating...';
            btn.disabled = true;
            lucide.createIcons();

            try {
                // Test the key with a simple request
                const res = await fetch('https://api.pexels.com/v1/search?query=nature&per_page=1', {
                    headers: { Authorization: key }
                });

                if (res.status === 401) {
                    throw new Error('Invalid API Key');
                }
                if (res.status === 429) {
                    throw new Error('Rate Limit Exceeded');
                }
                if (!res.ok) {
                    throw new Error('Validation Failed');
                }

                localStorage.setItem('cc_pexels', key);
                
                feedback.style.display = 'none';
                btn.innerHTML = '<i data-lucide="check" style="width: 16px; height: 16px; display: inline-block; vertical-align: text-bottom;"></i> Saved!';
                btn.style.borderColor = '#4CAF50';
                btn.style.color = '#4CAF50';
                lucide.createIcons();
                
                setTimeout(() => {
                    btn.innerHTML = originalText;
                    btn.style.borderColor = '';
                    btn.style.color = '';
                    btn.disabled = false;
                    lucide.createIcons();
                }, 2000);

            } catch (err) {
                feedback.style.display = 'block';
                feedback.style.color = '#ff4444';
                if (err.message === 'Rate Limit Exceeded') {
                    feedback.innerHTML = '<i data-lucide="clock" style="width: 14px; height: 14px; display: inline-block; vertical-align: text-bottom;"></i> Rate limit reached. Try again later.';
                } else {
                    feedback.innerHTML = '<i data-lucide="alert-circle" style="width: 14px; height: 14px; display: inline-block; vertical-align: text-bottom;"></i> Invalid API Key. Please check and try again.';
                }
                
                btn.innerHTML = originalText;
                btn.disabled = false;
                lucide.createIcons();
            }
        });

        // Copy Text Utility
        window.copyText = function(elementId, btnElement) {
            const el = document.getElementById(elementId);
            const text = el.innerText;
            navigator.clipboard.writeText(text).then(() => {
                if (btnElement) {
                    const originalText = btnElement.innerHTML;
                    btnElement.innerHTML = '<i data-lucide="check" style="width: 16px; height: 16px; display: inline-block; vertical-align: text-bottom;"></i> Copied!';
                    lucide.createIcons();
                    setTimeout(() => {
                        btnElement.innerHTML = originalText;
                        lucide.createIcons();
                    }, 2000);
                }
            });
        };

        window.copySpecificText = function(btn, text) {
            navigator.clipboard.writeText(text).then(() => {
                const originalText = btn.innerHTML;
                btn.innerHTML = '<i data-lucide="check" style="width: 16px; height: 16px; display: inline-block; vertical-align: text-bottom;"></i> Copied';
                lucide.createIcons();
                setTimeout(() => {
                    btn.innerHTML = originalText;
                    lucide.createIcons();
                }, 2000);
            });
        }

        // Save Content Utility
        window.saveContent = function(btn, type, text) {
            let saved = JSON.parse(localStorage.getItem('cc_saved') || '{"quotes":[], "captions":[], "hashtags":[]}');
            if (!saved[type]) saved[type] = [];
            
            if (!saved[type].includes(text)) {
                saved[type].push(text);
                localStorage.setItem('cc_saved', JSON.stringify(saved));
            }

            const originalText = btn.innerHTML;
            btn.innerHTML = '<i data-lucide="check" style="width: 16px; height: 16px; display: inline-block; vertical-align: text-bottom;"></i> Saved';
            lucide.createIcons();
            setTimeout(() => {
                btn.innerHTML = originalText;
                lucide.createIcons();
            }, 2000);
        };

        window.deleteSavedContent = function(type, index) {
            let saved = JSON.parse(localStorage.getItem('cc_saved') || '{"quotes":[], "captions":[], "hashtags":[]}');
            if (saved[type]) {
                saved[type].splice(index, 1);
                localStorage.setItem('cc_saved', JSON.stringify(saved));
                renderSavedContent();
            }
        };

        function renderSavedContent() {
            const container = document.getElementById('saved-container');
            if (!container) return;
            
            let saved = JSON.parse(localStorage.getItem('cc_saved') || '{"quotes":[], "captions":[], "hashtags":[]}');
            let html = '';
            let hasContent = false;

            const types = [
                { key: 'quotes', label: 'Quotes' },
                { key: 'captions', label: 'Captions' },
                { key: 'hashtags', label: 'Hashtags' }
            ];

            types.forEach(t => {
                if (saved[t.key] && saved[t.key].length > 0) {
                    hasContent = true;
                    html += `<h3 style="margin-top: 20px; margin-bottom: 10px; color: var(--accent); border-bottom: 1px solid var(--border); padding-bottom: 5px;">${t.label}</h3>`;
                    saved[t.key].forEach((item, index) => {
                        html += `
                            <div style="background: #111; border: 1px solid var(--border); padding: 15px; border-radius: 4px; margin-bottom: 10px;">
                                <div style="white-space: pre-wrap; font-size: 14px; margin-bottom: 10px;">${item}</div>
                                <div style="display: flex; gap: 10px;">
                                    <button class="btn btn-outline" style="padding: 5px 10px; font-size: 12px;" onclick="copySpecificText(this, '${escapeForJsAndHtml(item)}')">Copy</button>
                                    <button class="btn btn-outline" style="padding: 5px 10px; font-size: 12px; color: #ff4444; border-color: #ff4444;" onclick="deleteSavedContent('${t.key}', ${index})">Delete</button>
                                </div>
                            </div>
                        `;
                    });
                }
            });

            if (!hasContent) {
                html = '<p style="color: #888;">You haven\'t saved any content yet. Generate some content and click the Save button!</p>';
            }

            container.innerHTML = html;
            lucide.createIcons();
        }

        // --- GENERATOR LOGIC ---
        const nicheQuotes = {
            money: [
                { text: "Money is a tool. Use it to buy your time back.", author: "Anonymous" },
                { text: "Don't work for money; make it work for you.", author: "Robert Kiyosaki" },
                { text: "Wealth consists not in having great possessions, but in having few wants.", author: "Epictetus" },
                { text: "Formal education will make you a living; self-education will make you a fortune.", author: "Jim Rohn" },
                { text: "The more you learn, the more you earn.", author: "Warren Buffett" },
                { text: "Time is more valuable than money. You can get more money, but you cannot get more time.", author: "Jim Rohn" }
            ],
            stoicism: [
                { text: "You have power over your mind - not outside events. Realize this, and you will find strength.", author: "Marcus Aurelius" },
                { text: "We suffer more often in imagination than in reality.", author: "Seneca" },
                { text: "He who fears death will never do anything worth of a man who is alive.", author: "Seneca" },
                { text: "No person has the power to have everything they want, but it is in their power not to want what they don't have.", author: "Seneca" },
                { text: "Waste no more time arguing what a good man should be. Be one.", author: "Marcus Aurelius" },
                { text: "If it is not right do not do it; if it is not true do not say it.", author: "Marcus Aurelius" }
            ],
            psychology: [
                { text: "The mind is everything. What you think you become.", author: "Buddha" },
                { text: "People will do anything, no matter how absurd, in order to avoid facing their own souls.", author: "Carl Jung" },
                { text: "Knowing your own darkness is the best method for dealing with the darknesses of other people.", author: "Carl Jung" },
                { text: "We are what we are because we have been what we have been.", author: "Sigmund Freud" },
                { text: "The greatest discovery of my generation is that human beings can alter their lives by altering their attitudes of mind.", author: "William James" }
            ],
            hustle: [
                { text: "The only way to win is to learn faster than anyone else.", author: "Eric Ries" },
                { text: "Discipline equals freedom.", author: "Jocko Willink" },
                { text: "They watch. You work. That's the difference.", author: "Anonymous" },
                { text: "Embrace the boring work. That's where the magic happens.", author: "Anonymous" },
                { text: "A year of focus can change your life completely.", author: "Anonymous" },
                { text: "Some people want it to happen, some wish it would happen, others make it happen.", author: "Michael Jordan" }
            ],
            fitness: [
                { text: "The harder the battle, the sweeter the victory.", author: "Les Brown" },
                { text: "No pain, no gain. Shut up and train.", author: "Anonymous" },
                { text: "Your body can stand almost anything. It's your mind that you have to convince.", author: "Anonymous" },
                { text: "The only bad workout is the one that didn't happen.", author: "Anonymous" },
                { text: "Discipline is doing what you hate to do, but nonetheless doing it like you love it.", author: "Mike Tyson" }
            ],
            relationships: [
                { text: "The quality of your life is the quality of your relationships.", author: "Tony Robbins" },
                { text: "A successful relationship requires falling in love many times, always with the same person.", author: "Mignon McLaughlin" },
                { text: "Trust is the glue of life. It's the most essential ingredient in effective communication.", author: "Stephen Covey" },
                { text: "We accept the love we think we deserve.", author: "Stephen Chbosky" },
                { text: "Assumptions are the termites of relationships.", author: "Henry Winkler" }
            ],
            mindfulness: [
                { text: "Mindfulness isn't difficult, we just need to remember to do it.", author: "Sharon Salzberg" },
                { text: "The present moment is filled with joy and happiness. If you are attentive, you will see it.", author: "Thich Nhat Hanh" },
                { text: "Do not dwell in the past, do not dream of the future, concentrate the mind on the present moment.", author: "Buddha" },
                { text: "Peace comes from within. Do not seek it without.", author: "Buddha" },
                { text: "Breath is the bridge which connects life to consciousness.", author: "Thich Nhat Hanh" }
            ],
            productivity: [
                { text: "Focus on being productive instead of busy.", author: "Tim Ferriss" },
                { text: "Amateurs sit and wait for inspiration, the rest of us just get up and go to work.", author: "Stephen King" },
                { text: "Until we can manage time, we can manage nothing else.", author: "Peter Drucker" },
                { text: "It's not always that we need to do more but rather that we need to focus on less.", author: "Nathan W. Morris" },
                { text: "Action is the foundational key to all success.", author: "Pablo Picasso" }
            ],
            leadership: [
                { text: "A leader is one who knows the way, goes the way, and shows the way.", author: "John C. Maxwell" },
                { text: "Leadership is not about a title or a designation. It's about impact, influence and inspiration.", author: "Robin Sharma" },
                { text: "The function of leadership is to produce more leaders, not more followers.", author: "Ralph Nader" },
                { text: "To handle yourself, use your head; to handle others, use your heart.", author: "Eleanor Roosevelt" },
                { text: "Innovation distinguishes between a leader and a follower.", author: "Steve Jobs" }
            ],
            self_improvement: [
                { text: "There is nothing noble in being superior to your fellow man; true nobility is being superior to your former self.", author: "Ernest Hemingway" },
                { text: "Be not afraid of growing slowly, be afraid only of standing still.", author: "Chinese Proverb" },
                { text: "You cannot dream yourself into a character; you must hammer and forge yourself one.", author: "James A. Froude" },
                { text: "Every action you take is a vote for the type of person you wish to become.", author: "James Clear" },
                { text: "The only person you are destined to become is the person you decide to be.", author: "Ralph Waldo Emerson" }
            ],
            discipline: [
                { text: "We must all suffer from one of two pains: the pain of discipline or the pain of regret.", author: "Jim Rohn" },
                { text: "Discipline is the bridge between goals and accomplishment.", author: "Jim Rohn" },
                { text: "Self-discipline begins with the mastery of your thoughts. If you don't control what you think, you can't control what you do.", author: "Napoleon Hill" },
                { text: "Motivation gets you going, but discipline keeps you growing.", author: "John C. Maxwell" },
                { text: "Through discipline comes freedom.", author: "Aristotle" }
            ],
            mental_health: [
                { text: "You don't have to control your thoughts. You just have to stop letting them control you.", author: "Dan Millman" },
                { text: "Mental health needs a great deal of attention. It's the final taboo and it needs to be faced and dealt with.", author: "Adam Ant" },
                { text: "What mental health needs is more sunlight, more candor, and more unashamed conversation.", author: "Glenn Close" },
                { text: "Healing takes time, and asking for help is a courageous step.", author: "Mariska Hargitay" },
                { text: "Your mental health is a priority. Your happiness is an essential. Your self-care is a necessity.", author: "Anonymous" }
            ],
            hardest: [
                { text: "It is better to be feared than loved, if you cannot be both.", author: "Niccolò Machiavelli" },
                { text: "People will always be wicked till compelled by necessity to be good.", author: "Niccolò Machiavelli" },
                { text: "The object of war is not to die for your country but to make the other bastard die for his.", author: "George S. Patton" },
                { text: "I told you I was going to be a world champion. And I am.", author: "Mike Tyson" },
                { text: "What stands in the way becomes the way.", author: "Marcus Aurelius" }
            ],
            default: [
                { text: "Your mind is a weapon. Keep it loaded.", author: "Anonymous" },
                { text: "Stop distracted living. Start intentional building.", author: "Anonymous" },
                { text: "Don't announce your moves. Show them your results.", author: "Anonymous" },
                { text: "The comfort zone is a beautiful place, but nothing ever grows there.", author: "Anonymous" },
                { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" }
            ]
        };

        function getHardcodedQuotes(niche, count) {
            const n = niche.toLowerCase();
            let category = 'default';
            if (n.includes('money') || n.includes('wealth') || n.includes('finance') || n.includes('business')) category = 'money';
            else if (n.includes('stoic') || n.includes('sigma')) category = 'stoicism';
            else if (n.includes('psych') || n.includes('dark')) category = 'psychology';
            else if (n.includes('hustle') || n.includes('grind') || n.includes('success') || n.includes('entrepreneur')) category = 'hustle';
            else if (n.includes('fitness') || n.includes('gym') || n.includes('workout') || n.includes('health')) category = 'fitness';
            else if (n.includes('relationship') || n.includes('dating') || n.includes('love')) category = 'relationships';
            else if (n.includes('mindful') || n.includes('zen') || n.includes('peace') || n.includes('meditation')) category = 'mindfulness';
            else if (n.includes('productiv') || n.includes('time') || n.includes('focus')) category = 'productivity';
            else if (n.includes('leader') || n.includes('manage')) category = 'leadership';
            else if (n.includes('improve') || n.includes('growth') || n.includes('better')) category = 'self_improvement';
            else if (n.includes('discipline') || n.includes('habit') || n.includes('routine')) category = 'discipline';
            else if (n.includes('mental') || n.includes('therapy') || n.includes('anxiety')) category = 'mental_health';
            else if (n.includes('hardest')) category = 'hardest';
            
            const shuffled = [...nicheQuotes[category]].sort(() => 0.5 - Math.random());
            return shuffled.slice(0, count);
        }

        document.getElementById('generate-btn').addEventListener('click', async () => {
            const niche = document.getElementById('niche-input').value.trim();
            if (!niche) {
                showToast('Please enter or select a niche first.', 'error');
                return;
            }

            localStorage.setItem('cc_pexels_query', document.getElementById('pexels-query').value);
            localStorage.setItem('cc_pexels_orientation', document.getElementById('pexels-orientation').value);
            localStorage.setItem('cc_pexels_color', document.getElementById('pexels-color').value);
            localStorage.setItem('cc_pexels_per_page', document.getElementById('pexels-per-page').value);

            const uses = getUses();
            let isLimited = false;

            if (uses >= MAX_FREE_USES) {
                document.getElementById('freemium-modal').style.display = 'flex';
                return; // Wait for modal interaction
            }

            await runGeneration(niche, isLimited);
            incrementUses();
        });

        document.getElementById('suggest-niches-btn').addEventListener('click', async () => {
            const btn = document.getElementById('suggest-niches-btn');
            const container = document.getElementById('niche-suggestions');
            const currentInput = document.getElementById('niche-input').value.trim();
            
            btn.disabled = true;
            btn.innerHTML = '<i data-lucide="loader-2" class="lucide-spin" style="width: 16px; height: 16px;"></i> Analyzing...';
            lucide.createIcons();
            
            try {
                let prompt = `You are a social media growth expert. Suggest 5 highly profitable and currently trending sub-niches for short-form content (TikTok/Reels/Shorts).`;
                if (currentInput) {
                    prompt += ` The user is interested in the broad category: "${currentInput}". Provide 5 specific, hyper-targeted sub-niches related to this.`;
                } else {
                    prompt += ` Provide 5 diverse, high-CPM niches.`;
                }
                prompt += ` Return ONLY a valid JSON array of strings. No markdown, no backticks. Example: ["Niche 1", "Niche 2"]`;

                const response = await ai.models.generateContent({
                    model: 'gemini-3-flash-preview',
                    contents: prompt,
                });
                
                let jsonStr = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
                const niches = JSON.parse(jsonStr);
                
                container.innerHTML = '';
                niches.forEach(niche => {
                    const tag = document.createElement('button');
                    tag.className = 'niche-tag';
                    tag.style.cssText = 'background: var(--bg); border: 1px solid var(--accent); padding: 5px 10px; border-radius: 15px; font-size: 12px; cursor: pointer; transition: all 0.2s; color: var(--accent);';
                    tag.innerText = niche;
                    tag.onclick = () => {
                        document.getElementById('niche-input').value = niche;
                        container.innerHTML = ''; // Clear suggestions after selection
                    };
                    tag.onmouseover = () => { tag.style.background = 'var(--accent)'; tag.style.color = '#000'; };
                    tag.onmouseout = () => { tag.style.background = 'var(--bg)'; tag.style.color = 'var(--accent)'; };
                    container.appendChild(tag);
                });
            } catch (e) {
                handleAiError(e, "Failed to load suggestions.");
                container.innerHTML = '<span style="color: red; font-size: 12px;">Failed to load suggestions. Try again.</span>';
            } finally {
                btn.disabled = false;
                btn.innerHTML = '<i data-lucide="sparkles" style="width: 16px; height: 16px;"></i> AI Suggest';
                lucide.createIcons();
            }
        });

        document.getElementById('continue-limited').addEventListener('click', async () => {
            document.getElementById('freemium-modal').style.display = 'none';
            const niche = document.getElementById('niche-input').value.trim();
            await runGeneration(niche, true);
        });

        async function runGeneration(niche, isLimited) {
            document.getElementById('loader').classList.add('active');
            document.getElementById('results').classList.add('hidden');
            
            const quoteCount = isLimited ? 2 : 5;
            const captionCount = isLimited ? 1 : 3;

            // 1. Generate Quotes
            await generateQuotes(niche, quoteCount);
            
            // 2. Generate Carousel
            await generateCarousel(niche);
            
            // 3. Generate Captions
            const tone = document.getElementById('caption-tone-input').value.trim();
            await generateCaptions(niche, captionCount, tone);
            
            // 4. Generate Hashtags
            await generateHashtags(niche);
            
            // 5. Generate Video Scripts
            await generateVideoScripts(niche);
            
            // 6. Fetch Stock Images
            await fetchStockImages(niche);

            document.getElementById('loader').classList.remove('active');
            document.getElementById('results').classList.remove('hidden');
            lucide.createIcons();

            // Save to local storage so it survives tab switching/reloads
            localStorage.setItem('cc_last_results', document.getElementById('results').innerHTML);
            localStorage.setItem('cc_last_niche', niche);
        }

        async function generateQuotes(niche, count) {
            const container = document.getElementById('quotes-container');
            const paletteContainer = document.getElementById('palette-suggestion');
            container.innerHTML = '<p style="color: #888;">Generating quotes and palettes with AI...</p>';
            
            let quotes = [];
            let palettes = [
                { name: "Dark Minimal", background: "#0d0d0d", text: "#ffffff" },
                { name: "Deep Navy", background: "#1a1a2e", text: "#ffffff" },
                { name: "Charcoal", background: "#111111", text: "#ffffff" }
            ];

            try {
                let prompt = `Generate ${count} unique, highly engaging, and powerful quotes for the niche: "${niche}". 
                Do not repeat common quotes. Create original or lesser-known profound statements.
                Also, suggest 3 complementary color palettes based on the vibe of this niche.
                Return ONLY a valid JSON object with the following structure:
                {
                    "quotes": [
                        { "text": "Quote text here", "author": "Author Name", "suggested_caption": "Engaging social media caption with hooks and hashtags" }
                    ],
                    "palettes": [
                        { "name": "Palette Name", "background": "#hexcode", "text": "#hexcode" }
                    ]
                }
                No markdown, no backticks.`;

                if (niche.includes('Hardest Quotes Ever')) {
                    prompt = `Generate ${count} unique, genuinely hard-hitting quotes that feel heavy, raw, and cold. Do not use motivational poster fluff. Think Marcus Aurelius, Machiavelli, Nietzsche, Sun Tzu, actual prison letters, wartime speeches, death row statements, and ruthless thinkers.
                    Also, suggest 3 complementary color palettes based on a cold, dark, heavy aesthetic.
                    Return ONLY a valid JSON object with the following structure:
                    {
                        "quotes": [
                            { "text": "Quote text here", "author": "Author Name", "suggested_caption": "Cold, unapologetic social media caption with hooks and hashtags" }
                        ],
                        "palettes": [
                            { "name": "Palette Name", "background": "#hexcode", "text": "#hexcode" }
                        ]
                    }
                    No markdown, no backticks.`;
                }

                const response = await ai.models.generateContent({
                    model: 'gemini-3-flash-preview',
                    contents: prompt,
                });
                
                let jsonStr = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
                const data = JSON.parse(jsonStr);
                quotes = data.quotes;
                if (data.palettes && data.palettes.length > 0) {
                    palettes = data.palettes;
                }
            } catch (e) {
                handleAiError(e, "Falling back to hardcoded quotes.");
                quotes = getHardcodedQuotes(niche, count);
            }

            if (paletteContainer) {
                let paletteHtml = '<strong style="color: var(--text);">AI Suggested Palettes:</strong><br>';
                palettes.forEach(p => {
                    paletteHtml += `
                        <span style="display: inline-block; margin-right: 15px; margin-top: 8px;">
                            <span style="display: inline-block; width: 14px; height: 14px; background: ${p.background}; border: 1px solid #444; border-radius: 50%; margin-right: 6px; vertical-align: middle;"></span>
                            <span style="color: #ccc;">${p.name}</span> <span style="color: #888; font-size: 12px;">(Bg: ${p.background}, Text: ${p.text})</span>
                        </span>
                    `;
                });
                paletteContainer.innerHTML = paletteHtml;
            }

            container.innerHTML = '';

            quotes.forEach((q, i) => {
                const palette = palettes[i % palettes.length];
                const captionText = q.suggested_caption || `Here is a powerful quote by ${q.author}. #${niche.replace(/\s+/g, '')} #quotes`;
                const html = `
                    <div style="margin-bottom: 30px; display: flex; flex-direction: column; gap: 10px;">
                        <div class="quote-card" style="background: ${palette.background}; color: ${palette.text}; border: 1px solid #333; margin-bottom: 0;">
                            <div style="position: absolute; top: 10px; right: 10px; display: flex; gap: 5px;">
                                <button class="copy-btn" style="position: static; color: ${palette.text}; border-color: ${palette.text}; opacity: 0.9; display: flex; align-items: center; gap: 4px; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500;" onclick="startVideoExport(this, '${escapeForJsAndHtml(q.text)}', '${escapeForJsAndHtml(q.author)}')" title="Export as Video">
                                    <i data-lucide="video" style="width: 14px; height: 14px;"></i> Video
                                </button>
                                <button class="copy-btn" style="position: static; color: ${palette.text}; border-color: ${palette.text}; opacity: 0.9; display: flex; align-items: center; gap: 4px; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500;" onclick="startImageExport(this, '${escapeForJsAndHtml(q.text)}', '${escapeForJsAndHtml(q.author)}')" title="Export as Image">
                                    <i data-lucide="image" style="width: 14px; height: 14px;"></i> Image
                                </button>
                                <button class="copy-btn" style="position: static; color: ${palette.text}; border-color: ${palette.text}; opacity: 0.7; padding: 4px;" onclick="saveContent(this, 'quotes', '${escapeForJsAndHtml(q.text + ' - ' + q.author)}')" title="Save">
                                    <i data-lucide="bookmark" style="width: 14px; height: 14px;"></i>
                                </button>
                                <button class="copy-btn" style="position: static; color: ${palette.text}; border-color: ${palette.text}; opacity: 0.7; padding: 4px;" onclick="copySpecificText(this, '${escapeForJsAndHtml(q.text)}')" title="Copy Text">
                                    <i data-lucide="copy" style="width: 14px; height: 14px;"></i>
                                </button>
                            </div>
                            <div class="quote-text" style="color: ${palette.text};">"${q.text}"</div>
                            <div class="quote-author" style="color: ${palette.text}; opacity: 0.8;">— ${q.author}</div>
                        </div>
                        <div style="background: rgba(0,0,0,0.2); padding: 12px; border-radius: 6px; border: 1px dashed #444;">
                            <strong style="color: #aaa; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 6px;">Suggested Caption</strong>
                            <p style="font-size: 13px; margin: 0; color: #ddd;">${captionText}</p>
                            <button class="btn btn-outline" style="padding: 4px 8px; font-size: 11px; margin-top: 8px;" onclick="copySpecificText(this, '${escapeForJsAndHtml(captionText)}')"><i data-lucide="copy" style="width: 12px; height: 12px; margin-right: 4px;"></i> Copy Caption</button>
                        </div>
                    </div>
                `;
                container.innerHTML += html;
            });
            setTimeout(() => {
                if(window.lucide) { lucide.createIcons(); }
            }, 100);
        }

        let generatedCarouselSlides = [];
        
        async function generateCarousel(niche) {
            const container = document.getElementById('carousel-container');
            container.innerHTML = '<p style="color: #888;">Generating carousel with AI...</p>';
            
            try {
                let prompt = `Create a 10-slide Instagram/LinkedIn carousel script for the niche: "${niche}".
                For the FIRST slide (the hook), you MUST use an extremely strong pattern interrupt or curiosity gap. It should be a bold, controversial, or highly unexpected one-liner that stops a fast scroller instantly.
                Apply pattern interrupt psychology, curiosity gaps, and visual salience to every slide — bold one-liner hooks, unexpected angles, contrast-driven statements, and unfinished loops that stop a fast scroller within 0.1 seconds and force the next swipe. Structure the 10 slides as one continuous story — each slide is a chapter, not a standalone post. The narrative must flow and connect sequentially, building tension and momentum that makes skipping any slide feel like missing a plot twist. Every slide is punchy, scannable, and emotionally charged. No filler. No generic lines. Every word earns its place. Make sure that it is deeply connected to the niche: "${niche}".
                Return ONLY a valid JSON array of strings, where each string is the text for one slide.
                No markdown, no backticks.`;

                if (niche.includes('Hardest Quotes Ever')) {
                    prompt = `Create a 10-slide Instagram/LinkedIn carousel of the "Hardest Quotes Ever".
                    Produce quotes that feel genuinely hard-hitting -- not motivational poster fluff. Think Marcus Aurelius, Machiavelli, Nietzsche, Sun Tzu, actual prison letters, wartime speeches, death row statements, and ruthless thinkers.
                    Output should be formatted as carousel slides: one quote per slide, with the author and context below it.
                    For the FIRST slide (the hook), you MUST use an extremely strong pattern interrupt or curiosity gap. It should be a bold, controversial, or highly unexpected one-liner that stops a fast scroller instantly, setting the dark, heavy, and unapologetic tone for the rest of the carousel.
                    The slides should feel cold, heavy, and raw. Structure the 10 slides as one continuous experience.
                    Return ONLY a valid JSON array of strings, where each string is the text for one slide (e.g. "Quote text here\\n\\n— Author Name\\nContext").
                    No markdown, no backticks.`;
                }

                const response = await ai.models.generateContent({
                    model: 'gemini-3-flash-preview',
                    contents: prompt,
                });
                
                let jsonStr = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
                const slides = JSON.parse(jsonStr);
                generatedCarouselSlides = slides;
                localStorage.setItem('cc_last_carousel', JSON.stringify(slides));
                
                let html = '';
                slides.forEach((slide, i) => {
                    let title = `Slide ${i+1} (Value)`;
                    if (i === 0) title = `Slide 1 (Hook)`;
                    if (i === slides.length - 1) title = `Slide ${i+1} (CTA)`;
                    
                    html += `
                        <div class="carousel-slide">
                            <h4>${title}</h4>
                            <p>${slide}</p>
                        </div>
                    `;
                });
                container.innerHTML = html;
            } catch (e) {
                handleAiError(e, "Falling back to hardcoded carousel.");
                generatedCarouselSlides = [
                    "Are you struggling with [Common Problem]?",
                    "Here is the #1 mistake people make...",
                    "Instead of doing [Bad Practice], try this...",
                    "Step 1: [Actionable Step]",
                    "Step 2: [Actionable Step]",
                    "Save this post for later and follow for more tips!"
                ];
                localStorage.setItem('cc_last_carousel', JSON.stringify(generatedCarouselSlides));
                const html = `
                    <div class="carousel-slide">
                        <h4>Slide 1 (Hook)</h4>
                        <p>99% of people misunderstand [${niche}]. Here is the brutal truth they won't tell you.</p>
                    </div>
                    <div class="carousel-slide">
                        <h4>Slide 2 (Value)</h4>
                        <p>Stop consuming. Start creating. The system is designed to keep you distracted.</p>
                    </div>
                    <div class="carousel-slide">
                        <h4>Slide 3 (Value)</h4>
                        <p>Your attention is currency. Who are you paying today?</p>
                    </div>
                    <div class="carousel-slide">
                        <h4>Slide 4 (Value)</h4>
                        <p>Master your mind, and you master your reality. It starts with one focused hour a day.</p>
                    </div>
                    <div class="carousel-slide">
                        <h4>Slide 5 (Value)</h4>
                        <p>The pain of discipline weighs ounces. The pain of regret weighs tons.</p>
                    </div>
                    <div class="carousel-slide">
                        <h4>Slide 6 (CTA)</h4>
                        <p>Save this post to remind yourself. Follow for daily [${niche}] mastery. Link in bio to level up.</p>
                    </div>
                `;
                container.innerHTML = html;
            }
        }

        async function generateCaptions(niche, count, tone) {
            const container = document.getElementById('captions-container');
            container.innerHTML = '<p style="color: #888;">Generating platform-specific captions with AI...</p>';

            try {
                let toneInstruction = tone ? ` The desired tone/audience is: "${tone}". Ensure the captions strongly reflect this tone.` : "";
                const prompt = `Write 3 different social media captions for a short-form video about "${niche}".${toneInstruction}
                Follow these strict rules:
                1. YouTube Shorts: The caption MUST be EXACTLY 100 characters — no more, no less. Make it punchy, compelling, and front-load the most important words.
                2. Instagram and TikTok: Use pattern interrupt psychology and curiosity gaps. The first line MUST stop the scroll instantly and create an irresistible urge to read the rest. Every caption must feel native to its platform, emotionally charged, and impossible to ignore.
                3. All captions MUST be deeply connected to the content of the "${niche}" niche.
                Return ONLY a valid JSON array of objects. Each object must have:
                - "type": The platform (e.g., "Instagram", "TikTok", "YouTube Shorts").
                - "text": The actual caption text.
                No markdown, no backticks.`;

                const response = await ai.models.generateContent({
                    model: 'gemini-3-flash-preview',
                    contents: prompt,
                });
                
                let jsonStr = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
                const captions = JSON.parse(jsonStr);
                
                container.innerHTML = '';
                captions.forEach(cap => {
                    container.innerHTML += `
                        <div class="caption-box">
                            <strong style="color: var(--accent);">${cap.type} Caption:</strong><br><br>${cap.text.replace(/\n/g, '<br>')}
                            <br><br>
                            <div style="display: flex; gap: 10px;">
                                <button class="btn btn-outline" style="padding: 5px 10px; font-size: 12px;" onclick="copySpecificText(this, '${escapeForJsAndHtml(cap.text)}')">Copy</button>
                                <button class="btn btn-outline" style="padding: 5px 10px; font-size: 12px;" onclick="saveContent(this, 'captions', '${escapeForJsAndHtml(cap.text)}')">Save</button>
                            </div>
                        </div>
                    `;
                });
            } catch (e) {
                handleAiError(e, "Falling back to hardcoded captions.");
                const captions = [
                    {
                        type: "Instagram",
                        text: `Read that again. 🧠\n\nFollow for more daily ${niche} insights. Save this post so you don't forget it!\n\n🔗 Get the full blueprint at the link in my bio: [YOUR LINK]`
                    },
                    {
                        type: "TikTok",
                        text: `Most people will scroll past this. But if you're reading this, you're in the 1%. 🚀\n\nMastering ${niche} isn't about motivation, it's about systems.\n\nDrop a 💯 in the comments if you agree and hit the + for more!`
                    },
                    {
                        type: "YouTube Shorts",
                        text: `The biggest lie we're sold about ${niche} is that it takes years to see results. It doesn't.\n\nSubscribe for daily tips on how to master this in 6 months. 👇\n\nCheck the pinned comment for the exact framework I use! 🔗`
                    }
                ];

                container.innerHTML = '';
                // Since we specifically want 3 platforms now, we can just render all 3 fallback captions
                for(let i=0; i<captions.length; i++) {
                    const cap = captions[i];
                    container.innerHTML += `
                        <div class="caption-box">
                            <strong style="color: var(--accent);">${cap.type} Caption:</strong><br><br>${cap.text.replace(/\n/g, '<br>')}
                            <br><br>
                            <div style="display: flex; gap: 10px;">
                                <button class="btn btn-outline" style="padding: 5px 10px; font-size: 12px;" onclick="copySpecificText(this, '${escapeForJsAndHtml(cap.text)}')">Copy</button>
                                <button class="btn btn-outline" style="padding: 5px 10px; font-size: 12px;" onclick="saveContent(this, 'captions', '${escapeForJsAndHtml(cap.text)}')">Save</button>
                            </div>
                        </div>
                    `;
                }
            }
        }

        async function generateHashtags(niche) {
            const container = document.getElementById('hashtags-container');
            container.innerText = 'Generating hashtags with AI...';

            try {
                const prompt = `Generate 30 highly relevant, trending, and effective Instagram/TikTok hashtags for the niche: "${niche}".
                Return ONLY a valid JSON array of strings. Each string should include the '#' symbol.
                No markdown, no backticks.`;

                const response = await ai.models.generateContent({
                    model: 'gemini-3-flash-preview',
                    contents: prompt,
                });
                
                let jsonStr = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
                const tags = JSON.parse(jsonStr);
                container.innerText = tags.join(' ');
            } catch (e) {
                handleAiError(e, "Falling back to hardcoded hashtags.");
                const baseWord = niche.replace(/\s+/g, '').toLowerCase();
                const tags = [
                    `#${baseWord}`, `#${baseWord}tips`, `#${baseWord}mindset`, `#${baseWord}quotes`,
                    `#mindsetshift`, `#dailygrind`, `#focus`, `#discipline`, `#successquotes`,
                    `#wealthcreation`, `#stoic`, `#hustle`, `#entrepreneur`, `#growthmindset`,
                    `#leveluptips`, `#facelessmarketing`, `#digitalwealth`, `#mindsetmatters`,
                    `#psychologyfacts`, `#deepwork`, `#selfmastery`, `#motivationdaily`,
                    `#successhabits`, `#buildwealth`, `#financialfreedom`, `#mindsetcoach`,
                    `#hustleharder`, `#sigmagrindset`, `#stoicism`, `#wealthmindset`
                ];
                container.innerText = tags.join(' ');
            }
        }

        async function generateVideoScripts(niche) {
            const container = document.getElementById('video-scripts-container');
            if (!container) return;
            container.innerHTML = '<p style="color: #888;">Generating video scripts with AI...</p>';
            
            try {
                const prompt = `You are an expert social media manager. Create 2 short-form video scripts (for Reels/TikTok/Shorts) for the niche: "${niche}".
                
                Format the output strictly as a JSON array of objects. Each object must have:
                - "title": A catchy title for the script.
                - "hook": The hook (first 3 seconds).
                - "body": The main value/content.
                - "visuals": Visual/Transition ideas.
                - "cta": Call to Action.
                - "audio": Music/Audio suggestion.
                
                Return ONLY valid JSON. No markdown formatting, no backticks.`;

                const response = await ai.models.generateContent({
                    model: 'gemini-3-flash-preview',
                    contents: prompt,
                });
                
                let jsonStr = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
                const scripts = JSON.parse(jsonStr);
                
                let html = '';
                scripts.forEach((script) => {
                    const scriptText = `Hook: ${script.hook}\n\nBody: ${script.body}\n\nVisuals: ${script.visuals}\n\nCTA: ${script.cta}\n\nAudio: ${script.audio}`;
                    html += `
                        <div class="caption-box">
                            <strong style="color: var(--accent);">${script.title}</strong><br><br>
                            <strong>Hook (0-3s):</strong> ${script.hook}<br><br>
                            <strong>Body:</strong> ${script.body}<br><br>
                            <strong>Visuals:</strong> ${script.visuals}<br><br>
                            <strong>CTA:</strong> ${script.cta}<br><br>
                            <strong>Audio:</strong> ${script.audio}<br><br>
                            <div style="display: flex; gap: 10px;">
                                <button class="btn btn-outline" style="padding: 5px 10px; font-size: 12px;" onclick="copySpecificText(this, '${escapeForJsAndHtml(scriptText)}')">Copy Script</button>
                            </div>
                        </div>
                    `;
                });
                container.innerHTML = html;
            } catch (e) {
                handleAiError(e, "Falling back to hardcoded scripts.");
                const scriptText1 = `Hook: Stop doing [common mistake in ${niche}]. It's ruining your progress.\n\nBody: Instead, you need to focus on [solution/value]. Here is why: [1 sentence explanation].\n\nVisuals: Quick cuts between you talking and B-roll of the solution.\n\nCTA: Save this for later and follow for more ${niche} tips.\n\nAudio: Trending lo-fi or phonk beat.`;
                const scriptText2 = `Hook: How to master ${niche} in 3 simple steps.\n\nBody: Step 1: [Actionable advice]. Step 2: [Actionable advice]. Step 3: [Actionable advice].\n\nVisuals: Text boxes popping up with a sound effect for each step.\n\nCTA: Which step are you stuck on? Let me know in the comments.\n\nAudio: Upbeat, fast-paced instrumental.`;
                
                container.innerHTML = `
                    <div class="caption-box">
                        <strong style="color: var(--accent);">Script 1: The Contrarian Hook</strong><br><br>
                        <strong>Hook (0-3s):</strong> "Stop doing [common mistake in ${niche}]. It's ruining your progress." (Text on screen, fast zoom in)<br><br>
                        <strong>Body (3-12s):</strong> "Instead, you need to focus on [solution/value]. Here is why: [1 sentence explanation]."<br><br>
                        <strong>Visuals:</strong> Quick cuts between you talking and B-roll of the solution.<br><br>
                        <strong>CTA:</strong> "Save this for later and follow for more ${niche} tips."<br><br>
                        <strong>Audio:</strong> Trending lo-fi or phonk beat.
                        <br><br>
                        <div style="display: flex; gap: 10px;">
                            <button class="btn btn-outline" style="padding: 5px 10px; font-size: 12px;" onclick="copySpecificText(this, '${escapeForJsAndHtml(scriptText1)}')">Copy Script</button>
                        </div>
                    </div>
                    <div class="caption-box">
                        <strong style="color: var(--accent);">Script 2: The 3-Step Framework</strong><br><br>
                        <strong>Hook (0-3s):</strong> "How to master ${niche} in 3 simple steps." (Point to screen, text pops up)<br><br>
                        <strong>Body (3-15s):</strong> "Step 1: [Actionable advice]. Step 2: [Actionable advice]. Step 3: [Actionable advice]."<br><br>
                        <strong>Visuals:</strong> Text boxes popping up with a sound effect for each step.<br><br>
                        <strong>CTA:</strong> "Which step are you stuck on? Let me know in the comments."<br><br>
                        <strong>Audio:</strong> Upbeat, fast-paced instrumental.
                        <br><br>
                        <div style="display: flex; gap: 10px;">
                            <button class="btn btn-outline" style="padding: 5px 10px; font-size: 12px;" onclick="copySpecificText(this, '${escapeForJsAndHtml(scriptText2)}')">Copy Script</button>
                        </div>
                    </div>
                `;
            }
        }

        async function fetchStockImages(niche) {
            const container = document.getElementById('stock-container');
            container.innerHTML = '';
            
            const apiKey = localStorage.getItem('cc_pexels');
            if (!apiKey) {
                container.innerHTML = '<p style="color: #888; font-size: 14px;">Enter your Pexels API key in Settings to auto-fetch background images.</p>';
                return;
            }

            const customQuery = document.getElementById('pexels-query').value.trim();
            const orientation = document.getElementById('pexels-orientation').value;
            const color = document.getElementById('pexels-color').value;
            const perPage = document.getElementById('pexels-per-page').value || 6;
            
            let searchQuery = customQuery || (niche + ' dark aesthetic');
            
            // Handle pseudo-colors by appending to query
            if (color === 'warm' || color === 'cool') {
                searchQuery += ' ' + color;
            }
            
            let url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(searchQuery)}&per_page=${perPage}`;
            if (orientation) url += `&orientation=${orientation}`;
            
            // Only append color param if it's a valid Pexels color
            if (color && color !== 'warm' && color !== 'cool') {
                url += `&color=${color}`;
            }

            try {
                const res = await fetch(url, {
                    headers: { Authorization: apiKey }
                });
                
                if (res.status === 401) {
                    container.innerHTML = `
                        <div style="grid-column: span 3; text-align: center; padding: 20px; background: rgba(255,0,0,0.1); border: 1px solid rgba(255,0,0,0.2); border-radius: 8px;">
                            <i data-lucide="lock" style="color: #ff4444; margin-bottom: 10px;"></i>
                            <p style="color: #ff4444; font-weight: bold;">Invalid API Key</p>
                            <p style="font-size: 13px; color: #888; margin-top: 5px;">Your Pexels API key is incorrect or has been disabled. Please check your Settings.</p>
                        </div>
                    `;
                    lucide.createIcons();
                    return;
                }

                if (res.status === 429) {
                    const resetTime = res.headers.get('X-Ratelimit-Reset');
                    let resetMessage = "Please wait a few minutes and try again.";
                    if (resetTime) {
                        const date = new Date(parseInt(resetTime) * 1000);
                        resetMessage = `Your limit will reset at <strong>${date.toLocaleTimeString()}</strong>.`;
                    }
                    container.innerHTML = `
                        <div style="grid-column: span 3; text-align: center; padding: 20px; background: rgba(255,165,0,0.1); border: 1px solid rgba(255,165,0,0.2); border-radius: 8px;">
                            <i data-lucide="clock" style="color: #ffa500; margin-bottom: 10px;"></i>
                            <p style="color: #ffa500; font-weight: bold;">Rate Limit Reached</p>
                            <p style="font-size: 13px; color: #888; margin-top: 5px;">Pexels free tier allows 200 requests per hour. ${resetMessage}</p>
                        </div>
                    `;
                    lucide.createIcons();
                    return;
                }

                if (res.ok) {
                    const data = await res.json();
                    if (data.photos && data.photos.length > 0) {
                        data.photos.forEach(photo => {
                            container.innerHTML += `
                                <div class="stock-item" style="cursor: pointer; position: relative; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'" onclick="setQuoteBackgrounds('${photo.src.large}')" title="Click to use as Quote Background">
                                    <img src="${photo.src.medium}" class="stock-img" alt="Stock">
                                    <div style="position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.8); color: var(--accent); font-size: 11px; padding: 6px; text-align: center; border-bottom-left-radius: 4px; border-bottom-right-radius: 4px; font-weight: bold;">
                                        <i data-lucide="image" style="width: 12px; height: 12px; display: inline-block; vertical-align: middle; margin-right: 4px;"></i>Set as Quote BG
                                    </div>
                                </div>
                            `;
                        });
                        lucide.createIcons();
                    } else {
                        container.innerHTML = '<p>No images found for this niche.</p>';
                    }
                } else {
                    container.innerHTML = '<p style="color: red;">Invalid Pexels API Key.</p>';
                }
            } catch (e) {
                container.innerHTML = '<p style="color: red;">Failed to fetch images.</p>';
            }
        }

        window.setQuoteBackgrounds = function(imgUrl) {
            const cards = document.querySelectorAll('.quote-card');
            cards.forEach(card => {
                card.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url('${imgUrl}')`;
                card.style.backgroundSize = 'cover';
                card.style.backgroundPosition = 'center';
            });
            document.getElementById('quotes-container').scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            // Update local storage with the new backgrounds
            localStorage.setItem('cc_last_results', document.getElementById('results').innerHTML);
        };

        window.handleGlobalBgUpload = function(input) {
            if (input.files && input.files[0]) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const imgUrl = e.target.result;
                    
                    // 1. Apply to all quote cards
                    setQuoteBackgrounds(imgUrl);
                    
                    // 2. Add to carousel backgrounds and apply to all slides
                    const newBgId = 'upload-' + Date.now();
                    ccBackgrounds.unshift({
                        id: newBgId,
                        type: 'image',
                        value: `url('${imgUrl}')`,
                        bgSize: 'cover',
                        text: '#FFFFFF' // Assume dark overlay makes white text readable
                    });
                    
                    // Apply to all existing slides
                    ccSlides.forEach(slide => {
                        slide.bgId = newBgId;
                    });
                    
                    // Re-render carousel builder if it's visible
                    renderCcBackgrounds();
                    updateCcPreview();
                    renderCcSlideStrip();
                    
                    showToast('Background applied to all cards and slides!', 'success');
                };
                reader.readAsDataURL(input.files[0]);
            }
        };

        window.handleCcBgUpload = function(input) {
            if (input.files && input.files[0]) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const imgUrl = e.target.result;
                    
                    const newBgId = 'upload-' + Date.now();
                    ccBackgrounds.unshift({
                        id: newBgId,
                        type: 'image',
                        value: `url('${imgUrl}')`,
                        bgSize: 'cover',
                        text: '#FFFFFF'
                    });
                    
                    const slide = ccSlides.find(s => s.id === ccCurrentSlideId);
                    if (slide) {
                        slide.bgId = newBgId;
                    }
                    
                    renderCcBackgrounds();
                    updateCcPreview();
                    renderCcSlideStrip();
                    
                    showToast('Custom background uploaded and applied!', 'success');
                };
                reader.readAsDataURL(input.files[0]);
            }
        };

        window.searchInternetAudio = async function() {
            const query = document.getElementById('internet-audio-query').value.trim();
            if (!query) return;
            
            const resultsContainer = document.getElementById('internet-audio-results');
            resultsContainer.innerHTML = '<p style="color: #888; font-size: 12px;">Searching...</p>';
            
            try {
                const response = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&limit=10`);
                const data = await response.json();
                
                if (data.results.length === 0) {
                    resultsContainer.innerHTML = '<p style="color: #888; font-size: 12px;">No tracks found.</p>';
                    return;
                }
                
                resultsContainer.innerHTML = '';
                data.results.forEach(track => {
                    if (!track.previewUrl) return;
                    
                    const div = document.createElement('div');
                    div.style.display = 'flex';
                    div.style.alignItems = 'center';
                    div.style.justifyContent = 'space-between';
                    div.style.padding = '8px';
                    div.style.background = 'rgba(0,0,0,0.3)';
                    div.style.borderRadius = '4px';
                    div.style.border = '1px solid var(--border)';
                    
                    const info = document.createElement('div');
                    info.style.flex = '1';
                    info.style.overflow = 'hidden';
                    info.innerHTML = `
                        <div style="font-size: 12px; font-weight: bold; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${track.trackName}</div>
                        <div style="font-size: 10px; color: #888; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${track.artistName}</div>
                    `;
                    
                    const actions = document.createElement('div');
                    actions.style.display = 'flex';
                    actions.style.gap = '5px';
                    
                    const playBtn = document.createElement('button');
                    playBtn.className = 'btn btn-outline';
                    playBtn.style.padding = '4px 8px';
                    playBtn.style.fontSize = '10px';
                    playBtn.innerHTML = '▶';
                    let audioPreview = null;
                    playBtn.onclick = () => {
                        if (audioPreview) {
                            audioPreview.pause();
                            audioPreview = null;
                            playBtn.innerHTML = '▶';
                        } else {
                            // Stop any other playing previews
                            document.querySelectorAll('audio.preview-audio').forEach(a => a.pause());
                            document.querySelectorAll('.preview-play-btn').forEach(b => b.innerHTML = '▶');
                            
                            audioPreview = new Audio(track.previewUrl);
                            audioPreview.className = 'preview-audio';
                            playBtn.classList.add('preview-play-btn');
                            audioPreview.play();
                            playBtn.innerHTML = '⏸';
                            audioPreview.onended = () => {
                                playBtn.innerHTML = '▶';
                                audioPreview = null;
                            };
                        }
                    };
                    
                    const selectBtn = document.createElement('button');
                    selectBtn.className = 'btn';
                    selectBtn.style.padding = '4px 8px';
                    selectBtn.style.fontSize = '10px';
                    selectBtn.innerText = 'Select';
                    selectBtn.onclick = () => {
                        document.getElementById('selected-internet-audio-url').value = track.previewUrl;
                        document.querySelectorAll('.internet-audio-select-btn').forEach(b => {
                            b.innerText = 'Select';
                            b.classList.remove('btn-outline');
                            b.classList.add('btn');
                        });
                        selectBtn.innerText = 'Selected';
                        selectBtn.classList.remove('btn');
                        selectBtn.classList.add('btn-outline');
                        selectBtn.classList.add('internet-audio-select-btn');
                        if(document.getElementById('video-preview-canvas').style.display !== 'none') startVideoPreview();
                    };
                    
                    actions.appendChild(playBtn);
                    actions.appendChild(selectBtn);
                    
                    div.appendChild(info);
                    div.appendChild(actions);
                    resultsContainer.appendChild(div);
                });
            } catch (e) {
                resultsContainer.innerHTML = '<p style="color: red; font-size: 12px;">Failed to fetch audio.</p>';
            }
        }

        // --- VIDEO GENERATION LOGIC ---
        let pendingVideoExport = null;

        window.loadVideoPresets = function() {
            const presets = JSON.parse(localStorage.getItem('cc_video_presets') || '{}');
            const select = document.getElementById('video-preset-select');
            const currentValue = select.value;
            select.innerHTML = '<option value="">-- Select Preset --</option>';
            for (const name in presets) {
                const opt = document.createElement('option');
                opt.value = name;
                opt.innerText = name;
                select.appendChild(opt);
            }
            if (presets[currentValue]) {
                select.value = currentValue;
            }
            lucide.createIcons();
        }

        window.applyVideoPreset = function() {
            const name = document.getElementById('video-preset-select').value;
            if (!name) return;
            const presets = JSON.parse(localStorage.getItem('cc_video_presets') || '{}');
            const preset = presets[name];
            if (preset) {
                if (preset.animStyle) document.getElementById('video-anim-style').value = preset.animStyle;
                if (preset.duration) {
                    document.getElementById('video-duration').value = preset.duration;
                    document.getElementById('video-custom-duration').style.display = preset.duration === 'custom' ? 'block' : 'none';
                }
                if (preset.customDuration) document.getElementById('video-custom-duration').value = preset.customDuration;
                if (preset.musicStyle) {
                    document.getElementById('video-music-style').value = preset.musicStyle;
                    document.getElementById('internet-audio-section').style.display = preset.musicStyle === 'internet' ? 'block' : 'none';
                }
                if (document.getElementById('video-preview-canvas').style.display !== 'none') startVideoPreview();
            }
        };

        window.saveVideoPreset = function() {
            const name = prompt("Enter a name for this preset:");
            if (!name) return;
            const presets = JSON.parse(localStorage.getItem('cc_video_presets') || '{}');
            presets[name] = {
                animStyle: document.getElementById('video-anim-style').value,
                duration: document.getElementById('video-duration').value,
                customDuration: document.getElementById('video-custom-duration').value,
                musicStyle: document.getElementById('video-music-style').value
            };
            localStorage.setItem('cc_video_presets', JSON.stringify(presets));
            loadVideoPresets();
            document.getElementById('video-preset-select').value = name;
        };

        window.deleteVideoPreset = function() {
            const name = document.getElementById('video-preset-select').value;
            if (!name) {
                showToast("Please select a preset to delete.", 'error');
                return;
            }
            const presets = JSON.parse(localStorage.getItem('cc_video_presets') || '{}');
            delete presets[name];
            localStorage.setItem('cc_video_presets', JSON.stringify(presets));
            loadVideoPresets();
            showToast(`Preset "${name}" deleted.`);
        };

        let pendingImageExport = null;
        let currentImageLayout = 'portrait';
        let currentTextAlign = 'center';
        let currentTextVAlign = 'center';
        let currentBgSource = 'original';
        let uploadedBgUrl = null;
        let aiBgUrl = null;
        let generatedBgUrl = null;
        let currentFontSize = 100;
        let currentTextColor = '#ffffff';

        window.startImageExport = function(btn, text, author) {
            const card = btn.closest('.quote-card');
            const bgImage = card.style.backgroundImage;
            const bgColor = card.style.backgroundColor;
            
            let bgUrl = null;
            if (bgImage && bgImage.includes('url(')) {
                const match = bgImage.match(/url\(['"]?(.*?)['"]?\)/);
                if (match && match[1]) {
                    bgUrl = match[1];
                }
            }
            
            pendingImageExport = { text, author, bgUrl, bgColor };
            
            // Reset state
            currentBgSource = 'original';
            uploadedBgUrl = null;
            aiBgUrl = null;
            generatedBgUrl = null;
            currentFontSize = 100;
            currentTextColor = '#ffffff';
            
            // Reset UI
            document.querySelectorAll('.bg-source-btn').forEach(b => b.classList.toggle('active', b.dataset.source === 'original'));
            document.getElementById('bg-upload-container').style.display = 'none';
            document.getElementById('bg-ai-container').style.display = 'none';
            document.getElementById('bg-generate-container').style.display = 'none';
            document.getElementById('font-size-slider').value = 100;
            document.getElementById('font-size-val').innerText = '100%';
            document.getElementById('text-color-picker').value = '#ffffff';
            
            document.getElementById('image-options-modal').style.display = 'flex';
            lucide.createIcons();
            updateImagePreview();
        };

        window.closeImageModal = function() {
            document.getElementById('image-options-modal').style.display = 'none';
        };

        window.setBgSource = function(source) {
            currentBgSource = source;
            document.querySelectorAll('.bg-source-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.source === source);
            });
            document.getElementById('bg-upload-container').style.display = source === 'upload' ? 'block' : 'none';
            document.getElementById('bg-ai-container').style.display = source === 'ai' ? 'block' : 'none';
            document.getElementById('bg-generate-container').style.display = source === 'generate' ? 'block' : 'none';
            updateImagePreview();
        };

        window.handleLocalBgUpload = function(input) {
            if (input.files && input.files[0]) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    uploadedBgUrl = e.target.result;
                    updateImagePreview();
                };
                reader.readAsDataURL(input.files[0]);
            }
        };

        window.generateAiBg = async function() {
            const prompt = document.getElementById('bg-ai-prompt').value.trim();
            if (!prompt) {
                showToast("Please enter a description for the AI to search.", 'error');
                return;
            }
            
            const btn = event.currentTarget;
            const originalHtml = btn.innerHTML;
            btn.innerHTML = '<i data-lucide="loader-2" class="lucide-spin" style="width: 16px; height: 16px;"></i>';
            btn.disabled = true;
            lucide.createIcons();

            try {
                const apiKey = localStorage.getItem('cc_pexels');
                if (!apiKey) {
                    showToast("Please add your Pexels API key in Settings to use AI Search.", 'error');
                    return;
                }

                const res = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(prompt)}&per_page=1`, {
                    headers: { Authorization: apiKey }
                });
                const data = await res.json();
                if (data.photos && data.photos.length > 0) {
                    aiBgUrl = data.photos[0].src.large;
                    updateImagePreview();
                } else {
                    showToast("No images found for that prompt.", 'error');
                }
            } catch (e) {
                showToast("Failed to fetch AI background.", 'error');
            } finally {
                btn.innerHTML = originalHtml;
                btn.disabled = false;
                lucide.createIcons();
            }
        };

        window.generateAiImage = async function() {
            const prompt = document.getElementById('bg-generate-prompt').value.trim();
            if (!prompt) {
                showToast("Please enter a description for the AI to generate.", 'error');
                return;
            }
            
            const btn = event.currentTarget;
            const originalHtml = btn.innerHTML;
            btn.innerHTML = '<i data-lucide="loader-2" class="lucide-spin" style="width: 16px; height: 16px;"></i>';
            btn.disabled = true;
            lucide.createIcons();

            try {
                let ratio = "9:16";
                if (currentImageLayout === 'square') ratio = "1:1";
                if (currentImageLayout === 'landscape') ratio = "16:9";

                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash-image',
                    contents: {
                        parts: [{ text: prompt }]
                    },
                    config: {
                        imageConfig: {
                            aspectRatio: ratio
                        }
                    }
                });

                for (const part of response.candidates[0].content.parts) {
                    if (part.inlineData) {
                        generatedBgUrl = `data:image/png;base64,${part.inlineData.data}`;
                        updateImagePreview();
                        break;
                    }
                }
            } catch (e) {
                handleAiError(e, "Please try again.");
            } finally {
                btn.innerHTML = originalHtml;
                btn.disabled = false;
                lucide.createIcons();
            }
        };

        window.updateFontSize = function(val) {
            currentFontSize = parseInt(val);
            document.getElementById('font-size-val').innerText = val + '%';
            updateImagePreview();
        };

        window.updateTextColor = function(val) {
            currentTextColor = val;
            updateImagePreview();
        };

        window.setImageLayout = function(layout) {
            currentImageLayout = layout;
            document.querySelectorAll('.layout-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.layout === layout);
            });
            updateImagePreview();
        };

        window.setTextAlign = function(align) {
            currentTextAlign = align;
            document.querySelectorAll('.align-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.align === align);
            });
            updateImagePreview();
        }

        window.setTextVAlign = function(valign) {
            currentTextVAlign = valign;
            document.querySelectorAll('.valign-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.valign === valign);
            });
            updateImagePreview();
        };

        async function updateImagePreview() {
            if (!pendingImageExport) return;
            const canvas = document.getElementById('image-preview-canvas');
            
            // Set dimensions based on layout
            if (currentImageLayout === 'portrait') {
                canvas.width = 1080;
                canvas.height = 1920;
            } else if (currentImageLayout === 'square') {
                canvas.width = 1080;
                canvas.height = 1080;
            } else if (currentImageLayout === 'landscape') {
                canvas.width = 1920;
                canvas.height = 1080;
            }

            const ctx = canvas.getContext('2d');
            await renderQuoteToCanvas(ctx, canvas.width, canvas.height, pendingImageExport, currentTextAlign, currentTextVAlign);
        }

        async function renderQuoteToCanvas(ctx, width, height, data, align, valign) {
            let bgToUse = data.bgUrl;
            if (currentBgSource === 'upload' && uploadedBgUrl) bgToUse = uploadedBgUrl;
            if (currentBgSource === 'ai' && aiBgUrl) bgToUse = aiBgUrl;
            if (currentBgSource === 'generate' && generatedBgUrl) bgToUse = generatedBgUrl;

            // Draw Background
            if (bgToUse) {
                try {
                    const img = new Image();
                    img.crossOrigin = "anonymous";
                    await new Promise((resolve, reject) => {
                        img.onload = resolve;
                        img.onerror = reject;
                        img.src = bgToUse;
                    });
                    
                    const imgRatio = img.width / img.height;
                    const canvasRatio = width / height;
                    let drawW, drawH;
                    if (canvasRatio > imgRatio) {
                        drawW = width;
                        drawH = width / imgRatio;
                    } else {
                        drawH = height;
                        drawW = height * imgRatio;
                    }
                    const drawX = (width - drawW) / 2;
                    const drawY = (height - drawH) / 2;
                    
                    ctx.drawImage(img, drawX, drawY, drawW, drawH);
                    
                    // Dark Overlay
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                    ctx.fillRect(0, 0, width, height);
                } catch (e) {
                    ctx.fillStyle = data.bgColor || '#1a1a2e';
                    ctx.fillRect(0, 0, width, height);
                }
            } else {
                ctx.fillStyle = data.bgColor || '#1a1a2e';
                ctx.fillRect(0, 0, width, height);
            }

            // Draw Text
            ctx.fillStyle = currentTextColor;
            ctx.textAlign = align;
            ctx.textBaseline = 'middle';
            
            const baseFontSize = width * 0.06;
            const fontSize = baseFontSize * (currentFontSize / 100);
            ctx.font = `bold ${fontSize}px "Space Grotesk", sans-serif`;
            const maxWidth = width * 0.8;
            
            const words = `"${data.text}"`.split(' ');
            let lines = [];
            let currentLine = words[0];

            for (let i = 1; i < words.length; i++) {
                const word = words[i];
                const width = ctx.measureText(currentLine + " " + word).width;
                if (width < maxWidth) {
                    currentLine += " " + word;
                } else {
                    lines.push(currentLine);
                    currentLine = word;
                }
            }
            lines.push(currentLine);

            const lineHeight = fontSize * 1.4;
            const totalTextHeight = lines.length * lineHeight;
            let startY = (height - totalTextHeight) / 2;
            if (valign === 'top') startY = height * 0.15;
            if (valign === 'bottom') startY = height * 0.85 - totalTextHeight;
            
            let startX = width / 2;
            if (align === 'left') startX = width * 0.1;
            if (align === 'right') startX = width * 0.9;

            lines.forEach(line => {
                ctx.fillText(line, startX, startY);
                startY += lineHeight;
            });

            // Draw Author
            ctx.font = `${fontSize * 0.6}px "Space Grotesk", sans-serif`;
            ctx.fillStyle = currentTextColor;
            ctx.globalAlpha = 0.8;
            ctx.fillText(`— ${data.author}`, startX, startY + fontSize);
            ctx.globalAlpha = 1.0;
        }

        window.downloadImage = async function() {
            if (!pendingImageExport) return;
            
            const btn = document.getElementById('confirm-image-export-btn');
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i data-lucide="loader-2" class="lucide-spin" style="width: 18px; height: 18px; margin-right: 8px;"></i> Generating...';
            btn.disabled = true;
            lucide.createIcons();

            const resVal = parseInt(document.getElementById('image-export-res').value) || 1080;
            const scale = resVal / 1080;

            const canvas = document.createElement('canvas');
            if (currentImageLayout === 'portrait') {
                canvas.width = 1080 * scale;
                canvas.height = 1920 * scale;
            } else if (currentImageLayout === 'square') {
                canvas.width = 1080 * scale;
                canvas.height = 1080 * scale;
            } else if (currentImageLayout === 'landscape') {
                canvas.width = 1920 * scale;
                canvas.height = 1080 * scale;
            }

            const ctx = canvas.getContext('2d');
            await renderQuoteToCanvas(ctx, canvas.width, canvas.height, pendingImageExport, currentTextAlign, currentTextVAlign);
            
            canvas.toBlob((blob) => {
                if (!blob) {
                    showToast('Failed to generate image.', 'error');
                    btn.innerHTML = originalText;
                    btn.disabled = false;
                    return;
                }
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.download = `coldcash_quote_${Date.now()}.jpg`;
                link.href = url;
                link.target = '_blank'; // Helps on some mobile browsers
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);

                btn.innerHTML = originalText;
                btn.disabled = false;
                lucide.createIcons();
                closeImageModal();
            }, 'image/jpeg', 0.9);
        };

        window.startVideoExport = async function(btn, text, author) {
            const card = btn.closest('.quote-card');
            const bgImage = card.style.backgroundImage;
            const bgColor = card.style.backgroundColor;
            
            let bgUrl = null;
            if (bgImage && bgImage.includes('url(')) {
                const match = bgImage.match(/url\(['"]?(.*?)['"]?\)/);
                if (match && match[1]) {
                    bgUrl = match[1];
                }
            }
            
            pendingVideoExport = { text, author, bgUrl, bgColor };
            loadVideoPresets();
            document.getElementById('video-options-modal').style.display = 'flex';
            document.getElementById('video-preview-canvas').style.display = 'none';
        };

        let previewAnimFrame = null;
        let previewAudioCtx = null;
        let previewBgImg = null;

        window.handleVideoBgUpload = function(input) {
            if (input.files && input.files[0]) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    if (pendingVideoExport) {
                        pendingVideoExport.bgUrl = e.target.result;
                        if (document.getElementById('video-preview-canvas').style.display !== 'none') {
                            startVideoPreview();
                        }
                    }
                };
                reader.readAsDataURL(input.files[0]);
            }
        };

        window.closeVideoModal = function() {
            document.getElementById('video-options-modal').style.display = 'none';
            stopVideoPreview();
        };

        function stopVideoPreview() {
            if (previewAnimFrame) {
                cancelAnimationFrame(previewAnimFrame);
                previewAnimFrame = null;
            }
            if (previewAudioCtx) {
                previewAudioCtx.close();
                previewAudioCtx = null;
            }
            document.getElementById('video-preview-canvas').style.display = 'none';
        }

        function getSelectedVideoDuration() {
            const val = document.getElementById('video-duration').value;
            if (val === 'custom') {
                return parseInt(document.getElementById('video-custom-duration').value, 10) || 15;
            }
            return parseInt(val, 10) || 5;
        }

        window.startVideoPreview = async function() {
            stopVideoPreview();
            if (!pendingVideoExport) return;

            const canvas = document.getElementById('video-preview-canvas');
            canvas.style.display = 'block';
            const ctx = canvas.getContext('2d');
            
            const animStyle = document.getElementById('video-anim-style').value;
            const musicStyle = document.getElementById('video-music-style').value;
            const duration = getSelectedVideoDuration();
            
            const quoteText = pendingVideoExport.text;
            const author = pendingVideoExport.author;
            const bgUrl = pendingVideoExport.bgUrl;
            const bgColor = pendingVideoExport.bgColor;

            if (bgUrl && (!previewBgImg || previewBgImg.src !== bgUrl)) {
                previewBgImg = new Image();
                previewBgImg.crossOrigin = "anonymous";
                try {
                    await new Promise((resolve, reject) => {
                        previewBgImg.onload = resolve;
                        previewBgImg.onerror = reject;
                        previewBgImg.src = bgUrl;
                    });
                } catch (e) {
                    previewBgImg = null;
                }
            }

            // Audio Preview
            previewAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const masterGain = previewAudioCtx.createGain();
            masterGain.connect(previewAudioCtx.destination);

            if (musicStyle === 'ambient') {
                masterGain.gain.setValueAtTime(0, previewAudioCtx.currentTime);
                masterGain.gain.linearRampToValueAtTime(0.2, previewAudioCtx.currentTime + 2);
                masterGain.gain.setValueAtTime(0.2, previewAudioCtx.currentTime + duration - 1);
                masterGain.gain.linearRampToValueAtTime(0, previewAudioCtx.currentTime + duration);

                const frequencies = [220.00, 261.63, 329.63, 415.30];
                frequencies.forEach(freq => {
                    const osc = previewAudioCtx.createOscillator();
                    osc.type = 'sine';
                    osc.frequency.value = freq;
                    const lfo = previewAudioCtx.createOscillator();
                    lfo.type = 'sine';
                    lfo.frequency.value = 0.2 + Math.random() * 0.5;
                    const lfoGain = previewAudioCtx.createGain();
                    lfoGain.gain.value = 2;
                    lfo.connect(lfoGain);
                    lfoGain.connect(osc.detune);
                    lfo.start();
                    osc.connect(masterGain);
                    osc.start();
                    osc.stop(previewAudioCtx.currentTime + duration + 0.5);
                });
            } else if (musicStyle === 'lofi') {
                masterGain.gain.setValueAtTime(0.15, previewAudioCtx.currentTime);
                masterGain.gain.linearRampToValueAtTime(0, previewAudioCtx.currentTime + duration);
                for (let i = 0; i < duration * 2; i++) {
                    const time = previewAudioCtx.currentTime + i * 0.5;
                    if (time > previewAudioCtx.currentTime + duration + 0.5) break;
                    if (i % 2 === 0) {
                        const kick = previewAudioCtx.createOscillator();
                        const kickGain = previewAudioCtx.createGain();
                        kick.frequency.setValueAtTime(150, time);
                        kick.frequency.exponentialRampToValueAtTime(0.01, time + 0.1);
                        kickGain.gain.setValueAtTime(1, time);
                        kickGain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
                        kick.connect(kickGain);
                        kickGain.connect(masterGain);
                        kick.start(time);
                        kick.stop(time + 0.1);
                    }
                    const bufferSize = previewAudioCtx.sampleRate * 0.05;
                    const buffer = previewAudioCtx.createBuffer(1, bufferSize, previewAudioCtx.sampleRate);
                    const data = buffer.getChannelData(0);
                    for (let j = 0; j < bufferSize; j++) data[j] = Math.random() * 2 - 1;
                    const noise = previewAudioCtx.createBufferSource();
                    noise.buffer = buffer;
                    const noiseFilter = previewAudioCtx.createBiquadFilter();
                    noiseFilter.type = 'highpass';
                    noiseFilter.frequency.value = 5000;
                    const noiseGain = previewAudioCtx.createGain();
                    noiseGain.gain.setValueAtTime(0.3, time);
                    noiseGain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);
                    noise.connect(noiseFilter);
                    noiseFilter.connect(noiseGain);
                    noiseGain.connect(masterGain);
                    noise.start(time);
                }
                const chordFreqs = [196.00, 246.94, 293.66, 369.99];
                chordFreqs.forEach(freq => {
                    const osc = previewAudioCtx.createOscillator();
                    osc.type = 'triangle';
                    osc.frequency.value = freq;
                    const filter = previewAudioCtx.createBiquadFilter();
                    filter.type = 'lowpass';
                    filter.frequency.value = 800;
                    osc.connect(filter);
                    filter.connect(masterGain);
                    osc.start();
                    osc.stop(previewAudioCtx.currentTime + duration + 0.5);
                });
            } else if (musicStyle === 'synthwave') {
                masterGain.gain.setValueAtTime(0.15, previewAudioCtx.currentTime);
                masterGain.gain.linearRampToValueAtTime(0, previewAudioCtx.currentTime + duration);
                const notes = [220.00, 261.63, 329.63, 440.00];
                for (let i = 0; i < duration * 4; i++) {
                    const time = previewAudioCtx.currentTime + i * 0.25;
                    if (time > previewAudioCtx.currentTime + duration + 0.5) break;
                    const osc = previewAudioCtx.createOscillator();
                    osc.type = 'sawtooth';
                    osc.frequency.value = notes[i % notes.length];
                    const filter = previewAudioCtx.createBiquadFilter();
                    filter.type = 'lowpass';
                    filter.frequency.setValueAtTime(2000, time);
                    filter.frequency.exponentialRampToValueAtTime(100, time + 0.2);
                    const noteGain = previewAudioCtx.createGain();
                    noteGain.gain.setValueAtTime(0.5, time);
                    noteGain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
                    osc.connect(filter);
                    filter.connect(noteGain);
                    noteGain.connect(masterGain);
                    osc.start(time);
                    osc.stop(time + 0.2);
                }
                const bass = previewAudioCtx.createOscillator();
                bass.type = 'square';
                bass.frequency.value = 55.00;
                const bassFilter = previewAudioCtx.createBiquadFilter();
                bassFilter.type = 'lowpass';
                bassFilter.frequency.value = 400;
                bass.connect(bassFilter);
                bassFilter.connect(masterGain);
                bass.start();
                bass.stop(previewAudioCtx.currentTime + duration + 0.5);
            } else if (musicStyle === 'phonk') {
                masterGain.gain.setValueAtTime(0.2, previewAudioCtx.currentTime);
                masterGain.gain.linearRampToValueAtTime(0, previewAudioCtx.currentTime + duration);
                const bass = previewAudioCtx.createOscillator();
                bass.type = 'sawtooth';
                bass.frequency.value = 40;
                const distortion = previewAudioCtx.createWaveShaper();
                const curve = new Float32Array(400);
                for (let i = 0; i < 400; i++) {
                    const x = i * 2 / 400 - 1;
                    curve[i] = (3 + 20) * x * 20 * (Math.PI / 180) / (Math.PI + 20 * Math.abs(x));
                }
                distortion.curve = curve;
                distortion.oversample = '4x';
                const bassFilter = previewAudioCtx.createBiquadFilter();
                bassFilter.type = 'lowpass';
                bassFilter.frequency.value = 800;
                bass.connect(distortion);
                distortion.connect(bassFilter);
                bassFilter.connect(masterGain);
                bass.start();
                bass.stop(previewAudioCtx.currentTime + duration + 0.5);
                for (let i = 0; i < duration * 4; i++) {
                    const time = previewAudioCtx.currentTime + i * 0.25;
                    if (time > previewAudioCtx.currentTime + duration + 0.5) break;
                    if (i % 4 === 0 || i % 4 === 3) {
                        const osc = previewAudioCtx.createOscillator();
                        osc.type = 'square';
                        osc.frequency.value = 800 + Math.random() * 200;
                        const noteGain = previewAudioCtx.createGain();
                        noteGain.gain.setValueAtTime(0.3, time);
                        noteGain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
                        osc.connect(noteGain);
                        noteGain.connect(masterGain);
                        osc.start(time);
                        osc.stop(time + 0.1);
                    }
                }
            } else if (musicStyle === 'cinematic') {
                masterGain.gain.setValueAtTime(0, previewAudioCtx.currentTime);
                masterGain.gain.linearRampToValueAtTime(0.3, previewAudioCtx.currentTime + 2);
                masterGain.gain.setValueAtTime(0.3, previewAudioCtx.currentTime + duration - 2);
                masterGain.gain.linearRampToValueAtTime(0, previewAudioCtx.currentTime + duration);
                const boom = previewAudioCtx.createOscillator();
                boom.type = 'sine';
                boom.frequency.setValueAtTime(60, previewAudioCtx.currentTime);
                boom.frequency.exponentialRampToValueAtTime(20, previewAudioCtx.currentTime + 2);
                const boomGain = previewAudioCtx.createGain();
                boomGain.gain.setValueAtTime(1, previewAudioCtx.currentTime);
                boomGain.gain.exponentialRampToValueAtTime(0.01, previewAudioCtx.currentTime + 3);
                boom.connect(boomGain);
                boomGain.connect(masterGain);
                boom.start();
                boom.stop(previewAudioCtx.currentTime + Math.min(3, duration));
                const freqs = [880, 890, 900];
                freqs.forEach(freq => {
                    const osc = previewAudioCtx.createOscillator();
                    osc.type = 'sawtooth';
                    osc.frequency.value = freq;
                    const filter = previewAudioCtx.createBiquadFilter();
                    filter.type = 'bandpass';
                    filter.frequency.value = 1000;
                    osc.connect(filter);
                    filter.connect(masterGain);
                    osc.start();
                    osc.stop(previewAudioCtx.currentTime + duration + 0.5);
                });
            } else if (musicStyle === 'internet') {
                const url = document.getElementById('selected-internet-audio-url').value;
                if (url) {
                    try {
                        const response = await fetch(url);
                        const arrayBuffer = await response.arrayBuffer();
                        const audioBuffer = await previewAudioCtx.decodeAudioData(arrayBuffer);
                        const source = previewAudioCtx.createBufferSource();
                        source.buffer = audioBuffer;
                        masterGain.gain.setValueAtTime(0, previewAudioCtx.currentTime);
                        masterGain.gain.linearRampToValueAtTime(1, previewAudioCtx.currentTime + 1);
                        masterGain.gain.setValueAtTime(1, previewAudioCtx.currentTime + duration - 1);
                        masterGain.gain.linearRampToValueAtTime(0, previewAudioCtx.currentTime + duration);
                        source.connect(masterGain);
                        source.start();
                        source.stop(previewAudioCtx.currentTime + duration + 0.5);
                    } catch (e) {
                        console.error("Failed to load internet audio", e);
                    }
                }
            }

            // Animation Loop
            let frame = 0;
            const totalFrames = 30 * duration;
            const logicalWidth = 1080;
            const logicalHeight = 1920;
            const scaleFactor = canvas.width / logicalWidth;

            function drawPreview() {
                if (frame > totalFrames) {
                    frame = 0; // Loop preview
                }

                const progress = frame / totalFrames;

                ctx.save();
                ctx.scale(scaleFactor, scaleFactor);

                // Draw BG
                if (previewBgImg) {
                    const scale = 1 + progress * 0.15;
                    const w = logicalWidth * scale;
                    const h = logicalHeight * scale;
                    
                    ctx.fillStyle = '#000';
                    ctx.fillRect(0, 0, logicalWidth, logicalHeight);
                    
                    const imgRatio = previewBgImg.width / previewBgImg.height;
                    const canvasRatio = logicalWidth / logicalHeight;
                    let drawW, drawH;
                    if (canvasRatio > imgRatio) {
                        drawW = w;
                        drawH = w / imgRatio;
                    } else {
                        drawH = h;
                        drawW = h * imgRatio;
                    }
                    const drawX = (logicalWidth - drawW) / 2;
                    const drawY = (logicalHeight - drawH) / 2;
                    
                    ctx.globalAlpha = 0.6;
                    ctx.drawImage(previewBgImg, drawX, drawY, drawW, drawH);
                    ctx.globalAlpha = 1.0;
                } else {
                    ctx.fillStyle = bgColor || '#1a1a2e';
                    ctx.fillRect(0, 0, logicalWidth, logicalHeight);
                }

                // Text Animation
                let textAlpha = 1;
                let yOffset = 0;
                let textScale = 1;
                let charsToShow = 9999;

                if (animStyle === 'fade-up') {
                    textAlpha = Math.min(1, frame / 30);
                    yOffset = Math.max(0, 50 - (frame * 1.5));
                } else if (animStyle === 'typewriter') {
                    charsToShow = frame * 2;
                } else if (animStyle === 'pop-in') {
                    if (frame < 15) {
                        textScale = Math.min(1, frame / 10);
                        if (frame > 10) textScale = 1 + (15 - frame) * 0.02;
                    }
                }

                ctx.save();
                ctx.translate(logicalWidth / 2, logicalHeight / 2);
                ctx.scale(textScale, textScale);
                ctx.translate(-logicalWidth / 2, -logicalHeight / 2);

                ctx.fillStyle = `rgba(255, 255, 255, ${textAlpha})`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                
                const fontSize = 60;
                ctx.font = `bold ${fontSize}px "Space Grotesk", sans-serif`;
                const maxWidth = 800;
                
                let textToRender = quoteText;
                if (animStyle === 'typewriter') textToRender = quoteText.substring(0, charsToShow);

                const words = `"${textToRender}"`.split(' ');
                let lines = [];
                let currentLine = words[0] || '';

                for (let i = 1; i < words.length; i++) {
                    const word = words[i];
                    const width = ctx.measureText(currentLine + " " + word).width;
                    if (width < maxWidth) {
                        currentLine += " " + word;
                    } else {
                        lines.push(currentLine);
                        currentLine = word;
                    }
                }
                if (currentLine) lines.push(currentLine);

                const lineHeight = fontSize * 1.5;
                const totalTextHeight = lines.length * lineHeight;
                let startY = (logicalHeight - totalTextHeight) / 2 - 50 + yOffset;

                lines.forEach(line => {
                    ctx.fillText(line, logicalWidth / 2, startY);
                    startY += lineHeight;
                });

                let authorAlpha = 1;
                if (animStyle === 'fade-up') {
                    authorAlpha = Math.max(0, Math.min(1, (frame - 15) / 30));
                } else if (animStyle === 'typewriter') {
                    authorAlpha = charsToShow > quoteText.length + 10 ? 1 : 0;
                } else if (animStyle === 'pop-in') {
                    authorAlpha = frame > 20 ? 1 : 0;
                }

                ctx.font = `40px "Space Grotesk", sans-serif`;
                ctx.fillStyle = `rgba(255, 255, 255, ${authorAlpha * 0.8})`;
                ctx.fillText(`— ${author}`, logicalWidth / 2, startY + 40 + (lines.length * 20));

                ctx.restore();
                ctx.restore();

                frame++;
                previewAnimFrame = requestAnimationFrame(drawPreview);
            }

            if (previewAudioCtx.state === 'suspended') {
                previewAudioCtx.resume().then(() => drawPreview());
            } else {
                drawPreview();
            }
        };

        document.getElementById('confirm-export-btn').addEventListener('click', async () => {
            if (!pendingVideoExport) return;
            stopVideoPreview();
            document.getElementById('video-options-modal').style.display = 'none';
            const animStyle = document.getElementById('video-anim-style').value;
            const musicStyle = document.getElementById('video-music-style').value;
            const duration = getSelectedVideoDuration();
            
            await exportVideo(pendingVideoExport.text, pendingVideoExport.author, pendingVideoExport.bgUrl, pendingVideoExport.bgColor, animStyle, musicStyle, duration);
            pendingVideoExport = null;
        });

        async function exportVideo(quoteText, author, bgUrl, bgColor, animStyle = 'fade-up', musicStyle = 'ambient', duration = 5) {
            const loader = document.getElementById('video-loader-modal');
            const progressBar = document.getElementById('video-progress');
            loader.style.display = 'flex';
            progressBar.style.width = '0%';

            const canvas = document.createElement('canvas');
            canvas.width = 1080;
            canvas.height = 1920;
            const ctx = canvas.getContext('2d');

            let bgImg = null;
            if (bgUrl) {
                bgImg = new Image();
                bgImg.crossOrigin = "anonymous";
                try {
                    await new Promise((resolve, reject) => {
                        bgImg.onload = resolve;
                        bgImg.onerror = reject;
                        bgImg.src = bgUrl;
                    });
                } catch (e) {
                    console.error("Failed to load background image for video. Falling back to color.");
                    bgImg = null;
                }
            }

            const videoStream = canvas.captureStream(30);
            const videoTrack = videoStream.getVideoTracks()[0];
            
            // --- AUDIO GENERATION ---
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const dest = audioCtx.createMediaStreamDestination();
            const masterGain = audioCtx.createGain();
            masterGain.connect(dest);

            if (musicStyle === 'ambient') {
                masterGain.gain.setValueAtTime(0, audioCtx.currentTime);
                masterGain.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + 2);
                masterGain.gain.setValueAtTime(0.2, audioCtx.currentTime + duration - 1);
                masterGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + duration);

                const frequencies = [220.00, 261.63, 329.63, 415.30]; // A3, C4, E4, G#4
                frequencies.forEach(freq => {
                    const osc = audioCtx.createOscillator();
                    osc.type = 'sine';
                    osc.frequency.value = freq;
                    
                    const lfo = audioCtx.createOscillator();
                    lfo.type = 'sine';
                    lfo.frequency.value = 0.2 + Math.random() * 0.5;
                    const lfoGain = audioCtx.createGain();
                    lfoGain.gain.value = 2;
                    lfo.connect(lfoGain);
                    lfoGain.connect(osc.detune);
                    lfo.start();

                    osc.connect(masterGain);
                    osc.start();
                    osc.stop(audioCtx.currentTime + duration + 0.5);
                });
            } else if (musicStyle === 'lofi') {
                masterGain.gain.setValueAtTime(0.15, audioCtx.currentTime);
                masterGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + duration);
                
                // Simple lo-fi beat simulation (kick and hi-hat)
                for (let i = 0; i < duration * 2; i++) {
                    const time = audioCtx.currentTime + i * 0.5;
                    if (time > audioCtx.currentTime + duration + 0.5) break;
                    
                    // Kick
                    if (i % 2 === 0) {
                        const kick = audioCtx.createOscillator();
                        const kickGain = audioCtx.createGain();
                        kick.frequency.setValueAtTime(150, time);
                        kick.frequency.exponentialRampToValueAtTime(0.01, time + 0.1);
                        kickGain.gain.setValueAtTime(1, time);
                        kickGain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
                        kick.connect(kickGain);
                        kickGain.connect(masterGain);
                        kick.start(time);
                        kick.stop(time + 0.1);
                    }
                    
                    // Hi-hat (noise)
                    const bufferSize = audioCtx.sampleRate * 0.05;
                    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
                    const data = buffer.getChannelData(0);
                    for (let j = 0; j < bufferSize; j++) {
                        data[j] = Math.random() * 2 - 1;
                    }
                    const noise = audioCtx.createBufferSource();
                    noise.buffer = buffer;
                    const noiseFilter = audioCtx.createBiquadFilter();
                    noiseFilter.type = 'highpass';
                    noiseFilter.frequency.value = 5000;
                    const noiseGain = audioCtx.createGain();
                    noiseGain.gain.setValueAtTime(0.3, time);
                    noiseGain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);
                    noise.connect(noiseFilter);
                    noiseFilter.connect(noiseGain);
                    noiseGain.connect(masterGain);
                    noise.start(time);
                }
                
                // Lo-fi chords
                const chordFreqs = [196.00, 246.94, 293.66, 369.99]; // Gmaj7
                chordFreqs.forEach(freq => {
                    const osc = audioCtx.createOscillator();
                    osc.type = 'triangle';
                    osc.frequency.value = freq;
                    
                    const filter = audioCtx.createBiquadFilter();
                    filter.type = 'lowpass';
                    filter.frequency.value = 800;
                    
                    osc.connect(filter);
                    filter.connect(masterGain);
                    osc.start();
                    osc.stop(audioCtx.currentTime + duration + 0.5);
                });
            } else if (musicStyle === 'synthwave') {
                masterGain.gain.setValueAtTime(0.15, audioCtx.currentTime);
                masterGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + duration);
                
                // Synthwave Arp
                const notes = [220.00, 261.63, 329.63, 440.00]; // A minor pentatonic
                for (let i = 0; i < duration * 4; i++) {
                    const time = audioCtx.currentTime + i * 0.25;
                    if (time > audioCtx.currentTime + duration + 0.5) break;
                    
                    const osc = audioCtx.createOscillator();
                    osc.type = 'sawtooth';
                    osc.frequency.value = notes[i % notes.length];
                    
                    const filter = audioCtx.createBiquadFilter();
                    filter.type = 'lowpass';
                    filter.frequency.setValueAtTime(2000, time);
                    filter.frequency.exponentialRampToValueAtTime(100, time + 0.2);
                    
                    const noteGain = audioCtx.createGain();
                    noteGain.gain.setValueAtTime(0.5, time);
                    noteGain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
                    
                    osc.connect(filter);
                    filter.connect(noteGain);
                    noteGain.connect(masterGain);
                    
                    osc.start(time);
                    osc.stop(time + 0.2);
                }
                
                // Bass pulse
                const bass = audioCtx.createOscillator();
                bass.type = 'square';
                bass.frequency.value = 55.00; // A1
                const bassFilter = audioCtx.createBiquadFilter();
                bassFilter.type = 'lowpass';
                bassFilter.frequency.value = 400;
                bass.connect(bassFilter);
                bassFilter.connect(masterGain);
                bass.start();
                bass.stop(audioCtx.currentTime + duration + 0.5);
            } else if (musicStyle === 'phonk') {
                masterGain.gain.setValueAtTime(0.2, audioCtx.currentTime);
                masterGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + duration);
                
                // Heavy distorted bass (808 style)
                const bass = audioCtx.createOscillator();
                bass.type = 'sawtooth';
                bass.frequency.value = 40; // Low E
                const distortion = audioCtx.createWaveShaper();
                const curve = new Float32Array(400);
                for (let i = 0; i < 400; i++) {
                    const x = i * 2 / 400 - 1;
                    curve[i] = (3 + 20) * x * 20 * (Math.PI / 180) / (Math.PI + 20 * Math.abs(x));
                }
                distortion.curve = curve;
                distortion.oversample = '4x';
                
                const bassFilter = audioCtx.createBiquadFilter();
                bassFilter.type = 'lowpass';
                bassFilter.frequency.value = 800;
                
                bass.connect(distortion);
                distortion.connect(bassFilter);
                bassFilter.connect(masterGain);
                bass.start();
                bass.stop(audioCtx.currentTime + duration + 0.5);

                // Cowbell melody (classic phonk)
                for (let i = 0; i < duration * 4; i++) {
                    const time = audioCtx.currentTime + i * 0.25;
                    if (time > audioCtx.currentTime + duration + 0.5) break;
                    
                    if (i % 4 === 0 || i % 4 === 3) {
                        const osc = audioCtx.createOscillator();
                        osc.type = 'square';
                        osc.frequency.value = 800 + Math.random() * 200;
                        
                        const noteGain = audioCtx.createGain();
                        noteGain.gain.setValueAtTime(0.3, time);
                        noteGain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
                        
                        osc.connect(noteGain);
                        noteGain.connect(masterGain);
                        osc.start(time);
                        osc.stop(time + 0.1);
                    }
                }
            } else if (musicStyle === 'cinematic') {
                masterGain.gain.setValueAtTime(0, audioCtx.currentTime);
                masterGain.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 2);
                masterGain.gain.setValueAtTime(0.3, audioCtx.currentTime + duration - 2);
                masterGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + duration);

                // Deep sub boom
                const boom = audioCtx.createOscillator();
                boom.type = 'sine';
                boom.frequency.setValueAtTime(60, audioCtx.currentTime);
                boom.frequency.exponentialRampToValueAtTime(20, audioCtx.currentTime + 2);
                const boomGain = audioCtx.createGain();
                boomGain.gain.setValueAtTime(1, audioCtx.currentTime);
                boomGain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 3);
                boom.connect(boomGain);
                boomGain.connect(masterGain);
                boom.start();
                boom.stop(audioCtx.currentTime + Math.min(3, duration));

                // High tension strings (cluster)
                const freqs = [880, 890, 900];
                freqs.forEach(freq => {
                    const osc = audioCtx.createOscillator();
                    osc.type = 'sawtooth';
                    osc.frequency.value = freq;
                    const filter = audioCtx.createBiquadFilter();
                    filter.type = 'bandpass';
                    filter.frequency.value = 1000;
                    osc.connect(filter);
                    filter.connect(masterGain);
                    osc.start();
                    osc.stop(audioCtx.currentTime + duration + 0.5);
                });
            } else if (musicStyle === 'internet') {
                const url = document.getElementById('selected-internet-audio-url').value;
                if (url) {
                    try {
                        const response = await fetch(url);
                        const arrayBuffer = await response.arrayBuffer();
                        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
                        
                        const source = audioCtx.createBufferSource();
                        source.buffer = audioBuffer;
                        
                        // Fade in and out
                        masterGain.gain.setValueAtTime(0, audioCtx.currentTime);
                        masterGain.gain.linearRampToValueAtTime(1, audioCtx.currentTime + 1);
                        masterGain.gain.setValueAtTime(1, audioCtx.currentTime + duration - 1);
                        masterGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + duration);
                        
                        source.connect(masterGain);
                        source.start();
                        source.stop(audioCtx.currentTime + duration + 0.5);
                    } catch (e) {
                        console.error("Failed to load internet audio", e);
                    }
                }
            }

            const audioTrack = dest.stream.getAudioTracks()[0];
            const combinedStream = new MediaStream([videoTrack, audioTrack]);

            let options;
            const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
            if (isSafari && MediaRecorder.isTypeSupported('video/mp4')) {
                options = { mimeType: 'video/mp4', videoBitsPerSecond: 5000000 };
            } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')) {
                options = { mimeType: 'video/webm;codecs=vp9,opus', videoBitsPerSecond: 5000000 };
            } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')) {
                options = { mimeType: 'video/webm;codecs=vp8,opus', videoBitsPerSecond: 5000000 };
            } else if (MediaRecorder.isTypeSupported('video/webm')) {
                options = { mimeType: 'video/webm', videoBitsPerSecond: 5000000 };
            } else {
                options = { videoBitsPerSecond: 5000000 };
            }
            
            const recorder = new MediaRecorder(combinedStream, options);
            const chunks = [];
            recorder.ondataavailable = e => {
                if (e.data && e.data.size > 0) {
                    chunks.push(e.data);
                }
            };
            recorder.onstop = () => {
                const actualMimeType = recorder.mimeType || options.mimeType || 'video/webm';
                const blob = new Blob(chunks, { type: actualMimeType });
                
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                const ext = actualMimeType.includes('mp4') ? 'mp4' : 'webm';
                a.download = `coldcash_reel_${Date.now()}.${ext}`;
                a.click();
                loader.style.display = 'none';
                audioCtx.close();
            };

            recorder.start(100); // Use timeslice to help with metadata

            let startTime = null;

            function draw(timestamp) {
                if (!timestamp) timestamp = performance.now();
                if (!startTime) startTime = timestamp;
                const elapsed = timestamp - startTime;
                const progress = Math.min(1, elapsed / (duration * 1000));

                progressBar.style.width = `${progress * 100}%`;
                const progressText = document.getElementById('video-progress-text');
                if (progressText) progressText.innerText = `${Math.round(progress * 100)}%`;

                if (elapsed >= duration * 1000) {
                    setTimeout(() => recorder.stop(), 500); // Small delay to ensure last frames are caught
                    return;
                }

                // Draw BG with Ken Burns zoom
                if (bgImg) {
                    const scale = 1 + progress * 0.15; // zoom in 15%
                    const w = canvas.width * scale;
                    const h = canvas.height * scale;
                    
                    ctx.fillStyle = '#000';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    
                    const imgRatio = bgImg.width / bgImg.height;
                    const canvasRatio = canvas.width / canvas.height;
                    let drawW, drawH;
                    if (canvasRatio > imgRatio) {
                        drawW = w;
                        drawH = w / imgRatio;
                    } else {
                        drawH = h;
                        drawW = h * imgRatio;
                    }
                    const drawX = (canvas.width - drawW) / 2;
                    const drawY = (canvas.height - drawH) / 2;
                    
                    ctx.globalAlpha = 0.6; // Darken for text readability
                    ctx.drawImage(bgImg, drawX, drawY, drawW, drawH);
                    ctx.globalAlpha = 1.0;
                } else {
                    ctx.fillStyle = bgColor || '#1a1a2e';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                }

                // --- TEXT ANIMATION ---
                let textAlpha = 1;
                let yOffset = 0;
                let textScale = 1;
                let charsToShow = 9999;

                if (animStyle === 'fade-up') {
                    textAlpha = Math.min(1, elapsed / 1000);
                    yOffset = Math.max(0, 50 - (elapsed / 20));
                } else if (animStyle === 'typewriter') {
                    const charsPerSecond = 60;
                    charsToShow = (elapsed / 1000) * charsPerSecond;
                } else if (animStyle === 'pop-in') {
                    if (elapsed < 500) {
                        textScale = Math.min(1, elapsed / 333);
                        // Overshoot
                        if (elapsed > 333) {
                            textScale = 1 + (500 - elapsed) * 0.0006;
                        }
                    }
                }

                ctx.save();
                ctx.translate(canvas.width / 2, canvas.height / 2);
                ctx.scale(textScale, textScale);
                ctx.translate(-canvas.width / 2, -canvas.height / 2);

                ctx.fillStyle = `rgba(255, 255, 255, ${textAlpha})`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                
                // Word wrap logic
                const fontSize = 60;
                ctx.font = `bold ${fontSize}px "Space Grotesk", sans-serif`;
                const maxWidth = 800;
                
                let textToRender = quoteText;
                if (animStyle === 'typewriter') {
                    textToRender = quoteText.substring(0, charsToShow);
                }

                const words = `"${textToRender}"`.split(' ');
                let lines = [];
                let currentLine = words[0] || '';

                for (let i = 1; i < words.length; i++) {
                    const word = words[i];
                    const width = ctx.measureText(currentLine + " " + word).width;
                    if (width < maxWidth) {
                        currentLine += " " + word;
                    } else {
                        lines.push(currentLine);
                        currentLine = word;
                    }
                }
                if (currentLine) lines.push(currentLine);

                const lineHeight = fontSize * 1.5;
                const totalTextHeight = lines.length * lineHeight;
                let startY = (canvas.height - totalTextHeight) / 2 - 50 + yOffset;

                lines.forEach(line => {
                    ctx.fillText(line, canvas.width / 2, startY);
                    startY += lineHeight;
                });

                // Draw Author
                let authorAlpha = 1;
                if (animStyle === 'fade-up') {
                    authorAlpha = Math.max(0, Math.min(1, (elapsed - 500) / 1000));
                } else if (animStyle === 'typewriter') {
                    authorAlpha = charsToShow > quoteText.length + 10 ? 1 : 0;
                } else if (animStyle === 'pop-in') {
                    authorAlpha = elapsed > 666 ? 1 : 0;
                }

                ctx.font = `40px "Space Grotesk", sans-serif`;
                ctx.fillStyle = `rgba(255, 255, 255, ${authorAlpha * 0.8})`;
                ctx.fillText(`— ${author}`, canvas.width / 2, startY + 40 + (lines.length * 20));

                ctx.restore();
                
                // Use setTimeout instead of requestAnimationFrame to prevent pausing when tab is inactive
                setTimeout(() => draw(), 1000 / 30);
            }

            // Resume AudioContext if suspended (browser policy)
            if (audioCtx.state === 'suspended') {
                audioCtx.resume().then(() => draw());
            } else {
                draw();
            }
        }

        // Add CSS animation for loader
        const style = document.createElement('style');
        style.innerHTML = `
            @keyframes spin { 100% { transform: rotate(360deg); } }
            @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.7; transform: scale(0.95); } }
            @keyframes rotateBg { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            @keyframes moveStripes { 0% { background-position: 0 0; } 100% { background-position: 1rem 0; } }
        `;
        document.head.appendChild(style);

        // --- CAROUSEL COVER BUILDER LOGIC ---
        const ccBackgrounds = [
            { id: 'solid-cream', type: 'solid', value: '#F5F5F0', text: '#111111' },
            { id: 'solid-slate', type: 'solid', value: '#708090', text: '#FFFFFF' },
            { id: 'solid-charcoal', type: 'solid', value: '#36454F', text: '#FFFFFF' },
            { id: 'solid-sage', type: 'solid', value: '#9DC183', text: '#111111' },
            { id: 'solid-blush', type: 'solid', value: '#F8C8DC', text: '#111111' },
            { id: 'grad-peach-gold', type: 'gradient', value: 'linear-gradient(135deg, #FFDAB9 0%, #FFD700 100%)', text: '#111111' },
            { id: 'grad-navy-violet', type: 'gradient', value: 'linear-gradient(135deg, #000080 0%, #8A2BE2 100%)', text: '#FFFFFF' },
            { id: 'texture-noise', type: 'texture', value: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22 opacity=%220.15%22/%3E%3C/svg%3E"), #E8E8E8', text: '#111111' },
            { id: 'texture-dot', type: 'texture', value: 'radial-gradient(#cccccc 1px, transparent 1px), #ffffff', bgSize: '10px 10px', text: '#111111' }
        ];

        let ccSlides = [
            { id: 1, title: 'Slide Title', number: '01 / 05', brand: '@yourhandle', bgId: 'solid-cream', bgOverlayOpacity: 0, titleFontSize: 32, titleColor: null, titleFontFamily: "'Inter', sans-serif", titleEffect: 'none', titleEffectColor: '#000000' }
        ];
        let ccCurrentSlideId = 1;
        let ccAspectRatio = '1:1';

        window.showToast = function(message, type = 'info') {
            let toastContainer = document.getElementById('toast-container');
            if (!toastContainer) {
                toastContainer = document.createElement('div');
                toastContainer.id = 'toast-container';
                toastContainer.style.position = 'fixed';
                toastContainer.style.bottom = '20px';
                toastContainer.style.right = '20px';
                toastContainer.style.zIndex = '9999';
                toastContainer.style.display = 'flex';
                toastContainer.style.flexDirection = 'column';
                toastContainer.style.gap = '10px';
                document.body.appendChild(toastContainer);
            }
            
            const toast = document.createElement('div');
            toast.style.background = type === 'error' ? '#ef4444' : 'var(--accent)';
            toast.style.color = '#fff';
            toast.style.padding = '12px 20px';
            toast.style.borderRadius = '8px';
            toast.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
            toast.style.fontFamily = "'Inter', sans-serif";
            toast.style.fontSize = '14px';
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(20px)';
            toast.style.transition = 'all 0.3s ease';
            toast.innerText = message;
            
            toastContainer.appendChild(toast);
            
            setTimeout(() => {
                toast.style.opacity = '1';
                toast.style.transform = 'translateY(0)';
            }, 10);
            
            setTimeout(() => {
                toast.style.opacity = '0';
                toast.style.transform = 'translateY(20px)';
                setTimeout(() => {
                    toast.remove();
                }, 300);
            }, 3000);
        };

        function handleAiError(e, fallbackMessage) {
            console.error(e);
            let isQuota = false;
            
            const msg = (e.message || "").toLowerCase();
            const status = e.status || (e.error && e.error.status) || "";
            const code = e.code || (e.error && e.error.code) || "";
            let str = String(e).toLowerCase();
            try {
                str += JSON.stringify(e).toLowerCase();
            } catch (err) {}
            
            if (msg.includes("429") || msg.includes("quota") || msg.includes("resource_exhausted") || 
                status === 429 || status === "RESOURCE_EXHAUSTED" || 
                code === 429 || str.includes("429") || str.includes("quota") || str.includes("resource_exhausted")) {
                isQuota = true;
            }
            
            if (isQuota) {
                window.showToast("AI quota exceeded. " + fallbackMessage, "error");
            } else {
                window.showToast("AI generation failed. " + fallbackMessage, "error");
            }
        }

        window.sendCarouselToBuilder = function() {
            try {
                console.log("sendCarouselToBuilder called", generatedCarouselSlides);
                if (!generatedCarouselSlides || generatedCarouselSlides.length === 0) {
                    showToast('No carousel script generated yet. Please generate one first.', 'error');
                    return;
                }

                // Get current styling from the first slide to carry over
                const baseSlide = ccSlides[0] || {
                    brand: '@yourhandle',
                    bgId: 'solid-cream',
                    bgOverlayOpacity: 0,
                    titleFontSize: 32,
                    titleColor: null,
                    titleFontFamily: "'Inter', sans-serif",
                    titleEffect: 'none',
                    titleEffectColor: '#000000'
                };

                ccSlides = generatedCarouselSlides.map((text, index) => {
                    return {
                        id: Date.now() + index,
                        title: text,
                        number: '', // updated below
                        brand: baseSlide.brand,
                        bgId: baseSlide.bgId,
                        bgOverlayOpacity: baseSlide.bgOverlayOpacity,
                        titleFontSize: baseSlide.titleFontSize,
                        titleColor: baseSlide.titleColor,
                        titleFontFamily: baseSlide.titleFontFamily,
                        titleEffect: baseSlide.titleEffect,
                        titleEffectColor: baseSlide.titleEffectColor
                    };
                });

                updateCcSlideNumbers();
                ccCurrentSlideId = ccSlides[0].id;
                
                // Switch to Carousel Covers tab
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                
                document.getElementById('nav-carousel-cover').classList.add('active');
                document.getElementById('carousel-cover').classList.add('active');

                updateCcPreview();
                renderCcSlideStrip();
                
                // Scroll to top
                window.scrollTo(0, 0);
                showToast('Carousel sent to builder successfully!');
            } catch (err) {
                console.error("Error in sendCarouselToBuilder:", err);
                showToast("Error: " + err.message, 'error');
            }
        }

        function renderCcBackgrounds() {
            const bgContainer = document.getElementById('cc-backgrounds');
            if (!bgContainer) return;
            bgContainer.innerHTML = '';
            ccBackgrounds.forEach((bg, idx) => {
                const btn = document.createElement('button');
                btn.className = 'cc-bg-btn';
                btn.style.width = '100%';
                btn.style.aspectRatio = '1/1';
                btn.style.borderRadius = '4px';
                btn.style.border = '2px solid transparent';
                btn.style.cursor = 'pointer';
                btn.style.background = bg.value;
                if (bg.bgSize) btn.style.backgroundSize = bg.bgSize;
                
                btn.onclick = () => {
                    const slide = ccSlides.find(s => s.id === ccCurrentSlideId);
                    if (slide) {
                        slide.bgId = bg.id;
                        updateCcPreview();
                        renderCcSlideStrip();
                    }
                };
                bgContainer.appendChild(btn);
            });
        }

        function initCarouselCoverBuilder() {
            renderCcBackgrounds();

            document.getElementById('cc-bg-overlay-slider').addEventListener('input', (e) => {
                const slide = ccSlides.find(s => s.id === ccCurrentSlideId);
                if (slide) {
                    slide.bgOverlayOpacity = parseInt(e.target.value);
                    document.getElementById('cc-bg-overlay-val').innerText = slide.bgOverlayOpacity + '%';
                    updateCcPreview();
                }
            });
            document.getElementById('cc-title-input').addEventListener('input', (e) => {
                const slide = ccSlides.find(s => s.id === ccCurrentSlideId);
                if (slide) { slide.title = e.target.value; updateCcPreview(); renderCcSlideStrip(); }
            });
            document.getElementById('cc-font-size-slider').addEventListener('input', (e) => {
                const slide = ccSlides.find(s => s.id === ccCurrentSlideId);
                if (slide) {
                    slide.titleFontSize = parseInt(e.target.value);
                    document.getElementById('cc-font-size-val').innerText = slide.titleFontSize + 'px';
                    updateCcPreview();
                }
            });
            document.getElementById('cc-text-color-picker').addEventListener('input', (e) => {
                const slide = ccSlides.find(s => s.id === ccCurrentSlideId);
                if (slide) {
                    slide.titleColor = e.target.value;
                    updateCcPreview();
                }
            });
            document.getElementById('cc-reset-color-btn').addEventListener('click', () => {
                const slide = ccSlides.find(s => s.id === ccCurrentSlideId);
                if (slide) {
                    slide.titleColor = null;
                    updateCcPreview();
                }
            });
            document.getElementById('cc-font-family-select').addEventListener('change', (e) => {
                const slide = ccSlides.find(s => s.id === ccCurrentSlideId);
                if (slide) {
                    slide.titleFontFamily = e.target.value;
                    updateCcPreview();
                }
            });
            document.getElementById('cc-text-effect-select').addEventListener('change', (e) => {
                const slide = ccSlides.find(s => s.id === ccCurrentSlideId);
                if (slide) {
                    slide.titleEffect = e.target.value;
                    updateCcPreview();
                }
            });
            document.getElementById('cc-effect-color-picker').addEventListener('input', (e) => {
                const slide = ccSlides.find(s => s.id === ccCurrentSlideId);
                if (slide) {
                    slide.titleEffectColor = e.target.value;
                    updateCcPreview();
                }
            });
            document.getElementById('cc-number-input').addEventListener('input', (e) => {
                const slide = ccSlides.find(s => s.id === ccCurrentSlideId);
                if (slide) { slide.number = e.target.value; updateCcPreview(); }
            });
            document.getElementById('cc-brand-input').addEventListener('input', (e) => {
                ccSlides.forEach(s => s.brand = e.target.value);
                updateCcPreview();
            });

            document.querySelectorAll('.cc-ratio-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    document.querySelectorAll('.cc-ratio-btn').forEach(b => b.classList.remove('active'));
                    e.target.classList.add('active');
                    ccAspectRatio = e.target.dataset.ratio;
                    document.getElementById('cc-preview-container').style.aspectRatio = ccAspectRatio === '1:1' ? '1/1' : '9/16';
                });
            });

            document.getElementById('cc-add-slide-btn').addEventListener('click', () => {
                if (ccSlides.length >= 10) { showToast('Maximum 10 slides allowed.', 'error'); return; }
                const newId = Date.now();
                const lastSlide = ccSlides[ccSlides.length - 1];
                ccSlides.push({
                    id: newId,
                    title: 'New Slide',
                    number: '', // will be updated below
                    brand: lastSlide ? lastSlide.brand : '@yourhandle',
                    bgId: lastSlide ? lastSlide.bgId : 'solid-cream',
                    bgOverlayOpacity: lastSlide ? lastSlide.bgOverlayOpacity : 0,
                    titleFontSize: lastSlide ? lastSlide.titleFontSize : 32,
                    titleColor: lastSlide ? lastSlide.titleColor : null,
                    titleFontFamily: lastSlide ? lastSlide.titleFontFamily : "'Inter', sans-serif",
                    titleEffect: lastSlide ? lastSlide.titleEffect : 'none',
                    titleEffectColor: lastSlide ? lastSlide.titleEffectColor : '#000000'
                });
                updateCcSlideNumbers();
                ccCurrentSlideId = newId;
                updateCcPreview();
                renderCcSlideStrip();
            });

            document.getElementById('cc-download-btn').addEventListener('click', async () => {
                const preview = document.getElementById('cc-preview-container');
                const btn = document.getElementById('cc-download-btn');
                const originalText = btn.innerHTML;
                btn.innerHTML = '<i data-lucide="loader-2" class="lucide-spin" style="width: 18px; height: 18px; margin-right: 8px; animation: spin 2s linear infinite;"></i> Rendering...';
                btn.disabled = true;

                try {
                    const resVal = parseInt(document.getElementById('cc-export-res').value) || 1080;
                    const scale = resVal / preview.offsetWidth;
                    
                    const canvas = await html2canvas(preview, { scale: scale, useCORS: true, backgroundColor: null });
                    canvas.toBlob((blob) => {
                        if (!blob) {
                            showToast('Failed to generate slide.', 'error');
                            return;
                        }
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.download = `carousel-slide-${ccCurrentSlideId}.png`;
                        link.href = url;
                        link.target = '_blank';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        URL.revokeObjectURL(url);
                    }, 'image/png');
                } catch (err) {
                    console.error('Error rendering slide:', err);
                    showToast('Failed to render slide.', 'error');
                } finally {
                    btn.innerHTML = originalText;
                    btn.disabled = false;
                    lucide.createIcons();
                }
            });

            updateCcPreview();
            renderCcSlideStrip();
        }

        function updateCcSlideNumbers() {
            const total = ccSlides.length;
            ccSlides.forEach((s, i) => {
                const numStr = (i + 1).toString().padStart(2, '0');
                const totalStr = total.toString().padStart(2, '0');
                s.number = `${numStr} / ${totalStr}`;
            });
        }

        function updateCcPreview() {
            const slide = ccSlides.find(s => s.id === ccCurrentSlideId);
            if (!slide) return;

            const bgDef = ccBackgrounds.find(b => b.id === slide.bgId) || ccBackgrounds[0];
            
            const previewBg = document.getElementById('cc-preview-bg');
            previewBg.style.background = bgDef.value;
            if (bgDef.bgSize) previewBg.style.backgroundSize = bgDef.bgSize;
            else previewBg.style.backgroundSize = 'auto';

            const overlay = document.getElementById('cc-preview-overlay');
            const opacity = slide.bgOverlayOpacity || 0;
            overlay.style.background = `rgba(0, 0, 0, ${opacity / 100})`;

            const titleEl = document.getElementById('cc-preview-title');
            titleEl.innerText = slide.title;
            titleEl.style.color = slide.titleColor || bgDef.text;
            titleEl.style.fontSize = (slide.titleFontSize || 32) + 'px';
            titleEl.style.fontFamily = slide.titleFontFamily || "'Inter', sans-serif";
            
            // Apply text effects
            titleEl.style.textShadow = 'none';
            titleEl.style.webkitTextStroke = '0';
            const effectColor = slide.titleEffectColor || '#000000';
            
            if (slide.titleEffect === 'shadow-subtle') {
                titleEl.style.textShadow = `2px 2px 4px ${effectColor}80`; // 80 is hex for 50% opacity
            } else if (slide.titleEffect === 'shadow-strong') {
                titleEl.style.textShadow = `4px 4px 0px ${effectColor}`;
            } else if (slide.titleEffect === 'glow') {
                titleEl.style.textShadow = `0 0 10px ${effectColor}, 0 0 20px ${effectColor}`;
            } else if (slide.titleEffect === 'outline') {
                titleEl.style.webkitTextStroke = `1px ${effectColor}`;
                // Fallback for outline using text-shadow if webkitTextStroke isn't fully supported
                titleEl.style.textShadow = `-1px -1px 0 ${effectColor}, 1px -1px 0 ${effectColor}, -1px 1px 0 ${effectColor}, 1px 1px 0 ${effectColor}`;
            }
            
            document.getElementById('cc-font-size-slider').value = slide.titleFontSize || 32;
            document.getElementById('cc-font-size-val').innerText = (slide.titleFontSize || 32) + 'px';
            document.getElementById('cc-text-color-picker').value = slide.titleColor || bgDef.text;
            document.getElementById('cc-font-family-select').value = slide.titleFontFamily || "'Inter', sans-serif";
            document.getElementById('cc-text-effect-select').value = slide.titleEffect || 'none';
            document.getElementById('cc-effect-color-picker').value = slide.titleEffectColor || '#000000';
            document.getElementById('cc-bg-overlay-slider').value = slide.bgOverlayOpacity || 0;
            document.getElementById('cc-bg-overlay-val').innerText = (slide.bgOverlayOpacity || 0) + '%';
            
            document.getElementById('cc-preview-number').innerText = slide.number;
            document.getElementById('cc-preview-number').style.color = bgDef.text;
            document.getElementById('cc-preview-number').style.display = slide.number ? 'block' : 'none';
            
            document.getElementById('cc-preview-brand').innerText = slide.brand;
            document.getElementById('cc-preview-brand').style.color = bgDef.text;
            document.getElementById('cc-preview-brand').style.display = slide.brand ? 'block' : 'none';

            document.getElementById('cc-title-input').value = slide.title;
            document.getElementById('cc-number-input').value = slide.number;
            document.getElementById('cc-brand-input').value = slide.brand;

            document.querySelectorAll('.cc-bg-btn').forEach((btn, idx) => {
                btn.style.borderColor = ccBackgrounds[idx].id === slide.bgId ? 'var(--accent)' : 'transparent';
            });
        }

        function renderCcSlideStrip() {
            const strip = document.getElementById('cc-slide-strip');
            strip.innerHTML = '';
            document.getElementById('cc-slide-count').innerText = ccSlides.length;

            ccSlides.forEach((slide, index) => {
                const bgDef = ccBackgrounds.find(b => b.id === slide.bgId) || ccBackgrounds[0];
                
                const thumb = document.createElement('div');
                thumb.style.width = '80px';
                thumb.style.height = '80px';
                thumb.style.flexShrink = '0';
                thumb.style.borderRadius = '4px';
                thumb.style.border = slide.id === ccCurrentSlideId ? '2px solid var(--accent)' : '2px solid var(--border)';
                thumb.style.background = bgDef.value;
                if (bgDef.bgSize) thumb.style.backgroundSize = bgDef.bgSize;
                thumb.style.cursor = 'pointer';
                thumb.style.position = 'relative';
                thumb.style.display = 'flex';
                thumb.style.alignItems = 'center';
                thumb.style.justifyContent = 'center';
                thumb.style.padding = '5px';
                thumb.style.overflow = 'hidden';
                
                const originalBorder = slide.id === ccCurrentSlideId ? '2px solid var(--accent)' : '2px solid var(--border)';
                thumb.draggable = true;
                thumb.dataset.index = index;

                thumb.addEventListener('dragstart', (e) => {
                    e.dataTransfer.setData('text/plain', index);
                    e.dataTransfer.effectAllowed = 'move';
                    thumb.style.opacity = '0.5';
                });

                thumb.addEventListener('dragend', (e) => {
                    thumb.style.opacity = '1';
                    document.querySelectorAll('#cc-slide-strip > div').forEach((el, i) => {
                        const s = ccSlides[i];
                        el.style.border = s && s.id === ccCurrentSlideId ? '2px solid var(--accent)' : '2px solid var(--border)';
                    });
                });

                thumb.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    const rect = thumb.getBoundingClientRect();
                    const mid = rect.left + rect.width / 2;
                    thumb.style.border = originalBorder;
                    if (e.clientX < mid) {
                        thumb.style.borderLeft = '4px solid var(--accent)';
                    } else {
                        thumb.style.borderRight = '4px solid var(--accent)';
                    }
                });

                thumb.addEventListener('dragleave', (e) => {
                    thumb.style.border = originalBorder;
                });

                thumb.addEventListener('drop', (e) => {
                    e.preventDefault();
                    thumb.style.border = originalBorder;
                    
                    const draggedIndexStr = e.dataTransfer.getData('text/plain');
                    if (!draggedIndexStr) return;
                    const draggedIndex = parseInt(draggedIndexStr, 10);
                    const targetIndex = index;
                    
                    if (draggedIndex === targetIndex) return;
                    
                    const rect = thumb.getBoundingClientRect();
                    const mid = rect.left + rect.width / 2;
                    let insertIndex = targetIndex;
                    if (e.clientX >= mid) {
                        insertIndex++;
                    }
                    
                    if (draggedIndex < insertIndex) {
                        insertIndex--;
                    }
                    
                    const [draggedSlide] = ccSlides.splice(draggedIndex, 1);
                    ccSlides.splice(insertIndex, 0, draggedSlide);
                    
                    const total = ccSlides.length;
                    ccSlides.forEach((s, i) => {
                        const numStr = (i + 1).toString().padStart(2, '0');
                        const totalStr = total.toString().padStart(2, '0');
                        s.number = `${numStr} / ${totalStr}`;
                    });
                    
                    updateCcPreview();
                    renderCcSlideStrip();
                });

                const overlay = document.createElement('div');
                overlay.style.position = 'absolute';
                overlay.style.top = '0';
                overlay.style.left = '0';
                overlay.style.right = '0';
                overlay.style.bottom = '0';
                const opacity = slide.bgOverlayOpacity || 0;
                overlay.style.background = `rgba(0, 0, 0, ${opacity / 100})`;
                overlay.style.pointerEvents = 'none';
                thumb.appendChild(overlay);

                const titlePreview = document.createElement('div');
                titlePreview.style.position = 'relative';
                titlePreview.style.zIndex = '1';
                titlePreview.style.fontSize = '8px';
                titlePreview.style.color = slide.titleColor || bgDef.text;
                titlePreview.style.textAlign = 'center';
                titlePreview.style.fontFamily = slide.titleFontFamily || "'Inter', sans-serif";
                titlePreview.style.fontWeight = '600';
                titlePreview.style.wordBreak = 'break-word';
                titlePreview.style.display = '-webkit-box';
                titlePreview.style.webkitLineClamp = '3';
                titlePreview.style.webkitBoxOrient = 'vertical';
                titlePreview.innerText = slide.title;
                thumb.appendChild(titlePreview);

                if (ccSlides.length > 1) {
                    const delBtn = document.createElement('button');
                    delBtn.innerHTML = '<i data-lucide="x" style="width: 10px; height: 10px;"></i>';
                    delBtn.style.position = 'absolute';
                    delBtn.style.top = '2px';
                    delBtn.style.right = '2px';
                    delBtn.style.background = 'rgba(0,0,0,0.5)';
                    delBtn.style.border = 'none';
                    delBtn.style.color = 'white';
                    delBtn.style.borderRadius = '50%';
                    delBtn.style.width = '16px';
                    delBtn.style.height = '16px';
                    delBtn.style.cursor = 'pointer';
                    delBtn.style.display = 'flex';
                    delBtn.style.alignItems = 'center';
                    delBtn.style.justifyContent = 'center';
                    delBtn.onclick = (e) => {
                        e.stopPropagation();
                        ccSlides = ccSlides.filter(s => s.id !== slide.id);
                        if (ccCurrentSlideId === slide.id) {
                            ccCurrentSlideId = ccSlides[Math.max(0, index - 1)].id;
                        }
                        updateCcSlideNumbers();
                        updateCcPreview();
                        renderCcSlideStrip();
                    };
                    thumb.appendChild(delBtn);
                }

                thumb.onclick = () => {
                    ccCurrentSlideId = slide.id;
                    updateCcPreview();
                    renderCcSlideStrip();
                };

                strip.appendChild(thumb);
            });
            lucide.createIcons();
        }

        // Init
        initStorage();
        initCarouselCoverBuilder();

    
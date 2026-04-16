/**
 * Aux Accessibility Widget
 * A REDAXO AddOn for website accessibility
 * (c) Michelle Falke – MIT License
 */
(function () {
    'use strict';

    const STORAGE_KEY = 'aux_settings';

    // Universal accessibility icon (person with arms outstretched – the
    // international symbol for accessibility / "help for all users")
    const A11Y_ICON = '<svg aria-hidden="true" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="4" r="2" fill="currentColor" stroke="none"/><path d="M5 8h14"/><path d="M12 9v4"/><path d="M8.5 21 12 13l3.5 8"/></svg>';
    const A11Y_ICON_SMALL = '<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="4" r="2" fill="currentColor" stroke="none"/><path d="M5 8h14"/><path d="M12 9v4"/><path d="M8.5 21 12 13l3.5 8"/></svg>';

    const DEFAULT_SETTINGS = {
        contrast: 'normal',
        textSize: 0,
        lineHeight: 0,
        letterSpacing: 0,
        textAlign: 'none',
        highlightLinks: false,
        highlightHeadings: false,
        readingRuler: false,
        dyslexiaFont: false,
        focusHighlight: false,
        bigCursor: false,
        stopAnimations: false,
        hideImages: false,
        activeProfile: null,
        widgetPosition: null,
    };

    const PROFILES = {
        vision: {
            contrast: 'high',
            textSize: 2,
            bigCursor: true,
            focusHighlight: true,
        },
        dyslexia: {
            dyslexiaFont: true,
            lineHeight: 2,
            letterSpacing: 2,
            textSize: 1,
        },
        adhd: {
            readingRuler: true,
            stopAnimations: true,
            focusHighlight: true,
            hideImages: true,
        },
        motor: {
            bigCursor: true,
            focusHighlight: true,
            textSize: 1,
        },
        cognitive: {
            textSize: 1,
            lineHeight: 1,
            highlightLinks: true,
            highlightHeadings: true,
            stopAnimations: true,
        },
        seizure: {
            stopAnimations: true,
            contrast: 'normal',
        },
    };

    class AuxWidget {
        constructor(config) {
            this.config = config;
            this.i18n = config.i18n || {};
            this.isOpen = false;
            this.settings = { ...DEFAULT_SETTINGS };
            this.rulerEl = null;
            this.ttsActive = false;
            this.ttsUtterance = null;

            this.load();
            this.createWidget();
            this.applyAll();
            this.bindGlobalEvents();
        }

        // ── Translation ──

        t(key) {
            return this.i18n[key] || key;
        }

        // ── Persistence ──

        save() {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
            } catch (e) {
                // localStorage not available
            }
        }

        load() {
            try {
                const stored = localStorage.getItem(STORAGE_KEY);
                if (stored) {
                    const parsed = JSON.parse(stored);
                    this.settings = { ...DEFAULT_SETTINGS, ...parsed };
                }
            } catch (e) {
                // localStorage not available
            }
        }

        // ── DOM Creation ──

        createWidget() {
            this.container = document.createElement('div');
            this.container.className = 'aux-widget';

            const position = this.settings.widgetPosition || this.config.position || 'bottom-right';
            this.applyWidgetPosition(position);

            this.button = document.createElement('button');
            this.button.className = 'aux-toggle-btn';
            this.button.setAttribute('aria-label', this.t('title'));
            this.button.setAttribute('aria-expanded', 'false');
            this.button.setAttribute('aria-controls', 'aux-panel');
            this.button.style.setProperty('--aux-btn-color', this.config.buttonColor || '#1a73e8');
            this.button.innerHTML = A11Y_ICON;
            this.button.addEventListener('click', () => this.toggle());

            this.panel = document.createElement('div');
            this.panel.className = 'aux-panel';
            this.panel.id = 'aux-panel';
            this.panel.setAttribute('role', 'dialog');
            this.panel.setAttribute('aria-label', this.t('title'));
            this.panel.setAttribute('aria-modal', 'false');
            this.panel.innerHTML = this.buildPanelHTML();

            this.container.appendChild(this.button);
            this.container.appendChild(this.panel);
            document.body.appendChild(this.container);

            if (this.settings.widgetPosition === 'hidden') {
                this.container.style.display = 'none';
            }

            this.bindPanelEvents();
            this.updateUI();
        }

        applyWidgetPosition(position) {
            if (position === 'hidden') {
                this.container.style.display = 'none';
                return;
            }

            this.container.style.display = '';

            let fullPosition = position;
            if (position === 'left') fullPosition = 'bottom-left';
            if (position === 'right') fullPosition = 'bottom-right';

            this.container.setAttribute('data-position', fullPosition);
        }

        buildPanelHTML() {
            return `
                <div class="aux-panel-header">
                    <h2 class="aux-panel-title">
                        ${A11Y_ICON_SMALL}
                        ${this.t('title')}
                    </h2>
                    <button class="aux-close-btn" aria-label="${this.t('close')}">&times;</button>
                </div>
                <div class="aux-panel-body">
                    ${this.buildProfilesSection()}
                    ${this.buildDisplaySection()}
                    ${this.buildReadingAidsSection()}
                    ${this.buildOtherSection()}
                    ${this.buildWidgetPositionSection()}
                    ${this.buildResetSection()}
                </div>
            `;
        }

        buildProfilesSection() {
            const profiles = [
                { key: 'vision', icon: '\u{1F441}' },
                { key: 'dyslexia', icon: '\u{1F524}' },
                { key: 'adhd', icon: '\u{1F3AF}' },
                { key: 'motor', icon: '\u{1F590}' },
                { key: 'cognitive', icon: '\u{1F9E0}' },
                { key: 'seizure', icon: '\u26A1' },
            ];
            const buttons = profiles.map(p => `
                <button class="aux-profile-btn" data-profile="${p.key}"
                        aria-pressed="false" title="${this.t('profile_' + p.key)}">
                    <span class="aux-profile-icon" aria-hidden="true">${p.icon}</span>
                    <span class="aux-profile-label">${this.t('profile_' + p.key)}</span>
                </button>
            `).join('');

            return `
                <div class="aux-section">
                    <h3 class="aux-section-title">${this.t('profiles')}</h3>
                    <div class="aux-profiles-grid">${buttons}</div>
                </div>
            `;
        }

        buildDisplaySection() {
            const contrastOptions = ['normal', 'dark', 'light', 'high', 'inverted'];
            const contrastBtns = contrastOptions.map(c => `
                <button class="aux-contrast-btn" data-contrast="${c}" aria-pressed="false">
                    ${this.t('contrast_' + c)}
                </button>
            `).join('');

            const alignOptions = ['none', 'left', 'center', 'right'];
            const alignBtns = alignOptions.map(a => `
                <button class="aux-align-btn" data-align="${a}" aria-pressed="false">
                    ${this.t('align_' + a)}
                </button>
            `).join('');

            return `
                <div class="aux-section">
                    <h3 class="aux-section-title">${this.t('display')}</h3>
                    <div class="aux-option-group">
                        <label class="aux-option-label">${this.t('contrast')}</label>
                        <div class="aux-contrast-group">${contrastBtns}</div>
                    </div>
                    ${this.buildStepperOption('textSize', this.t('text_size'), 0, 3)}
                    ${this.buildStepperOption('lineHeight', this.t('line_height'), 0, 3)}
                    ${this.buildStepperOption('letterSpacing', this.t('letter_spacing'), 0, 3)}
                    <div class="aux-option-group">
                        <label class="aux-option-label">${this.t('text_align')}</label>
                        <div class="aux-contrast-group">${alignBtns}</div>
                    </div>
                </div>
            `;
        }

        buildStepperOption(key, label, min, max) {
            return `
                <div class="aux-option-group">
                    <label class="aux-option-label">${label}</label>
                    <div class="aux-stepper" data-key="${key}" data-min="${min}" data-max="${max}">
                        <button class="aux-stepper-btn" data-action="decrease" aria-label="${label} verringern">\u2212</button>
                        <span class="aux-stepper-value" aria-live="polite">0</span>
                        <button class="aux-stepper-btn" data-action="increase" aria-label="${label} erh\u00F6hen">+</button>
                    </div>
                </div>
            `;
        }

        buildReadingAidsSection() {
            const toggles = [
                { key: 'highlightLinks', label: this.t('highlight_links') },
                { key: 'highlightHeadings', label: this.t('highlight_headings') },
                { key: 'readingRuler', label: this.t('reading_ruler') },
                { key: 'dyslexiaFont', label: this.t('dyslexia_font') },
                { key: 'focusHighlight', label: this.t('focus_highlight') },
            ];
            return this.buildToggleSection(this.t('reading_aids'), toggles);
        }

        buildOtherSection() {
            const toggles = [
                { key: 'bigCursor', label: this.t('big_cursor') },
                { key: 'stopAnimations', label: this.t('stop_animations') },
                { key: 'hideImages', label: this.t('hide_images') },
            ];

            const ttsButton = `
                <div class="aux-toggle-row">
                    <label class="aux-toggle-label">
                        <span>${this.t('text_reader')}</span>
                        <button class="aux-tts-btn aux-toggle" data-key="textReader" role="switch"
                                aria-checked="false" aria-label="${this.t('text_reader')}">
                            <span class="aux-toggle-track">
                                <span class="aux-toggle-thumb"></span>
                            </span>
                        </button>
                    </label>
                </div>
            `;

            const items = toggles.map(t => `
                <div class="aux-toggle-row">
                    <label class="aux-toggle-label">
                        <span>${t.label}</span>
                        <button class="aux-toggle" data-key="${t.key}" role="switch"
                                aria-checked="false" aria-label="${t.label}">
                            <span class="aux-toggle-track">
                                <span class="aux-toggle-thumb"></span>
                            </span>
                        </button>
                    </label>
                </div>
            `).join('');

            return `
                <div class="aux-section">
                    <h3 class="aux-section-title">${this.t('other')}</h3>
                    ${items}
                    ${ttsButton}
                </div>
            `;
        }

        buildWidgetPositionSection() {
            const positions = [
                { key: 'left', label: this.t('widget_left') },
                { key: 'right', label: this.t('widget_right') },
                { key: 'hidden', label: this.t('widget_hide') },
            ];
            const btns = positions.map(p => `
                <button class="aux-contrast-btn aux-widget-pos-btn" data-widget-pos="${p.key}" aria-pressed="false">
                    ${p.label}
                </button>
            `).join('');

            return `
                <div class="aux-section">
                    <h3 class="aux-section-title">${this.t('widget_position')}</h3>
                    <div class="aux-option-group">
                        <div class="aux-contrast-group">${btns}</div>
                    </div>
                </div>
            `;
        }

        buildToggleSection(title, toggles) {
            const items = toggles.map(t => `
                <div class="aux-toggle-row">
                    <label class="aux-toggle-label">
                        <span>${t.label}</span>
                        <button class="aux-toggle" data-key="${t.key}" role="switch"
                                aria-checked="false" aria-label="${t.label}">
                            <span class="aux-toggle-track">
                                <span class="aux-toggle-thumb"></span>
                            </span>
                        </button>
                    </label>
                </div>
            `).join('');

            return `
                <div class="aux-section">
                    <h3 class="aux-section-title">${title}</h3>
                    ${items}
                </div>
            `;
        }

        buildResetSection() {
            return `
                <div class="aux-section aux-section-reset">
                    <button class="aux-reset-btn" aria-label="${this.t('reset')}">
                        \u21BA ${this.t('reset')}
                    </button>
                </div>
            `;
        }

        // ── Event Binding ──

        bindPanelEvents() {
            this.panel.querySelector('.aux-close-btn')
                .addEventListener('click', () => this.toggle());

            this.panel.querySelectorAll('.aux-profile-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const profile = btn.dataset.profile;
                    this.applyProfile(profile);
                });
            });

            this.panel.querySelectorAll('.aux-contrast-btn:not(.aux-widget-pos-btn):not(.aux-align-btn)').forEach(btn => {
                btn.addEventListener('click', () => {
                    this.setSetting('contrast', btn.dataset.contrast);
                });
            });

            this.panel.querySelectorAll('.aux-align-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    this.setSetting('textAlign', btn.dataset.align);
                });
            });

            this.panel.querySelectorAll('.aux-stepper').forEach(stepper => {
                const key = stepper.dataset.key;
                const min = parseInt(stepper.dataset.min, 10);
                const max = parseInt(stepper.dataset.max, 10);

                stepper.querySelectorAll('.aux-stepper-btn').forEach(btn => {
                    btn.addEventListener('click', () => {
                        let val = this.settings[key] || 0;
                        val = btn.dataset.action === 'increase'
                            ? Math.min(val + 1, max)
                            : Math.max(val - 1, min);
                        this.setSetting(key, val);
                    });
                });
            });

            this.panel.querySelectorAll('.aux-toggle:not(.aux-tts-btn)').forEach(toggle => {
                toggle.addEventListener('click', () => {
                    const key = toggle.dataset.key;
                    this.setSetting(key, !this.settings[key]);
                });
            });

            const ttsBtn = this.panel.querySelector('.aux-tts-btn');
            if (ttsBtn) {
                ttsBtn.addEventListener('click', () => this.toggleTTS());
            }

            this.panel.querySelectorAll('.aux-widget-pos-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const pos = btn.dataset.widgetPos;
                    this.settings.widgetPosition = pos;
                    this.save();
                    this.applyWidgetPosition(pos);
                    this.updateUI();

                    if (pos === 'hidden') {
                        this.isOpen = false;
                        this.panel.classList.remove('aux-panel-open');
                        this.showHiddenToast();
                    }
                });
            });

            this.panel.querySelector('.aux-reset-btn')
                .addEventListener('click', () => this.resetAll());
        }

        bindGlobalEvents() {
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.isOpen) {
                    this.toggle();
                    this.button.focus();
                }
            });

            document.addEventListener('click', (e) => {
                if (this.isOpen && !this.container.contains(e.target)) {
                    this.toggle();
                }
            });

            document.addEventListener('mousemove', (e) => {
                if (this.settings.readingRuler && this.rulerEl) {
                    this.rulerEl.style.top = e.clientY + 'px';
                }
            });

            // TTS: click-to-read when active
            document.addEventListener('click', (e) => {
                if (!this.ttsActive) return;
                if (this.container.contains(e.target)) return;

                const el = e.target.closest('p, h1, h2, h3, h4, h5, h6, li, td, th, span, a, label, blockquote, figcaption');
                if (el) {
                    e.preventDefault();
                    this.speakElement(el);
                }
            }, true);

            // Keyboard shortcut to show hidden widget
            document.addEventListener('keydown', (e) => {
                const modifierOK = (e.ctrlKey || e.metaKey) && e.altKey;
                const keyOK = e.code === 'KeyA' || e.key.toLowerCase() === 'a' || e.key === 'å' || e.key === 'Å';
                if (modifierOK && keyOK) {
                    e.preventDefault();
                    this.settings.widgetPosition = null;
                    this.save();
                    this.applyWidgetPosition(this.config.position || 'bottom-right');
                    this.updateUI();
                }
            });
        }

        // ── Actions ──

        toggle() {
            this.isOpen = !this.isOpen;
            this.panel.classList.toggle('aux-panel-open', this.isOpen);
            this.button.setAttribute('aria-expanded', String(this.isOpen));

            if (this.isOpen) {
                const firstBtn = this.panel.querySelector('.aux-profile-btn, .aux-close-btn');
                if (firstBtn) firstBtn.focus();
            }
        }

        setSetting(key, value) {
            this.settings[key] = value;
            if (key !== 'activeProfile') {
                this.settings.activeProfile = null;
            }
            this.save();
            this.applyAll();
            this.updateUI();
        }

        applyProfile(profileKey) {
            if (this.settings.activeProfile === profileKey) {
                this.settings = { ...DEFAULT_SETTINGS };
                this.settings.activeProfile = null;
            } else {
                const widgetPos = this.settings.widgetPosition;
                this.settings = { ...DEFAULT_SETTINGS };
                this.settings.widgetPosition = widgetPos;
                const profile = PROFILES[profileKey];
                if (profile) {
                    Object.assign(this.settings, profile);
                    this.settings.activeProfile = profileKey;
                }
            }
            this.save();
            this.applyAll();
            this.updateUI();
        }

        resetAll() {
            const widgetPos = this.settings.widgetPosition;
            this.settings = { ...DEFAULT_SETTINGS };
            this.settings.widgetPosition = widgetPos;
            this.stopTTS();
            this.resumeAllVideos();
            this.save();
            this.applyAll();
            this.updateUI();
        }

        // ── Apply CSS Classes ──

        applyAll() {
            const html = document.documentElement;

            // Remove all aux classes from html
            const toRemove = [];
            html.classList.forEach(cls => {
                if (cls.startsWith('aux-')) toRemove.push(cls);
            });
            toRemove.forEach(cls => html.classList.remove(cls));

            if (this.settings.contrast !== 'normal') {
                html.classList.add('aux-contrast-' + this.settings.contrast);
            }

            if (this.settings.textSize > 0) {
                html.classList.add('aux-text-size-' + this.settings.textSize);
            }

            if (this.settings.lineHeight > 0) {
                html.classList.add('aux-line-height-' + this.settings.lineHeight);
            }

            if (this.settings.letterSpacing > 0) {
                html.classList.add('aux-letter-spacing-' + this.settings.letterSpacing);
            }

            if (this.settings.textAlign && this.settings.textAlign !== 'none') {
                html.classList.add('aux-text-align-' + this.settings.textAlign);
            }

            const booleanClasses = {
                highlightLinks: 'aux-highlight-links',
                highlightHeadings: 'aux-highlight-headings',
                dyslexiaFont: 'aux-dyslexia-font',
                focusHighlight: 'aux-focus-highlight',
                bigCursor: 'aux-big-cursor',
                stopAnimations: 'aux-stop-animations',
                hideImages: 'aux-hide-images',
            };

            for (const [key, cls] of Object.entries(booleanClasses)) {
                if (this.settings[key]) {
                    html.classList.add(cls);
                }
            }

            this.handleReadingRuler();
            this.handleVideos();
            this.markBackgroundImages();
        }

        markBackgroundImages() {
            // Needed for modes that invert the page – so elements with
            // class-based background-images can be counter-inverted.
            const needsMarking = ['dark', 'inverted'].includes(this.settings.contrast);

            if (!needsMarking) {
                document.querySelectorAll('.aux-has-bg-image').forEach(el => {
                    el.classList.remove('aux-has-bg-image');
                });
                return;
            }

            const elements = document.querySelectorAll('body *:not(.aux-widget):not(.aux-widget *)');
            let count = 0;
            const MAX_SCAN = 5000;

            for (const el of elements) {
                if (count++ > MAX_SCAN) break;
                const bg = window.getComputedStyle(el).backgroundImage;
                if (bg && bg !== 'none' && bg.includes('url(')) {
                    el.classList.add('aux-has-bg-image');
                }
            }
        }

        handleReadingRuler() {
            if (this.settings.readingRuler) {
                if (!this.rulerEl) {
                    this.rulerEl = document.createElement('div');
                    this.rulerEl.className = 'aux-reading-ruler';
                    this.rulerEl.setAttribute('aria-hidden', 'true');
                    document.body.appendChild(this.rulerEl);
                }
                this.rulerEl.style.display = 'block';
            } else if (this.rulerEl) {
                this.rulerEl.style.display = 'none';
            }
        }

        handleVideos() {
            if (this.settings.stopAnimations) {
                document.querySelectorAll('video:not(.aux-widget video)').forEach(video => {
                    if (!video.paused) {
                        video.pause();
                        video.dataset.auxPaused = 'true';
                    }
                });
                document.querySelectorAll('iframe').forEach(iframe => {
                    try {
                        iframe.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
                    } catch (e) { /* cross-origin */ }
                });
            } else {
                this.resumeAllVideos();
            }
        }

        resumeAllVideos() {
            document.querySelectorAll('video[data-aux-paused="true"]').forEach(video => {
                video.play().catch(() => {});
                delete video.dataset.auxPaused;
            });
        }

        // ── Text-to-Speech ──

        toggleTTS() {
            this.ttsActive = !this.ttsActive;
            if (!this.ttsActive) {
                this.stopTTS();
            }
            this.updateUI();

            if (this.ttsActive) {
                document.body.style.cursor = 'crosshair';
            } else {
                document.body.style.cursor = '';
            }
        }

        speakElement(el) {
            window.speechSynthesis.cancel();

            document.querySelectorAll('.aux-tts-highlight').forEach(e => {
                e.classList.remove('aux-tts-highlight');
            });

            const text = el.textContent.trim();
            if (!text) return;

            el.classList.add('aux-tts-highlight');

            this.ttsUtterance = new SpeechSynthesisUtterance(text);
            this.ttsUtterance.lang = this.config.lang === 'en' ? 'en-US' : this.config.lang + '-' + this.config.lang.toUpperCase();

            this.ttsUtterance.onend = () => {
                el.classList.remove('aux-tts-highlight');
            };
            this.ttsUtterance.onerror = () => {
                el.classList.remove('aux-tts-highlight');
            };

            window.speechSynthesis.speak(this.ttsUtterance);
        }

        stopTTS() {
            this.ttsActive = false;
            window.speechSynthesis.cancel();
            document.body.style.cursor = '';
            document.querySelectorAll('.aux-tts-highlight').forEach(e => {
                e.classList.remove('aux-tts-highlight');
            });
        }

        // ── Hidden Toast ──

        showHiddenToast() {
            const toast = document.createElement('div');
            toast.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#333;color:#fff;padding:12px 24px;border-radius:8px;font-size:14px;z-index:999999;font-family:-apple-system,sans-serif;box-shadow:0 4px 12px rgba(0,0,0,0.3);';
            toast.textContent = this.t('widget_hidden_hint');
            document.body.appendChild(toast);
            setTimeout(() => {
                toast.style.opacity = '0';
                toast.style.transition = 'opacity 0.5s';
                setTimeout(() => toast.remove(), 500);
            }, 4000);
        }

        // ── Update UI State ──

        updateUI() {
            this.panel.querySelectorAll('.aux-profile-btn').forEach(btn => {
                const isActive = btn.dataset.profile === this.settings.activeProfile;
                btn.classList.toggle('aux-profile-active', isActive);
                btn.setAttribute('aria-pressed', String(isActive));
            });

            this.panel.querySelectorAll('.aux-contrast-btn:not(.aux-widget-pos-btn):not(.aux-align-btn)').forEach(btn => {
                const isActive = btn.dataset.contrast === this.settings.contrast;
                btn.classList.toggle('aux-contrast-active', isActive);
                btn.setAttribute('aria-pressed', String(isActive));
            });

            this.panel.querySelectorAll('.aux-align-btn').forEach(btn => {
                const isActive = btn.dataset.align === this.settings.textAlign;
                btn.classList.toggle('aux-contrast-active', isActive);
                btn.setAttribute('aria-pressed', String(isActive));
            });

            this.panel.querySelectorAll('.aux-widget-pos-btn').forEach(btn => {
                const pos = btn.dataset.widgetPos;
                const currentPos = this.settings.widgetPosition;
                let isActive = false;
                if (currentPos) {
                    isActive = pos === currentPos;
                } else {
                    const serverPos = this.config.position || 'bottom-right';
                    isActive = (pos === 'right' && serverPos.includes('right')) ||
                               (pos === 'left' && serverPos.includes('left'));
                }
                btn.classList.toggle('aux-contrast-active', isActive);
                btn.setAttribute('aria-pressed', String(isActive));
            });

            this.panel.querySelectorAll('.aux-stepper').forEach(stepper => {
                const key = stepper.dataset.key;
                const val = this.settings[key] || 0;
                stepper.querySelector('.aux-stepper-value').textContent = val;

                const min = parseInt(stepper.dataset.min, 10);
                const max = parseInt(stepper.dataset.max, 10);
                stepper.querySelector('[data-action="decrease"]').disabled = val <= min;
                stepper.querySelector('[data-action="increase"]').disabled = val >= max;
            });

            this.panel.querySelectorAll('.aux-toggle:not(.aux-tts-btn)').forEach(toggle => {
                const key = toggle.dataset.key;
                const isActive = !!this.settings[key];
                toggle.classList.toggle('aux-toggle-active', isActive);
                toggle.setAttribute('aria-checked', String(isActive));
            });

            const ttsBtn = this.panel.querySelector('.aux-tts-btn');
            if (ttsBtn) {
                ttsBtn.classList.toggle('aux-toggle-active', this.ttsActive);
                ttsBtn.setAttribute('aria-checked', String(this.ttsActive));
            }
        }
    }

    // ── Init ──

    function init() {
        if (!window.auxConfig) return;
        new AuxWidget(window.auxConfig);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();

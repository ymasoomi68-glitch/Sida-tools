// ==UserScript==
// @name         🛠️ ابزارهای سیدا
// @namespace    http://tampermonkey.net/
// @version      15.5
// @description  داشبورد کشویی ابزارهای کمکی سیدا - نسخه قفل‌دار
// @author       You
// @match        https://sida.medu.ir/*
// @updateURL    https://cdn.jsdelivr.net/gh/ymasoomi68-glitch/Sida-tools@main/sidatools-user.js
// @downloadURL  https://cdn.jsdelivr.net/gh/ymasoomi68-glitch/Sida-tools@main/sidatools-user.js
// @grant        GM_getValue
// @grant        GM_setValue
// @require      https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js
// @require      https://cdn.jsdelivr.net/npm/html-to-image@1.11.11/dist/html-to-image.min.js
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

            // ==================== کد امنیتی (هش شده) ====================
     // هش کدهای مجاز مدرسه
    const MY_SCHOOL_HASHES = [
        'd10fddcb314a2a80',  // کد مدرسه 40980416
        '1ff11a80929ebb94',  // کد مدرسه 95098240
        'a711f5bcf73d5557',  // کد مدرسه 96118217
        'f32cce53c8a7a236',  // کد مدرسه 96118256
        '23622e837f0a02a3',  // کد مدرسه 96083457
		'3f37947bce473f90',  // کد مدرسه 78111706
        '77f1ce33cf8167b4',  // کد مدرسه 40970636
        '464d14a0061fda2b',  // کد مدرسه 40970639
        '1db30f48a7da93f0',  // کد مدرسه 40990919
	    '9aefb234a56dae10',  // کد مدرسه 40990635
        '4fd0c64c157f4148'   // کد مدرسه 80059089
    ];

    // ==================== مختصات پیش‌فرض ====================
    const DEFAULT_X = 230;
    const DEFAULT_Y = 25;

    // ==================== تابع هش کردن ====================
        function hashString(str) {
        const salt = 'masoomi68_sida_tool_v15';
        const combined = str + salt;
        let hash1 = 0x811c9dc5;
        let hash2 = 0x01000193;
        
        for (let i = 0; i < combined.length; i++) {
            const char = combined.charCodeAt(i);
            hash1 = (hash1 ^ char) * 16777619;
            hash2 = (hash2 ^ char) * 16777619;
        }
        
        const part1 = (hash1 >>> 0).toString(16).padStart(8, '0');
        const part2 = (hash2 >>> 0).toString(16).padStart(8, '0');
        
        return part1 + part2;
    }

    // ==================== تابع تبدیل اعداد فارسی/عربی به انگلیسی ====================
    function toEnglishDigits(str) {
        return str
            .replace(/[\u06F0-\u06F9]/g, function(d) { return String(d.charCodeAt(0) - 0x06F0); })
            .replace(/[\u0660-\u0669]/g, function(d) { return String(d.charCodeAt(0) - 0x0660); });
    }

    // ==================== تابع خواندن کد مدرسه از سیدا ====================
    function getCurrentSchoolCode() {
        const spans = document.querySelectorAll('span');
        for (let span of spans) {
            const text = span.textContent || '';
            const trimmed = text.trim();
            const normalized = toEnglishDigits(trimmed);
            const match = normalized.match(/^(\d{8,10})/);
            if (match && match[1]) {
                return match[1];
            }
        }
        return null;
    }

    // ==================== تابع بررسی دسترسی ====================
    function checkSchoolAccess() {
        const currentCode = getCurrentSchoolCode();
        if (!currentCode) {
            return { allowed: false, current: 'کد مدرسه پیدا نشد', reason: 'not_found' };
        }
        
        const currentHash = hashString(currentCode);
        if (MY_SCHOOL_HASHES.includes(currentHash)) {
            return { allowed: true, current: currentCode };
        }
        
        return { allowed: false, current: currentCode, reason: 'mismatch' };
    }

    // ==================== تابع نمایش خطای غیر مجاز ====================
    function showUnauthorizedError(schoolCode) {
        const overlay = document.createElement('div');
        overlay.id = 'unauthorized-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.85);
            z-index: 9999999;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: Tahoma, Arial, sans-serif;
            direction: rtl;
            padding: 20px;
            box-sizing: border-box;
        `;

        overlay.innerHTML = `
            <div style="
                background: #1a1a2e;
                color: white;
                border: 3px solid #ef4444;
                border-radius: 16px;
                padding: 30px;
                max-width: 450px;
                width: 100%;
                text-align: center;
                box-shadow: 0 10px 40px rgba(0,0,0,0.5);
            ">
                <div style="font-size: 60px; margin-bottom: 20px;">🔒</div>
                <h2 style="color: #ef4444; font-size: 22px; margin-bottom: 15px;">نسخه غیر مجاز!</h2>
                <div style="
                    background: #2a2d42;
                    border: 1px solid #f59e0b;
                    border-radius: 10px;
                    padding: 15px;
                    margin-bottom: 20px;
                ">
                    <p style="color: #f59e0b; font-weight: bold; font-size: 14px; margin-bottom: 10px;">
                        لطفا برای تهیه نسخه‌ی اصلی
                    </p>
                    <p style="color: #e8e8f0; font-size: 14px; margin-bottom: 5px;">
                        به آیدی زیر در تلگرام یا شاد پیام بدید:
                    </p>
                    <p id="copy-id-btn" style="
                        color: #3ecfe0;
                        font-size: 22px;
                        font-weight: bold;
                        margin-top: 10px;
                        direction: ltr;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        display: inline-block;
                        padding: 8px 20px;
                        border: 2px dashed #3ecfe0;
                        border-radius: 8px;
                        user-select: all;
                        -webkit-user-select: all;
                    " title="برای کپی کلیک کنید">@masoomi68</p>
                    <p id="copy-message" style="
                        color: #10b981;
                        font-size: 13px;
                        margin-top: 8px;
                        opacity: 0;
                        transition: opacity 0.3s ease;
                    ">✅ کپی شد!</p>
                </div>
                <button onclick="this.closest('#unauthorized-overlay').remove()" style="
                    background: #6b7280;
                    color: white;
                    border: none;
                    padding: 10px 25px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-family: inherit;
                    font-size: 14px;
                    font-weight: bold;
                ">
                    بستن
                </button>
            </div>
        `;

        document.body.appendChild(overlay);

        // رویداد کپی آیدی
        const copyBtn = document.getElementById('copy-id-btn');
        const copyMsg = document.getElementById('copy-message');
        
        copyBtn.addEventListener('click', function() {
            const textToCopy = '@masoomi68';
            
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(textToCopy).then(() => {
                    copyMsg.style.opacity = '1';
                    copyBtn.style.borderColor = '#10b981';
                    copyBtn.style.color = '#10b981';
                    
                    setTimeout(() => {
                        copyMsg.style.opacity = '0';
                        copyBtn.style.borderColor = '#3ecfe0';
                        copyBtn.style.color = '#3ecfe0';
                    }, 2000);
                }).catch(() => {
                    fallbackCopy(textToCopy);
                });
            } else {
                fallbackCopy(textToCopy);
            }
        });

        function fallbackCopy(text) {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.top = '-100px';
            textarea.style.left = '-100px';
            document.body.appendChild(textarea);
            textarea.select();
            textarea.setSelectionRange(0, 99999);
            document.execCommand('copy');
            document.body.removeChild(textarea);
            
            copyMsg.style.opacity = '1';
            copyBtn.style.borderColor = '#10b981';
            copyBtn.style.color = '#10b981';
            
            setTimeout(() => {
                copyMsg.style.opacity = '0';
                copyBtn.style.borderColor = '#3ecfe0';
                copyBtn.style.color = '#3ecfe0';
            }, 2000);
        }
    }

    // ==================== تابع پاک‌سازی پنل‌های ابزارهای قبلی ====================
    function cleanupAllPanels() {
        const panelIds = [
            'autoExtractPanel',
            'uploadPanel',
            'collectPanel',
            'collectAssignPanel',
            'freeStudentPanel',
            'multiPageExtractPanel',
            'extractPanel',
            'gradeCollectorPanel',
            'gradePanel',
            'nationalityPanel'
        ];
        
        panelIds.forEach(id => {
            const panel = document.getElementById(id);
            if (panel) {
                panel.remove();
            }
        });
        
        const overlays = document.querySelectorAll('#gradeReportOverlay, #nationalityReportOverlay, #reportContainer, #unauthorized-overlay');
        overlays.forEach(overlay => overlay.remove());
        
        const notifications = document.querySelectorAll('#autoNotif, #uploadNotif, #natNotif, #collectNotif');
        notifications.forEach(notif => notif.remove());
    }

    function createDashboard() {
        if (document.getElementById('sida-dashboard')) return;

        const wrapper = document.createElement('div');
        wrapper.id = 'sida-dashboard';

        const savedX = GM_getValue('sida_dash_x', DEFAULT_X);
        const savedY = GM_getValue('sida_dash_y', DEFAULT_Y);

        wrapper.style.cssText = `
            position: fixed;
            left: ${savedX}px;
            top: ${savedY}px;
            z-index: 999999;
            direction: rtl;
            font-family: Tahoma, Arial, sans-serif;
        `;

        wrapper.innerHTML = `
            <button id="sida-toggle-btn" style="
                display: block;
                width: 260px;
                background: #2c3e50;
                color: white;
                border: none;
                padding: 10px 12px;
                border-radius: 10px;
                cursor: pointer;
                font-size: 18px;
                font-weight: bold;
                box-shadow: 0 4px 15px rgba(0,0,0,0.4);
                transition: all 0.25s ease;
                font-family: Tahoma, Arial, sans-serif;
                user-select: none;
            ">
                🛠️ ابزارها
            </button>

            <div id="sida-drawer" style="
                background: #2c3e50;
                color: white;
                border-radius: 12px;
                width: 260px;
                box-shadow: 0 4px 15px rgba(0,0,0,0.4);
                overflow: hidden;
                transition: max-height 0.3s ease, opacity 0.3s ease, margin-top 0.3s ease;
                max-height: 0;
                opacity: 0;
                margin-top: 0;
                display: flex;
                flex-direction: column;
            ">
                <div style="
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 10px 14px;
                    background: #34495e;
                    flex-shrink: 0;
                ">
                    <strong style="font-size: 18px;">🛠️ ابزارهای سیدا</strong>
                    <span id="sida-close-drawer" style="cursor: pointer; color: #e74c3c; font-weight: bold; font-size: 18px;">✖</span>
                </div>
                <div style="
                    padding: 8px 10px;
                    background: #34495e;
                    flex-shrink: 0;
                ">
                    <div style="
                        position: relative;
                        width: 100%;
                    ">
                        <input id="sida-search-input" type="text" placeholder="جستجوی ابزار..." style="
                            width: 100%;
                            padding: 8px 35px 8px 12px;
                            border: none;
                            border-radius: 6px;
                            font-family: Tahoma, Arial, sans-serif;
                            font-size: 13px;
                            direction: rtl;
                            background: #1a252f;
                            color: white;
                            outline: none;
                            box-sizing: border-box;
                        ">
                        <span style="
                            position: absolute;
                            left: 10px;
                            top: 50%;
                            transform: translateY(-50%);
                            color: #8899aa;
                            font-size: 14px;
                            pointer-events: none;
                        ">🔍</span>
                    </div>
                </div>
                <div id="sida-tools" style="
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                    padding: 10px;
                    overflow-y: auto;
                    max-height: 50vh;
                    min-height: 50px;
                    flex: 1;
                    scroll-behavior: smooth;
                    -webkit-overflow-scrolling: touch;
                    overscroll-behavior: contain;
                "></div>
                <div style="
                    padding: 8px 12px;
                    font-size: 18px;
                    color: #00FF00;
                    border-top: 1px solid #445;
                    text-align: center;
                    flex-shrink: 0;
                ">طراح: یوسف معصومی</div>
            </div>
        `;

        document.body.appendChild(wrapper);

        const drawer = document.getElementById('sida-drawer');
        const toggleBtn = document.getElementById('sida-toggle-btn');
        const closeDrawerBtn = document.getElementById('sida-close-drawer');
        const toolsContainer = document.getElementById('sida-tools');
        const searchInput = document.getElementById('sida-search-input');

        // ==================== hover برای دکمه اصلی ====================
        toggleBtn.addEventListener('mouseenter', () => {
            toggleBtn.style.transform = 'scale(1.03)';
            toggleBtn.style.boxShadow = '0 6px 20px rgba(0,0,0,0.5)';
        });
        
        toggleBtn.addEventListener('mouseleave', () => {
            toggleBtn.style.transform = 'scale(1)';
            toggleBtn.style.boxShadow = '0 4px 15px rgba(0,0,0,0.4)';
        });

        // ==================== تابع جستجو ====================
        function filterTools() {
            const searchTerm = searchInput.value.trim();
            const buttons = toolsContainer.querySelectorAll('button');
            
            buttons.forEach(btn => {
                const toolName = btn.textContent.trim();
                const toolDesc = btn.title || '';
                
                if (!searchTerm) {
                    btn.style.display = '';
                    btn.style.transform = 'scale(1)';
                    btn.style.boxShadow = '0 2px 5px rgba(0,0,0,0.15)';
                    btn.style.filter = 'brightness(1)';
                } else {
                    if (toolName.includes(searchTerm) || toolDesc.includes(searchTerm)) {
                        btn.style.display = '';
                        btn.style.transform = 'scale(1.03)';
                        btn.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
                        btn.style.filter = 'brightness(1.15)';
                    } else {
                        btn.style.display = 'none';
                    }
                }
            });
        }

        searchInput.addEventListener('input', filterTools);

        // ==================== تابع جابه‌جایی دستی ابزارها ====================
        function getDragAfterElement(container, y) {
            const draggableElements = [...container.querySelectorAll('button:not(.dragging)')];
            return draggableElements.reduce((closest, child) => {
                const box = child.getBoundingClientRect();
                const offset = y - box.top - box.height / 2;
                if (offset < 0 && offset > closest.offset) {
                    return { offset: offset, element: child };
                } else {
                    return closest;
                }
            }, { offset: Number.NEGATIVE_INFINITY }).element;
        }

        function makeToolsSortable(container) {
            let draggedItem = null;

            container.addEventListener('dragstart', (e) => {
                draggedItem = e.target.closest('button');
                if (!draggedItem) return;
                draggedItem.classList.add('dragging');
                draggedItem.style.opacity = '0.4';
                draggedItem.style.cursor = 'grabbing';
                e.dataTransfer.effectAllowed = 'move';
            });

            container.addEventListener('dragend', () => {
                if (draggedItem) {
                    draggedItem.classList.remove('dragging');
                    draggedItem.style.opacity = '1';
                    draggedItem.style.cursor = 'pointer';
                    const buttons = [...container.querySelectorAll('button')];
                    const newOrder = buttons.map(btn => btn.textContent.trim());
                    GM_setValue('sida_tools_order', JSON.stringify(newOrder));
                    draggedItem = null;
                }
            });

            container.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
            });

            container.addEventListener('drop', (e) => {
                e.preventDefault();
                if (!draggedItem) return;
                const afterElement = getDragAfterElement(container, e.clientY);
                if (afterElement == null) {
                    container.appendChild(draggedItem);
                } else {
                    container.insertBefore(draggedItem, afterElement);
                }
            });
        }

        // ==================== لیست تمام ابزارها ====================
        const allTools = [
            {
                name: '🗜️ فشرده‌سازی کارنامه',
                desc: 'فشرده‌سازی هوشمند و پرینت کارنامه توصیفی',
                color: '#f5a623',
                action: function() {
                    closeDrawer();
                    compressReportCard();
                }
            },
            {
                name: '🖨️ چاپ گروهی هوشمند',
                desc: 'چاپ گروهی کارنامه با فاصله‌گذاری هوشمند بر اساس پایه',
                color: '#3498db',
                action: function() {
                    closeDrawer();
                    smartGroupPrint();
                }
            },
            {
                name: '📋 ساخت دفترچه تماس',
                desc: 'استخراج خودکار اطلاعات دانش‌آموزان + عکس + شماره تماس',
                color: '#10b981',
                action: function() {
                    closeDrawer();
                    contactBookExtractor();
                }
            },
            {
                name: '📸 آپلود خودکار عکس',
                desc: 'آپلود خودکار عکس دانش‌آموزان از پوشه با نام کد ملی',
                color: '#3ecfe0',
                action: function() {
                    closeDrawer();
                    photoUploadTool();
                }
            },
            {
                name: '📋 جمع‌آوری و ارتقاء',
                desc: 'جمع‌آوری کد دانش‌آموزان و ارتقاء پایه',
                color: '#6c8cff',
                action: function() {
                    closeDrawer();
                    collectAndPromote();
                }
            },
            {
                name: '📚 چاپ دفتر نتایج',
                desc: 'چاپ دفتر نتایج ارزشیابی با فاصله‌گذاری هوشمند',
                color: '#f5a623',
                action: function() {
                    closeDrawer();
                    printReportCard();
                }
            },
            {
                name: '📸 استخراج عکس',
                desc: 'استخراج عکس + مشخصات دانش‌آموزان از سیدا',
                color: '#3b82f6',
                action: function() {
                    closeDrawer();
                    photoExtractTool();
                }
            },
            {
                name: '📋 جمع‌آوری و تخصیص',
                desc: 'جمع‌آوری اطلاعات دانش‌آموزان و تخصیص خودکار در مودال',
                color: '#0f4c81',
                action: function() {
                    closeDrawer();
                    collectAssignTool();
                }
            },
            {
                name: '🔓 آزادسازی',
                desc: 'آزادسازی خودکار دانش‌آموزان بر اساس پایه مبدأ و مقصد',
                color: '#0f4c81',
                action: function() {
                    closeDrawer();
                    freeStudentTool();
                }
            },
            {
                name: '📋 استخراج لیست کلاسی',
                desc: 'استخراج لیست دانش‌آموزان کلاس و دانلود فایل ورد',
                color: '#3ecfe0',
                action: function() {
                    closeDrawer();
                    extractClassListTool();
                }
            },
            {
                name: '📋 استخراج مشخصات',
                desc: 'استخراج خودکار مشخصات دانش‌آموزان و شماره تماس والدین',
                color: '#8b5cf6',
                action: function() {
                    closeDrawer();
                    smartInfoExtractTool();
                }
            },
            {
                name: '📊 تحلیل نمرات',
                desc: 'استخراج و تحلیل خودکار نمرات توصیفی و تولید گزارش Word و عکس',
                color: '#4472C4',
                action: function() {
                    closeDrawer();
                    gradeAnalysisTool();
                }
            },
            {
                name: '📝 ثبت نمرات توصیفی',
                desc: 'ثبت خودکار متن توصیفی + نمره بر اساس پایه و درس',
                color: '#0f4c81',
                action: function() {
                    closeDrawer();
                    gradeRegisterTool();
                }
            },
            {
                name: '🔍 بررسی ملیت والدین',
                desc: 'بررسی و ثبت خودکار ملیت والدین دانش‌آموزان',
                color: '#f59e0b',
                action: function() {
                    closeDrawer();
                    nationalityCheckTool();
                }
            },
            {
                name: '📤 انتقال از بینا به سیدا',
                desc: 'جاگذاری اطلاعات دانش‌آموزان که از سامانه بینا جمع‌آوری شده',
                color: '#764ba2',
                action: function() {
                    closeDrawer();
                    pasteFromBinaTool();
                }
            }
        ];

        // ==================== مرتب‌سازی بر اساس ترتیب ذخیره‌شده ====================
        let tools = allTools;
        const savedOrderRaw = GM_getValue('sida_tools_order', null);
        
        if (savedOrderRaw) {
            try {
                const savedOrder = JSON.parse(savedOrderRaw);
                if (Array.isArray(savedOrder)) {
                    const orderedTools = [];
                    savedOrder.forEach(name => {
                        const tool = allTools.find(t => t.name === name);
                        if (tool) orderedTools.push(tool);
                    });
                    allTools.forEach(tool => {
                        if (!savedOrder.includes(tool.name)) {
                            orderedTools.push(tool);
                        }
                    });
                    tools = orderedTools;
                }
            } catch (e) {}
        }

        // ==================== ساخت دکمه‌ها ====================
        tools.forEach(tool => {
            const btn = document.createElement('button');
            btn.title = tool.desc;
            btn.draggable = true;
            
            // جدا کردن آیکون و متن
            const iconMatch = tool.name.match(/^(\S+)\s+(.+)$/);
            const icon = iconMatch ? iconMatch[1] : '';
            const label = iconMatch ? iconMatch[2] : tool.name;
            
            btn.innerHTML = `<span class="tool-icon" style="display:inline-block; transition: transform 0.3s ease;">${icon}</span> <span>${label}</span>`;
            
            btn.style.cssText = `
                background: ${tool.color};
                color: #ffffff;
                border: none;
                padding: 10px 12px;
                border-radius: 8px;
                cursor: pointer;
                font-size: 18px;
                font-weight: bold;
                transition: all 0.25s ease;
                text-align: center;
                font-family: Tahoma, Arial, sans-serif;
                user-select: none;
                flex-shrink: 0;
                box-shadow: 0 2px 5px rgba(0,0,0,0.15);
            `;
            
            btn.addEventListener('mouseenter', () => {
                btn.style.transform = 'scale(1.05)';
                btn.style.boxShadow = '0 6px 18px rgba(0,0,0,0.3)';
                btn.style.filter = 'brightness(1.1)';
                
                // انیمیشن آیکون
                const iconEl = btn.querySelector('.tool-icon');
                if (iconEl) {
                    iconEl.style.transform = 'scale(1.3) rotate(10deg)';
                }
            });
            
            btn.addEventListener('mouseleave', () => {
                btn.style.transform = 'scale(1)';
                btn.style.boxShadow = '0 2px 5px rgba(0,0,0,0.15)';
                btn.style.filter = 'brightness(1)';
                
                const iconEl = btn.querySelector('.tool-icon');
                if (iconEl) {
                    iconEl.style.transform = 'scale(1) rotate(0deg)';
                }
            });
            
            btn.addEventListener('dragstart', (e) => {
                btn.classList.add('dragging');
                btn.style.cursor = 'grabbing';
                btn.style.opacity = '0.4';
            });
            btn.addEventListener('dragend', (e) => {
                btn.classList.remove('dragging');
                btn.style.cursor = 'pointer';
                btn.style.opacity = '1';
            });
            
            btn.onclick = function() {
                if (btn.classList.contains('dragging')) return;
                tool.action();
            };
            
            toolsContainer.appendChild(btn);
        });

        // ==================== فعال کردن Drag & Drop ====================
        makeToolsSortable(toolsContainer);

        // ==================== باز و بسته شدن کشو (با بررسی امنیتی) ====================
        function openDrawer() {
            // بررسی کد مدرسه
            const access = checkSchoolAccess();
            
            if (!access.allowed) {
                showUnauthorizedError(access.current);
                return;
            }
            
            drawer.style.maxHeight = '70vh';
            drawer.style.opacity = '1';
            drawer.style.marginTop = '8px';
            drawer.style.overflowY = 'hidden';
            toggleBtn.textContent = '▲ بستن ابزارها';
        }

        function closeDrawer() {
            drawer.style.maxHeight = '0';
            drawer.style.opacity = '0';
            drawer.style.marginTop = '0';
            drawer.style.overflowY = 'hidden';
            toggleBtn.textContent = '🛠️ ابزارها';
            
            // پاک کردن جستجو
            if (searchInput) {
                searchInput.value = '';
                filterTools();
            }
        }

        toggleBtn.addEventListener('click', (e) => {
            if (isDraggingButton) return;

            if (drawer.style.maxHeight === '0px' || drawer.style.maxHeight === '') {
                openDrawer();
            } else {
                closeDrawer();
            }
        });

        closeDrawerBtn.addEventListener('click', closeDrawer);

        // ==================== جابه‌جایی کل داشبورد + ذخیره موقعیت ====================
        let isDraggingButton = false;
        let btnOffsetX, btnOffsetY;
        let moved = false;

        toggleBtn.addEventListener('mousedown', (e) => {
            isDraggingButton = true;
            moved = false;
            btnOffsetX = e.clientX - toggleBtn.getBoundingClientRect().left;
            btnOffsetY = e.clientY - toggleBtn.getBoundingClientRect().top;
            toggleBtn.style.cursor = 'grabbing';
            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (isDraggingButton) {
                moved = true;
                wrapper.style.left = (e.clientX - btnOffsetX) + 'px';
                wrapper.style.top = (e.clientY - btnOffsetY) + 'px';
                wrapper.style.right = 'auto';
                wrapper.style.bottom = 'auto';
            }
        });

        document.addEventListener('mouseup', () => {
            if (isDraggingButton) {
                isDraggingButton = false;
                toggleBtn.style.cursor = 'pointer';

                if (moved) {
                    const rect = wrapper.getBoundingClientRect();
                    GM_setValue('sida_dash_x', Math.round(rect.left));
                    GM_setValue('sida_dash_y', Math.round(rect.top));
                    setTimeout(() => { moved = false; }, 100);
                }
            }
        });
    }

    // ==================== ابزار ۱: فشرده‌سازی کارنامه ====================
    function compressReportCard() {
        if (!compressReportCard.toString().includes('یوسف معصومی')) {
            alert('⚠️ این ابزار دستکاری شده است. نام سازنده حذف شده و ابزار غیرفعال شد.');
            return;
        }

        cleanupAllPanels();

        function addCompressStyle() {
            let style = document.createElement('style');
            style.textContent = '@media print{body{margin:0.08in !important;padding:0 !important;}*{font-size:11.5px !important;line-height:1.3 !important;}table{font-size:10.5px !important;}td{padding:2px 3px !important;}.description,.toshihy,td[colspan],.matn{font-size:10.5px !important;line-height:1.3 !important;}table,tr,td,div,section,article{page-break-inside:avoid !important;break-inside:avoid !important;}@page{margin:0.12in;}}';
            document.head.appendChild(style);
        }

        function getPrintHeight() {
            return 1123;
        }

        function checkIfTwoPages() {
            let bodyHeight = document.body.scrollHeight;
            let pageHeight = getPrintHeight();
            return bodyHeight > pageHeight * 1.15;
        }

        function smartCompress() {
            if (!checkIfTwoPages()) return;
            let styles = document.createElement('style');
            let reductions = [
                {fontSize: 0.85, tableFont: 0.85, lineHeight: 0.9, tdPad: 0.6, bodyMargin: 0.6, pageMargin: 0.6},
                {fontSize: 0.75, tableFont: 0.75, lineHeight: 0.8, tdPad: 0.4, bodyMargin: 0.4, pageMargin: 0.4},
                {fontSize: 0.65, tableFont: 0.65, lineHeight: 0.75, tdPad: 0.2, bodyMargin: 0.2, pageMargin: 0.2}
            ];
            for (let r of reductions) {
                let newFs = Math.max(6, 11.5 * r.fontSize);
                let newTf = Math.max(6, 10.5 * r.tableFont);
                let newLh = Math.max(1, 1.3 * r.lineHeight);
                let newTp = Math.max(0, Math.round(2 * r.tdPad));
                let newBm = Math.max(0, 0.08 * r.bodyMargin);
                let newPm = Math.max(0, 0.12 * r.pageMargin);
                styles.textContent = '@media print{body{margin:' + newBm.toFixed(2) + 'in !important;padding:0 !important;}*{font-size:' + newFs.toFixed(1) + 'px !important;line-height:' + newLh.toFixed(1) + ' !important;}table{font-size:' + newTf.toFixed(1) + 'px !important;}td{padding:' + newTp + 'px 2px !important;}.description,.toshihy,td[colspan],.matn{font-size:' + newTf.toFixed(1) + 'px !important;line-height:' + newLh.toFixed(1) + ' !important;}table,tr,td,div,section,article{page-break-inside:avoid !important;break-inside:avoid !important;}@page{margin:' + newPm.toFixed(2) + 'in;}}';
                document.head.appendChild(styles);
                let newBodyHeight = document.body.scrollHeight;
                if (newBodyHeight < getPrintHeight() * 1.05) break;
            }
        }

        let allCheckboxes = [...document.querySelectorAll('table input[type="checkbox"]')]
            .filter(cb => !cb.closest('thead'));

        if (!allCheckboxes.length) {
            alert('چک‌باکسی پیدا نشد!');
            return;
        }

        let checkedCheckboxes = [...document.querySelectorAll('table input[type="checkbox"]:checked')]
            .filter(cb => !cb.closest('thead'));

        let selectedCount;
        if (checkedCheckboxes.length > 0) {
            selectedCount = checkedCheckboxes.length;
            checkedCheckboxes.forEach(cb => {
                if (!cb.checked) cb.click();
            });
            alert(selectedCount + ' دانش‌آموز انتخاب شده‌اند.');
        } else {
            selectedCount = allCheckboxes.length;
            allCheckboxes.forEach(cb => {
                if (!cb.checked) cb.click();
            });
            alert(selectedCount + ' دانش‌آموز به صورت خودکار انتخاب شدند.');
        }

        let btn = [...document.querySelectorAll('button,input')]
            .find(el => el.innerText.includes('کارنامه برای رکوردهای انتخاب شده'));

        if (!btn) {
            alert('دکمه پیدا نشد!');
            return;
        }

        btn.click();

        setTimeout(function() {
            addCompressStyle();
            smartCompress();
            setTimeout(function() {
                let printBtn = [...document.querySelectorAll('button,input')]
                    .find(el => el.innerText.includes('پرینت') || el.innerText.includes('چاپ'));
                if (printBtn) {
                    printBtn.style.outline = '3px solid #f5a623';
                    printBtn.style.outlineOffset = '2px';
                    printBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    alert('✅ فشرده‌سازی هوشمند اعمال شد.\n\n🖨️ لطفاً حالا دکمه پرینت را به صورت دستی بزنید.');
                } else {
                    alert('✅ فشرده‌سازی اعمال شد، اما دکمه پرینت پیدا نشد. لطفاً خودتان پرینت بگیرید.');
                }
            }, 500);
        }, 4000);
    }

    // ==================== ابزار ۲: چاپ گروهی هوشمند ====================
    function smartGroupPrint() {
        if (!smartGroupPrint.toString().includes('یوسف معصومی')) {
            alert('⚠️ این ابزار دستکاری شده است. نام سازنده حذف شده و ابزار غیرفعال شد.');
            return;
        }

        cleanupAllPanels();

        const TOP_SPACING = 10;

        function getGrade() {
            let gradeCells = document.querySelectorAll('td.btext, td[class*="btext"]');
            for (let cell of gradeCells) {
                let text = cell.innerText.trim();
                if (['اول', 'دوم', 'سوم', 'چهارم', 'پنجم', 'ششم', '1', '2', '3', '4', '5', '6'].includes(text)) {
                    return text;
                }
            }
            let headers = document.querySelectorAll('th');
            let gradeIndex = -1;
            for (let th of headers) {
                if (th.innerText.trim() === 'پایه' || th.innerText.trim() === 'پایه ') {
                    gradeIndex = Array.from(th.parentElement.children).indexOf(th);
                    break;
                }
            }
            if (gradeIndex !== -1) {
                let rows = document.querySelectorAll('table tbody tr');
                for (let row of rows) {
                    let cells = row.querySelectorAll('td');
                    if (cells.length > gradeIndex) {
                        let text = cells[gradeIndex].innerText.trim();
                        if (['اول', 'دوم', 'سوم', 'چهارم', 'پنجم', 'ششم', '1', '2', '3', '4', '5', '6'].includes(text)) {
                            return text;
                        }
                    }
                }
            }
            let pageTitle = document.title || '';
            if (pageTitle.includes('پایه اول') || pageTitle.includes('پایه ۱')) return 'اول';
            if (pageTitle.includes('پایه دوم') || pageTitle.includes('پایه ۲')) return 'دوم';
            if (pageTitle.includes('پایه سوم') || pageTitle.includes('پایه ۳')) return 'سوم';
            if (pageTitle.includes('پایه چهارم') || pageTitle.includes('پایه ۴')) return 'چهارم';
            if (pageTitle.includes('پایه پنجم') || pageTitle.includes('پایه ۵')) return 'پنجم';
            if (pageTitle.includes('پایه ششم') || pageTitle.includes('پایه ۶')) return 'ششم';
            return 'سوم';
        }

        function getBetweenSpacing(grade) {
            let g = grade ? grade.toString().trim() : '';
            if (g === 'اول' || g === '1' || g.includes('اول')) return 130;
            if (g === 'دوم' || g === '2' || g.includes('دوم')) return 100;
            if (g === 'ششم' || g === '6' || g.includes('ششم')) return 3;
            return 65;
        }

        function addSpacersToPage() {
            let tables = document.querySelectorAll('table');
            if (tables.length === 0) return false;
            let grade = getGrade();
            let betweenSpacing = getBetweenSpacing(grade);
            let comments = [];
            let iterator = document.createNodeIterator(document.body, NodeFilter.SHOW_COMMENT);
            let c;
            while (c = iterator.nextNode()) {
                if (c.nodeValue && c.nodeValue.includes('end ngRepeat') && c.nodeValue.includes('ksarnamehs')) {
                    comments.push(c);
                }
            }
            comments.forEach(function(comment, index) {
                if (index % 2 === 1) {
                    let topSpacer = document.createElement('div');
                    topSpacer.style.height = TOP_SPACING + 'px';
                    topSpacer.style.margin = '0';
                    topSpacer.style.padding = '0';
                    topSpacer.style.backgroundColor = 'transparent';
                    topSpacer.style.display = 'block';
                    topSpacer.style.pageBreakBefore = 'always';
                    comment.parentNode.insertBefore(topSpacer, comment.nextSibling);
                } else {
                    let spacer = document.createElement('div');
                    spacer.style.height = betweenSpacing + 'px';
                    spacer.style.margin = '15px 0';
                    spacer.style.padding = '0';
                    spacer.style.backgroundColor = 'transparent';
                    spacer.style.display = 'block';
                    comment.parentNode.insertBefore(spacer, comment.nextSibling);
                }
            });
            let firstTopSpacer = document.createElement('div');
            firstTopSpacer.style.height = TOP_SPACING + 'px';
            firstTopSpacer.style.margin = '0';
            firstTopSpacer.style.padding = '0';
            firstTopSpacer.style.backgroundColor = 'transparent';
            firstTopSpacer.style.display = 'block';
            let firstTable = tables[0];
            if (firstTable) {
                firstTable.parentNode.insertBefore(firstTopSpacer, firstTable);
            }
            return betweenSpacing;
        }

        let allCheckboxes = [...document.querySelectorAll('table input[type="checkbox"]')]
            .filter(cb => !cb.closest('thead'));

        if (!allCheckboxes.length) {
            alert('چک‌باکسی پیدا نشد!');
            return;
        }

        let checkedCheckboxes = [...document.querySelectorAll('table input[type="checkbox"]:checked')]
            .filter(cb => !cb.closest('thead'));

        let selectedCount;
        if (checkedCheckboxes.length > 0) {
            selectedCount = checkedCheckboxes.length;
            checkedCheckboxes.forEach(cb => {
                if (!cb.checked) cb.click();
            });
            alert(selectedCount + ' دانش‌آموز انتخاب شده‌اند.');
        } else {
            selectedCount = allCheckboxes.length;
            allCheckboxes.forEach(cb => {
                if (!cb.checked) cb.click();
            });
            alert(selectedCount + ' دانش‌آموز به صورت خودکار انتخاب شدند.');
        }

        let btn = [...document.querySelectorAll('button,input')]
            .find(el => el.innerText.includes('کارنامه برای رکوردهای انتخاب شده'));

        if (!btn) {
            alert('دکمه پیدا نشد!');
            return;
        }

        btn.click();

        setTimeout(function() {
            let usedSpacing = addSpacersToPage();
            setTimeout(function() {
                let printBtn = [...document.querySelectorAll('button,input')]
                    .find(el => el.innerText.includes('پرینت') || el.innerText.includes('چاپ'));
                if (printBtn) {
                    printBtn.style.outline = '3px solid #f5a623';
                    printBtn.style.outlineOffset = '2px';
                    printBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    alert('✅ فاصله ' + TOP_SPACING + 'px بالای هر صفحه و ' + usedSpacing + 'px بین کارنامه‌ها (هوشمند) اضافه شد.\n\n🖨️ لطفاً حالا دکمه پرینت را به صورت دستی بزنید.');
                } else {
                    alert('✅ فاصله‌ها اضافه شد، اما دکمه پرینت پیدا نشد. لطفاً خودتان پرینت بگیرید.');
                }
            }, 500);
        }, 4000);
    }

    // ==================== ابزار ۳: ساخت دفترچه تماس (نسخه API) ====================
    function contactBookExtractor() {
        if (!contactBookExtractor.toString().includes('یوسف معصومی')) {
            alert('⚠️ این ابزار دستکاری شده است. نام سازنده حذف شده و ابزار غیرفعال شد.');
            return;
        }

        cleanupAllPanels();

        if (document.getElementById('autoExtractPanel')) {
            document.getElementById('autoExtractPanel').remove();
        }

        const STORAGE_KEY = 'angular_students_data_v7';
        const DB_NAME = 'StudentsDB';
        const DB_VERSION = 1;
        let allStudents = [];
        let isRunning = false;
        let abortController = null;

        function sleep(ms) { return new Promise(function(resolve) { setTimeout(resolve, ms); }); }

        function escapeHtml(text) {
            var div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        function showNotification(text, duration) {
            if (duration === undefined) duration = 4000;
            var old = document.getElementById('autoNotif');
            if (old) old.remove();
            var notif = document.createElement('div');
            notif.id = 'autoNotif';
            notif.style.cssText = 'position:fixed;bottom:20px;left:20px;background:#1a1a2e;color:white;padding:12px 20px;border-radius:8px;z-index:9999999;font-family:Tahoma;font-size:13px;box-shadow:0 4px 12px rgba(0,0,0,0.3);max-width:350px;direction:rtl;transition:opacity 0.3s;';
            notif.textContent = text;
            notif.addEventListener('click', function() { notif.remove(); });
            document.body.appendChild(notif);
            if (duration !== 0) {
                setTimeout(function() {
                    notif.style.opacity = '0';
                    setTimeout(function() { if (notif.parentNode) notif.remove(); }, 300);
                }, duration);
            }
        }

        function makeDraggable(elmnt, handle) {
            var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
            handle.style.cursor = 'grab';
            handle.onmousedown = function(e) {
                e = e || window.event; e.preventDefault();
                pos3 = e.clientX; pos4 = e.clientY;
                document.onmouseup = function() { document.onmouseup = null; document.onmousemove = null; handle.style.cursor = 'grab'; };
                document.onmousemove = function(e) {
                    e = e || window.event; e.preventDefault();
                    pos1 = pos3 - e.clientX; pos2 = pos4 - e.clientY;
                    pos3 = e.clientX; pos4 = e.clientY;
                    elmnt.style.top = (elmnt.offsetTop - pos2) + 'px';
                    elmnt.style.left = (elmnt.offsetLeft - pos1) + 'px';
                };
                handle.style.cursor = 'grabbing';
            };
        }

        function openDB() {
            return new Promise(function(resolve, reject) {
                var request = indexedDB.open(DB_NAME, DB_VERSION);
                request.onerror = function() { reject(request.error); };
                request.onsuccess = function() { resolve(request.result); };
                request.onupgradeneeded = function(event) {
                    var db = event.target.result;
                    if (!db.objectStoreNames.contains('photos')) {
                        db.createObjectStore('photos', { keyPath: 'codemelli' });
                    }
                };
            });
        }

        async function savePhotoToDB(codemelli, base64Data) {
            if (!base64Data) return;
            try {
                var db = await openDB();
                var tx = db.transaction('photos', 'readwrite');
                var store = tx.objectStore('photos');
                store.put({ codemelli: codemelli, data: base64Data, timestamp: Date.now() });
                await new Promise(function(resolve, reject) { tx.oncomplete = resolve; tx.onerror = reject; });
                db.close();
            } catch (err) { console.warn('Failed to save photo:', err); }
        }

        async function getPhotoFromDB(codemelli) {
            try {
                var db = await openDB();
                var tx = db.transaction('photos', 'readonly');
                var store = tx.objectStore('photos');
                var result = await new Promise(function(resolve, reject) {
                    var req = store.get(codemelli);
                    req.onsuccess = function() { resolve(req.result); };
                    req.onerror = function() { reject(req.error); };
                });
                db.close();
                return result ? result.data : '';
            } catch (err) { return ''; }
        }

        function saveMetadata() {
            var metadata = allStudents.map(function(s) {
                return {
                    name: s.name, family: s.family, father: s.father,
                    codemelli: s.codemelli, birthDate: s.birthDate, grade: s.grade,
                    photoUrl: s.photoUrl, fatherPhone: s.fatherPhone,
                    motherPhone: s.motherPhone, shadPhone: s.shadPhone
                };
            });
            try { localStorage.setItem(STORAGE_KEY, JSON.stringify(metadata)); }
            catch (err) { showNotification('حافظه پر شد.'); }
        }

        function loadMetadata() {
            try {
                var data = localStorage.getItem(STORAGE_KEY);
                if (data) {
                    allStudents = JSON.parse(data).map(function(m) {
                        return Object.assign({}, m, { photo: '' });
                    });
                }
            } catch (err) { allStudents = []; }
        }

        function updatePanelUI(status) {
            status = status || '';
            var totalEl = document.getElementById('aeTotal');
            var msg = document.getElementById('aeStatus');
            if (!totalEl || !msg) return;
            totalEl.textContent = allStudents.length.toLocaleString('fa-IR');
            if (status) {
                msg.textContent = status;
                if (isRunning) {
                    msg.style.color = '#4472C4';
                } else if (status.includes('پایان') || status.includes('✅')) {
                    msg.style.color = '#10b981';
                } else {
                    msg.style.color = '#c62828';
                }
            } else {
                msg.textContent = 'آماده شروع...';
                msg.style.color = '#666';
            }
        }

        async function clearMemory() {
            if (confirm('آیا مطمئن هستید؟ تمام داده‌ها پاک خواهند شد.')) {
                try {
                    localStorage.removeItem(STORAGE_KEY);
                    var db = await openDB();
                    var tx = db.transaction('photos', 'readwrite');
                    tx.objectStore('photos').clear();
                    await new Promise(function(resolve, reject) { tx.oncomplete = resolve; tx.onerror = reject; });
                    db.close();
                    allStudents = [];
                    updatePanelUI();
                    showNotification('تمام داده‌ها پاک شدند.');
                } catch (err) { showNotification('خطا در پاک‌سازی داده‌ها'); }
            }
        }

        function stopExtraction() {
            if (isRunning) {
                isRunning = false;
                if (abortController) abortController.abort();
                showNotification('دستور توقف صادر شد.');
                updatePanelUI('متوقف شد');
            }
        }

        // ===== توابع کمکی =====
        function getToken() {
            try {
                var t = sessionStorage.getItem('token');
                if (t) return t;
            } catch(e) {}
            try {
                var t2 = localStorage.getItem('token');
                if (t2) return t2;
            } catch(e) {}
            return null;
        }

        function getClientId() {
            try {
                var c1 = localStorage.getItem('pages-client-id');
                if (c1) return c1;
            } catch(e) {}
            try {
                var c2 = sessionStorage.getItem('pages-client-id');
                if (c2) return c2;
            } catch(e) {}
            return 'mt1ag7vh-f9qt51vf-is5kslgz-am182rru-3pu0h0ne';
        }

        function normalizePhone(val) {
            if (val === null || val === undefined || val === '') return '';
            var s = String(val).trim().replace(/[^\d]/g, '');
            if (s.length === 10 && s.charAt(0) === '9') s = '0' + s;
            return s;
        }

        function gradeIdToName(gradeId) {
            var map = {
                1: 'اول',
                2: 'دوم',
                3: 'سوم',
                4: 'چهارم',
                5: 'پنجم',
                6: 'ششم'
            };
            return map[gradeId] || String(gradeId || '');
        }

        // ✅ تغییر ۱: تابع جدید برای خواندن فیلتر گرید
        function getGridFilter() {
            try {
                var gridEl = document.querySelector('.k-grid');
                if (!gridEl) return null;
                var grid = $(gridEl).data('kendoGrid');
                if (!grid) return null;
                var ds = grid.dataSource;
                var filter = ds.filter();

                if (!filter) return null;
                return filter;
            } catch (e) {
                console.warn('خطا در خواندن فیلتر گرید:', e);
                return null;
            }
        }

        // ✅ تغییر ۲: fetchAllStudentsFromAPI با پشتیبانی از فیلتر
        async function fetchAllStudentsFromAPI() {
            var pageSize = 500;
            var page = 1;
            var allFetched = [];
            var total = 0;
            var hasMore = true;

            var token = getToken();
            if (!token) {
                showNotification('❌ توکن پیدا نشد.');
                return [];
            }

            var clientId = getClientId();
            var gridFilter = getGridFilter();

            if (gridFilter) {
                console.log('📊 فیلتر گرید:', JSON.stringify(gridFilter));
                var filterDesc = 'نامشخص';
                try {
                    filterDesc = gridFilter.filters.map(function(f) { return f.field + '=' + f.value; }).join(', ');
                } catch(e) {}
                showNotification('📊 فیلتر فعال: ' + filterDesc);
            }

            while (hasMore && isRunning) {
                try {
                    var body = {
                        take: pageSize,
                        skip: (page - 1) * pageSize,
                        page: page,
                        pageSize: pageSize,
                        sort: [{ field: 'id', dir: 'asc' }]
                    };

                    if (gridFilter) {
                        body.filter = gridFilter;
                    }

                    var response = await fetch('/api/Student/GetStudentInfo', {
                        method: 'POST',
                        credentials: 'include',
                        headers: {
                            'Content-Type': 'application/json; charset=utf-8',
                            'Accept': 'application/json, text/javascript, */*; q=0.01',
                            'X-Requested-With': 'XMLHttpRequest',
                            'Authorization': 'Bearer ' + token,
                            'client-id': clientId
                        },
                        body: JSON.stringify(body)
                    });

                    if (!response.ok) {
                        throw new Error('HTTP ' + response.status);
                    }

                    var json = await response.json();
                    var items = (json.data && json.data.data) || json.data || [];

                    if (!Array.isArray(items) || items.length === 0) {
                        hasMore = false;
                        break;
                    }

                    if (json.data && json.data.total) {
                        total = json.data.total;
                    }

                    allFetched = allFetched.concat(items);

                    updatePanelUI('دریافت شد: ' + allFetched.length + (total ? ' از ' + total : ''));

                    if (items.length < pageSize) {
                        hasMore = false;
                    } else {
                        page++;
                    }

                    await sleep(200);

                } catch (e) {
                    console.error('خطا در دریافت صفحه ' + page + ':', e);
                    showNotification('❌ خطا در صفحه ' + page + ': ' + e.message);
                    hasMore = false;
                }
            }

            return allFetched;
        }

        // ✅ تغییر ۳: mapRecord با photoUrl کامل
        function mapRecord(item) {
            var path = item.path || '';
            var photoUrl = '';
            if (path) {
                if (path.indexOf('http') === 0) {
                    photoUrl = path;
                } else if (path.charAt(0) === '/') {
                    photoUrl = location.origin + path;
                } else {
                    photoUrl = location.origin + '/' + path;
                }
            }

            return {
                name: (item.firstName || '').trim(),
                family: (item.lastName || '').trim(),
                father: (item.fatherName || '').trim(),
                codemelli: String(item.nationalCode || '').trim(),
                birthDate: String(item.birthDate || '').trim(),
                grade: gradeIdToName(item.gradeTypeId),
                photoUrl: photoUrl,
                fatherPhone: normalizePhone(item.fatherMobileNumber),
                motherPhone: normalizePhone(item.motherMobileNumber),
                shadPhone: normalizePhone(item.studentMobileNumber)
            };
        }

        // ✅ تغییر ۴: fetchImageAsBase64 با URL درست
        async function fetchImageAsBase64(path, maxSize) {
            maxSize = maxSize || 220;
            if (!path) return '';

            var url = path;
            if (path.indexOf('http') !== 0) {
                if (path.charAt(0) === '/') {
                    url = location.origin + path;
                } else {
                    url = location.origin + '/' + path;
                }
            }

            return new Promise(function(resolve) {
                abortController = new AbortController();
                fetch(url, { credentials: 'include', signal: abortController.signal })
                    .then(function(response) {
                        if (!response.ok) throw new Error('HTTP ' + response.status);
                        return response.blob();
                    })
                    .then(function(blob) {
                        var img = new Image();
                        var objectUrl = URL.createObjectURL(blob);
                        img.onload = function() {
                            try {
                                var scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
                                var canvas = document.createElement('canvas');
                                canvas.width = Math.round(img.width * scale);
                                canvas.height = Math.round(img.height * scale);
                                canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
                                URL.revokeObjectURL(objectUrl);
                                resolve(canvas.toDataURL('image/jpeg', 0.75));
                            } catch (err) {
                                URL.revokeObjectURL(objectUrl);
                                resolve('');
                            }
                        };
                        img.onerror = function() {
                            URL.revokeObjectURL(objectUrl);
                            resolve('');
                        };
                        img.src = objectUrl;
                    })
                    .catch(function() { resolve(''); });
            });
        }

        async function startExtraction() {
            if (isRunning) {
                showNotification('عملیات در حال انجام است...');
                return;
            }

            isRunning = true;
            showNotification('شروع استخراج از API...');
            updatePanelUI('در حال دریافت اطلاعات...');

            try {
                var rawData = await fetchAllStudentsFromAPI();

                if (!isRunning) {
                    updatePanelUI('متوقف شد');
                    return;
                }

                if (rawData.length === 0) {
                    showNotification('❌ داده‌ای دریافت نشد.');
                    isRunning = false;
                    updatePanelUI('خطا');
                    return;
                }

                allStudents = rawData.map(mapRecord);
                saveMetadata();

                updatePanelUI('در حال دانلود عکس‌ها...');
                var photoCount = 0;

                for (var i = 0; i < allStudents.length; i++) {
                    if (!isRunning) {
                        updatePanelUI('متوقف شد');
                        return;
                    }

                    var s = allStudents[i];
                    if (s.photoUrl) {
                        updatePanelUI('دانلود عکس ' + (i + 1) + ' از ' + allStudents.length + ': ' + s.name + ' ' + s.family);
                        var base64 = await fetchImageAsBase64(s.photoUrl, 220);
                        if (base64) {
                            s.photo = base64;
                            await savePhotoToDB(s.codemelli, base64);
                            photoCount++;
                        }
                    }

                    if (i % 10 === 0) {
                        saveMetadata();
                    }
                }

                saveMetadata();
                updatePanelUI('✅ پایان کار');
                showNotification('استخراج پایان یافت! ' + allStudents.length + ' دانش‌آموز، ' + photoCount + ' عکس.', 0);

            } catch (e) {
                console.error(e);
                showNotification('❌ خطا: ' + e.message);
                updatePanelUI('خطا');
            }

            isRunning = false;
        }

        async function downloadHTML() {
            if (allStudents.length === 0) { alert('هیچ داده‌ای برای دانلود وجود ندارد!'); return; }
            showNotification('در حال ساخت فایل HTML...');

            for (var i = 0; i < allStudents.length; i++) {
                var student = allStudents[i];
                if (!student.photo) {
                    student.photo = await getPhotoFromDB(student.codemelli);
                }
            }

            var uniqueID = Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
            var studentsData = JSON.stringify(allStudents);

            var html = `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>پرونده دانش‌آموزان</title>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{--accent:#0f4c81;--accent2:#1a6fb5;--bg:#f2f5f9;--card-bg:#ffffff;--text:#1a1a2e;--muted:#6b7280;--border:#dde3ed;--father:#1d4ed8;--mother:#be185d;--shad:#065f46;--bar-h:56px;--gap:10px}
html,body{height:100%;font-family:Tahoma,"Segoe UI",Arial,sans-serif;background:var(--bg);color:var(--text);direction:rtl;overflow:hidden}
.topbar{position:fixed;top:0;right:0;left:0;height:var(--bar-h);background:var(--accent);display:flex;align-items:center;padding:0 14px;gap:10px;z-index:100;box-shadow:0 2px 8px rgba(0,0,0,.25)}
.search-wrap{flex:1;position:relative}
#searchInput{width:100%;height:36px;padding:0 38px 0 12px;border:none;border-radius:6px;font-family:inherit;font-size:14px;direction:rtl;background:rgba(255,255,255,.15);color:#fff;outline:none;transition:background .2s}
#searchInput::placeholder{color:rgba(255,255,255,.6)}
#searchInput:focus{background:rgba(255,255,255,.25)}
.search-icon{position:absolute;right:11px;top:50%;transform:translateY(-50%);color:rgba(255,255,255,.7);font-size:16px;pointer-events:none}
.nav-row{display:flex;align-items:center;gap:6px;flex-shrink:0}
.nav-btn{background:rgba(255,255,255,.18);color:#fff;border:none;width:34px;height:34px;border-radius:6px;cursor:pointer;font-size:17px;display:flex;align-items:center;justify-content:center;transition:background .15s}
.nav-btn:hover:not(:disabled){background:rgba(255,255,255,.32)}
.nav-btn:disabled{opacity:.3;cursor:not-allowed}
#counter{color:#fff;font-size:13px;font-weight:bold;min-width:70px;text-align:center;letter-spacing:.5px}
.page{position:fixed;top:var(--bar-h);bottom:0;right:0;left:0;padding:var(--gap);display:flex;flex-direction:column;gap:var(--gap);overflow:hidden}
.row-header{display:flex;align-items:center;gap:var(--gap);background:var(--card-bg);border-radius:10px;padding:10px 14px;border:1px solid var(--border);flex-shrink:0}
.photo-box{flex-shrink:0;width:clamp(64px,9vw,96px);height:clamp(64px,9vw,96px);border-radius:8px;overflow:hidden;background:var(--bg);border:2px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:clamp(28px,4vw,44px)}
.photo-box img{width:100%;height:100%;object-fit:cover}
.name-block{flex:1;min-width:0}
.student-index{font-size:11px;color:var(--muted);margin-bottom:3px}
.student-fullname{font-size:clamp(25px,4.5vw,40px);font-weight:bold;color:var(--accent);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.2}
.row-info{display:grid;grid-template-columns:repeat(3,1fr);gap:var(--gap);flex-shrink:0}
.info-cell{background:var(--accent);border-radius:8px;padding:8px 12px;display:flex;align-items:center;gap:10px;overflow:hidden}
.info-cell-icon{font-size:clamp(18px,2.5vw,26px);flex-shrink:0;opacity:.9}
.info-cell-body{min-width:0;flex:1}
.info-cell-label{font-size:10px;color:rgba(255,255,255,.65);margin-bottom:2px;white-space:nowrap}
.info-cell-value{font-size:clamp(13px,1.8vw,18px);font-weight:bold;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-family:"Courier New",monospace;letter-spacing:.5px}
.info-cell-value.rtl-val{font-family:Tahoma,sans-serif;letter-spacing:0}
.row-contact{flex:1;display:grid;gap:var(--gap);min-height:0}
.row-contact.cols-1{grid-template-columns:1fr}
.row-contact.cols-2{grid-template-columns:repeat(2,1fr)}
.row-contact.cols-3{grid-template-columns:repeat(3,1fr)}
.phone-card{border-radius:10px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;padding:10px;border:2px solid;min-height:0;position:relative;overflow:hidden}
.phone-card.father{background:#eff6ff;border-color:var(--father)}
.phone-card.mother{background:#fdf2f8;border-color:var(--mother)}
.phone-card.shad{background:#ecfdf5;border-color:var(--shad)}
.phone-icon{font-size:clamp(22px,3vw,36px);line-height:1}
.phone-type{font-size:clamp(11px,1.4vw,14px);font-weight:bold;display:flex;align-items:center;gap:6px}
.phone-card.father .phone-type{color:var(--father)}
.phone-card.mother .phone-type{color:var(--mother)}
.phone-card.shad .phone-type{color:var(--shad)}
.shad-tag{background:var(--shad);color:#fff;font-size:10px;padding:1px 7px;border-radius:20px}
.phone-number{direction:ltr;font-family:"Courier New",monospace;font-size:clamp(28px,5vw,55px);font-weight:bold;letter-spacing:2px;line-height:1.1}
.phone-card.father .phone-number{color:var(--father)}
.phone-card.mother .phone-number{color:var(--mother)}
.phone-card.shad .phone-number{color:var(--shad)}
.empty-contact{display:flex;align-items:center;justify-content:center;font-size:16px;color:var(--muted);height:100%;background:var(--card-bg);border-radius:10px;border:1px dashed var(--border)}
.no-result{display:flex;align-items:center;justify-content:center;height:100%;font-size:18px;color:var(--muted)}
@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
.animate{animation:fadeUp .3s ease-out forwards}
@media(max-width:480px){.row-contact.cols-2,.row-contact.cols-3{grid-template-columns:1fr}.phone-card{flex-direction:row;justify-content:flex-start;padding:10px 14px;gap:12px}.phone-number{font-size:clamp(20px,7vw,30px)}}
</style>
</head>
<body>
<div class="topbar">
<div class="search-wrap"><span class="search-icon">🔍</span><input type="text" id="searchInput" placeholder="جستجو: نام، کد ملی، شماره..." oninput="doSearch()"></div>
<div class="nav-row"><button class="nav-btn" id="prevBtn" onclick="navigate(-1)">→</button><span id="counter"></span><button class="nav-btn" id="nextBtn" onclick="navigate(1)">←</button></div>
</div>
<div class="page" id="mainPage"></div>
<script>
var students=${studentsData};
var filtered=students.slice();
var idx=0;
function toFa(n){return String(n).replace(/\\d/g,function(d){return"۰۱۲۳۴۵۶۷۸۹"[d]});}
function normNum(s){if(!s)return"";return String(s).replace(/[\\u200c\\u200d]/g," ").replace(/[\\u064b-\\u065f\\u0670\\u0674]/g,"").replace(/[\\u064a\\u0626\\u0649]/g,"ی").replace(/\\u0643/g,"ک").replace(/\\u0629/g,"ه").replace(/\\u0624/g,"و").replace(/[\\u0623\\u0625\\u0622]/g,"ا").replace(/[۰-۹]/g,function(d){return"۰۱۲۳۴۵۶۷۸۹".indexOf(d).toString()}).replace(/[۰-۹]/g,function(d){return"۰۱۲۳۴۵۶۷۸۹".indexOf(d).toString()}).replace(/\\s+/g," ").trim();}
function esc(t){if(!t)return"";var d=document.createElement("div");d.textContent=t;return d.innerHTML;}
function fmtPhone(p){if(!p||p.length===0)return"";return p.length<=3?p:p.slice(0,3)+"-"+p.slice(3);}
function getGradeFullName(grade) {
  if (!grade) return 'پایه نامشخص';
  var gradeMap = {'1':'اول','2':'دوم','3':'سوم','4':'چهارم','5':'پنجم','6':'ششم'};
  var num = parseInt(grade);
  if (!isNaN(num) && gradeMap[num]) { return 'پایه ' + gradeMap[num] + ' ابتدایی'; }
  var textMap = {'اول':'اول','دوم':'دوم','سوم':'سوم','چهارم':'چهارم','پنجم':'پنجم','ششم':'ششم'};
  var cleaned = grade.trim();
  if (textMap[cleaned]) { return 'پایه ' + textMap[cleaned] + ' ابتدایی'; }
  return grade;
}
function buildPhones(s){var fp=s.fatherPhone||"",mp=s.motherPhone||"",sp=s.shadPhone||"",cards=[];var sfF=sp&&fp&&sp===fp,sfM=sp&&mp&&sp===mp;if(sfF){cards.push({cls:"father",icon:"👨",label:"پدر",shad:true,num:fp});if(mp)cards.push({cls:"mother",icon:"👩",label:"مادر",shad:false,num:mp});}else if(sfM){if(fp)cards.push({cls:"father",icon:"👨",label:"پدر",shad:false,num:fp});cards.push({cls:"mother",icon:"👩",label:"مادر",shad:true,num:mp});}else{if(fp)cards.push({cls:"father",icon:"👨",label:"پدر",shad:false,num:fp});if(mp)cards.push({cls:"mother",icon:"👩",label:"مادر",shad:false,num:mp});if(sp)cards.push({cls:"shad",icon:"📱",label:"شاد",shad:false,num:sp});}return cards;}
function render(){var page=document.getElementById("mainPage");page.classList.remove("animate");void page.offsetWidth;page.classList.add("animate");if(filtered.length===0){page.innerHTML="<div class=\\"no-result\\">نتیجه‌ای یافت نشد 🔍</div>";document.getElementById("counter").textContent="";document.getElementById("prevBtn").disabled=true;document.getElementById("nextBtn").disabled=true;return;}var s=filtered[idx],phones=buildPhones(s),colsCls=phones.length<=1?"cols-1":phones.length===2?"cols-2":"cols-3";var imgSrc = s.photo || s.photoUrl || "";var photoHtml = imgSrc ? "<img src=\\""+esc(imgSrc)+"\\" alt=\\"\\">" : "👤";if(s.photoUrl){photoHtml="<a href=\\""+esc(s.photoUrl)+"\\" target=\\"_blank\\" title=\\"مشاهده تصویر اصلی\\">"+photoHtml+"</a>";}var phoneCards=phones.length===0?"<div class=\\"empty-contact\\">اطلاعات تماسی ثبت نشده</div>":phones.map(function(p){return"<div class=\\"phone-card "+p.cls+"\\"><div class=\\"phone-icon\\">"+p.icon+"</div><div class=\\"phone-type\\">"+esc(p.label)+(p.shad?"<span class=\\"shad-tag\\">شاد</span>":"")+"</div><div class=\\"phone-number\\">"+fmtPhone(p.num)+"</div></div>";}).join("");var gradeFullName=getGradeFullName(s.grade);page.innerHTML="<div class=\\"row-header\\"><div class=\\"name-block\\"><div class=\\"student-index\\">دانش‌آموز "+toFa(idx+1)+" از "+toFa(filtered.length)+"</div><div class=\\"student-fullname\\">"+esc(s.name)+" "+esc(s.family)+" - "+esc(gradeFullName)+"</div></div><div class=\\"photo-box\\">"+photoHtml+"</div></div><div class=\\"row-info\\"><div class=\\"info-cell\\"><div class=\\"info-cell-icon\\">👨</div><div class=\\"info-cell-body\\"><div class=\\"info-cell-label\\">نام پدر</div><div class=\\"info-cell-value rtl-val\\">"+esc(s.father||"---")+"</div></div></div><div class=\\"info-cell\\"><div class=\\"info-cell-icon\\">🆔</div><div class=\\"info-cell-body\\"><div class=\\"info-cell-label\\">کد ملی</div><div class=\\"info-cell-value\\">"+esc(s.codemelli||"---")+"</div></div></div><div class=\\"info-cell\\"><div class=\\"info-cell-icon\\">📅</div><div class=\\"info-cell-body\\"><div class=\\"info-cell-label\\">تاریخ تولد</div><div class=\\"info-cell-value rtl-val\\">"+esc(s.birthDate||"---")+"</div></div></div></div><div class=\\"row-contact "+colsCls+"\\">"+phoneCards+"</div>";var ctr=document.getElementById("counter");document.getElementById("prevBtn").disabled=(idx===0);document.getElementById("nextBtn").disabled=(idx===filtered.length-1);ctr.textContent=filtered.length>1?toFa(idx+1)+" / "+toFa(filtered.length):"";addEditButtons();}
function navigate(dir){var n=idx+dir;if(n>=0&&n<filtered.length){idx=n;render();}}
function doSearch(){var q=normNum(document.getElementById("searchInput").value.trim()).toLowerCase();filtered=q?students.filter(function(s){return normNum((s.name||"")+" "+(s.family||"")+" "+(s.father||"")+" "+(s.codemelli||"")+" "+(s.fatherPhone||"")+" "+(s.motherPhone||"")+" "+(s.shadPhone||"")+" "+(s.grade||"")).toLowerCase().includes(q);}):students.slice();idx=0;render();}
document.addEventListener("keydown",function(e){if(document.activeElement===document.getElementById("searchInput"))return;if(e.key==="ArrowRight")navigate(-1);if(e.key==="ArrowLeft")navigate(1);if((e.ctrlKey||e.metaKey)&&e.key==="f"){e.preventDefault();document.getElementById("searchInput").focus();}});
document.addEventListener("wheel",function(e){if(document.activeElement===document.getElementById("searchInput"))return;if(e.deltaY>0){navigate(1);}else if(e.deltaY<0){navigate(-1);}},{passive:true});
render();
<\/script>
<style>
.modal-overlay{position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.55);z-index:1000;display:none;align-items:center;justify-content:center}
.modal-box{background:#fff;border-radius:12px;padding:22px;width:90%;max-width:520px;max-height:90vh;overflow-y:auto;direction:rtl;box-shadow:0 10px 40px rgba(0,0,0,0.4);font-family:Tahoma,Arial,sans-serif;color:#1a1a2e}
.modal-box h3{margin:0 0 16px;color:#0f4c81;font-size:18px;text-align:center}
.modal-form{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.form-group{display:flex;flex-direction:column;gap:4px}
.form-group label{font-size:12px;color:#555;font-weight:bold}
.form-group input{height:34px;padding:0 10px;border:1px solid #ccc;border-radius:6px;font-family:inherit;font-size:13px}
.form-group input:focus{outline:none;border-color:#0f4c81}
.modal-actions{grid-column:1/-1;display:flex;gap:10px;margin-top:14px;justify-content:center}
.modal-actions button{padding:10px 20px;border:none;border-radius:6px;cursor:pointer;font-weight:bold;font-family:inherit}
.btn-save{background:#10b981;color:#fff}
.btn-cancel{background:#ef4444;color:#fff}
.edit-student-btn{margin-right:auto;background:#fff;color:#0f4c81;border:1px solid #0f4c81;border-radius:6px;width:36px;height:36px;cursor:pointer;font-size:16px;flex-shrink:0}
@media(max-width:480px){.modal-form{grid-template-columns:1fr}}
</style>
<div id="modalOverlay" class="modal-overlay" style="display:none;">
<div class="modal-box">
<h3 id="modalTitle">افزودن دانش‌آموز</h3>
<div class="modal-form">
<div class="form-group"><label>نام</label><input type="text" id="f_name"></div>
<div class="form-group"><label>نام خانوادگی</label><input type="text" id="f_family"></div>
<div class="form-group"><label>نام پدر</label><input type="text" id="f_father"></div>
<div class="form-group"><label>کد ملی</label><input type="text" id="f_codemelli"></div>
<div class="form-group"><label>تاریخ تولد</label><input type="text" id="f_birthDate" placeholder="مثلا 1390/01/01"></div>
<div class="form-group"><label>پایه</label><input type="text" id="f_grade" placeholder="اول تا ششم"></div>
<div class="form-group"><label>تلفن پدر</label><input type="tel" id="f_fatherPhone"></div>
<div class="form-group"><label>تلفن مادر</label><input type="tel" id="f_motherPhone"></div>
<div class="form-group"><label>تلفن شاد</label><input type="tel" id="f_shadPhone"></div>
<div class="form-group" style="grid-column:1/-1;"><label>آدرس عکس (اختیاری)</label><input type="text" id="f_photo" placeholder="https://..."></div>
<div class="modal-actions">
<button class="btn-save" onclick="saveStudent()">ذخیره</button>
<button class="btn-cancel" onclick="closeModal()">انصراف</button>
</div>
</div>
</div>
</div>
<script>
var PHONEBOOK_STORAGE_KEY = "phonebook_students_${uniqueID}";
var editingIndex = null;
var originalRender = render;
render = function() {
  originalRender();
  addEditButtons();
};
function addEditButtons() {
  var rowHeader = document.querySelector(".row-header");
  if (!rowHeader) return;
  var existing = rowHeader.querySelector(".edit-student-btn");
  if (existing) existing.remove();
  var currentIdx = idx;
  var btn = document.createElement("button");
  btn.className = "edit-student-btn";
  btn.title = "ویرایش دانش‌آموز";
  btn.textContent = "✏️";
  btn.onclick = function() { openEdit(currentIdx); };
  rowHeader.appendChild(btn);
}
function openAdd() {
  editingIndex = null;
  document.getElementById("modalTitle").textContent = "افزودن دانش‌آموز";
  clearForm();
  document.getElementById("modalOverlay").style.display = "flex";
}
function openEdit(filteredIdx) {
  var s = filtered[filteredIdx];
  if (!s) return;
  editingIndex = students.indexOf(s);
  if (editingIndex === -1) editingIndex = null;
  document.getElementById("modalTitle").textContent = "ویرایش دانش‌آموز";
  document.getElementById("f_name").value = s.name || "";
  document.getElementById("f_family").value = s.family || "";
  document.getElementById("f_father").value = s.father || "";
  document.getElementById("f_codemelli").value = s.codemelli || "";
  document.getElementById("f_birthDate").value = s.birthDate || "";
  document.getElementById("f_grade").value = s.grade || "";
  document.getElementById("f_fatherPhone").value = s.fatherPhone || "";
  document.getElementById("f_motherPhone").value = s.motherPhone || "";
  document.getElementById("f_shadPhone").value = s.shadPhone || "";
  document.getElementById("f_photo").value = s.photoUrl || "";
  document.getElementById("modalOverlay").style.display = "flex";
}
function clearForm() {
  var ids = ["f_name", "f_family", "f_father", "f_codemelli", "f_birthDate", "f_grade", "f_fatherPhone", "f_motherPhone", "f_shadPhone", "f_photo"];
  for (var i = 0; i < ids.length; i++) {
    document.getElementById(ids[i]).value = "";
  }
}
function closeModal() {
  document.getElementById("modalOverlay").style.display = "none";
}
function digitsOnly(s) {
  var result = "";
  for (var i = 0; i < s.length; i++) {
    var c = s.charAt(i);
    if (c >= "0" && c <= "9") result += c;
  }
  return result;
}
function saveStudent() {
  var name = document.getElementById("f_name").value.trim();
  var family = document.getElementById("f_family").value.trim();
  var father = document.getElementById("f_father").value.trim();
  var codemelli = document.getElementById("f_codemelli").value.trim();
  var birthDate = document.getElementById("f_birthDate").value.trim();
  var grade = document.getElementById("f_grade").value.trim();
  var fatherPhone = digitsOnly(document.getElementById("f_fatherPhone").value.trim());
  var motherPhone = digitsOnly(document.getElementById("f_motherPhone").value.trim());
  var shadPhone = digitsOnly(document.getElementById("f_shadPhone").value.trim());
  var photoUrl = document.getElementById("f_photo").value.trim();

  if (!name || !family || !codemelli) {
    alert("نام، نام خانوادگی و کد ملی الزامی است.");
    return;
  }

  var obj = {
    name: name,
    family: family,
    father: father,
    codemelli: codemelli,
    birthDate: birthDate,
    grade: grade,
    photoUrl: photoUrl,
    photo: "",
    fatherPhone: fatherPhone,
    motherPhone: motherPhone,
    shadPhone: shadPhone
  };

  if (editingIndex === null) {
    students.push(obj);
    idx = students.length - 1;
  } else {
    students[editingIndex] = obj;
    idx = editingIndex;
  }

  document.getElementById("searchInput").value = "";
  filtered = students.slice();
  persist();
  closeModal();
  render();
}
function persist() {
  try {
    localStorage.setItem(PHONEBOOK_STORAGE_KEY, JSON.stringify(students));
  } catch (e) {}
}
function loadStoredData() {
  try {
    var stored = localStorage.getItem(PHONEBOOK_STORAGE_KEY);
    if (stored) {
      students = JSON.parse(stored);
      filtered = students.slice();
      idx = 0;
    }
  } catch (e) {}
}

var addBtn = document.createElement("button");
addBtn.className = "nav-btn";
addBtn.id = "addBtn";
addBtn.title = "افزودن دانش‌آموز";
addBtn.textContent = "➕";
addBtn.onclick = openAdd;
var navRow = document.querySelector(".nav-row");
if (navRow) { navRow.appendChild(addBtn); }

document.getElementById("modalOverlay").addEventListener("click", function(e) {
  if (e.target === this) closeModal();
});

loadStoredData();
render();
<\/script>
</body>
</html>`;

            var blob = new Blob([html], { type: 'text/html;charset=utf-8' });
            var url = URL.createObjectURL(blob);
            var link = document.createElement('a');
            link.href = url;
            link.download = 'پرونده_دانش_آموزان.html';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setTimeout(function() { URL.revokeObjectURL(url); }, 1000);
            showNotification('فایل HTML با موفقیت دانلود شد!');
        }

        function createPanel() {
            var panel = document.createElement('div');
            panel.id = 'autoExtractPanel';
            panel.style.cssText = 'position:fixed;top:20px;left:20px;background:white;border:2px solid #0f4c81;border-radius:10px;padding:15px;width:320px;z-index:999999;box-shadow:0 4px 20px rgba(0,0,0,0.2);font-family:Tahoma,sans-serif;direction:rtl;font-size:13px;color:#333;';
            panel.innerHTML = '<div id="aeHeader" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;padding-bottom:10px;border-bottom:2px solid #0f4c81;user-select:none;"><strong style="color:#0f4c81;font-size:15px;">📋 دفترچه تماس (API)</strong><button id="btnClose" style="background:none;border:none;cursor:pointer;font-size:18px;color:#999;">✕</button></div><div style="background:#f0f6ff;padding:12px;border-radius:8px;margin-bottom:12px;text-align:center;"><div style="font-size:12px;color:#666;">تعداد دانش‌آموزان:</div><div id="aeTotal" style="font-size:28px;font-weight:bold;color:#0f4c81;">0</div><div id="aeStatus" style="font-size:11px;color:#666;margin-top:5px;">آماده شروع...</div></div><div style="display:flex;flex-direction:column;gap:8px;"><div style="display:flex;gap:8px;"><button id="btnStart" style="flex:1;background:#0f4c81;color:white;border:none;padding:10px;border-radius:6px;cursor:pointer;font-family:inherit;font-weight:bold;">▶️ شروع</button><button id="btnStop" style="flex:1;background:#ef4444;color:white;border:none;padding:10px;border-radius:6px;cursor:pointer;font-family:inherit;font-weight:bold;">⛔ توقف</button></div><button id="btnDownload" style="background:#10b981;color:white;border:none;padding:10px;border-radius:6px;cursor:pointer;font-family:inherit;font-weight:bold;">📥 دانلود فایل HTML نهایی</button><button id="btnClear" style="background:#fff;color:#c62828;border:1px solid #c62828;padding:8px;border-radius:6px;cursor:pointer;font-family:inherit;font-size:12px;margin-top:5px;">🗑️ پاک‌سازی حافظه</button></div><div style="margin-top:10px;font-size:11px;color:#666;text-align:center;border-top:1px solid #eee;padding-top:8px;">⚡ دریافت از API — سریع‌تر و دقیق‌تر</div>';
            document.body.appendChild(panel);
            makeDraggable(panel, document.getElementById('aeHeader'));
            document.getElementById('btnClose').addEventListener('click', function() { panel.remove(); });
            document.getElementById('btnStart').addEventListener('click', startExtraction);
            document.getElementById('btnStop').addEventListener('click', stopExtraction);
            document.getElementById('btnDownload').addEventListener('click', downloadHTML);
            document.getElementById('btnClear').addEventListener('click', clearMemory);
        }

        function init() {
            loadMetadata();
            createPanel();
            updatePanelUI();
            showNotification('پنل آماده است. دکمه "شروع" را بزنید.');
        }
        init();
    }
    // ==================== ابزار ۴: آپلود خودکار عکس دانش‌آموزان ====================
    function photoUploadTool() {
        /* طراح: یوسف معصومی - شاغل در آموزش و پرورش ناحیه ۳ تبریز */
        if (!photoUploadTool.toString().includes('یوسف معصومی') || !photoUploadTool.toString().includes('ناحیه ۳ تبریز')) {
            alert('⚠️ این ابزار دستکاری شده است. نام سازنده حذف شده و ابزار غیرفعال شد.');
            return;
        }

        cleanupAllPanels();

        if (document.getElementById('uploadPanel')) {
            document.getElementById('uploadPanel').remove();
        }

        let isRunning = false;
        let isPaused = false;
        let isStopped = false;
        let photoFiles = [];
        let currentPageStudents = [];
        let currentIndex = 0;
        let totalProcessed = 0;
        let totalSkipped = 0;
        let currentPage = 1;
        let isProcessingPage = false;

        function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

        function showNotification(text, duration) {
            duration = duration || 5000;
            let old = document.getElementById('uploadNotif');
            if (old) old.remove();
            let notif = document.createElement('div');
            notif.id = 'uploadNotif';
            notif.style.cssText = 'position:fixed;bottom:20px;left:20px;background:#1a1a2e;color:white;padding:12px 20px;border-radius:8px;z-index:9999999;font-family:Tahoma,sans-serif;font-size:13px;box-shadow:0 4px 12px rgba(0,0,0,0.3);max-width:350px;direction:rtl;';
            notif.textContent = text;
            notif.addEventListener('click', () => notif.remove());
            document.body.appendChild(notif);
            if (duration !== 0) {
                setTimeout(() => { if (notif.parentNode) notif.remove(); }, duration);
            }
        }

        function findNextPageButton() {
            let spanElements = document.querySelectorAll('span.k-icon.k-i-arrow-e');
            if (spanElements.length > 0) {
                let btn = spanElements[0];
                if (!btn.closest('.k-state-disabled')) return btn;
            }
            let allElements = document.querySelectorAll('span, a, button, div');
            for (let el of allElements) {
                if (el.textContent && el.textContent.trim() === 'بعدی') {
                    if (!el.closest('.k-state-disabled')) return el;
                }
            }
            let buttons = document.querySelectorAll('button, a, span');
            for (let btn of buttons) {
                let ariaLabel = btn.getAttribute('aria-label') || '';
                let title = btn.getAttribute('title') || '';
                if ((ariaLabel.includes('بعدی') || title.includes('بعدی')) && !btn.closest('.k-state-disabled')) return btn;
            }
            return null;
        }

        function hasNextPage() {
            let nextBtn = findNextPageButton();
            if (nextBtn) {
                let isDisabled = nextBtn.closest('.k-state-disabled') || nextBtn.hasAttribute('disabled') || nextBtn.classList.contains('disabled');
                return !isDisabled;
            }
            return false;
        }

        async function goToNextPage() {
            let nextBtn = findNextPageButton();
            if (!nextBtn) return false;
            nextBtn.click();
            await sleep(4000);
            currentPage++;
            return true;
        }

        function findStudentsWithoutPhotoInPage() {
            let rows = document.querySelectorAll('tbody tr');
            let students = [];
            rows.forEach(function(row, i) {
                let cells = row.querySelectorAll('td');
                if (cells.length < 4) return;
                let img = cells[1] ? cells[1].querySelector('img') : null;
                let hasPhoto = img && !img.src.includes('thumb_default.jpg');
                if (!hasPhoto) {
                    let nationalCode = cells[2] ? cells[2].innerText.trim().replace(/[^0-9]/g, '') : '';
                    let editBtn = cells[cells.length - 1] ? cells[cells.length - 1].querySelector('button, a') : null;
                    if (editBtn && nationalCode && nationalCode.length > 0) {
                        students.push({
                            code: nationalCode,
                            name: cells[3] ? cells[3].innerText.trim() : '',
                            family: cells[4] ? cells[4].innerText.trim() : '',
                            btn: editBtn
                        });
                    }
                }
            });
            return students;
        }

        function findEditButtonByCode(codemelli) {
            let rows = document.querySelectorAll('tbody tr');
            for (let row of rows) {
                let cells = row.querySelectorAll('td');
                if (cells.length < 4) continue;
                let nationalCode = cells[2] ? cells[2].innerText.trim().replace(/[^0-9]/g, '') : '';
                if (nationalCode === codemelli) {
                    let editBtn = cells[cells.length - 1] ? cells[cells.length - 1].querySelector('button, a') : null;
                    if (editBtn) return editBtn;
                }
            }
            return null;
        }

        function selectPhotoFolder() {
            return new Promise(function(resolve) {
                let input = document.createElement('input');
                input.type = 'file';
                input.webkitdirectory = true;
                input.multiple = true;
                input.accept = 'image/*';
                input.style.cssText = 'position:fixed;top:-100px;left:0;opacity:0;pointer-events:none;display:block;';
                document.body.appendChild(input);

                let done = false;
                const finish = (result) => {
                    if (done) return;
                    done = true;
                    window.removeEventListener('focus', onFocus);
                    setTimeout(() => { try { input.remove(); } catch (e) {} }, 100);
                    resolve(result);
                };

                const onFocus = () => {
                    setTimeout(() => finish([]), 1500);
                };

                input.onchange = function(e) {
                    let files = Array.from(e.target.files || []);
                    let images = files.filter(function(f) { return f.type.startsWith('image/'); });
                    console.log('📸 تعداد تصاویر:', images.length);
                    photoFiles = images;
                    finish(images);
                };

                input.addEventListener('cancel', () => finish([]));
                input.click();
                window.addEventListener('focus', onFocus);
            });
        }

        function findPhotoFile(codemelli) {
            if (!photoFiles || photoFiles.length === 0) return null;
            for (let file of photoFiles) {
                let name = file.name.toLowerCase();
                if (name.includes(codemelli)) return file;
                let cleanName = name.replace(/[^0-9]/g, '');
                if (cleanName.includes(codemelli)) return file;
            }
            return null;
        }

        async function closeModal() {
            try {
                let closeBtn = Array.from(document.querySelectorAll('button, a, span'))
                    .find(function(el) {
                        var text = el.textContent ? el.textContent.trim() : '';
                        return text === 'انصراف' || text.includes('لغو') || text.includes('بستن') || text.includes('Close') || text.includes('Cancel');
                    });
                if (closeBtn) { closeBtn.click(); await sleep(1500); return true; }
                let closeX = document.querySelector('.modal-close, .close, [data-dismiss="modal"]');
                if (closeX) { closeX.click(); await sleep(1500); return true; }
                let backdrop = document.querySelector('.modal-backdrop, .modal-overlay');
                if (backdrop) { backdrop.click(); await sleep(1500); return true; }
                return false;
            } catch (err) {
                console.error('خطا در بستن مودال:', err);
                return false;
            }
        }

        async function uploadPhotoForStudent(student) {
            var modalClosed = false;
            try {
                var editBtn = student.btn;
                if (!document.contains(editBtn)) {
                    editBtn = findEditButtonByCode(student.code);
                    if (!editBtn) {
                        showNotification('❌ دکمه ویرایش برای کد ملی ' + student.code + ' پیدا نشد');
                        return false;
                    }
                    student.btn = editBtn;
                }
                editBtn.click();
                await sleep(3000);

                var editPhotoBtn = null;
                var buttons = document.querySelectorAll('button, a, span');
                for (var btn of buttons) {
                    var text = btn.textContent ? btn.textContent.trim() : '';
                    if (text.includes('ویرایش عکس') || text.includes('تغییر عکس') || text.includes('آپلود عکس') || text.includes('انتخاب عکس')) {
                        editPhotoBtn = btn;
                        break;
                    }
                }
                if (editPhotoBtn) {
                    editPhotoBtn.click();
                    await sleep(2000);
                }

                var photoFile = findPhotoFile(student.code);
                if (!photoFile) {
                    console.log('⚠️ عکس برای کد ملی ' + student.code + ' پیدا نشد');
                    await closeModal();
                    modalClosed = true;
                    return false;
                }

                var fileInput = document.querySelector('input[type="file"][accept*="image"]') || document.querySelector('input[type="file"]');
                if (!fileInput) {
                    showNotification('❌ فیلد آپلود عکس پیدا نشد');
                    await closeModal();
                    modalClosed = true;
                    return false;
                }

                var dataTransfer = new DataTransfer();
                dataTransfer.items.add(photoFile);
                fileInput.files = dataTransfer.files;
                fileInput.dispatchEvent(new Event('change', { bubbles: true }));
                fileInput.dispatchEvent(new Event('input', { bubbles: true }));
                await sleep(3000);

                var confirmBtn = null;
                var allButtons = document.querySelectorAll('button, span, a');
                for (var btn of allButtons) {
                    var text = btn.textContent ? btn.textContent.trim() : '';
                    if (text.includes('اعتبار سنجی و تایید') || text.includes('اعتبارسنجی') || text.includes('تایید') || text.includes('ذخیره') || text.includes('ثبت')) {
                        confirmBtn = btn;
                        break;
                    }
                }
                if (confirmBtn) {
                    confirmBtn.click();
                    await sleep(4000);
                } else {
                    showNotification('⚠️ دکمه تایید پیدا نشد');
                    await closeModal();
                    modalClosed = true;
                    return false;
                }
                await sleep(2000);
                await closeModal();
                modalClosed = true;
                await sleep(2000);
                return true;
            } catch (err) {
                console.error('خطا:', err);
                if (!modalClosed) await closeModal();
                return false;
            }
        }

        async function processCurrentPage() {
            if (!isRunning || isPaused || isStopped) return;

            currentPageStudents = findStudentsWithoutPhotoInPage();
            if (currentPageStudents.length === 0) {
                showNotification('📄 صفحه ' + currentPage + ': همه عکس دارند.');
                if (hasNextPage()) {
                    await goToNextPage();
                    if (isRunning && !isPaused && !isStopped) await processCurrentPage();
                } else {
                    isRunning = false;
                    isProcessingPage = false;
                    updatePanelButtons();
                    setStatus('✅ پردازش کامل شد!');
                    showNotification('🎉 ' + totalProcessed + ' آپلود شد | ' + totalSkipped + ' صرف‌نظر شد');
                }
                return;
            }

            currentIndex = 0;
            while (currentIndex < currentPageStudents.length && isRunning && !isPaused && !isStopped) {
                var student = currentPageStudents[currentIndex];
                setStatus('⏳ صفحه ' + currentPage + ' - ' + (currentIndex + 1) + '/' + currentPageStudents.length);
                var el = document.getElementById('currentStudent');
                if (el) el.textContent = 'صفحه ' + currentPage + ': ' + student.name + ' ' + student.family + ' (' + student.code + ')';

                var success = await uploadPhotoForStudent(student);

                if (isStopped || !isRunning) break;

                if (success) {
                    totalProcessed++;
                    showNotification('✅ ' + student.name + ' ' + student.family + ' آپلود شد.');
                } else {
                    var photoFile = findPhotoFile(student.code);
                    if (!photoFile) {
                        totalSkipped++;
                        showNotification('⏭️ ' + student.name + ' ' + student.family + ' - عکس پیدا نشد', 3000);
                    } else {
                        showNotification('⚠️ خطا در آپلود ' + student.name + ' ' + student.family);
                    }
                }
                document.getElementById('processedStudents').textContent = totalProcessed;
                document.getElementById('skippedStudents').textContent = totalSkipped;
                currentIndex++;
                await sleep(2000);
            }

            if (isStopped) {
                isRunning = false;
                isProcessingPage = false;
                updatePanelButtons();
                setStatus('⛔ متوقف شد');
                return;
            }
            if (!isRunning || isPaused) return;

            if (hasNextPage()) {
                await goToNextPage();
                if (isRunning && !isPaused && !isStopped) await processCurrentPage();
            } else {
                isRunning = false;
                isProcessingPage = false;
                updatePanelButtons();
                setStatus('✅ پردازش کامل شد!');
                showNotification('🎉 ' + totalProcessed + ' آپلود شد | ' + totalSkipped + ' صرف‌نظر شد');
            }
        }

        async function startUpload() {
            if (isRunning) {
                if (isPaused) {
                    isPaused = false;
                    isStopped = false;
                    document.getElementById('btnPause').textContent = '⏸️ مکث';
                    showNotification('▶️ ادامه...');
                    if (isProcessingPage) await processCurrentPage();
                }
                return;
            }
            if (photoFiles.length === 0) {
                showNotification('📁 لطفاً پوشه حاوی عکس‌ها را انتخاب کنید...');
                await selectPhotoFolder();
                if (photoFiles.length === 0) {
                    alert('هیچ عکسی انتخاب نشد!');
                    return;
                }
                showNotification('✅ ' + photoFiles.length + ' عکس بارگذاری شد.');
            }
            isRunning = true;
            isPaused = false;
            isStopped = false;
            isProcessingPage = true;
            currentPage = 1;
            totalProcessed = 0;
            totalSkipped = 0;
            document.getElementById('totalStudents').textContent = '...';
            document.getElementById('processedStudents').textContent = '0';
            document.getElementById('skippedStudents').textContent = '0';
            updatePanelButtons();
            setStatus('⏳ در حال پردازش...');
            await processCurrentPage();
        }

        function togglePause() {
            if (!isRunning) return;
            isPaused = !isPaused;
            document.getElementById('btnPause').textContent = isPaused ? '▶️ ادامه' : '⏸️ مکث';
            setStatus(isPaused ? '⏸️ متوقف شد' : '▶️ در حال پردازش...');
            if (!isPaused && isProcessingPage && !isStopped) processCurrentPage();
        }

        function stopUpload() {
            isStopped = true;
            isRunning = false;
            isPaused = false;
            isProcessingPage = false;
            updatePanelButtons();
            setStatus('⛔ متوقف شد');
            showNotification('⛔ پردازش متوقف شد.');
        }

        function resetAll() {
            if (isRunning && !confirm('آیا مطمئن هستید؟')) return;
            isRunning = false;
            isPaused = false;
            isStopped = false;
            isProcessingPage = false;
            photoFiles = [];
            currentPageStudents = [];
            currentIndex = 0;
            totalProcessed = 0;
            totalSkipped = 0;
            currentPage = 1;
            document.getElementById('totalStudents').textContent = '0';
            document.getElementById('processedStudents').textContent = '0';
            document.getElementById('skippedStudents').textContent = '0';
            document.getElementById('currentStudent').textContent = '---';
            updatePanelButtons();
            setStatus('🔄 ریست شد');
        }

        function updatePanelButtons() {
            document.getElementById('btnStart').disabled = isRunning;
            document.getElementById('btnStart').style.opacity = isRunning ? '0.5' : '';
            document.getElementById('btnPause').style.display = isRunning ? 'inline-block' : 'none';
            document.getElementById('btnPause').textContent = '⏸️ مکث';
            document.getElementById('btnStop').disabled = !isRunning;
            document.getElementById('btnStop').style.opacity = !isRunning ? '0.5' : '';
        }

        function setStatus(text) {
            document.getElementById('uploadStatus').textContent = text;
        }

        function createPanel() {
            var panel = document.createElement('div');
            panel.id = 'uploadPanel';
            panel.style.cssText = 'position:fixed;top:20px;left:20px;background:#1a1a2e;border:2px solid #3ecfe0;border-radius:12px;padding:16px 18px;width:340px;z-index:999999;box-shadow:0 4px 20px rgba(0,0,0,0.4);font-family:Tahoma,sans-serif;direction:rtl;font-size:13px;color:#e8e8f0;';
            panel.innerHTML = '<div id="uploadHeader" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;padding-bottom:10px;border-bottom:2px solid #3ecfe0;user-select:none;cursor:move;"><strong style="color:#3ecfe0;font-size:15px;">📸 آپلود خودکار عکس</strong><button id="btnClose" style="background:none;border:none;cursor:pointer;font-size:18px;color:#999;">✕</button></div><div style="background:#0f1117;padding:12px;border-radius:8px;margin-bottom:12px;text-align:center;"><div style="font-size:12px;color:#888899;">وضعیت:</div><div id="uploadStatus" style="font-size:14px;color:#3ecfe0;margin-top:4px;">آماده شروع</div><div style="display:flex;justify-content:space-around;margin-top:10px;"><div><div style="font-size:10px;color:#888899;">کل بدون عکس</div><div id="totalStudents" style="font-size:20px;font-weight:bold;color:#3ecf8e;">0</div></div><div><div style="font-size:10px;color:#888899;">آپلود شده</div><div id="processedStudents" style="font-size:20px;font-weight:bold;color:#f59e0b;">0</div></div><div><div style="font-size:10px;color:#888899;">صرف‌نظر</div><div id="skippedStudents" style="font-size:20px;font-weight:bold;color:#ff6b81;">0</div></div></div><div id="currentStudent" style="font-size:11px;color:#888899;margin-top:8px;">---</div></div><div style="display:flex;flex-direction:column;gap:8px;"><button id="btnStart" style="background:#3b82f6;color:white;border:none;padding:10px;border-radius:6px;cursor:pointer;font-family:inherit;font-weight:bold;">📁 انتخاب پوشه و شروع</button><div style="display:flex;gap:8px;"><button id="btnPause" style="display:none;flex:1;background:#f59e0b;color:#0f1117;border:none;padding:10px;border-radius:6px;cursor:pointer;font-family:inherit;font-weight:bold;">⏸️ مکث</button><button id="btnStop" style="flex:1;background:#ef4444;color:white;border:none;padding:10px;border-radius:6px;cursor:pointer;font-family:inherit;font-weight:bold;">⛔ توقف</button></div><button id="btnReset" style="background:transparent;color:#888899;border:1px solid #2a2d42;padding:8px;border-radius:6px;cursor:pointer;font-family:inherit;font-size:12px;margin-top:5px;">🔄 ریست</button></div><div style="margin-top:10px;font-size:11px;color:#555577;text-align:center;border-top:1px solid #2a2d42;padding-top:8px;">⚠️ هنگام اجرا، تب مرورگر را فعال نگه دارید.</div>';
            document.body.appendChild(panel);

            var header = document.getElementById('uploadHeader');
            var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
            header.onmousedown = function(e) {
                e.preventDefault();
                pos3 = e.clientX; pos4 = e.clientY;
                document.onmouseup = () => { document.onmouseup = null; document.onmousemove = null; };
                document.onmousemove = function(e) {
                    e.preventDefault();
                    pos1 = pos3 - e.clientX; pos2 = pos4 - e.clientY;
                    pos3 = e.clientX; pos4 = e.clientY;
                    panel.style.top = (panel.offsetTop - pos2) + 'px';
                    panel.style.left = (panel.offsetLeft - pos1) + 'px';
                };
            };

            document.getElementById('btnClose').onclick = () => { panel.remove(); };
            document.getElementById('btnStart').onclick = startUpload;
            document.getElementById('btnPause').onclick = togglePause;
            document.getElementById('btnStop').onclick = stopUpload;
            document.getElementById('btnReset').onclick = resetAll;

            setInterval(() => {
                if (currentPageStudents.length > 0) {
                    document.getElementById('totalStudents').textContent = currentPageStudents.length;
                }
                document.getElementById('processedStudents').textContent = totalProcessed;
                document.getElementById('skippedStudents').textContent = totalSkipped;
            }, 1000);
        }

        createPanel();
    }

    // ==================== ابزار ۵: جمع‌آوری و ارتقاء ====================
    function collectAndPromote() {
        if (!collectAndPromote.toString().includes('یوسف معصومی')) {
            alert('⚠️ این ابزار دستکاری شده است. نام سازنده حذف شده و ابزار غیرفعال شد.');
            return;
        }

        cleanupAllPanels();

        if(document.getElementById('collectPanel')){
            document.getElementById('collectPanel').remove();
        }

        const STUDENTS_KEY='collected_students_codes';
        const REPORT_KEY='collected_report_data';
        const TOTAL_KEY='collected_total_count';

        let isCollecting=false;
        let isProcessing=false;
        let waitingForModalClose=false;
        let stopRequested=false;
        let reportData=[];
        let processedCount=0;
        let skippedCount=0;
        let totalCount=0;
        let collectedStudents=[];
        let deletedStudents=[];
        let broadcastChannel=null;
        let allIntervals=[];
        let allTimeouts=[];
        let allEventListeners=[];

        function loadStudents(){
            try{return JSON.parse(localStorage.getItem(STUDENTS_KEY)||'[]')}catch(e){return[]}
        }
        function saveStudents(data){
            localStorage.setItem(STUDENTS_KEY,JSON.stringify(data));
            if(broadcastChannel){try{broadcastChannel.postMessage({type:'dataUpdated',data:data})}catch(e){}}
        }
        function loadReportData(){
            try{return JSON.parse(localStorage.getItem(REPORT_KEY)||'[]')}catch(e){return[]}
        }
        function saveReportData(data){
            localStorage.setItem(REPORT_KEY,JSON.stringify(data));
            if(broadcastChannel){try{broadcastChannel.postMessage({type:'reportUpdated',data:data})}catch(e){}}
        }
        function loadTotalCount(){
            try{return parseInt(localStorage.getItem(TOTAL_KEY)||'0')}catch(e){return 0}
        }
        function saveTotalCount(val){
            localStorage.setItem(TOTAL_KEY,val.toString());
        }

        function addInterval(fn,ms){let id=setInterval(fn,ms);allIntervals.push(id);return id}
        function addTimeout(fn,ms){let id=setTimeout(fn,ms);allTimeouts.push(id);return id}
        function clearAllTimers(){
            allIntervals.forEach(id=>clearInterval(id));
            allTimeouts.forEach(id=>clearTimeout(id));
            allIntervals=[];
            allTimeouts=[];
        }
        function addEventListenerToCleanup(el,event,fn){
            el.addEventListener(event,fn);
            allEventListeners.push({el:el,event:event,fn:fn});
        }
        function removeAllEventListeners(){
            allEventListeners.forEach(({el,event,fn})=>{try{el.removeEventListener(event,fn)}catch(e){}});
            allEventListeners=[];
        }

        function findTable(){
            for(let t of document.querySelectorAll('table')){
                let ths=t.querySelectorAll('thead th,thead td');
                if(Array.from(ths).some(h=>h.textContent.includes('کد')||h.textContent.includes('نام'))&&t.querySelectorAll('tbody tr').length)return t;
            }
            for(let t of document.querySelectorAll('table')){
                if(t.querySelectorAll('tbody tr').length)return t;
            }
            return null;
        }

        function findColumnIndices(t){
            let ths=t.querySelectorAll('thead th,thead td');
            let c=-1,n=-1,f=-1;
            ths.forEach((h,i)=>{
                let tx=h.textContent.replace(/\s+/g,' ').trim();
                if(tx.includes('کد')&&(tx.includes('ملی')||tx.includes('دانش')))c=i;
                if(tx.includes('نام')&&!tx.includes('خانوادگی')&&!tx.includes('فامیل'))n=i;
                if(tx.includes('نام خانوادگی')||tx.includes('فامیل'))f=i;
            });
            if(c===-1)c=2;
            if(n===-1)n=3;
            if(f===-1)f=4;
            return{codeIndex:c,nameIndex:n,familyIndex:f};
        }

        function resetDataOnly(){
            if(confirm('آیا از ریست کردن داده‌های جمع‌آوری شده مطمئن هستید؟')){
                localStorage.removeItem(STUDENTS_KEY);
                localStorage.removeItem(REPORT_KEY);
                localStorage.removeItem(TOTAL_KEY);
                document.getElementById('studentCount').textContent='0';
                document.getElementById('collectStatus').textContent='🔄 ریست شد';
                collectedStudents=[];
                reportData=[];
                processedCount=0;
                skippedCount=0;
                totalCount=0;
                deletedStudents=[];
                alert('✅ داده‌های جمع‌آوری شده با موفقیت ریست شدند.');
            }
        }

        function stopProcess(){
            stopRequested=true;
            document.getElementById('collectStatus').textContent='⏹️ توقف درخواست شد...';
            document.getElementById('btnStop').disabled=true;
            if(!isProcessing&&!waitingForModalClose){
                document.getElementById('collectStatus').textContent='✅ متوقف شد';
                document.getElementById('btnStop').disabled=false;
            }
        }

        function getNextStudent(){
            let data=loadStudents();
            if(data.length===0)return null;
            let s=data.shift();
            saveStudents(data);
            return s;
        }

        function cleanText(t){
            return t.replace(/[ـ\u200C\u200D]/g,'').replace(/\s+/g,' ').trim();
        }

        function findNextPageButton(){
            let selectors=[
                'a.k-pager-next:not(.k-state-disabled):not(.disabled)',
                '.k-pager-wrap a[title="صفحه بعد"]',
                'a[title="صفحه بعد"]:not(.disabled)',
                'a[title="بعدی"]:not(.disabled)',
                'a[rel="next"]','.pagination .next a','.pagination li.next a',
                'li.next > a','a.next','button[aria-label="صفحه بعد"]',
                'button[aria-label="Next"]','a[aria-label="بعدی"]',
                '.k-pager-nav.k-pager-next:not(.k-state-disabled)',
                '[data-page="next"]','.next-page'
            ];
            for(let sel of selectors){
                try{let el=document.querySelector(sel);if(el)return el}catch(e){continue}
            }
            let allElements=document.querySelectorAll('a, button, span');
            for(let el of allElements){
                let text=el.textContent?.trim()||'';
                if((text==='بعدی'||text==='>'||text==='→')&&!el.classList.contains('k-state-disabled')&&!el.closest('.k-state-disabled')){
                    return el;
                }
            }
            return null;
        }

        function sleep(ms){return new Promise(r=>{let id=setTimeout(r,ms);allTimeouts.push(id)});}

        function generateCollectionReport(){
            let report='📋 گزارش جمع‌آوری دانش‌آموزان\n';
            report+='═══════════════════════════════\n\n';
            report+='📊 تعداد کل جمع‌آوری شده: '+collectedStudents.length+'\n';
            report+='📅 تاریخ: '+new Date().toLocaleDateString('fa-IR')+'\n';
            report+='🕐 زمان: '+new Date().toLocaleTimeString('fa-IR')+'\n\n';
            report+='═══════════════════════════════\n';
            report+='📋 لیست دانش‌آموزان جمع‌آوری شده:\n';
            if(collectedStudents.length===0){
                report+='هیچ دانش‌آموزی جمع‌آوری نشده است.\n';
            }else{
                collectedStudents.forEach((item,index)=>{
                    report+=(index+1)+'. '+item.name+' '+item.family+' (کد: '+item.codemelli+')\n';
                });
            }
            report+='\n═══════════════════════════════\n';
            report+='طراح: یوسف معصومی - ناحیه ۳ تبریز';
            showReportWindow(report,'گزارش جمع‌آوری',collectedStudents,'collection');
        }

        function generateFinalReport(){
            reportData=loadReportData();
            let registered=reportData.filter(r=>r.status==='ثبت نام شده');
            let notRegistered=reportData.filter(r=>r.status!=='ثبت نام شده');
            let totalStudents=loadTotalCount();
            let report='📋 گزارش نهایی ارتقاء دانش‌آموزان\n';
            report+='═══════════════════════════════\n\n';
            if(reportData.length===0){
                report+='⚠️ هیچ داده‌ای برای گزارش وجود ندارد.\n';
                report+='📌 ابتدا دانش‌آموزان را پردازش کنید.\n';
            }else{
                report+='📊 تعداد کل: '+totalStudents+'\n';
                report+='✅ ثبت نام شده: '+registered.length+'\n';
                report+='❌ ثبت نام نشده: '+notRegistered.length+'\n';
            }
            report+='📅 تاریخ: '+new Date().toLocaleDateString('fa-IR')+'\n';
            report+='🕐 زمان: '+new Date().toLocaleTimeString('fa-IR')+'\n\n';
            if(reportData.length>0){
                report+='═══════════════════════════════\n';
                report+='✅ لیست ثبت نام شده‌ها:\n';
                if(registered.length===0){
                    report+='هیچ دانش‌آموزی ثبت نام نشده است.\n';
                }else{
                    registered.forEach((item,index)=>{
                        report+=(index+1)+'. '+item.name+' '+item.family+' (کد: '+item.code+')\n';
                    });
                }
                report+='\n═══════════════════════════════\n';
                report+='❌ لیست ثبت نام نشده‌ها:\n';
                if(notRegistered.length===0){
                    report+='همه دانش‌آموزان ثبت نام شده‌اند.\n';
                }else{
                    notRegistered.forEach((item,index)=>{
                        report+=(index+1)+'. '+item.name+' '+item.family+' (کد: '+item.code+') - وضعیت: '+(item.status||'نامشخص')+'\n';
                    });
                }
            }
            report+='\n═══════════════════════════════\n';
            report+='طراح: یوسف معصومی - ناحیه ۳ تبریز';
            showReportWindow(report,'گزارش نهایی ارتقاء',reportData,'final');
        }

        function showReportWindow(report,title,dataList,type){
            let container=document.createElement('div');
            container.id='reportContainer';
            container.style.cssText='position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);width:700px;max-height:85vh;z-index:9999999;background:#1a1d2e;color:#e8e8f0;border:2px solid #3ecfe0;border-radius:12px;padding:20px;font-family:Tahoma,sans-serif;font-size:13px;direction:rtl;display:flex;flex-direction:column;';
            let header=document.createElement('div');
            header.style.cssText='display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;padding-bottom:10px;border-bottom:2px solid #3ecfe0;flex-shrink:0;';
            header.innerHTML='<strong style="color:#3ecfe0;font-size:16px;">'+title+'</strong><button id="closeReport" style="background:none;border:none;cursor:pointer;font-size:18px;color:#888;">✕</button>';
            container.appendChild(header);
            let listContainer=document.createElement('div');
            listContainer.style.cssText='flex:1;overflow-y:auto;margin-bottom:12px;background:#0f1117;border-radius:8px;padding:8px;max-height:350px;';
            if(dataList&&dataList.length>0){
                let selectAllContainer=document.createElement('div');
                selectAllContainer.style.cssText='display:flex;align-items:center;gap:12px;padding:8px;border-bottom:1px solid #2a2d42;margin-bottom:8px;';
                let selectAllCheck=document.createElement('input');
                selectAllCheck.type='checkbox';selectAllCheck.id='selectAllCheck';
                selectAllCheck.style.cssText='width:16px;height:16px;cursor:pointer;';
                let selectAllLabel=document.createElement('label');
                selectAllLabel.htmlFor='selectAllCheck';selectAllLabel.textContent='انتخاب همه';
                selectAllLabel.style.cssText='color:#c0c0d8;cursor:pointer;';
                let selectedCountSpan=document.createElement('span');
                selectedCountSpan.id='selectedCount';selectedCountSpan.textContent='0 انتخاب شده';
                selectedCountSpan.style.cssText='color:#888;font-size:11px;margin-right:auto;';
                selectAllContainer.appendChild(selectAllCheck);selectAllContainer.appendChild(selectAllLabel);selectAllContainer.appendChild(selectedCountSpan);
                listContainer.appendChild(selectAllContainer);
                dataList.forEach((item,index)=>{
                    let itemDiv=document.createElement('div');
                    itemDiv.style.cssText='display:flex;align-items:center;gap:10px;padding:8px 10px;border-bottom:1px solid #1a1d2e;';
                    let check=document.createElement('input');
                    check.type='checkbox';check.className='studentCheck';check.dataset.index=index;
                    check.style.cssText='width:16px;height:16px;cursor:pointer;flex-shrink:0;';
                    let label=document.createElement('span');
                    label.style.cssText='color:#e8e8f0;font-size:18px;line-height:1.8;';
                    if(type==='collection'){
                        label.textContent=(index+1)+'. '+item.name+' '+item.family+' (کد: '+item.codemelli+')';
                    }else{
                        let statusText=item.status||'نامشخص';
                        let statusColor=statusText==='ثبت نام شده'?'#3ecf8e':'#ff6b81';
                        label.innerHTML=(index+1)+'. '+item.name+' '+item.family+' (کد: '+item.code+') - <span style="color:'+statusColor+';font-weight:bold;">'+statusText+'</span>';
                    }
                    itemDiv.appendChild(check);itemDiv.appendChild(label);
                    listContainer.appendChild(itemDiv);
                });
                let selectAllCheckbox=listContainer.querySelector('#selectAllCheck');
                let studentChecks=listContainer.querySelectorAll('.studentCheck');
                let selectedCountDisplay=listContainer.querySelector('#selectedCount');
                function updateSelectedCount(){
                    let checked=Array.from(studentChecks).filter(c=>c.checked).length;
                    selectedCountDisplay.textContent=checked+' انتخاب شده';
                    if(selectAllCheckbox) selectAllCheckbox.checked=checked===studentChecks.length&&studentChecks.length>0;
                }
                studentChecks.forEach(c=>c.addEventListener('change',updateSelectedCount));
                if(selectAllCheckbox) selectAllCheckbox.addEventListener('change',function(){studentChecks.forEach(c=>c.checked=this.checked);updateSelectedCount();});
                updateSelectedCount();
            }else{
                let emptyMsg=document.createElement('div');
                emptyMsg.textContent='هیچ داده‌ای موجود نیست.';
                emptyMsg.style.cssText='text-align:center;color:#888;padding:20px;';
                listContainer.appendChild(emptyMsg);
            }
            container.appendChild(listContainer);
            let btnContainer=document.createElement('div');
            btnContainer.style.cssText='display:flex;gap:8px;margin-top:8px;flex-wrap:wrap;flex-shrink:0;';
            let copyBtn=document.createElement('button');
            copyBtn.textContent='📋 کپی گزارش';
            copyBtn.style.cssText='flex:1;background:#3ecfe0;color:#0f1117;border:none;padding:8px 16px;border-radius:6px;cursor:pointer;font-family:Tahoma,sans-serif;font-weight:bold;';
            copyBtn.onclick=function(){navigator.clipboard.writeText(report).then(()=>alert('✅ گزارش کپی شد!')).catch(()=>alert('❌ کپی نشد. لطفاً دستی کپی کنید.'));};
            btnContainer.appendChild(copyBtn);
            if(dataList&&dataList.length>0){
                let removeBtn=document.createElement('button');
                removeBtn.textContent='🗑️ حذف انتخاب‌شده‌ها';
                removeBtn.style.cssText='flex:1;background:#ef4444;color:white;border:none;padding:8px 16px;border-radius:6px;cursor:pointer;font-family:Tahoma,sans-serif;font-weight:bold;';
                removeBtn.onclick=function(){
                    let checks=listContainer.querySelectorAll('.studentCheck:checked');
                    if(checks.length===0){alert('هیچ دانش‌آموزی انتخاب نشده است.');return;}
                    if(!confirm('آیا از حذف '+checks.length+' دانش‌آموز انتخاب‌شده مطمئن هستید؟'))return;
                    let indices=Array.from(checks).map(c=>parseInt(c.dataset.index)).sort((a,b)=>b-a);
                    let removedItems=[];
                    indices.forEach(i=>{removedItems.push(dataList[i]);dataList.splice(i,1);});
                    deletedStudents=deletedStudents.concat(removedItems);
                    if(type==='collection'){
                        collectedStudents=dataList;
                        saveStudents(collectedStudents);
                        document.getElementById('studentCount').textContent=collectedStudents.length;
                    }else{
                        reportData=dataList;
                        saveReportData(reportData);
                    }
                    document.body.removeChild(container);
                    showReportWindow((type==='collection'?generateCollectionReport():generateFinalReport()),title,dataList,type);
                };
                btnContainer.appendChild(removeBtn);
                let restoreBtn=document.createElement('button');
                restoreBtn.textContent='↩️ بازگردانی دانش‌آموزان حذف شده';
                restoreBtn.style.cssText='flex:1;background:#f59e0b;color:#0f1117;border:none;padding:8px 16px;border-radius:6px;cursor:pointer;font-family:Tahoma,sans-serif;font-weight:bold;';
                restoreBtn.onclick=function(){
                    if(deletedStudents.length===0){alert('هیچ دانش‌آموزی برای بازگردانی وجود ندارد.');return;}
                    if(confirm('آیا از بازگردانی '+deletedStudents.length+' دانش‌آموز حذف شده مطمئن هستید؟')){
                        let restored=[];
                        deletedStudents.forEach(item=>{
                            if(type==='collection'){
                                let existing=dataList.find(d=>d.codemelli===item.codemelli);
                                if(!existing){dataList.push(item);restored.push(item);}
                            }else{
                                let existing=dataList.find(d=>d.code===item.code);
                                if(!existing){dataList.push(item);restored.push(item);}
                            }
                        });
                        deletedStudents=deletedStudents.filter(item=>!restored.some(r=>(type==='collection'?r.codemelli===item.codemelli:r.code===item.code)));
                        if(type==='collection'){
                            collectedStudents=dataList;saveStudents(collectedStudents);
                            document.getElementById('studentCount').textContent=collectedStudents.length;
                        }else{
                            reportData=dataList;saveReportData(reportData);
                        }
                        document.body.removeChild(container);
                        showReportWindow((type==='collection'?generateCollectionReport():generateFinalReport()),title,dataList,type);
                    }
                };
                btnContainer.appendChild(restoreBtn);
            }
            let closeBtn=document.createElement('button');
            closeBtn.textContent='✕ بستن';
            closeBtn.style.cssText='flex:1;background:#6b7280;color:white;border:none;padding:8px;border-radius:6px;cursor:pointer;font-family:Tahoma,sans-serif;font-weight:bold;';
            closeBtn.onclick=function(){document.body.removeChild(container);};
            btnContainer.appendChild(closeBtn);
            container.appendChild(btnContainer);
            document.body.appendChild(container);
            let closeBtnHeader=container.querySelector('#closeReport');
            if(closeBtnHeader) closeBtnHeader.onclick=function(){document.body.removeChild(container);};
        }

        async function collectAllPages(){
            if(isCollecting)return;
            isCollecting=true;stopRequested=false;
            let s=document.getElementById('collectStatus'),b=document.getElementById('btnCollect');
            b.disabled=true;s.textContent='⏳ در حال جمع‌آوری صفحه ۱...';
            let allCollected=[];let pageNum=1;
            let prevFirstCode='';
            while(true){
                if(stopRequested){s.textContent='⏹️ متوقف شد';b.disabled=false;isCollecting=false;return;}
                let table=findTable();
                if(!table){
                    if(pageNum===1){alert('جدول دانش‌آموزان پیدا نشد! مطمئن شوید در صفحه لیست دانش‌آموزان هستید.');b.disabled=false;s.textContent='❌ جدول پیدا نشد';isCollecting=false;return;}
                    break;
                }
                let cols=findColumnIndices(table);
                if(cols.codeIndex===-1){alert('ستون کد دانش‌آموز پیدا نشد!');b.disabled=false;s.textContent='❌ ستون کد پیدا نشد';isCollecting=false;return;}
                let rows=table.querySelectorAll('tbody tr');
                let pageCollected=[];
                for(let row of rows){
                    let cells=row.querySelectorAll('td');
                    if(cells.length<=Math.max(cols.codeIndex,cols.nameIndex,cols.familyIndex))continue;
                    let codemelli=cells[cols.codeIndex]?cells[cols.codeIndex].textContent.trim():'';
                    let name=cells[cols.nameIndex]?cells[cols.nameIndex].textContent.trim():'';
                    let family=cells[cols.familyIndex]?cells[cols.familyIndex].textContent.trim():'';
                    if(codemelli) pageCollected.push({codemelli, name, family});
                }
                let firstCode=pageCollected.length>0?pageCollected[0].codemelli:'';
                if(prevFirstCode && firstCode===prevFirstCode){
                    s.textContent='⚠️ صفحه بعد بارگذاری نشد. جمع‌آوری متوقف شد.';
                    break;
                }
                prevFirstCode=firstCode;
                allCollected=allCollected.concat(pageCollected);
                s.textContent=`⏳ صفحه ${pageNum}: ${pageCollected.length} نفر (مجموع: ${allCollected.length})`;
                let nextBtn=findNextPageButton();
                if(!nextBtn){
                    s.textContent=`✅ جمع‌آوری کامل - ${allCollected.length} دانش‌آموز از ${pageNum} صفحه`;
                    break;
                }
                nextBtn.click();
                await sleep(3000);
                pageNum++;
            }
            if(stopRequested){s.textContent='⏹️ متوقف شد';b.disabled=false;isCollecting=false;return;}
            if(allCollected.length===0){alert('هیچ دانش‌آموزی پیدا نشد!');b.disabled=false;s.textContent='❌ هیچ داده‌ای';isCollecting=false;return;}
            collectedStudents=allCollected;
            saveStudents(allCollected);
            saveTotalCount(allCollected.length);
            document.getElementById('studentCount').textContent=allCollected.length;
            totalCount=allCollected.length;
            s.textContent=`✅ ${allCollected.length} دانش‌آموز از ${pageNum} صفحه جمع‌آوری شد`;
            alert(`${allCollected.length} دانش‌آموز از ${pageNum} صفحه جمع‌آوری شدند.\nحالا به صفحه مقصد بروید و دوباره بوکمارک را اجرا کنید.`);
            b.disabled=false;
            isCollecting=false;
            document.getElementById('collectPanel').style.display='block';
        }

        function waitForDropdownChange(initialValue){
            return new Promise(resolve=>{
                let interval=setInterval(()=>{
                    if(stopRequested){clearInterval(interval);resolve({type:'stop'});return;}
                    let inp=document.querySelector('input.k-input.k-rtl.comboBox-main[placeholder="انتخاب کنید...."]') ||
                             document.querySelector('input.k-input.k-rtl.comboBox-main') ||
                             document.querySelector('input[placeholder="انتخاب کنید...."]');
                    if(!inp)return;
                    let current=inp.value.trim();
                    if(current!==initialValue && current!=='' && current!=='انتخاب کنید....'){
                        clearInterval(interval);resolve({type:'change',value:current});
                    }
                },500);
                allIntervals.push(interval);
            });
        }

        function waitForCloseButtonClick(){
            return new Promise(resolve=>{
                let closeBtn=document.querySelector('button[ng-click="closePopup()"]') ||
                               Array.from(document.querySelectorAll('button')).find(b=>b.textContent.trim()==='بستن') ||
                               Array.from(document.querySelectorAll('button')).find(b=>b.textContent.includes('بستن')&&b.textContent.includes('انصراف'));
                if(closeBtn){
                    const handler=()=>{resolve({type:'close'});closeBtn.removeEventListener('click',handler);};
                    closeBtn.addEventListener('click',handler);
                    addTimeout(()=>{closeBtn.removeEventListener('click',handler);resolve({type:'timeout'});},30000);
                }else{
                    resolve({type:'none'});
                }
            });
        }

        function waitForModalCloseOrError(){
            return new Promise(resolve=>{
                let interval=setInterval(()=>{
                    if(stopRequested){clearInterval(interval);resolve({type:'stop'});return;}
                    let errorModals=document.querySelectorAll('.modal, .dialog, [class*="modal"], [class*="dialog"], [class*="window"], [role="dialog"], [role="alertdialog"]');
                    for(let modal of errorModals){
                        if(modal.offsetParent!==null){
                            let text=modal.textContent||'';
                            if(text.includes('خطا')||text.includes('Error')||text.includes('warning')||text.includes('هشدار')||text.includes('ناموفق')){
                                clearInterval(interval);resolve({type:'error'});
                                return;
                            }
                        }
                    }
                    let nameInput=document.querySelector('#name');
                    let modalOpen=false;
                    if(nameInput && nameInput.offsetParent!==null){
                        modalOpen=true;
                    }else{
                        let modalSelectors=['.k-window','.ui-dialog','.modal','[class*="modal"]','[class*="dialog"]','[class*="window"]'];
                        for(let sel of modalSelectors){
                            let el=document.querySelector(sel);
                            if(el && el.offsetParent!==null){modalOpen=true;break;}
                        }
                    }
                    if(!modalOpen){
                        clearInterval(interval);resolve({type:'closed'});
                    }
                },300);
                allIntervals.push(interval);
                addTimeout(()=>{clearInterval(interval);resolve({type:'timeout'});},15000);
            });
        }

        async function waitForDropdownChangeAndConfirm(student){
            try{
                let input=document.querySelector('input.k-input.k-rtl.comboBox-main[placeholder="انتخاب کنید...."]') ||
                            document.querySelector('input.k-input.k-rtl.comboBox-main') ||
                            document.querySelector('input[placeholder="انتخاب کنید...."]');
                let initialValue=input?input.value.trim():'';
                document.getElementById('collectStatus').textContent='⏳ منتظر انتخاب دستی پایه یا بستن...';

                let closePromise=waitForCloseButtonClick();
                let changePromise=waitForDropdownChange(initialValue);
                let result=await Promise.race([closePromise,changePromise]);

                if(result.type==='stop'||result.type==='timeout'||result.type==='none'){
                    return {status:'skipped'};
                }

                if(result.type==='close'){
                    return {status:'skipped'};
                }

                if(result.type==='change'){
                    let confirmBtn=document.querySelector('button[ng-click="submit()"]') ||
                                   Array.from(document.querySelectorAll('button')).find(b=>b.textContent.trim()==='تایید') ||
                                   (()=>{let span=Array.from(document.querySelectorAll('span')).find(s=>s.textContent.trim()==='تایید');return span?span.closest('button'):null;})();

                    if(!confirmBtn){
                        let closeResult=await waitForModalCloseOrError();
                        return {status:'skipped'};
                    }

                    confirmBtn.click();
                    document.getElementById('collectStatus').textContent='✅ تایید کلیک شد، منتظر بسته شدن پنجره...';
                    await sleep(1000);

                    let modalResult=await waitForModalCloseOrError();
                    if(modalResult.type==='error'){
                        return {status:'error'};
                    }else if(modalResult.type==='closed'){
                        return {status:'success'};
                    }else{
                        return {status:'unknown'};
                    }
                }
            }catch(e){
                console.error('خطا در تشخیص تغییر منو:',e);
                await waitForModalCloseOrError();
                return {status:'skipped'};
            }
        }

        function waitForModalClose(callback){
            if(waitingForModalClose)return;
            waitingForModalClose=true;
            let checkInterval=setInterval(()=>{
                if(stopRequested){
                    clearInterval(checkInterval);
                    waitingForModalClose=false;
                    document.getElementById('collectStatus').textContent='⏹️ متوقف شد';
                    document.getElementById('btnProcess').disabled=false;
                    document.getElementById('btnStop').disabled=false;
                    return;
                }
                let nameInput=document.querySelector('#name');
                let isOpen=false;
                if(nameInput&&nameInput.offsetParent!==null){
                    isOpen=true;
                }else{
                    let modalSelectors=['.k-window','.ui-dialog','.modal','[class*="modal"]','[class*="dialog"]','[class*="window"]'];
                    for(let sel of modalSelectors){
                        let el=document.querySelector(sel);
                        if(el&&el.offsetParent!==null){isOpen=true;break;}
                    }
                }
                if(!isOpen){
                    clearInterval(checkInterval);
                    waitingForModalClose=false;
                    setTimeout(()=>{callback();},1000);
                }
            },500);
            allIntervals.push(checkInterval);
            addTimeout(()=>{clearInterval(checkInterval);waitingForModalClose=false;},120000);
        }

        async function processNextStudent(){
            if(stopRequested){
                document.getElementById('collectStatus').textContent='⏹️ متوقف شد';
                document.getElementById('btnProcess').disabled=false;
                document.getElementById('btnStop').disabled=false;
                return;
            }
            if(isProcessing||waitingForModalClose)return;
            let data=loadStudents();
            if(data.length===0){
                alert('✅ همه دانش‌آموزان پردازش شدند.');
                document.getElementById('collectStatus').textContent='✅ همه پردازش شدند';
                document.getElementById('btnProcess').disabled=false;
                document.getElementById('btnProcess').textContent='🔄 ارتقاء پایه (مرحله ۲)';
                document.getElementById('btnStop').disabled=true;
                saveReportData(reportData);
                return;
            }
            isProcessing=true;
            document.getElementById('btnProcess').disabled=true;
            document.getElementById('btnStop').disabled=false;
            let s=document.getElementById('collectStatus');
            s.textContent=`⏳ در حال پردازش (${data.length} باقی‌مانده)...`;
            try{
                let student=data.shift();
                saveStudents(data);
                document.getElementById('studentCount').textContent=data.length;
                let btn=document.querySelector('button[ng-click="setAction(action)"]') ||
                         Array.from(document.querySelectorAll('button')).find(b=>b.textContent.includes('اضافه کردن دانش‌آموزان خارج از مدرسه')||b.textContent.includes('وقفه'));
                if(!btn){
                    alert('دکمه "اضافه کردن دانش‌آموزان خارج از مدرسه / وقفه" پیدا نشد!');
                    isProcessing=false;
                    document.getElementById('btnProcess').disabled=false;
                    s.textContent='❌ دکمه پیدا نشد';
                    let existing=reportData.find(r=>r.code===student.codemelli);
                    if(!existing) reportData.push({code:student.codemelli,name:student.name,family:student.family,status:'ثبت نام نشده'});
                    else existing.status='ثبت نام نشده';
                    skippedCount++;
                    saveReportData(reportData);
                    return;
                }
                btn.click();
                await sleep(2000);
                if(stopRequested){s.textContent='⏹️ متوقف شد';isProcessing=false;document.getElementById('btnProcess').disabled=false;document.getElementById('btnStop').disabled=false;return;}
                let input=document.querySelector('#name') || document.querySelector('input[placeholder="name"]');
                if(!input){
                    alert('کادر ورودی کد دانش‌آموز پیدا نشد!');
                    isProcessing=false;
                    document.getElementById('btnProcess').disabled=false;
                    s.textContent='❌ کادر ورودی پیدا نشد';
                    let existing=reportData.find(r=>r.code===student.codemelli);
                    if(!existing) reportData.push({code:student.codemelli,name:student.name,family:student.family,status:'ثبت نام نشده'});
                    else existing.status='ثبت نام نشده';
                    skippedCount++;
                    saveReportData(reportData);
                    return;
                }
                input.value=student.codemelli;
                input.dispatchEvent(new Event('input',{bubbles:true}));
                await sleep(500);
                let searchBtn=document.querySelector('button[ng-click="studentSearch()"]') ||
                                Array.from(document.querySelectorAll('button')).find(b=>b.textContent.includes('جستجوی دانش‌آموز'));
                if(searchBtn) searchBtn.click();
                s.textContent=`⏳ کد ${student.codemelli} جستجو شد - منتظر انتخاب دستی پایه...`;
                let result=await waitForDropdownChangeAndConfirm(student);
                if(stopRequested){
                    s.textContent='⏹️ متوقف شد';
                    isProcessing=false;
                    document.getElementById('btnProcess').disabled=false;
                    document.getElementById('btnStop').disabled=false;
                    return;
                }
                if(result.status==='success'){
                    let existing=reportData.find(r=>r.code===student.codemelli);
                    if(!existing) reportData.push({code:student.codemelli,name:student.name,family:student.family,status:'ثبت نام شده'});
                    else existing.status='ثبت نام شده';
                    processedCount++;
                    saveReportData(reportData);
                    s.textContent=`✅ ${student.name} ${student.family} ثبت نام شد.`;
                } else {
                    let existing=reportData.find(r=>r.code===student.codemelli);
                    if(!existing) reportData.push({code:student.codemelli,name:student.name,family:student.family,status:'ثبت نام نشده'});
                    else existing.status='ثبت نام نشده';
                    skippedCount++;
                    saveReportData(reportData);
                    s.textContent=`⚠️ ${student.name} ${student.family} ثبت نام نشد.`;
                }
                s.textContent=`⏸️ آماده برای کد بعدی...`;
                isProcessing=false;
                document.getElementById('btnProcess').disabled=false;
                document.getElementById('btnProcess').textContent='🔄 ارتقاء پایه (مرحله ۲)';
                processNextStudent();
            }catch(e){
                console.error('خطا:',e);
                alert('خطا در پردازش: '+e.message);
                isProcessing=false;
                document.getElementById('btnProcess').disabled=false;
                s.textContent='❌ خطا';
                let existing=reportData.find(r=>r.code===student.codemelli);
                if(!existing) reportData.push({code:student.codemelli,name:student.name,family:student.family,status:'ثبت نام نشده'});
                else existing.status='ثبت نام نشده';
                skippedCount++;
                saveReportData(reportData);
            }
        }

        function startCollect(){
            if(isCollecting)return;
            collectAllPages();
        }

        function startProcess(){
            if(stopRequested){
                stopRequested=false;
                document.getElementById('btnStop').disabled=false;
            }
            if(isProcessing||waitingForModalClose)return;
            let data=loadStudents();
            if(data.length===0){
                alert('هیچ کد دانش‌آموزی جمع‌آوری نشده است. ابتدا در صفحه لیست دانش‌آموزان بوکمارک را اجرا کنید.');
                return;
            }
            reportData=loadReportData();
            totalCount=loadTotalCount()||data.length+reportData.length;
            document.getElementById('collectStatus').textContent=`⏳ شروع پردازش (${data.length} دانش‌آموز)...`;
            document.getElementById('btnProcess').textContent='⏳ در حال پردازش...';
            processedCount=reportData.filter(r=>r.status==='ثبت نام شده').length;
            skippedCount=reportData.filter(r=>r.status!=='ثبت نام شده').length;
            processNextStudent();
        }

        function createPanel(){
            let p=document.createElement('div');
            p.id='collectPanel';
            p.style.cssText='position:fixed;top:20px;left:20px;background:#1a1d2e;border:2px solid #3ecfe0;border-radius:12px;padding:16px 18px;width:360px;z-index:999999;box-shadow:0 4px 20px rgba(0,0,0,0.4);font-family:Tahoma,sans-serif;direction:rtl;font-size:13px;color:#e8e8f0;';
            p.innerHTML='<div id="collectHeader" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;padding-bottom:10px;border-bottom:2px solid #3ecfe0;user-select:none;cursor:move;"><strong style="color:#3ecfe0;font-size:15px;">📋 جمع‌آوری و ارتقاء</strong><button id="btnClose" style="background:none;border:none;cursor:pointer;font-size:18px;color:#888;">✕</button></div><div style="background:#0f1117;padding:12px;border-radius:8px;margin-bottom:12px;text-align:center;"><div style="font-size:12px;color:#888;">تعداد دانش‌آموزان:</div><div id="studentCount" style="font-size:28px;font-weight:bold;color:#3ecfe0;">0</div><div id="collectStatus" style="font-size:11px;color:#888;margin-top:5px;">آماده</div></div><div style="display:flex;flex-direction:column;gap:8px;"><div style="display:flex;gap:8px;"><button id="btnCollect" style="flex:1;background:#3ecfe0;color:#0f1117;border:none;padding:10px;border-radius:6px;cursor:pointer;font-family:inherit;font-weight:bold;">📊 جمع‌آوری</button><button id="btnProcess" style="flex:1;background:#f59e0b;color:#0f1117;border:none;padding:10px;border-radius:6px;cursor:pointer;font-family:inherit;font-weight:bold;">🔄 ارتقاء</button></div><div style="display:flex;gap:8px;"><button id="btnReset" style="flex:1;background:#6c8cff;color:#0f1117;border:none;padding:10px;border-radius:6px;cursor:pointer;font-family:inherit;font-weight:bold;">🔄 ریست</button><button id="btnStop" style="flex:1;background:#6b7280;color:white;border:none;padding:10px;border-radius:6px;cursor:pointer;font-family:inherit;font-weight:bold;">⏹️ توقف</button></div><div style="display:flex;gap:8px;"><button id="btnReportCollect" style="flex:1;background:#6c8cff;color:#0f1117;border:none;padding:10px;border-radius:6px;cursor:pointer;font-family:inherit;font-weight:bold;">📋 گزارش جمع‌آوری</button><button id="btnReportFinal" style="flex:1;background:#3ecf8e;color:#0f1117;border:none;padding:10px;border-radius:6px;cursor:pointer;font-family:inherit;font-weight:bold;">📋 گزارش نهایی</button></div></div><div style="margin-top:10px;font-size:11px;color:#666;text-align:center;border-top:1px solid #2a2d42;padding-top:8px;">مرحله ۱: در صفحه لیست دانش‌آموزان (صفحه اول)<br>مرحله ۲: در صفحه اضافه کردن دانش‌آموزان خارج از مدرسه</div>';
            document.body.appendChild(p);
            let h=document.getElementById('collectHeader'),x1=0,y1=0,x2=0,y2=0;
            addEventListenerToCleanup(h,'mousedown',function(e){
                e.preventDefault();
                x1=e.clientX;y1=e.clientY;
                document.onmouseup=()=>{document.onmouseup=null;document.onmousemove=null};
                document.onmousemove=function(e){
                    e.preventDefault();
                    x2=x1-e.clientX;y2=y1-e.clientY;
                    x1=e.clientX;y1=e.clientY;
                    p.style.top=(p.offsetTop-y2)+'px';
                    p.style.left=(p.offsetLeft-x2)+'px';
                };
            });
            let closeBtn=p.querySelector('#btnClose');
            addEventListenerToCleanup(closeBtn,'click',function(){
                clearAllTimers();
                removeAllEventListeners();
                if(broadcastChannel) broadcastChannel.close();
                p.remove();
            });
            let collectBtn=p.querySelector('#btnCollect');
            addEventListenerToCleanup(collectBtn,'click',startCollect);
            let processBtn=p.querySelector('#btnProcess');
            addEventListenerToCleanup(processBtn,'click',startProcess);
            let resetBtn=p.querySelector('#btnReset');
            addEventListenerToCleanup(resetBtn,'click',resetDataOnly);
            let stopBtn=p.querySelector('#btnStop');
            addEventListenerToCleanup(stopBtn,'click',function(){stopProcess();});
            let reportCollectBtn=p.querySelector('#btnReportCollect');
            addEventListenerToCleanup(reportCollectBtn,'click',function(){generateCollectionReport();});
            let reportFinalBtn=p.querySelector('#btnReportFinal');
            addEventListenerToCleanup(reportFinalBtn,'click',function(){generateFinalReport();});
            let count=loadStudents().length;
            document.getElementById('studentCount').textContent=count;
            if(count>0) document.getElementById('collectStatus').textContent=`✅ ${count} دانش‌آموز ذخیره شده`;
            collectedStudents=loadStudents();
            totalCount=loadTotalCount()||count;
            try{
                broadcastChannel=new BroadcastChannel('collectPanelChannel');
                broadcastChannel.onmessage=function(event){
                    if(event.data&&event.data.type==='dataUpdated'){
                        let cnt=loadStudents().length;
                        document.getElementById('studentCount').textContent=cnt;
                        if(cnt>0) document.getElementById('collectStatus').textContent=`✅ ${cnt} دانش‌آموز ذخیره شده`;
                        collectedStudents=loadStudents();
                    }
                    if(event.data&&event.data.type==='reportUpdated'){
                        reportData=loadReportData();
                    }
                };
            }catch(e){
                broadcastChannel=null;
            }
            let visibilityHandler=function(){
                if(!document.hidden){
                    document.getElementById('collectPanel').style.display='block';
                }
            };
            let focusHandler=function(){
                document.getElementById('collectPanel').style.display='block';
            };
            addEventListenerToCleanup(document,'visibilitychange',visibilityHandler);
            addEventListenerToCleanup(window,'focus',focusHandler);
            let storageHandler=function(event){
                if(event.key===STUDENTS_KEY){
                    let cnt=loadStudents().length;
                    document.getElementById('studentCount').textContent=cnt;
                    if(cnt>0) document.getElementById('collectStatus').textContent=`✅ ${cnt} دانش‌آموز ذخیره شده`;
                    collectedStudents=loadStudents();
                }
                if(event.key===REPORT_KEY){
                    reportData=loadReportData();
                }
                if(event.key===TOTAL_KEY){
                    totalCount=loadTotalCount();
                }
            };
            addEventListenerToCleanup(window,'storage',storageHandler);
            reportData=loadReportData();
        }

        createPanel();
    }

    // ==================== ابزار ۶: چاپ دفتر نتایج ====================
    function printReportCard() {
        if (printReportCard.running) {
            alert('ابزار در حال اجراست. لطفاً صبر کنید.');
            return;
        }
        printReportCard.running = true;

        cleanupAllPanels();

        function designedByYousefMasoumi() {
            /* طراح: یوسف معصومی - شاغل در آموزش و پرورش ناحیه ۳ تبریز */

            function getGrade() {
                let gradeCells = document.querySelectorAll('td.btext, td[class*="btext"]');
                for (let cell of gradeCells) {
                    let text = cell.innerText.trim();
                    if (['اول','دوم','سوم','چهارم','پنجم','ششم','1','2','3','4','5','6'].includes(text)) {
                        return text;
                    }
                }
                let headers = document.querySelectorAll('th');
                let gradeIndex = -1;
                for (let th of headers) {
                    if (th.innerText.trim() === 'پایه' || th.innerText.trim() === 'پایه ') {
                        gradeIndex = Array.from(th.parentElement.children).indexOf(th);
                        break;
                    }
                }
                if (gradeIndex !== -1) {
                    let rows = document.querySelectorAll('table tbody tr');
                    for (let row of rows) {
                        let cells = row.querySelectorAll('td');
                        if (cells.length > gradeIndex) {
                            let text = cells[gradeIndex].innerText.trim();
                            if (['اول','دوم','سوم','چهارم','پنجم','ششم','1','2','3','4','5','6'].includes(text)) {
                                return text;
                            }
                        }
                    }
                }
                let pageTitle = document.title || '';
                if (pageTitle.includes('پایه اول') || pageTitle.includes('پایه ۱')) return 'اول';
                if (pageTitle.includes('پایه دوم') || pageTitle.includes('پایه ۲')) return 'دوم';
                if (pageTitle.includes('پایه سوم') || pageTitle.includes('پایه ۳')) return 'سوم';
                if (pageTitle.includes('پایه چهارم') || pageTitle.includes('پایه ۴')) return 'چهارم';
                if (pageTitle.includes('پایه پنجم') || pageTitle.includes('پایه ۵')) return 'پنجم';
                if (pageTitle.includes('پایه ششم') || pageTitle.includes('پایه ۶')) return 'ششم';
                return 'سوم';
            }

            function getBetweenSpacing(grade) {
                let g = grade ? grade.toString().trim() : '';
                if (g === 'اول' || g === '1' || g.includes('اول')) return 130;
                if (g === 'دوم' || g === '2' || g.includes('دوم')) return 100;
                if (g === 'ششم' || g === '6' || g.includes('ششم')) return 3;
                return 65;
            }

            function addSpacersToPage() {
                let tables = document.querySelectorAll('table');
                if (tables.length === 0) return false;
                
                let grade = getGrade();
                let betweenSpacing = getBetweenSpacing(grade);
                
                let comments = [];
                let iterator = document.createNodeIterator(document.body, NodeFilter.SHOW_COMMENT);
                let c;
                while (c = iterator.nextNode()) {
                    if (c.nodeValue && c.nodeValue.includes('end ngRepeat') && c.nodeValue.includes('ksarnamehs')) {
                        comments.push(c);
                    }
                }
                
                comments.forEach(function(comment, index) {
                    if (index % 2 === 1) {
                        let topSpacer = document.createElement('div');
                        topSpacer.style.height = '5px';
                        topSpacer.style.margin = '0';
                        topSpacer.style.padding = '0';
                        topSpacer.style.backgroundColor = 'transparent';
                        topSpacer.style.display = 'block';
                        topSpacer.style.pageBreakBefore = 'always';
                        comment.parentNode.insertBefore(topSpacer, comment.nextSibling);
                    } else {
                        let spacer = document.createElement('div');
                        spacer.style.height = betweenSpacing + 'px';
                        spacer.style.margin = '15px 0';
                        spacer.style.padding = '0';
                        spacer.style.backgroundColor = 'transparent';
                        spacer.style.display = 'block';
                        comment.parentNode.insertBefore(spacer, comment.nextSibling);
                    }
                });
                
                let firstTopSpacer = document.createElement('div');
                firstTopSpacer.style.height = '5px';
                firstTopSpacer.style.margin = '0';
                firstTopSpacer.style.padding = '0';
                firstTopSpacer.style.backgroundColor = 'transparent';
                firstTopSpacer.style.display = 'block';
                
                let firstTable = tables[0];
                if (firstTable) {
                    firstTable.parentNode.insertBefore(firstTopSpacer, firstTable);
                }
                
                return betweenSpacing;
            }

            let allCheckboxes = [...document.querySelectorAll('table input[type="checkbox"]')]
                .filter(cb => !cb.closest('thead'));
            
            if (!allCheckboxes.length) {
                alert('چک‌باکسی پیدا نشد!');
                return;
            }

            let checkedCheckboxes = [...document.querySelectorAll('table input[type="checkbox"]:checked')]
                .filter(cb => !cb.closest('thead'));

            if (checkedCheckboxes.length > 0) {
                checkedCheckboxes.forEach(cb => { if (!cb.checked) cb.click(); });
                alert(checkedCheckboxes.length + ' دانش‌آموز انتخاب شده‌اند.');
            } else {
                allCheckboxes.forEach(cb => { if (!cb.checked) cb.click(); });
                alert(allCheckboxes.length + ' دانش‌آموز به صورت خودکار انتخاب شدند.');
            }

            let btn = [...document.querySelectorAll('button,input')].find(el =>
                el.innerText.includes('خروجی دفتر نتایج ارزشیابی') ||
                el.innerText.includes('دفتر نتایج') ||
                el.innerText.includes('خروجی')
            );
            
            if (!btn) {
                alert('دکمه "خروجی دفتر نتایج ارزشیابی" پیدا نشد!');
                return;
            }
            
            btn.click();

            setTimeout(function() {
                let usedSpacing = addSpacersToPage();
                
                setTimeout(function() {
                    let printBtn = [...document.querySelectorAll('button,input')].find(el =>
                        el.innerText.includes('پرینت') || el.innerText.includes('چاپ')
                    );
                    if (printBtn) {
                        printBtn.style.outline = '3px solid #f5a623';
                        printBtn.style.outlineOffset = '2px';
                        printBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        
                        alert('✅ فاصله 5px بالای هر صفحه و ' + usedSpacing + 'px بین کارنامه‌ها (هوشمند) اضافه شد.\n\n🖨️ لطفاً حالا دکمه پرینت را به صورت دستی بزنید.');
                    } else {
                        alert('✅ فاصله‌ها اضافه شد، اما دکمه پرینت پیدا نشد. لطفاً خودتان پرینت بگیرید.');
                    }
                }, 500);
            }, 4000);
        }

        if (!designedByYousefMasoumi.toString().includes('یوسف معصومی') || !designedByYousefMasoumi.toString().includes('ناحیه ۳ تبریز')) {
            alert('⚠️ این ابزار دستکاری شده است. نام سازنده حذف شده و ابزار غیرفعال شد.');
            printReportCard.running = false;
            return;
        }

        designedByYousefMasoumi();
        printReportCard.running = false;
    }

    // ==================== ابزار ۷: استخراج عکس (نسخه API) ====================
    function photoExtractTool() {
        if (document.getElementById('multiPageExtractPanel')) {
            document.getElementById('multiPageExtractPanel').remove();
        }

        cleanupAllPanels();

        const STORAGE_KEY = 'photo_extract_students_v5';
        const DB_NAME = 'PhotoExtractDB';
        const DB_VERSION = 1;
        let students = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        let isRunning = false;
        let isStopped = false;
        let abortController = null;
        let totalPhotos = 0;
        let downloadedPhotos = 0;

        function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

        function escapeHtml(text) {
            if (!text) return '';
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        // ===== IndexedDB =====
        function openDB() {
            return new Promise(function(resolve, reject) {
                let request = indexedDB.open(DB_NAME, DB_VERSION);
                request.onerror = function() { reject(request.error); };
                request.onsuccess = function() { resolve(request.result); };
                request.onupgradeneeded = function(event) {
                    let db = event.target.result;
                    if (!db.objectStoreNames.contains('photos')) {
                        db.createObjectStore('photos', { keyPath: 'codemelli' });
                    }
                };
            });
        }

        async function savePhotoToDB(codemelli, dataUrl) {
            if (!dataUrl || !codemelli) return;
            try {
                let db = await openDB();
                let tx = db.transaction('photos', 'readwrite');
                tx.objectStore('photos').put({ codemelli: codemelli, data: dataUrl });
                await new Promise(function(resolve, reject) { tx.oncomplete = resolve; tx.onerror = reject; });
                db.close();
            } catch (err) { console.warn('خطا در ذخیره عکس:', err); }
        }

        async function getPhotoFromDB(codemelli) {
            if (!codemelli) return '';
            try {
                let db = await openDB();
                let tx = db.transaction('photos', 'readonly');
                let result = await new Promise(function(resolve, reject) {
                    let req = tx.objectStore('photos').get(codemelli);
                    req.onsuccess = function() { resolve(req.result); };
                    req.onerror = function() { reject(req.error); };
                });
                db.close();
                return result ? result.data : '';
            } catch (err) { return ''; }
        }

        async function clearPhotosDB() {
            try {
                let db = await openDB();
                let tx = db.transaction('photos', 'readwrite');
                tx.objectStore('photos').clear();
                await new Promise(function(resolve, reject) { tx.oncomplete = resolve; tx.onerror = reject; });
                db.close();
            } catch(e) {}
        }

        // ===== توابع کمکی API =====
        function getToken() {
            try { var t = sessionStorage.getItem('token'); if (t) return t; } catch(e) {}
            try { var t2 = localStorage.getItem('token'); if (t2) return t2; } catch(e) {}
            return null;
        }

        function getClientId() {
            try { var c1 = localStorage.getItem('pages-client-id'); if (c1) return c1; } catch(e) {}
            try { var c2 = sessionStorage.getItem('pages-client-id'); if (c2) return c2; } catch(e) {}
            return 'mt1ag7vh-f9qt51vf-is5kslgz-am182rru-3pu0h0ne';
        }

        function getGridFilter() {
            try {
                var gridEl = document.querySelector('.k-grid');
                if (!gridEl) return null;
                var grid = $(gridEl).data('kendoGrid');
                if (!grid) return null;
                return grid.dataSource.filter();
            } catch (e) { return null; }
        }

        // ===== دریافت لیست دانش‌آموزان از API =====
        async function fetchAllStudentsFromAPI() {
            var pageSize = 500;
            var page = 1;
            var allFetched = [];
            var total = 0;
            var hasMore = true;

            var token = getToken();
            if (!token) {
                showNotification('❌ توکن پیدا نشد. لطفاً دوباره لاگین کن.');
                return [];
            }

            var clientId = getClientId();
            var gridFilter = getGridFilter();

            if (gridFilter) {
                console.log('📊 فیلتر گرید:', JSON.stringify(gridFilter));
                var filterDesc = 'نامشخص';
                try {
                    filterDesc = gridFilter.filters.map(function(f) { return f.field + '=' + f.value; }).join(', ');
                } catch(e) {}
                showNotification('📊 فیلتر فعال: ' + filterDesc);
            }

            while (hasMore && isRunning) {
                try {
                    var body = {
                        take: pageSize,
                        skip: (page - 1) * pageSize,
                        page: page,
                        pageSize: pageSize,
                        sort: [{ field: 'id', dir: 'asc' }]
                    };
                    if (gridFilter) body.filter = gridFilter;

                    var response = await fetch('/api/Student/GetStudentInfo', {
                        method: 'POST',
                        credentials: 'include',
                        headers: {
                            'Content-Type': 'application/json; charset=utf-8',
                            'Accept': 'application/json, text/javascript, */*; q=0.01',
                            'X-Requested-With': 'XMLHttpRequest',
                            'Authorization': 'Bearer ' + token,
                            'client-id': clientId
                        },
                        body: JSON.stringify(body)
                    });

                    if (!response.ok) throw new Error('HTTP ' + response.status);

                    var json = await response.json();
                    var items = (json.data && json.data.data) || json.data || [];

                    if (!Array.isArray(items) || items.length === 0) {
                        hasMore = false;
                        break;
                    }

                    if (json.data && json.data.total) total = json.data.total;
                    allFetched = allFetched.concat(items);

                    setStatus('دریافت شد: ' + allFetched.length + (total ? ' از ' + total : ''));

                    if (items.length < pageSize) hasMore = false;
                    else page++;

                    await sleep(100);

                } catch (e) {
                    console.error('خطا:', e);
                    showNotification('❌ خطا در دریافت: ' + e.message);
                    hasMore = false;
                }
            }

            return allFetched;
        }

        // ===== تبدیل رکورد API به ساختار ما =====
        function mapRecord(item) {
            var path = item.path || '';
            var photoUrl = '';
            if (path) {
                if (path.indexOf('http') === 0) {
                    photoUrl = path;
                } else if (path.charAt(0) === '/') {
                    photoUrl = location.origin + path;
                } else {
                    photoUrl = location.origin + '/' + path;
                }
            }

            return {
                name: (item.firstName || '').trim(),
                family: (item.lastName || '').trim(),
                father: (item.fatherName || '').trim(),
                codemelli: String(item.nationalCode || '').trim(),
                photoUrl: photoUrl,
                hasPhoto: !!photoUrl
            };
        }

        // ===== دانلود عکس و تبدیل به base64 =====
        async function imageToBase64(url, maxSize) {
            maxSize = maxSize || 200;
            if (!url) return '';

            return new Promise(async function(resolve) {
                abortController = new AbortController();
                try {
                    let response = await fetch(url, {
                        credentials: 'include',
                        signal: abortController.signal
                    });
                    if (!response.ok) { resolve(''); return; }
                    let blob = await response.blob();
                    let img = new Image();
                    let objectUrl = URL.createObjectURL(blob);

                    img.onload = function() {
                        try {
                            let scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
                            let canvas = document.createElement('canvas');
                            canvas.width = Math.round(img.width * scale) || maxSize;
                            canvas.height = Math.round(img.height * scale) || maxSize;
                            canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
                            URL.revokeObjectURL(objectUrl);
                            resolve(canvas.toDataURL('image/jpeg', 0.8));
                        } catch (e) {
                            URL.revokeObjectURL(objectUrl);
                            resolve('');
                        }
                    };

                    img.onerror = function() {
                        URL.revokeObjectURL(objectUrl);
                        resolve('');
                    };

                    img.src = objectUrl;
                } catch (e) {
                    resolve('');
                }
            });
        }

        // ===== دانلود عکس‌ها (دسته‌ای ۱۰ تا) =====
        async function downloadPhotosInBatches(studentsList, batchSize) {
            batchSize = batchSize || 10;
            totalPhotos = studentsList.filter(function(s) { return s.photoUrl; }).length;
            downloadedPhotos = 0;

            for (let i = 0; i < studentsList.length; i += batchSize) {
                if (!isRunning || isStopped) break;

                let batch = studentsList.slice(i, i + batchSize);

                // دانلود موازی این دسته
                let promises = batch.map(async function(s) {
                    if (!s.photoUrl) return null;
                    let base64 = await imageToBase64(s.photoUrl);
                    return { student: s, base64: base64 };
                });

                let results = await Promise.all(promises);

                // ذخیره در IndexedDB
                for (let r of results) {
                    if (r && r.base64) {
                        r.student.hasPhoto = true;
                        await savePhotoToDB(r.student.codemelli, r.base64);
                        downloadedPhotos++;
                    } else if (r) {
                        r.student.hasPhoto = false;
                    }
                }

                setStatus('دانلود عکس: ' + downloadedPhotos + ' از ' + totalPhotos);
                updateStats();
                await sleep(100);
            }
        }

        // ===== شروع =====
        async function startExtraction() {
            if (isRunning) {
                showNotification('عملیات در حال انجام است...');
                return;
            }

            isRunning = true;
            isStopped = false;
            students = [];
            downloadedPhotos = 0;
            totalPhotos = 0;

            document.getElementById('btnStart').disabled = true;
            document.getElementById('btnStart').style.opacity = '0.5';
            document.getElementById('btnStop').disabled = false;
            document.getElementById('btnStop').style.opacity = '';

            setStatus('در حال دریافت لیست دانش‌آموزان...');

            try {
                // ۱. دریافت لیست از API
                let rawData = await fetchAllStudentsFromAPI();

                if (!isRunning || isStopped) {
                    setStatus('⏸️ متوقف شد');
                    return;
                }

                if (rawData.length === 0) {
                    showNotification('❌ داده‌ای دریافت نشد');
                    setStatus('❌ خطا');
                    return;
                }

                // ۲. تبدیل به ساختار ما
                students = rawData.map(mapRecord);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
                updateStats();

                setStatus('✅ ' + students.length + ' دانش‌آموز دریافت شد. شروع دانلود عکس‌ها...');
                showNotification('📸 شروع دانلود ' + students.filter(function(s){ return s.photoUrl; }).length + ' عکس...');

                // ۳. دانلود عکس‌ها (دسته‌ای ۱۰ تا)
                await downloadPhotosInBatches(students, 10);

                if (!isRunning || isStopped) {
                    setStatus('⏸️ متوقف شد. ' + downloadedPhotos + ' عکس دانلود شد.');
                    return;
                }

                setStatus('✅ پایان کار! ' + students.length + ' دانش‌آموز، ' + downloadedPhotos + ' عکس');
                showNotification('🎉 تمام شد! ' + students.length + ' دانش‌آموز، ' + downloadedPhotos + ' عکس', 0);

            } catch (e) {
                console.error(e);
                showNotification('❌ خطا: ' + e.message);
                setStatus('❌ خطا: ' + e.message);
            }

            isRunning = false;
            document.getElementById('btnStart').disabled = false;
            document.getElementById('btnStart').style.opacity = '';
            document.getElementById('btnStop').disabled = true;
            document.getElementById('btnStop').style.opacity = '0.5';
        }

        // ===== پنل =====
        function updateStats() {
            let totalEl = document.getElementById('mpTotal');
            if (totalEl) totalEl.textContent = students.length.toLocaleString('fa-IR');

            let photosEl = document.getElementById('mpPhotos');
            if (photosEl) photosEl.textContent = downloadedPhotos.toLocaleString('fa-IR');
        }

        function setStatus(text) {
            let statusEl = document.getElementById('mpStatus');
            if (statusEl) statusEl.textContent = text;
        }

        function showNotification(text, duration) {
            if (duration === undefined) duration = 4000;
            let old = document.getElementById('autoNotif');
            if (old) old.remove();
            let notif = document.createElement('div');
            notif.id = 'autoNotif';
            notif.style.cssText = 'position:fixed;bottom:20px;left:20px;background:#1a1a2e;color:white;padding:12px 20px;border-radius:8px;z-index:9999999;font-family:Tahoma;font-size:13px;box-shadow:0 4px 12px rgba(0,0,0,0.3);max-width:350px;direction:rtl;';
            notif.textContent = text;
            notif.addEventListener('click', function() { notif.remove(); });
            document.body.appendChild(notif);
            if (duration > 0) setTimeout(function() { if (notif.parentNode) notif.remove(); }, duration);
        }

        function stopExtraction() {
            if (isRunning) {
                isRunning = false;
                isStopped = true;
                if (abortController) abortController.abort();
                showNotification('⏹️ متوقف شد');
                setStatus('⏸️ متوقف شد. ' + downloadedPhotos + ' عکس دانلود شد.');

                document.getElementById('btnStart').disabled = false;
                document.getElementById('btnStart').style.opacity = '';
                document.getElementById('btnStop').disabled = true;
                document.getElementById('btnStop').style.opacity = '0.5';
            }
        }

        async function clearMemory() {
            if (confirm('آیا مطمئن هستید؟ تمام داده‌ها پاک خواهد شد.')) {
                localStorage.removeItem(STORAGE_KEY);
                await clearPhotosDB();
                students = [];
                downloadedPhotos = 0;
                totalPhotos = 0;
                updateStats();
                setStatus('حافظه پاک شد. آماده شروع...');
            }
        }

        // ===== ساخت HTML خروجی =====
        async function buildResultPage() {
            let studentsWithPhotos = [];
            for (let s of students) {
                let photo = await getPhotoFromDB(s.codemelli);
                studentsWithPhotos.push(Object.assign({}, s, { photo: photo }));
            }

            // اسم فایل: نام + فامیل + کد ملی
            function makeFileName(s) {
                let name = (s.name || '').trim().replace(/[\\/:*?"<>|]/g, '_');
                let family = (s.family || '').trim().replace(/[\\/:*?"<>|]/g, '_');
                let code = (s.codemelli || '').trim();
                let parts = [];
                if (name) parts.push(name);
                if (family) parts.push(family);
                if (code) parts.push(code);
                return parts.join('-') || 'student';
            }

            let html = `<!DOCTYPE html><html dir="rtl" lang="fa"><head><meta charset="UTF-8"><title>لیست دانش‌آموزان با عکس و مشخصات</title><script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"><\/script><style>body{font-family:Tahoma,sans-serif;background:#f0f2f5;padding:20px;margin:0}.container{max-width:1200px;margin:0 auto;display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:20px}.card{background:white;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.1);padding:15px;text-align:center;transition:0.2s}.card:hover{box-shadow:0 4px 16px rgba(0,0,0,0.15)}.card img{width:120px;height:120px;border-radius:50%;object-fit:cover;border:3px solid #3b82f6;margin-bottom:10px}.card h3{margin:8px 0 4px;color:#1e293b}.card p{margin:4px 0;color:#475569;font-size:13px}.download-btn{background:#3b82f6;color:white;border:none;padding:6px 12px;border-radius:6px;cursor:pointer;margin-top:10px;font-size:12px}.download-btn:hover{background:#2563eb}.toolbar{position:sticky;top:0;background:white;padding:15px 20px;margin-bottom:30px;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.1);display:flex;gap:15px;flex-wrap:wrap;align-items:center;justify-content:center;z-index:100}.toolbar button{background:#10b981;color:white;border:none;padding:8px 16px;border-radius:8px;cursor:pointer;font-size:14px}.toolbar button:hover{background:#059669}.toolbar .count{font-weight:bold;color:#1e293b}.search-wrap{position:relative;flex:1;min-width:200px;max-width:320px}.search-wrap input{width:100%;height:38px;padding:0 36px 0 12px;border:1px solid #cbd5e1;border-radius:8px;font-family:inherit;font-size:14px;direction:rtl;outline:none;box-sizing:border-box}.search-wrap input:focus{border-color:#3b82f6;box-shadow:0 0 0 3px rgba(59,130,246,0.15)}.search-wrap .search-icon{position:absolute;left:10px;top:50%;transform:translateY(-50%);color:#94a3b8;font-size:15px;pointer-events:none}.no-img{width:120px;height:120px;border-radius:50%;background:#e2e8f0;display:flex;align-items:center;justify-content:center;margin:0 auto 10px;color:#64748b;font-size:12px}.no-search-result{grid-column:1/-1;text-align:center;padding:40px;color:#64748b;font-size:15px}<\/style><\/head><body><div class="toolbar"><span class="count" id="visibleCount">تعداد دانش‌آموزان: ${studentsWithPhotos.length}</span><div class="search-wrap"><input type="text" id="searchInput" placeholder="جستجو: نام، نام خانوادگی، کد ملی، نام پدر..." oninput="doSearch()"><span class="search-icon">🔍</span></div><button id="downloadAllZip">📦 دانلود همه عکس‌ها (ZIP)</button><button id="downloadCsv">📊 دانلود مشخصات (Excel)</button></div><div class="container" id="cardsContainer">`;

            studentsWithPhotos.forEach((s, idx) => {
                let imgTag = s.photo ? `<img src="${s.photo}" alt="عکس">` : `<div class="no-img">📷 بدون عکس</div>`;
                // ✅ اسم فایل: نام + فامیل + کد ملی
                let fullNameWithCode = makeFileName(s);
                let displayName = (s.name || '') + ' ' + (s.family || '') + (s.codemelli ? ' - ' + s.codemelli : '');
                let searchData = `${s.name} ${s.family} ${s.father||''} ${s.codemelli||''}`;

                html += `<div class="card" data-idx="${idx}" data-search="${escapeHtml(searchData)}" data-name="${escapeHtml(fullNameWithCode)}">${imgTag}<h3>${escapeHtml(displayName)}</h3><p><strong>کد ملی:</strong> ${escapeHtml(s.codemelli||'---')}</p><p><strong>نام پدر:</strong> ${escapeHtml(s.father||'---')}</p><button class="download-btn" data-img="${s.photo}" data-name="${escapeHtml(fullNameWithCode)}">⬇ دانلود عکس</button></div>`;
            });

            html += `</div><script>
function dataURLtoBlob(dataurl){let arr=dataurl.split(','),mimeMatch=arr[0].match(/:(.*?);/),mime=mimeMatch?mimeMatch[1]:'image/jpeg',bstr=atob(arr[1]),n=bstr.length,u8=new Uint8Array(n);while(n--){u8[n]=bstr.charCodeAt(n)}return new Blob([u8],{type:mime})}
function downloadBlob(blob,filename){let url=URL.createObjectURL(blob);let a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
function downloadImage(dataUrl,name){if(!dataUrl){alert('این دانش‌آموز عکس ندارد');return}try{let blob=dataURLtoBlob(dataUrl);downloadBlob(blob,name+'.jpg')}catch(e){alert('خطا در دانلود عکس')}}
document.querySelectorAll('.download-btn').forEach(btn=>{btn.onclick=()=>{let img=btn.getAttribute('data-img');let name=btn.getAttribute('data-name');downloadImage(img,name)}});
document.getElementById('downloadAllZip').onclick=async function(){
  let cards=[...document.querySelectorAll('.card')].filter(c=>c.querySelector('img'));
  if(cards.length===0){alert('عکسی برای دانلود وجود ندارد');return}
  let zip=new JSZip();
  let count=0;
  for(let card of cards){
    let img=card.querySelector('img');
    let name=card.dataset.name || card.querySelector('h3').innerText.trim() || ('student_'+count);
    try{
      if(img.src.startsWith('data:')){
        let blob=dataURLtoBlob(img.src);
        zip.file(name+'.jpg',blob);
        count++;
      }else{
        let response=await fetch(img.src);
        let blob=await response.blob();
        zip.file(name+'.jpg',blob);
        count++;
      }
    }catch(e){console.warn('خطا در دانلود:',name,e)}
  }
  if(count===0){alert('هیچ عکسی برای فشرده‌سازی وجود ندارد');return}
  let zipBlob=await zip.generateAsync({type:'blob'});
  downloadBlob(zipBlob,'عکس‌های_دانش‌آموزان.zip');
  alert('✅ دانلود '+count+' عکس در یک فایل ZIP تمام شد');
};
document.getElementById('downloadCsv').onclick=()=>{
  let data=${JSON.stringify(studentsWithPhotos.map(s=>({name:s.name,family:s.family,father:s.father,codemelli:s.codemelli,hasPhoto:!!s.photo})))};
  let csvRows=[['نام','نام خانوادگی','کد ملی','نام پدر','دارای عکس']];
  data.forEach(s=>{csvRows.push([s.name,s.family,s.codemelli,s.father,s.hasPhoto?'دارد':'ندارد'])});
  let csvContent='\ufeff'+csvRows.map(row=>row.map(c=>'"'+(c||'').replace(/"/g,'""')+'"').join(',')).join('\\n');
  let blob=new Blob([csvContent],{type:'text/csv;charset=utf-8'});
  downloadBlob(blob,'students_list.csv')
};
function normNum(s){if(!s)return"";return String(s).replace(/[\u200c\u200d]/g," ").replace(/[\u064b-\u065f\u0670\u0674]/g,"").replace(/[\u064a\u0626\u0649]/g,"\u06cc").replace(/\u0643/g,"\u06a9").replace(/\u0629/g,"\u0647").replace(/\u0624/g,"\u0648").replace(/[\u0623\u0625\u0622]/g,"\u0627").replace(/[۰-۹]/g,function(d){return"۰۱۲۳۴۵۶۷۸۹".indexOf(d).toString()}).replace(/[٠-٩]/g,function(d){return"٠١٢٣٤٥٦٧٨٩".indexOf(d).toString()}).replace(/\\s+/g," ").trim();}
function doSearch(){
  var q=normNum(document.getElementById('searchInput').value.trim()).toLowerCase();
  var cards=document.querySelectorAll('.card');
  var visible=0;
  cards.forEach(function(card){
    var text=normNum(card.getAttribute('data-search')||'').toLowerCase();
    if(!q||text.includes(q)){card.style.display='';visible++;}
    else{card.style.display='none';}
  });
  var totalCount=${studentsWithPhotos.length};
  document.getElementById('visibleCount').textContent=q?('تعداد دانش‌آموزان: '+visible+' از '+totalCount):('تعداد دانش‌آموزان: '+totalCount);
  var noResult=document.getElementById('noSearchResult');
  if(visible===0&&cards.length>0){
    if(!noResult){
      noResult=document.createElement('div');
      noResult.id='noSearchResult';
      noResult.className='no-search-result';
      noResult.textContent='نتیجه‌ای یافت نشد 🔍';
      document.getElementById('cardsContainer').appendChild(noResult);
    }
  }else if(noResult){noResult.remove();}
}
<\/script></body></html>`;
            return html;
        }

        function downloadBlobFile(blob, filename) {
            let url = URL.createObjectURL(blob);
            let a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        }

        async function downloadResults() {
            if (students.length === 0) {
                alert('هنوز داده‌ای جمع‌آوری نشده است. اول دکمه «شروع» را بزنید.');
                return;
            }
            setStatus('⏳ در حال آماده‌سازی فایل خروجی...');
            let html = await buildResultPage();
            let blob = new Blob([html], { type: 'text/html;charset=utf-8' });
            downloadBlobFile(blob, 'لیست_دانش‌آموزان.html');
            setStatus('✅ فایل دانلود شد.');
        }

        function makeDraggable(elmnt, handle) {
            let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
            handle.style.cursor = 'grab';
            handle.onmousedown = function(e) {
                e = e || window.event;
                e.preventDefault();
                pos3 = e.clientX;
                pos4 = e.clientY;
                document.onmouseup = function() {
                    document.onmouseup = null;
                    document.onmousemove = null;
                    handle.style.cursor = 'grab';
                };
                document.onmousemove = function(e) {
                    e = e || window.event;
                    e.preventDefault();
                    pos1 = pos3 - e.clientX;
                    pos2 = pos4 - e.clientY;
                    pos3 = e.clientX;
                    pos4 = e.clientY;
                    elmnt.style.top = (elmnt.offsetTop - pos2) + 'px';
                    elmnt.style.left = (elmnt.offsetLeft - pos1) + 'px';
                };
                handle.style.cursor = 'grabbing';
            };
        }

        function createPanel() {
            let panel = document.createElement('div');
            panel.id = 'multiPageExtractPanel';
            panel.style.cssText = 'position:fixed;top:20px;left:20px;background:#fff;border:2px solid #3b82f6;border-radius:10px;padding:15px;width:340px;max-width:90vw;z-index:999999;box-shadow:0 4px 20px rgba(0,0,0,0.2);font-family:Tahoma,sans-serif;direction:rtl;font-size:13px;color:#333;';

            panel.innerHTML =
                '<div id="mpHeader" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;padding-bottom:10px;border-bottom:2px solid #3b82f6;user-select:none;">' +
                    '<strong style="color:#3b82f6;font-size:15px;">📸 استخراج عکس (API)</strong>' +
                    '<button id="mpClose" style="background:none;border:none;cursor:pointer;font-size:18px;color:#999;">✕</button>' +
                '</div>' +
                '<div style="background:#eff6ff;padding:12px;border-radius:8px;margin-bottom:12px;text-align:center;">' +
                    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">' +
                        '<div><div style="font-size:11px;color:#666;">دانش‌آموزان</div><div id="mpTotal" style="font-size:22px;font-weight:bold;color:#3b82f6;">0</div></div>' +
                        '<div><div style="font-size:11px;color:#666;">عکس‌های دانلود</div><div id="mpPhotos" style="font-size:22px;font-weight:bold;color:#10b981;">0</div></div>' +
                    '</div>' +
                    '<div id="mpStatus" style="font-size:11px;color:#666;margin-top:8px;">آماده شروع...</div>' +
                '</div>' +
                '<div style="display:flex;flex-direction:column;gap:8px;">' +
                    '<button id="btnStart" style="background:#3b82f6;color:white;border:none;padding:12px;border-radius:6px;cursor:pointer;font-family:inherit;font-weight:bold;font-size:14px;">▶️ شروع استخراج</button>' +
                    '<button id="btnStop" style="background:#ef4444;color:white;border:none;padding:10px;border-radius:6px;cursor:pointer;font-family:inherit;font-weight:bold;opacity:0.5;" disabled>⛔ توقف</button>' +
                    '<button id="btnDownload" style="background:#10b981;color:white;border:none;padding:10px;border-radius:6px;cursor:pointer;font-family:inherit;font-weight:bold;">📥 دانلود فایل HTML</button>' +
                    '<button id="btnClear" style="background:#fff;color:#c62828;border:1px solid #c62828;padding:8px;border-radius:6px;cursor:pointer;font-family:inherit;font-size:12px;margin-top:5px;">🗑️ پاک‌سازی حافظه</button>' +
                '</div>' +
                '<div style="margin-top:10px;font-size:11px;color:#666;text-align:center;border-top:1px solid #eee;padding-top:8px;">' +
                    '⚡ دریافت خودکار از API — سریع و دقیق' +
                '</div>';

            document.body.appendChild(panel);

            makeDraggable(panel, document.getElementById('mpHeader'));
            if (typeof makeDraggableByTouch === 'function') {
                makeDraggableByTouch(panel, document.getElementById('mpHeader'));
            }

            document.getElementById('mpClose').addEventListener('click', function() {
                panel.remove();
            });

            document.getElementById('btnStart').addEventListener('click', startExtraction);
            document.getElementById('btnStop').addEventListener('click', stopExtraction);
            document.getElementById('btnDownload').addEventListener('click', downloadResults);
            document.getElementById('btnClear').addEventListener('click', clearMemory);

            updateStats();

            if (students.length > 0) {
                setStatus('✅ ' + students.length + ' دانش‌آموز از قبل ذخیره شده است.');
            }
        }

        createPanel();
    }

    // ==================== ابزار ۸: جمع‌آوری و تخصیص ====================
    function collectAssignTool() {
        if (document.getElementById('collectAssignPanel')) {
            document.getElementById('collectAssignPanel').remove();
        }

        cleanupAllPanels();

        const STORAGE_KEY = 'class_students_data';

        function loadData() {
            try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch (e) { return []; }
        }

        function saveData(data) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        }

        function getCurrentClassName() {
            let label = document.querySelector('label.infomark.ng-binding[ng-bind="global.classRoomTitle"]');
            if (label) {
                return label.textContent.trim();
            }
            return null;
        }

        function getStudentsFromTable() {
            let table = document.querySelector('table');
            if (!table) {
                alert('جدول دانش‌آموزان پیدا نشد!');
                return [];
            }
            let rows = table.querySelectorAll('tbody tr');
            let students = [];
            for (let row of rows) {
                let cells = row.querySelectorAll('td');
                if (cells.length >= 3) {
                    let rowText = cells[0] ? cells[0].textContent.trim() : '';
                    let code = cells[1] ? cells[1].textContent.trim() : '';
                    let fullName = cells[2] ? cells[2].textContent.trim() : '';
                    let nameParts = fullName.split(' ');
                    let family = nameParts[0] || '';
                    let name = nameParts.slice(1).join(' ') || '';
                    if (code) {
                        students.push({ row: rowText, code: code, name: name, family: family });
                    }
                }
            }
            return students;
        }

        function collectCurrentClass() {
            let className = getCurrentClassName();
            if (!className) {
                alert('نام کلاس پیدا نشد! مطمئن شوید در صفحه لیست دانش‌آموزان هستید.');
                return;
            }
            let students = getStudentsFromTable();
            if (students.length === 0) {
                alert('هیچ دانش‌آموزی در این کلاس پیدا نشد!');
                return;
            }
            let allData = loadData();
            let existingIndex = allData.findIndex(item => item.className === className);
            if (existingIndex !== -1) {
                allData[existingIndex].students = students;
            } else {
                allData.push({ className: className, students: students });
            }
            saveData(allData);
            document.getElementById('classCount').textContent = allData.length;
            document.getElementById('studentCount').textContent = students.length;
            document.getElementById('collectStatus').textContent = `✅ کلاس ${className} با ${students.length} دانش‌آموز ذخیره شد`;
            updateClassSelect();
        }

        function getClassSelect() {
            return document.getElementById('classSelect');
        }

        function updateClassSelect() {
            let select = getClassSelect();
            if (!select) return;
            let allData = loadData();
            select.innerHTML = '<option value="">-- انتخاب کلاس --</option>';
            for (let item of allData) {
                let opt = document.createElement('option');
                opt.value = item.className;
                opt.textContent = `${item.className} (${item.students.length} نفر)`;
                select.appendChild(opt);
            }
        }

        function getModalTable() {
            let allTables = document.querySelectorAll('table');
            for (let t of allTables) {
                let parent = t.closest('.modal-content, .modal-body, .k-window, .ui-dialog, [role="dialog"]');
                if (parent) {
                    if (t.querySelector('tbody tr')) {
                        let firstRow = t.querySelector('tbody tr');
                        let cells = firstRow.querySelectorAll('td');
                        if (cells.length >= 5) {
                            return t;
                        }
                    }
                }
            }
            for (let t of allTables) {
                let parent = t.closest('.modal-content, .modal-body, .k-window, .ui-dialog, [role="dialog"]');
                if (parent) {
                    if (t.querySelector('tbody tr')) {
                        return t;
                    }
                }
            }
            for (let t of allTables) {
                if (t.closest('.k-grid') && t.querySelector('tbody tr')) {
                    let ths = t.querySelectorAll('thead th');
                    if (ths.length >= 5) {
                        return t;
                    }
                }
            }
            for (let t of allTables) {
                let rows = t.querySelectorAll('tbody tr');
                if (rows.length > 0) {
                    let cells = rows[0].querySelectorAll('td');
                    if (cells.length >= 5) {
                        return t;
                    }
                }
            }
            return null;
        }

        function getTableStudentsFromModal() {
            let mainTable = getModalTable();
            if (!mainTable) {
                alert('جدول تخصیص دانش‌آموز پیدا نشد! لطفاً مودال را باز کنید و دوباره امتحان کنید.');
                return [];
            }
            let rows = mainTable.querySelectorAll('tbody tr');
            let students = [];
            for (let row of rows) {
                let cells = row.querySelectorAll('td');
                if (cells.length >= 5) {
                    let checkbox = null;
                    for (let i = 0; i < cells.length; i++) {
                        let cb = cells[i].querySelector('input[type="checkbox"]');
                        if (cb) {
                            checkbox = cb;
                            break;
                        }
                    }
                    let code = cells[2] ? cells[2].textContent.trim() : '';
                    let name = cells[3] ? cells[3].textContent.trim() : '';
                    let family = cells[4] ? cells[4].textContent.trim() : '';
                    if (code) {
                        students.push({ row: 0, code: code, name: name, family: family, checkbox: checkbox });
                    }
                }
            }
            return students;
        }

        function showAssignmentReport(className, targetStudents, checkedCodes) {
            let reportHTML = `
                <div style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);width:500px;max-height:70vh;z-index:10000000;background:white;border:2px solid #0f4c81;border-radius:12px;padding:20px;font-family:Tahoma,sans-serif;direction:rtl;font-size:13px;color:#333;display:flex;flex-direction:column;">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;padding-bottom:10px;border-bottom:2px solid #0f4c81;">
                        <strong style="color:#0f4c81;font-size:15px;">📋 گزارش تخصیص - ${className}</strong>
                        <button onclick="this.closest('div').parentElement.remove()" style="background:none;border:none;cursor:pointer;font-size:18px;color:#999;">✕</button>
                    </div>
                    <div style="display:flex;justify-content:space-around;margin-bottom:15px;padding:10px;background:#f0f6ff;border-radius:8px;">
                        <div style="text-align:center;">
                            <div style="font-size:11px;color:#666;">تخصیص داده شده</div>
                            <div style="font-size:24px;font-weight:bold;color:#10b981;">${checkedCodes.length}</div>
                        </div>
                        <div style="text-align:center;">
                            <div style="font-size:11px;color:#666;">تخصیص داده نشده</div>
                            <div style="font-size:24px;font-weight:bold;color:#ef4444;">${targetStudents.length - checkedCodes.length}</div>
                        </div>
                        <div style="text-align:center;">
                            <div style="font-size:11px;color:#666;">کل دانش‌آموزان</div>
                            <div style="font-size:24px;font-weight:bold;color:#0f4c81;">${targetStudents.length}</div>
                        </div>
                    </div>
                    <div style="overflow-y:auto;flex:1;margin-bottom:15px;">
                        <div style="background:#f0fdf4;padding:10px;border-radius:8px;margin-bottom:10px;">
                            <strong style="color:#10b981;">✅ تخصیص داده شده (${checkedCodes.length}):</strong>
                            <div style="margin-top:8px;font-size:12px;line-height:1.8;">
                                ${targetStudents.filter(s => checkedCodes.includes(s.code)).map(s => 
                                    `• ${s.name} ${s.family} (کد: ${s.code})`
                                ).join('<br>') || 'هیچ دانش‌آموزی تخصیص داده نشده است.'}
                            </div>
                        </div>
                        <div style="background:#fef2f2;padding:10px;border-radius:8px;">
                            <strong style="color:#ef4444;">❌ تخصیص داده نشده (${targetStudents.length - checkedCodes.length}):</strong>
                            <div style="margin-top:8px;font-size:12px;line-height:1.8;">
                                ${targetStudents.filter(s => !checkedCodes.includes(s.code)).map(s => 
                                    `• ${s.name} ${s.family} (کد: ${s.code})`
                                ).join('<br>') || 'همه دانش‌آموزان تخصیص داده شده‌اند.'}
                            </div>
                        </div>
                    </div>
                    <div style="display:flex;gap:8px;">
                        <button onclick="navigator.clipboard.writeText(this.parentElement.parentElement.querySelector('div[style*=\\'overflow-y\\']').innerText).then(()=>alert('گزارش کپی شد!')).catch(()=>alert('کپی نشد'))" style="flex:1;background:#0f4c81;color:white;border:none;padding:8px;border-radius:6px;cursor:pointer;font-family:inherit;font-weight:bold;">📋 کپی گزارش</button>
                        <button onclick="this.closest('div').parentElement.remove()" style="flex:1;background:#6b7280;color:white;border:none;padding:8px;border-radius:6px;cursor:pointer;font-family:inherit;font-weight:bold;">✕ بستن</button>
                    </div>
                </div>
            `;
            let reportDiv = document.createElement('div');
            reportDiv.innerHTML = reportHTML;
            document.body.appendChild(reportDiv.firstElementChild);
        }

        function findAndCheckStudents() {
            let select = getClassSelect();
            let className = select ? select.value : '';
            if (!className) {
                alert('لطفاً ابتدا یک کلاس را انتخاب کنید.');
                return;
            }
            let allData = loadData();
            let classData = allData.find(item => item.className === className);
            if (!classData) {
                alert(`کلاس ${className} در داده‌های ذخیره‌شده وجود ندارد. ابتدا اطلاعات را جمع‌آوری کنید.`);
                return;
            }
            let targetStudents = classData.students;
            let tableStudents = getTableStudentsFromModal();
            if (tableStudents.length === 0) {
                alert('هیچ دانش‌آموزی در جدول مودال پیدا نشد! لطفاً مودال تخصیص را باز کنید و دوباره امتحان کنید.');
                return;
            }
            let checked = 0;
            let checkedCodes = [];
            for (let target of targetStudents) {
                for (let tableStudent of tableStudents) {
                    if (tableStudent.code === target.code) {
                        if (tableStudent.checkbox) {
                            if (!tableStudent.checkbox.checked) {
                                tableStudent.checkbox.click();
                                checked++;
                                checkedCodes.push(target.code);
                            } else {
                                checkedCodes.push(target.code);
                            }
                            break;
                        }
                    }
                }
            }
            
            document.getElementById('assignStatus').textContent = `✅ ${checked} دانش‌آموز تیک خوردند و اعمال شدند`;
            
            showAssignmentReport(className, targetStudents, checkedCodes);
            
            alert(`✅ ${checked} دانش‌آموز از کلاس ${className} تیک خوردند و اعمال شدند. اکنون میتوانید روی «تایید» کلیک کنید.`);
        }

        function clearData() {
            if (confirm('آیا مطمئن هستید؟ تمام داده‌های ذخیره‌شده پاک خواهند شد.')) {
                localStorage.removeItem(STORAGE_KEY);
                document.getElementById('classCount').textContent = '0';
                document.getElementById('studentCount').textContent = '0';
                document.getElementById('collectStatus').textContent = '🗑️ پاک شد';
                document.getElementById('assignStatus').textContent = '';
                updateClassSelect();
            }
        }

        function updateUI() {
            let allData = loadData();
            document.getElementById('classCount').textContent = allData.length;
            let totalStudents = allData.reduce((sum, item) => sum + item.students.length, 0);
            document.getElementById('studentCount').textContent = totalStudents;
            updateClassSelect();
        }

        function createPanel() {
            let p = document.createElement('div');
            p.id = 'collectAssignPanel';
            p.style.cssText = 'position:fixed;top:20px;left:20px;background:#fff;border:2px solid #0f4c81;border-radius:12px;padding:16px 18px;width:360px;z-index:999999;box-shadow:0 4px 20px rgba(0,0,0,0.25);font-family:Tahoma,sans-serif;direction:rtl;font-size:13px;color:#333;';
            p.innerHTML = '<div id="collectHeader" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;padding-bottom:10px;border-bottom:2px solid #0f4c81;user-select:none;"><strong style="color:#0f4c81;font-size:15px;">📋 جمع‌آوری و تخصیص</strong><button id="btnClose" style="background:none;border:none;cursor:pointer;font-size:18px;color:#999;">✕</button></div><div style="background:#f0f6ff;padding:12px;border-radius:8px;margin-bottom:12px;text-align:center;"><div style="font-size:12px;color:#666;">تعداد کلاس‌ها: <span id="classCount" style="font-weight:bold;color:#0f4c81;">0</span> | مجموع دانش‌آموزان: <span id="studentCount" style="font-weight:bold;color:#0f4c81;">0</span></div><div id="collectStatus" style="font-size:11px;color:#666;margin-top:4px;">آماده</div></div><div style="display:flex;flex-direction:column;gap:8px;margin-bottom:8px;"><button id="btnCollect" style="background:#0f4c81;color:white;border:none;padding:10px;border-radius:6px;cursor:pointer;font-family:inherit;font-weight:bold;">📊 جمع‌آوری این کلاس</button></div><div style="border-top:1px solid #eee;padding-top:8px;margin-bottom:8px;"><div style="display:flex;gap:8px;margin-bottom:6px;align-items:center;"><div style="font-size:12px;color:#666;white-space:nowrap;">انتخاب کلاس:</div><select id="classSelect" style="flex:1;padding:6px;border-radius:4px;border:1px solid #ccc;font-family:inherit;"></select></div><button id="btnAssign" style="width:100%;background:#f59e0b;color:#0f1117;border:none;padding:10px;border-radius:6px;cursor:pointer;font-family:inherit;font-weight:bold;">✅ تیک زدن و اعمال</button></div><div style="display:flex;gap:8px;"><button id="btnClear" style="flex:1;background:#ef4444;color:white;border:none;padding:8px;border-radius:6px;cursor:pointer;font-family:inherit;font-weight:bold;">🗑️ پاک‌سازی</button></div><div id="assignStatus" style="font-size:11px;color:#666;text-align:center;margin-top:8px;"></div><div style="margin-top:10px;font-size:11px;color:#666;text-align:center;border-top:1px solid #eee;padding-top:8px;">⚠️ هنگام اجرا، تب مرورگر را فعال نگه دارید.</div>';
            document.body.appendChild(p);

            let h = document.getElementById('collectHeader');
            let x1 = 0, y1 = 0, x2 = 0, y2 = 0;
            h.onmousedown = function(e) {
                e.preventDefault();
                x1 = e.clientX;
                y1 = e.clientY;
                document.onmouseup = () => { document.onmouseup = null; document.onmousemove = null; };
                document.onmousemove = function(e) {
                    e.preventDefault();
                    x2 = x1 - e.clientX;
                    y2 = y1 - e.clientY;
                    x1 = e.clientX;
                    y1 = e.clientY;
                    p.style.top = (p.offsetTop - y2) + 'px';
                    p.style.left = (p.offsetLeft - x2) + 'px';
                };
            };

            document.getElementById('btnClose').onclick = function() {
                p.remove();
            };

            document.getElementById('btnCollect').onclick = collectCurrentClass;
            document.getElementById('btnAssign').onclick = findAndCheckStudents;
            document.getElementById('btnClear').onclick = clearData;

            updateUI();
        }

        createPanel();
    }

    // ==================== ابزار ۹: آزادسازی ====================
    function freeStudentTool() {
        if (document.getElementById('freeStudentPanel')) {
            document.getElementById('freeStudentPanel').remove();
        }

        cleanupAllPanels();

        const sleep = ms => new Promise(r => setTimeout(r, ms));
        let isRunning = false;
        let totalFreed = 0;
        let TARGET_PREV_GRADE = 'پنجم';
        let TARGET_NEW_GRADE = 'ششم';
        const GRADE_MAP = { 'اول': 'اول', 'دوم': 'دوم', 'سوم': 'سوم', 'چهارم': 'چهارم', 'پنجم': 'پنجم', 'ششم': 'ششم' };

        let processedRows = new Set();

        function findTable() {
            for (let t of document.querySelectorAll('table')) {
                let ths = t.querySelectorAll('thead th,thead td');
                if (Array.from(ths).some(h => h.textContent.includes('پایه') || h.textContent.includes('سال')) && t.querySelectorAll('tbody tr').length) return t;
            }
            for (let t of document.querySelectorAll('table')) {
                if (t.querySelectorAll('tbody tr').length) return t;
            }
            return null;
        }

        function findColumnIndices(t) {
            let ths = t.querySelectorAll('thead th,thead td');
            let p = -1, n = -1, codeCol = -1;
            ths.forEach((h, i) => {
                let tx = h.textContent.replace(/\s+/g, ' ').trim();
                if (tx.includes('سال قبل') || tx.includes('پایه قبل') || tx.includes('پایه در سال قبل')) p = i;
                if (tx.includes('سال جدید') || tx.includes('پایه جدید') || tx.includes('پایه در سال جدید')) n = i;
                if (tx.includes('کد') && (tx.includes('ملی') || tx.includes('دانش'))) codeCol = i;
            });
            if (p === -1) p = 6;
            if (n === -1) n = 7;
            if (codeCol === -1) codeCol = 2;
            return { prevCol: p, newCol: n, codeCol: codeCol };
        }

        function cleanText(t) {
            return t.replace(/[ـ\u200C\u200D]/g, '').replace(/\s+/g, ' ').trim();
        }

        function isTarget(p, n) {
            let cp = cleanText(p), cn = cleanText(n);
            return (cp.includes(TARGET_PREV_GRADE) || cp === TARGET_PREV_GRADE) && (cn.includes(TARGET_NEW_GRADE) || cn === TARGET_NEW_GRADE);
        }

        function getRowIdentifier(row, cols, codeCol) {
            if (codeCol >= 0 && cols[codeCol] && cols[codeCol].textContent.trim()) {
                return 'code_' + cols[codeCol].textContent.trim();
            }
            let name = cols[2]?.textContent?.trim() || '';
            let family = cols[3]?.textContent?.trim() || '';
            let prev = cols[cols.prevCol]?.textContent?.trim() || '';
            let next = cols[cols.newCol]?.textContent?.trim() || '';
            return `row_${name}_${family}_${prev}_${next}`;
        }

        async function clickFreeButton(row) {
            let cells = row.querySelectorAll('td');
            let lastCell = cells[cells.length - 1];
            let btn = lastCell.querySelector('a.k-grid-deleteRow') ||
                       lastCell.querySelector('a.k-grid-daleteRow') ||
                       Array.from(lastCell.querySelectorAll('a')).find(a => a.textContent.includes('آزاد'));
            if (btn) {
                btn.click();
                return true;
            }
            let freeBtn = Array.from(lastCell.querySelectorAll('button, a, span')).find(el => el.textContent.includes('آزاد'));
            if (freeBtn) {
                freeBtn.click();
                return true;
            }
            throw new Error('دکمه آزادسازی در ردیف پیدا نشد');
        }

        async function waitForConfirmButton(timeout = 7000) {
            let st = Date.now();
            while (Date.now() - st < timeout) {
                let modal = document.querySelector('.modal.show, .modal[style*="display: block"], .k-window:not([style*="display: none"]), .k-window-visible') || document;
                let b = modal.querySelector('button.submit-danger, button.submit-dungger') ||
                        modal.querySelector('button[ng-click="accept()"]') ||
                        Array.from(modal.querySelectorAll('button')).find(b => b.textContent.includes('تایید') && !b.disabled);
                if (b && b.offsetParent !== null) return b;
                await sleep(200);
            }
            throw new Error('دکمه تأیید پیدا نشد');
        }

        async function freeFirstEligible() {
            if (!isRunning) return false;
            let table = findTable();
            if (!table) return false;
            let { prevCol: p, newCol: n, codeCol } = findColumnIndices(table);
            let rows = table.querySelectorAll('tbody tr');
            for (let row of rows) {
                if (!isRunning) return false;
                let cells = row.querySelectorAll('td');
                if (cells.length <= Math.max(p, n)) continue;
                let pg = cells[p]?.textContent || '', ng = cells[n]?.textContent || '';
                if (!isTarget(pg, ng)) continue;

                let rowId = getRowIdentifier(row, cells, codeCol);
                if (processedRows.has(rowId)) continue;

                let first = cells[2]?.textContent?.trim() || '', last = cells[3]?.textContent?.trim() || '';
                try {
                    processedRows.add(rowId);
                    await clickFreeButton(row);
                    if (!isRunning) return false;
                    let cf = await waitForConfirmButton();
                    if (!isRunning) return false;
                    await sleep(300);
                    cf.click();
                    await sleep(4000);
                    if (!isRunning) return false;
                    totalFreed++;
                    return true;
                } catch (e) {
                    console.error('خطا در آزادسازی', first, last, e);
                    try {
                        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', keyCode: 27, which: 27, bubbles: true }));
                    } catch (e2) {}
                    await sleep(1000);
                    return false;
                }
            }
            return false;
        }

        async function startProcess() {
            if (isRunning) return;
            isRunning = true;
            let s = document.getElementById('freeStatus'), b = document.getElementById('btnStartFree');
            b.disabled = true;
            totalFreed = 0;
            processedRows.clear();
            s.textContent = '⏳ در حال پردازش...';
            while (isRunning) {
                let found = await freeFirstEligible();
                if (!found) break;
                s.textContent = `${totalFreed} دانش‌آموز آزاد شد`;
                document.getElementById('freeCounter').textContent = totalFreed;
                await sleep(1000);
            }
            isRunning = false;
            b.disabled = false;
            s.textContent = `✅ پایان - ${totalFreed} آزاد شد`;
            alert(`✅ ${totalFreed} دانش‌آموز از ${TARGET_PREV_GRADE} به ${TARGET_NEW_GRADE} آزادسازی شدند.`);
        }

        function stop() {
            isRunning = false;
            document.getElementById('btnStartFree').disabled = false;
            document.getElementById('freeStatus').textContent = '⛔ متوقف شد';
        }

        function fullReset() {
            if (confirm('آیا مطمئن هستید؟ این عمل تمام داده‌های موقت این ابزار را پاک می‌کند و ابزار را به حالت اولیه برمی‌گرداند.')) {
                isRunning = false;
                totalFreed = 0;
                processedRows.clear();
                document.getElementById('freeCounter').textContent = '0';
                document.getElementById('btnStartFree').disabled = false;
                document.getElementById('freeStatus').textContent = '🔄 ریست شد';
                localStorage.removeItem('free_student_target_prev');
                localStorage.removeItem('free_student_target_new');
                TARGET_PREV_GRADE = 'پنجم';
                TARGET_NEW_GRADE = 'ششم';
                document.getElementById('targetPrevGrade').value = TARGET_PREV_GRADE;
                document.getElementById('targetNewGrade').value = TARGET_NEW_GRADE;
                setTimeout(() => {
                    document.getElementById('freeStatus').textContent = '✅ آماده';
                }, 1000);
            }
        }

        function updateTargetGrades() {
            let prev = document.getElementById('targetPrevGrade');
            let nxt = document.getElementById('targetNewGrade');
            if (prev) {
                TARGET_PREV_GRADE = prev.value;
                localStorage.setItem('free_student_target_prev', TARGET_PREV_GRADE);
            }
            if (nxt) {
                TARGET_NEW_GRADE = nxt.value;
                localStorage.setItem('free_student_target_new', TARGET_NEW_GRADE);
            }
            document.getElementById('freeStatus').textContent = `🎯 ${TARGET_PREV_GRADE} → ${TARGET_NEW_GRADE}`;
        }

        function createPanel() {
            let savedPrev = localStorage.getItem('free_student_target_prev');
            let savedNew = localStorage.getItem('free_student_target_new');
            if (savedPrev) TARGET_PREV_GRADE = savedPrev;
            if (savedNew) TARGET_NEW_GRADE = savedNew;

            let p = document.createElement('div');
            p.id = 'freeStudentPanel';
            p.style.cssText = 'position:fixed;top:20px;left:20px;background:#fff;border:2px solid #0f4c81;border-radius:12px;padding:16px 18px;width:340px;z-index:999999;box-shadow:0 4px 20px rgba(0,0,0,0.25);font-family:Tahoma,sans-serif;direction:rtl;font-size:13px;color:#333;';

            let grades = ['اول', 'دوم', 'سوم', 'چهارم', 'پنجم', 'ششم'];
            let prevOpts = grades.map(g => `<option value="${g}" ${g === TARGET_PREV_GRADE ? 'selected' : ''}>${g}</option>`).join('');
            let newOpts = grades.map(g => `<option value="${g}" ${g === TARGET_NEW_GRADE ? 'selected' : ''}>${g}</option>`).join('');

            p.innerHTML = '<div id="freePanelHeader" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;padding-bottom:10px;border-bottom:2px solid #0f4c81;user-select:none;"><strong style="color:#0f4c81;font-size:15px;">🔓 آزادسازی</strong><button id="btnClose" style="background:none;border:none;cursor:pointer;font-size:18px;color:#999;">✕</button></div><div style="background:#f0f6ff;padding:12px;border-radius:8px;margin-bottom:12px;text-align:center;"><div style="font-size:12px;color:#666;">تعداد آزادسازی‌شده:</div><div id="freeCounter" style="font-size:28px;font-weight:bold;color:#0f4c81;">0</div><div id="freeStatus" style="font-size:11px;color:#666;margin-top:5px;">آماده</div></div><div style="display:flex;gap:8px;margin-bottom:10px;flex-wrap:wrap;justify-content:center;"><div style="flex:1;min-width:80px;"><div style="font-size:10px;color:#666;margin-bottom:2px;text-align:center;">پایه مبدأ</div><select id="targetPrevGrade" style="width:100%;padding:4px;border-radius:4px;border:1px solid #ccc;font-family:inherit;text-align:center;">' + prevOpts + '</select></div><div style="flex:1;min-width:80px;"><div style="font-size:10px;color:#666;margin-bottom:2px;text-align:center;">پایه مقصد</div><select id="targetNewGrade" style="width:100%;padding:4px;border-radius:4px;border:1px solid #ccc;font-family:inherit;text-align:center;">' + newOpts + '</select></div></div><div style="display:flex;flex-direction:column;gap:8px;"><button id="btnStartFree" style="background:#0f4c81;color:white;border:none;padding:10px;border-radius:6px;cursor:pointer;font-family:inherit;font-weight:bold;">▶️ شروع</button><div style="display:flex;gap:8px;"><button id="btnStopFree" style="flex:1;background:#ef4444;color:white;border:none;padding:10px;border-radius:6px;cursor:pointer;font-family:inherit;font-weight:bold;">⛔ توقف</button><button id="btnReset" style="flex:1;background:#f59e0b;color:#0f1117;border:none;padding:10px;border-radius:6px;cursor:pointer;font-family:inherit;font-weight:bold;">🔄 ریست</button></div></div><div style="margin-top:10px;font-size:11px;color:#666;text-align:center;border-top:1px solid #eee;padding-top:8px;">⚠️ هنگام اجرا، تب مرورگر را فعال نگه دارید.</div>';

            document.body.appendChild(p);

            let h = document.getElementById('freePanelHeader');
            let x1 = 0, y1 = 0, x2 = 0, y2 = 0;
            h.onmousedown = function(e) {
                e.preventDefault();
                x1 = e.clientX;
                y1 = e.clientY;
                document.onmouseup = () => { document.onmouseup = null; document.onmousemove = null; };
                document.onmousemove = function(e) {
                    e.preventDefault();
                    x2 = x1 - e.clientX;
                    y2 = y1 - e.clientY;
                    x1 = e.clientX;
                    y1 = e.clientY;
                    p.style.top = (p.offsetTop - y2) + 'px';
                    p.style.left = (p.offsetLeft - x2) + 'px';
                };
            };

            document.getElementById('btnClose').onclick = function() {
                p.remove();
            };

            document.getElementById('btnStartFree').onclick = startProcess;
            document.getElementById('btnStopFree').onclick = stop;
            document.getElementById('btnReset').onclick = fullReset;
            document.getElementById('targetPrevGrade').onchange = updateTargetGrades;
            document.getElementById('targetNewGrade').onchange = updateTargetGrades;

            updateTargetGrades();
        }

        createPanel();
    }
 // ==================== ابزار ۱۰: استخراج لیست کلاسی (نسخه API) ====================
function extractClassListTool() {
    if (document.getElementById('extractPanel')) {
        document.getElementById('extractPanel').remove();
    }

    cleanupAllPanels();

    let isRunning = false;
    let allClasses = [];

    function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

    function escapeHtml(text) {
        var div = document.createElement('div');
        div.appendChild(document.createTextNode(text || ''));
        return div.innerHTML;
    }

    function getToken() {
        try { var t = sessionStorage.getItem('token'); if (t) return t; } catch(e) {}
        try { var t2 = localStorage.getItem('token'); if (t2) return t2; } catch(e) {}
        return null;
    }

    function getClientId() {
        try { var c1 = localStorage.getItem('pages-client-id'); if (c1) return c1; } catch(e) {}
        try { var c2 = sessionStorage.getItem('pages-client-id'); if (c2) return c2; } catch(e) {}
        return 'mt1ag7vh-f9qt51vf-is5kslgz-am182rru-3pu0h0ne';
    }

    // ===== پیدا کردن ساختار پایه‌ها و کلاس‌ها =====
    function findGradesAndClasses() {
        let grades = [];

        // از صفحه اصلی
        let rows = document.querySelectorAll('table.table-bordered tbody tr');
        rows.forEach(function(row) {
            let btn = row.querySelector('button[ng-click*="addStudents"]');
            if (!btn) return;
            try {
                let s = angular.element(row).scope();
                if (s && s.x) {
                    let x = s.x;
                    grades.push({
                        gradeTypeId: x.gradeTypeId,
                        gradeName: x.gradeName,
                        createSchoolClassId: x.createSchoolClassId,
                        classNames: (x.classNames || []).map(function(c) {
                            return { id: c.id, name: c.name };
                        })
                    });
                }
            } catch(e) {}
        });

        if (grades.length > 0) return grades;

        // fallback: از مودال
        let modal = document.querySelector('[uib-modal-window], .modal.show, .modal[style*="display: block"]');
        if (modal) {
            try {
                let s = angular.element(modal).scope();
                if (s && s.model && s.model.schoolClasses && s.model.schoolClasses.studentClassByGrades) {
                    return s.model.schoolClasses.studentClassByGrades.map(function(g) {
                        return {
                            gradeTypeId: g.gradeTypeId,
                            gradeName: g.gradeName,
                            createSchoolClassId: g.createSchoolClassId,
                            classNames: (g.classNames || []).map(function(c) {
                                return { id: c.id, name: c.name };
                            })
                        };
                    });
                }
            } catch(e) {}
        }

        return grades;
    }

    // ===== گرفتن دانش‌آموزان یک کلاس =====
    async function fetchClassStudents(classRoomId) {
        let token = getToken();
        if (!token) return [];

        try {
            let response = await fetch('/api/Student/GetStudentInfo', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8',
                    'Accept': 'application/json, text/javascript, */*; q=0.01',
                    'X-Requested-With': 'XMLHttpRequest',
                    'Authorization': 'Bearer ' + token,
                    'client-id': getClientId()
                },
                body: JSON.stringify({
                    take: 500,
                    skip: 0,
                    page: 1,
                    pageSize: 500,
                    // ✅ دقیقاً همون sort که سیدا استفاده می‌کنه
                    sort: [{ field: 'id', dir: 'asc' }],
                    filter: {
                        logic: 'and',
                        filters: [{
                            field: 'classRoomId',
                            operator: 'eq',
                            value: classRoomId
                        }]
                    }
                })
            });

            if (!response.ok) throw new Error('HTTP ' + response.status);

            let json = await response.json();
            let items = (json.data && json.data.data) || json.data || [];

            // ✅ بدون sort دستی — ترتیب API مثل سیدا

            return items.map(function(item, idx) {
                return {
                    row: idx + 1,
                    code: String(item.nationalCode || '').trim(),
                    name: (item.firstName || '').trim(),
                    family: (item.lastName || '').trim()
                };
            }).filter(function(s) { return s.code && s.code.length > 3; });

        } catch(e) {
            console.error('خطا در گرفتن دانش‌آموزان کلاس ' + classRoomId + ':', e);
            return [];
        }
    }

    // ===== ساخت فایل Word =====
    function generateWordFile(className, students) {
        if (!students || students.length === 0) {
            alert('❌ هیچ داده‌ای یافت نشد!');
            return;
        }

        var htmlContent = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">';
        htmlContent += '<head><meta charset="UTF-8"><meta http-equiv="Content-Type" content="text/html; charset=UTF-8">';
        htmlContent += '<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom></w:WordDocument></xml><![endif]-->';
        htmlContent += '<style>@page { size: A4 landscape; margin: 1.5cm; }';
        htmlContent += 'table { border-collapse: collapse; width: 100%; font-family: "B Nazanin", "Tahoma", sans-serif; font-size: 12pt; direction: rtl; }';
        htmlContent += 'th { background-color: #e0e0e0; font-weight: bold; border: 1px solid #000; padding: 8px 10px; text-align: center; }';
        htmlContent += 'td { border: 1px solid #000; padding: 6px 8px; text-align: center; }';
        htmlContent += 'h2, h3 { text-align: center; font-family: "B Nazanin", "Tahoma", sans-serif; }';
        htmlContent += '</style></head><body>';

        htmlContent += '<h2>لیست دانش‌آموزان</h2><br>';
        htmlContent += '<h3>لیست دانش آموزان کلاس ' + escapeHtml(className) + ' (تعداد: ' + students.length + ')</h3>';
        htmlContent += '<table><thead><tr><th>ردیف</th><th>کد دانش‌آموزی</th><th>نام خانوادگی و نام</th>';
        for (var i = 0; i < 10; i++) htmlContent += '<th></th>';
        htmlContent += '</tr></thead><tbody>';

        students.forEach(function(s, index) {
            htmlContent += '<tr><td>' + (index + 1) + '</td><td>' + escapeHtml(s.code) + '</td><td>' + escapeHtml((s.family + ' ' + s.name).trim()) + '</td>';
            for (var j = 0; j < 10; j++) htmlContent += '<td></td>';
            htmlContent += '</tr>';
        });

        htmlContent += '</tbody></table></body></html>';

        var blob = new Blob([htmlContent], { type: 'application/msword;charset=utf-8' });
        var link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        var safeName = className.replace(/[^\u0600-\u06FF\w\s\-]/g, '').replace(/\s+/g, ' ').trim();
        link.download = 'لیست کلاس ' + safeName + '.doc';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(function(){ URL.revokeObjectURL(link.href); }, 1000);
    }

    function showStatus(text, type) {
        let el = document.getElementById('extractStatus');
        if (!el) return;
        el.textContent = text;
        if (type === 'error') el.style.color = '#ef4444';
        else if (type === 'success') el.style.color = '#10b981';
        else if (type === 'info') el.style.color = '#3ecfe0';
        else el.style.color = '#888899';
    }

    function updatePanel() {
        let totalCountEl = document.getElementById('totalCount');
        let classListEl = document.getElementById('classList');

        if (totalCountEl) {
            let total = allClasses.reduce((acc, cls) => acc + cls.students.length, 0);
            totalCountEl.textContent = total.toLocaleString('fa-IR');
        }

        if (classListEl) {
            if (allClasses.length === 0) {
                classListEl.innerHTML = '<div style="color:#888;text-align:center;padding:10px;">هنوز کلاسی جمع‌آوری نشده است.</div>';
                return;
            }

            var html = '';
            allClasses.forEach(function(cls, index) {
                html += '<div style="background:#1a1d2e;padding:10px;margin-bottom:8px;border-radius:6px;border:1px solid #2a2d42;">';
                html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">';
                html += '<span style="color:#f59e0b;font-weight:bold;font-size:14px;">📚 ' + escapeHtml(cls.className) + '</span>';
                html += '<span style="color:#3ecfe0;font-size:12px;">' + cls.students.length + ' دانش‌آموز</span>';
                html += '</div>';
                if (cls.students.length > 0) {
                    html += '<div style="font-size:11px;color:#888899;margin-bottom:6px;">نمونه: ' + escapeHtml(cls.students[0].family + ' ' + cls.students[0].name);
                    if (cls.students.length > 1) html += '، ' + escapeHtml(cls.students[1].family + ' ' + cls.students[1].name);
                    html += '</div>';
                }
                html += '<div style="display:flex;gap:6px;">';
                html += '<button class="download-class-btn" data-index="' + index + '" style="flex:1;background:#10b981;color:white;border:none;padding:6px 12px;border-radius:4px;cursor:pointer;font-family:inherit;font-size:11px;">📄 دانلود ورد</button>';
                html += '<button class="delete-class-btn" data-index="' + index + '" style="background:#ef4444;color:white;border:none;padding:6px 10px;border-radius:4px;cursor:pointer;font-family:inherit;font-size:11px;">🗑️</button>';
                html += '</div></div>';
            });
            classListEl.innerHTML = html;

            document.querySelectorAll('.download-class-btn').forEach(function(btn) {
                btn.onclick = function() {
                    let index = parseInt(btn.getAttribute('data-index'));
                    let cls = allClasses[index];
                    if (cls) generateWordFile(cls.className, cls.students);
                };
            });

            document.querySelectorAll('.delete-class-btn').forEach(function(btn) {
                btn.onclick = function() {
                    let index = parseInt(btn.getAttribute('data-index'));
                    let cls = allClasses[index];
                    if (cls && confirm('حذف کلاس "' + cls.className + '"؟')) {
                        allClasses.splice(index, 1);
                        sessionStorage.setItem('extracted_classes_data', JSON.stringify(allClasses));
                        updatePanel();
                    }
                };
            });
        }
    }

    function createPanel() {
        var panel = document.createElement('div');
        panel.id = 'extractPanel';
        panel.style.cssText = 'position:fixed;top:20px;left:20px;background:#1a1d2e;border:2px solid #3ecfe0;border-radius:12px;padding:16px 18px;width:400px;max-width:90vw;max-height:90vh;z-index:999999;box-shadow:0 4px 20px rgba(0,0,0,0.4);font-family:Tahoma,sans-serif;direction:rtl;font-size:13px;color:#e8e8f0;overflow-y:auto;';

        panel.innerHTML =
            '<div id="extractHeader" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;padding-bottom:10px;border-bottom:2px solid #3ecfe0;user-select:none;cursor:move;">' +
                '<strong style="color:#3ecfe0;font-size:15px;">📋 استخراج لیست کلاسی (API)</strong>' +
                '<button id="btnClose" style="background:none;border:none;cursor:pointer;font-size:18px;color:#999;">✕</button>' +
            '</div>' +
            '<div style="background:#0f1117;padding:12px;border-radius:8px;margin-bottom:12px;text-align:center;">' +
                '<div style="font-size:12px;color:#888899;">تعداد کل دانش‌آموزان جمع‌آوری شده:</div>' +
                '<div id="totalCount" style="font-size:28px;font-weight:bold;color:#3ecfe0;">0</div>' +
                '<div id="extractStatus" style="font-size:11px;color:#888899;margin-top:6px;">آماده شروع...</div>' +
            '</div>' +
            '<button id="btnCollectAll" style="width:100%;background:#8b5cf6;color:white;border:none;padding:12px;border-radius:6px;cursor:pointer;font-family:inherit;font-weight:bold;font-size:14px;margin-bottom:8px;">🚀 استخراج همه پایه‌ها و کلاس‌ها</button>' +
            '<button id="btnStop" style="width:100%;background:#ef4444;color:white;border:none;padding:10px;border-radius:6px;cursor:pointer;font-family:inherit;font-weight:bold;display:none;margin-bottom:8px;">⛔ توقف</button>' +
            '<button id="btnDownloadAll" style="width:100%;background:#10b981;color:white;border:none;padding:10px;border-radius:6px;cursor:pointer;font-family:inherit;font-weight:bold;margin-bottom:8px;">📥 دانلود همه (Word)</button>' +
            '<button id="btnReset" style="background:transparent;color:#888899;border:1px solid #2a2d42;padding:8px;border-radius:6px;cursor:pointer;font-family:inherit;font-size:12px;width:100%;margin-bottom:12px;">🔄 پاک کردن همه</button>' +
            '<div style="font-size:12px;color:#888899;margin-bottom:6px;">کلاس‌های جمع‌آوری شده:</div>' +
            '<div id="classList" style="background:#0f1117;border-radius:8px;padding:8px;max-height:300px;overflow-y:auto;font-size:12px;">' +
                '<div style="color:#888;text-align:center;padding:10px;">هنوز کلاسی جمع‌آوری نشده است.</div>' +
            '</div>';

        document.body.appendChild(panel);

        var header = document.getElementById('extractHeader');
        var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        header.onmousedown = function(e) {
            e = e || window.event;
            e.preventDefault();
            pos3 = e.clientX;
            pos4 = e.clientY;
            window.addEventListener('mouseup', closeDrag);
            window.addEventListener('mousemove', dragMove);
        };
        function dragMove(e) {
            e = e || window.event;
            e.preventDefault();
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;
            panel.style.top = (panel.offsetTop - pos2) + 'px';
            panel.style.left = (panel.offsetLeft - pos1) + 'px';
        }
        function closeDrag() {
            window.removeEventListener('mouseup', closeDrag);
            window.removeEventListener('mousemove', dragMove);
        }

        try {
            var saved = sessionStorage.getItem('extracted_classes_data');
            if (saved) allClasses = JSON.parse(saved);
        } catch(e) { allClasses = []; }
        updatePanel();

        document.getElementById('btnClose').onclick = function() {
            isRunning = false;
            panel.remove();
        };

        document.getElementById('btnCollectAll').onclick = async function() {
            if (isRunning) { showStatus('⚠️ در حال اجراست...', 'error'); return; }

            let grades = findGradesAndClasses();
            if (grades.length === 0) {
                showStatus('❌ ساختار پایه‌ها پیدا نشد!', 'error');
                alert('❌ ساختار پایه‌ها پیدا نشد!\n\nمطمئن شو تو صفحه «کلاس‌های مدرسه» هستی.');
                return;
            }

            isRunning = true;
            document.getElementById('btnCollectAll').disabled = true;
            document.getElementById('btnStop').style.display = 'block';
            allClasses = [];

            let totalClasses = grades.reduce((sum, g) => sum + g.classNames.length, 0);
            let currentClassNum = 0;

            for (let g of grades) {
                if (!isRunning) break;
                for (let c of g.classNames) {
                    if (!isRunning) break;
                    currentClassNum++;
                    let className = c.name;
                    showStatus('⏳ (' + currentClassNum + '/' + totalClasses + ') ' + className + '...', 'info');

                    let students = await fetchClassStudents(c.id);

                    allClasses.push({
                        className: className,
                        gradeName: g.gradeName,
                        classId: c.id,
                        gradeTypeId: g.gradeTypeId,
                        students: students
                    });

                    updatePanel();
                    sessionStorage.setItem('extracted_classes_data', JSON.stringify(allClasses));
                    await sleep(150);
                }
            }

            isRunning = false;
            document.getElementById('btnCollectAll').disabled = false;
            document.getElementById('btnStop').style.display = 'none';

            let totalStudents = allClasses.reduce((acc, cls) => acc + cls.students.length, 0);
            showStatus('✅ تمام! ' + allClasses.length + ' کلاس، ' + totalStudents + ' دانش‌آموز', 'success');
        };

        document.getElementById('btnStop').onclick = function() {
            isRunning = false;
            showStatus('⏹️ در حال توقف...', 'error');
        };

        document.getElementById('btnDownloadAll').onclick = function() {
            if (allClasses.length === 0) {
                alert('❌ هیچ کلاسی جمع‌آوری نشده است!');
                return;
            }

            let totalStudents = allClasses.reduce((acc, cls) => acc + cls.students.length, 0);
            if (confirm('دانلود ' + allClasses.length + ' کلاس با مجموع ' + totalStudents + ' دانش‌آموز؟\n\nهر کلاس یه فایل Word جدا می‌شه.')) {
                allClasses.forEach(function(cls, index) {
                    setTimeout(function() {
                        generateWordFile(cls.className, cls.students);
                    }, index * 1000);
                });
            }
        };

        document.getElementById('btnReset').onclick = function() {
            if (confirm('پاک کردن همه کلاس‌ها؟')) {
                allClasses = [];
                sessionStorage.removeItem('extracted_classes_data');
                updatePanel();
                showStatus('🔄 پاک شد', 'info');
            }
        };
    }

    createPanel();
}
// ==================== ابزار ۱۱: استخراج مشخصات (نسخه API) ====================
    function smartInfoExtractTool() {
        if (document.getElementById('autoExtractPanel')) {
            document.getElementById('autoExtractPanel').remove();
        }

        cleanupAllPanels();

        const STORAGE_KEY = 'angular_students_data_v5';
        let allStudents = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        let isRunning = false;

        function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

        function showNotification(text, duration) {
            if (duration === undefined) duration = 4000;
            let old = document.getElementById('autoNotif');
            if (old) old.remove();
            let notif = document.createElement('div');
            notif.id = 'autoNotif';
            notif.style.cssText = 'position:fixed;bottom:20px;left:20px;background:#333;color:white;padding:12px 20px;border-radius:8px;z-index:9999999;font-family:Tahoma;font-size:13px;box-shadow:0 4px 12px rgba(0,0,0,0.3);max-width:350px;direction:rtl;';
            notif.textContent = text;
            notif.addEventListener('click', function() { notif.remove(); });
            document.body.appendChild(notif);
            if (duration > 0) setTimeout(function() { if (notif.parentNode) notif.remove(); }, duration);
        }

        function makeDraggable(elmnt, handle) {
            let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
            handle.style.cursor = 'grab';
            handle.onmousedown = function(e) {
                e = e || window.event; e.preventDefault();
                pos3 = e.clientX; pos4 = e.clientY;
                document.onmouseup = function() { document.onmouseup = null; document.onmousemove = null; handle.style.cursor = 'grab'; };
                document.onmousemove = function(e) {
                    e = e || window.event; e.preventDefault();
                    pos1 = pos3 - e.clientX; pos2 = pos4 - e.clientY;
                    pos3 = e.clientX; pos4 = e.clientY;
                    elmnt.style.top = (elmnt.offsetTop - pos2) + 'px';
                    elmnt.style.left = (elmnt.offsetLeft - pos1) + 'px';
                };
                handle.style.cursor = 'grabbing';
            };
        }

        function updatePanelUI(status) {
            status = status || '';
            let totalEl = document.getElementById('aeTotal');
            let msg = document.getElementById('aeStatus');
            if (!totalEl || !msg) return;
            totalEl.textContent = allStudents.length.toLocaleString('fa-IR');
            if (status) {
                msg.textContent = status;
                msg.style.color = isRunning ? '#8b5cf6' : '#c62828';
            }
            else {
                msg.textContent = 'آماده شروع...';
                msg.style.color = '#666';
            }
        }

        function saveData() {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(allStudents));
            } catch (e) {
                console.warn('خطا در ذخیره‌سازی:', e);
                showNotification('⚠️ حافظه پر شد.');
            }
        }

        function clearMemory() {
            if (confirm('آیا مطمئن هستید؟ تمام داده‌ها پاک خواهند شد.')) {
                localStorage.removeItem(STORAGE_KEY);
                allStudents = [];
                updatePanelUI();
                showNotification('تمام داده‌ها پاک شدند.');
            }
        }

        function stopExtraction() {
            if (isRunning) {
                isRunning = false;
                showNotification('دستور توقف صادر شد.');
                updatePanelUI('متوقف شد');
            }
        }

        function normalizePhone(val) {
            if (val === null || val === undefined || val === '') return '';
            var s = String(val).trim().replace(/[^\d]/g, '');
            if (s.length === 10 && s.charAt(0) === '9') s = '0' + s;
            return s;
        }

        // ===== دریافت توکن =====
        function getToken() {
            try {
                var t = sessionStorage.getItem('token');
                if (t) return t;
            } catch(e) {}
            try {
                var t2 = localStorage.getItem('token');
                if (t2) return t2;
            } catch(e) {}
            return null;
        }

        // ===== دریافت client-id =====
        function getClientId() {
            try {
                var c1 = localStorage.getItem('pages-client-id');
                if (c1) return c1;
            } catch(e) {}
            try {
                var c2 = sessionStorage.getItem('pages-client-id');
                if (c2) return c2;
            } catch(e) {}
            return 'mt1ag7vh-f9qt51vf-is5kslgz-am182rru-3pu0h0ne';
        }

        // ✅ اضافه شد: تابع خواندن فیلتر گرید
        function getGridFilter() {
            try {
                var gridEl = document.querySelector('.k-grid');
                if (!gridEl) return null;
                var grid = $(gridEl).data('kendoGrid');
                if (!grid) return null;
                return grid.dataSource.filter();
            } catch (e) { return null; }
        }

        async function fetchAllStudentsFromAPI() {
            var pageSize = 500;
            var page = 1;
            var allFetched = [];
            var total = 0;
            var hasMore = true;

            var token = getToken();
            if (!token) {
                showNotification('❌ توکن پیدا نشد. لطفاً دوباره لاگین کن.');
                return [];
            }

            var clientId = getClientId();

            // ✅ اضافه شد: خواندن فیلتر گرید
            var gridFilter = getGridFilter();

            console.log('🔑 Token:', token.substring(0, 50) + '...');
            console.log('🔑 Client-ID:', clientId);

            // ✅ اضافه شد: نمایش فیلتر فعال
            if (gridFilter) {
                console.log('📊 فیلتر گرید:', JSON.stringify(gridFilter));
                var filterDesc = 'نامشخص';
                try {
                    filterDesc = gridFilter.filters.map(function(f) { return f.field + '=' + f.value; }).join(', ');
                } catch(e) {}
                showNotification('📊 فیلتر فعال: ' + filterDesc);
            }

            while (hasMore && isRunning) {
                try {
                    // ✅ اضافه شد: body با فیلتر
                    var body = {
                        take: pageSize,
                        skip: (page - 1) * pageSize,
                        page: page,
                        pageSize: pageSize,
                        sort: [{ field: 'id', dir: 'asc' }]
                    };

                    // ✅ اضافه شد: اضافه کردن فیلتر
                    if (gridFilter) {
                        body.filter = gridFilter;
                    }

                    var response = await fetch('/api/Student/GetStudentInfo', {
                        method: 'POST',
                        credentials: 'include',
                        headers: {
                            'Content-Type': 'application/json; charset=utf-8',
                            'Accept': 'application/json, text/javascript, */*; q=0.01',
                            'X-Requested-With': 'XMLHttpRequest',
                            'Authorization': 'Bearer ' + token,
                            'client-id': clientId
                        },
                        body: JSON.stringify(body)
                    });

                    if (!response.ok) {
                        throw new Error('HTTP ' + response.status);
                    }

                    var json = await response.json();
                    var items = (json.data && json.data.data) || json.data || [];

                    if (!Array.isArray(items) || items.length === 0) {
                        hasMore = false;
                        break;
                    }

                    if (json.data && json.data.total) {
                        total = json.data.total;
                    }

                    allFetched = allFetched.concat(items);

                    updatePanelUI('دریافت شد: ' + allFetched.length + (total ? ' از ' + total : ''));

                    if (items.length < pageSize) {
                        hasMore = false;
                    } else {
                        page++;
                    }

                    await sleep(200);

                } catch (e) {
                    console.error('خطا در دریافت صفحه ' + page + ':', e);
                    showNotification('❌ خطا در صفحه ' + page + ': ' + e.message);
                    hasMore = false;
                }
            }

            return allFetched;
        }

        function mapRecord(item) {
            var fatherPhone = normalizePhone(item.fatherMobileNumber);
            var motherPhone = normalizePhone(item.motherMobileNumber);
            var shadPhone = normalizePhone(item.studentMobileNumber);

            return {
                name: (item.firstName || '').trim(),
                family: (item.lastName || '').trim(),
                father: (item.fatherName || '').trim(),
                codemelli: String(item.nationalCode || '').trim(),
                birthDate: String(item.birthDate || '').trim(),
                fatherPhone: fatherPhone,
                motherPhone: motherPhone,
                shadPhone: shadPhone
            };
        }

        async function startExtraction() {
            if (isRunning) {
                showNotification('عملیات در حال انجام است...');
                return;
            }

            isRunning = true;
            showNotification('شروع استخراج از API...');
            updatePanelUI('در حال دریافت اطلاعات...');

            try {
                var rawData = await fetchAllStudentsFromAPI();

                if (!isRunning) {
                    updatePanelUI('متوقف شد');
                    return;
                }

                if (rawData.length === 0) {
                    showNotification('❌ داده‌ای دریافت نشد.');
                    isRunning = false;
                    updatePanelUI('خطا');
                    return;
                }

                allStudents = rawData.map(mapRecord);
                saveData();
                updatePanelUI('✅ پایان کار');
                showNotification('استخراج با موفقیت پایان یافت! مجموع: ' + allStudents.length + ' دانش‌آموز.', 0);

            } catch (e) {
                console.error(e);
                showNotification('❌ خطا: ' + e.message);
                updatePanelUI('خطا');
            }

            isRunning = false;
        }

        function escapeHtml(text) {
            if (!text) return '';
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        function downloadWord() {
            if (allStudents.length === 0) { alert('هیچ داده‌ای برای دانلود وجود ندارد!'); return; }

            let tableRows = '';
            allStudents.forEach(function(s, i) {
                let fp = s.fatherPhone || '';
                let mp = s.motherPhone || '';
                let sp = s.shadPhone || '';

                let fatherDisplay = fp;
                let motherDisplay = mp;
                let fatherLabel = 'پدر';
                let motherLabel = 'مادر';

                if (sp) {
                    if (sp === fp) {
                        fatherLabel = 'پدر (شاد)';
                    } else if (sp === mp) {
                        motherLabel = 'مادر (شاد)';
                    }
                }

                let contactParts = [];
                if (fatherDisplay) {
                    contactParts.push(fatherLabel + ': ' + escapeHtml(fatherDisplay));
                }
                if (motherDisplay) {
                    contactParts.push(motherLabel + ': ' + escapeHtml(motherDisplay));
                }
                if (sp && sp !== fp && sp !== mp) {
                    contactParts.push('شاد: ' + escapeHtml(sp));
                }

                let contactInfo = contactParts.join('<br>');

                tableRows += '<tr>' +
                    '<td style="border:1px solid #999;padding:6px;text-align:center;">' + (i+1) + '</td>' +
                    '<td style="border:1px solid #999;padding:6px;">' + escapeHtml(s.family) + '</td>' +
                    '<td style="border:1px solid #999;padding:6px;">' + escapeHtml(s.name) + '</td>' +
                    '<td style="border:1px solid #999;padding:6px;">' + escapeHtml(s.father) + '</td>' +
                    '<td style="border:1px solid #999;padding:6px;text-align:center;">' + escapeHtml(s.codemelli) + '</td>' +
                    '<td style="border:1px solid #999;padding:6px;text-align:center;">' + escapeHtml(s.birthDate) + '</td>' +
                    '<td style="border:1px solid #999;padding:8px;text-align:right;direction:rtl;line-height:1.8;font-size:10pt;">' + contactInfo + '</td>' +
                    '</tr>';
            });

            let html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">' +
                '<head><meta charset="utf-8"><title>مشخصات</title>' +
                '<style>body{font-family:Tahoma,Arial;font-size:11pt;direction:rtl}h2{text-align:center;color:#333}' +
                'table{border-collapse:collapse;width:100%;direction:rtl;margin-top:15px}' +
                'th{background:#4472C4;color:white;padding:8px;border:1px solid #999;text-align:center}td{padding:6px;border:1px solid #999}</style>' +
                '</head><body>' +
                '<h2>لیست کامل مشخصات دانش‌آموزان و شماره‌های تماس</h2>' +
                '<p style="text-align:center;font-weight:bold;">تعداد کل: ' + allStudents.length + ' نفر</p>' +
                '<table><thead><tr>' +
                '<th>ردیف</th><th>نام خانوادگی</th><th>نام</th><th>نام پدر</th><th>کد ملی</th><th>تاریخ تولد</th><th style="width:280px;">شماره‌های تماس</th>' +
                '</tr></thead><tbody>' + tableRows + '</tbody></table></body></html>';

            let blob = new Blob(['\ufeff' + html], { type: 'application/msword' });
            let link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'مشخصات_کامل_دانش_آموزان_و_تماس_والدین.doc';
            document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(link.href);
            showNotification('فایل Word با موفقیت دانلود شد!');
        }

        function createPanel() {
            let panel = document.createElement('div');
            panel.id = 'autoExtractPanel';
            panel.style.cssText = 'position:fixed;top:20px;left:20px;background:white;border:2px solid #8b5cf6;border-radius:10px;padding:15px;width:320px;z-index:999999;box-shadow:0 4px 20px rgba(0,0,0,0.2);font-family:Tahoma,sans-serif;direction:rtl;font-size:13px;color:#333;';
            panel.innerHTML =
                '<div id="aeHeader" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;padding-bottom:10px;border-bottom:2px solid #8b5cf6;user-select:none;">' +
                    '<strong style="color:#8b5cf6;font-size:15px;">📋 استخراج مشخصات (API)</strong>' +
                    '<button id="btnClosePanel" style="background:none;border:none;cursor:pointer;font-size:18px;color:#999;">✕</button>' +
                '</div>' +
                '<div style="background:#faf5ff;padding:12px;border-radius:8px;margin-bottom:12px;text-align:center;">' +
                    '<div style="font-size:12px;color:#666;">تعداد دانش‌آموزان استخراج‌شده:</div>' +
                    '<div id="aeTotal" style="font-size:28px;font-weight:bold;color:#2e7d32;">0</div>' +
                    '<div id="aeStatus" style="font-size:11px;color:#666;margin-top:5px;">آماده شروع...</div>' +
                '</div>' +
                '<div style="display:flex;flex-direction:column;gap:8px;">' +
                    '<div style="display:flex;gap:8px;">' +
                        '<button id="btnStart" style="flex:1;background:#8b5cf6;color:white;border:none;padding:10px;border-radius:6px;cursor:pointer;font-family:inherit;font-weight:bold;">▶️ شروع</button>' +
                        '<button id="btnStop" style="flex:1;background:#ef4444;color:white;border:none;padding:10px;border-radius:6px;cursor:pointer;font-family:inherit;font-weight:bold;">⛔ توقف</button>' +
                    '</div>' +
                    '<button id="btnDownload" style="background:#10b981;color:white;border:none;padding:10px;border-radius:6px;cursor:pointer;font-family:inherit;font-weight:bold;">📥 دانلود Word</button>' +
                    '<button id="btnClear" style="background:#fff;color:#c62828;border:1px solid #c62828;padding:8px;border-radius:6px;cursor:pointer;font-family:inherit;font-size:12px;margin-top:5px;">🗑️ پاک‌سازی</button>' +
                '</div>' +
                '<div style="margin-top:10px;font-size:11px;color:#666;text-align:center;border-top:1px solid #eee;padding-top:8px;">' +
                    '⚡ دریافت از API — سریع‌تر و دقیق‌تر' +
                '</div>';
            document.body.appendChild(panel);
            makeDraggable(panel, document.getElementById('aeHeader'));

            document.getElementById('btnClosePanel').addEventListener('click', function() {
                panel.remove();
            });

            document.getElementById('btnStart').addEventListener('click', startExtraction);
            document.getElementById('btnStop').addEventListener('click', stopExtraction);
            document.getElementById('btnDownload').addEventListener('click', downloadWord);
            document.getElementById('btnClear').addEventListener('click', clearMemory);
        }

        createPanel();
        updatePanelUI();

        if (allStudents.length > 0) {
            updatePanelUI('✅ ' + allStudents.length + ' دانش‌آموز از قبل ذخیره شده است.');
        }

        showNotification('پنل آماده است. دکمه "شروع" را بزنید.');
    }

    // ==================== ابزار ۱۲: تحلیل نمرات ====================
    function gradeAnalysisTool() {
        if (document.getElementById('gradeCollectorPanel')) {
            document.getElementById('gradeCollectorPanel').remove();
        }

        cleanupAllPanels();

        const STORAGE_KEY = 'accumulated_grade_stats_v7';

        function getText(el) {
            return (el.textContent || '').trim();
        }

        function escapeHtml(text) {
            if (!text) return '';
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        function getGradeInfo() {
            let gradeLabels = document.querySelectorAll('label.infomark[ng-bind="obj.gradeTypeTitle"]');
            for (let label of gradeLabels) {
                let text = getText(label);
                if (text && text.includes('-')) {
                    let parts = text.split('-');
                    if (parts.length === 2) {
                        let gradeName = parts[1].trim();
                        return 'پایه ' + gradeName;
                    }
                }
                if (text && (text.includes('اول') || text.includes('دوم') || text.includes('سوم') || text.includes('چهارم') || text.includes('پنجم') || text.includes('ششم'))) {
                    return 'پایه ' + text.replace(/^[0-9]*-/, '').trim();
                }
            }
            return 'پایه نامشخص';
        }

        function getTermInfo() {
            let termLabels = document.querySelectorAll('label.infomark.ng-binding');
            for (let label of termLabels) {
                let text = getText(label);
                if (text.includes('نیمه دوم')) return 'نوبت دوم';
                if (text.includes('نیمه اول')) return 'نوبت اول';
                if (text.includes('دوره تابستانی') || text.includes('تابستانی')) return 'نوبت تابستان';
            }
            return 'نوبت نامشخص';
        }

        function categorizeGrade(text) {
            if (!text) return 'سایر';
            text = text.trim().replace(/\u200c/g, ' ').replace(/\s+/g, ' ');
            if (text.includes('خیلی خوب') || text === 'خ خ' || text === 'خ‌خ') return 'خ خ';
            if (text === 'خ' || (text.includes('خوب') && !text.includes('خیلی'))) return 'خ';
            if (text.includes('قابل قبول') || text === 'ق ق' || text === 'ق‌ق') return 'ق ق';
            if (text.includes('نیاز به تلاش') || text.includes('ن ب ت') || text === 'ن‌ب‌ت' || text === 'ن ب ت') return 'ن ب ت';
            return 'سایر';
        }

        function isNoGrade(text) {
            if (!text) return false;
            return text.trim().includes('عدم درج نمره');
        }

        function getStoredData() {
            try {
                return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{"grade":"","term":"","subjects":{},"processedPages":[]}');
            } catch (e) {
                return { grade: '', term: '', subjects: {}, processedPages: [] };
            }
        }

        function saveStoredData(data) {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
            } catch (e) {
                console.warn('خطا در ذخیره‌سازی:', e);
                showNotification('⚠️ حافظه پر شد. امکان ذخیره داده‌های بیشتر وجود ندارد.');
            }
        }

        function formatPercent(value) {
            if (value === '-' || value === null || value === undefined) return '-';
            let num = parseFloat(value);
            if (isNaN(num)) return '-';
            if (Number.isInteger(num)) return num.toString();
            return num.toFixed(2);
        }

        function getPageHash() {
            let tables = document.querySelectorAll('table');
            if (tables.length === 0) return '';
            let mainTable = Array.from(tables).reduce((prev, current) => (prev.rows.length > current.rows.length) ? prev : current);
            let rows = mainTable.querySelectorAll('tbody tr');
            if (rows.length === 0) return '';
            
            let identifiers = [];
            for (let i = 0; i < Math.min(rows.length, 5); i++) {
                let cells = rows[i].querySelectorAll('td');
                if (cells.length >= 3) {
                    identifiers.push(getText(cells[2]) + '_' + getText(cells[3]));
                }
            }
            return identifiers.join('|');
        }

        function analyzeAndAccumulate() {
            let tables = document.querySelectorAll('table');
            if (tables.length === 0) {
                alert('❌ هیچ جدولی در این صفحه پیدا نشد!');
                return;
            }
            
            let mainTable = Array.from(tables).reduce((prev, current) => (prev.rows.length > current.rows.length) ? prev : current);
            let rows = Array.from(mainTable.querySelectorAll('tr'));
            if (rows.length < 2) return;
            
            let grade = getGradeInfo();
            let term = getTermInfo();
            
            let pageHash = getPageHash();
            let storedData = getStoredData();
            if (!storedData.processedPages) storedData.processedPages = [];
            
            if (pageHash && storedData.processedPages.includes(pageHash)) {
                alert('⚠️ این صفحه قبلاً پردازش شده است. از افزودن مجدد جلوگیری شد.');
                return;
            }
            
            let headerCells = Array.from(rows[0].querySelectorAll('th, td'));
            let subjects = [];
            let excludeKeywords = ['ردیف', 'نام', 'خانوادگی', 'کد', 'دانش', 'ملی', 'شماره', 'تصویر', 'عکس', 'امضا', 'عملیات', 'تاریخ', 'پدر'];
            
            headerCells.forEach((cell, index) => {
                let text = getText(cell);
                let isExcluded = excludeKeywords.some(keyword => text.includes(keyword));
                if (text && text.length > 1 && !isExcluded) {
                    subjects.push({ name: text, index: index });
                }
            });
            
            if (subjects.length === 0) {
                alert('❌ ستون درسی پیدا نشد!');
                return;
            }
            
            storedData.grade = grade;
            storedData.term = term;
            if (!storedData.subjects) storedData.subjects = {};
            
            let failedStudentsInPage = 0;
            let totalStudentsInPage = 0;
            let newStudentsCount = 0;
            
            for (let i = 1; i < rows.length; i++) {
                let cells = rows[i].querySelectorAll('td, th');
                let hasGrade = false;
                let hasNoGrade = false;
                let hasNBT = false;
                
                subjects.forEach(sub => {
                    if (cells[sub.index]) {
                        let gradeText = getText(cells[sub.index]);
                        if (gradeText) {
                            if (isNoGrade(gradeText)) {
                                hasNoGrade = true;
                                return;
                            }
                            hasGrade = true;
                            let category = categorizeGrade(gradeText);
                            if (category === 'ن ب ت') hasNBT = true;
                            if (!storedData.subjects[sub.name]) {
                                storedData.subjects[sub.name] = { 'خ خ': 0, 'خ': 0, 'ق ق': 0, 'ن ب ت': 0, 'سایر': 0, 'مجموع': 0 };
                            }
                            if (storedData.subjects[sub.name][category] !== undefined) {
                                storedData.subjects[sub.name][category]++;
                            } else {
                                storedData.subjects[sub.name]['سایر']++;
                            }
                            storedData.subjects[sub.name]['مجموع']++;
                        }
                    }
                });
                
                if (hasGrade && !hasNoGrade) {
                    newStudentsCount++;
                    totalStudentsInPage++;
                    if (hasNBT) failedStudentsInPage++;
                }
            }
            
            if (pageHash) {
                storedData.processedPages.push(pageHash);
                if (storedData.processedPages.length > 50) {
                    storedData.processedPages = storedData.processedPages.slice(-50);
                }
            }
            
            let totalFailed = parseInt(localStorage.getItem('failed_students_count') || '0');
            let totalCount = parseInt(localStorage.getItem('total_students_count') || '0');
            totalFailed += failedStudentsInPage;
            totalCount += totalStudentsInPage;
            localStorage.setItem('failed_students_count', totalFailed.toString());
            localStorage.setItem('total_students_count', totalCount.toString());
            
            saveStoredData(storedData);
            updatePanelUI(newStudentsCount);
            showNotification(newStudentsCount > 0 ? '✅ ' + newStudentsCount + ' دانش‌آموز جدید اضافه شد.' : '⚠️ دانش‌آموز جدیدی یافت نشد.');
        }

        function clearAllData() {
            if (confirm('⚠️ آیا مطمئن هستید؟\nتمام نمرات جمع‌آوری‌شده از تمام صفحات پاک خواهند شد.')) {
                localStorage.removeItem(STORAGE_KEY);
                localStorage.removeItem('failed_students_count');
                localStorage.removeItem('total_students_count');
                updatePanelUI();
                showNotification('🗑️ تمام داده‌ها پاک شدند.');
            }
        }

        async function downloadReportAsImage() {
            const reportElement = document.querySelector('#gradeReportOverlay > div');
            if (!reportElement) {
                alert('گزارشی برای دانلود وجود ندارد.');
                return;
            }

            showNotification('⏳ در حال آماده‌سازی عکس با کیفیت فوق‌العاده...');

            try {
                let gradeName = getGradeInfo();
                let fileName = 'گزارش_نمرات_' + gradeName.replace(/ /g, '_');
                
                const canvas = await html2canvas(reportElement, {
                    scale: 5,
                    useCORS: true,
                    allowTaint: true,
                    backgroundColor: '#ffffff',
                    logging: false,
                    width: reportElement.scrollWidth,
                    height: reportElement.scrollHeight,
                    windowWidth: reportElement.scrollWidth,
                    windowHeight: reportElement.scrollHeight,
                    onclone: function(clonedDoc) {
                        const clonedElement = clonedDoc.querySelector('#gradeReportOverlay > div');
                        if (clonedElement) {
                            const closeBtn = clonedElement.querySelector('#closeReportBtn');
                            if (closeBtn) closeBtn.remove();
                            
                            const btnContainers = clonedElement.querySelectorAll('div');
                            btnContainers.forEach(div => {
                                if (div.style.marginTop === '30px' && div.querySelector('#btnDownloadFinal')) {
                                    div.remove();
                                }
                            });
                            
                            const btnDownloadFinal = clonedElement.querySelector('#btnDownloadFinal');
                            if (btnDownloadFinal) btnDownloadFinal.remove();
                            
                            const btnDownloadImage = clonedElement.querySelector('#btnDownloadImage');
                            if (btnDownloadImage) btnDownloadImage.remove();
                            
                            const closeReportBtn2 = clonedElement.querySelector('#closeReportBtn2');
                            if (closeReportBtn2) closeReportBtn2.remove();
                            
                            const allDivs = clonedElement.querySelectorAll('div[style*="margin-top:30px"]');
                            allDivs.forEach(div => div.remove());
                            
                            ['btnDownloadFinal', 'btnDownloadImage', 'closeReportBtn2', 'closeReportBtn'].forEach(id => {
                                const el = clonedElement.querySelector('#' + id);
                                if (el) el.remove();
                            });
                        }
                    }
                });

                const link = document.createElement('a');
                link.download = fileName + '.png';
                link.href = canvas.toDataURL('image/png', 1.0);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                showNotification('✅ عکس با کیفیت عالی دانلود شد.');
                
            } catch (error) {
                console.error('خطا در html2canvas:', error);
                
                try {
                    let gradeName = getGradeInfo();
                    let fileName = 'گزارش_نمرات_' + gradeName.replace(/ /g, '_');
                    
                    const dataUrl = await htmlToImage.toPng(reportElement, {
                        quality: 1.0,
                        pixelRatio: 5,
                        backgroundColor: '#ffffff',
                        cacheBust: true,
                        filter: (node) => {
                            const excludedIds = ['closeReportBtn', 'closeReportBtn2', 'btnDownloadFinal', 'btnDownloadImage'];
                            if (excludedIds.includes(node.id)) {
                                return false;
                            }
                            if (node.style && node.style.marginTop === '30px') {
                                return false;
                            }
                            return true;
                        }
                    });

                    const link = document.createElement('a');
                    link.download = fileName + '.png';
                    link.href = dataUrl;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);

                    showNotification('✅ عکس با کیفیت عالی دانلود شد.');
                    
                } catch (fallbackError) {
                    console.error('خطا در html-to-image:', fallbackError);
                    alert('❌ خطا در دانلود عکس. لطفاً از دکمه دانلود Word استفاده کنید.');
                }
            }
        }

        function showReportAndDownload() {
            let storedData = getStoredData();
            let subjects = Object.keys(storedData.subjects || {});
            if (subjects.length === 0) {
                alert('هیچ داده‌ای جمع‌آوری نشده است.');
                return;
            }
            
            let totalStudents = 0;
            if (subjects.length > 0) {
                totalStudents = storedData.subjects[subjects[0]]['مجموع'] || 0;
            }
            
            let grade = storedData.grade || 'پایه نامشخص';
            let term = storedData.term || 'نوبت نامشخص';
            let failedCount = parseInt(localStorage.getItem('failed_students_count') || '0');
            let totalCount = parseInt(localStorage.getItem('total_students_count') || '0');
            
            if (totalCount > 0) {
                failedCount = Math.round((failedCount / totalCount) * totalStudents);
            }
            
            let passedCount = totalStudents - failedCount;
            if (passedCount < 0) passedCount = 0;
            if (failedCount > totalStudents) failedCount = totalStudents;

            let overlay = document.createElement('div');
            overlay.id = 'gradeReportOverlay';
            overlay.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(245,247,250,0.98);z-index:999999;display:flex;flex-direction:column;align-items:center;font-family:Tahoma,sans-serif;direction:rtl;overflow-y:auto;padding:40px 20px;box-sizing:border-box;';
            
            let html = '<div style="width:100%;max-width:900px;background:white;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,0.1);padding:30px;border:1px solid #e0e0e0;">';
            html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:25px;border-bottom:2px solid #4472C4;padding-bottom:15px;"><h2 style="margin:0;color:#333;font-size:22px;">📊 گزارش نهایی نمرات</h2><button id="closeReportBtn" style="background:#f44336;color:white;border:none;width:36px;height:36px;border-radius:50%;cursor:pointer;font-size:20px;">✕</button></div>';
            html += '<p style="text-align:center;font-size:16px;color:#555;margin-bottom:10px;"><strong>' + escapeHtml(grade) + '</strong> — <strong>' + escapeHtml(term) + '</strong></p>';
            html += '<p style="text-align:center;font-size:16px;color:#555;margin-bottom:20px;">تعداد دانش‌آموزان: <strong style="color:#4472C4;font-size:20px;">' + totalStudents + '</strong> نفر</p>';
            html += '<div style="overflow-x:auto;"><table id="finalReportTable" style="width:100%;border-collapse:collapse;font-size:14px;text-align:center;"><thead><tr style="background:#4472C4;color:white;"><th style="padding:12px;border:1px solid #335a9e;">نام درس</th><th style="padding:12px;border:1px solid #335a9e;background:#2e7d32;">خ خ</th><th style="padding:12px;border:1px solid #335a9e;">درصد</th><th style="padding:12px;border:1px solid #335a9e;background:#4caf50;">خ</th><th style="padding:12px;border:1px solid #335a9e;">درصد</th><th style="padding:12px;border:1px solid #335a9e;background:#ff9800;">ق ق</th><th style="padding:12px;border:1px solid #335a9e;">درصد</th><th style="padding:12px;border:1px solid #335a9e;background:#f44336;color:white;">ن ب ت</th><th style="padding:12px;border:1px solid #335a9e;">درصد</th><th style="padding:12px;border:1px solid #335a9e;">مجموع</th></tr></thead><tbody>';
            
            subjects.forEach(sub => {
                let s = storedData.subjects[sub];
                let total = s['مجموع'] || 0;
                let pKHKH = total > 0 ? ((s['خ خ'] || 0) / total * 100) : '-';
                let pKH = total > 0 ? ((s['خ'] || 0) / total * 100) : '-';
                let pGH = total > 0 ? ((s['ق ق'] || 0) / total * 100) : '-';
                let pNBT = total > 0 ? ((s['ن ب ت'] || 0) / total * 100) : '-';
                
                html += '<tr style="background:#fafafa;"><td style="padding:10px;border:1px solid #ddd;font-weight:bold;text-align:right;padding-right:15px;">' + escapeHtml(sub) + '</td>';
                html += '<td style="padding:10px;border:1px solid #ddd;font-weight:bold;color:#2e7d32;">' + (s['خ خ'] > 0 ? s['خ خ'] : '-') + '</td>';
                html += '<td style="padding:10px;border:1px solid #ddd;color:#2e7d32;">' + (s['خ خ'] > 0 ? formatPercent(pKHKH) : '-') + '</td>';
                html += '<td style="padding:10px;border:1px solid #ddd;color:#4caf50;">' + (s['خ'] > 0 ? s['خ'] : '-') + '</td>';
                html += '<td style="padding:10px;border:1px solid #ddd;color:#4caf50;">' + (s['خ'] > 0 ? formatPercent(pKH) : '-') + '</td>';
                html += '<td style="padding:10px;border:1px solid #ddd;color:#ff9800;">' + (s['ق ق'] > 0 ? s['ق ق'] : '-') + '</td>';
                html += '<td style="padding:10px;border:1px solid #ddd;color:#ff9800;">' + (s['ق ق'] > 0 ? formatPercent(pGH) : '-') + '</td>';
                html += '<td style="padding:10px;border:1px solid #ddd;font-weight:bold;color:#f44336;">' + (s['ن ب ت'] > 0 ? s['ن ب ت'] : '-') + '</td>';
                html += '<td style="padding:10px;border:1px solid #ddd;font-weight:bold;color:#f44336;">' + (s['ن ب ت'] > 0 ? formatPercent(pNBT) : '-') + '</td>';
                html += '<td style="padding:10px;border:1px solid #ddd;font-weight:bold;background:#e3f2fd;">' + total + '</td></tr>';
            });
            
            html += '</tbody></table></div>';
            
            let passPercent = totalStudents > 0 ? ((passedCount / totalStudents) * 100) : 0;
            let failPercent = totalStudents > 0 ? ((failedCount / totalStudents) * 100) : 0;
            
            html += '<div style="margin-top:25px;border-top:2px solid #4472C4;padding-top:15px;"><h3 style="color:#4472C4;text-align:center;margin-bottom:15px;">📊 خلاصه آمار قبولی و مردودی</h3>';
            html += '<table style="width:100%;border-collapse:collapse;font-size:14px;text-align:center;margin:0 auto;"><thead><tr style="background:#4472C4;color:white;"><th style="padding:12px;border:1px solid #335a9e;">وضعیت</th><th style="padding:12px;border:1px solid #335a9e;">تعداد</th><th style="padding:12px;border:1px solid #335a9e;">درصد</th></tr></thead><tbody>';
            html += '<tr style="background:#e8f5e9;"><td style="padding:10px;border:1px solid #ddd;font-weight:bold;color:#2e7d32;">✅ قبول</td><td style="padding:10px;border:1px solid #ddd;font-weight:bold;color:#2e7d32;">' + passedCount + '</td><td style="padding:10px;border:1px solid #ddd;font-weight:bold;color:#2e7d32;">' + formatPercent(passPercent) + '</td></tr>';
            html += '<tr style="background:#ffebee;"><td style="padding:10px;border:1px solid #ddd;font-weight:bold;color:#c62828;">❌ مردود</td><td style="padding:10px;border:1px solid #ddd;font-weight:bold;color:#c62828;">' + failedCount + '</td><td style="padding:10px;border:1px solid #ddd;font-weight:bold;color:#c62828;">' + formatPercent(failPercent) + '</td></tr>';
            html += '<tr style="background:#e3f2fd;"><td style="padding:10px;border:1px solid #ddd;font-weight:bold;color:#4472C4;">📊 مجموع</td><td style="padding:10px;border:1px solid #ddd;font-weight:bold;color:#4472C4;">' + totalStudents + '</td><td style="padding:10px;border:1px solid #ddd;font-weight:bold;color:#4472C4;">100</td></tr></tbody></table></div>';
            
            html += '<div style="margin-top:30px;display:flex;gap:15px;justify-content:center;flex-wrap:wrap;" class="no-print-buttons"><button id="btnDownloadFinal" style="background:#2e7d32;color:white;border:none;padding:12px 25px;border-radius:8px;cursor:pointer;font-family:inherit;font-weight:bold;font-size:15px;">📥 دانلود فایل Word</button><button id="btnDownloadImage" style="background:#f59e0b;color:white;border:none;padding:12px 25px;border-radius:8px;cursor:pointer;font-family:inherit;font-weight:bold;font-size:15px;">🖼️ دانلود عکس با کیفیت</button><button id="closeReportBtn2" style="background:#757575;color:white;border:none;padding:12px 25px;border-radius:8px;cursor:pointer;font-family:inherit;font-weight:bold;font-size:15px;">بستن</button></div></div>';
            
            overlay.innerHTML = html;
            document.body.appendChild(overlay);
            
            document.getElementById('closeReportBtn').addEventListener('click', function() {
                overlay.remove();
            });
            document.getElementById('closeReportBtn2').addEventListener('click', function() {
                overlay.remove();
            });
            
            document.getElementById('btnDownloadFinal').addEventListener('click', function() {
                let tableElement = document.getElementById('finalReportTable');
                let wordHtml = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><title>گزارش نمرات</title><style>body{font-family:Tahoma,Arial;font-size:12pt;direction:rtl;}h2{text-align:center;}h3{text-align:center;}table{border-collapse:collapse;width:100%;direction:rtl;margin-top:10px;}th{background:#4472C4;color:white;padding:10px;border:1px solid #999;}td{padding:8px;border:1px solid #999;text-align:center;}.passed{background:#e8f5e9;}.failed{background:#ffebee;}.total-row{background:#e3f2fd;}</style></head><body><h2>📊 گزارش آماری نمرات توصیفی</h2><p style="text-align:center;">' + escapeHtml(grade) + ' — ' + escapeHtml(term) + '</p><p style="text-align:center;">تعداد دانش‌آموزان: ' + totalStudents + ' نفر</p>' + tableElement.outerHTML + '<div style="margin-top:25px;border-top:2px solid #4472C4;padding-top:15px;"><h3 style="text-align:center;color:#4472C4;">📊 خلاصه آمار قبولی و مردودی</h3><table style="width:100%;border-collapse:collapse;font-size:12pt;text-align:center;margin:0 auto;"><thead><tr><th style="background:#4472C4;color:white;padding:10px;border:1px solid #999;">وضعیت</th><th style="background:#4472C4;color:white;padding:10px;border:1px solid #999;">تعداد</th><th style="background:#4472C4;color:white;padding:10px;border:1px solid #999;">درصد</th></tr></thead><tbody><tr class="passed"><td style="padding:10px;border:1px solid #999;font-weight:bold;color:#2e7d32;">✅ قبول</td><td style="padding:10px;border:1px solid #999;font-weight:bold;color:#2e7d32;">' + passedCount + '</td><td style="padding:10px;border:1px solid #999;font-weight:bold;color:#2e7d32;">' + formatPercent(passPercent) + '</td></tr><tr class="failed"><td style="padding:10px;border:1px solid #999;font-weight:bold;color:#c62828;">❌ مردود</td><td style="padding:10px;border:1px solid #999;font-weight:bold;color:#c62828;">' + failedCount + '</td><td style="padding:10px;border:1px solid #999;font-weight:bold;color:#c62828;">' + formatPercent(failPercent) + '</td></tr><tr class="total-row"><td style="padding:10px;border:1px solid #999;font-weight:bold;color:#4472C4;">📊 مجموع</td><td style="padding:10px;border:1px solid #999;font-weight:bold;color:#4472C4;">' + totalStudents + '</td><td style="padding:10px;border:1px solid #999;font-weight:bold;color:#4472C4;">100</td></tr></tbody></table></div></body></html>';
                
                let blob = new Blob(['\ufeff' + wordHtml], { type: 'application/msword' });
                let link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = 'گزارش_نهایی_نمرات_' + grade.replace(/ /g, '_') + '.doc';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(link.href);
            });

            document.getElementById('btnDownloadImage').addEventListener('click', downloadReportAsImage);
        }

        function updatePanelUI(newCount) {
            newCount = newCount || 0;
            let storedData = getStoredData();
            let subjects = Object.keys(storedData.subjects || {});
            let total = subjects.length > 0 ? storedData.subjects[subjects[0]]['مجموع'] : 0;
            document.getElementById('totalProcessed').textContent = total.toLocaleString('fa-IR');
            let msg = document.getElementById('panelMsg');
            if (newCount > 0) {
                msg.textContent = '✅ ' + newCount + ' نفر جدید اضافه شد';
                msg.style.color = '#2e7d32';
                setTimeout(function() { msg.textContent = 'آماده افزودن صفحات بعدی...'; msg.style.color = '#666'; }, 3000);
            } else if (total === 0) {
                msg.textContent = 'هنوز داده‌ای جمع‌آوری نشده است.';
            } else {
                msg.textContent = 'آماده افزودن صفحات بعدی...';
            }
        }

        function showNotification(text) {
            let notif = document.createElement('div');
            notif.style.cssText = 'position:fixed;bottom:20px;left:20px;background:#333;color:white;padding:12px 20px;border-radius:8px;z-index:9999999;font-family:Tahoma;font-size:13px;box-shadow:0 4px 12px rgba(0,0,0,0.3);';
            notif.textContent = text;
            notif.addEventListener('click', function() { notif.remove(); });
            document.body.appendChild(notif);
            setTimeout(function() { if (notif.parentNode) notif.remove(); }, 3000);
        }

        function makeDraggable(elmnt, handle) {
            let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
            handle.style.cursor = "grab";
            handle.onmousedown = dragMouseDown;
            function dragMouseDown(e) {
                e = e || window.event;
                e.preventDefault();
                pos3 = e.clientX;
                pos4 = e.clientY;
                document.onmouseup = closeDragElement;
                document.onmousemove = elementDrag;
                handle.style.cursor = "grabbing";
            }
            function elementDrag(e) {
                e = e || window.event;
                e.preventDefault();
                pos1 = pos3 - e.clientX;
                pos2 = pos4 - e.clientY;
                pos3 = e.clientX;
                pos4 = e.clientY;
                elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
                elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
            }
            function closeDragElement() {
                document.onmouseup = null;
                document.onmousemove = null;
                handle.style.cursor = "grab";
            }
        }

        function createPanel() {
            let panel = document.createElement('div');
            panel.id = 'gradeCollectorPanel';
            panel.style.cssText = 'position:fixed;top:20px;left:20px;background:white;border:2px solid #4472C4;border-radius:10px;padding:15px;width:300px;z-index:999999;box-shadow:0 4px 20px rgba(0,0,0,0.2);font-family:Tahoma,sans-serif;direction:rtl;font-size:13px;color:#333;';
            panel.innerHTML = '<div id="panelHeader" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;border-bottom:1px solid #eee;padding-bottom:10px;user-select:none;"><strong style="color:#4472C4;font-size:15px;">📊 تحلیل نمرات</strong><button id="panelCloseBtn" style="background:none;border:none;cursor:pointer;font-size:18px;color:#999;">✕</button></div><div style="background:#f5f7fa;padding:12px;border-radius:8px;margin-bottom:15px;text-align:center;"><div style="font-size:12px;color:#666;">کل دانش‌آموزان پردازش‌شده:</div><div id="totalProcessed" style="font-size:28px;font-weight:bold;color:#2e7d32;">0</div><div id="panelMsg" style="font-size:11px;color:#666;margin-top:5px;">آماده افزودن صفحات بعدی...</div></div><div style="display:flex;flex-direction:column;gap:10px;"><button id="btnAddPage" style="background:#4472C4;color:white;border:none;padding:10px;border-radius:6px;cursor:pointer;font-family:inherit;font-weight:bold;">➕ افزودن این صفحه به گزارش</button><button id="btnViewReport" style="background:#2e7d32;color:white;border:none;padding:10px;border-radius:6px;cursor:pointer;font-family:inherit;font-weight:bold;">📥 مشاهده و دانلود گزارش نهایی</button><button id="btnClear" style="background:#fff;color:#c62828;border:1px solid #c62828;padding:8px;border-radius:6px;cursor:pointer;font-family:inherit;font-size:12px;margin-top:5px;">🗑️ پاک‌سازی تمام داده‌های جمع‌آوری‌شده</button></div>';
            document.body.appendChild(panel);
            makeDraggable(panel, document.getElementById('panelHeader'));
            
            document.getElementById('panelCloseBtn').addEventListener('click', function() {
                panel.remove();
            });
            
            document.getElementById('btnAddPage').addEventListener('click', analyzeAndAccumulate);
            document.getElementById('btnViewReport').addEventListener('click', showReportAndDownload);
            document.getElementById('btnClear').addEventListener('click', clearAllData);
            
            updatePanelUI();
            showNotification('پنل آماده است. نوار آبی بالا را بگیرید و جابه‌جا کنید.');
        }

        createPanel();
    }

    // ==================== ابزار ۱۳: ثبت نمرات توصیفی ====================
    function gradeRegisterTool() {
        if (document.getElementById('gradePanel')) {
            document.getElementById('gradePanel').remove();
        }

        cleanupAllPanels();

        const DESCRIPTIONS = {
            'اول': {
                'فارسی': {1:'در گوش دادن و سخن گفتن بسیار تواناست و جملات خلاقانه می‌سازد. دیکته‌ای بدون غلط و خوانا دارد.',2:'تصاویر را خوب توصیف می‌کند و دیکته او اکثراً صحیح است. گاهی در نشانه‌های هم‌آوا اشتباه می‌کند.',3:'جملات ساده می‌سازد اما در رعایت خط زمینه نیاز به توجه دارد. دیکته او نیاز به تمرین بیشتر دارد.',4:'در جمله‌سازی دچار جمله‌های ناقص است و دیکته او اشتباهات املایی مکرر دارد.'},
                'قرآن': {1:'روخوانی او روان و دقیق است و پیام قرآنی را به خوبی درک می‌کند.',2:'اکثر کلمات قرآنی را درست می‌خواند و داستان‌های قرآنی را به خاطر دارد.',3:'روخوانی او قابل قبول است اما برای روان‌خوانی نیاز به تمرین بیشتر دارد.',4:'در روخوانی حروف دچار مکث و اشتباه است. بهتر است روزانه با کمک اولیا تمرین کند.'},
                'ریاضی': {1:'اعداد تا سه رقم را کامل درک کرده و جمع و تفریق را با سرعت انجام می‌دهد. اشکال هندسی را به خوبی تشخیص می‌دهد.',2:'در شمارش و مقایسه اعداد مهارت دارد. عملیات جمع و تفریق را انجام می‌دهد اما گاهی نیاز به راهنمایی دارد.',3:'مفاهیم اصلی اعداد را درک کرده اما در محاسبات با انتقال گاهی اشتباه می‌کند.',4:'در تشخیص ارزش مکانی اعداد دچار مشکل است. مفاهیم جمع و تفریق پایه را خوب تثبیت نکرده است.'},
                'علوم تجربی': {1:'در زنگ علوم به خوبی مشاهده می‌کند و دنیای جانوران و گیاهان را می‌شناسد. اثر آهنربا را به درستی توضیح می‌دهد.',2:'می‌تواند جانوران و گیاهان را نام ببرد. مفهوم گرما و سرما را درک کرده اما در توضیح آن نیاز به کمک دارد.',3:'با راهنمایی معلم می‌تواند یک آزمایش ساده را انجام دهد. در کاربرد روزمرهٔ مواد دقت کافی ندارد.',4:'در تشخیص تفاوت جانوران و گیاهان دچار اشتباه می‌شود. بهتر است با فیلم‌های آموزشی مفاهیم را مرور کند.'},
                'هنر': {1:'ایده‌های هنری خود را خلاقانه بیان می‌کند و با طبیعت ارتباط عاطفی خوبی دارد.',2:'در تولید یک اثر هنری مهارت قابل قبولی دارد. می‌تواند زیبایی یک اثر را تشخیص دهد.',3:'با الگو گرفتن از دیگران می‌تواند اثری هنری خلق کند. ارتباط او با طبیعت در حد انتظار است.',4:'در بیان ایده از طریق هنر مشکل دارد. بهتر است در خانه با خمیر و مقوا بیشتر کار کند.'},
                'تربیت بدنی': {1:'در حرکات پایه مهارت عالی دارد و هماهنگی چشم و دست او بسیار خوب است.',2:'اکثر حرکات پایه را به درستی اجرا می‌کند. آمادگی جسمانی او در حد مطلوب است.',3:'حرکات پایه را انجام می‌دهد اما سرعت و دقت او پایین‌تر از حد انتظار است.',4:'در بعضی از حرکات پایه موفق عمل نمی‌کند. بهتر است روزانه بازی‌های حرکتی ساده انجام دهد.'},
                'شایستگی های عمومی': {1:'بهداشت فردی را کامل رعایت می‌کند و در کار گروهی مسئولیت‌پذیر است. به مطالعه کتاب‌های غیردرسی علاقه زیادی دارد.',2:'اکثر اوقات بهداشت را رعایت می‌کند. در فعالیت گروهی مشارکت دارد اما گاهی نیاز به یادآوری دارد.',3:'بهداشت فردی را با تذکر رعایت می‌کند. در کار گروهی عمدتاً دنباله‌رو است.',4:'در رعایت بهداشت دچار سهل‌انگاری است. بهتر است اولیا او را به فعالیت‌های جمعی تشویق کنند.'}
            },
            'دوم': {
                'فارسی': {1:'متون را روان و بدون اشتباه می‌خواند. املای او بسیار خوب و جمله‌هایش خلاقانه است.',2:'اکثر کلمات را درست می‌خواند اما گاهی در خواندن کلمات چندبخشی مکث می‌کند. املای او قابل قبول است.',3:'خواندن او روان نیست و در دیکته چند غلط املایی دارد. نیاز به تمرین بیشتر در جمله‌سازی دارد.',4:'در خواندن حروف و کلمات دچار اشتباه و مکث مکرر می‌شود. بهتر است هر شب روان‌خوانی تمرین کند.'},
                'قرآن': {1:'قرآن را با روخوانی صحیح و رعایت آداب می‌خواند. پیام قرآنی را خوب درک کرده و داستان‌ها را بازگو می‌کند.',2:'روخوانی او نسبتاً روان است و بیشتر آداب را رعایت می‌کند. پیام قرآنی را با کمک معلم توضیح می‌دهد.',3:'روخوانی او با مکث و گاهی اشتباه انجام می‌شود. برای درک پیام قرآنی نیاز به توضیح بیشتر دارد.',4:'در روخوانی حروف و کلمات قرآنی دچار اشتباه زیاد است. بهتر است روزانه با کمک اولیا روخوانی کند.'},
                'ریاضی': {1:'جمع و تفریق سه رقمی را به درستی انجام می‌دهد و کسر را درک کرده است. در حل مسئله از راهبردهای متنوع استفاده می‌کند.',2:'جمع و تفریق با انتقال را تقریباً درست انجام می‌دهد. در حل مسئله اغلب از راهبرد رسم شکل استفاده می‌کند.',3:'در جمع و تفریق سه رقمی گاهی در انتقال اشتباه می‌کند. کسر را فقط با شکل درک می‌کند و نیاز به تمرین دارد.',4:'در نوشتن اعداد چهار رقمی دچار جابه‌جایی ارزش مکانی است. مفاهیم جمع و تفریق پایه را خوب تثبیت نکرده است.'},
                'علوم تجربی': {1:'مراحل رشد دانه و جانوران را به خوبی می‌داند. مفهوم گردش زمین و چرخه روز و شب را کامل درک کرده است.',2:'می‌تواند مراحل رشد یک گیاه را به ترتیب بگوید. گردش زمین را تقریباً فهمیده اما در توضیح آن نیاز به کمک دارد.',3:'بعضی از جانوران و گیاهان را نام می‌برد اما چرخه زندگی آنها را نمی‌داند. مفهوم شب و روز را درک نکرده است.',4:'در مشاهده و گزارش‌دهی دقت کافی ندارد. بهتر است با فیلم‌های آموزشی مفاهیم را مرور کند.'},
                'هنر': {1:'ایده‌های خلاقانه خود را در نقاشی و کاردستی به خوبی نشان می‌دهد. از ابزار هنری به درستی استفاده می‌کند.',2:'تولید اثر هنری او قابل قبول است اما خلاقیت او گاهی محدود می‌شود. ابزار را نسبتاً درست به کار می‌برد.',3:'با الگو گرفتن از دیگران اثری هنری می‌سازد. در استفاده از قیچی و چسب دقت کافی ندارد.',4:'در بیان ایده از طریق هنر ضعیف است و کارش ناتمام می‌ماند. بهتر است در خانه با خمیر و مقوا کار کند.'},
                'تربیت بدنی': {1:'حرکات پایه را با هماهنگی عالی انجام می‌دهد. در بازی‌های گروهی قوانین را به خوبی رعایت می‌کند.',2:'اکثر حرکات پایه را اجرا می‌کند اما در حرکات ظریف گاهی مشکل دارد. هماهنگی چشم و دست او قابل قبول است.',3:'حرکات پایه را انجام می‌دهد اما سرعت و چابکی او پایین است. در پرتاب و گرفتن نیاز به تمرین دارد.',4:'در بعضی از حرکات پایه موفق نیست. بهتر است روزانه بازی‌های حرکتی ساده انجام دهد.'},
                'هدیه های آسمان': {1:'خدا را خالق همه چیز می‌داند و نعمت‌های او را برمی‌شمارد. آداب اسلامی را در عمل نشان می‌دهد و نماز می‌خواند.',2:'خدا را آفریدگار می‌داند و بعضی از آداب اخلاقی را رعایت می‌کند. وضو را بلد است اما گاهی ترتیب آن را اشتباه می‌کند.',3:'با راهنمایی معلم می‌تواند یک نعمت خدا را نام ببرد. بعضی از آداب اسلامی را به خاطر می‌آورد اما همیشه عمل نمی‌کند.',4:'شناخت او از خدا و پیامبر محدود و سطحی است. بهتر است اولیا داستان‌های پیامبران را برای او بخوانند.'},
                'شایستگی های عمومی': {1:'بهداشت فردی را کامل رعایت می‌کند و در کار گروهی مسئولیت‌پذیر است. به مطالعه کتاب‌های غیردرسی علاقه زیادی دارد.',2:'اکثر اوقات بهداشت را رعایت می‌کند. در فعالیت گروهی مشارکت دارد اما گاهی نیاز به یادآوری دارد.',3:'بهداشت فردی را با تذکر رعایت می‌کند. در کار گروهی عمدتاً دنباله‌رو است.',4:'در رعایت بهداشت دچار سهل‌انگاری است. بهتر است اولیا او را به فعالیت‌های جمعی تشویق کنند.'}
            },
            'سوم': {
                'فارسی': {1:'متون را روان و با درک کامل می‌خواند و انشاهایی خلاقانه و منسجم می‌نویسد. املای او بسیار دقیق و خواناست.',2:'در خواندن و درک مطلب عملکرد خوبی دارد. انشا او قابل قبول است اما گاهی در رعایت نشانه‌های نگارشی دقت نمی‌کند.',3:'خواندن او نسبتاً روان است اما در درک مطلب و انشا نیاز به تمرین بیشتر دارد. املای او با چند غلط همراه است.',4:'در روان‌خوانی و درک مطلب دچار مشکل است و انشاهای کوتاه و ناقص می‌نویسد. نیاز به تمرین روزانه دارد.'},
                'قرآن': {1:'قرآن را با روخوانی صحیح و رعایت کامل آداب می‌خواند. پیام قرآنی را درک کرده و داستان‌ها را به خوبی بازگو می‌کند.',2:'روخوانی او روان است و بیشتر آداب را رعایت می‌کند. پیام قرآنی را با کمی کمک توضیح می‌دهد.',3:'روخوانی او قابل قبول است اما برای قرائت روان‌تر نیاز به تمرین دارد. پیام قرآنی را با راهنمایی متوجه می‌شود.',4:'در روخوانی حروف و کلمات دچار اشتباه و مکث است. بهتر است روزانه با کمک اولیا تمرین کند.'},
                'ریاضی': {1:'عملیات جمع، تفریق، ضرب و تقسیم را به درستی انجام می‌دهد و کسرها را کامل درک کرده است. در حل مسئله از راهبردهای متنوع استفاده می‌کند.',2:'ضرب و تقسیم را تقریباً درست انجام می‌دهد و کسرها را با کمک شکل درک می‌کند. در محیط و مساحت نیاز به تمرین دارد.',3:'در عملیات ضرب و تقسیم گاهی اشتباه می‌کند. کسرها را فقط با شکل درک می‌کند و در حل مسئله از حدس استفاده می‌کند.',4:'جداول ضرب را کامل حفظ نیست و در تقسیم دچار مشکل است. مفاهیم کسر و احتمال برای او مبهم است و نیاز به تمرین جدی دارد.'},
                'علوم تجربی': {1:'در زنگ علوم به خوبی مشاهده و فرضیه‌سازی می‌کند. مفاهیم نور، نیرو و چرخه آب را کامل درک کرده است.',2:'می‌تواند آزمایش‌های ساده را انجام دهد. مفهوم نیرو و نور را درک کرده اما در توضیح چرخه آب نیاز به کمک دارد.',3:'با راهنمایی معلم آزمایش انجام می‌دهد. بعضی از مواد و تغییرات آنها را می‌شناسد اما در کاربرد آنها دقت کافی ندارد.',4:'در مشاهده و گزارش‌دهی دقت کافی ندارد. مفاهیم نیرو، نور و چرخه آب برای او مبهم است. بهتر است با فیلم آموزشی مرور کند.'},
                'هنر': {1:'ایده‌های خلاقانه خود را در آثار هنری به خوبی نشان می‌دهد و از ابزار به درستی استفاده می‌کند.',2:'تولید اثر هنری او قابل قبول است و ابزار را نسبتاً درست به کار می‌برد. زیبایی یک اثر را تشخیص می‌دهد.',3:'با الگو گرفتن از دیگران اثری هنری می‌سازد. در استفاده از ابزار دقت کافی ندارد.',4:'در بیان ایده از طریق هنر ضعیف است و کارش ناتمام می‌ماند. بهتر است در خانه با ابزارهای مختلف کار کند.'},
                'تربیت بدنی': {1:'حرکات پایه و مهارت‌های ورزشی را به خوبی اجرا می‌کند. در بازی‌های گروهی مشارکت عالی و رعایت قوانین دارد.',2:'اکثر حرکات ورزشی را درست انجام می‌دهد اما در مهارت‌های توپی گاهی مشکل دارد. در بازی‌ها مشارکت می‌کند.',3:'حرکات پایه را انجام می‌دهد اما سرعت و چابکی او پایین است. نیاز به تمرین بیشتر در مهارت‌های ورزشی دارد.',4:'در بعضی از حرکات ورزشی موفق نیست و در بازی‌ها کمتر مشارکت می‌کند. بهتر است روزانه فعالیت ورزشی داشته باشد.'},
                'هدیه های آسمان': {1:'خدا را خالق می‌داند و با پیامبران و امامان آشناست. آداب اسلامی را در عمل نشان می‌دهد و به جهان آخرت ایمان دارد.',2:'شناخت خوبی از خدا و پیامبر دارد. بیشتر آداب اخلاقی را رعایت می‌کند و احکام ساده را می‌داند.',3:'خدا و پیامبر را می‌شناسد اما بعضی از آداب را گاهی فراموش می‌کند. نیاز به توضیح بیشتر در مورد احکام دارد.',4:'شناخت او از خدا، پیامبر و امامان محدود است. بهتر است اولیا داستان‌های دینی را برای او بخوانند.'},
                'مطالعات اجتماعی': {1:'مفاهیم اجتماعی، فرهنگی و اقتصادی را به خوبی درک کرده و نقش خود را در جامعه می‌شناسد.',2:'فرهنگ و هویت خود را می‌شناسد و با زمان و تغییرات آن آشناست. در مورد منابع اقتصادی اطلاعات خوبی دارد.',3:'بعضی از مفاهیم اجتماعی را درک کرده اما در توضیح تغییرات زمان نیاز به کمک دارد.',4:'درک او از مفاهیم اجتماعی و اقتصادی محدود است. بهتر است با مثال‌های عینی بیشتر آشنا شود.'},
                'شایستگی های عمومی': {1:'بهداشت و ایمنی را کامل رعایت می‌کند و در کار گروهی مسئولیت‌پذیر است. به مطالعه کتاب‌های غیردرسی علاقه زیادی دارد.',2:'اکثر اوقات بهداشت را رعایت می‌کند. در فعالیت گروهی مشارکت دارد اما گاهی نیاز به یادآوری دارد.',3:'بهداشت را با تذکر رعایت می‌کند. در کار گروهی عمدتاً دنباله‌رو است و کمتر ایده می‌دهد.',4:'در رعایت بهداشت و ایمنی سهل‌انگار است. بهتر است اولیا او را به مطالعه و فعالیت‌های جمعی تشویق کنند.'}
            },
            'چهارم': {
                'فارسی': {1:'متون را با درک کامل و روان می‌خواند و انشاهایی منسجم و خلاقانه می‌نویسد. املای او بسیار دقیق و بدون غلط است.',2:'در خواندن و درک مطلب عملکرد خوبی دارد. انشا او قابل قبول است اما گاهی در رعایت نشانه‌های نگارشی دقت نمی‌کند.',3:'خواندن او نسبتاً روان است اما درک مطلب و انشا نیاز به تمرین بیشتر دارد. املای او با چند غلط همراه است.',4:'در روان‌خوانی و درک مطلب دچار مشکل است و انشاهای کوتاه و ناقص می‌نویسد. نیاز به تمرین روزانه دارد.'},
                'قرآن': {1:'قرآن را با روخوانی صحیح می‌خواند و معنی بسیاری از کلمات و عبارات قرآنی را می‌داند. پیام قرآنی را به خوبی درک و بازگو می‌کند.',2:'روخوانی او روان است و معنی بعضی کلمات قرآنی را می‌داند. پیام قرآنی را با کمی کمک توضیح می‌دهد.',3:'روخوانی او قابل قبول است اما در ترجمه کلمات نیاز به تمرین دارد. پیام قرآنی را با راهنمایی متوجه می‌شود.',4:'در روخوانی و ترجمه کلمات قرآنی دچار اشتباه است. بهتر است روزانه با کمک اولیا تمرین کند.'},
                'ریاضی': {1:'عملیات ضرب و تقسیم را به درستی انجام می‌دهد و کسرها و اعداد اعشاری را کامل درک کرده است. در حل مسئله از راهبردهای متنوع استفاده می‌کند.',2:'ضرب و تقسیم را تقریباً درست انجام می‌دهد و کسرها را درک کرده است. در تشخیص زاویه و چهارضلعی‌ها نیاز به تمرین دارد.',3:'در عملیات ریاضی گاهی اشتباه می‌کند. کسرها را با کمک شکل درک می‌کند و در محاسبه محیط و مساحت نیاز به تمرین دارد.',4:'جداول ضرب را کامل حفظ نیست و در تقسیم و اعداد اعشاری دچار مشکل است. مفاهیم کسر و زاویه برای او مبهم است.'},
                'علوم تجربی': {1:'مهارت‌های علمی را به خوبی به کار می‌برد و بدن انسان، گیاهان و جانوران را به طور کامل می‌شناسد. انرژی و آهنربا را درک کرده و سنگ‌ها را تشخیص می‌دهد.',2:'آزمایش‌های ساده را انجام می‌دهد. بدن انسان و بی‌مهره‌ها را می‌شناسد اما در توضیح انرژی الکتریکی و گرما نیاز به کمک دارد.',3:'با راهنمایی معلم آزمایش انجام می‌دهد. بعضی از مخلوط‌ها و سنگ‌ها را می‌شناسد اما در کاربرد آنها دقت کافی ندارد.',4:'در مشاهده و گزارش‌دهی دقت کافی ندارد. مفاهیم انرژی، گرما و آهنربا برای او مبهم است. بهتر است با فیلم آموزشی مرور کند.'},
                'هنر': {1:'ایده‌های خلاقانه خود را در آثار هنری به خوبی نشان می‌دهد و با میراث فرهنگی ایران آشنایی دارد.',2:'تولید اثر هنری او قابل قبول است و می‌تواند زیبایی یک اثر را تشخیص دهد. آشنایی خوبی با میراث فرهنگی دارد.',3:'با الگو گرفتن از دیگران اثری هنری می‌سازد. در نقد هنری نیاز به راهنمایی دارد.',4:'در بیان ایده از طریق هنر ضعیف است. بهتر است در خانه با ابزارهای مختلف کار کند و با میراث فرهنگی آشنا شود.'},
                'تربیت بدنی': {1:'مهارت‌های ورزشی را به خوبی اجرا می‌کند و بهداشت و ایمنی در ورزش را رعایت می‌نماید. در بازی‌های گروهی مشارکت عالی دارد.',2:'اکثر مهارت‌های ورزشی را درست انجام می‌دهد. بهداشت و تغذیه ورزشی را تا حدی رعایت می‌کند.',3:'مهارت‌های پایه ورزشی را انجام می‌دهد اما در اجرای دقیق آنها نیاز به تمرین دارد. ایمنی را گاهی رعایت می‌کند.',4:'در بعضی از مهارت‌های ورزشی موفق نیست. بهتر است روزانه فعالیت ورزشی داشته باشد و ایمنی را جدی بگیرد.'},
                'هدیه های آسمان': {1:'شناخت عمیقی از خدا، پیامبران و امامان دارد و به جهان آخرت ایمان دارد. آداب و احکام اسلامی را در عمل نشان می‌دهد.',2:'خدا و پیامبر را به خوبی می‌شناسد و با امامان آشناست. بیشتر آداب اخلاقی و احکام ساده را رعایت می‌کند.',3:'شناخت او از خدا و پیامبر قابل قبول است اما بعضی از آداب و احکام را گاهی فراموش می‌کند.',4:'شناخت او از خدا، پیامبران و جهان آخرت محدود است. بهتر است اولیا داستان‌های دینی را برای او بخوانند.'},
                'مطالعات اجتماعی': {1:'مفاهیم اجتماعی، فرهنگی و اقتصادی را به خوبی درک کرده و نقش خود را در جامعه می‌شناسد.',2:'فرهنگ و هویت خود را می‌شناسد و با تغییرات زمان آشناست. در مورد منابع اقتصادی اطلاعات خوبی دارد.',3:'بعضی از مفاهیم اجتماعی را درک کرده اما در توضیح تغییرات زمان و مکان نیاز به کمک دارد.',4:'درک او از مفاهیم اجتماعی و اقتصادی محدود است. بهتر است با مثال‌های عینی بیشتر آشنا شود.'},
                'شایستگی های عمومی': {1:'بهداشت و ایمنی را کامل رعایت می‌کند و در کار گروهی مسئولیت‌پذیر است. به مطالعه کتاب‌های غیردرسی علاقه زیادی دارد.',2:'اکثر اوقات بهداشت را رعایت می‌کند. در فعالیت گروهی مشارکت دارد اما گاهی نیاز به یادآوری دارد.',3:'بهداشت را با تذکر رعایت می‌کند. در کار گروهی عمدتاً دنباله‌رو است و کمتر ایده می‌دهد.',4:'در رعایت بهداشت و ایمنی سهل‌انگار است. بهتر است اولیا او را به مطالعه و فعالیت‌های جمعی تشویق کنند.'}
            },
            'پنجم': {
                'فارسی': {1:'متون را با درک کامل و روان می‌خواند و انشاهایی منسجم، خلاقانه و با رعایت نشانه‌های نگارشی می‌نویسد. املای او بسیار دقیق و بدون غلط است.',2:'در خواندن و درک مطلب عملکرد خوبی دارد. انشا او قابل قبول است اما گاهی در رعایت نشانه‌های نگارشی دقت نمی‌کند.',3:'خواندن او نسبتاً روان است اما درک مطلب و انشا نیاز به تمرین بیشتر دارد. املای او با چند غلط همراه است.',4:'در روان‌خوانی و درک مطلب دچار مشکل است و انشاهای کوتاه و ناقص می‌نویسد. نیاز به تمرین روزانه دارد.'},
                'قرآن': {1:'قرآن را با روخوانی صحیح و روان می‌خواند و معنی بیشتر کلمات و عبارات قرآنی را می‌داند. پیام قرآنی را به خوبی درک و بازگو می‌کند.',2:'روخوانی او روان است و معنی بسیاری از کلمات قرآنی را می‌داند. پیام قرآنی را با کمی کمک توضیح می‌دهد.',3:'روخوانی او قابل قبول است اما در ترجمه کلمات نیاز به تمرین دارد. پیام قرآنی را با راهنمایی متوجه می‌شود.',4:'در روخوانی و ترجمه کلمات قرآنی دچار اشتباه است. بهتر است روزانه با کمک اولیا تمرین کند.'},
                'ریاضی': {1:'عملیات با کسرها، اعداد مخلوط و اعشاری را به درستی انجام می‌دهد و نسبت و تناسب را درک کرده است. در حل مسئله از راهبردهای متنوع استفاده می‌کند.',2:'ضرب و تقسیم کسرها را تقریباً درست انجام می‌دهد و اعداد اعشاری را درک کرده است. در محاسبه مساحت لوزی و ذوزنقه نیاز به تمرین دارد.',3:'در عملیات با کسر و اعداد اعشاری گاهی اشتباه می‌کند. نسبت و درصد را با کمک درک می‌کند و در محاسبه حجم نیاز به تمرین دارد.',4:'در انجام عملیات با کسرها و اعداد اعشاری دچار مشکل است. مفاهیم نسبت، تناسب و درصد برای او مبهم است و نیاز به تمرین جدی دارد.'},
                'علوم تجربی': {1:'مهارت‌های علمی را به خوبی به کار می‌برد و تغییرات ماده، حرکت بدن و چرخه زندگی گیاهان را کامل درک کرده است. مفاهیم نیرو، کار و انرژی را به خوبی می‌داند.',2:'آزمایش‌های ساده را انجام می‌دهد. تغییرات ماده و حرکت بدن را درک کرده اما در توضیح مفاهیم نیرو و انرژی نیاز به کمک دارد.',3:'با راهنمایی معلم آزمایش انجام می‌دهد. بعضی از مفاهیم علمی را درک کرده اما در کاربرد آنها دقت کافی ندارد.',4:'در مشاهده و گزارش‌دهی دقت کافی ندارد. مفاهیم تغییرات ماده، نیرو و انرژی برای او مبهم است. بهتر است با فیلم آموزشی مرور کند.'},
                'هنر': {1:'ایده‌های خلاقانه خود را در آثار هنری به خوبی نشان می‌دهد و با تاریخ و میراث فرهنگی ایران آشنایی عمیقی دارد.',2:'تولید اثر هنری او قابل قبول است و می‌تواند زیبایی یک اثر را با دلیل تشخیص دهد. آشنایی خوبی با میراث فرهنگی دارد.',3:'با الگو گرفتن از دیگران اثری هنری می‌سازد. در نقد هنری نیاز به راهنمایی دارد.',4:'در بیان ایده از طریق هنر ضعیف است. بهتر است در خانه با ابزارهای مختلف کار کند و با میراث فرهنگی آشنا شود.'},
                'تربیت بدنی': {1:'مهارت‌های ورزشی را به خوبی اجرا می‌کند و بهداشت، تغذیه و ایمنی در ورزش را کامل رعایت می‌نماید. در بازی‌های گروهی مشارکت عالی دارد.',2:'اکثر مهارت‌های ورزشی را درست انجام می‌دهد. بهداشت و تغذیه ورزشی را تا حدی رعایت می‌کند.',3:'مهارت‌های پایه ورزشی را انجام می‌دهد اما در اجرای دقیق آنها نیاز به تمرین دارد. ایمنی را گاهی رعایت می‌کند.',4:'در بعضی از مهارت‌های ورزشی موفق نیست. بهتر است روزانه فعالیت ورزشی داشته باشد و ایمنی را جدی بگیرد.'},
                'هدیه های آسمان': {1:'شناخت عمیقی از خدا، پیامبران و امامان دارد و به جهان آخرت ایمان دارد. آداب و احکام اسلامی را در عمل نشان می‌دهد.',2:'خدا و پیامبر را به خوبی می‌شناسد و با امامان آشناست. بیشتر آداب اخلاقی و احکام ساده را رعایت می‌کند.',3:'شناخت او از خدا و پیامبر قابل قبول است اما بعضی از آداب و احکام را گاهی فراموش می‌کند.',4:'شناخت او از خدا، پیامبران و جهان آخرت محدود است. بهتر است اولیا داستان‌های دینی را برای او بخوانند.'},
                'مطالعات اجتماعی': {1:'مفاهیم اجتماعی، فرهنگی و اقتصادی را به خوبی درک کرده و نقش خود را در جامعه می‌شناسد.',2:'فرهنگ و هویت خود را می‌شناسد و با تغییرات زمان آشناست. در مورد منابع اقتصادی اطلاعات خوبی دارد.',3:'بعضی از مفاهیم اجتماعی را درک کرده اما در توضیح تغییرات زمان و مکان نیاز به کمک دارد.',4:'درک او از مفاهیم اجتماعی و اقتصادی محدود است. بهتر است با مثال‌های عینی بیشتر آشنا شود.'},
                'شایستگی های عمومی': {1:'بهداشت و ایمنی را کامل رعایت می‌کند و در کار گروهی مسئولیت‌پذیر است. به مطالعه کتاب‌های غیردرسی علاقه زیادی دارد.',2:'اکثر اوقات بهداشت را رعایت می‌کند. در فعالیت گروهی مشارکت دارد اما گاهی نیاز به یادآوری دارد.',3:'بهداشت را با تذکر رعایت می‌کند. در کار گروهی عمدتاً دنباله‌رو است و کمتر ایده می‌دهد.',4:'در رعایت بهداشت و ایمنی سهل‌انگار است. بهتر است اولیا او را به مطالعه و فعالیت‌های جمعی تشویق کنند.'}
            },
            'ششم': {
                'قرآن': {1:'قرآن را با روخوانی صحیح و روان می‌خواند و معنی بیشتر کلمات و عبارات قرآنی را به درستی ترجمه می‌کند. پیام قرآنی را کامل درک و داستان‌ها را بازگو می‌کند.',2:'روخوانی او روان است و معنی بسیاری از کلمات قرآنی را می‌داند. پیام قرآنی را با کمی کمک توضیح می‌دهد.',3:'روخوانی او قابل قبول است اما در ترجمه کلمات نیاز به تمرین دارد. پیام قرآنی را با راهنمایی متوجه می‌شود.',4:'در روخوانی و ترجمه کلمات قرآنی دچار اشتباه است. بهتر است روزانه با کمک اولیا تمرین کند.'},
                'هدیه های آسمان': {1:'شناخت عمیقی از خدا، پیامبران و امامان دارد و به جهان آخرت ایمان راسخ دارد. آداب، احکام و مراسم اسلامی را در عمل نشان می‌دهد.',2:'خدا و پیامبر را به خوبی می‌شناسد و با امامان و شخصیت‌های دینی آشناست. بیشتر آداب اخلاقی و احکام را رعایت می‌کند.',3:'شناخت او از خدا و پیامبر قابل قبول است اما بعضی از آداب و احکام را گاهی فراموش می‌کند.',4:'شناخت او از خدا، پیامبران، امامان و جهان آخرت محدود است. بهتر است اولیا داستان‌های دینی را برای او بخوانند.'},
                'فارسی': {1:'متون را با درک کامل و روان می‌خواند و انشاهایی منسجم، خلاقانه و با رعایت کامل نشانه‌های نگارشی می‌نویسد. املای او بسیار دقیق و بدون غلط است.',2:'در خواندن و درک مطلب عملکرد خوبی دارد. انشا او قابل قبول است اما گاهی در رعایت نشانه‌های نگارشی دقت نمی‌کند.',3:'خواندن او نسبتاً روان است اما درک مطلب و انشا نیاز به تمرین بیشتر دارد. املای او با چند غلط همراه است.',4:'در روان‌خوانی و درک مطلب دچار مشکل است و انشاهای کوتاه و ناقص می‌نویسد. نیاز به تمرین روزانه دارد.'},
                'ریاضی': {1:'عملیات با کسرها، اعداد مخلوط، اعشاری و صحیح را به درستی انجام می‌دهد و نسبت، تناسب و درصد را کامل درک کرده است. در حل مسئله از راهبردهای متنوع استفاده می‌کند.',2:'ضرب و تقسیم کسرها و اعداد اعشاری را تقریباً درست انجام می‌دهد. در محاسبه حجم، مساحت و تقارن مرکزی نیاز به تمرین دارد.',3:'در عملیات با کسر و اعداد اعشاری گاهی اشتباه می‌کند. نسبت و درصد را با کمک درک می‌کند و در ترتیب عملیات نیاز به تمرین دارد.',4:'در انجام عملیات با کسرها، اعداد اعشاری و صحیح دچار مشکل است. مفاهیم نسبت، تناسب، درصد و تقارن برای او مبهم است و نیاز به تمرین جدی دارد.'},
                'علوم تجربی': {1:'مهارت‌های علمی را به خوبی به کار می‌برد و مفاهیم انرژی، نیرو، تغییرات ماده و زمین‌شناسی را کامل درک کرده است. در طراحی و اجرای پروژه‌های علمی خلاقیت بالایی دارد.',2:'آزمایش‌های ساده را انجام می‌دهد. مفاهیم انرژی و نیرو را درک کرده اما در توضیح چرخه‌های زمین و تغییرات ماده نیاز به کمک دارد.',3:'با راهنمایی معلم آزمایش انجام می‌دهد. بعضی از مفاهیم علمی را درک کرده اما در کاربرد آنها دقت کافی ندارد.',4:'در مشاهده و گزارش‌دهی دقت کافی ندارد. مفاهیم انرژی، نیرو، زمین‌شناسی و تغییرات ماده برای او مبهم است. بهتر است با فیلم آموزشی مرور کند.'},
                'مطالعات اجتماعی': {1:'مفاهیم اجتماعی، فرهنگی، اقتصادی و جغرافیایی را به خوبی درک کرده و نقش خود را در جامعه می‌شناسد.',2:'فرهنگ و هویت خود را می‌شناسد و با تغییرات زمان و مکان آشناست. در مورد منابع اقتصادی اطلاعات خوبی دارد.',3:'بعضی از مفاهیم اجتماعی را درک کرده اما در توضیح تغییرات زمان، مکان و اقتصاد نیاز به کمک دارد.',4:'درک او از مفاهیم اجتماعی، اقتصادی و جغرافیایی محدود است. بهتر است با مثال‌های عینی بیشتر آشنا شود.'},
                'هنر': {1:'ایده‌های خلاقانه خود را در آثار هنری به خوبی نشان می‌دهد و با تاریخ و میراث فرهنگی ایران آشنایی عمیقی دارد.',2:'تولید اثر هنری او قابل قبول است و می‌تواند زیبایی یک اثر را با دلیل تشخیص دهد. آشنایی خوبی با میراث فرهنگی دارد.',3:'با الگو گرفتن از دیگران اثری هنری می‌سازد. در نقد هنری نیاز به راهنمایی دارد.',4:'در بیان ایده از طریق هنر ضعیف است. بهتر است در خانه با ابزارهای مختلف کار کند و با میراث فرهنگی آشنا شود.'},
                'تربیت بدنی': {1:'مهارت‌های ورزشی پایه و دو و میدانی را به خوبی اجرا می‌کند و بهداشت، تغذیه و ایمنی در ورزش را کامل رعایت می‌نماید. در بازی‌های گروهی و بومی‑محلی مشارکت عالی دارد.',2:'اکثر مهارت‌های ورزشی را درست انجام می‌دهد. بهداشت و تغذیه ورزشی را تا حدی رعایت می‌کند.',3:'مهارت‌های پایه ورزشی را انجام می‌دهد اما در اجرای دقیق آنها نیاز به تمرین دارد. ایمنی را گاهی رعایت می‌کند.',4:'در بعضی از مهارت‌های ورزشی و دو و میدانی موفق نیست. بهتر است روزانه فعالیت ورزشی داشته باشد و ایمنی را جدی بگیرد.'},
                'تفکر و پژوهش': {1:'در انتخاب و تصمیم‌گیری مهارت بالایی دارد و پروژه‌های پژوهشی را به صورت نظام‌مند و خلاقانه اجرا می‌کند.',2:'در انجام پروژه‌های پژوهشی مشارکت دارد و تصمیم‌گیری او قابل قبول است. در نظام‌مندی نیاز به راهنمایی دارد.',3:'با راهنمایی معلم پروژه پژوهشی را انجام می‌دهد. در انتخاب و تصمیم‌گیری گاهی مردد است.',4:'در انجام پروژه پژوهشی و تصمیم‌گیری دچار مشکل است. بهتر است با مثال‌های عملی بیشتر تمرین کند.'},
                'کار و فناوری': {1:'کار با رایانه را به خوبی می‌داند و در طراحی، نقاشی، تایپ و نوشتن با رایانه مهارت بالایی دارد. ارگونومی، ایمنی و بهداشت را کامل رعایت می‌کند.',2:'کار با رایانه را تا حدی می‌داند و در تایپ و نوشتن با آن عملکرد قابل قبولی دارد. ایمنی را گاهی رعایت می‌کند.',3:'کار با رایانه را با کمک انجام می‌دهد. در طراحی و تایپ نیاز به تمرین بیشتر دارد.',4:'در کار با رایانه و تایپ دچار مشکل است. بهتر است در خانه با رایانه بیشتر تمرین کند و ارگونومی را رعایت نماید.'},
                'شایستگی های عمومی': {1:'بهداشت و ایمنی را کامل رعایت می‌کند و در کار گروهی مسئولیت‌پذیر است. به مطالعه کتاب‌های غیردرسی علاقه زیادی دارد و همواره در تلاش برای یادگیری بیشتر است.',2:'اکثر اوقات بهداشت را رعایت می‌کند. در فعالیت گروهی مشارکت دارد اما گاهی نیاز به یادآوری دارد.',3:'بهداشت را با تذکر رعایت می‌کند. در کار گروهی عمدتاً دنباله‌رو است و کمتر ایده می‌دهد.',4:'در رعایت بهداشت و ایمنی سهل‌انگار است. بهتر است اولیا او را به مطالعه و فعالیت‌های جمعی تشویق کنند.'}
            }
        };

        function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
        
        function normalizeText(text) {
            return text.replace(/ي/g, 'ی').replace(/ك/g, 'ک').replace(/ة/g, 'ه').replace(/\s+/g, ' ').trim();
        }
        
        function getText(el) {
            return (el.textContent || '').trim();
        }
        
        function detectLessonName() {
            const foundTexts = [];
            
            document.querySelectorAll('legend').forEach(el => {
                const text = getText(el);
                if (text && text.length > 5) foundTexts.push({ source: 'legend', text });
            });
            
            document.querySelectorAll('span[data-value], span.nimeh2, span.ng-binding').forEach(el => {
                const text = getText(el);
                if (text && text.length > 2) foundTexts.push({ source: 'span', text });
            });
            
            const knownLessons = ['فارسی', 'قرآن', 'ریاضی', 'علوم تجربی', 'هنر', 'تربیت بدنی', 'هدیه های آسمان', 'مطالعات اجتماعی', 'شایستگی های عمومی', 'تفکر و پژوهش', 'کار و فناوری'];
            const normalizedLessons = knownLessons.map(l => ({ original: l, normalized: normalizeText(l) }));
            
            for (let item of foundTexts) {
                if (item.source === 'legend') {
                    const codeMatch = item.text.match(/\d+\s*-\s*([^\s\/]+)/);
                    if (codeMatch) {
                        const name = normalizeText(codeMatch[1]);
                        for (let l of normalizedLessons) { 
                            if (name === l.normalized || l.normalized.includes(name)) return l.original; 
                        }
                    }
                    
                    const norm = normalizeText(item.text);
                    for (let l of normalizedLessons) { 
                        if (norm.includes(l.normalized)) return l.original; 
                    }
                }
            }
            
            for (let item of foundTexts) {
                if (item.source === 'span') {
                    const norm = normalizeText(item.text);
                    for (let l of normalizedLessons) { 
                        if (norm === l.normalized || norm.includes(l.normalized)) return l.original; 
                    }
                }
            }
            
            const bodyText = normalizeText(document.body.textContent);
            for (let l of normalizedLessons) {
                if (bodyText.includes(l.normalized)) return l.original;
            }
            
            return null;
        }
        
        function findMainTable() {
            const tables = [];
            
            document.querySelectorAll('.k-grid-content table').forEach(t => {
                if (t.querySelector('tbody tr')) tables.push(t);
            });
            
            document.querySelectorAll('[class*="score"] table').forEach(t => {
                if (t.querySelector('tbody tr') && !tables.includes(t)) tables.push(t);
            });
            
            document.querySelectorAll('table th[data-field]').forEach(th => {
                const t = th.closest('table');
                if (t && t.querySelector('tbody tr') && !tables.includes(t)) tables.push(t);
            });
            
            if (tables.length === 0) {
                document.querySelectorAll('table').forEach(t => {
                    if (t.querySelector('tbody tr')) tables.push(t);
                });
            }
            
            if (tables.length > 1) {
                tables.sort((a, b) => {
                    const aRows = a.querySelectorAll('tbody tr').length;
                    const bRows = b.querySelectorAll('tbody tr').length;
                    return bRows - aRows;
                });
            }
            
            return tables[0] || null;
        }
        
        function countStudents(table) {
            const rows = table.querySelectorAll('tbody tr');
            let count = 0;
            for (let row of rows) { 
                if (row.querySelectorAll('td').length >= 3) count++; 
            }
            return count;
        }
        
        function detectColumns(table) {
            const rows = table.querySelectorAll('tbody tr');
            if (rows.length === 0) return null;
            
            const firstRow = rows[0];
            const cells = firstRow.querySelectorAll('td');
            if (cells.length < 4) return null;
            
            const cols = { gradeCol: -1, descCol: -1, totalCols: cells.length };
            
            for (let i = 0; i < cells.length; i++) {
                const input = cells[i].querySelector('input[type="text"], input[type="number"], input:not([type="checkbox"])');
                if (input) {
                    cols.gradeCol = i;
                    break;
                }
            }
            
            if (cols.gradeCol === -1) {
                cols.gradeCol = 0;
            }
            
            for (let i = cells.length - 1; i > cols.gradeCol; i--) {
                const input = cells[i].querySelector('input, textarea');
                if (input) {
                    cols.descCol = i;
                    break;
                }
            }
            
            if (cols.descCol === -1 || cols.descCol === cols.gradeCol) {
                cols.descCol = cells.length - 1;
            }
            
            return cols;
        }
        
        async function waitForTable(timeout = 10000) {
            const start = Date.now();
            while (Date.now() - start < timeout) {
                const table = findMainTable();
                if (table) return table;
                await sleep(200);
            }
            return null;
        }
        
        function setInputValue(input, value) {
            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
            nativeInputValueSetter.call(input, value);
            
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
            input.dispatchEvent(new Event('blur', { bubbles: true }));
        }
        
        async function processGrades(gradeLevel) {
            const table = await waitForTable();
            if (!table) { 
                alert('❌ جدول نمرات پیدا نشد!\n\nمطمئن شوید در صفحه ثبت نمرات توصیفی هستید.'); 
                return; 
            }
            
            const lessonName = detectLessonName();
            if (!lessonName) { 
                alert('⚠️ اسم درس تشخیص داده نشد!\n\nلطفاً با پشتیبان تماس بگیرید.'); 
                return; 
            }
            
            if (!DESCRIPTIONS[gradeLevel] || !DESCRIPTIONS[gradeLevel][lessonName]) {
                alert(`⚠️ متن توصیفی برای درس "${lessonName}" در ${gradeLevel} تعریف نشده است!`); 
                return; 
            }
            
            const cols = detectColumns(table);
            if (!cols) { 
                alert('❌ ساختار جدول تشخیص داده نشد!'); 
                return; 
            }
            
            const panel = document.getElementById('gradePanel');
            if (panel) panel.style.display = 'none';
            
            const totalStudents = countStudents(table);
            let successCount = 0, emptyCount = 0, errorCount = 0;
            const rows = table.querySelectorAll('tbody tr');
            
            for (let row of rows) {
                const cells = row.querySelectorAll('td');
                if (cells.length < 3) continue;
                
                const gradeCell = cells[cols.gradeCol];
                if (!gradeCell) continue;
                
                let grade = null;
                const input = gradeCell.querySelector('input[type="text"], input[type="number"], input:not([type="checkbox"])');
                
                if (input) {
                    const val = input.value.trim();
                    if (val !== '') grade = parseInt(val);
                } else {
                    const text = getText(gradeCell);
                    if (text !== '') grade = parseInt(text);
                }
                
                if (grade === null || isNaN(grade)) { 
                    emptyCount++; 
                    continue; 
                }
                
                if (grade < 1 || grade > 4) { 
                    errorCount++; 
                    continue; 
                }
                
                for (let i = cols.gradeCol + 1; i < cols.descCol; i++) {
                    if (i < cells.length) {
                        const ci = cells[i].querySelector('input');
                        if (ci) { 
                            setInputValue(ci, grade.toString());
                        }
                    }
                }
                
                if (cols.descCol < cells.length) {
                    const di = cells[cols.descCol].querySelector('input, textarea');
                    if (di) { 
                        setInputValue(di, DESCRIPTIONS[gradeLevel][lessonName][grade]);
                    }
                }
                
                successCount++;
                await sleep(50);
            }
            
            let msg = `✅ نمرات با موفقیت ثبت شد!\n\n`;
            msg += `🎒 پایه: ${gradeLevel}\n📚 درس: ${lessonName}\n`;
            msg += `👨‍🎓 تعداد کل: ${totalStudents} نفر\n✅ ثبت شده: ${successCount} مورد\n`;
            if (emptyCount > 0) msg += `⚠️ نمرات خالی: ${emptyCount} مورد\n`;
            if (errorCount > 0) msg += `❌ نمرات نامعتبر: ${errorCount} مورد\n`;
            alert(msg);
            
            if (panel) panel.style.display = 'block';
        }
        
        function createPanel() {
            let old = document.getElementById('gradePanel');
            if (old) old.remove();
            
            const grades = [
                { name: 'اول', emoji: '🎒', color: '#e91e63' },
                { name: 'دوم', emoji: '📏', color: '#9c27b0' },
                { name: 'سوم', emoji: '✏️', color: '#3f51b5' },
                { name: 'چهارم', emoji: '📖', color: '#009688' },
                { name: 'پنجم', emoji: '🏆', color: '#ff5722' },
                { name: 'ششم', emoji: '⭐', color: '#FFD700' }
            ];
            
            const panel = document.createElement('div');
            panel.id = 'gradePanel';
            panel.style.cssText = `position:fixed;top:16px;left:50%;transform:translateX(-50%);background:#fff;border:2px solid #0f4c81;border-radius:12px;padding:8px 12px;z-index:999999;box-shadow:0 4px 20px rgba(0,0,0,0.25);font-family:Tahoma,sans-serif;direction:rtl;`;
            
            let btns = '';
            grades.forEach(g => {
                btns += `<button class="grade-btn" data-grade="${g.name}" style="padding:8px 14px;margin:0 3px;border:2px solid ${g.color};border-radius:8px;background:white;color:${g.color};cursor:pointer;font-family:inherit;font-size:13px;font-weight:bold;transition:all 0.2s;white-space:nowrap;">${g.emoji} ${g.name}</button>`;
            });
            
            panel.innerHTML = `<div id="gradePanelHeader" style="text-align:center;margin-bottom:6px;cursor:move;user-select:none;font-size:12px;font-weight:bold;color:#0f4c81;">📚 انتخاب پایه</div><div style="display:flex;align-items:center;gap:2px;flex-wrap:wrap;justify-content:center;">${btns}<button id="btnCancel" style="padding:8px 10px;margin:0 3px;border:1px solid #ddd;border-radius:8px;background:#f5f5f5;color:#888;cursor:pointer;font-family:inherit;font-size:12px;white-space:nowrap;">✕</button></div>`;
            
            document.body.appendChild(panel);
            
            const header = document.getElementById('gradePanelHeader');
            let pos1=0,pos2=0,pos3=0,pos4=0;
            header.onmousedown = function(e) {
                e.preventDefault();
                pos3 = e.clientX; 
                pos4 = e.clientY;
                document.onmouseup = () => { 
                    document.onmouseup = null; 
                    document.onmousemove = null; 
                };
                document.onmousemove = function(e) {
                    e.preventDefault();
                    pos1 = pos3 - e.clientX; 
                    pos2 = pos4 - e.clientY;
                    pos3 = e.clientX; 
                    pos4 = e.clientY;
                    panel.style.top = (panel.offsetTop - pos2) + "px";
                    panel.style.left = (panel.offsetLeft - pos1) + "px";
                    panel.style.bottom = 'auto';
                    panel.style.transform = 'none';
                };
            };
            
            panel.querySelectorAll('.grade-btn').forEach(btn => {
                btn.addEventListener('click', function() { 
                    processGrades(this.getAttribute('data-grade')); 
                });
                
                btn.addEventListener('mouseover', function() {
                    this.style.background = this.style.borderColor;
                    this.style.color = 'white';
                });
                btn.addEventListener('mouseout', function() {
                    this.style.background = 'white';
                    this.style.color = this.style.borderColor;
                });
            });
            
            document.getElementById('btnCancel').addEventListener('click', () => { 
                panel.remove(); 
            });
            
            panel.addEventListener('click', e => e.stopPropagation());
        }
        
        createPanel();
    }
// ==================== ابزار ۱۴: بررسی ملیت والدین (نسخه API) ====================
    function nationalityCheckTool() {
        if (document.getElementById('nationalityPanel')) {
            document.getElementById('nationalityPanel').remove();
        }

        cleanupAllPanels();

        const STORAGE_KEY = 'nationality_check_v3';
        const RESULT_KEY = 'nationality_check_results_v3';
        const PROGRESS_KEY = 'nationality_check_progress_v3';   // ✅ جدید

        let allStudents = [];
        let results = {
            completed: [],
            success: [],
            failed: [],
            pending: []
        };
        let isRunning = false;
        let startFromPage = 1;
        let currentIndex = 0;   // ✅ جدید
        let abortController = null;

        function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

        function escapeHtml(text) {
            if (!text) return '';
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        function showNotification(text, duration) {
            if (duration === undefined) duration = 4000;
            let old = document.getElementById('natNotif');
            if (old) old.remove();
            let notif = document.createElement('div');
            notif.id = 'natNotif';
            notif.style.cssText = 'position:fixed;bottom:20px;left:20px;background:#1a1a2e;color:white;padding:12px 20px;border-radius:8px;z-index:9999999;font-family:Tahoma;font-size:14px;box-shadow:0 4px 12px rgba(0,0,0,0.3);max-width:350px;direction:rtl;';
            notif.textContent = text;
            notif.addEventListener('click', function() { notif.remove(); });
            document.body.appendChild(notif);
            if (duration > 0) setTimeout(function() { if (notif.parentNode) notif.remove(); }, duration);
        }

        function makeDraggable(elmnt, handle) {
            let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
            handle.style.cursor = 'grab';
            handle.onmousedown = function(e) {
                e = e || window.event; e.preventDefault();
                pos3 = e.clientX; pos4 = e.clientY;
                document.onmouseup = function() { document.onmouseup = null; document.onmousemove = null; handle.style.cursor = 'grab'; };
                document.onmousemove = function(e) {
                    e = e || window.event; e.preventDefault();
                    pos1 = pos3 - e.clientX; pos2 = pos4 - e.clientY;
                    pos3 = e.clientX; pos4 = e.clientY;
                    elmnt.style.top = (elmnt.offsetTop - pos2) + 'px';
                    elmnt.style.left = (elmnt.offsetLeft - pos1) + 'px';
                };
                handle.style.cursor = 'grabbing';
            };
        }

        function getToken() {
            try { var t = sessionStorage.getItem('token'); if (t) return t; } catch(e) {}
            try { var t2 = localStorage.getItem('token'); if (t2) return t2; } catch(e) {}
            return null;
        }

        function getClientId() {
            try { var c1 = localStorage.getItem('pages-client-id'); if (c1) return c1; } catch(e) {}
            try { var c2 = sessionStorage.getItem('pages-client-id'); if (c2) return c2; } catch(e) {}
            return 'mt1ag7vh-f9qt51vf-is5kslgz-am182rru-3pu0h0ne';
        }

        function normalizeDigits(str) {
            if (str === null || str === undefined) return '';
            return String(str).replace(/[۰-۹]/g, function(d) {
                return '۰۱۲۳۴۵۶۷۸۹'.indexOf(d);
            });
        }

        function getGridFilter() {
            try {
                var gridEl = document.querySelector('.k-grid');
                if (!gridEl) return null;
                var grid = $(gridEl).data('kendoGrid');
                if (!grid) return null;
                return grid.dataSource.filter();
            } catch (e) { return null; }
        }

        function getCurrentPageNumber() {
            try {
                var active = document.querySelector('.k-pager-numbers .k-state-selected');
                if (active) {
                    var num = parseInt(active.textContent.trim());
                    if (!isNaN(num)) return num;
                }
                var gridEl = document.querySelector('.k-grid');
                if (gridEl) {
                    var grid = $(gridEl).data('kendoGrid');
                    if (grid) return grid.dataSource.page();
                }
            } catch(e) {}
            return 1;
        }

        function getCurrentPageSize() {
            try {
                var gridEl = document.querySelector('.k-grid');
                if (gridEl) {
                    var grid = $(gridEl).data('kendoGrid');
                    if (grid) return grid.dataSource.pageSize();
                }
            } catch(e) {}
            return 15;
        }

        // ✅ توابع جدید: ذخیره/بازیابی/پاک‌سازی پیشرفت
        function saveProgress() {
            try {
                localStorage.setItem(PROGRESS_KEY, JSON.stringify({
                    allStudents: allStudents,
                    currentIndex: currentIndex,
                    startFromPage: startFromPage,
                    savedAt: Date.now()
                }));
            } catch(e) {
                console.warn('خطا در ذخیره پیشرفت:', e);
            }
        }

        function loadProgress() {
            try {
                var data = localStorage.getItem(PROGRESS_KEY);
                if (data) return JSON.parse(data);
            } catch(e) {}
            return null;
        }

        function clearProgress() {
            try {
                localStorage.removeItem(PROGRESS_KEY);
            } catch(e) {}
        }

        async function fetchAllStudents() {
            var pageSize = 500;
            var page = 1;
            var allFetched = [];
            var total = 0;
            var hasMore = true;

            var token = getToken();
            if (!token) {
                showNotification('❌ توکن پیدا نشد.');
                return [];
            }

            var clientId = getClientId();
            var gridFilter = getGridFilter();

            var currentGridPageSize = getCurrentPageSize();
            var initialSkip = (startFromPage - 1) * currentGridPageSize;

            console.log('📄 شروع از صفحه:', startFromPage);
            console.log('📄 تعداد در هر صفحه:', currentGridPageSize);
            console.log('📄 skip:', initialSkip);

            while (hasMore && isRunning) {
                try {
                    var body = {
                        take: pageSize,
                        skip: initialSkip + (page - 1) * pageSize,
                        page: page,
                        pageSize: pageSize,
                        sort: [{ field: 'id', dir: 'asc' }]
                    };
                    if (gridFilter) body.filter = gridFilter;

                    var response = await fetch('/api/Student/GetStudentInfo', {
                        method: 'POST',
                        credentials: 'include',
                        headers: {
                            'Content-Type': 'application/json; charset=utf-8',
                            'Accept': 'application/json',
                            'X-Requested-With': 'XMLHttpRequest',
                            'Authorization': 'Bearer ' + token,
                            'client-id': clientId
                        },
                        body: JSON.stringify(body)
                    });

                    if (!response.ok) throw new Error('HTTP ' + response.status);

                    var json = await response.json();
                    var items = (json.data && json.data.data) || json.data || [];

                    if (!Array.isArray(items) || items.length === 0) break;

                    if (json.data && json.data.total) total = json.data.total;
                    allFetched = allFetched.concat(items);

                    updatePanelUI('دریافت شد: ' + allFetched.length + (total ? ' از ' + total : ''));

                    if (items.length < pageSize) hasMore = false;
                    else page++;

                    await sleep(100);

                } catch (e) {
                    console.error('خطا:', e);
                    showNotification('❌ خطا در دریافت: ' + e.message);
                    hasMore = false;
                }
            }

            return allFetched;
        }

        async function estelamParent(student, parentType) {
            var token = getToken();
            var clientId = getClientId();

            var nationalCode = parentType === 1
                ? normalizeDigits(student.fatherNationalCode)
                : normalizeDigits(student.motherNationalCode);

            var birthDate = parentType === 1
                ? normalizeDigits(student.fatherBirthDate)
                : normalizeDigits(student.motherBirthDate);

            if (!nationalCode || !birthDate) {
                return { status: 'no_data', message: 'کد ملی یا تاریخ تولد خالیه' };
            }

            var body = {
                parentTypeId: parentType,
                studentId: student.id,
                nationalCode: nationalCode,
                birthDate: parseInt(birthDate),
                nationalityTypeId: "1"
            };

            for (var attempt = 1; attempt <= 6; attempt++) {
                if (!isRunning) return { status: 'stopped' };

                try {
                    var res = await fetch('/api/Student/EstelamSAbtAhvalParent', {
                        method: 'POST',
                        credentials: 'include',
                        headers: {
                            'Content-Type': 'application/json; charset=utf-8',
                            'X-Requested-With': 'XMLHttpRequest',
                            'Authorization': 'Bearer ' + token,
                            'client-id': clientId
                        },
                        body: JSON.stringify(body)
                    });

                    if (!res.ok) {
                        await sleep(2000);
                        continue;
                    }

                    var json = await res.json();

                    if (json.data && json.data.nin) {
                        return {
                            status: 'success',
                            data: json.data,
                            attempts: attempt
                        };
                    }

                    if (json.resultCode === 1 && json.failures) {
                        await sleep(2000);
                        continue;
                    }

                    console.log('پاسخ نامشخص:', json);

                } catch (e) {
                    console.error('خطا در تلاش ' + attempt + ':', e);
                }

                await sleep(2000);
            }

            return { status: 'failed', message: 'بعد از ۶ تلاش ناموفق' };
        }

        async function processStudent(student, index, total) {
            // ✅ آپدیت currentIndex
            currentIndex = index;

            var studentName = (student.firstName || '') + ' ' + (student.lastName || '');
            updatePanelUI('پردازش ' + (index + 1) + '/' + total + ': ' + studentName);

            var fatherNeeded = !student.fatherNationalityTypeId || student.fatherNationalityTypeId === 0;
            var motherNeeded = !student.motherNationalityTypeId || student.motherNationalityTypeId === 0;

            if (!fatherNeeded && !motherNeeded) {
                results.completed.push({
                    id: student.id,
                    name: student.firstName,
                    family: student.lastName,
                    note: 'ملیت از قبل ثبت شده'
                });
                saveResults();
                // ✅ ذخیره پیشرفت
                currentIndex = index + 1;
                saveProgress();
                updatePanelUI();
                return;
            }

            var fatherResult = { status: 'skip' };
            var motherResult = { status: 'skip' };

            if (fatherNeeded) {
                updatePanelUI('استعلام پدر: ' + studentName);
                fatherResult = await estelamParent(student, 1);
                await sleep(500);
            }

            if (motherNeeded && isRunning) {
                updatePanelUI('استعلام مادر: ' + studentName);
                motherResult = await estelamParent(student, 2);
                await sleep(500);
            }

            var fatherOk = fatherResult.status === 'success' || fatherResult.status === 'skip';
            var motherOk = motherResult.status === 'success' || motherResult.status === 'skip';

            var failReason = '';
            if (!fatherOk && !motherOk) {
                failReason = 'پدر و مادر';
            } else if (!fatherOk) {
                failReason = 'پدر';
            } else if (!motherOk) {
                failReason = 'مادر';
            }

            var record = {
                id: student.id,
                name: student.firstName,
                family: student.lastName,
                fatherNationalCode: student.fatherNationalCode,
                motherNationalCode: student.motherNationalCode,
                fatherStatus: fatherResult.status,
                motherStatus: motherResult.status,
                fatherAttempts: fatherResult.attempts || 0,
                motherAttempts: motherResult.attempts || 0,
                failReason: failReason
            };

            if (fatherOk && motherOk) {
                results.success.push(record);
                showNotification('✅ ' + studentName + ' انجام شد');
            } else {
                results.failed.push(record);
                showNotification('❌ ' + studentName + ' — ناموفق: ' + failReason, 5000);
            }

            saveResults();
            // ✅ ذخیره پیشرفت
            currentIndex = index + 1;
            saveProgress();
            updatePanelUI();
        }

        async function startCheck(fromBeginning) {
            if (isRunning) {
                showNotification('عملیات در حال انجام است...');
                return;
            }

            isRunning = true;

            // ✅ اگه از ابتدا → ریست
            if (fromBeginning) {
                results = { completed: [], success: [], failed: [], pending: [] };
                allStudents = [];
                currentIndex = 0;
                startFromPage = 1;
                clearProgress();
                saveResults();
                console.log('🔄 شروع از ابتدا - پیشرفت پاک شد');
            } else {
                // ✅ چک کن پیشرفت قبلی هست یا نه
                var progress = loadProgress();
                if (progress && progress.allStudents && progress.allStudents.length > 0 && progress.currentIndex < progress.allStudents.length) {
                    // ادامه بده
                    allStudents = progress.allStudents;
                    currentIndex = progress.currentIndex || 0;
                    startFromPage = progress.startFromPage || 1;
                    console.log('🔄 ادامه از دانش‌آموز ' + (currentIndex + 1) + ' از ' + allStudents.length);
                    showNotification('🔄 ادامه از نفر ' + (currentIndex + 1) + ' از ' + allStudents.length);
                    updatePanelUI('ادامه از نفر ' + (currentIndex + 1) + '...');
                } else {
                    // شروع جدید از صفحه فعلی
                    results = { completed: [], success: [], failed: [], pending: [] };
                    allStudents = [];
                    currentIndex = 0;
                    startFromPage = getCurrentPageNumber();
                    saveResults();
                    console.log('🆕 شروع جدید از صفحه ' + startFromPage);
                }
            }

            var modeText = fromBeginning ? 'از ابتدا' : 'از صفحه ' + startFromPage;
            if (currentIndex > 0 && !fromBeginning) {
                modeText = 'ادامه از نفر ' + (currentIndex + 1);
            }

            updatePanelUI('در حال دریافت ' + modeText + '...');

            try {
                // ✅ فقط اگه allStudents خالیه، از API بگیر
                if (allStudents.length === 0) {
                    allStudents = await fetchAllStudents();
                }

                if (!isRunning) return;

                if (allStudents.length === 0) {
                    showNotification('❌ داده‌ای دریافت نشد');
                    isRunning = false;
                    return;
                }

                updatePanelUI('دریافت شد: ' + allStudents.length + ' نفر');
                await sleep(500);

                // ✅ حلقه از currentIndex شروع میشه
                for (var i = currentIndex; i < allStudents.length; i++) {
                    if (!isRunning) {
                        // ✅ ذخیره پیشرفت هنگام توقف
                        currentIndex = i;
                        saveProgress();
                        break;
                    }
                    await processStudent(allStudents[i], i, allStudents.length);
                    currentIndex = i + 1;
                    saveProgress();   // ✅ ذخیره بعد هر نفر
                    await sleep(200);
                }

                // ✅ اگه تموم شد، پیشرفت رو پاک کن
                if (currentIndex >= allStudents.length) {
                    updatePanelUI('✅ پایان کار');
                    showNotification('🎉 ' + results.success.length + ' موفق، ' + results.failed.length + ' ناموفق', 0);
                    clearProgress();
                }

            } catch (e) {
                console.error(e);
                showNotification('❌ خطا: ' + e.message);
            }

            isRunning = false;
            updatePanelUI();
        }

        function stopCheck() {
            if (isRunning) {
                isRunning = false;
                saveProgress();   // ✅ ذخیره پیشرفت هنگام توقف
                showNotification('⏹️ متوقف شد — پیشرفت ذخیره شد');
                updatePanelUI('متوقف شد');
            }
        }

        function clearMemory() {
            if (confirm('پاک کردن تمام نتایج و پیشرفت؟')) {
                localStorage.removeItem(STORAGE_KEY);
                localStorage.removeItem(RESULT_KEY);
                localStorage.removeItem(PROGRESS_KEY);   // ✅ پاک کردن پیشرفت
                results = { completed: [], success: [], failed: [], pending: [] };
                allStudents = [];
                currentIndex = 0;
                updatePanelUI();
                showNotification('پاک شد');
            }
        }

        function showReport() {
            var total = results.completed.length + results.success.length + results.failed.length;
            if (total === 0) {
                alert('هنوز داده‌ای نیست');
                return;
            }

            var overlay = document.createElement('div');
            overlay.id = 'nationalityReportOverlay';
            overlay.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.85);z-index:9999999;display:flex;align-items:center;justify-content:center;font-family:Tahoma;direction:rtl;padding:20px;box-sizing:border-box;';

            var html = '<div style="background:white;border-radius:12px;max-width:900px;width:100%;max-height:90vh;overflow-y:auto;padding:25px;box-shadow:0 10px 40px rgba(0,0,0,0.5);">';
            html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;border-bottom:2px solid #00c853;padding-bottom:15px;">';
            html += '<h2 style="margin:0;color:#333;font-size:24px;">📋 گزارش بررسی ملیت والدین</h2>';
            html += '<button onclick="this.closest(\'#nationalityReportOverlay\').remove()" style="background:#f44336;color:white;border:none;width:36px;height:36px;border-radius:50%;cursor:pointer;font-size:22px;">✕</button>';
            html += '</div>';

            html += '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:20px;">';
            html += '<div style="background:#e8f5e9;padding:12px;border-radius:8px;text-align:center;"><div style="font-size:15px;color:#666;">✅ موفق</div><div style="font-size:28px;font-weight:bold;color:#2e7d32;">' + results.success.length + '</div></div>';
            html += '<div style="background:#ffebee;padding:12px;border-radius:8px;text-align:center;"><div style="font-size:15px;color:#666;">❌ ناموفق</div><div style="font-size:28px;font-weight:bold;color:#c62828;">' + results.failed.length + '</div></div>';
            html += '<div style="background:#e3f2fd;padding:12px;border-radius:8px;text-align:center;"><div style="font-size:15px;color:#666;">⏭️ از قبل ثبت</div><div style="font-size:28px;font-weight:bold;color:#1565c0;">' + results.completed.length + '</div></div>';
            html += '</div>';

            if (results.success.length > 0) {
                html += '<h3 style="color:#2e7d32;margin:15px 0 10px;font-size:22px;">✅ استعلام موفق (' + results.success.length + ')</h3>';
                html += '<div style="overflow-x:auto;margin-bottom:20px;"><table style="width:100%;border-collapse:collapse;font-size:17px;"><thead><tr style="background:#2e7d32;color:white;"><th style="padding:8px;border:1px solid #ddd;">#</th><th style="padding:8px;border:1px solid #ddd;">نام</th><th style="padding:8px;border:1px solid #ddd;">فامیل</th><th style="padding:8px;border:1px solid #ddd;">کد دانش‌آموزی</th></tr></thead><tbody>';
                results.success.forEach(function(s, i) {
                    html += '<tr><td style="padding:6px;border:1px solid #ddd;text-align:center;">' + (i+1) + '</td><td style="padding:6px;border:1px solid #ddd;">' + escapeHtml(s.name) + '</td><td style="padding:6px;border:1px solid #ddd;">' + escapeHtml(s.family) + '</td><td style="padding:6px;border:1px solid #ddd;text-align:center;direction:ltr;">' + escapeHtml(String(s.id)) + '</td></tr>';
                });
                html += '</tbody></table></div>';
            }

            if (results.failed.length > 0) {
                html += '<h3 style="color:#c62828;margin:15px 0 10px;font-size:22px;">❌ ناموفق (' + results.failed.length + ')</h3>';
                html += '<div style="overflow-x:auto;margin-bottom:20px;"><table style="width:100%;border-collapse:collapse;font-size:17px;"><thead><tr style="background:#c62828;color:white;">';
                html += '<th style="padding:8px;border:1px solid #ddd;">#</th>';
                html += '<th style="padding:8px;border:1px solid #ddd;">نام</th>';
                html += '<th style="padding:8px;border:1px solid #ddd;">فامیل</th>';
                html += '<th style="padding:8px;border:1px solid #ddd;">کد دانش‌آموزی</th>';
                html += '<th style="padding:8px;border:1px solid #ddd;background:#8b0000;">علت ناموفق</th>';
                html += '</tr></thead><tbody>';
                results.failed.forEach(function(s, i) {
                    var reasonText = s.failReason || 'نامشخص';
                    html += '<tr>';
                    html += '<td style="padding:6px;border:1px solid #ddd;text-align:center;">' + (i+1) + '</td>';
                    html += '<td style="padding:6px;border:1px solid #ddd;">' + escapeHtml(s.name) + '</td>';
                    html += '<td style="padding:6px;border:1px solid #ddd;">' + escapeHtml(s.family) + '</td>';
                    html += '<td style="padding:6px;border:1px solid #ddd;text-align:center;direction:ltr;">' + escapeHtml(String(s.id)) + '</td>';
                    html += '<td style="padding:6px;border:1px solid #ddd;text-align:center;font-weight:bold;color:#c62828;">' + escapeHtml(reasonText) + '</td>';
                    html += '</tr>';
                });
                html += '</tbody></table></div>';
            }

            html += '<div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:20px;">';
            html += '<button id="btnWordReport" style="background:#2e7d32;color:white;border:none;padding:10px 20px;border-radius:8px;cursor:pointer;font-family:inherit;font-weight:bold;font-size:17px;">📥 دانلود Word</button>';
            html += '<button id="btnCopyReport" style="background:#6c8cff;color:white;border:none;padding:10px 20px;border-radius:8px;cursor:pointer;font-family:inherit;font-weight:bold;font-size:17px;">📋 کپی</button>';
            html += '<button onclick="this.closest(\'#nationalityReportOverlay\').remove()" style="background:#6b7280;color:white;border:none;padding:10px 20px;border-radius:8px;cursor:pointer;font-family:inherit;font-weight:bold;font-size:17px;">بستن</button>';
            html += '</div></div>';

            overlay.innerHTML = html;
            document.body.appendChild(overlay);

            document.getElementById('btnWordReport').onclick = function() {
                var wordHtml = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"><style>body{font-family:Tahoma;direction:rtl;}table{border-collapse:collapse;width:100%;}th,td{border:1px solid #999;padding:8px;text-align:center;}</style></head><body>';
                wordHtml += '<h2>گزارش بررسی ملیت والدین</h2>';
                wordHtml += '<p>✅ موفق: ' + results.success.length + ' | ❌ ناموفق: ' + results.failed.length + ' | ⏭️ از قبل: ' + results.completed.length + '</p>';

                if (results.success.length > 0) {
                    wordHtml += '<h3>✅ استعلام موفق</h3><table><tr><th>#</th><th>نام</th><th>فامیل</th><th>کد دانش‌آموزی</th></tr>';
                    results.success.forEach(function(s, i) {
                        wordHtml += '<tr><td>' + (i+1) + '</td><td>' + escapeHtml(s.name) + '</td><td>' + escapeHtml(s.family) + '</td><td>' + escapeHtml(String(s.id)) + '</td></tr>';
                    });
                    wordHtml += '</table>';
                }

                if (results.failed.length > 0) {
                    wordHtml += '<h3>❌ ناموفق</h3><table><tr><th>#</th><th>نام</th><th>فامیل</th><th>کد</th><th>علت ناموفق</th></tr>';
                    results.failed.forEach(function(s, i) {
                        wordHtml += '<tr><td>' + (i+1) + '</td><td>' + escapeHtml(s.name) + '</td><td>' + escapeHtml(s.family) + '</td><td>' + escapeHtml(String(s.id)) + '</td><td>' + escapeHtml(s.failReason || 'نامشخص') + '</td></tr>';
                    });
                    wordHtml += '</table>';
                }

                wordHtml += '</body></html>';

                var blob = new Blob(['\ufeff' + wordHtml], { type: 'application/msword;charset=utf-8' });
                var link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = 'nationality_report_' + new Date().toISOString().slice(0,10) + '.doc';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(link.href);
            };

            document.getElementById('btnCopyReport').onclick = function() {
                var text = '📋 گزارش بررسی ملیت والدین\n';
                text += '═══════════════════════════\n';
                text += '✅ موفق: ' + results.success.length + '\n';
                text += '❌ ناموفق: ' + results.failed.length + '\n';
                text += '⏭️ از قبل: ' + results.completed.length + '\n\n';

                if (results.success.length > 0) {
                    text += '✅ موفق:\n';
                    results.success.forEach(function(s, i) {
                        text += (i+1) + '. ' + s.name + ' ' + s.family + ' (' + s.id + ')\n';
                    });
                    text += '\n';
                }
                if (results.failed.length > 0) {
                    text += '❌ ناموفق:\n';
                    results.failed.forEach(function(s, i) {
                        text += (i+1) + '. ' + s.name + ' ' + s.family + ' (' + s.id + ') — علت: ' + (s.failReason || 'نامشخص') + '\n';
                    });
                }

                navigator.clipboard.writeText(text).then(function() {
                    alert('✅ کپی شد!');
                }).catch(function() {
                    alert('❌ کپی نشد');
                });
            };
        }

        function updatePanelUI(status) {
            var statusEl = document.getElementById('natStatus');
            if (statusEl && status) statusEl.textContent = status;

            var totalEl = document.getElementById('natTotal');
            if (totalEl) totalEl.textContent = allStudents.length.toLocaleString('fa-IR');

            var successEl = document.getElementById('natSuccess');
            if (successEl) successEl.textContent = results.success.length.toLocaleString('fa-IR');

            var failedEl = document.getElementById('natFailed');
            if (failedEl) failedEl.textContent = results.failed.length.toLocaleString('fa-IR');

            var completedEl = document.getElementById('natCompletedPrev');
            if (completedEl) completedEl.textContent = results.completed.length.toLocaleString('fa-IR');
        }

        function saveResults() {
            try {
                localStorage.setItem(RESULT_KEY, JSON.stringify(results));
            } catch(e) {}
        }

        function loadResults() {
            try {
                var data = localStorage.getItem(RESULT_KEY);
                if (data) results = JSON.parse(data);
            } catch(e) {}
        }

        function handleStartClick(fromBeginning) {
            var btnHere = document.getElementById('btnStartFromHere');
            var btnBegin = document.getElementById('btnStartFromBeginning');
            var btnStop = document.getElementById('btnStop');

            if (btnHere) btnHere.style.display = 'none';
            if (btnBegin) btnBegin.style.display = 'none';
            if (btnStop) btnStop.style.display = 'block';

            startCheck(fromBeginning).then(function() {
                if (btnHere) btnHere.style.display = 'block';
                if (btnBegin) btnBegin.style.display = 'block';
                if (btnStop) btnStop.style.display = 'none';
            });
        }

        function createPanel() {
            var panel = document.createElement('div');
            panel.id = 'nationalityPanel';
            panel.style.cssText = 'position:fixed;top:20px;left:20px;background:white;border:2px solid #00c853;border-radius:10px;padding:15px;width:360px;max-width:90vw;z-index:999999;box-shadow:0 4px 20px rgba(0,0,0,0.2);font-family:Tahoma;direction:rtl;font-size:16px;color:#333;';

            panel.innerHTML =
                '<div id="natHeader" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;padding-bottom:10px;border-bottom:2px solid #00c853;user-select:none;cursor:move;">' +
                    '<strong style="color:#00c853;font-size:19px;">🔍 بررسی ملیت والدین</strong>' +
                    '<button id="btnClose" style="background:none;border:none;cursor:pointer;font-size:22px;color:#999;">✕</button>' +
                '</div>' +
                '<div style="background:#e8f5e9;padding:12px;border-radius:8px;margin-bottom:12px;text-align:center;">' +
                    '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:5px;">' +
                        '<div><div style="font-size:13px;color:#666;">موفق</div><div id="natSuccess" style="font-size:24px;font-weight:bold;color:#2e7d32;">0</div></div>' +
                        '<div><div style="font-size:13px;color:#666;">ناموفق</div><div id="natFailed" style="font-size:24px;font-weight:bold;color:#c62828;">0</div></div>' +
                        '<div><div style="font-size:13px;color:#666;">از قبل</div><div id="natCompletedPrev" style="font-size:24px;font-weight:bold;color:#1565c0;">0</div></div>' +
                    '</div>' +
                    '<div style="font-size:14px;color:#666;margin-top:8px;">کل: <span id="natTotal">0</span></div>' +
                    '<div id="natStatus" style="font-size:14px;color:#666;margin-top:5px;">آماده شروع...</div>' +
                '</div>' +
                '<div style="display:flex;flex-direction:column;gap:8px;">' +
                    '<button id="btnStartFromHere" style="background:#00c853;color:white;border:none;padding:14px;border-radius:6px;cursor:pointer;font-family:inherit;font-weight:bold;font-size:18px;">▶️ شروع / ادامه</button>' +
                    '<button id="btnStartFromBeginning" style="background:#f59e0b;color:white;border:none;padding:14px;border-radius:6px;cursor:pointer;font-family:inherit;font-weight:bold;font-size:18px;">🚀 شروع از ابتدا</button>' +
                    '<button id="btnStop" style="background:#ef4444;color:white;border:none;padding:14px;border-radius:6px;cursor:pointer;font-family:inherit;font-weight:bold;font-size:18px;display:none;">⛔ توقف</button>' +
                    '<button id="btnReport" style="background:#6c8cff;color:white;border:none;padding:14px;border-radius:6px;cursor:pointer;font-family:inherit;font-weight:bold;font-size:18px;">📋 گزارش نهایی</button>' +
                    '<button id="btnClear" style="background:#fff;color:#c62828;border:1px solid #c62828;padding:12px;border-radius:6px;cursor:pointer;font-family:inherit;font-size:16px;font-weight:bold;">🗑️ پاک‌سازی</button>' +
                '</div>';

            document.body.appendChild(panel);

            makeDraggable(panel, document.getElementById('natHeader'));
            if (typeof makeDraggableByTouch === 'function') {
                makeDraggableByTouch(panel, document.getElementById('natHeader'));
            }

            document.getElementById('btnClose').onclick = function() { panel.remove(); };

            document.getElementById('btnStartFromHere').onclick = function() {
                handleStartClick(false);
            };

            document.getElementById('btnStartFromBeginning').onclick = function() {
                handleStartClick(true);
            };

            document.getElementById('btnStop').onclick = stopCheck;
            document.getElementById('btnReport').onclick = showReport;
            document.getElementById('btnClear').onclick = clearMemory;

            loadResults();
            updatePanelUI();
        }

        createPanel();
    }
 // ==================== ابزار ۱۵: انتقال از بینا به سیدا ====================
    function pasteFromBinaTool() {
        if (document.getElementById('pasteFromBinaPanel')) {
            document.getElementById('pasteFromBinaPanel').remove();
        }

        cleanupAllPanels();

        const COOKIE_NAME = 'bina_students_data';
        const STORAGE_KEY = 'bina_students_complete';
        const LIST_KEY = 'bina_all_students';

        function hasGM() {
            return typeof GM_getValue !== 'undefined' && typeof GM_setValue !== 'undefined';
        }

        function getStorage() {
            // ۱. اول localStorage
            try {
                var ls = localStorage.getItem(STORAGE_KEY);
                if (ls) {
                    var parsed = JSON.parse(ls);
                    if (Object.keys(parsed).length > 0) return parsed;
                }
            } catch (e) {}

            // ۲. بعد GM
            if (hasGM()) {
                try {
                    var s = GM_getValue(STORAGE_KEY, '');
                    if (s) {
                        var parsed2 = typeof s === 'string' ? JSON.parse(s) : s;
                        if (Object.keys(parsed2).length > 0) return parsed2;
                    }
                } catch (e) {}
            }

            // ۳. بعد Cookie
            try {
                var cookies = document.cookie.split(';');
                for (var i = 0; i < cookies.length; i++) {
                    var c = cookies[i].trim();
                    if (c.indexOf(COOKIE_NAME + '=') === 0) {
                        return JSON.parse(decodeURIComponent(c.substring(COOKIE_NAME.length + 1)));
                    }
                }
            } catch (e) {}

            return {};
        }

        function saveStorage(obj) {
            var json = JSON.stringify(obj);
            if (hasGM()) {
                try { GM_setValue(STORAGE_KEY, json); } catch (e) {}
            }
            try {
                localStorage.setItem(STORAGE_KEY, json);
            } catch (e) {}
            try {
                var encoded = encodeURIComponent(json);
                if (encoded.length <= 4000) {
                    var expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString();
                    document.cookie = COOKIE_NAME + '=' + encoded +
                        '; expires=' + expires + '; path=/; domain=.medu.ir; SameSite=Lax';
                }
            } catch (e) {}
        }

        function getFromStorage(nationalId) {
            var s = getStorage();
            if (!s[nationalId]) return null;
            return s[nationalId].data || s[nationalId];
        }

        function getStorageCount() {
            return Object.keys(getStorage()).length;
        }

        function deleteFromStorage(nationalId) {
            var s = getStorage();
            delete s[nationalId];
            saveStorage(s);
            return Object.keys(s).length;
        }

        function clearStorage() {
            // پاک کردن از همه منابع
            saveStorage({});
            try { localStorage.removeItem(STORAGE_KEY); } catch(e) {}
            if (hasGM()) {
                try { GM_setValue(STORAGE_KEY, '{}'); } catch(e) {}
            }
            return 0;
        }

        function clearStudentList() {
            try { localStorage.removeItem(LIST_KEY); } catch(e) {}
            if (hasGM()) {
                try { GM_setValue(LIST_KEY, '[]'); } catch(e) {}
            }
        }

        function showToast(message, type) {
            type = type || 'success';
            var colors = {
                success: '#10b981',
                error: '#ef4444',
                info: '#3b82f6',
                warning: '#f59e0b'
            };
            var icons = {
                success: '✅',
                error: '❌',
                info: 'ℹ️',
                warning: '⚠️'
            };

            var toast = document.createElement('div');
            toast.style.cssText = `
                position: fixed;
                top: 30px;
                left: 50%;
                transform: translateX(-50%) translateY(-100px);
                background: ${colors[type]};
                color: white;
                padding: 16px 32px;
                border-radius: 12px;
                font-family: Tahoma, Arial, sans-serif;
                font-size: 18px;
                font-weight: bold;
                box-shadow: 0 10px 40px rgba(0,0,0,0.3);
                z-index: 99999999;
                direction: rtl;
                transition: transform 0.3s ease, opacity 0.3s ease;
                opacity: 0;
                pointer-events: none;
            `;
            toast.textContent = icons[type] + ' ' + message;
            document.body.appendChild(toast);

            setTimeout(function () {
                toast.style.transform = 'translateX(-50%) translateY(0)';
                toast.style.opacity = '1';
            }, 50);

            setTimeout(function () {
                toast.style.transform = 'translateX(-50%) translateY(-100px)';
                toast.style.opacity = '0';
                setTimeout(function () {
                    if (toast.parentNode) toast.parentNode.removeChild(toast);
                }, 300);
            }, 2000);
        }

        function exportLogToWord(pasteLogs) {
            var html = ''
              + '<html xmlns:o="urn:schemas-microsoft-com:office:office" '
              + 'xmlns:w="urn:schemas-microsoft-com:office:word" '
              + 'xmlns="http://www.w3.org/TR/REC-html40">'
              + '<head><meta charset="utf-8"><style>'
              + 'body{font-family:Tahoma;direction:rtl;padding:20px;}'
              + 'h2{color:#1e293b;border-bottom:3px solid #667eea;padding-bottom:8px;}'
              + 'pre{background:#f8fafc;padding:15px;border-radius:8px;'
              + 'font-family:Consolas,monospace;font-size:13px;direction:rtl;'
              + 'text-align:right;white-space:pre-wrap;border:1px solid #cbd5e1;}'
              + '.meta{color:#64748b;font-size:12px;margin-bottom:20px;}'
              + '</style></head><body>'
              + '<h2>📋 گزارش جاگذاری از بینا به سیدا</h2>'
              + '<p class="meta">تاریخ: ' + new Date().toLocaleString('fa-IR') + '</p>';

            if (pasteLogs && pasteLogs.length) {
                html += '<pre>' + pasteLogs.join('\n')
                    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</pre>';
            }

            html += '</body></html>';

            var blob = new Blob(['\uFEFF' + html], { type: 'application/msword;charset=utf-8' });
            var a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = 'paste_report_' + new Date().toISOString().slice(0, 10) + '.doc';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(blob);
        }

        function copyLogToClipboard(text) {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text).then(function () {
                    showToast('گزارش کپی شد!', 'success');
                }).catch(function () {
                    fallbackCopy(text);
                });
            } else {
                fallbackCopy(text);
            }
        }

        function fallbackCopy(text) {
            var ta = document.createElement('textarea');
            ta.value = text;
            ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;';
            document.body.appendChild(ta);
            ta.select();
            try {
                document.execCommand('copy');
                showToast('گزارش کپی شد!', 'success');
            } catch (e) {
                showToast('کپی نشد!', 'error');
            }
            document.body.removeChild(ta);
        }

        // ===== ساخت پنل =====
        var panel = document.createElement('div');
        panel.id = 'pasteFromBinaPanel';
        panel.style.cssText = `
            position: fixed;
            top: 10px;
            left: 10px;
            width: 460px;
            max-width: 92vw;
            max-height: 92vh;
            background: #1e293b;
            color: #e2e8f0;
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.5);
            z-index: 9999999;
            font-family: Tahoma, Arial, sans-serif;
            direction: rtl;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        `;

        var header = document.createElement('div');
        header.style.cssText = `
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 10px 14px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            user-select: none;
            cursor: move;
        `;
        header.innerHTML = `
            <strong style="font-size:17px;">📤 انتقال از بینا به سیدا</strong>
            <div style="display:flex;gap:6px;">
                <span id="pfb-min" title="مینیمایز" style="cursor:pointer;font-size:17px;padding:4px 10px;background:rgba(255,255,255,0.15);border-radius:6px;">➖</span>
                <span id="pfb-reset" title="ریست پنل" style="cursor:pointer;font-size:17px;padding:4px 10px;background:rgba(255,255,255,0.15);border-radius:6px;">🔄</span>
                <span id="pfb-close" title="بستن" style="cursor:pointer;font-size:17px;padding:4px 10px;background:rgba(255,255,255,0.15);border-radius:6px;">✖</span>
            </div>
        `;

        var status = document.createElement('div');
        status.id = 'pfb-status';
        status.style.cssText = `
            padding: 10px 14px;
            background: #0f172a;
            font-size: 15px;
            color: #94a3b8;
            border-bottom: 1px solid #334155;
        `;

        var body = document.createElement('div');
        body.id = 'pfb-body';
        body.style.cssText = `
            padding: 12px;
            display: flex;
            flex-direction: column;
            gap: 10px;
            overflow-y: auto;
            flex: 1;
            min-height: 0;
        `;

        var tabBar = document.createElement('div');
        tabBar.style.cssText = `
            display: flex;
            gap: 6px;
            border-bottom: 2px solid #334155;
            padding-bottom: 6px;
        `;

        function makeTab(id, label, active) {
            var t = document.createElement('div');
            t.id = 'pfb-tab-' + id;
            t.textContent = label;
            t.style.cssText = `
                padding: 8px 16px;
                cursor: pointer;
                border-radius: 8px;
                font-size: 15px;
                font-weight: bold;
                background: ${active ? '#3b82f6' : 'rgba(255,255,255,0.05)'};
                color: ${active ? 'white' : '#94a3b8'};
                transition: all 0.2s;
                flex: 1;
                text-align: center;
            `;
            return t;
        }

        var tabActions = makeTab('actions', '🛠️ عملیات', true);
        var tabStorage = makeTab('storage', '📦 انبار', false);
        var tabLog = makeTab('log', '📋 گزارش', false);

        tabBar.appendChild(tabActions);
        tabBar.appendChild(tabStorage);
        tabBar.appendChild(tabLog);

        var contentActions = document.createElement('div');
        contentActions.id = 'pfb-content-actions';
        contentActions.style.cssText = 'display:flex;flex-direction:column;gap:10px;';

        var contentStorage = document.createElement('div');
        contentStorage.id = 'pfb-content-storage';
        contentStorage.style.cssText = 'display:none;flex-direction:column;gap:10px;';

        var contentLog = document.createElement('div');
        contentLog.id = 'pfb-content-log';
        contentLog.style.cssText = 'display:none;flex-direction:column;gap:10px;';

        // ===== دکمه‌های عملیات =====
        var btnPaste = document.createElement('button');
        btnPaste.innerHTML = '📤 جاگذاری در فرم سیدا';
        btnPaste.style.cssText = `
            padding: 16px; background: #3b82f6; color: white; border: none;
            border-radius: 10px; cursor: pointer; font-size: 17px; font-weight: bold;
            font-family: inherit;
        `;
        btnPaste.onmouseenter = function () { this.style.background = '#2563eb'; };
        btnPaste.onmouseleave = function () { this.style.background = '#3b82f6'; };

        var btnImportClipboard = document.createElement('button');
        btnImportClipboard.innerHTML = '📥 پیست از کلیپ‌بورد';
        btnImportClipboard.style.cssText = `
            padding: 14px; background: #f59e0b; color: white; border: none;
            border-radius: 10px; cursor: pointer; font-size: 16px; font-weight: bold;
            font-family: inherit;
        `;
        btnImportClipboard.onmouseenter = function () { this.style.background = '#d97706'; };
        btnImportClipboard.onmouseleave = function () { this.style.background = '#f59e0b'; };

        contentActions.appendChild(btnPaste);
        contentActions.appendChild(btnImportClipboard);

        // ===== دکمه‌های انبار =====
        var btnView = document.createElement('button');
        btnView.innerHTML = '📋 مشاهده لیست';
        btnView.style.cssText = `
            padding: 12px; background: #8b5cf6; color: white; border: none;
            border-radius: 8px; cursor: pointer; font-size: 15px; font-weight: bold;
            font-family: inherit;
        `;

        var btnClearAll = document.createElement('button');
        btnClearAll.innerHTML = '🗑️ پاک کردن کل انبار و لیست';
        btnClearAll.style.cssText = `
            padding: 12px; background: #dc2626; color: white; border: none;
            border-radius: 8px; cursor: pointer; font-size: 15px; font-weight: bold;
            font-family: inherit;
        `;

        var searchBox = document.createElement('input');
        searchBox.type = 'text';
        searchBox.placeholder = '🔎 جستجو (کد ملی یا نام)...';
        searchBox.style.cssText = `
            padding: 10px 14px; background: #0f172a; color: #e2e8f0;
            border: 1px solid #334155; border-radius: 8px; font-family: inherit;
            font-size: 15px; direction: rtl; outline: none;
        `;

        var storageList = document.createElement('div');
        storageList.id = 'pfb-storage-list';
        storageList.style.cssText = `
            background: #0f172a; border-radius: 8px; padding: 12px;
            font-size: 15px; line-height: 2;
            color: #cbd5e1; max-height: 400px; min-height: 150px;
            overflow-y: auto; direction: rtl; text-align: right;
            border: 1px solid #334155;
        `;
        storageList.textContent = 'خالی';

        contentStorage.appendChild(searchBox);
        contentStorage.appendChild(btnView);
        contentStorage.appendChild(btnClearAll);
        contentStorage.appendChild(storageList);

        // ===== تب گزارش =====
        var logToolbar = document.createElement('div');
        logToolbar.style.cssText = 'display:flex;gap:6px;';

        var btnCopyLog = document.createElement('button');
        btnCopyLog.innerHTML = '📋 کپی';
        btnCopyLog.style.cssText = `
            flex: 1; padding: 10px; background: #3b82f6; color: white; border: none;
            border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: bold;
            font-family: inherit;
        `;

        var btnWordLog = document.createElement('button');
        btnWordLog.innerHTML = '📄 دانلود Word';
        btnWordLog.style.cssText = `
            flex: 1; padding: 10px; background: #059669; color: white; border: none;
            border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: bold;
            font-family: inherit;
        `;

        var btnClearLog = document.createElement('button');
        btnClearLog.innerHTML = '🗑️';
        btnClearLog.title = 'پاک کردن گزارش';
        btnClearLog.style.cssText = `
            padding: 10px 14px; background: #475569; color: white; border: none;
            border-radius: 8px; cursor: pointer; font-size: 14px; font-family: inherit;
        `;

        logToolbar.appendChild(btnCopyLog);
        logToolbar.appendChild(btnWordLog);
        logToolbar.appendChild(btnClearLog);

        var log = document.createElement('div');
        log.id = 'pfb-log';
        log.style.cssText = `
            background: #0f172a; border-radius: 8px; padding: 12px;
            font-family: Consolas, monospace; font-size: 15px; line-height: 2;
            color: #cbd5e1; max-height: 400px; min-height: 200px;
            overflow-y: auto; white-space: pre-wrap; direction: rtl;
            text-align: right; border: 1px solid #334155;
        `;
        log.textContent = 'گزارش اینجا نمایش داده می‌شود...';

        contentLog.appendChild(logToolbar);
        contentLog.appendChild(log);

        body.appendChild(tabBar);
        body.appendChild(contentActions);
        body.appendChild(contentStorage);
        body.appendChild(contentLog);
        panel.appendChild(header);
        panel.appendChild(status);
        panel.appendChild(body);
        document.body.appendChild(panel);

        function switchTab(id) {
            ['actions', 'storage', 'log'].forEach(function (t) {
                var tab = document.getElementById('pfb-tab-' + t);
                var content = document.getElementById('pfb-content-' + t);
                if (t === id) {
                    tab.style.background = '#3b82f6';
                    tab.style.color = 'white';
                    content.style.display = 'flex';
                } else {
                    tab.style.background = 'rgba(255,255,255,0.05)';
                    tab.style.color = '#94a3b8';
                    content.style.display = 'none';
                }
            });
        }

        tabActions.onclick = function () { switchTab('actions'); };
        tabStorage.onclick = function () { switchTab('storage'); };
        tabLog.onclick = function () { switchTab('log'); };

        // ===== logs تعریف میشه قبل از استفاده =====
        var logs = { paste: [] };

        function renderLog() {
            var html = '';
            if (logs.paste.length) {
                html += '📤 جاگذاری در سیدا:\n';
                html += '───────────────────────\n';
                html += logs.paste.join('\n');
            }
            if (!html) html = 'گزارشی نیست...';
            log.textContent = html;
            log.scrollTop = log.scrollHeight;
        }

        function getLogText() {
            if (logs.paste.length) {
                return '📤 جاگذاری در سیدا:\n───────────────────────\n' + logs.paste.join('\n');
            }
            return 'گزارشی نیست';
        }

        function updateStatus() {
            var c = getStorageCount();
            var type = hasGM() ? 'GM' : 'Cookie';
            status.innerHTML = '🌐 <b style="color:#3b82f6;">سیدا</b> — انبار (' + type + '): <b>' + c + '</b> دانش‌آموز';
        }
        updateStatus();

        function toEn(str) {
            if (str === null || str === undefined || str === '') return str;
            str = String(str);
            return str.replace(/[۰-۹]/g, function (d) {
                return '۰۱۲۳۴۵۶۷۸۹'.indexOf(d);
            }).replace(/\//g, '');
        }

        // ===== دکمه پیست از کلیپ‌بورد =====
        btnImportClipboard.onclick = function () {
            logs.paste = [];
            logs.paste.push('📥 شروع پیست از کلیپ‌بورد...');

            function processText(text) {
                if (!text || text.trim() === '') {
                    logs.paste.push('❌ کلیپ‌بورد خالیه');
                    renderLog();
                    switchTab('log');
                    showToast('کلیپ‌بورد خالیه!', 'error');
                    return;
                }

                var data;
                try {
                    data = JSON.parse(text);
                } catch (e) {
                    logs.paste.push('❌ JSON نامعتبر: ' + e.message);
                    logs.paste.push('👉 اول تو بینا «📋 کپی JSON برای سیدا» رو بزن');
                    renderLog();
                    switchTab('log');
                    showToast('JSON نامعتبر!', 'error');
                    return;
                }

                var keys = Object.keys(data);
                if (keys.length === 0) {
                    logs.paste.push('❌ داده خالیه');
                    renderLog();
                    switchTab('log');
                    showToast('داده خالیه!', 'error');
                    return;
                }

                logs.paste.push('📦 دریافت شد: ' + keys.length + ' دانش‌آموز');

                // ذخیره در localStorage
                try {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
                    logs.paste.push('✅ در localStorage ذخیره شد');
                } catch (e) {
                    logs.paste.push('⚠️ خطا در localStorage: ' + e.message);
                }

                // ذخیره در GM
                if (hasGM()) {
                    try {
                        GM_setValue(STORAGE_KEY, JSON.stringify(data));
                        logs.paste.push('✅ در GM ذخیره شد');
                    } catch (e) {
                        logs.paste.push('⚠️ خطا در GM: ' + e.message);
                    }
                }

                // ذخیره در Cookie (اگه حجم کم باشه)
                try {
                    var encoded = encodeURIComponent(JSON.stringify(data));
                    if (encoded.length <= 4000) {
                        var expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString();
                        document.cookie = COOKIE_NAME + '=' + encoded +
                            '; expires=' + expires + '; path=/; domain=.medu.ir; SameSite=Lax';
                        logs.paste.push('✅ در Cookie ذخیره شد');
                    }
                } catch (e) {}

                // آپدیت UI
                updateStatus();
                renderStorageList('');

                logs.paste.push('');
                logs.paste.push('🎉 تمام! ' + keys.length + ' دانش‌آموز وارد انبار شد');
                renderLog();
                switchTab('log');
                showToast('✅ ' + keys.length + ' دانش‌آموز وارد شد!', 'success');
            }

            // تلاش برای خواندن از کلیپ‌بورد
            if (navigator.clipboard && navigator.clipboard.readText) {
                navigator.clipboard.readText().then(function (text) {
                    processText(text);
                }).catch(function (err) {
                    logs.paste.push('⚠️ clipboard API خطا: ' + err.message);
                    logs.paste.push('👉 از prompt استفاده کن');
                    renderLog();
                    switchTab('log');

                    var text = prompt('JSON رو اینجا پیست کن (Ctrl+V):');
                    if (text) processText(text);
                });
            } else {
                var text = prompt('JSON رو اینجا پیست کن (Ctrl+V):');
                if (text) processText(text);
            }
        };

        function pasteIntoSida() {
            logs.paste = [];

            try {
                var modal = document.querySelector('[uib-modal-window]');
                if (!modal) {
                    logs.paste.push('❌ مودال پیدا نشد');
                    renderLog();
                    showToast('مودال پیدا نشد!', 'error');
                    return;
                }

                var scope = angular.element(modal).scope();
                if (!scope || !scope.model) {
                    logs.paste.push('❌ اسکوپ پیدا نشد');
                    renderLog();
                    showToast('اسکوپ پیدا نشد!', 'error');
                    return;
                }

                var sidaNationalId = toEn(scope.model.nationalCode || scope.model.id);
                if (!sidaNationalId) {
                    logs.paste.push('❌ کد ملی سیدا پیدا نشد');
                    renderLog();
                    showToast('کد ملی سیدا پیدا نشد!', 'error');
                    return;
                }

                logs.paste.push('🔍 کد ملی سیدا: ' + sidaNationalId);

                var data = getFromStorage(sidaNationalId);
                if (!data) {
                    logs.paste.push('❌ اطلاعات این دانش‌آموز در انبار نیست');
                    logs.paste.push('📦 تعداد در انبار: ' + getStorageCount());
                    renderLog();
                    showToast('اطلاعات در انبار نیست!', 'warning');
                    return;
                }

                var studentName = (data.student.firstName || '') + ' ' + (data.student.lastName || '');
                logs.paste.push('✅ ' + studentName);
                logs.paste.push('');

                function setField(field, value, label) {
                    if (value === null || value === undefined || value === '') {
                        logs.paste.push('⏭️ ' + label + ' — خالی');
                        return;
                    }
                    scope.model[field] = value;
                    logs.paste.push('✅ ' + label + ' = ' + value);
                }

                function setCombo(comboName, textValue, label) {
                    if (!textValue) {
                        logs.paste.push('⏭️ ' + label + ' — خالی');
                        return;
                    }
                    var el = modal.querySelector('[name="' + comboName + '"]');
                    if (!el) { logs.paste.push('⚠️ ' + label + ' — پیدا نشد'); return; }

                    var ngEl = el.closest('[ng-model]') || el;
                    var s = angular.element(ngEl).scope();
                    var ngModelAttr = ngEl ? ngEl.getAttribute('ng-model') : null;
                    var fieldName = ngModelAttr ? ngModelAttr.split('.').pop() : null;

                    if (!s || !fieldName) {
                        logs.paste.push('⚠️ ' + label + ' — scope پیدا نشد');
                        return;
                    }

                    var optionsAttr = el.getAttribute('options') || ngEl.getAttribute('options');
                    var optionsArray = null;

                    if (optionsAttr && s[optionsAttr]) {
                        optionsArray = s[optionsAttr];
                    } else {
                        for (var key in s) {
                            if (key.indexOf('comboOption') !== 0) continue;
                            if (!Array.isArray(s[key])) continue;
                            var arr = s[key];
                            for (var i = 0; i < arr.length; i++) {
                                if (arr[i] && arr[i].value && arr[i].value.trim() === textValue.trim()) {
                                    optionsArray = arr;
                                    break;
                                }
                            }
                            if (optionsArray) break;
                        }
                    }

                    if (!optionsArray) {
                        logs.paste.push('⚠️ ' + label + ' — آرایه گزینه‌ها پیدا نشد');
                        return;
                    }

                    var foundKey = null;
                    for (var j = 0; j < optionsArray.length; j++) {
                        if (optionsArray[j] && optionsArray[j].value &&
                            optionsArray[j].value.trim() === textValue.trim()) {
                            foundKey = optionsArray[j].key;
                            break;
                        }
                    }

                    if (foundKey === null) {
                        logs.paste.push('⚠️ ' + label + ' — "' + textValue + '" پیدا نشد');
                        return;
                    }

                    s.$apply(function () {
                        s.model[fieldName] = foundKey;
                    });

                    try {
                        var vi = el.querySelector('input.k-input');
                        if (vi) vi.value = textValue;
                        var hi = el.querySelector('input[data-role="combobox"]');
                        if (hi) hi.value = foundKey;
                    } catch (e) {}

                    logs.paste.push('✅ ' + label + ' = ' + textValue);
                }

                logs.paste.push('📝 مشخصات فردی:');
                scope.$apply(function () {
                    setField('firstName', data.student.firstName, 'نام');
                    setField('lastName', data.student.lastName, 'نام خانوادگی');
                    setField('iDno', data.student.iDno, 'شماره شناسنامه');
                    setField('birthDate', data.student.birthDate, 'تاریخ تولد');
                    setField('birthPlace', data.student.birthPlace, 'محل تولد');
                    setField('issuePlace', data.student.birthPlace, 'محل صدور');
                });

                logs.paste.push('');
                logs.paste.push('📝 والدین:');
                scope.$apply(function () {
                    setField('fatherNationalCode', data.father.nationalId, 'کد ملی پدر');
                    setField('fatherBirthDate', data.father.birthDate, 'تاریخ تولد پدر');
                    setField('fatherMobileNumber', data.father.mobile, 'موبایل پدر');
                    setField('fatherIDno', data.father.iDno, 'شناسنامه پدر');
                    setField('fatherIssuePlace', data.father.birthPlace, 'محل صدور پدر');
                    setField('motherNationalCode', data.mother.nationalId, 'کد ملی مادر');
                    setField('motherBirthDate', data.mother.birthDate, 'تاریخ تولد مادر');
                    setField('motherMobileNumber', data.mother.mobile, 'موبایل مادر');
                });

                logs.paste.push('');
                logs.paste.push('📝 آدرس و تماس:');

                var homePhone = data.contact.landline;
                if (!homePhone || homePhone === '' || homePhone === '—') {
                    homePhone = data.father.mobile;
                    logs.paste.push('  ℹ️ تلفن منزل خالی → موبایل پدر');
                }

                scope.$apply(function () {
                    setField('homeAddress', data.contact.address, 'آدرس');
                    setField('homePostalCode', data.contact.postalCode, 'کد پستی');
                    setField('homeTelephone', homePhone, 'تلفن منزل');
                    setField('studentMobileGoverment', data.contact.mobile, 'موبایل درگاه');
                    setField('studentMobileNumber', data.contact.mobile, 'موبایل شاد');
                    setField('fatherWorkAddress', data.father.workplace, 'آدرس کار پدر');
                    setField('motherWorkAddress', data.mother.workplace, 'آدرس کار مادر');
                });

                logs.paste.push('');
                logs.paste.push('📝 کمبوباکس‌ها:');
                setCombo('جنسیت', data.student.gender, 'جنسیت');
                setCombo('ملیت', 'ایران', 'ملیت');
                setCombo('ملیت پدر', 'ایران', 'ملیت پدر');
                setCombo('ملیت مادر', 'ایران', 'ملیت مادر');
                setCombo('مدرک تحصیلی پدر', data.father.education, 'مدرک پدر');
                setCombo('مدرک تحصیلی مادر', data.mother.education, 'مدرک مادر');
                setCombo('شغل پدر', data.father.occupation, 'شغل پدر');
                setCombo('شغل مادر', data.mother.occupation, 'شغل مادر');

                logs.paste.push('');
                logs.paste.push('📝 اطلاعات تکمیلی:');

                var tabs = modal.querySelectorAll('.nav-tabs a');
                var targetTab = null;
                for (var t = 0; t < tabs.length; t++) {
                    if (tabs[t].textContent.trim() === 'اطلاعات تکمیلی') {
                        targetTab = tabs[t];
                        break;
                    }
                }

                function finalize() {
                    scope.$apply();

                    deleteFromStorage(sidaNationalId);
                    updateStatus();

                    logs.paste.push('');
                    logs.paste.push('✅ تکمیل شد و از انبار حذف شد');
                    renderLog();
                    showToast('انجام شد', 'success');
                }

                if (targetTab) {
                    targetTab.click();
                    setTimeout(function () {
                        setCombo('نوع موجودیت دانش آموز', 'عادی', 'نوع موجودیت');
                        setCombo('دین', 'مسلمان', 'دین');
                        setCombo('مذهب', 'تشیع', 'مذهب');
                        setTimeout(finalize, 200);
                    }, 800);
                } else {
                    finalize();
                }

            } catch (e) {
                logs.paste.push('❌ خطا: ' + e.message);
                renderLog();
                showToast('خطا: ' + e.message, 'error');
                console.error(e);
            }
        }

        function renderStorageList(filter) {
            var s = getStorage();
            var keys = Object.keys(s);

            if (filter) {
                filter = filter.trim().toLowerCase();
                keys = keys.filter(function (k) {
                    var item = s[k];
                    var d = (item.data || item).student || {};
                    var name = ((d.firstName || '') + ' ' + (d.lastName || '')).toLowerCase();
                    return k.indexOf(filter) > -1 || name.indexOf(filter) > -1;
                });
            }

            if (keys.length === 0) {
                storageList.innerHTML = '<div style="color:#64748b;text-align:center;padding:20px;font-size:15px;">خالی</div>';
                return;
            }

            var html = '';
            keys.forEach(function (k) {
                var item = s[k];
                var d = (item.data || item).student || {};
                var name = (d.firstName || '?') + ' ' + (d.lastName || '?');

                html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 12px;margin-bottom:6px;background:#1e293b;border-radius:8px;border-right:4px solid #764ba2;">';
                html += '<div>';
                html += '<div style="font-size:15px;font-weight:bold;color:#e2e8f0;">' + name + '</div>';
                html += '<div style="font-size:13px;color:#94a3b8;">کد ملی: ' + k + '</div>';
                html += '</div>';
                html += '<button class="pfb-delete-btn" data-key="' + k + '" style="background:#dc2626;color:white;border:none;border-radius:6px;padding:6px 12px;cursor:pointer;font-size:13px;font-family:inherit;">🗑️ حذف</button>';
                html += '</div>';
            });

            storageList.innerHTML = html;

            storageList.querySelectorAll('.pfb-delete-btn').forEach(function (btn) {
                btn.onclick = function () {
                    var key = this.getAttribute('data-key');
                    if (confirm('حذف دانش‌آموز با کد ملی ' + key + '؟')) {
                        deleteFromStorage(key);
                        updateStatus();
                        renderStorageList(searchBox.value);
                        showToast('حذف شد', 'success');
                    }
                };
            });
        }

        btnPaste.onclick = pasteIntoSida;

        btnView.onclick = function () {
            renderStorageList('');
            searchBox.value = '';
        };

        btnClearAll.onclick = function () {
            if (confirm('⚠️ کل انبار و لیست دانش‌آموزان پاک بشه؟ این عمل برگشت‌پذیر نیست!')) {
                clearStorage();
                clearStudentList();
                updateStatus();
                renderStorageList('');
                showToast('انبار و لیست پاک شد', 'success');
            }
        };

        btnClearLog.onclick = function () {
            logs.paste = [];
            renderLog();
            showToast('گزارش پاک شد', 'info');
        };

        btnCopyLog.onclick = function () {
            copyLogToClipboard(getLogText());
        };

        btnWordLog.onclick = function () {
            exportLogToWord(logs.paste);
            showToast('Word دانلود شد', 'success');
        };

        searchBox.oninput = function () {
            renderStorageList(this.value);
        };

        var isMinimized = false;

        document.getElementById('pfb-min').onclick = function (e) {
            e.stopPropagation();
            isMinimized = !isMinimized;
            if (isMinimized) {
                body.style.display = 'none';
                status.style.display = 'none';
                panel.style.width = '280px';
                this.textContent = '➕';
            } else {
                body.style.display = 'flex';
                status.style.display = 'block';
                panel.style.width = '460px';
                this.textContent = '➖';
            }
        };

        document.getElementById('pfb-reset').onclick = function (e) {
            e.stopPropagation();
            logs.paste = [];
            renderLog();
            switchTab('actions');
            if (isMinimized) {
                body.style.display = 'flex';
                status.style.display = 'block';
                panel.style.width = '460px';
                document.getElementById('pfb-min').textContent = '➖';
                isMinimized = false;
            }
            panel.style.left = '10px';
            panel.style.top = '10px';
            panel.style.right = 'auto';
            panel.style.bottom = 'auto';
            showToast('پنل ریست شد', 'info');
        };

        document.getElementById('pfb-close').onclick = function (e) {
            e.stopPropagation();
            panel.remove();
        };

        // درگ پنل
        var isDragging = false;
        var dragOffsetX = 0;
        var dragOffsetY = 0;

        header.addEventListener('mousedown', function (e) {
            if (e.target.id === 'pfb-min' || e.target.id === 'pfb-reset' || e.target.id === 'pfb-close') {
                return;
            }
            if (e.button !== 0) return;

            isDragging = true;
            var rect = panel.getBoundingClientRect();
            dragOffsetX = e.clientX - rect.left;
            dragOffsetY = e.clientY - rect.top;

            panel.style.right = 'auto';
            panel.style.bottom = 'auto';
            document.body.style.userSelect = 'none';
            e.preventDefault();
        });

        document.addEventListener('mousemove', function (e) {
            if (!isDragging) return;

            var newLeft = e.clientX - dragOffsetX;
            var newTop = e.clientY - dragOffsetY;

            var maxX = window.innerWidth - panel.offsetWidth;
            var maxY = window.innerHeight - panel.offsetHeight;
            newLeft = Math.max(0, Math.min(newLeft, maxX));
            newTop = Math.max(0, Math.min(newTop, maxY));

            panel.style.left = newLeft + 'px';
            panel.style.top = newTop + 'px';
        });

        document.addEventListener('mouseup', function () {
            if (isDragging) {
                isDragging = false;
                document.body.style.userSelect = '';
            }
        });

        switchTab('actions');
    }
    createDashboard();
    setInterval(createDashboard, 2000);
})();

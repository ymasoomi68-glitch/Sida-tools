// ==UserScript==
// @name         📱 داشبورد موبایل ابزارهای سیدا
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  نسخه موبایل داشبورد ۱۴ ابزار سیدا
// @author       You
// @match        https://sida.medu.ir/*
// @grant        GM_getValue
// @grant        GM_setValue
// @require      https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js
// @require      https://cdn.jsdelivr.net/npm/html-to-image@1.11.11/dist/html-to-image.min.js
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    // ==================== مختصات پیش‌فرض ====================
    const DEFAULT_X = 10;
    const DEFAULT_Y = 10;

    // ==================== تابع پاک‌سازی ====================
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
            if (panel) panel.remove();
        });
        
        const overlays = document.querySelectorAll('#gradeReportOverlay, #nationalityReportOverlay, #reportContainer');
        overlays.forEach(overlay => overlay.remove());
    }

    // ==================== تابع جابه‌جایی لمسی ====================
    function makeDraggableByTouch(element, handle) {
        let isDragging = false;
        let startX, startY, offsetX, offsetY;

        handle.addEventListener('touchstart', (e) => {
            isDragging = true;
            const touch = e.touches[0];
            startX = touch.clientX;
            startY = touch.clientY;
            offsetX = startX - element.getBoundingClientRect().left;
            offsetY = startY - element.getBoundingClientRect().top;
            handle.style.cursor = 'grabbing';
        }, { passive: false });

        document.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            const touch = e.touches[0];
            const deltaX = touch.clientX - startX;
            const deltaY = touch.clientY - startY;
            
            if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
                e.preventDefault();
                element.style.left = (touch.clientX - offsetX) + 'px';
                element.style.top = (touch.clientY - offsetY) + 'px';
                element.style.right = 'auto';
                element.style.bottom = 'auto';
            }
        }, { passive: false });

        document.addEventListener('touchend', () => {
            if (isDragging) {
                isDragging = false;
                handle.style.cursor = '';
            }
        });
    }

    function createMobileDashboard() {
        if (document.getElementById('mobile-dashboard')) return;

        const wrapper = document.createElement('div');
        wrapper.id = 'mobile-dashboard';

        const savedX = GM_getValue('mobile_dash_x', DEFAULT_X);
        const savedY = GM_getValue('mobile_dash_y', DEFAULT_Y);

        wrapper.style.cssText = `
            position: fixed;
            left: ${savedX}px;
            top: ${savedY}px;
            z-index: 999999;
            direction: rtl;
            font-family: Tahoma, Arial, sans-serif;
            touch-action: none;
            -webkit-user-select: none;
            user-select: none;
        `;

        wrapper.innerHTML = `
            <button id="mobile-toggle-btn" style="
                display: block;
                width: 220px;
                background: #2c3e50;
                color: white;
                border: none;
                padding: 14px 16px;
                border-radius: 12px;
                cursor: pointer;
                font-size: 16px;
                font-weight: bold;
                box-shadow: 0 4px 15px rgba(0,0,0,0.4);
                transition: all 0.25s ease;
                font-family: Tahoma, Arial, sans-serif;
                -webkit-tap-highlight-color: transparent;
                user-select: none;
                touch-action: manipulation;
            ">
                🛠️ ابزارها
            </button>

            <div id="mobile-drawer" style="
                background: #2c3e50;
                color: white;
                border-radius: 12px;
                width: 220px;
                box-shadow: 0 4px 15px rgba(0,0,0,0.4);
                overflow: hidden;
                transition: max-height 0.3s ease, opacity 0.3s ease, margin-top 0.3s ease;
                max-height: 0;
                opacity: 0;
                margin-top: 0;
            ">
                <div style="
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 12px 14px;
                    background: #34495e;
                ">
                    <strong style="font-size: 16px;">🛠️ ابزارهای سیدا</strong>
                    <span id="mobile-close-drawer" style="cursor: pointer; color: #e74c3c; font-weight: bold; font-size: 18px;">✖</span>
                </div>
                <div id="mobile-tools-list" style="
                    display: flex;
                    flex-direction: column;
                    gap: 5px;
                    padding: 8px;
                    max-height: 60vh;
                    overflow-y: auto;
                    -webkit-overflow-scrolling: touch;
                "></div>
                <div style="
                    padding: 10px;
                    font-size: 14px;
                    color: #00FF00;
                    border-top: 1px solid #445;
                    text-align: center;
                ">طراح: یوسف معصومی</div>
            </div>
        `;

        document.body.appendChild(wrapper);

        const toggleBtn = document.getElementById('mobile-toggle-btn');
        const drawer = document.getElementById('mobile-drawer');
        const closeDrawerBtn = document.getElementById('mobile-close-drawer');
        const toolsList = document.getElementById('mobile-tools-list');

        // ==================== لیست ۱۴ ابزار ====================
        const allTools = [
            { name: '🗜️ فشرده‌سازی کارنامه', color: '#f5a623', action: () => compressReportCard() },
            { name: '🖨️ چاپ گروهی هوشمند', color: '#3498db', action: () => smartGroupPrint() },
            { name: '📋 ساخت دفترچه تماس', color: '#10b981', action: () => contactBookExtractor() },
            { name: '📸 آپلود خودکار عکس', color: '#3ecfe0', action: () => photoUploadTool() },
            { name: '📋 جمع‌آوری و ارتقاء', color: '#6c8cff', action: () => collectAndPromote() },
            { name: '📚 چاپ دفتر نتایج', color: '#f5a623', action: () => printReportCard() },
            { name: '📸 استخراج عکس', color: '#3b82f6', action: () => photoExtractTool() },
            { name: '📋 جمع‌آوری و تخصیص', color: '#0f4c81', action: () => collectAssignTool() },
            { name: '🔓 آزادسازی', color: '#0f4c81', action: () => freeStudentTool() },
            { name: '📋 استخراج لیست کلاسی', color: '#3ecfe0', action: () => extractClassListTool() },
            { name: '📋 استخراج مشخصات', color: '#8b5cf6', action: () => smartInfoExtractTool() },
            { name: '📊 تحلیل نمرات', color: '#4472C4', action: () => gradeAnalysisTool() },
            { name: '📝 ثبت نمرات توصیفی', color: '#0f4c81', action: () => gradeRegisterTool() },
            { name: '🔍 بررسی ملیت والدین', color: '#f59e0b', action: () => nationalityCheckTool() }
        ];

        allTools.forEach(tool => {
            const btn = document.createElement('button');
            btn.innerHTML = tool.name;
            btn.style.cssText = `
                background: ${tool.color};
                color: white;
                border: none;
                padding: 12px;
                border-radius: 8px;
                cursor: pointer;
                font-size: 14px;
                font-weight: bold;
                transition: all 0.2s ease;
                font-family: Tahoma, Arial, sans-serif;
                -webkit-tap-highlight-color: transparent;
                user-select: none;
                touch-action: manipulation;
                text-align: center;
                box-shadow: 0 2px 5px rgba(0,0,0,0.15);
            `;
            
            btn.addEventListener('touchstart', () => {
                btn.style.filter = 'brightness(1.2)';
                btn.style.transform = 'scale(0.97)';
            });
            
            btn.addEventListener('touchend', () => {
                btn.style.filter = 'brightness(1)';
                btn.style.transform = 'scale(1)';
            });
            
            btn.addEventListener('click', () => {
                closeDrawer();
                tool.action();
            });
            
            toolsList.appendChild(btn);
        });

        // ==================== باز و بسته شدن ====================
        function openDrawer() {
            drawer.style.maxHeight = '80vh';
            drawer.style.opacity = '1';
            drawer.style.marginTop = '8px';
        }

        function closeDrawer() {
            drawer.style.maxHeight = '0';
            drawer.style.opacity = '0';
            drawer.style.marginTop = '0';
        }

        toggleBtn.addEventListener('click', () => {
            if (drawer.style.maxHeight === '0px' || drawer.style.maxHeight === '') {
                openDrawer();
            } else {
                closeDrawer();
            }
        });

        closeDrawerBtn.addEventListener('click', closeDrawer);

        // ==================== جابه‌جایی داشبورد ====================
        makeDraggableByTouch(wrapper, toggleBtn);

        // ==================== ذخیره موقعیت بعد از جابه‌جایی ====================
        document.addEventListener('touchend', () => {
            const rect = wrapper.getBoundingClientRect();
            if (rect.left > 0 && rect.top > 0) {
                GM_setValue('mobile_dash_x', Math.round(rect.left));
                GM_setValue('mobile_dash_y', Math.round(rect.top));
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
              // ==================== ابزار ۳: ساخت دفترچه تماس (رسپانسیو) ====================
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
        let gradeColIndex = null;
        let failedCodemelli = new Set();
        let columnMapCache = null;

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
                return { name: s.name, family: s.family, father: s.father, codemelli: s.codemelli, birthDate: s.birthDate, grade: s.grade, photoUrl: s.photoUrl, fatherPhone: s.fatherPhone, motherPhone: s.motherPhone, shadPhone: s.shadPhone };
            });
            try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(metadata)); }
            catch (err) { showNotification('حافظه sessionStorage پر شد.'); }
        }

        function loadMetadata() {
            try {
                var data = sessionStorage.getItem(STORAGE_KEY);
                if (data) { allStudents = JSON.parse(data).map(function(m) { return Object.assign({}, m, { photo: '' }); }); }
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
                    sessionStorage.removeItem(STORAGE_KEY);
                    var db = await openDB();
                    var tx = db.transaction('photos', 'readwrite');
                    tx.objectStore('photos').clear();
                    await new Promise(function(resolve, reject) { tx.oncomplete = resolve; tx.onerror = reject; });
                    db.close();
                    allStudents = [];
                    failedCodemelli.clear();
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

        function getColumnMap() {
            if (columnMapCache) return columnMapCache;
            var ths = document.querySelectorAll('table thead th');
            var map = { name: -1, family: -1, father: -1, codemelli: -1, birthDate: -1, grade: -1 };

            function textOf(th) {
                var link = th.querySelector('a.k-link');
                return ((link ? link.textContent : th.textContent) || '').trim();
            }

            for (var i = 0; i < ths.length; i++) {
                var t = textOf(ths[i]);
                if (!t) continue;
                if (t.includes('کد ملی') || t.includes('کدملی')) {
                    map.codemelli = i;
                } else if (t.includes('نام خانوادگی') || t.includes('نام‌خانوادگی')) {
                    map.family = i;
                } else if (t.includes('نام پدر') || t.includes('نام‌پدر')) {
                    map.father = i;
                } else if (t.includes('تاریخ تولد') || t.includes('تاریخ')) {
                    map.birthDate = i;
                } else if (t === 'پایه' || t.includes('پایه')) {
                    map.grade = i;
                } else if (t === 'نام') {
                    map.name = i;
                }
            }

            if (map.name === -1) {
                for (var j = 0; j < ths.length; j++) {
                    var tj = textOf(ths[j]);
                    if (tj && tj.includes('نام') && !tj.includes('خانوادگی')) {
                        map.name = j;
                        break;
                    }
                }
            }

            columnMapCache = map;
            return map;
        }

        function getStudentPhotoSrc(row) {
            var imgs = row.querySelectorAll('img');
            if (!imgs.length) return '';
            for (var i = 0; i < imgs.length; i++) {
                var img = imgs[i];
                var w = img.naturalWidth || img.width || 0;
                var h = img.naturalHeight || img.height || 0;
                var src = img.src || '';
                if ((w > 30 || h > 30) && !/icon|delete|edit|add|btn|close/i.test(src)) {
                    return src;
                }
            }
            return imgs[0].src || '';
        }

        function getNextUnprocessedStudent() {
            var col = getColumnMap();
            if (col.grade !== -1) gradeColIndex = col.grade;

            var rows = document.querySelectorAll('table tbody tr');
            for (var i = 0; i < rows.length; i++) {
                var row = rows[i];
                var cols = row.querySelectorAll('td');
                if (cols.length >= 6) {
                    function read(key, fallbackIdx) {
                        var idx = (col[key] !== undefined && col[key] !== -1) ? col[key] : fallbackIdx;
                        return (cols[idx] && cols[idx].textContent) ? cols[idx].textContent.trim() : '';
                    }

                    var codemelli = read('codemelli', 2);
                    var name = read('name', 3);
                    var family = read('family', 4);
                    var father = read('father', 5);
                    var birthDate = read('birthDate', 6);
                    var grade = (col.grade !== -1 && cols[col.grade] && cols[col.grade].textContent) ? cols[col.grade].textContent.trim() : (gradeColIndex !== null && cols[gradeColIndex] ? cols[gradeColIndex].textContent.trim() : '');

                    var imgSrc = getStudentPhotoSrc(row);

                    if (codemelli && !allStudents.some(function(s) { return s.codemelli === codemelli; }) && !failedCodemelli.has(codemelli)) {
                        return { row: row, codemelli: codemelli, name: name, family: family, father: father, birthDate: birthDate, grade: grade, imgSrc: imgSrc };
                    }
                }
            }
            return null;
        }

        function closeActiveModal() {
            var closeSelectors = [
                'button.k-window-close',
                'a.k-window-close',
                'button.close',
                'button[aria-label="Close"]',
                '.k-window .k-button.k-grid-cancel',
                'button[ng-click*="cancel"]',
                'a[ng-click*="cancel"]'
            ];
            for (var s = 0; s < closeSelectors.length; s++) {
                var el = document.querySelector(closeSelectors[s]);
                if (el) { el.click(); return true; }
            }

            var all = Array.from(document.querySelectorAll('button, a, span'));
            var cancelBtn = all.find(function(el) {
                var txt = (el.textContent || '').trim();
                return txt === 'انصراف' || txt === 'بستن' || txt === 'لغو' || txt === 'خروج';
            });
            if (cancelBtn) { cancelBtn.click(); return true; }

            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', keyCode: 27, which: 27, bubbles: true }));
            return false;
        }

        async function imageToBase64Compressed(url, maxSize) {
            maxSize = maxSize || 220;
            return new Promise(async function(resolve) {
                if (!url) { resolve(''); return; }
                abortController = new AbortController();
                try {
                    var response = await fetch(url, { credentials: 'include', signal: abortController.signal });
                    if (!response.ok) throw new Error('HTTP ' + response.status);
                    var blob = await response.blob();
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
                        } catch (err) { URL.revokeObjectURL(objectUrl); resolve(''); }
                    };
                    img.onerror = function() { URL.revokeObjectURL(objectUrl); resolve(''); };
                    img.src = objectUrl;
                } catch (err) { resolve(''); }
            });
        }

        async function processNextStudent() {
            if (!isRunning) return;

            var student = getNextUnprocessedStudent();
            if (!student) { await goToNextPage(); return; }

            updatePanelUI('در حال پردازش: ' + student.name + ' ' + student.family);

            try {
                var editBtn = student.row.querySelector('a.k-grid-edit, button.k-grid-edit, a[ng-click*="edit"]');
                if (!editBtn) throw new Error('دکمه ویرایش یافت نشد');
                editBtn.click();
                await sleep(2000);
                if (!isRunning) return;

                var tabSelectors = ['a.nav-link', 'a[ng-click*="select"]', 'button[ng-click*="select"]', '.nav-tabs a', '.k-tabstrip .k-item'];
                for (var sel of tabSelectors) {
                    var tabs = Array.from(document.querySelectorAll(sel));
                    var parentTab = tabs.find(function(el) {
                        var text = el.textContent || '';
                        return text.includes('والدین') || text.includes('اولیا') || text.includes('آدرس و تماس') || text.includes('تماس');
                    });
                    if (parentTab) { parentTab.click(); await sleep(1500); if (!isRunning) return; break; }
                }

                var fatherPhone = '', motherPhone = '', shadPhone = '';
                var phoneFields = [
                    ['fatherMobileNumber', function(v) { fatherPhone = v; }],
                    ['motherMobileNumber', function(v) { motherPhone = v; }],
                    ['studentMobileNumber', function(v) { shadPhone = v; }]
                ];

                for (var pf = 0; pf < phoneFields.length; pf++) {
                    var found = false;
                    for (var attempt = 0; attempt < 3; attempt++) {
                        var input = document.getElementById(phoneFields[pf][0]);
                        if (input) {
                            phoneFields[pf][1]((input.value || '').trim().replace(/[^\d]/g, ''));
                            found = true;
                            break;
                        }
                        await sleep(500);
                    }
                    if (!found && !isRunning) return;
                }
                if (!isRunning) return;

                updatePanelUI('در حال ذخیره عکس: ' + student.name + ' ' + student.family);
                var imgBase64 = await imageToBase64Compressed(student.imgSrc);
                if (!isRunning) return;

                var studentData = {
                    name: student.name,
                    family: student.family,
                    father: student.father,
                    codemelli: student.codemelli,
                    birthDate: student.birthDate,
                    grade: student.grade,
                    photoUrl: student.imgSrc,
                    fatherPhone: fatherPhone,
                    motherPhone: motherPhone,
                    shadPhone: shadPhone,
                    photo: imgBase64
                };

                allStudents.push(studentData);
                saveMetadata();
                if (imgBase64) await savePhotoToDB(student.codemelli, imgBase64);

                closeActiveModal();
                await sleep(2000);
                if (isRunning) setTimeout(function() { processNextStudent(); }, 0);

            } catch (err) {
                console.error('خطا:', err);
                if (student && student.codemelli) failedCodemelli.add(student.codemelli);
                try { closeActiveModal(); } catch (e) {}
                await sleep(2000);
                if (isRunning) setTimeout(function() { processNextStudent(); }, 0);
            }
        }

        async function goToNextPage() {
            if (!isRunning) return;
            updatePanelUI('در حال رفتن به صفحه بعد...');
            var nextBtnSelectors = [
                'a.k-pager-next:not(.k-state-disabled):not(.disabled)',
                '.k-pager-wrap a[title="صفحه بعد"]',
                'a[title="صفحه بعد"]:not(.disabled)',
                'a[title="بعدی"]:not(.disabled)'
            ];
            var nextBtn = null;
            for (var s = 0; s < nextBtnSelectors.length; s++) {
                nextBtn = document.querySelector(nextBtnSelectors[s]);
                if (nextBtn) break;
            }
            if (nextBtn && !nextBtn.classList.contains('k-state-disabled') && !nextBtn.classList.contains('disabled')) {
                nextBtn.click();
                await sleep(3500);
                if (isRunning) setTimeout(function() { processNextStudent(); }, 0);
            } else {
                isRunning = false;
                updatePanelUI('✅ پایان کار');
                showNotification('استخراج پایان یافت! مجموع: ' + allStudents.length.toLocaleString('fa-IR') + ' دانش‌آموز.', 0);
            }
        }

        async function downloadHTML() {
            if (allStudents.length === 0) { alert('هیچ داده‌ای برای دانلود وجود ندارد!'); return; }
            showNotification('در حال ساخت فایل HTML...');

            for (var i = 0; i < allStudents.length; i++) {
                var student = allStudents[i];
                if (!student.photo) student.photo = await getPhotoFromDB(student.codemelli);
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
@media(max-width:768px){
.topbar{padding:0 8px;height:auto;min-height:50px;flex-wrap:wrap;gap:5px}
.search-wrap{min-width:100%;order:1}
.nav-row{justify-content:center;order:2;width:100%}
.page{top:60px;padding:5px 5px 10px;gap:5px}
.row-header{padding:6px 8px;gap:5px;flex-direction:row;align-items:center}
.photo-box{width:60px;height:60px;font-size:25px;min-width:60px;min-height:60px}
.student-fullname{font-size:16px;white-space:normal;line-height:1.3}
.student-index{font-size:9px}
.row-info{grid-template-columns:1fr;gap:4px}
.info-cell{padding:6px 8px;gap:6px}
.info-cell-icon{font-size:18px}
.info-cell-label{font-size:9px}
.info-cell-value{font-size:13px}
.row-contact{grid-template-columns:1fr!important;gap:4px;overflow-y:auto}
.phone-card{flex-direction:row;justify-content:flex-start;padding:6px 10px;gap:8px;min-height:auto}
.phone-icon{font-size:20px}
.phone-type{font-size:12px}
.phone-number{font-size:24px;letter-spacing:1px}
.empty-contact{font-size:13px;padding:10px}
.modal-box{width:95%;padding:15px}
.modal-form{grid-template-columns:1fr}
}
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
var touchStartX = 0, touchStartY = 0;
document.addEventListener("touchstart",function(e){if(document.activeElement===document.getElementById("searchInput"))return;touchStartX=e.touches[0].clientX;touchStartY=e.touches[0].clientY;},{passive:true});
document.addEventListener("touchend",function(e){if(document.activeElement===document.getElementById("searchInput"))return;var deltaX=e.changedTouches[0].clientX-touchStartX;var deltaY=e.changedTouches[0].clientY-touchStartY;if(Math.abs(deltaX)>50&&Math.abs(deltaX)>Math.abs(deltaY)){if(deltaX<0){navigate(1)}else if(deltaX>0){navigate(-1)}}else if(Math.abs(deltaY)>50&&Math.abs(deltaY)>Math.abs(deltaX)){if(deltaY<0){navigate(1)}else if(deltaY>0){navigate(-1)}}},{passive:true});
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
            panel.style.cssText = 'position:fixed;top:20px;left:20px;background:white;border:2px solid #0f4c81;border-radius:10px;padding:15px;width:320px;max-width:90vw;z-index:999999;box-shadow:0 4px 20px rgba(0,0,0,0.2);font-family:Tahoma,sans-serif;direction:rtl;font-size:13px;color:#333;';
            panel.innerHTML = '<div id="aeHeader" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;padding-bottom:10px;border-bottom:2px solid #0f4c81;user-select:none;"><strong style="color:#0f4c81;font-size:15px;">📋 استخراج کامل + عکس</strong><button id="btnClose" style="background:none;border:none;cursor:pointer;font-size:18px;color:#999;">✕</button></div><div style="background:#f0f6ff;padding:12px;border-radius:8px;margin-bottom:12px;text-align:center;"><div style="font-size:12px;color:#666;">تعداد دانش‌آموزان استخراج‌شده:</div><div id="aeTotal" style="font-size:28px;font-weight:bold;color:#0f4c81;">0</div><div id="aeStatus" style="font-size:11px;color:#666;margin-top:5px;">آماده شروع...</div></div><div style="display:flex;flex-direction:column;gap:8px;"><div style="display:flex;gap:8px;"><button id="btnStart" style="flex:1;background:#0f4c81;color:white;border:none;padding:10px;border-radius:6px;cursor:pointer;font-family:inherit;font-weight:bold;">▶️ شروع</button><button id="btnStop" style="flex:1;background:#ef4444;color:white;border:none;padding:10px;border-radius:6px;cursor:pointer;font-family:inherit;font-weight:bold;">⛔ توقف</button></div><button id="btnDownload" style="background:#10b981;color:white;border:none;padding:10px;border-radius:6px;cursor:pointer;font-family:inherit;font-weight:bold;">📥 دانلود فایل HTML نهایی</button><button id="btnClear" style="background:#fff;color:#c62828;border:1px solid #c62828;padding:8px;border-radius:6px;cursor:pointer;font-family:inherit;font-size:12px;margin-top:5px;">🗑️ پاک‌سازی حافظه</button></div><div style="margin-top:10px;font-size:11px;color:#666;text-align:center;border-top:1px solid #eee;padding-top:8px;">⚠️ هنگام اجرا، تب مرورگر را فعال نگه دارید.</div>';
            document.body.appendChild(panel);
            makeDraggable(panel, document.getElementById('aeHeader'));
            makeDraggableByTouch(panel, document.getElementById('aeHeader'));
            document.getElementById('btnClose').addEventListener('click', function() { panel.remove(); });
            document.getElementById('btnStart').addEventListener('click', function() {
                if (isRunning) { showNotification('عملیات در حال انجام است...'); return; }
                isRunning = true;
                showNotification('شروع استخراج.');
                setTimeout(function() { processNextStudent(); }, 0);
            });
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
            panel.style.cssText = 'position:fixed;top:20px;left:20px;background:#1a1a2e;border:2px solid #3ecfe0;border-radius:12px;padding:16px 18px;width:340px;max-width:90vw;z-index:999999;box-shadow:0 4px 20px rgba(0,0,0,0.4);font-family:Tahoma,sans-serif;direction:rtl;font-size:13px;color:#e8e8f0;';
            panel.innerHTML = '<div id="uploadHeader" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;padding-bottom:10px;border-bottom:2px solid #3ecfe0;user-select:none;cursor:move;"><strong style="color:#3ecfe0;font-size:15px;">📸 آپلود خودکار عکس</strong><button id="btnClose" style="background:none;border:none;cursor:pointer;font-size:18px;color:#999;">✕</button></div><div style="background:#0f1117;padding:12px;border-radius:8px;margin-bottom:12px;text-align:center;"><div style="font-size:12px;color:#888899;">وضعیت:</div><div id="uploadStatus" style="font-size:14px;color:#3ecfe0;margin-top:4px;">آماده شروع</div><div style="display:flex;justify-content:space-around;margin-top:10px;"><div><div style="font-size:10px;color:#888899;">کل بدون عکس</div><div id="totalStudents" style="font-size:20px;font-weight:bold;color:#3ecf8e;">0</div></div><div><div style="font-size:10px;color:#888899;">آپلود شده</div><div id="processedStudents" style="font-size:20px;font-weight:bold;color:#f59e0b;">0</div></div><div><div style="font-size:10px;color:#888899;">صرف‌نظر</div><div id="skippedStudents" style="font-size:20px;font-weight:bold;color:#ff6b81;">0</div></div></div><div id="currentStudent" style="font-size:11px;color:#888899;margin-top:8px;">---</div></div><div style="display:flex;flex-direction:column;gap:8px;"><button id="btnStart" style="background:#3b82f6;color:white;border:none;padding:10px;border-radius:6px;cursor:pointer;font-family:inherit;font-weight:bold;">📁 انتخاب پوشه و شروع</button><div style="display:flex;gap:8px;"><button id="btnPause" style="display:none;flex:1;background:#f59e0b;color:#0f1117;border:none;padding:10px;border-radius:6px;cursor:pointer;font-family:inherit;font-weight:bold;">⏸️ مکث</button><button id="btnStop" style="flex:1;background:#ef4444;color:white;border:none;padding:10px;border-radius:6px;cursor:pointer;font-family:inherit;font-weight:bold;">⛔ توقف</button></div><button id="btnReset" style="background:transparent;color:#888899;border:1px solid #2a2d42;padding:8px;border-radius:6px;cursor:pointer;font-family:inherit;font-size:12px;margin-top:5px;">🔄 ریست</button></div><div style="margin-top:10px;font-size:11px;color:#555577;text-align:center;border-top:1px solid #2a2d42;padding-top:8px;">⚠️ هنگام اجرا، تب مرورگر را فعال نگه دارید.</div>';
            document.body.appendChild(panel);

            var header = document.getElementById('uploadHeader');
            makeDraggableByTouch(panel, header);
            
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
            container.style.cssText='position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);width:90%;max-width:700px;max-height:85vh;z-index:9999999;background:#1a1d2e;color:#e8e8f0;border:2px solid #3ecfe0;border-radius:12px;padding:20px;font-family:Tahoma,sans-serif;font-size:13px;direction:rtl;display:flex;flex-direction:column;';
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
                    label.style.cssText='color:#e8e8f0;font-size:14px;line-height:1.8;';
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
            p.style.cssText='position:fixed;top:20px;left:20px;background:#1a1d2e;border:2px solid #3ecfe0;border-radius:12px;padding:16px 18px;width:340px;max-width:90vw;z-index:999999;box-shadow:0 4px 20px rgba(0,0,0,0.4);font-family:Tahoma,sans-serif;direction:rtl;font-size:13px;color:#e8e8f0;';
            p.innerHTML='<div id="collectHeader" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;padding-bottom:10px;border-bottom:2px solid #3ecfe0;user-select:none;cursor:move;"><strong style="color:#3ecfe0;font-size:15px;">📋 جمع‌آوری و ارتقاء</strong><button id="btnClose" style="background:none;border:none;cursor:pointer;font-size:18px;color:#888;">✕</button></div><div style="background:#0f1117;padding:12px;border-radius:8px;margin-bottom:12px;text-align:center;"><div style="font-size:12px;color:#888;">تعداد دانش‌آموزان:</div><div id="studentCount" style="font-size:28px;font-weight:bold;color:#3ecfe0;">0</div><div id="collectStatus" style="font-size:11px;color:#888;margin-top:5px;">آماده</div></div><div style="display:flex;flex-direction:column;gap:8px;"><div style="display:flex;gap:8px;"><button id="btnCollect" style="flex:1;background:#3ecfe0;color:#0f1117;border:none;padding:10px;border-radius:6px;cursor:pointer;font-family:inherit;font-weight:bold;">📊 جمع‌آوری</button><button id="btnProcess" style="flex:1;background:#f59e0b;color:#0f1117;border:none;padding:10px;border-radius:6px;cursor:pointer;font-family:inherit;font-weight:bold;">🔄 ارتقاء</button></div><div style="display:flex;gap:8px;"><button id="btnReset" style="flex:1;background:#6c8cff;color:#0f1117;border:none;padding:10px;border-radius:6px;cursor:pointer;font-family:inherit;font-weight:bold;">🔄 ریست</button><button id="btnStop" style="flex:1;background:#6b7280;color:white;border:none;padding:10px;border-radius:6px;cursor:pointer;font-family:inherit;font-weight:bold;">⏹️ توقف</button></div><div style="display:flex;gap:8px;"><button id="btnReportCollect" style="flex:1;background:#6c8cff;color:#0f1117;border:none;padding:10px;border-radius:6px;cursor:pointer;font-family:inherit;font-weight:bold;">📋 گزارش جمع‌آوری</button><button id="btnReportFinal" style="flex:1;background:#3ecf8e;color:#0f1117;border:none;padding:10px;border-radius:6px;cursor:pointer;font-family:inherit;font-weight:bold;">📋 گزارش نهایی</button></div></div><div style="margin-top:10px;font-size:11px;color:#666;text-align:center;border-top:1px solid #2a2d42;padding-top:8px;">مرحله ۱: در صفحه لیست دانش‌آموزان (صفحه اول)<br>مرحله ۲: در صفحه اضافه کردن دانش‌آموزان خارج از مدرسه</div>';
            document.body.appendChild(p);
            
            let h=document.getElementById('collectHeader');
            makeDraggableByTouch(p, h);
            
            let x1=0,y1=0,x2=0,y2=0;
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
	    // ==================== ابزار ۶: چاپ دفتر نتایج ارزشیابی ====================
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
	    // ==================== ابزار ۷: استخراج عکس ====================
    function photoExtractTool() {
        if (document.getElementById('multiPageExtractPanel')) {
            document.getElementById('multiPageExtractPanel').remove();
        }

        cleanupAllPanels();

        const STORAGE_KEY = 'photo_extract_students_v4';
        const DB_NAME = 'PhotoExtractDB';
        const DB_VERSION = 1;
        let students = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        let isRunning = false;
        let isStopped = false;
        let currentPage = 1;
        let abortController = null;
        let columnMapCache = null;

        function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

        function getText(el) {
            return (el.textContent || '').trim();
        }

        function escapeHtml(text) {
            if (!text) return '';
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

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

        function getColumnMap() {
            if (columnMapCache) return columnMapCache;
            
            const map = { photo: -1, code: -1, name: -1, family: -1, father: -1 };
            const headers = document.querySelectorAll('table thead th, table thead td');
            const headerTexts = [];
            
            for (let i = 0; i < headers.length; i++) {
                headerTexts.push(getText(headers[i]));
            }
            
            console.log('🔍 هدرهای جدول:', headerTexts);
            
            for (let i = 0; i < headerTexts.length; i++) {
                const text = headerTexts[i];
                if (!text) continue;
                
                if (map.photo === -1 && (text.includes('عکس') || text.includes('تصویر') || text.includes('photo') || text.includes('image'))) {
                    map.photo = i;
                    continue;
                }
                
                if (map.code === -1 && text.includes('کد') && (text.includes('ملی') || text.includes('دانش') || text.includes('دانش‌آموز'))) {
                    map.code = i;
                    continue;
                }
                
                if (map.family === -1 && (text.includes('نام خانوادگی') || text.includes('نام‌خانوادگی') || text.includes('فامیل') || text.includes('خانوادگی'))) {
                    map.family = i;
                    continue;
                }
                
                if (map.father === -1 && (text.includes('نام پدر') || text.includes('نام‌پدر') || text.includes('پدر'))) {
                    map.father = i;
                    continue;
                }
                
                if (map.name === -1 && (text === 'نام' || text === 'نام ' || (text.includes('نام') && !text.includes('خانوادگی') && !text.includes('پدر') && !text.includes('دوره') && !text.includes('پایه')))) {
                    map.name = i;
                    continue;
                }
            }
            
            if (map.name === -1) {
                const firstRow = document.querySelector('table tbody tr');
                if (firstRow) {
                    const cells = firstRow.querySelectorAll('td');
                    for (let i = 0; i < cells.length; i++) {
                        const cellText = getText(cells[i]);
                        if (cellText && !cellText.includes('دوره') && !cellText.includes('پایه') && 
                            !/^\d+$/.test(cellText) && cellText.length < 30 && i !== map.code && i !== map.family && i !== map.father) {
                            map.name = i;
                            break;
                        }
                    }
                }
            }
            
            if (map.photo === -1) map.photo = 1;
            if (map.code === -1) map.code = 2;
            if (map.name === -1) map.name = 3;
            if (map.family === -1) map.family = 4;
            if (map.father === -1) map.father = 5;
            
            console.log('📋 نقشه ستون‌ها:', map);
            columnMapCache = map;
            return map;
        }

        function extractStudentName(cells, col) {
            if (col.name >= 0 && cells[col.name]) {
                return getText(cells[col.name]);
            }
            
            let candidates = [];
            for (let i = 0; i < cells.length; i++) {
                const text = getText(cells[i]);
                if (!text) continue;
                
                if (text.includes('دوره') || text.includes('پایه') || text.includes('ابتدایی') || 
                    text.includes('متوسطه') || /^\d+$/.test(text) || text.length > 50) {
                    continue;
                }
                
                candidates.push({ index: i, text: text, length: text.length });
            }
            
            if (candidates.length > 0) {
                candidates.sort((a, b) => a.length - b.length);
                return candidates[0].text;
            }
            
            return '';
        }

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

        async function extractFromDoc(doc) {
            const col = getColumnMap();
            let rows = doc.querySelectorAll('table tbody tr');
            let newItems = [];
            
            for (let row of rows) {
                if (isStopped) break;
                
                let cols = row.querySelectorAll('td');
                if (cols.length < 5) continue;
                
                let codemelli = col.code >= 0 && cols[col.code] ? getText(cols[col.code]) : '';
                
                let name = extractStudentName(cols, col);
                
                let family = col.family >= 0 && cols[col.family] ? getText(cols[col.family]) : '';
                let father = col.father >= 0 && cols[col.father] ? getText(cols[col.father]) : '';
                
                let imgSrc = '';
                if (col.photo >= 0 && cols[col.photo]) {
                    let imgElem = cols[col.photo].querySelector('img');
                    if (imgElem && imgElem.src && !imgElem.src.includes('thumb_default.jpg') && !imgElem.src.includes('default')) {
                        imgSrc = imgElem.src;
                    }
                }
                
                if (!imgSrc) {
                    let imgs = row.querySelectorAll('img');
                    for (let img of imgs) {
                        let src = img.src || '';
                        if (src && !src.includes('icon') && !src.includes('delete') && !src.includes('edit') && !src.includes('add') && !src.includes('thumb_default') && !src.includes('default') && !src.includes('btn')) {
                            imgSrc = src;
                            break;
                        }
                    }
                }
                
                console.log(`👤 استخراج: نام=${name}, خانوادگی=${family}, کد=${codemelli}, عکس=${imgSrc ? 'دارد' : 'ندارد'}`);
                
                if (name || family) {
                    let exists = false;
                    if (codemelli) {
                        exists = students.some(s => s.codemelli === codemelli);
                    } else {
                        exists = students.some(s => s.name === name && s.family === family && !s.codemelli);
                    }
                    
                    if (!exists) {
                        let hasPhoto = false;
                        if (imgSrc && !isStopped) {
                            try {
                                let base64 = await imageToBase64(imgSrc);
                                if (base64) { 
                                    await savePhotoToDB(codemelli, base64); 
                                    hasPhoto = true; 
                                }
                            } catch (e) {
                                console.warn('خطا در دانلود عکس برای:', name, family, e);
                            }
                        }
                        newItems.push({ 
                            name: name, 
                            family: family, 
                            father: father, 
                            codemelli: codemelli, 
                            hasPhoto: hasPhoto 
                        });
                    }
                }
            }
            
            return newItems;
        }

        function findNextUrl(doc) {
            let selectors = [
                'a.k-pager-next', 
                '.k-pager-wrap a:has(span.k-i-arrow-e)', 
                'a[aria-label="Go to the next page"]', 
                'a[title="Go to the next page"]', 
                'a[title="صفحه بعد"]', 
                'a[title="بعدی"]', 
                'a[rel="next"]', 
                '.pagination .next a', 
                '.pagination li.next a', 
                'li.next > a', 
                'a.next'
            ];
            
            for (let sel of selectors) {
                try {
                    let elements = doc.querySelectorAll(sel);
                    for (let btn of elements) {
                        if (btn.classList.contains('k-state-disabled') || 
                            btn.closest('.k-state-disabled') || 
                            btn.classList.contains('disabled')) continue;
                        if (btn.href) return btn.href;
                    }
                } catch (e) { continue; }
            }
            
            let allElems = doc.querySelectorAll('a, span');
            for (let el of allElems) {
                if (el.querySelector('span.k-i-arrow-e') && el.href && !el.classList.contains('k-state-disabled')) { 
                    return el.href; 
                }
            }
            return null;
        }

        async function buildResultPage() {
            let studentsWithPhotos = [];
            for (let s of students) {
                if (isStopped) break;
                let photo = s.hasPhoto ? await getPhotoFromDB(s.codemelli) : '';
                studentsWithPhotos.push(Object.assign({}, s, { photo: photo }));
            }
            
            let html = `<!DOCTYPE html><html dir="rtl" lang="fa"><head><meta charset="UTF-8"><title>لیست دانش‌آموزان با عکس و مشخصات</title><script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"><\/script><style>body{font-family:Tahoma,sans-serif;background:#f0f2f5;padding:20px;margin:0}.container{max-width:1200px;margin:0 auto;display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:20px}.card{background:white;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.1);padding:15px;text-align:center;transition:0.2s}.card:hover{box-shadow:0 4px 16px rgba(0,0,0,0.15)}.card img{width:120px;height:120px;border-radius:50%;object-fit:cover;border:3px solid #3b82f6;margin-bottom:10px}.card h3{margin:8px 0 4px;color:#1e293b}.card p{margin:4px 0;color:#475569;font-size:13px}.download-btn{background:#3b82f6;color:white;border:none;padding:6px 12px;border-radius:6px;cursor:pointer;margin-top:10px;font-size:12px}.download-btn:hover{background:#2563eb}.toolbar{position:sticky;top:0;background:white;padding:15px 20px;margin-bottom:30px;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.1);display:flex;gap:15px;flex-wrap:wrap;align-items:center;justify-content:center;z-index:100}.toolbar button{background:#10b981;color:white;border:none;padding:8px 16px;border-radius:8px;cursor:pointer;font-size:14px}.toolbar button:hover{background:#059669}.toolbar .count{font-weight:bold;color:#1e293b}.search-wrap{position:relative;flex:1;min-width:200px;max-width:320px}.search-wrap input{width:100%;height:38px;padding:0 36px 0 12px;border:1px solid #cbd5e1;border-radius:8px;font-family:inherit;font-size:14px;direction:rtl;outline:none;box-sizing:border-box}.search-wrap input:focus{border-color:#3b82f6;box-shadow:0 0 0 3px rgba(59,130,246,0.15)}.search-wrap .search-icon{position:absolute;left:10px;top:50%;transform:translateY(-50%);color:#94a3b8;font-size:15px;pointer-events:none}.no-img{width:120px;height:120px;border-radius:50%;background:#e2e8f0;display:flex;align-items:center;justify-content:center;margin:0 auto 10px;color:#64748b;font-size:12px}.no-search-result{grid-column:1/-1;text-align:center;padding:40px;color:#64748b;font-size:15px}@media(max-width:768px){.container{grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px;padding:10px}.card img{width:90px;height:90px}.toolbar{flex-direction:column;padding:10px}.search-wrap{max-width:100%}}<\/style><\/head><body><div class="toolbar"><span class="count" id="visibleCount">تعداد دانش‌آموزان: ${studentsWithPhotos.length}</span><div class="search-wrap"><input type="text" id="searchInput" placeholder="جستجو: نام، نام خانوادگی، کد ملی، نام پدر..." oninput="doSearch()"><span class="search-icon">🔍</span></div><button id="downloadAllZip">📦 دانلود همه عکس‌ها (ZIP)</button><button id="downloadCsv">📊 دانلود مشخصات (Excel)</button></div><div class="container" id="cardsContainer">`;
            
            studentsWithPhotos.forEach((s, idx) => {
                let imgTag = s.photo ? `<img src="${s.photo}" alt="عکس">` : `<div class="no-img">📷 بدون عکس</div>`;
                let fullNameWithCode = `${s.name} ${s.family} - ${s.codemelli}`;
                let searchData = `${s.name} ${s.family} ${s.father||''} ${s.codemelli||''}`;
                
                html += `<div class="card" data-idx="${idx}" data-search="${escapeHtml(searchData)}" data-name="${escapeHtml(fullNameWithCode)}">${imgTag}<h3>${escapeHtml(s.name)} ${escapeHtml(s.family)}</h3><p><strong>کد ملی:</strong> ${escapeHtml(s.codemelli||'---')}</p><p><strong>نام پدر:</strong> ${escapeHtml(s.father||'---')}</p><button class="download-btn" data-img="${s.photo}" data-name="${escapeHtml(fullNameWithCode)}">⬇ دانلود عکس</button></div>`;
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
                alert('هنوز داده‌ای جمع‌آوری نشده است. اول دکمه «جمع‌آوری این صفحه» را بزنید.');
                return;
            }
            setStatus('⏳ در حال آماده‌سازی فایل خروجی...');
            let html = await buildResultPage();
            let blob = new Blob([html], { type: 'text/html;charset=utf-8' });
            downloadBlobFile(blob, 'لیست_دانش‌آموزان.html');
            setStatus('✅ فایل دانلود شد.');
        }

        function updateStats() {
            let totalEl = document.getElementById('mpTotal');
            if (totalEl) totalEl.textContent = students.length.toLocaleString('fa-IR');
        }

        function setStatus(text) {
            let statusEl = document.getElementById('mpStatus');
            if (statusEl) statusEl.textContent = text;
        }

        async function collectCurrentPage() {
            if (isRunning) {
                setStatus('⏳ در حال جمع‌آوری...');
                return;
            }
            
            isRunning = true;
            isStopped = false;
            document.getElementById('btnStart').disabled = true;
            document.getElementById('btnStart').style.opacity = '0.5';
            document.getElementById('btnStop').disabled = false;
            document.getElementById('btnStop').style.opacity = '';
            
            setStatus('در حال جمع‌آوری صفحه ' + currentPage + ' (عکس‌ها هم دانلود می‌شوند)...');
            
            try {
                let newItems = await extractFromDoc(document);
                
                if (isStopped) {
                    setStatus('⏸️ متوقف شد. داده‌های قبلی حفظ شده‌اند.');
                } else if (newItems.length > 0) {
                    students = students.concat(newItems);
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
                    updateStats();
                    setStatus('صفحه ' + currentPage + ': ' + newItems.length + ' دانش‌آموز جدید اضافه شد. مجموع: ' + students.length);
                    
                    let nextUrl = findNextUrl(document);
                    if (nextUrl) {
                        setTimeout(() => {
                            if (!isStopped) {
                                setStatus('✅ ' + newItems.length + ' نفر اضافه شد. حالا به صفحه بعد بروید و دوباره کلیک کنید.');
                            }
                        }, 2000);
                    } else {
                        setStatus('✅ ' + newItems.length + ' نفر اضافه شد. این آخرین صفحه بود.');
                    }
                } else {
                    let nextUrl = findNextUrl(document);
                    if (!nextUrl) {
                        setStatus('✅ به آخرین صفحه رسیدید یا دانش‌آموزی برای استخراج وجود ندارد.');
                    } else {
                        setStatus('⚠️ صفحه ' + currentPage + ' دانش‌آموز جدیدی نداشت.');
                    }
                }
            } catch (e) {
                console.error('خطا در جمع‌آوری:', e);
                setStatus('❌ خطا در جمع‌آوری: ' + e.message);
            } finally {
                isRunning = false;
                document.getElementById('btnStart').disabled = false;
                document.getElementById('btnStart').style.opacity = '';
                document.getElementById('btnStop').disabled = true;
                document.getElementById('btnStop').style.opacity = '0.5';
            }
        }

        async function clearMemory() {
            if (confirm('آیا مطمئن هستید؟ تمام داده‌های جمع‌آوری‌شده پاک خواهد شد.')) {
                localStorage.removeItem(STORAGE_KEY);
                try {
                    let db = await openDB();
                    let tx = db.transaction('photos', 'readwrite');
                    tx.objectStore('photos').clear();
                    await new Promise(function(resolve, reject) { tx.oncomplete = resolve; tx.onerror = reject; });
                    db.close();
                } catch (e) {}
                students = [];
                currentPage = 1;
                columnMapCache = null;
                updateStats();
                setStatus('حافظه پاک شد. آماده شروع...');
            }
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
            panel.style.cssText = 'position:fixed;top:20px;left:20px;background:#fff;border:2px solid #3b82f6;border-radius:10px;padding:15px;width:320px;max-width:90vw;z-index:999999;box-shadow:0 4px 20px rgba(0,0,0,0.2);font-family:Tahoma,sans-serif;direction:rtl;font-size:13px;color:#333;';
            panel.innerHTML = '<div id="mpHeader" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;padding-bottom:10px;border-bottom:2px solid #3b82f6;user-select:none;"><strong style="color:#3b82f6;font-size:15px;">📸 استخراج عکس + مشخصات</strong><button id="mpClose" style="background:none;border:none;cursor:pointer;font-size:18px;color:#999;">✕</button></div><div style="background:#eff6ff;padding:12px;border-radius:8px;margin-bottom:12px;text-align:center;"><div style="font-size:12px;color:#666;">تعداد جمع‌آوری‌شده:</div><div id="mpTotal" style="font-size:28px;font-weight:bold;color:#3b82f6;">0</div><div id="mpStatus" style="font-size:11px;color:#666;margin-top:5px;">آماده شروع...</div></div><div style="display:flex;flex-direction:column;gap:8px;"><button id="btnStart" style="background:#3b82f6;color:white;border:none;padding:10px;border-radius:6px;cursor:pointer;font-family:inherit;font-weight:bold;">📥 جمع‌آوری این صفحه</button><div style="display:flex;gap:8px;"><button id="btnStop" style="flex:1;background:#ef4444;color:white;border:none;padding:10px;border-radius:6px;cursor:pointer;font-family:inherit;font-weight:bold;opacity:0.5;" disabled>⛔ توقف</button><button id="btnDownload" style="flex:1;background:#10b981;color:white;border:none;padding:10px;border-radius:6px;cursor:pointer;font-family:inherit;font-weight:bold;">📥 دانلود خروجی</button></div><button id="btnClear" style="background:#fff;color:#c62828;border:1px solid #c62828;padding:8px;border-radius:6px;cursor:pointer;font-family:inherit;font-size:12px;margin-top:5px;">🗑️ پاک‌سازی حافظه</button></div><div style="margin-top:10px;font-size:11px;color:#666;text-align:center;border-top:1px solid #eee;padding-top:8px;">📌 بعد از جمع‌آوری هر صفحه، خودتان به صفحه بعد بروید و دوباره «جمع‌آوری» را بزنید.<br>💾 داده‌ها در localStorage ذخیره می‌شوند و با بستن مرورگر از بین نمی‌روند.</div>';
            document.body.appendChild(panel);
            
            makeDraggable(panel, document.getElementById('mpHeader'));
            makeDraggableByTouch(panel, document.getElementById('mpHeader'));
            
            document.getElementById('mpClose').addEventListener('click', function() {
                panel.remove();
            });
            
            document.getElementById('btnStart').addEventListener('click', collectCurrentPage);
            
            document.getElementById('btnStop').addEventListener('click', function() {
                if (isRunning) {
                    isStopped = true;
                    if (abortController) {
                        abortController.abort();
                    }
                    setStatus('⏸️ در حال توقف...');
                    document.getElementById('btnStop').disabled = true;
                    document.getElementById('btnStop').style.opacity = '0.5';
                }
            });
            
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
                <div style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);width:90%;max-width:500px;max-height:70vh;z-index:10000000;background:white;border:2px solid #0f4c81;border-radius:12px;padding:20px;font-family:Tahoma,sans-serif;direction:rtl;font-size:13px;color:#333;display:flex;flex-direction:column;">
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
                    </div>
                    <div style="overflow-y:auto;flex:1;margin-bottom:15px;">
                        <div style="background:#f0fdf4;padding:10px;border-radius:8px;margin-bottom:10px;">
                            <strong style="color:#10b981;">✅ تخصیص داده شده (${checkedCodes.length}):</strong>
                            <div style="margin-top:8px;font-size:12px;line-height:1.8;">
                                ${targetStudents.filter(s => checkedCodes.includes(s.code)).map(s => `• ${s.name} ${s.family} (کد: ${s.code})`).join('<br>') || 'هیچ دانش‌آموزی تخصیص داده نشده است.'}
                            </div>
                        </div>
                        <div style="background:#fef2f2;padding:10px;border-radius:8px;">
                            <strong style="color:#ef4444;">❌ تخصیص داده نشده (${targetStudents.length - checkedCodes.length}):</strong>
                            <div style="margin-top:8px;font-size:12px;line-height:1.8;">
                                ${targetStudents.filter(s => !checkedCodes.includes(s.code)).map(s => `• ${s.name} ${s.family} (کد: ${s.code})`).join('<br>') || 'همه دانش‌آموزان تخصیص داده شده‌اند.'}
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
            p.style.cssText = 'position:fixed;top:20px;left:20px;background:#fff;border:2px solid #0f4c81;border-radius:12px;padding:16px 18px;width:360px;max-width:90vw;z-index:999999;box-shadow:0 4px 20px rgba(0,0,0,0.25);font-family:Tahoma,sans-serif;direction:rtl;font-size:13px;color:#333;';
            p.innerHTML = '<div id="collectHeader" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;padding-bottom:10px;border-bottom:2px solid #0f4c81;user-select:none;"><strong style="color:#0f4c81;font-size:15px;">📋 جمع‌آوری و تخصیص</strong><button id="btnClose" style="background:none;border:none;cursor:pointer;font-size:18px;color:#999;">✕</button></div><div style="background:#f0f6ff;padding:12px;border-radius:8px;margin-bottom:12px;text-align:center;"><div style="font-size:12px;color:#666;">تعداد کلاس‌ها: <span id="classCount" style="font-weight:bold;color:#0f4c81;">0</span> | مجموع دانش‌آموزان: <span id="studentCount" style="font-weight:bold;color:#0f4c81;">0</span></div><div id="collectStatus" style="font-size:11px;color:#666;margin-top:4px;">آماده</div></div><div style="display:flex;flex-direction:column;gap:8px;margin-bottom:8px;"><button id="btnCollect" style="background:#0f4c81;color:white;border:none;padding:10px;border-radius:6px;cursor:pointer;font-family:inherit;font-weight:bold;">📊 جمع‌آوری این کلاس</button></div><div style="border-top:1px solid #eee;padding-top:8px;margin-bottom:8px;"><div style="display:flex;gap:8px;margin-bottom:6px;align-items:center;"><div style="font-size:12px;color:#666;white-space:nowrap;">انتخاب کلاس:</div><select id="classSelect" style="flex:1;padding:6px;border-radius:4px;border:1px solid #ccc;font-family:inherit;"></select></div><button id="btnAssign" style="width:100%;background:#f59e0b;color:#0f1117;border:none;padding:10px;border-radius:6px;cursor:pointer;font-family:inherit;font-weight:bold;">✅ تیک زدن و اعمال</button></div><div style="display:flex;gap:8px;"><button id="btnClear" style="flex:1;background:#ef4444;color:white;border:none;padding:8px;border-radius:6px;cursor:pointer;font-family:inherit;font-weight:bold;">🗑️ پاک‌سازی</button></div><div id="assignStatus" style="font-size:11px;color:#666;text-align:center;margin-top:8px;"></div><div style="margin-top:10px;font-size:11px;color:#666;text-align:center;border-top:1px solid #eee;padding-top:8px;">⚠️ هنگام اجرا، تب مرورگر را فعال نگه دارید.</div>';
            document.body.appendChild(p);

            let h = document.getElementById('collectHeader');
            makeDraggableByTouch(p, h);
            
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
            p.style.cssText = 'position:fixed;top:20px;left:20px;background:#fff;border:2px solid #0f4c81;border-radius:12px;padding:16px 18px;width:340px;max-width:90vw;z-index:999999;box-shadow:0 4px 20px rgba(0,0,0,0.25);font-family:Tahoma,sans-serif;direction:rtl;font-size:13px;color:#333;';

            let grades = ['اول', 'دوم', 'سوم', 'چهارم', 'پنجم', 'ششم'];
            let prevOpts = grades.map(g => `<option value="${g}" ${g === TARGET_PREV_GRADE ? 'selected' : ''}>${g}</option>`).join('');
            let newOpts = grades.map(g => `<option value="${g}" ${g === TARGET_NEW_GRADE ? 'selected' : ''}>${g}</option>`).join('');

            p.innerHTML = '<div id="freePanelHeader" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;padding-bottom:10px;border-bottom:2px solid #0f4c81;user-select:none;"><strong style="color:#0f4c81;font-size:15px;">🔓 آزادسازی</strong><button id="btnClose" style="background:none;border:none;cursor:pointer;font-size:18px;color:#999;">✕</button></div><div style="background:#f0f6ff;padding:12px;border-radius:8px;margin-bottom:12px;text-align:center;"><div style="font-size:12px;color:#666;">تعداد آزادسازی‌شده:</div><div id="freeCounter" style="font-size:28px;font-weight:bold;color:#0f4c81;">0</div><div id="freeStatus" style="font-size:11px;color:#666;margin-top:5px;">آماده</div></div><div style="display:flex;gap:8px;margin-bottom:10px;flex-wrap:wrap;justify-content:center;"><div style="flex:1;min-width:80px;"><div style="font-size:10px;color:#666;margin-bottom:2px;text-align:center;">پایه مبدأ</div><select id="targetPrevGrade" style="width:100%;padding:4px;border-radius:4px;border:1px solid #ccc;font-family:inherit;text-align:center;">' + prevOpts + '</select></div><div style="flex:1;min-width:80px;"><div style="font-size:10px;color:#666;margin-bottom:2px;text-align:center;">پایه مقصد</div><select id="targetNewGrade" style="width:100%;padding:4px;border-radius:4px;border:1px solid #ccc;font-family:inherit;text-align:center;">' + newOpts + '</select></div></div><div style="display:flex;flex-direction:column;gap:8px;"><button id="btnStartFree" style="background:#0f4c81;color:white;border:none;padding:10px;border-radius:6px;cursor:pointer;font-family:inherit;font-weight:bold;">▶️ شروع</button><div style="display:flex;gap:8px;"><button id="btnStopFree" style="flex:1;background:#ef4444;color:white;border:none;padding:10px;border-radius:6px;cursor:pointer;font-family:inherit;font-weight:bold;">⛔ توقف</button><button id="btnReset" style="flex:1;background:#f59e0b;color:#0f1117;border:none;padding:10px;border-radius:6px;cursor:pointer;font-family:inherit;font-weight:bold;">🔄 ریست</button></div></div><div style="margin-top:10px;font-size:11px;color:#666;text-align:center;border-top:1px solid #eee;padding-top:8px;">⚠️ هنگام اجرا، تب مرورگر را فعال نگه دارید.</div>';

            document.body.appendChild(p);

            let h = document.getElementById('freePanelHeader');
            makeDraggableByTouch(p, h);
            
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
	    // ==================== ابزار ۱۰: استخراج لیست کلاسی ====================
    function extractClassListTool() {
        if (document.getElementById('extractPanel')) {
            document.getElementById('extractPanel').remove();
        }

        cleanupAllPanels();

        function escapeHtml(text) {
            var div = document.createElement('div');
            div.appendChild(document.createTextNode(text));
            return div.innerHTML;
        }

        function getClassNameFromDropdown() {
            let labels = document.querySelectorAll('label');
            for (let label of labels) {
                if (label.textContent.trim() === 'نام کلاس' || label.textContent.includes('نام کلاس')) {
                    let parent = label.parentElement;
                    if (parent) {
                        let select = parent.querySelector('select');
                        if (select) {
                            let selectedOption = select.options[select.selectedIndex];
                            if (selectedOption && selectedOption.textContent.trim()) {
                                return selectedOption.textContent.trim();
                            }
                        }
                        
                        let input = parent.querySelector('input[type="text"], input:not([type="hidden"])');
                        if (input && input.value && input.value.trim()) {
                            return input.value.trim();
                        }
                        
                        let bindingElements = parent.querySelectorAll('.ng-binding, [ng-bind], [ng-model]');
                        for (let el of bindingElements) {
                            let text = el.textContent.trim();
                            if (text && text !== 'نام کلاس') {
                                return text;
                            }
                        }
                    }
                    
                    let allSelects = document.querySelectorAll('select');
                    for (let select of allSelects) {
                        let selectedOption = select.options[select.selectedIndex];
                        if (selectedOption && selectedOption.textContent.trim()) {
                            return selectedOption.textContent.trim();
                        }
                    }
                    
                    let allInputs = document.querySelectorAll('input[type="text"], input:not([type="hidden"])');
                    for (let input of allInputs) {
                        if (input.value && input.value.trim() && input.value.trim() !== 'نام کلاس') {
                            return input.value.trim();
                        }
                    }
                }
            }
            
            let title = document.title.trim();
            if (title) {
                return title;
            }
            
            return 'کلاس نامشخص';
        }

        function findMainTable() {
            let tables = document.querySelectorAll('table');
            let bestTable = null;
            let maxRows = 0;
            
            for (let table of tables) {
                let rows = table.querySelectorAll('tbody tr, tr');
                let dataRows = 0;
                
                for (let row of rows) {
                    let cells = row.querySelectorAll('td');
                    if (cells.length >= 5) {
                        let text = row.textContent.trim();
                        if (/\d{5,}/.test(text)) {
                            dataRows++;
                        }
                    }
                }
                
                if (dataRows > maxRows) {
                    maxRows = dataRows;
                    bestTable = table;
                }
            }
            
            return bestTable;
        }

        function getColumnIndices(table) {
            let headers = table.querySelectorAll('thead th, thead td');
            let indices = { code: -1, name: -1, family: -1 };
            
            console.log('🔍 بررسی هدرهای جدول:');
            
            headers.forEach(function(header, i) {
                let dataField = header.getAttribute('data-field') || '';
                let dataTitle = header.getAttribute('data-title') || '';
                let text = header.textContent.trim().replace(/\s+/g, ' ');
                
                console.log(`ستون ${i}: data-field="${dataField}", data-title="${dataTitle}", text="${text}"`);
                
                if (dataField.includes('code') || dataField.includes('Code') || 
                    dataTitle.includes('کد') || text.includes('کد')) {
                    if (dataField.includes('student') || dataField.includes('Student') || 
                        dataTitle.includes('دانش') || dataTitle.includes('آموز') ||
                        text.includes('دانش') || text.includes('آموز') || text.includes('ملی')) {
                        indices.code = i;
                    }
                }
                
                if (dataField === 'firstName' || dataField === 'name' || dataField === 'Name' ||
                    dataTitle === 'نام' || text === 'نام') {
                    indices.name = i;
                }
                
                if (dataField === 'lastName' || dataField === 'family' || dataField === 'Family' ||
                    dataTitle === 'نام خانوادگی' || text === 'نام خانوادگی') {
                    indices.family = i;
                }
            });
            
            if (indices.code === -1 || indices.name === -1 || indices.family === -1) {
                console.log('⚠️ استفاده از روش متنی...');
                headers.forEach(function(header, i) {
                    let text = header.textContent.trim().replace(/\s+/g, ' ');
                    
                    if (indices.code === -1 && text.includes('کد') && (text.includes('دانش') || text.includes('آموز') || text.includes('ملی'))) {
                        indices.code = i;
                    }
                    
                    if (indices.name === -1 && text === 'نام') {
                        indices.name = i;
                    }
                    
                    if (indices.family === -1 && (text === 'نام خانوادگی' || text.includes('نام خانوادگی'))) {
                        indices.family = i;
                    }
                });
            }
            
            if (indices.code === -1) {
                console.log('⚠️ جستجوی خودکار ستون کد...');
                let firstDataRow = table.querySelector('tbody tr, tr');
                if (firstDataRow) {
                    let cells = firstDataRow.querySelectorAll('td');
                    for (let i = 0; i < cells.length; i++) {
                        let text = cells[i].textContent.trim();
                        if (/^\d{5,}$/.test(text)) {
                            indices.code = i;
                            break;
                        }
                    }
                }
            }
            
            if (indices.name === -1) {
                console.log('⚠️ ستون نام پیش‌فرض: ایندکس 3 (ستون چهارم)');
                indices.name = 3;
            }
            
            if (indices.family === -1) {
                console.log('⚠️ ستون نام خانوادگی پیش‌فرض: ایندکس 4 (ستون پنجم)');
                indices.family = 4;
            }
            
            console.log('📋 ایندکس‌های نهایی:', indices);
            return indices;
        }

        function extractFromTable(table) {
            let idx = getColumnIndices(table);
            if (idx.code === -1) {
                console.warn('❌ ستون کد پیدا نشد');
                return [];
            }

            let students = [];
            let rows = table.querySelectorAll('tbody tr');
            if (rows.length === 0) {
                rows = table.querySelectorAll('tr');
                rows = Array.from(rows).filter(row => row.querySelector('td'));
            }
            
            console.log(`📊 تعداد ردیف‌ها: ${rows.length}`);
            
            rows.forEach(function(row, rowIndex) {
                let cells = row.querySelectorAll('td');
                if (cells.length < 5) return;
                
                let code = '';
                let name = '';
                let family = '';
                
                if (idx.code >= 0 && cells[idx.code]) {
                    code = cells[idx.code].textContent.trim();
                }
                
                if (idx.name >= 0 && cells[idx.name]) {
                    name = cells[idx.name].textContent.trim();
                }
                
                if (idx.family >= 0 && cells[idx.family]) {
                    family = cells[idx.family].textContent.trim();
                }
                
                if (code && code.length > 3) {
                    students.push({
                        row: rowIndex + 1,
                        code: code,
                        name: name || '',
                        family: family || ''
                    });
                }
            });
            
            return students;
        }

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
            htmlContent += '<table><thead><tr>';
            htmlContent += '<th>ردیف</th>';
            htmlContent += '<th>کد دانش‌آموزی</th>';
            htmlContent += '<th>نام خانوادگی و نام</th>';
            for (var i = 0; i < 10; i++) {
                htmlContent += '<th></th>';
            }
            htmlContent += '</tr></thead><tbody>';

            students.forEach(function(s, index) {
                htmlContent += '<tr>';
                htmlContent += '<td>' + (index + 1) + '</td>';
                htmlContent += '<td>' + escapeHtml(s.code) + '</td>';
                var fullName = s.family + ' ' + s.name;
                htmlContent += '<td>' + escapeHtml(fullName.trim()) + '</td>';
                for (var j = 0; j < 10; j++) {
                    htmlContent += '<td></td>';
                }
                htmlContent += '</tr>';
            });

            htmlContent += '</tbody></table>';
            htmlContent += '</body></html>';

            var blob = new Blob([htmlContent], { type: 'application/msword;charset=utf-8' });
            var link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            var fileName = 'لیست_' + className.replace(/[^\w\s]/g, '').replace(/\s+/g, '_') + '.doc';
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setTimeout(function(){ URL.revokeObjectURL(link.href); }, 1000);
        }

        function updatePanel(allClasses) {
            var totalCountEl = document.getElementById('totalCount');
            var classListEl = document.getElementById('classList');
            
            if (totalCountEl) {
                let total = allClasses.reduce((acc, cls) => acc + cls.students.length, 0);
                totalCountEl.textContent = total;
            }

            if (classListEl) {
                if (allClasses.length === 0) {
                    classListEl.innerHTML = '<div style="color:#888;text-align:center;padding:10px;">هنوز کلاسی ذخیره نشده است.</div>';
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
                        html += '<div style="font-size:11px;color:#888899;margin-bottom:6px;">';
                        html += 'نمونه: ' + escapeHtml(cls.students[0].family + ' ' + cls.students[0].name);
                        if (cls.students.length > 1) {
                            html += '، ' + escapeHtml(cls.students[1].family + ' ' + cls.students[1].name);
                        }
                        html += '</div>';
                    }
                    
                    html += '<button class="download-class-btn" data-index="' + index + '" style="background:#10b981;color:white;border:none;padding:6px 12px;border-radius:4px;cursor:pointer;font-family:inherit;font-size:11px;width:100%;">📄 دانلود ورد این کلاس</button>';
                    html += '</div>';
                });
                classListEl.innerHTML = html;
                
                document.querySelectorAll('.download-class-btn').forEach(function(btn) {
                    btn.onclick = function() {
                        let index = parseInt(btn.getAttribute('data-index'));
                        let cls = allClasses[index];
                        if (cls) {
                            generateWordFile(cls.className, cls.students);
                        }
                    };
                });
            }
        }

        function createPanel() {
            var panel = document.createElement('div');
            panel.id = 'extractPanel';
            panel.style.cssText = 'position:fixed;top:20px;left:20px;background:#1a1d2e;border:2px solid #3ecfe0;border-radius:12px;padding:16px 18px;width:380px;max-width:90vw;z-index:999999;box-shadow:0 4px 20px rgba(0,0,0,0.4);font-family:Tahoma,sans-serif;direction:rtl;font-size:13px;color:#e8e8f0;';

            panel.innerHTML = '<div id="extractHeader" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;padding-bottom:10px;border-bottom:2px solid #3ecfe0;user-select:none;cursor:move;">' +
                '<strong style="color:#3ecfe0;font-size:15px;">📋 استخراج لیست کلاسی</strong>' +
                '<button id="btnClose" style="background:none;border:none;cursor:pointer;font-size:18px;color:#999;">✕</button></div>' +
                '<div style="background:#0f1117;padding:12px;border-radius:8px;margin-bottom:12px;text-align:center;">' +
                '<div style="font-size:12px;color:#888899;">تعداد کل دانش‌آموزان ذخیره شده:</div>' +
                '<div id="totalCount" style="font-size:28px;font-weight:bold;color:#3ecfe0;">0</div></div>' +
                '<div style="display:flex;gap:8px;margin-bottom:12px;">' +
                '<button id="btnCollect" style="background:#3b82f6;color:white;border:none;padding:10px;border-radius:6px;cursor:pointer;font-family:inherit;font-weight:bold;flex:1;">📊 جمع‌آوری این کلاس</button>' +
                '<button id="btnDownloadAll" style="background:#10b981;color:white;border:none;padding:10px;border-radius:6px;cursor:pointer;font-family:inherit;font-weight:bold;flex:1;">📥 دانلود همه</button>' +
                '</div>' +
                '<button id="btnReset" style="background:transparent;color:#888899;border:1px solid #2a2d42;padding:8px;border-radius:6px;cursor:pointer;font-family:inherit;font-size:12px;width:100%;margin-bottom:12px;">🔄 پاک کردن همه</button>' +
                '<div style="font-size:12px;color:#888899;margin-bottom:6px;">کلاس‌های ذخیره شده:</div>' +
                '<div id="classList" style="background:#0f1117;border-radius:8px;padding:8px;max-height:300px;overflow-y:auto;font-size:12px;">' +
                '<div style="color:#888;text-align:center;padding:10px;">هنوز کلاسی ذخیره نشده است.</div></div>' +
                '<div style="margin-top:10px;font-size:10px;color:#555577;text-align:center;border-top:1px solid #2a2d42;padding-top:8px;">📌 ستون 4: نام | ستون 5: نام خانوادگی</div>';

            document.body.appendChild(panel);

            var header = document.getElementById('extractHeader');
            makeDraggableByTouch(panel, header);
            
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

            var allClasses = [];
            
            try {
                var savedData = sessionStorage.getItem('extracted_classes_data');
                if (savedData) {
                    allClasses = JSON.parse(savedData);
                }
            } catch(e) {
                allClasses = [];
            }
            
            updatePanel(allClasses);

            document.getElementById('btnClose').onclick = function() {
                panel.remove();
            };

            document.getElementById('btnCollect').onclick = function() {
                console.log('🔄 شروع جمع‌آوری...');
                
                let className = getClassNameFromDropdown();
                console.log('📚 نام کلاس:', className);
                
                let table = findMainTable();
                if (!table) {
                    alert('❌ جدولی در صفحه پیدا نشد!');
                    return;
                }
                
                let students = extractFromTable(table);
                
                if (students.length === 0) {
                    alert('❌ هیچ دانش‌آموزی یافت نشد!');
                    return;
                }
                
                let existingIndex = allClasses.findIndex(cls => cls.className === className);
                if (existingIndex !== -1) {
                    allClasses[existingIndex].students = students;
                    alert('✅ کلاس "' + className + '" با ' + students.length + ' دانش‌آموز به‌روزرسانی شد.');
                } else {
                    allClasses.push({
                        className: className,
                        students: students
                    });
                    alert('✅ کلاس "' + className + '" با ' + students.length + ' دانش‌آموز ذخیره شد.');
                }
                
                sessionStorage.setItem('extracted_classes_data', JSON.stringify(allClasses));
                updatePanel(allClasses);
            };

            document.getElementById('btnDownloadAll').onclick = function() {
                if (allClasses.length === 0) {
                    alert('❌ هیچ کلاسی ذخیره نشده است!');
                    return;
                }
                
                let totalStudents = allClasses.reduce((acc, cls) => acc + cls.students.length, 0);
                
                if (confirm('آیا می‌خواهید ' + allClasses.length + ' کلاس با مجموع ' + totalStudents + ' دانش‌آموز را دانلود کنید؟\n\nهر کلاس به صورت فایل جداگانه دانلود می‌شود.')) {
                    allClasses.forEach(function(cls, index) {
                        setTimeout(function() {
                            generateWordFile(cls.className, cls.students);
                        }, index * 1000);
                    });
                }
            };

            document.getElementById('btnReset').onclick = function() {
                if (confirm('آیا مطمئن هستید؟ تمام کلاس‌های ذخیره شده پاک خواهند شد.')) {
                    allClasses = [];
                    sessionStorage.removeItem('extracted_classes_data');
                    updatePanel(allClasses);
                    alert('🔄 همه کلاس‌ها پاک شدند.');
                }
            };
        }

        createPanel();
    }
	    // ==================== ابزار ۱۱: استخراج مشخصات ====================
    function smartInfoExtractTool() {
        if (document.getElementById('autoExtractPanel')) {
            document.getElementById('autoExtractPanel').remove();
        }

        cleanupAllPanels();

        const STORAGE_KEY = 'angular_students_data_v4';
        let allStudents = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        let isRunning = false;
        let failedStudents = new Set();
        let columnMapCache = null;

        function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

        function getText(el) {
            return (el.textContent || '').trim();
        }

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
                showNotification('⚠️ حافظه پر شد. از localStorage استفاده می‌شود.');
            }
        }

        function getColumnMap() {
            if (columnMapCache) return columnMapCache;
            
            const map = { code: -1, name: -1, family: -1, father: -1, birthDate: -1 };
            const headers = document.querySelectorAll('table thead th, table thead td');
            const headerTexts = [];
            
            for (let i = 0; i < headers.length; i++) {
                headerTexts.push(getText(headers[i]));
            }
            
            console.log('🔍 هدرهای جدول:', headerTexts);
            
            for (let i = 0; i < headerTexts.length; i++) {
                const text = headerTexts[i];
                if (!text) continue;
                
                if (map.code === -1 && text.includes('کد') && (text.includes('ملی') || text.includes('دانش'))) {
                    map.code = i;
                } else if (map.family === -1 && (text.includes('نام خانوادگی') || text.includes('نام‌خانوادگی') || text.includes('فامیل'))) {
                    map.family = i;
                } else if (map.father === -1 && (text.includes('نام پدر') || text.includes('نام‌پدر'))) {
                    map.father = i;
                } else if (map.birthDate === -1 && (text.includes('تاریخ تولد') || text.includes('تولد') || text.includes('تاریخ'))) {
                    map.birthDate = i;
                } else if (map.name === -1 && (text === 'نام' || (text.includes('نام') && !text.includes('خانوادگی') && !text.includes('پدر')))) {
                    map.name = i;
                }
            }
            
            if (map.code === -1) map.code = 2;
            if (map.name === -1) map.name = 3;
            if (map.family === -1) map.family = 4;
            if (map.father === -1) map.father = 5;
            if (map.birthDate === -1) map.birthDate = 6;
            
            console.log('📋 نقشه ستون‌ها:', map);
            columnMapCache = map;
            return map;
        }

        function clearMemory() {
            if (confirm('آیا مطمئن هستید؟ تمام داده‌ها پاک خواهند شد.')) {
                localStorage.removeItem(STORAGE_KEY);
                allStudents = [];
                failedStudents.clear();
                columnMapCache = null;
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

        function getNextUnprocessedStudent() {
            const col = getColumnMap();
            let rows = document.querySelectorAll('table tbody tr');
            for (let row of rows) {
                let cols = row.querySelectorAll('td');
                if (cols.length <= Math.max(col.code, col.name, col.family, col.father, col.birthDate)) continue;
                
                let codemelli = col.code >= 0 && cols[col.code] ? getText(cols[col.code]) : '';
                let name = col.name >= 0 && cols[col.name] ? getText(cols[col.name]) : '';
                let family = col.family >= 0 && cols[col.family] ? getText(cols[col.family]) : '';
                let father = col.father >= 0 && cols[col.father] ? getText(cols[col.father]) : '';
                let birthDate = col.birthDate >= 0 && cols[col.birthDate] ? getText(cols[col.birthDate]) : '';
                
                if (codemelli && !allStudents.some(function(s) { return s.codemelli === codemelli; }) && !failedStudents.has(codemelli)) {
                    return { row: row, codemelli: codemelli, name: name, family: family, father: father, birthDate: birthDate };
                }
            }
            return null;
        }

        async function waitForInput(selector, timeout = 5000) {
            let start = Date.now();
            while (Date.now() - start < timeout) {
                if (!isRunning) return null;
                let input = document.querySelector(selector);
                if (input && input.value !== undefined) return input;
                await sleep(200);
            }
            return null;
        }

        async function processNextStudent() {
            if (!isRunning) return;
            let student = getNextUnprocessedStudent();
            if (!student) { await goToNextPage(); return; }

            updatePanelUI('در حال پردازش: ' + student.name + ' ' + student.family);

            try {
                let editBtn = student.row.querySelector('a.k-grid-edit');
                if (!editBtn) throw new Error('دکمه ویرایش یافت نشد');
                editBtn.click();
                await sleep(2500);
                if (!isRunning) return;

                let parentTab = Array.from(document.querySelectorAll('a.nav-link, a[ng-click*="select"]'))
                    .find(function(el) {
                        return el.textContent.includes('والدین') || el.textContent.includes('اولیا') || el.textContent.includes('آدرس و تماس');
                    });
                if (parentTab) { 
                    parentTab.click(); 
                    await sleep(1500); 
                    if (!isRunning) return;
                }

                let fatherInput = await waitForInput('input#fatherMobileNumber');
                let motherInput = await waitForInput('input#motherMobileNumber');
                let shadInput = await waitForInput('input#studentMobileNumber');
                
                if (!isRunning) return;

                let fatherPhone = fatherInput ? fatherInput.value.trim().replace(/[^\d]/g, '') : '';
                let motherPhone = motherInput ? motherInput.value.trim().replace(/[^\d]/g, '') : '';
                let shadPhone = shadInput ? shadInput.value.trim().replace(/[^\d]/g, '') : '';

                allStudents.push({
                    name: student.name, family: student.family, father: student.father,
                    codemelli: student.codemelli, birthDate: student.birthDate,
                    fatherPhone: fatherPhone, motherPhone: motherPhone, shadPhone: shadPhone
                });
                saveData();
                
                if (!isRunning) return;

                let cancelBtn = Array.from(document.querySelectorAll('button'))
                    .find(function(btn) {
                        return btn.textContent.trim().includes('انصراف') || (btn.getAttribute('ng-click') && btn.getAttribute('ng-click').includes('cancel'));
                    });
                if (cancelBtn) { 
                    cancelBtn.click(); 
                } else { 
                    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', keyCode: 27, which: 27, bubbles: true })); 
                }

                await sleep(2500);
                if (isRunning) setTimeout(function() { processNextStudent(); }, 0);

            } catch (err) {
                console.error('خطا:', err);
                if (student && student.codemelli) {
                    failedStudents.add(student.codemelli);
                    console.warn('دانش‌آموز با کد ملی ' + student.codemelli + ' به لیست خطا اضافه شد.');
                }
                document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', keyCode: 27, which: 27, bubbles: true }));
                await sleep(2000);
                if (isRunning) setTimeout(function() { processNextStudent(); }, 0);
            }
        }

        async function goToNextPage() {
            if (!isRunning) return;
            updatePanelUI('در حال رفتن به صفحه بعد...');
            let nextBtn = document.querySelector('a.k-pager-next, a[title="صفحه بعد"], a[title="بعدی"]');
            if (!nextBtn) {
                let allAnchors = document.querySelectorAll('a');
                for (let a of allAnchors) {
                    if (a.querySelector('span.k-i-arrow-e') && !a.classList.contains('k-state-disabled')) { nextBtn = a; break; }
                }
            }
            if (nextBtn && !nextBtn.classList.contains('k-state-disabled') && !nextBtn.classList.contains('disabled')) {
                nextBtn.click();
                await sleep(3500);
                if (isRunning) setTimeout(function() { processNextStudent(); }, 0);
            } else {
                isRunning = false;
                updatePanelUI('✅ پایان کار');
                showNotification('استخراج با موفقیت پایان یافت! مجموع: ' + allStudents.length + ' دانش‌آموز.', 0);
            }
        }

        function startExtraction() {
            if (isRunning) { showNotification('عملیات در حال انجام است...'); return; }
            isRunning = true;
            showNotification('شروع استخراج.');
            processNextStudent();
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
                if (sp) {
                    if (sp === fp) fatherDisplay = fp;
                    else if (sp === mp) motherDisplay = mp;
                }
                let contactParts = [];
                if (fatherDisplay) {
                    let label = (sp && sp === fp) ? 'پدر (شاد)' : 'پدر';
                    contactParts.push(label + ': ' + escapeHtml(fatherDisplay));
                }
                if (motherDisplay) {
                    let label = (sp && sp === mp) ? 'مادر (شاد)' : 'مادر';
                    contactParts.push(label + ': ' + escapeHtml(motherDisplay));
                }
                if (sp && sp !== fp && sp !== mp) {
                    contactParts.push('شاد: ' + escapeHtml(sp));
                }
                let contactInfo = contactParts.join('<br>');
                tableRows += '<tr><td style="border:1px solid #999;padding:6px;text-align:center;">' + (i+1) + '</td>' +
                    '<td style="border:1px solid #999;padding:6px;">' + escapeHtml(s.family) + '</td>' +
                    '<td style="border:1px solid #999;padding:6px;">' + escapeHtml(s.name) + '</td>' +
                    '<td style="border:1px solid #999;padding:6px;">' + escapeHtml(s.father) + '</td>' +
                    '<td style="border:1px solid #999;padding:6px;text-align:center;">' + escapeHtml(s.codemelli) + '</td>' +
                    '<td style="border:1px solid #999;padding:6px;text-align:center;">' + escapeHtml(s.birthDate) + '</td>' +
                    '<td style="border:1px solid #999;padding:8px;text-align:right;direction:rtl;line-height:1.8;font-size:10pt;">' + contactInfo + '</td></tr>';
            });
            let html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">' +
                '<head><meta charset="utf-8"><title>مشخصات</title>' +
                '<style>body{font-family:Tahoma,Arial;font-size:11pt;direction:rtl}h2{text-align:center;color:#333}' +
                'table{border-collapse:collapse;width:100%;direction:rtl;margin-top:15px}' +
                'th{background:#4472C4;color:white;padding:8px;border:1px solid #999;text-align:center}td{padding:6px;border:1px solid #999}</style>' +
                '</head><body>' +
                '<h2>لیست کامل مشخصات دانش‌آموزان و شماره‌های تماس</h2>' +
                '<p style="text-align:center;font-weight:bold;">تعداد کل: ' + allStudents.length + ' نفر</p>' +
                '<table><thead><tr><th>ردیف</th><th>نام خانوادگی</th><th>نام</th><th>نام پدر</th><th>کد ملی</th><th>تاریخ تولد</th><th style="width:280px;">شماره‌های تماس</th></tr></thead>' +
                '<tbody>' + tableRows + '</tbody></table></body></html>';
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
            panel.style.cssText = 'position:fixed;top:20px;left:20px;background:white;border:2px solid #8b5cf6;border-radius:10px;padding:15px;width:320px;max-width:90vw;z-index:999999;box-shadow:0 4px 20px rgba(0,0,0,0.2);font-family:Tahoma,sans-serif;direction:rtl;font-size:13px;color:#333;';
            panel.innerHTML = '<div id="aeHeader" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;padding-bottom:10px;border-bottom:2px solid #8b5cf6;user-select:none;"><strong style="color:#8b5cf6;font-size:15px;">📋 استخراج مشخصات</strong><button id="btnClosePanel" style="background:none;border:none;cursor:pointer;font-size:18px;color:#999;">✕</button></div><div style="background:#faf5ff;padding:12px;border-radius:8px;margin-bottom:12px;text-align:center;"><div style="font-size:12px;color:#666;">تعداد دانش‌آموزان استخراج‌شده:</div><div id="aeTotal" style="font-size:28px;font-weight:bold;color:#2e7d32;">0</div><div id="aeStatus" style="font-size:11px;color:#666;margin-top:5px;">آماده شروع...</div></div><div style="display:flex;flex-direction:column;gap:8px;"><div style="display:flex;gap:8px;"><button id="btnStart" style="flex:1;background:#8b5cf6;color:white;border:none;padding:10px;border-radius:6px;cursor:pointer;font-family:inherit;font-weight:bold;">▶️ شروع</button><button id="btnStop" style="flex:1;background:#ef4444;color:white;border:none;padding:10px;border-radius:6px;cursor:pointer;font-family:inherit;font-weight:bold;">⛔ توقف</button></div><button id="btnDownload" style="background:#10b981;color:white;border:none;padding:10px;border-radius:6px;cursor:pointer;font-family:inherit;font-weight:bold;">📥 دانلود Word</button><button id="btnClear" style="background:#fff;color:#c62828;border:1px solid #c62828;padding:8px;border-radius:6px;cursor:pointer;font-family:inherit;font-size:12px;margin-top:5px;">🗑️ پاک‌سازی</button></div><div style="margin-top:10px;font-size:11px;color:#666;text-align:center;border-top:1px solid #eee;padding-top:8px;">⚠️ هنگام اجرا، تب مرورگر را فعال نگه دارید.</div>';
            document.body.appendChild(panel);
            makeDraggable(panel, document.getElementById('aeHeader'));
            makeDraggableByTouch(panel, document.getElementById('aeHeader'));
            
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
            panel.style.cssText = 'position:fixed;top:20px;left:20px;background:white;border:2px solid #4472C4;border-radius:10px;padding:15px;width:300px;max-width:90vw;z-index:999999;box-shadow:0 4px 20px rgba(0,0,0,0.2);font-family:Tahoma,sans-serif;direction:rtl;font-size:13px;color:#333;';
            panel.innerHTML = '<div id="panelHeader" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;border-bottom:1px solid #eee;padding-bottom:10px;user-select:none;"><strong style="color:#4472C4;font-size:15px;">📊 تحلیل نمرات</strong><button id="panelCloseBtn" style="background:none;border:none;cursor:pointer;font-size:18px;color:#999;">✕</button></div><div style="background:#f5f7fa;padding:12px;border-radius:8px;margin-bottom:15px;text-align:center;"><div style="font-size:12px;color:#666;">کل دانش‌آموزان پردازش‌شده:</div><div id="totalProcessed" style="font-size:28px;font-weight:bold;color:#2e7d32;">0</div><div id="panelMsg" style="font-size:11px;color:#666;margin-top:5px;">آماده افزودن صفحات بعدی...</div></div><div style="display:flex;flex-direction:column;gap:10px;"><button id="btnAddPage" style="background:#4472C4;color:white;border:none;padding:10px;border-radius:6px;cursor:pointer;font-family:inherit;font-weight:bold;">➕ افزودن این صفحه به گزارش</button><button id="btnViewReport" style="background:#2e7d32;color:white;border:none;padding:10px;border-radius:6px;cursor:pointer;font-family:inherit;font-weight:bold;">📥 مشاهده و دانلود گزارش نهایی</button><button id="btnClear" style="background:#fff;color:#c62828;border:1px solid #c62828;padding:8px;border-radius:6px;cursor:pointer;font-family:inherit;font-size:12px;margin-top:5px;">🗑️ پاک‌سازی تمام داده‌های جمع‌آوری‌شده</button></div>';
            document.body.appendChild(panel);
            makeDraggable(panel, document.getElementById('panelHeader'));
            makeDraggableByTouch(panel, document.getElementById('panelHeader'));
            
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
            panel.style.cssText = `position:fixed;top:16px;left:50%;transform:translateX(-50%);background:#fff;border:2px solid #0f4c81;border-radius:12px;padding:8px 12px;z-index:999999;box-shadow:0 4px 20px rgba(0,0,0,0.25);font-family:Tahoma,sans-serif;direction:rtl;max-width:95vw;`;
            
            let btns = '';
            grades.forEach(g => {
                btns += `<button class="grade-btn" data-grade="${g.name}" style="padding:8px 14px;margin:0 3px;border:2px solid ${g.color};border-radius:8px;background:white;color:${g.color};cursor:pointer;font-family:inherit;font-size:13px;font-weight:bold;transition:all 0.2s;white-space:nowrap;touch-action:manipulation;">${g.emoji} ${g.name}</button>`;
            });
            
            panel.innerHTML = `<div id="gradePanelHeader" style="text-align:center;margin-bottom:6px;cursor:move;user-select:none;font-size:12px;font-weight:bold;color:#0f4c81;touch-action:none;">📚 انتخاب پایه</div><div style="display:flex;align-items:center;gap:2px;flex-wrap:wrap;justify-content:center;">${btns}<button id="btnCancel" style="padding:8px 10px;margin:0 3px;border:1px solid #ddd;border-radius:8px;background:#f5f5f5;color:#888;cursor:pointer;font-family:inherit;font-size:12px;white-space:nowrap;">✕</button></div>`;
            
            document.body.appendChild(panel);
            
            makeDraggableByTouch(panel, document.getElementById('gradePanelHeader'));
            
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
                
                btn.addEventListener('touchstart', function() {
                    this.style.background = this.style.borderColor;
                    this.style.color = 'white';
                });
                btn.addEventListener('touchend', function() {
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
	    // ==================== ابزار ۱۴: بررسی ملیت والدین ====================
    function nationalityCheckTool() {
        if (document.getElementById('nationalityPanel')) {
            document.getElementById('nationalityPanel').remove();
        }

        cleanupAllPanels();

        const STORAGE_KEY = 'nationality_auto_check_v2';
        const COMPLETED_STUDENTS_KEY = 'nationality_auto_completed';
        const INCOMPLETE_STUDENTS_KEY = 'nationality_auto_incomplete';
        
        let status = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{"completed":[],"current":null,"startRow":1,"failed":[]}');
        let completedStudentsList = JSON.parse(localStorage.getItem(COMPLETED_STUDENTS_KEY) || '[]');
        let incompleteStudentsList = JSON.parse(localStorage.getItem(INCOMPLETE_STUDENTS_KEY) || '[]');
        let isRunning = false, isPaused = false;
        let autoMode = false;
        let columnMapCache = null;

        function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

        function getText(el) {
            return (el.textContent || '').trim();
        }

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
            notif.style.cssText = 'position:fixed;bottom:20px;left:20px;background:#333;color:white;padding:12px 20px;border-radius:8px;z-index:9999999;font-family:Tahoma;font-size:13px;box-shadow:0 4px 12px rgba(0,0,0,0.3);max-width:350px;direction:rtl;';
            notif.textContent = text;
            notif.addEventListener('click', function() { notif.remove(); });
            document.body.appendChild(notif);
            if (duration > 0) setTimeout(function() { if (notif.parentNode) notif.remove(); }, duration);
        }

        function updatePanelUI(studentInfo, statusMsg) {
            studentInfo = studentInfo || '';
            statusMsg = statusMsg || '';
            
            let completedEl = document.getElementById('natCompleted');
            let incompleteEl = document.getElementById('natIncomplete');
            if (completedEl) completedEl.textContent = completedStudentsList.length.toLocaleString('fa-IR');
            if (incompleteEl) incompleteEl.textContent = incompleteStudentsList.length.toLocaleString('fa-IR');
            
            let info = document.getElementById('natCurrentInfo');
            let msg = document.getElementById('natStatusMsg');
            if (info) {
                if (studentInfo) { info.textContent = studentInfo; info.style.display = 'block'; }
                else { info.style.display = 'none'; }
            }
            if (msg) {
                if (statusMsg) { msg.textContent = statusMsg; msg.style.color = isPaused ? '#ef4444' : (isRunning ? '#4472C4' : '#666'); }
                else { msg.textContent = 'آماده شروع...'; msg.style.color = '#666'; }
            }
            
            let continueBtn = document.getElementById('btnContinue');
            if (continueBtn) {
                continueBtn.disabled = !status.current;
                continueBtn.style.opacity = status.current ? '1' : '0.5';
                continueBtn.style.cursor = status.current ? 'pointer' : 'not-allowed';
            }
            
            let skipBtn = document.getElementById('btnSkip');
            if (skipBtn) {
                skipBtn.disabled = !status.current;
                skipBtn.style.opacity = status.current ? '1' : '0.5';
                skipBtn.style.cursor = status.current ? 'pointer' : 'not-allowed';
            }
            
            let reportBtn = document.getElementById('btnReport');
            if (reportBtn) {
                const hasData = completedStudentsList.length > 0 || incompleteStudentsList.length > 0;
                reportBtn.disabled = !hasData;
                reportBtn.style.opacity = hasData ? '1' : '0.5';
                reportBtn.style.cursor = hasData ? 'pointer' : 'not-allowed';
            }
        }

        function saveStatus() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(status)); } catch (e) {} }
        function saveCompletedStudentsList() { try { localStorage.setItem(COMPLETED_STUDENTS_KEY, JSON.stringify(completedStudentsList)); } catch (e) {} }
        function saveIncompleteStudentsList() { try { localStorage.setItem(INCOMPLETE_STUDENTS_KEY, JSON.stringify(incompleteStudentsList)); } catch (e) {} }

        function addToCompletedList(student) {
            if (!completedStudentsList.some(s => s.codemelli === student.codemelli)) {
                completedStudentsList.push({
                    codemelli: student.codemelli,
                    name: student.name,
                    family: student.family,
                    rowNum: student.rowNum || 0,
                    date: new Date().toLocaleDateString('fa-IR'),
                    time: new Date().toLocaleTimeString('fa-IR')
                });
                saveCompletedStudentsList();
            }
            incompleteStudentsList = incompleteStudentsList.filter(s => s.codemelli !== student.codemelli);
            saveIncompleteStudentsList();
        }

        function addToIncompleteList(student) {
            if (!incompleteStudentsList.some(s => s.codemelli === student.codemelli)) {
                incompleteStudentsList.push({
                    codemelli: student.codemelli,
                    name: student.name,
                    family: student.family,
                    rowNum: student.rowNum || 0,
                    date: new Date().toLocaleDateString('fa-IR'),
                    time: new Date().toLocaleTimeString('fa-IR')
                });
                saveIncompleteStudentsList();
            }
            completedStudentsList = completedStudentsList.filter(s => s.codemelli !== student.codemelli);
            saveCompletedStudentsList();
        }

        function getColumnMap() {
            if (columnMapCache) return columnMapCache;
            const map = { code: -1, name: -1, family: -1 };
            const headers = document.querySelectorAll('table thead th, table thead td');
            const headerTexts = [];
            for (let i = 0; i < headers.length; i++) headerTexts.push(getText(headers[i]));
            for (let i = 0; i < headerTexts.length; i++) {
                const text = headerTexts[i];
                if (!text) continue;
                if (map.code === -1 && text.includes('کد') && (text.includes('ملی') || text.includes('دانش'))) map.code = i;
                else if (map.family === -1 && (text.includes('نام خانوادگی') || text.includes('نام‌خانوادگی') || text.includes('فامیل'))) map.family = i;
                else if (map.name === -1 && (text === 'نام' || (text.includes('نام') && !text.includes('خانوادگی') && !text.includes('پدر')))) map.name = i;
            }
            if (map.code === -1) map.code = 2;
            if (map.name === -1) map.name = 3;
            if (map.family === -1) map.family = 4;
            columnMapCache = map;
            return map;
        }

        function getRowNumber(row) {
            let cols = row.querySelectorAll('td');
            let rowNumCell = null;
            for (let td of cols) {
                if (td.classList && td.classList.contains('column-row-number')) { rowNumCell = td; break; }
            }
            if (!rowNumCell && cols.length > 0) rowNumCell = cols[0];
            if (rowNumCell) {
                let num = parseInt(getText(rowNumCell));
                if (!isNaN(num)) return num;
            }
            return null;
        }

        function getNextStudent() {
            const col = getColumnMap();
            let rows = document.querySelectorAll('table tbody tr');
            let startRowNum = status.startRow || 1;
            let candidates = [];
            for (let row of rows) {
                let cols = row.querySelectorAll('td');
                if (cols.length <= Math.max(col.code, col.name, col.family)) continue;
                let rowNum = getRowNumber(row);
                let codemelli = col.code >= 0 && cols[col.code] ? getText(cols[col.code]) : '';
                let name = col.name >= 0 && cols[col.name] ? getText(cols[col.name]) : '';
                let family = col.family >= 0 && cols[col.family] ? getText(cols[col.family]) : '';
                const isCompleted = completedStudentsList.some(s => s.codemelli === codemelli);
                const isIncomplete = incompleteStudentsList.some(s => s.codemelli === codemelli);
                const isFailed = status.failed.includes(codemelli);
                if (codemelli && !isCompleted && !isIncomplete && !isFailed) {
                    candidates.push({ row: row, rowNum: rowNum, codemelli: codemelli, name: name, family: family });
                }
            }
            candidates.sort(function(a, b) { return (a.rowNum || 9999) - (b.rowNum || 9999); });
            for (let s of candidates) {
                if (s.rowNum && s.rowNum >= startRowNum) return s;
            }
            return candidates.length > 0 ? candidates[0] : null;
        }

        function getFieldByLabel(labelText) {
            let labels = document.querySelectorAll('label');
            for (let label of labels) {
                const text = getText(label);
                if (text.includes(labelText)) {
                    let parent = label.parentElement;
                    if (parent) {
                        let field = parent.querySelector('input.k-input, input.comboBox-main');
                        if (field) return field;
                    }
                    
                    if (labelText.includes('پدر')) {
                        let inputs = document.querySelectorAll('input[ng-model*="fatherNationality"]');
                        if (inputs.length > 0) return inputs[0];
                    }
                    
                    if (labelText.includes('مادر')) {
                        let inputs = document.querySelectorAll('input[ng-model*="motherNationality"]');
                        if (inputs.length > 0) return inputs[0];
                    }
                }
            }
            return null;
        }

        async function selectIran(field) {
            if (!field) return false;
            
            let kendoWidget = field.closest('.k-combobox, .k-widget');
            if (!kendoWidget && field.tagName === 'INPUT') {
                kendoWidget = field.parentElement;
                while (kendoWidget && !kendoWidget.classList.contains('k-widget')) {
                    kendoWidget = kendoWidget.parentElement;
                }
            }
            
            if (kendoWidget) {
                let inputElement = kendoWidget.querySelector('input.k-input') || field;
                
                if (inputElement) {
                    inputElement.value = '';
                    inputElement.dispatchEvent(new Event('input', { bubbles: true }));
                    
                    inputElement.click();
                    await sleep(100);
                    
                    let options = document.querySelectorAll('.k-list-container .k-item, .k-animation-container .k-item, .k-popup .k-item, .k-list .k-item, li.k-item');
                    
                    for (let option of options) {
                        const text = getText(option);
                        if (text === 'ایران' || text === 'ایران ') {
                            option.click();
                            await sleep(50);
                            
                            if (inputElement.value && (inputElement.value.includes('ایران') || inputElement.value.includes('Iran'))) {
                                return true;
                            }
                        }
                    }
                }
            }
            
            return false;
        }

        function clickEstelamButton(type) {
            let buttons = document.querySelectorAll('button');
            for (let btn of buttons) {
                const ngClick = btn.getAttribute('ng-click');
                if (ngClick && ngClick.includes('estelamParent(' + type + ')')) {
                    btn.click();
                    return true;
                }
            }
            return false;
        }

        function checkSuccessMessage() {
            let allElements = document.querySelectorAll('div, span, p, .k-notification, .alert, .toast');
            for (let el of allElements) {
                const text = getText(el);
                if (text.includes('عملیات با موفقیت انجام شد') && el.offsetParent !== null) return true;
            }
            return false;
        }

        async function clearOldNotifications() {
            let notifications = document.querySelectorAll('.k-notification, .alert, .toast, [class*="notification"]');
            for (let notif of notifications) {
                if (notif.offsetParent !== null) {
                    let closeBtn = notif.querySelector('.k-notification-close, .close, [data-dismiss]');
                    if (closeBtn) closeBtn.click();
                    else notif.remove();
                }
            }
            await sleep(100);
        }

        function closeModal() {
            let cancelBtn = Array.from(document.querySelectorAll('button')).find(function(btn) {
                return btn.textContent.trim().includes('انصراف') || (btn.getAttribute('ng-click') && btn.getAttribute('ng-click').includes('cancel'));
            });
            if (cancelBtn) { cancelBtn.click(); return true; }
            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', keyCode: 27, which: 27, bubbles: true }));
            return false;
        }

        function getFieldValue(labelText) {
            let labels = document.querySelectorAll('label');
            for (let label of labels) {
                const labelTextContent = getText(label);
                if (labelTextContent === labelText || labelTextContent.includes(labelText)) {
                    let forAttr = label.getAttribute('for');
                    if (forAttr) {
                        let field = document.querySelector('#' + forAttr);
                        if (field) {
                            if (field.tagName === 'SELECT') {
                                let selectedOption = field.options[field.selectedIndex];
                                return selectedOption ? getText(selectedOption) : '';
                            }
                            if (field.tagName === 'INPUT') return field.value.trim();
                        }
                    }
                    let parent = label.parentElement;
                    if (parent) {
                        let field = parent.querySelector('select, input');
                        if (field) {
                            if (field.tagName === 'SELECT') {
                                let selectedOption = field.options[field.selectedIndex];
                                return selectedOption ? getText(selectedOption) : '';
                            }
                            if (field.tagName === 'INPUT') return field.value.trim();
                        }
                    }
                }
            }
            return '';
        }

        async function autoProcessParent(labelText, type) {
            let currentValue = getFieldValue(labelText);
            if (currentValue && currentValue !== '' && !currentValue.includes('انتخاب')) {
                return true;
            }
            
            let field = getFieldByLabel(labelText);
            if (!field) return false;
            
            let selected = await selectIran(field);
            if (!selected) return false;
            
            for (let attempt = 1; attempt <= 10; attempt++) {
                await clearOldNotifications();
                clickEstelamButton(type);
                await sleep(2000);
                if (checkSuccessMessage()) {
                    await clearOldNotifications();
                    return true;
                }
            }
            return false;
        }

        async function checkNationality() {
            if (!isRunning || isPaused) return;
            
            let student = getNextStudent();
            if (!student) { await goToNextPage(); return; }
            
            updatePanelUI(student.name + ' ' + student.family + ' (ردیف ' + student.rowNum + ')', autoMode ? 'در حال تکمیل خودکار...' : 'در حال بررسی...');
            
            try {
                let editBtn = student.row.querySelector('a.k-grid-edit');
                if (!editBtn) throw new Error('دکمه ویرایش یافت نشد');
                
                editBtn.click();
                await sleep(1800);
                if (!isRunning || isPaused) return;
                
                let parentTab = Array.from(document.querySelectorAll('a.nav-link,a[ng-click*="select"]')).find(function(el) {
                    return el.textContent.includes('والدین') || el.textContent.includes('اولیا') || el.textContent.includes('آدرس و تماس');
                });
                if (parentTab) { parentTab.click(); await sleep(1000); if (!isRunning || isPaused) return; }
                
                if (autoMode) {
                    let fatherNat = getFieldValue('ملیت پدر');
                    let motherNat = getFieldValue('ملیت مادر');
                    
                    if (fatherNat && motherNat && fatherNat !== '' && motherNat !== '' && 
                        !fatherNat.includes('انتخاب') && !motherNat.includes('انتخاب')) {
                        addToCompletedList(student);
                        status.completed.push(student.codemelli);
                        saveStatus();
                        closeModal();
                        await sleep(2000);
                        if (isRunning && !isPaused) setTimeout(function() { checkNationality(); }, 0);
                        return;
                    }
                    
                    let fatherSuccess = true;
                    let motherSuccess = true;
                    
                    if (!fatherNat || fatherNat === '' || fatherNat.includes('انتخاب')) {
                        fatherSuccess = await autoProcessParent('ملیت پدر', 1);
                    }
                    
                    if (!fatherSuccess) {
                        addToIncompleteList(student);
                        status.completed.push(student.codemelli);
                        status.current = null;
                        saveStatus();
                        closeModal();
                        await sleep(2000);
                        if (isRunning && !isPaused) setTimeout(function() { checkNationality(); }, 0);
                        return;
                    }
                    
                    await sleep(500);
                    
                    if (!motherNat || motherNat === '' || motherNat.includes('انتخاب')) {
                        motherSuccess = await autoProcessParent('ملیت مادر', 2);
                    }
                    
                    if (motherSuccess) {
                        addToCompletedList(student);
                    } else {
                        addToIncompleteList(student);
                    }
                    
                    status.completed.push(student.codemelli);
                    status.current = null;
                    saveStatus();
                    closeModal();
                    await sleep(2000);
                    
                    if (isRunning && !isPaused) setTimeout(function() { checkNationality(); }, 0);
                    
                } else {
                    let fatherNat = getFieldValue('ملیت پدر');
                    let motherNat = getFieldValue('ملیت مادر');
                    
                    if (!fatherNat || !motherNat) {
                        isPaused = true;
                        status.current = { codemelli: student.codemelli, name: student.name, family: student.family, rowNum: student.rowNum };
                        saveStatus();
                        
                        let missing = [];
                        if (!fatherNat) missing.push('ملیت پدر');
                        if (!motherNat) missing.push('ملیت مادر');
                        
                        updatePanelUI('⚠️ ' + student.name + ' ' + student.family + ' (ردیف ' + student.rowNum + ')', 'فیلد(های) خالی: ' + missing.join(' و ') + '\nلطفاً تکمیل کنید و دکمه "ادامه" را بزنید.');
                        showNotification('⚠️ ' + student.name + ' ' + student.family + ': ' + missing.join(' و ') + ' خالی است!', 0);
                        return;
                    }
                    
                    closeModal();
                    await sleep(2500);
                    if (!isRunning || isPaused) return;
                    
                    addToCompletedList(student);
                    status.completed.push(student.codemelli);
                    saveStatus();
                    updatePanelUI();
                    
                    if (isRunning && !isPaused) setTimeout(function() { checkNationality(); }, 0);
                }
                
            } catch (err) {
                console.error('خطا:', err);
                if (student && student.codemelli) {
                    status.failed.push(student.codemelli);
                    saveStatus();
                }
                closeModal();
                await sleep(2000);
                if (isRunning && !isPaused) setTimeout(function() { checkNationality(); }, 0);
            }
        }

        async function goToNextPage() {
            if (!isRunning || isPaused) return;
            updatePanelUI('', 'در حال رفتن به صفحه بعد...');
            let nextBtn = document.querySelector('a.k-pager-next, a[title="صفحه بعد"], a[title="بعدی"]');
            if (!nextBtn) {
                let allAnchors = document.querySelectorAll('a');
                for (let a of allAnchors) {
                    if (a.querySelector('span.k-i-arrow-e') && !a.classList.contains('k-state-disabled')) { nextBtn = a; break; }
                }
            }
            if (nextBtn && !nextBtn.classList.contains('k-state-disabled') && !nextBtn.classList.contains('disabled')) {
                nextBtn.click();
                await sleep(3500);
                if (!isRunning || isPaused) return;
                saveStatus();
                if (isRunning && !isPaused) setTimeout(function() { checkNationality(); }, 0);
            } else {
                isRunning = false;
                updatePanelUI('', '✅ پایان کار');
                showNotification('بررسی کامل شد!', 0);
            }
        }

        function startCheck() {
            if (isRunning) { showNotification('عملیات در حال انجام است...'); return; }
            isRunning = true;
            isPaused = false;
            autoMode = false;
            showNotification('شروع بررسی ملیت والدین...');
            checkNationality();
        }

        function startAutoCheck() {
            if (isRunning) { showNotification('عملیات در حال انجام است...'); return; }
            isRunning = true;
            isPaused = false;
            autoMode = true;
            showNotification('شروع تکمیل خودکار ملیت والدین...');
            checkNationality();
        }

        function stopCheck() {
            if (isRunning) {
                isRunning = false;
                isPaused = false;
                autoMode = false;
                showNotification('متوقف شد.');
                updatePanelUI('', 'متوقف شد');
            }
        }

        function continueAfterFill() {
            if (!status.current) { showNotification('هیچ دانش‌آموزی در حالت انتظار نیست.'); return; }
            let fatherNat = getFieldValue('ملیت پدر');
            let motherNat = getFieldValue('ملیت مادر');
            if (!fatherNat || !motherNat) {
                let missing = [];
                if (!fatherNat) missing.push('ملیت پدر');
                if (!motherNat) missing.push('ملیت مادر');
                showNotification('⚠️ هنوز فیلد(های) ' + missing.join(' و ') + ' خالی است!');
                return;
            }
            addToCompletedList(status.current);
            status.completed.push(status.current.codemelli);
            status.current = null;
            saveStatus();
            closeModal();
            showNotification('ادامه بررسی...');
            updatePanelUI();
            setTimeout(function() { isPaused = false; if (isRunning) checkNationality(); }, 2500);
        }

        function skipCurrentStudent() {
            if (!status.current) { showNotification('هیچ دانش‌آموزی در حالت انتظار نیست.'); return; }
            addToIncompleteList(status.current);
            status.completed.push(status.current.codemelli);
            status.current = null;
            saveStatus();
            closeModal();
            showNotification('⏭️ دانش‌آموز به لیست تکمیل نشده اضافه شد. ادامه بررسی...');
            updatePanelUI();
            setTimeout(function() { isPaused = false; if (isRunning) checkNationality(); }, 2500);
        }

        function showFinalReport() {
            if (completedStudentsList.length === 0 && incompleteStudentsList.length === 0) {
                alert('هنوز داده‌ای برای گزارش وجود ندارد.');
                return;
            }
            
            let overlay = document.createElement('div');
            overlay.id = 'nationalityReportOverlay';
            overlay.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(245,247,250,0.98);z-index:999999;display:flex;flex-direction:column;align-items:center;font-family:Tahoma,sans-serif;direction:rtl;overflow-y:auto;padding:40px 20px;box-sizing:border-box;';
            
            let html = '<div style="width:100%;max-width:800px;background:white;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,0.1);padding:30px;border:1px solid #e0e0e0;">';
            html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:25px;border-bottom:2px solid #f59e0b;padding-bottom:15px;"><h2 style="margin:0;color:#333;font-size:22px;">📋 گزارش ملیت والدین</h2><button id="closeReportBtn" style="background:#f44336;color:white;border:none;width:36px;height:36px;border-radius:50%;cursor:pointer;font-size:20px;">✕</button></div>';
            html += '<div style="display:flex;justify-content:space-around;margin-bottom:25px;padding:15px;background:#fef3c7;border-radius:8px;flex-wrap:wrap;gap:10px;">';
            html += '<div style="text-align:center;"><div style="font-size:11px;color:#666;">تکمیل شده</div><div style="font-size:24px;font-weight:bold;color:#2e7d32;">' + completedStudentsList.length + '</div></div>';
            html += '<div style="text-align:center;"><div style="font-size:11px;color:#666;">تکمیل نشده</div><div style="font-size:24px;font-weight:bold;color:#ef4444;">' + incompleteStudentsList.length + '</div></div>';
            html += '<div style="text-align:center;"><div style="font-size:11px;color:#666;">مجموع</div><div style="font-size:24px;font-weight:bold;color:#4472C4;">' + (completedStudentsList.length + incompleteStudentsList.length) + '</div></div>';
            html += '</div>';
            
            html += '<h3 style="color:#2e7d32;margin-bottom:10px;">✅ تکمیل شده (' + completedStudentsList.length + ')</h3>';
            if (completedStudentsList.length > 0) {
                html += '<div style="overflow-x:auto;margin-bottom:25px;"><table style="width:100%;border-collapse:collapse;font-size:13px;text-align:center;"><thead><tr style="background:#2e7d32;color:white;"><th>ردیف</th><th>نام خانوادگی</th><th>نام</th><th>کد ملی</th></tr></thead><tbody>';
                completedStudentsList.forEach((student, index) => {
                    html += '<tr style="background:' + (index % 2 === 0 ? '#fff' : '#e8f5e9') + ';">';
                    html += '<td style="padding:6px;border:1px solid #ddd;">' + (index + 1) + '</td>';
                    html += '<td style="padding:6px;border:1px solid #ddd;">' + escapeHtml(student.family) + '</td>';
                    html += '<td style="padding:6px;border:1px solid #ddd;">' + escapeHtml(student.name) + '</td>';
                    html += '<td style="padding:6px;border:1px solid #ddd;direction:ltr;">' + escapeHtml(student.codemelli) + '</td>';
                    html += '</tr>';
                });
                html += '</tbody></table></div>';
            } else {
                html += '<p style="text-align:center;color:#888;margin-bottom:25px;">هیچ دانش‌آموزی تکمیل نشده است.</p>';
            }
            
            html += '<h3 style="color:#ef4444;margin-bottom:10px;">❌ تکمیل نشده (' + incompleteStudentsList.length + ')</h3>';
            if (incompleteStudentsList.length > 0) {
                html += '<div style="overflow-x:auto;margin-bottom:25px;"><table style="width:100%;border-collapse:collapse;font-size:13px;text-align:center;"><thead><tr style="background:#ef4444;color:white;"><th>ردیف</th><th>نام خانوادگی</th><th>نام</th><th>کد ملی</th></tr></thead><tbody>';
                incompleteStudentsList.forEach((student, index) => {
                    html += '<tr style="background:' + (index % 2 === 0 ? '#fff' : '#ffebee') + ';">';
                    html += '<td style="padding:6px;border:1px solid #ddd;">' + (index + 1) + '</td>';
                    html += '<td style="padding:6px;border:1px solid #ddd;">' + escapeHtml(student.family) + '</td>';
                    html += '<td style="padding:6px;border:1px solid #ddd;">' + escapeHtml(student.name) + '</td>';
                    html += '<td style="padding:6px;border:1px solid #ddd;direction:ltr;">' + escapeHtml(student.codemelli) + '</td>';
                    html += '</tr>';
                });
                html += '</tbody></table></div>';
            } else {
                html += '<p style="text-align:center;color:#888;margin-bottom:25px;">همه تکمیل شده‌اند.</p>';
            }
            
            html += '<div style="margin-top:25px;display:flex;gap:15px;justify-content:center;flex-wrap:wrap;"><button id="btnDownloadReport" style="background:#2e7d32;color:white;border:none;padding:12px 25px;border-radius:8px;cursor:pointer;font-family:inherit;font-weight:bold;font-size:15px;">📥 دانلود Word</button><button id="btnCopyReport" style="background:#6c8cff;color:white;border:none;padding:12px 25px;border-radius:8px;cursor:pointer;font-family:inherit;font-weight:bold;font-size:15px;">📋 کپی</button><button id="closeReportBtn2" style="background:#757575;color:white;border:none;padding:12px 25px;border-radius:8px;cursor:pointer;font-family:inherit;font-weight:bold;font-size:15px;">بستن</button></div></div>';
            
            overlay.innerHTML = html;
            document.body.appendChild(overlay);
            
            document.getElementById('closeReportBtn').addEventListener('click', function() { overlay.remove(); });
            document.getElementById('closeReportBtn2').addEventListener('click', function() { overlay.remove(); });
            
            document.getElementById('btnDownloadReport').addEventListener('click', function() {
                let wordHtml = '<html><head><meta charset="utf-8"><title>گزارش ملیت</title><style>body{font-family:Tahoma;direction:rtl;}table{border-collapse:collapse;width:100%;}th,td{border:1px solid #999;padding:8px;text-align:center;}</style></head><body><h2>گزارش ملیت والدین</h2>';
                wordHtml += '<h3>تکمیل شده (' + completedStudentsList.length + ')</h3><table><tr><th>ردیف</th><th>نام خانوادگی</th><th>نام</th><th>کد ملی</th></tr>';
                completedStudentsList.forEach((s, i) => { wordHtml += '<tr><td>' + (i+1) + '</td><td>' + escapeHtml(s.family) + '</td><td>' + escapeHtml(s.name) + '</td><td>' + escapeHtml(s.codemelli) + '</td></tr>'; });
                wordHtml += '</table>';
                wordHtml += '<h3>تکمیل نشده (' + incompleteStudentsList.length + ')</h3><table><tr><th>ردیف</th><th>نام خانوادگی</th><th>نام</th><th>کد ملی</th></tr>';
                incompleteStudentsList.forEach((s, i) => { wordHtml += '<tr><td>' + (i+1) + '</td><td>' + escapeHtml(s.family) + '</td><td>' + escapeHtml(s.name) + '</td><td>' + escapeHtml(s.codemelli) + '</td></tr>'; });
                wordHtml += '</table></body></html>';
                
                let blob = new Blob(['\ufeff' + wordHtml], { type: 'application/msword' });
                let link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = 'گزارش_ملیت_والدین.doc';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(link.href);
            });
            
            document.getElementById('btnCopyReport').addEventListener('click', function() {
                let text = '📋 گزارش ملیت والدین\n\n';
                text += 'تکمیل شده: ' + completedStudentsList.length + '\n';
                text += 'تکمیل نشده: ' + incompleteStudentsList.length + '\n\n';
                text += '✅ تکمیل شده:\n';
                completedStudentsList.forEach((s, i) => { text += (i+1) + '. ' + s.name + ' ' + s.family + ' (' + s.codemelli + ')\n'; });
                text += '\n❌ تکمیل نشده:\n';
                incompleteStudentsList.forEach((s, i) => { text += (i+1) + '. ' + s.name + ' ' + s.family + ' (' + s.codemelli + ')\n'; });
                navigator.clipboard.writeText(text).then(function() { alert('✅ کپی شد!'); }).catch(function() { alert('❌ کپی نشد'); });
            });
        }

        function clearMemory() {
            if (confirm('آیا مطمئن هستید؟')) {
                localStorage.removeItem(STORAGE_KEY);
                localStorage.removeItem(COMPLETED_STUDENTS_KEY);
                localStorage.removeItem(INCOMPLETE_STUDENTS_KEY);
                status = { completed: [], current: null, startRow: 1, failed: [] };
                completedStudentsList = [];
                incompleteStudentsList = [];
                document.getElementById('rowNumberInput').value = '1';
                columnMapCache = null;
                updatePanelUI();
                showNotification('وضعیت پاک شد.');
            }
        }

        function setStartRow() {
            let rowNum = parseInt(document.getElementById('rowNumberInput').value);
            if (isNaN(rowNum) || rowNum < 1) { showNotification('شماره ردیف معتبر وارد کنید'); return; }
            status.startRow = rowNum;
            saveStatus();
            showNotification('شروع از ردیف ' + rowNum + ' تنظیم شد');
        }

        function makeDraggable(elmnt, handle) {
            let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
            handle.style.cursor = 'grab';
            handle.onmousedown = function(e) {
                e.preventDefault();
                pos3 = e.clientX; pos4 = e.clientY;
                document.onmouseup = function() { document.onmouseup = null; document.onmousemove = null; };
                document.onmousemove = function(e) {
                    e.preventDefault();
                    pos1 = pos3 - e.clientX; pos2 = pos4 - e.clientY;
                    pos3 = e.clientX; pos4 = e.clientY;
                    elmnt.style.top = (elmnt.offsetTop - pos2) + 'px';
                    elmnt.style.left = (elmnt.offsetLeft - pos1) + 'px';
                };
            };
        }

        let panel = document.createElement('div');
        panel.id = 'nationalityPanel';
        panel.style.cssText = 'position:fixed;top:20px;left:20px;background:white;border:2px solid #f59e0b;border-radius:10px;padding:15px;width:360px;max-width:90vw;z-index:999999;box-shadow:0 4px 20px rgba(0,0,0,0.2);font-family:Tahoma,sans-serif;direction:rtl;font-size:13px;color:#333;';
        panel.innerHTML = '<div id="natHeader" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;padding-bottom:10px;border-bottom:2px solid #f59e0b;user-select:none;"><strong style="color:#f59e0b;font-size:15px;">🔍 بررسی ملیت والدین</strong><button id="btnClose" style="background:none;border:none;cursor:pointer;font-size:18px;color:#999;">✕</button></div><div style="background:#fef3c7;padding:12px;border-radius:8px;margin-bottom:12px;text-align:center;"><div style="display:flex;justify-content:space-around;"><div><div style="font-size:11px;color:#666;">تکمیل</div><div id="natCompleted" style="font-size:22px;font-weight:bold;color:#2e7d32;">0</div></div><div><div style="font-size:11px;color:#666;">تکمیل نشده</div><div id="natIncomplete" style="font-size:22px;font-weight:bold;color:#ef4444;">0</div></div></div><div id="natCurrentInfo" style="font-size:12px;color:#ef4444;margin-top:8px;font-weight:bold;display:none;"></div><div id="natStatusMsg" style="font-size:11px;color:#666;margin-top:5px;">آماده شروع...</div></div><div style="display:flex;gap:6px;margin-bottom:10px;align-items:center;"><label style="font-size:12px;color:#333;white-space:nowrap;">شروع از ردیف:</label><input id="rowNumberInput" type="number" min="1" value="1" style="width:60px;padding:6px;border:1px solid #ccc;border-radius:4px;text-align:center;font-size:13px;"><button id="btnSetRow" style="flex:1;background:#6c8cff;color:white;border:none;padding:6px 10px;border-radius:6px;cursor:pointer;font-family:inherit;font-weight:bold;font-size:12px;">🔢 تنظیم</button></div><div style="display:flex;flex-direction:column;gap:8px;"><div style="display:flex;gap:8px;"><button id="btnStart" style="flex:1;background:#f59e0b;color:white;border:none;padding:10px;border-radius:6px;cursor:pointer;font-family:inherit;font-weight:bold;">▶️ شروع بررسی</button><button id="btnAutoStart" style="flex:1;background:#10b981;color:white;border:none;padding:10px;border-radius:6px;cursor:pointer;font-family:inherit;font-weight:bold;">⚡ تکمیل خودکار</button></div><div style="display:flex;gap:8px;"><button id="btnStop" style="flex:1;background:#ef4444;color:white;border:none;padding:10px;border-radius:6px;cursor:pointer;font-family:inherit;font-weight:bold;">⛔ توقف</button></div><button id="btnContinue" style="background:#10b981;color:white;border:none;padding:10px;border-radius:6px;cursor:not-allowed;font-family:inherit;font-weight:bold;opacity:0.5;" disabled>✅ تکمیل کردم - ادامه بده</button><button id="btnSkip" style="background:#ff9800;color:white;border:none;padding:10px;border-radius:6px;cursor:not-allowed;font-family:inherit;font-weight:bold;opacity:0.5;" disabled>⏭️ تکمیل نشد - ادامه بده</button><button id="btnReport" style="background:#6c8cff;color:white;border:none;padding:10px;border-radius:6px;cursor:not-allowed;font-family:inherit;font-weight:bold;opacity:0.5;" disabled>📋 گزارش نهایی</button><button id="btnClear" style="background:#fff;color:#c62828;border:1px solid #c62828;padding:8px;border-radius:6px;cursor:pointer;font-family:inherit;font-size:12px;margin-top:5px;">🗑️ پاک‌سازی وضعیت</button></div><div style="margin-top:10px;font-size:11px;color:#666;text-align:center;border-top:1px solid #eee;padding-top:8px;">⚠️ هنگام اجرا، تب مرورگر را فعال نگه دارید.</div>';
        document.body.appendChild(panel);
        makeDraggable(panel, document.getElementById('natHeader'));
        makeDraggableByTouch(panel, document.getElementById('natHeader'));
        
        document.getElementById('btnClose').addEventListener('click', function() { panel.remove(); });
        document.getElementById('btnStart').addEventListener('click', startCheck);
        document.getElementById('btnAutoStart').addEventListener('click', startAutoCheck);
        document.getElementById('btnStop').addEventListener('click', stopCheck);
        document.getElementById('btnContinue').addEventListener('click', continueAfterFill);
        document.getElementById('btnSkip').addEventListener('click', skipCurrentStudent);
        document.getElementById('btnReport').addEventListener('click', showFinalReport);
        document.getElementById('btnClear').addEventListener('click', clearMemory);
        document.getElementById('btnSetRow').addEventListener('click', setStartRow);
        document.getElementById('rowNumberInput').value = status.startRow || 1;
        
        updatePanelUI();
        showNotification('پنل آماده است.');
    }
    createMobileDashboard();
    setInterval(createMobileDashboard, 2000);
})();

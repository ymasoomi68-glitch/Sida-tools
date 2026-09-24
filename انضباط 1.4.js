// ==UserScript==
// @name         📓 دفتر انضباطی دانش‌آموزان
// @namespace    http://tampermonkey.net/
// @version      1.4
// @description  دفتر انضباطی A4 - همهٔ دانش‌آموزان یا به تفکیک کلاس
// @author       یوسف معصومی
// @match        https://sida.medu.ir/*
// @updateURL    https://raw.githubusercontent.com/ymasoomi68-glitch/Sida-tools/main/discipline-notebook.user.js
// @downloadURL  https://raw.githubusercontent.com/ymasoomi68-glitch/Sida-tools/main/discipline-notebook.user.js
// @grant        GM_getValue
// @grant        GM_setValue
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    function disciplineNotebookTool() {
        var oldPanel = document.getElementById('disciplinePanel');
        if (oldPanel) oldPanel.remove();
        var oldBtn = document.getElementById('discToggleBtn');
        if (oldBtn) oldBtn.remove();

        (function() {
            var panelIds = [
                'autoExtractPanel', 'uploadPanel', 'collectPanel', 'collectAssignPanel',
                'freeStudentPanel', 'multiPageExtractPanel', 'extractPanel',
                'gradeCollectorPanel', 'gradePanel', 'nationalityPanel', 'pasteFromBinaPanel'
            ];
            panelIds.forEach(function(id) {
                var p = document.getElementById(id);
                if (p) p.remove();
            });
        })();

        const STORAGE_KEY = 'discipline_notebook_data_v1';
        const STORAGE_KEY_CLASSES = 'discipline_notebook_classes_v1';
        let allStudents = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        let classesData = JSON.parse(localStorage.getItem(STORAGE_KEY_CLASSES) || '[]');
        let isRunning = false;

        function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

        function escapeHtml(text) {
            if (!text) return '';
            var d = document.createElement('div');
            d.textContent = text;
            return d.innerHTML;
        }

        function toPersianNum(n) {
            try { return Number(n).toLocaleString('fa-IR', { useGrouping: false }); }
            catch(e) { return String(n); }
        }

        function showNotification(text, duration) {
            if (duration === undefined) duration = 4000;
            var old = document.getElementById('discNotif');
            if (old) old.remove();
            var n = document.createElement('div');
            n.id = 'discNotif';
            n.style.cssText = 'position:fixed;bottom:20px;left:20px;background:#333;color:white;padding:12px 20px;border-radius:8px;z-index:9999999;font-family:Tahoma;font-size:13px;box-shadow:0 4px 12px rgba(0,0,0,0.3);max-width:350px;direction:rtl;';
            n.textContent = text;
            n.addEventListener('click', function() { n.remove(); });
            document.body.appendChild(n);
            if (duration > 0) setTimeout(function() { if (n.parentNode) n.remove(); }, duration);
        }

        function makeDraggable(elmnt, handle, onClick) {
            var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
            var startX = 0, startY = 0;
            handle.style.cursor = 'grab';
            handle.onmousedown = function(e) {
                if (e.target.id === 'btnHelp' || e.target.id === 'btnClosePanel') return;
                e = e || window.event; e.preventDefault();
                startX = e.clientX; startY = e.clientY;
                pos3 = e.clientX; pos4 = e.clientY;
                document.onmouseup = function(ev) {
                    document.onmouseup = null;
                    document.onmousemove = null;
                    handle.style.cursor = 'grab';
                    if (onClick && ev) {
                        var dx = Math.abs(ev.clientX - startX);
                        var dy = Math.abs(ev.clientY - startY);
                        if (dx < 5 && dy < 5) onClick();
                    }
                };
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

        function normalizePhone(val) {
            if (val === null || val === undefined || val === '') return '';
            var s = String(val).trim().replace(/[^\d]/g, '');
            if (s.length === 10 && s.charAt(0) === '9') s = '0' + s;
            return s;
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

        function getGridFilter() {
            try {
                var g = document.querySelector('.k-grid');
                if (!g) return null;
                var grid = $(g).data('kendoGrid');
                if (!grid) return null;
                return grid.dataSource.filter();
            } catch (e) { return null; }
        }

        // ============================================================
        //  🔌 API - دریافت دانش‌آموزان (با فیلتر اختیاری)
        // ============================================================
        async function fetchStudents(customFilter) {
            var pageSize = 500, page = 1, allFetched = [], total = 0, hasMore = true;
            var token = getToken();
            if (!token) { showNotification('❌ توکن پیدا نشد.'); return []; }
            var clientId = getClientId();

            while (hasMore && isRunning) {
                try {
                    var body = { take: pageSize, skip: (page - 1) * pageSize, page: page, pageSize: pageSize, sort: [{ field: 'id', dir: 'asc' }] };
                    if (customFilter) body.filter = customFilter;

                    var response = await fetch('/api/Student/GetStudentInfo', {
                        method: 'POST', credentials: 'include',
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
                    if (!Array.isArray(items) || items.length === 0) { hasMore = false; break; }
                    if (json.data && json.data.total) total = json.data.total;
                    allFetched = allFetched.concat(items);
                    if (items.length < pageSize) hasMore = false; else page++;
                    await sleep(150);
                } catch (e) {
                    console.error(e);
                    showNotification('❌ خطا: ' + e.message);
                    hasMore = false;
                }
            }
            return allFetched;
        }

        function mapRecord(item) {
            return {
                name: (item.firstName || '').trim(),
                family: (item.lastName || '').trim(),
                father: (item.fatherName || '').trim(),
                codemelli: String(item.nationalCode || '').trim(),
                fatherPhone: normalizePhone(item.fatherMobileNumber),
                motherPhone: normalizePhone(item.motherMobileNumber),
                shadPhone: normalizePhone(item.studentMobileNumber)
            };
        }

        // ============================================================
        //  🏫 پیدا کردن پایه‌ها و کلاس‌ها
        // ============================================================
        function findGradesAndClasses() {
            var grades = [];
            var rows = document.querySelectorAll('table.table-bordered tbody tr');
            rows.forEach(function(row) {
                var btn = row.querySelector('button[ng-click*="addStudents"]');
                if (!btn) return;
                try {
                    var s = angular.element(row).scope();
                    if (s && s.x) {
                        var x = s.x;
                        grades.push({
                            gradeTypeId: x.gradeTypeId,
                            gradeName: x.gradeName,
                            classNames: (x.classNames || []).map(function(c) {
                                return { id: c.id, name: c.name };
                            })
                        });
                    }
                } catch(e) {}
            });

            if (grades.length > 0) return grades;

            var modal = document.querySelector('[uib-modal-window], .modal.show, .modal[style*="display: block"]');
            if (modal) {
                try {
                    var s2 = angular.element(modal).scope();
                    if (s2 && s2.model && s2.model.schoolClasses && s2.model.schoolClasses.studentClassByGrades) {
                        return s2.model.schoolClasses.studentClassByGrades.map(function(g) {
                            return {
                                gradeTypeId: g.gradeTypeId,
                                gradeName: g.gradeName,
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

        // ============================================================
        //  🚀 استخراج از کلاس‌بندی (با API - مستقیم از سرور)
        // ============================================================
        async function extractFromClassroom() {
            if (isRunning) { showNotification('⚠️ عملیات در حال انجام است...'); return; }

            var grades = findGradesAndClasses();
            if (grades.length === 0) {
                alert('❌ ساختار پایه‌ها پیدا نشد!\n\nمطمئن شوید در صفحهٔ «کلاس‌های مدرسه» (#/SchoolClasses) هستید.');
                return;
            }

            var totalClasses = grades.reduce(function(sum, g) { return sum + g.classNames.length; }, 0);
            if (!confirm('📚 ' + totalClasses + ' کلاس در ' + grades.length + ' پایه پیدا شد.\n\n' +
                         'اطلاعات کامل هر کلاس مستقیم از سرور دریافت می‌شود.\n\n' +
                         'ادامه؟')) return;

            isRunning = true;
            classesData = [];
            updatePanelUI('در حال دریافت اطلاعات...');

            var currentNum = 0;
            var totalMatched = 0;
            var processed = 0;
            var emptyClasses = 0;

            for (var gi = 0; gi < grades.length; gi++) {
                if (!isRunning) break;
                var g = grades[gi];

                for (var ci = 0; ci < g.classNames.length; ci++) {
                    if (!isRunning) break;
                    var c = g.classNames[ci];
                    currentNum++;
                    updatePanelUI('⏳ (' + currentNum + '/' + totalClasses + ') ' + c.name);

                    try {
                        var filter = {
                            logic: 'and',
                            filters: [{ field: 'classRoomId', operator: 'eq', value: c.id }]
                        };
                        var raw = await fetchStudents(filter);
                        var students = raw.map(mapRecord).filter(function(s) {
                            return s.codemelli && s.codemelli.length > 3;
                        });

                        if (students.length === 0) emptyClasses++;
                        else totalMatched += students.length;

                        classesData.push({
                            className: c.name,
                            gradeName: g.gradeName,
                            classId: c.id,
                            gradeTypeId: g.gradeTypeId,
                            students: students
                        });
                        processed++;
                        saveClassesData();
                        renderClassList();
                        await sleep(100);
                    } catch (e) {
                        console.error('خطا در کلاس ' + c.name + ':', e);
                    }
                }
            }

            isRunning = false;
            updatePanelUI('✅ ' + processed + ' کلاس، ' + totalMatched + ' دانش‌آموز');

            var msg = '✅ ' + processed + ' کلاس پردازش شد.\n👥 ' + totalMatched + ' دانش‌آموز.';
            if (emptyClasses > 0) msg += '\n⚪ کلاس‌های خالی: ' + emptyClasses;
            alert(msg);
        }

        // ============================================================
        //  💾 ذخیره / بازیابی
        // ============================================================
        function saveData() {
            try { localStorage.setItem(STORAGE_KEY, JSON.stringify(allStudents)); }
            catch(e) { showNotification('⚠️ حافظه پر شد.'); }
        }

        function saveClassesData() {
            try { localStorage.setItem(STORAGE_KEY_CLASSES, JSON.stringify(classesData)); }
            catch(e) { showNotification('⚠️ حافظه پر شد.'); }
        }

        function clearMemory() {
            if (confirm('آیا مطمئن هستید؟ تمام داده‌ها (همهٔ دانش‌آموزان و کلاس‌ها) پاک خواهند شد.')) {
                localStorage.removeItem(STORAGE_KEY);
                localStorage.removeItem(STORAGE_KEY_CLASSES);
                allStudents = [];
                classesData = [];
                updatePanelUI();
                renderClassList();
                showNotification('تمام داده‌ها پاک شدند.');
            }
        }

        function stopExtraction() {
            if (isRunning) { isRunning = false; showNotification('دستور توقف صادر شد.'); updatePanelUI('متوقف شد'); }
        }

        // ============================================================
        //  ▶️ شروع (استخراج همهٔ دانش‌آموزان - صفحهٔ مشخصات فردی)
        // ============================================================
        async function startExtraction() {
            if (isRunning) { showNotification('عملیات در حال انجام است...'); return; }
            isRunning = true;
            updatePanelUI('در حال دریافت اطلاعات...');
            try {
                var gridFilter = getGridFilter();
                var raw = await fetchStudents(gridFilter);
                if (!isRunning) { updatePanelUI('متوقف شد'); return; }
                if (raw.length === 0) { showNotification('❌ داده‌ای دریافت نشد.'); isRunning = false; updatePanelUI('خطا'); return; }
                allStudents = raw.map(mapRecord);
                saveData();
                updatePanelUI('✅ ' + allStudents.length + ' دانش‌آموز');
                showNotification('استخراج پایان یافت! مجموع: ' + allStudents.length + ' دانش‌آموز.', 0);
            } catch (e) { console.error(e); showNotification('❌ خطا: ' + e.message); updatePanelUI('خطا'); }
            isRunning = false;
        }

        // ============================================================
        //  📄 ساخت HTML
        // ============================================================
        function getDocHead() {
            var html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">';
            html += '<head><meta charset="UTF-8"><meta http-equiv="Content-Type" content="text/html; charset=UTF-8">';
            html += '<title>دفتر انضباطی</title>';
            html += '<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom></w:WordDocument></xml><![endif]-->';
            html += '<style>';
            html += '@page { size: 21cm 29.7cm; margin: 0.5cm 0.5cm 0.5cm 0.5cm; mso-page-orientation: portrait; }';
            html += 'html, body { margin: 0; padding: 0; }';
            html += 'body { font-family: "B Nazanin", "Tahoma", sans-serif; direction: rtl; font-size: 12pt; color: #000; }';
            html += '.page { width: 20cm; height: 28.7cm; page-break-after: always; overflow: hidden; }';
            html += '.page:last-child { page-break-after: auto; }';
            html += '.student-header { width: 100%; margin: 0; padding: 4px 0 6px 0; text-align: center; }';
            html += '.info-line-1 { font-size: 20pt; line-height: 1.7; margin: 0; padding: 0; font-weight: normal; }';
            html += '.info-line-1 .name { font-size: 22pt; font-weight: bold; }';
            html += '.info-line-1 .val { font-size: 18pt; font-weight: normal; }';
            html += '.info-line-2 { font-size: 18pt; line-height: 1.5; margin: 2px 0 0 0; padding: 0; font-weight: bold; white-space: nowrap; }';
            html += '.row-circle { display: inline-block; width: 44px; height: 44px; border: 2.5px solid #000; border-radius: 50%; text-align: center; line-height: 40px; font-size: 20pt; font-weight: bold; vertical-align: middle; margin-left: 10px; background: #fff; }';
            html += '.discipline-table { width: 100%; height: 26cm; border-collapse: collapse; table-layout: fixed; margin: 0; }';
            html += '.discipline-table th { border: 1.5px solid #000; text-align: center; vertical-align: middle; padding: 6px 4px; font-size: 16pt; font-weight: bold; background: #f5f5f5; height: 1cm; }';
            html += '.discipline-table td { border: 1.5px solid #000; vertical-align: top; padding: 4px 8px; width: 50%; }';
            html += '</style></head><body>';
            return html;
        }

        function getDocFoot() {
            return '</body></html>';
        }

        function makeEmptyPage() {
            var h = '<div class="page">';
            h += '<div class="student-header">';
            h += '<p class="info-line-1">&nbsp;</p>';
            h += '<p class="info-line-2">&nbsp;</p>';
            h += '</div>';
            h += '<table class="discipline-table">';
            h += '<thead><tr><th>نوبت اول</th><th>نوبت دوم</th></tr></thead>';
            h += '<tbody><tr><td></td><td></td></tr></tbody>';
            h += '</table>';
            h += '</div>';
            return h;
        }

        // ✅ شماره‌ها از ۱ شروع می‌شن (مستقل برای هر کلاس)
        function buildPagesForStudents(studentsList) {
            var h = '';
            studentsList.forEach(function(s, idx) {
                var fullName = ((s.family || '') + ' ' + (s.name || '')).trim();
                var fp = s.fatherPhone || '';
                var mp = s.motherPhone || '';
                var sp = s.shadPhone || '';

                var phoneParts = [];
                if (fp) phoneParts.push('تلفن پدر: ' + escapeHtml(fp));
                if (mp) phoneParts.push('تلفن مادر: ' + escapeHtml(mp));
                if (sp) phoneParts.push('تلفن شاد: ' + escapeHtml(sp));
                var phoneLine = phoneParts.join(' | ');

                h += '<div class="page">';
                h += '<div class="student-header">';
                h += '<p class="info-line-1">';
                h += '<span class="row-circle">' + toPersianNum(idx + 1) + '</span>';
                h += '<span class="name">' + escapeHtml(fullName || 'بدون نام') + '</span> | ';
                h += '<span class="val">نام پدر: ' + escapeHtml(s.father || '---') + '</span> | ';
                h += '<span class="val">کد ملی: ' + escapeHtml(s.codemelli || '---') + '</span>';
                h += '</p>';
                if (phoneLine) {
                    h += '<p class="info-line-2">' + phoneLine + '</p>';
                }
                h += '</div>';

                h += '<table class="discipline-table">';
                h += '<thead><tr><th>نوبت اول</th><th>نوبت دوم</th></tr></thead>';
                h += '<tbody><tr><td></td><td></td></tr></tbody>';
                h += '</table>';
                h += '</div>';
            });
            h += makeEmptyPage();
            return h;
        }

        function buildDisciplineHTML(studentsList) {
            return getDocHead() + buildPagesForStudents(studentsList) + getDocFoot();
        }

        // برای همهٔ کلاس‌ها - شماره هر کلاس از ۱ ریست می‌شه
        function buildCombinedClassesHTML(classes) {
            var inner = '';
            classes.forEach(function(cls) {
                inner += buildPagesForStudents(cls.students || []);
            });
            return getDocHead() + inner + getDocFoot();
        }

        // ============================================================
        //  📥 دانلود
        // ============================================================
        function downloadBlob(html, filename) {
            var blob = new Blob(['\ufeff' + html], { type: 'application/msword;charset=utf-8' });
            var link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setTimeout(function() { URL.revokeObjectURL(link.href); }, 1000);
        }

        function sanitizeName(str) {
            return String(str || '').replace(/[^\u0600-\u06FF\w\s\-]/g, '').replace(/\s+/g, ' ').trim();
        }

        function downloadClass(cls) {
            if (!cls || !cls.students || cls.students.length === 0) {
                alert('❌ این کلاس دانش‌آموزی ندارد.');
                return;
            }
            var html = buildDisciplineHTML(cls.students);
            var safeName = sanitizeName(cls.className);
            downloadBlob(html, 'دفتر_انضباطی_کلاس_' + safeName + '.doc');
            showNotification('✅ دفتر کلاس ' + cls.className + ' دانلود شد (' + cls.students.length + ' صفحه)');
        }

        function downloadAllClasses() {
            if (classesData.length === 0) { alert('❌ هیچ کلاسی آماده نیست.'); return; }
            if (!confirm('📚 دانلود دفاتر ' + classesData.length + ' کلاس؟\n\n(هر کلاس یک فایل Word جداگانه)')) return;
            classesData.forEach(function(cls, i) {
                setTimeout(function() {
                    var html = buildDisciplineHTML(cls.students);
                    var safeName = sanitizeName(cls.className);
                    downloadBlob(html, 'دفتر_انضباطی_کلاس_' + safeName + '.doc');
                }, i * 900);
            });
            showNotification('✅ ' + classesData.length + ' فایل Word در حال دانلود...', 5000);
        }

        function generateDisciplineNotebook() {
            if (classesData.length > 0) { downloadAllClasses(); return; }
            if (allStudents.length === 0) {
                alert('❌ هیچ داده‌ای برای دانلود وجود ندارد!\n\nلطفاً اول دکمهٔ «▶️ شروع» را بزنید یا از کلاس‌بندی استخراج کنید.');
                return;
            }
            var html = buildDisciplineHTML(allStudents);
            downloadBlob(html, 'دفتر_انضباطی_' + allStudents.length + '_دانش_آموز_' + new Date().toISOString().slice(0, 10) + '.doc');
            showNotification('✅ فایل Word دانلود شد (' + allStudents.length + ' صفحه)');
        }

        // ============================================================
        //  🖨️ چاپ
        // ============================================================
        function printHTML(html) {
            var iframe = document.createElement('iframe');
            iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;';
            document.body.appendChild(iframe);
            var doc = iframe.contentWindow.document;
            doc.open(); doc.write(html); doc.close();
            setTimeout(function() {
                try {
                    iframe.contentWindow.focus();
                    iframe.contentWindow.print();
                } catch (e) { alert('❌ خطا در چاپ: ' + e.message); }
                setTimeout(function() { if (iframe.parentNode) iframe.parentNode.removeChild(iframe); }, 3000);
            }, 800);
        }

        function printClass(cls) {
            if (!cls || !cls.students || cls.students.length === 0) {
                alert('❌ این کلاس دانش‌آموزی ندارد.');
                return;
            }
            printHTML(buildDisciplineHTML(cls.students));
            showNotification('🖨️ پنجرهٔ چاپ کلاس ' + cls.className, 4000);
        }

        function printDisciplineNotebook() {
            if (classesData.length > 0) {
                var combined = buildCombinedClassesHTML(classesData);
                printHTML(combined);
                showNotification('🖨️ چاپ همهٔ کلاس‌ها (' + classesData.length + ' کلاس)', 6000);
                return;
            }
            if (allStudents.length === 0) {
                alert('❌ هیچ داده‌ای برای چاپ وجود ندارد!');
                return;
            }
            printHTML(buildDisciplineHTML(allStudents));
            showNotification('🖨️ پنجرهٔ چاپ باز شد', 6000);
        }

        // ============================================================
        //  📋 رندر لیست کلاس‌ها
        // ============================================================
               function renderClassList() {
            var el = document.getElementById('discClassList');
            if (!el) return;
            if (classesData.length === 0) {
                el.innerHTML = '<div style="color:#999;text-align:center;padding:6px;font-size:11px;">کلاسی استخراج نشده</div>';
                return;
            }
            var h = '';
            classesData.forEach(function(cls, idx) {
                var cnt = (cls.students || []).length;
                h += '<div style="background:#fff;border:1px solid #e5e7eb;border-radius:5px;padding:4px 5px;margin-bottom:4px;display:flex;align-items:center;gap:4px;font-size:11px;">';
                h += '<span style="flex:1;color:#f59e0b;font-weight:bold;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">📚 ' + escapeHtml(cls.className) + ' <span style="color:#10b981;">(' + toPersianNum(cnt) + ')</span></span>';
                h += '<button class="dl-class-btn" data-idx="' + idx + '" title="دانلود" style="background:#3b82f6;color:white;border:none;padding:3px 6px;border-radius:4px;cursor:pointer;font-size:11px;">📥</button>';
                h += '<button class="pr-class-btn" data-idx="' + idx + '" title="چاپ" style="background:#8b5cf6;color:white;border:none;padding:3px 6px;border-radius:4px;cursor:pointer;font-size:11px;">🖨️</button>';
                h += '<button class="rm-class-btn" data-idx="' + idx + '" title="حذف" style="background:#ef4444;color:white;border:none;padding:3px 6px;border-radius:4px;cursor:pointer;font-size:11px;">🗑️</button>';
                h += '</div>';
            });
            el.innerHTML = h;

            el.querySelectorAll('.dl-class-btn').forEach(function(btn) {
                btn.onclick = function() {
                    var idx = parseInt(btn.getAttribute('data-idx'));
                    downloadClass(classesData[idx]);
                };
            });
            el.querySelectorAll('.pr-class-btn').forEach(function(btn) {
                btn.onclick = function() {
                    var idx = parseInt(btn.getAttribute('data-idx'));
                    printClass(classesData[idx]);
                };
            });
            el.querySelectorAll('.rm-class-btn').forEach(function(btn) {
                btn.onclick = function() {
                    var idx = parseInt(btn.getAttribute('data-idx'));
                    var cls = classesData[idx];
                    if (cls && confirm('حذف کلاس «' + cls.className + '» از لیست؟')) {
                        classesData.splice(idx, 1);
                        saveClassesData();
                        renderClassList();
                        updatePanelUI();
                    }
                };
            });
        }

        // ============================================================
        //  🎨 بروزرسانی پنل
        // ============================================================
        function updatePanelUI(status) {
            var tEl = document.getElementById('discTotal');
            var mEl = document.getElementById('discStatus');
            var clsTotal = document.getElementById('discClassTotal');
            if (tEl) tEl.textContent = toPersianNum(allStudents.length);
            if (clsTotal) clsTotal.textContent = toPersianNum(classesData.length);
            if (mEl) {
                if (status) { mEl.textContent = status; mEl.style.color = isRunning ? '#f59e0b' : '#c62828'; }
                else { mEl.textContent = 'آماده شروع...'; mEl.style.color = '#666'; }
            }
        }

        // ============================================================
        //  📖 راهنما
        // ============================================================
        function showHelp() {
            var existing = document.getElementById('discHelpOverlay');
            if (existing) existing.remove();
            var ov = document.createElement('div');
            ov.id = 'discHelpOverlay';
            ov.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.75);z-index:9999999;display:flex;align-items:center;justify-content:center;font-family:Tahoma,sans-serif;direction:rtl;padding:20px;box-sizing:border-box;';
            ov.innerHTML =
                '<div style="background:white;color:#333;border-radius:12px;max-width:640px;width:100%;max-height:90vh;overflow-y:auto;padding:25px;box-shadow:0 10px 40px rgba(0,0,0,0.5);font-size:16px;line-height:2;position:relative;">' +
                    '<button id="discCloseHelp" style="position:absolute;top:12px;left:12px;background:#ef4444;color:white;border:none;width:36px;height:36px;border-radius:50%;cursor:pointer;font-size:20px;font-weight:bold;">✕</button>' +
                    '<h2 style="color:#f59e0b;text-align:center;margin-bottom:20px;font-size:22px;border-bottom:3px solid #f59e0b;padding-bottom:12px;">📖 راهنمای دفتر انضباطی</h2>' +
                    '<div style="background:#eff6ff;padding:14px;border-radius:8px;margin-bottom:16px;border-right:4px solid #3b82f6;">' +
                        '<h3 style="color:#1e40af;margin-bottom:10px;font-size:18px;">🅰️ حالت ۱: همهٔ دانش‌آموزان</h3>' +
                        '<ol style="margin-right:20px;margin-top:10px;">' +
                            '<li>برو به صفحهٔ «مشخصات فردی»</li>' +
                            '<li>دکمهٔ «▶️ شروع» را بزن</li>' +
                            '<li>«📥 دانلود همه» یا «🖨️ چاپ همه» را بزن</li>' +
                        '</ol>' +
                    '</div>' +
                    '<div style="background:#ecfdf5;padding:14px;border-radius:8px;margin-bottom:16px;border-right:4px solid #10b981;">' +
                        '<h3 style="color:#065f46;margin-bottom:10px;font-size:18px;">🅱️ حالت ۲: کلاس‌محور (با API)</h3>' +
                        '<ol style="margin-right:20px;margin-top:10px;">' +
                            '<li>برو به صفحهٔ «کلاس‌های مدرسه» (#/SchoolClasses)</li>' +
                            '<li>دکمهٔ «🚀 استخراج از کلاس‌بندی» را بزن</li>' +
                            '<li>اطلاعات کامل هر کلاس مستقیم از سرور دریافت می‌شه</li>' +
                            '<li>برای هر کلاس دکمهٔ «📥 دانلود» و «🖨️ چاپ» جداگانه داری</li>' +
                        '</ol>' +
                    '</div>' +
                    '<div style="background:#fef2f2;padding:14px;border-radius:8px;border-right:4px solid #ef4444;">' +
                        '<h3 style="color:#991b1b;margin-bottom:10px;font-size:18px;">⚠️ نکات مهم</h3>' +
                        '<ul style="margin-right:20px;">' +
                            '<li>شمارهٔ هر دانش‌آموز در هر کلاس از ۱ شروع می‌شه</li>' +
                            '<li>در پنجرهٔ چاپ «Save as PDF» را انتخاب کن</li>' +
                            '<li>صفحهٔ آخر هر فایل خالی است (برای یادداشت اضافه)</li>' +
                        '</ul>' +
                    '</div>' +
                    '<div style="text-align:center;margin-top:20px;padding-top:15px;border-top:2px dashed #ddd;color:#f59e0b;font-weight:bold;font-size:18px;">🎨 طراح: یوسف معصومی</div>' +
                '</div>';
            document.body.appendChild(ov);
            document.getElementById('discCloseHelp').onclick = function() { ov.remove(); };
            ov.onclick = function(e) { if (e.target === ov) ov.remove(); };
        }

        // ============================================================
        //  🎨 پنل اصلی
        // ============================================================
                function createPanel() {
            var panel = document.createElement('div');
            panel.id = 'disciplinePanel';
            panel.style.cssText = 'position:fixed;top:20px;left:20px;background:white;border:2px solid #f59e0b;border-radius:10px;padding:10px;width:300px;max-height:90vh;overflow-y:auto;z-index:999999;box-shadow:0 4px 20px rgba(0,0,0,0.2);font-family:Tahoma,sans-serif;direction:rtl;font-size:13px;color:#333;';

            panel.innerHTML =
                '<div id="discHeader" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;padding-bottom:5px;border-bottom:2px solid #f59e0b;user-select:none;">' +
                    '<strong style="color:#f59e0b;font-size:14px;">📓 دفتر انضباطی</strong>' +
                    '<div style="display:flex;align-items:center;gap:6px;">' +
                        '<button id="btnHelp" style="background:none;border:none;cursor:pointer;font-size:16px;color:#6b7280;padding:0;" title="راهنما">📖</button>' +
                        '<button id="btnClosePanel" style="background:none;border:none;cursor:pointer;font-size:16px;color:#999;padding:0;">✕</button>' +
                    '</div>' +
                '</div>' +

                '<div style="background:#fef3c7;padding:6px;border-radius:6px;margin-bottom:8px;text-align:center;font-size:12px;">' +
                    '<span id="discTotal" style="font-weight:bold;color:#92400e;">0</span>' +
                    ' دانش‌آموز | ' +
                    '<span id="discClassTotal" style="font-weight:bold;color:#10b981;">0</span>' +
                    ' کلاس' +
                    '<div id="discStatus" style="font-size:11px;color:#666;margin-top:3px;">آماده شروع...</div>' +
                '</div>' +

                '<div style="display:flex;gap:6px;margin-bottom:6px;">' +
                    '<button id="btnStart" style="flex:1;background:#f59e0b;color:white;border:none;padding:8px;border-radius:5px;cursor:pointer;font-family:inherit;font-weight:bold;font-size:13px;">▶️ شروع</button>' +
                    '<button id="btnStop" style="flex:1;background:#ef4444;color:white;border:none;padding:8px;border-radius:5px;cursor:pointer;font-family:inherit;font-weight:bold;font-size:13px;">⛔ توقف</button>' +
                '</div>' +

                '<button id="btnClassroomExtract" style="width:100%;background:#10b981;color:white;border:none;padding:8px;border-radius:5px;cursor:pointer;font-family:inherit;font-weight:bold;font-size:13px;margin-bottom:8px;">🚀 کلاس‌بندی</button>' +

                '<div id="discClassList" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:5px;max-height:200px;overflow-y:auto;margin-bottom:8px;font-size:11px;">' +
                    '<div style="color:#999;text-align:center;padding:6px;">کلاسی استخراج نشده</div>' +
                '</div>' +

                '<div style="display:flex;gap:6px;margin-bottom:6px;">' +
                    '<button id="btnDownload" style="flex:1;background:#3b82f6;color:white;border:none;padding:8px;border-radius:5px;cursor:pointer;font-family:inherit;font-weight:bold;font-size:12px;">📥 دانلود</button>' +
                    '<button id="btnPrint" style="flex:1;background:#8b5cf6;color:white;border:none;padding:8px;border-radius:5px;cursor:pointer;font-family:inherit;font-weight:bold;font-size:12px;">🖨️ چاپ</button>' +
                '</div>' +
                '<button id="btnClear" style="width:100%;background:#fff;color:#c62828;border:1px solid #c62828;padding:6px;border-radius:5px;cursor:pointer;font-family:inherit;font-size:12px;">🗑️ پاک‌سازی همه</button>';

            document.body.appendChild(panel);
            makeDraggable(panel, document.getElementById('discHeader'));

            document.getElementById('btnClosePanel').addEventListener('click', function() { panel.style.display = 'none'; });
            document.getElementById('btnStart').addEventListener('click', startExtraction);
            document.getElementById('btnStop').addEventListener('click', stopExtraction);
            document.getElementById('btnClassroomExtract').addEventListener('click', extractFromClassroom);
            document.getElementById('btnDownload').addEventListener('click', generateDisciplineNotebook);
            document.getElementById('btnPrint').addEventListener('click', printDisciplineNotebook);
            document.getElementById('btnClear').addEventListener('click', clearMemory);
            document.getElementById('btnHelp').addEventListener('click', showHelp);

            updatePanelUI();
            renderClassList();
        }

        function togglePanel() {
            var panel = document.getElementById('disciplinePanel');
            if (!panel) { createPanel(); }
            else if (panel.style.display === 'none') {
                panel.style.display = 'block';
                updatePanelUI();
                renderClassList();
            }
            else { panel.style.display = 'none'; }
        }

        function createToggleButton() {
            var btn = document.createElement('div');
            btn.id = 'discToggleBtn';
            btn.textContent = '📓';
            btn.title = 'دفتر انضباطی (کلیک: باز/بسته — درگ: جابه‌جایی)';
            btn.style.cssText = 'position:fixed;top:90px;left:20px;width:54px;height:54px;border-radius:50%;background:#f59e0b;color:white;display:flex;align-items:center;justify-content:center;font-size:26px;z-index:999998;box-shadow:0 4px 15px rgba(0,0,0,0.35);user-select:none;';
            document.body.appendChild(btn);
            makeDraggable(btn, btn, togglePanel);
        }

        createToggleButton();
        showNotification('📓 دفتر انضباطی آماده است.');
    }

    function waitForBody(callback) {
        if (document.body) callback();
        else setTimeout(function() { waitForBody(callback); }, 100);
    }

    waitForBody(function() {
        disciplineNotebookTool();
    });

})();
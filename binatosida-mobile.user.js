// ==UserScript==
// @name         📱 انتقال از بینا به سیدا (نسخه موبایل)
// @namespace    http://tampermonkey.net/
// @version      3.3-mobile
// @description  جمع‌آوری خودکار همه دانش‌آموزان از بینا - نسخه موبایل
// @author       یوسف معصومی
// @match        https://bina.medu.ir/*
// @grant        GM_setValue
// @grant        GM_getValue
// @run-at       document-end
// ==/UserScript==

(function(){
    'use strict';

    // ✅ فقط روی موبایل یا دستگاه لمسی اجرا بشه
    if (!('ontouchstart' in window) && !/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)) return;

    console.log('📱 اسکریپت جمع‌آوری خودکار از بینا - نسخه موبایل v3.3');

    var COOKIE_NAME = 'bina_students_data';
    var STORAGE_KEY = 'bina_students_complete';
    var LIST_KEY = 'bina_all_students';

    // ================================================================
    //  🎛️ انبار
    // ================================================================
    function hasGM(){
        return typeof GM_getValue !== 'undefined' && typeof GM_setValue !== 'undefined';
    }

    function getStorage(){
        try {
            var ls = localStorage.getItem(STORAGE_KEY);
            if(ls){
                var parsed = JSON.parse(ls);
                if(Object.keys(parsed).length > 0) return parsed;
            }
        } catch(e){}

        if(hasGM()){
            try {
                var s = GM_getValue(STORAGE_KEY, '');
                if(s){
                    var parsed2 = typeof s === 'string' ? JSON.parse(s) : s;
                    if(Object.keys(parsed2).length > 0) return parsed2;
                }
            } catch(e){}
        }
        return {};
    }

    function saveStorage(obj){
        var json = JSON.stringify(obj);

        if(hasGM()){
            try { GM_setValue(STORAGE_KEY, json); } catch(e){}
        }

        try {
            localStorage.setItem(STORAGE_KEY, json);
        } catch(e){}

        try {
            var encoded = encodeURIComponent(json);
            if(encoded.length <= 4000){
                var expires = new Date(Date.now() + 365*24*60*60*1000).toUTCString();
                document.cookie = COOKIE_NAME + '=' + encoded +
                    '; expires=' + expires + '; path=/; domain=.medu.ir; SameSite=Lax';
            }
        } catch(e){}
    }

    function saveToStorage(nationalId, data){
        var s = getStorage();
        s[nationalId] = {
            data: data,
            meta: {
                name: (data.student.firstName || '') + ' ' + (data.student.lastName || ''),
                time: Date.now()
            }
        };
        saveStorage(s);
        return Object.keys(s).length;
    }

    function getStorageCount(){
        return Object.keys(getStorage()).length;
    }

    function deleteFromStorage(nationalId){
        var s = getStorage();
        delete s[nationalId];
        saveStorage(s);
        return Object.keys(s).length;
    }

    function clearStorage(){
        saveStorage({});
        return 0;
    }

    // ================================================================
    //  📋 لیست دانش‌آموزان
    // ================================================================
    function getStudentList(){
        try {
            return JSON.parse(localStorage.getItem(LIST_KEY) || '[]');
        } catch(e){ return []; }
    }

    function setStudentList(list){
        localStorage.setItem(LIST_KEY, JSON.stringify(list));
    }

    function clearStudentList(){
        localStorage.removeItem(LIST_KEY);
    }

    // ================================================================
    //  🔔 پیام شناور
    // ================================================================
    function showToast(message, type){
        type = type || 'success';
        var colors = {
            success: '#10b981', error: '#ef4444',
            info: '#3b82f6', warning: '#f59e0b'
        };
        var icons = {
            success: '✅', error: '❌',
            info: 'ℹ️', warning: '⚠️'
        };

        var toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed; top: 30px; left: 50%;
            transform: translateX(-50%) translateY(-100px);
            background: ${colors[type]}; color: white;
            padding: 16px 32px; border-radius: 12px;
            font-family: Tahoma, Arial, sans-serif; font-size: 16px;
            font-weight: bold; box-shadow: 0 10px 40px rgba(0,0,0,0.3);
            z-index: 99999999; direction: rtl;
            transition: transform 0.3s ease, opacity 0.3s ease;
            opacity: 0; pointer-events: none;
            max-width: 90vw;
        `;
        toast.textContent = icons[type] + ' ' + message;
        document.body.appendChild(toast);

        setTimeout(function(){
            toast.style.transform = 'translateX(-50%) translateY(0)';
            toast.style.opacity = '1';
        }, 50);

        setTimeout(function(){
            toast.style.transform = 'translateX(-50%) translateY(-100px)';
            toast.style.opacity = '0';
            setTimeout(function(){
                if(toast.parentNode) toast.parentNode.removeChild(toast);
            }, 300);
        }, 2000);
    }

    // ================================================================
    //  📊 خروجی اکسل
    // ================================================================
    function exportToExcel(){
        var s = getStorage();
        var keys = Object.keys(s);
        if(keys.length === 0){
            showToast('انبار خالیه!', 'warning');
            return;
        }

        var rows = [];
        rows.push([
            'کد ملی','نام','نام خانوادگی','جنسیت','تاریخ تولد',
            'شماره شناسنامه','محل تولد','تابعیت',
            'نام پدر','کد ملی پدر','موبایل پدر','تاریخ تولد پدر',
            'شناسنامه پدر','محل تولد پدر','مدرک پدر','شغل پدر','محل اشتغال پدر',
            'نام مادر','کد ملی مادر','موبایل مادر','تاریخ تولد مادر',
            'شناسنامه مادر','محل تولد مادر','مدرک مادر','شغل مادر',
            'کد پستی','استان','شهر','آدرس','موبایل','تلفن ثابت'
        ].join(','));

        keys.forEach(function(k){
            var d = s[k].data || s[k];
            var stu = d.student || {}, fat = d.father || {};
            var mot = d.mother || {}, con = d.contact || {};

            var row = [
                k,
                stu.firstName || '', stu.lastName || '', stu.gender || '', stu.birthDate || '',
                stu.iDno || '', stu.birthPlace || '', stu.nationality || '',
                fat.fullName || '', fat.nationalId || '', fat.mobile || '', fat.birthDate || '',
                fat.iDno || '', fat.birthPlace || '', fat.education || '', fat.occupation || '', fat.workplace || '',
                mot.fullName || '', mot.nationalId || '', mot.mobile || '', mot.birthDate || '',
                mot.iDno || '', mot.birthPlace || '', mot.education || '', mot.occupation || '',
                con.postalCode || '', con.province || '', con.city || '', con.address || '', con.mobile || '', con.landline || ''
            ];

            row = row.map(function(v){
                v = String(v == null ? '' : v).trim();
                return (v.indexOf(',') > -1 || v.indexOf('"') > -1)
                    ? '"' + v.replace(/"/g,'""') + '"' : v;
            });
            rows.push(row.join(','));
        });

        var csv = '\uFEFF' + rows.join('\r\n');
        var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'bina_students_' + new Date().toISOString().slice(0,10) + '.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('Excel دانلود شد', 'success');
    }

    // ================================================================
    //  📄 گزارش Word
    // ================================================================
    function exportLogToWord(collectLogs){
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
          + '<h2>📋 گزارش جمع‌آوری از بینا</h2>'
          + '<p class="meta">تاریخ: ' + new Date().toLocaleString('fa-IR') + '</p>';

        if(collectLogs && collectLogs.length){
            var plainText = collectLogs.map(function(item){
                var time = '[' + (item.time || '') + ']';
                return time + ' ' + (item.text || '');
            }).join('\n');

            html += '<pre>' + plainText
                .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') + '</pre>';
        }
        html += '</body></html>';

        var blob = new Blob(['\uFEFF' + html], { type: 'application/msword;charset=utf-8' });
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'collect_report_' + new Date().toISOString().slice(0,10) + '.doc';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(blob);
        showToast('Word دانلود شد', 'success');
    }

    function copyLogToClipboard(text){
        if(navigator.clipboard && navigator.clipboard.writeText){
            navigator.clipboard.writeText(text).then(function(){
                showToast('گزارش کپی شد!', 'success');
            }).catch(function(){ fallbackCopy(text); });
        } else {
            fallbackCopy(text);
        }
    }

    function fallbackCopy(text){
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;';
        document.body.appendChild(ta);
        ta.select();
        try {
            document.execCommand('copy');
            showToast('گزارش کپی شد!', 'success');
        } catch(e){
            showToast('کپی نشد!', 'error');
        }
        document.body.removeChild(ta);
    }

    // ================================================================
    //  📋 استخراج از DOM
    // ================================================================
    function toEn(str){
        if(str === null || str === undefined || str === '') return str;
        str = String(str);
        return str.replace(/[۰-۹]/g, function(d){
            return '۰۱۲۳۴۵۶۷۸۹'.indexOf(d);
        }).replace(/\//g, '');
    }

    function getFieldFromDoc(doc, fieldId){
        var el = doc.getElementById('prereg-field-error--' + fieldId);
        if(!el) return null;
        var valEl = el.querySelector('.text-sm.font-medium');
        return valEl ? valEl.textContent.trim() : null;
    }

    function extractFromDoc(doc){
        return {
            student: {
                firstName:   getFieldFromDoc(doc, 'studentFirstName'),
                lastName:    getFieldFromDoc(doc, 'studentLastName'),
                nationalId:  toEn(getFieldFromDoc(doc, 'studentNationalId')),
                gender:      getFieldFromDoc(doc, 'gender'),
                fatherName:  getFieldFromDoc(doc, 'fatherName'),
                birthDate:   toEn(getFieldFromDoc(doc, 'birthDate')),
                iDno:        toEn(getFieldFromDoc(doc, 'birthCertificateNo')),
                birthPlace:  getFieldFromDoc(doc, 'birthPlace'),
                nationality: getFieldFromDoc(doc, 'nationality')
            },
            father: {
                fullName:    getFieldFromDoc(doc, 'fatherFullName'),
                nationalId:  toEn(getFieldFromDoc(doc, 'fatherNationalId')),
                mobile:      toEn(getFieldFromDoc(doc, 'fatherMobilePhone')),
                birthDate:   toEn(getFieldFromDoc(doc, 'fatherBirthDate')),
                iDno:        toEn(getFieldFromDoc(doc, 'fatherBirthCertificateNo')),
                birthPlace:  getFieldFromDoc(doc, 'fatherBirthPlace'),
                education:   getFieldFromDoc(doc, 'fatherEducation'),
                occupation:  getFieldFromDoc(doc, 'fatherOccupation'),
                workplace:   getFieldFromDoc(doc, 'fatherWorkplace')
            },
            mother: {
                fullName:    getFieldFromDoc(doc, 'motherFullName'),
                nationalId:  toEn(getFieldFromDoc(doc, 'motherNationalId')),
                mobile:      toEn(getFieldFromDoc(doc, 'motherMobilePhone')),
                birthDate:   toEn(getFieldFromDoc(doc, 'motherBirthDate')),
                iDno:        toEn(getFieldFromDoc(doc, 'motherBirthCertificateNo')),
                birthPlace:  getFieldFromDoc(doc, 'motherBirthPlace'),
                education:   getFieldFromDoc(doc, 'motherEducation'),
                occupation:  getFieldFromDoc(doc, 'motherOccupation')
            },
            contact: {
                postalCode:  toEn(getFieldFromDoc(doc, 'postalCode')),
                province:    getFieldFromDoc(doc, 'residenceProvinceName'),
                city:        getFieldFromDoc(doc, 'residenceCityName'),
                address:     toEn(getFieldFromDoc(doc, 'residenceAddress')),
                mobile:      toEn(getFieldFromDoc(doc, 'mobilePhone')),
                landline:    toEn(getFieldFromDoc(doc, 'homeLandlinePhone'))
            }
        };
    }

    // ================================================================
    //  🔍 گرفتن لیست دانش‌آموزان از API
    // ================================================================
    function fetchStudentList(){
        return new Promise(function(resolve, reject){
            var allStudents = [];
            var seenCaseIds = new Set();
            var limit = 20;
            var offset = 0;
            var total = 0;

            function fetchNext(){
                var url = '/api/v1/student-pre-registration/cases/school/reviewed' +
                          '?limit=' + limit + '&offset=' + offset + 
                          '&view=list&status=FINAL_REGISTERED';

                fetch(url, { credentials: 'include' })
                    .then(function(r){ return r.json(); })
                    .then(function(json){
                        if(!json.data || json.data.length === 0){
                            setStudentList(allStudents);
                            resolve({ students: allStudents, total: total });
                            return;
                        }

                        json.data.forEach(function(item){
                            if(seenCaseIds.has(item.id)) return;
                            seenCaseIds.add(item.id);

                            allStudents.push({
                                caseId: item.id,
                                trackingCode: item.trackingCode,
                                firstName: item.formData.studentFirstName,
                                lastName: item.formData.studentLastName,
                                fatherName: item.formData.fatherName,
                                nationalId: item.formData.studentNationalId,
                                grade: item.summary ? item.summary.gradeLabel : '',
                                school: item.summary ? item.summary.schoolName : ''
                            });
                        });

                        if(json.pagination && json.pagination.total){
                            total = json.pagination.total;
                        }

                        offset += limit;

                        if(json.data.length < limit){
                            setStudentList(allStudents);
                            resolve({ students: allStudents, total: total });
                        } else {
                            setTimeout(fetchNext, 100);
                        }
                    })
                    .catch(function(e){
                        reject(e);
                    });
            }

            fetchNext();
        });
    }

    // ================================================================
    //  🚀 شروع
    // ================================================================
    function waitForBody(callback){
        if(document.body) callback();
        else setTimeout(function(){ waitForBody(callback); }, 100);
    }

    function start(){
        createFloatingButton();

        var lastUrl = location.href;
        setInterval(function(){
            if(location.href !== lastUrl){
                lastUrl = location.href;
                setTimeout(function(){
                    var btn = document.getElementById('collector-float-btn');
                    if(!btn){
                        createFloatingButton();
                    } else {
                        btn.style.display = 'block';
                        btn.style.visibility = 'visible';
                        btn.style.opacity = '1';
                    }
                }, 500);
            }
        }, 1000);
    }

    waitForBody(start);

    // ================================================================
    //  🎈 دکمه شناور (با پشتیبانی لمسی)
    // ================================================================
    function createFloatingButton(){
        var existing = document.getElementById('collector-float-btn');
        if(existing){
            existing.style.display = 'block';
            existing.style.visibility = 'visible';
            existing.style.opacity = '1';
            return;
        }

        var btn = document.createElement('button');
        btn.id = 'collector-float-btn';
        btn.innerHTML = '📥 انتقال از بینا به سیدا';

        var savedX = hasGM() ? GM_getValue('collector_btn_x', null) : null;
        var savedY = hasGM() ? GM_getValue('collector_btn_y', null) : null;

        var positionStyle = '';
        if (savedX !== null && savedY !== null && savedX !== undefined && savedY !== undefined) {
            positionStyle = 'left: ' + savedX + 'px; top: ' + savedY + 'px;';
        } else {
            positionStyle = 'bottom: 20px; left: 20px;';
        }

        btn.style.cssText = `
            position: fixed;
            ${positionStyle}
            padding: 16px 24px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 50px;
            cursor: move;
            font-size: 15px;
            font-weight: bold;
            font-family: Tahoma, Arial, sans-serif;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.5);
            z-index: 9999998;
            direction: rtl;
            user-select: none;
            touch-action: none;
            -webkit-user-select: none;
            -webkit-tap-highlight-color: transparent;
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            max-width: 90vw;
        `;

        // ===== Mouse Events =====
        var isDraggingBtn = false;
        var dragStartedAt = 0;
        var btnOffsetX = 0;
        var btnOffsetY = 0;
        var movedDistance = 0;

        btn.addEventListener('mousedown', function(e){
            if(e.button !== 0) return;
            isDraggingBtn = true;
            dragStartedAt = Date.now();
            movedDistance = 0;
            var rect = btn.getBoundingClientRect();
            btnOffsetX = e.clientX - rect.left;
            btnOffsetY = e.clientY - rect.top;
            btn.style.right = 'auto';
            btn.style.bottom = 'auto';
            document.body.style.userSelect = 'none';
            e.preventDefault();
        });

        document.addEventListener('mousemove', function(e){
            if(!isDraggingBtn) return;
            movedDistance++;
            var newLeft = e.clientX - btnOffsetX;
            var newTop = e.clientY - btnOffsetY;
            var maxX = window.innerWidth - btn.offsetWidth;
            var maxY = window.innerHeight - btn.offsetHeight;
            newLeft = Math.max(0, Math.min(newLeft, maxX));
            newTop = Math.max(0, Math.min(newTop, maxY));
            btn.style.left = newLeft + 'px';
            btn.style.top = newTop + 'px';
            btn.style.bottom = 'auto';
        });

        document.addEventListener('mouseup', function(e){
            if(!isDraggingBtn) return;
            isDraggingBtn = false;
            document.body.style.userSelect = '';

            var wasOnButton = e.target === btn || btn.contains(e.target);

            if(movedDistance < 5 && (Date.now() - dragStartedAt) < 500 && wasOnButton){
                createPanel();
                btn.style.display = 'block';
                btn.style.visibility = 'visible';
                btn.style.opacity = '1';
            } else if(movedDistance >= 5){
                var rect = btn.getBoundingClientRect();
                if(hasGM()){
                    GM_setValue('collector_btn_x', Math.round(rect.left));
                    GM_setValue('collector_btn_y', Math.round(rect.top));
                }
            }
        });

        // ===== Touch Events =====
        var touchStartX = 0, touchStartY = 0;
        var touchOffsetX = 0, touchOffsetY = 0;
        var touchMovedDistance = 0;
        var isTouchDragging = false;

        btn.addEventListener('touchstart', function(e){
            var touch = e.touches[0];
            isTouchDragging = true;
            touchMovedDistance = 0;
            var rect = btn.getBoundingClientRect();
            touchStartX = touch.clientX;
            touchStartY = touch.clientY;
            touchOffsetX = touch.clientX - rect.left;
            touchOffsetY = touch.clientY - rect.top;
            btn.style.right = 'auto';
            btn.style.bottom = 'auto';
        }, { passive: true });

        btn.addEventListener('touchmove', function(e){
            if(!isTouchDragging) return;
            e.preventDefault();
            var touch = e.touches[0];
            touchMovedDistance++;
            var newLeft = touch.clientX - touchOffsetX;
            var newTop = touch.clientY - touchOffsetY;
            var maxX = window.innerWidth - btn.offsetWidth;
            var maxY = window.innerHeight - btn.offsetHeight;
            newLeft = Math.max(0, Math.min(newLeft, maxX));
            newTop = Math.max(0, Math.min(newTop, maxY));
            btn.style.left = newLeft + 'px';
            btn.style.top = newTop + 'px';
        }, { passive: false });

        btn.addEventListener('touchend', function(e){
            if(!isTouchDragging) return;
            isTouchDragging = false;

            var deltaX = Math.abs((e.changedTouches[0].clientX) - touchStartX);
            var deltaY = Math.abs((e.changedTouches[0].clientY) - touchStartY);
            var isTap = (deltaX < 10 && deltaY < 10 && touchMovedDistance < 5);

            if(isTap){
                createPanel();
                btn.style.display = 'block';
                btn.style.visibility = 'visible';
                btn.style.opacity = '1';
            } else {
                var rect = btn.getBoundingClientRect();
                if(hasGM()){
                    GM_setValue('collector_btn_x', Math.round(rect.left));
                    GM_setValue('collector_btn_y', Math.round(rect.top));
                }
            }
        }, { passive: true });

        document.body.appendChild(btn);
        console.log('✅ دکمه شناور موبایل نصب شد');
    }

    // ================================================================
    //  🎨 پنل (ریسپانسیو موبایل + لمسی)
    // ================================================================
    function createPanel(){
        var oldPanel = document.getElementById('collector-panel');
        if(oldPanel) oldPanel.remove();

        var floatBtn = document.getElementById('collector-float-btn');
        if(floatBtn){
            floatBtn.style.display = 'block';
            floatBtn.style.visibility = 'visible';
            floatBtn.style.opacity = '1';
        }

        // ✅ تشخیص موبایل برای سایز پنل
        var isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || window.innerWidth < 600;

        var panel = document.createElement('div');
        panel.id = 'collector-panel';
        panel.style.cssText = `
            position: fixed; top: 10px; left: 10px; right: 10px;
            width: auto; max-width: ${isMobile ? '100%' : '500px'};
            max-height: 92vh;
            background: #1e293b; color: #e2e8f0;
            border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.5);
            z-index: 9999999; font-family: Tahoma, Arial, sans-serif;
            direction: rtl; display: flex; flex-direction: column; overflow: hidden;
        `;

        var header = document.createElement('div');
        header.style.cssText = `
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 14px; display: flex; justify-content: space-between;
            align-items: center; user-select: none; cursor: move;
            touch-action: none;
        `;
        header.innerHTML = `
            <strong style="font-size:16px;">📥 انتقال از بینا به سیدا</strong>
            <div style="display:flex;gap:6px;">
                <span id="cp-min" title="مینیمایز" style="cursor:pointer;font-size:17px;padding:6px 12px;background:rgba(255,255,255,0.15);border-radius:6px;user-select:none;">➖</span>
                <span id="cp-reset" title="ریست پنل" style="cursor:pointer;font-size:17px;padding:6px 12px;background:rgba(255,255,255,0.15);border-radius:6px;user-select:none;">🔄</span>
                <span id="cp-close" title="بستن" style="cursor:pointer;font-size:17px;padding:6px 12px;background:rgba(255,255,255,0.15);border-radius:6px;user-select:none;">✖</span>
            </div>
        `;

        var status = document.createElement('div');
        status.id = 'cp-status';
        status.style.cssText = `
            padding: 12px 14px; background: #0f172a;
            font-size: 14px; color: #94a3b8; border-bottom: 1px solid #334155;
        `;

        var body = document.createElement('div');
        body.id = 'cp-body';
        body.style.cssText = `
            padding: 12px; display: flex; flex-direction: column; gap: 10px;
            overflow-y: auto; flex: 1; min-height: 0;
            -webkit-overflow-scrolling: touch;
        `;

        var tabBar = document.createElement('div');
        tabBar.style.cssText = `
            display: flex; gap: 6px; border-bottom: 2px solid #334155; padding-bottom: 6px;
        `;

        function makeTab(id, label, active){
            var t = document.createElement('div');
            t.id = 'cp-tab-' + id;
            t.textContent = label;
            t.style.cssText = `
                padding: 10px 12px; cursor: pointer; border-radius: 8px;
                font-size: 14px; font-weight: bold;
                background: ${active ? '#3b82f6' : 'rgba(255,255,255,0.05)'};
                color: ${active ? 'white' : '#94a3b8'};
                transition: all 0.2s; flex: 1; text-align: center;
                user-select: none;
                -webkit-tap-highlight-color: transparent;
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
        contentActions.id = 'cp-content-actions';
        contentActions.style.cssText = 'display:flex;flex-direction:column;gap:10px;';

        var contentStorage = document.createElement('div');
        contentStorage.id = 'cp-content-storage';
        contentStorage.style.cssText = 'display:none;flex-direction:column;gap:10px;';

        var contentLog = document.createElement('div');
        contentLog.id = 'cp-content-log';
        contentLog.style.cssText = 'display:none;flex-direction:column;gap:10px;';

        var btnCollectSingle = document.createElement('button');
        btnCollectSingle.innerHTML = '📥 جمع‌آوری این دانش‌آموز';
        btnCollectSingle.style.cssText = `
            padding: 16px; background: #10b981; color: white; border: none;
            border-radius: 10px; cursor: pointer; font-size: 15px; font-weight: bold;
            font-family: inherit; -webkit-tap-highlight-color: transparent;
            touch-action: manipulation;
        `;
        btnCollectSingle.onmouseenter = function(){ this.style.background = '#059669'; };
        btnCollectSingle.onmouseleave = function(){ this.style.background = '#10b981'; };

        var btnFetchList = document.createElement('button');
        btnFetchList.innerHTML = '📋 دریافت لیست همه دانش‌آموزان';
        btnFetchList.style.cssText = `
            padding: 16px; background: #8b5cf6; color: white; border: none;
            border-radius: 10px; cursor: pointer; font-size: 15px; font-weight: bold;
            font-family: inherit; -webkit-tap-highlight-color: transparent;
            touch-action: manipulation;
        `;
        btnFetchList.onmouseenter = function(){ this.style.background = '#7c3aed'; };
        btnFetchList.onmouseleave = function(){ this.style.background = '#8b5cf6'; };

        var btnAutoCollect = document.createElement('button');
        btnAutoCollect.innerHTML = '🚀 استخراج خودکار همه';
        btnAutoCollect.style.cssText = `
            padding: 18px; background: linear-gradient(135deg,#f59e0b,#dc2626);
            color: white; border: none; border-radius: 10px; cursor: pointer;
            font-size: 16px; font-weight: bold; font-family: inherit;
            -webkit-tap-highlight-color: transparent; touch-action: manipulation;
        `;

        var btnStop = document.createElement('button');
        btnStop.innerHTML = '⏹️ توقف استخراج';
        btnStop.style.cssText = `
            padding: 16px; background: #dc2626; color: white; border: none;
            border-radius: 10px; cursor: pointer; font-size: 15px; font-weight: bold;
            font-family: inherit; display: none;
            -webkit-tap-highlight-color: transparent; touch-action: manipulation;
        `;

        var btnCopyForSida = document.createElement('button');
        btnCopyForSida.innerHTML = '📋 کپی JSON برای سیدا';
        btnCopyForSida.style.cssText = `
            padding: 16px; background: #0ea5e9; color: white; border: none;
            border-radius: 10px; cursor: pointer; font-size: 15px; font-weight: bold;
            font-family: inherit; -webkit-tap-highlight-color: transparent;
            touch-action: manipulation;
        `;
        btnCopyForSida.onmouseenter = function(){ this.style.background = '#0284c7'; };
        btnCopyForSida.onmouseleave = function(){ this.style.background = '#0ea5e9'; };

        contentActions.appendChild(btnCollectSingle);
        contentActions.appendChild(btnFetchList);
        contentActions.appendChild(btnAutoCollect);
        contentActions.appendChild(btnStop);
        contentActions.appendChild(btnCopyForSida);

        var btnView = document.createElement('button');
        btnView.innerHTML = '📋 مشاهده لیست';
        btnView.style.cssText = `
            padding: 14px; background: #8b5cf6; color: white; border: none;
            border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: bold;
            font-family: inherit; -webkit-tap-highlight-color: transparent;
            touch-action: manipulation;
        `;

        var btnExport = document.createElement('button');
        btnExport.innerHTML = '📊 خروجی اکسل';
        btnExport.style.cssText = `
            padding: 14px; background: #059669; color: white; border: none;
            border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: bold;
            font-family: inherit; -webkit-tap-highlight-color: transparent;
            touch-action: manipulation;
        `;

        var btnClearAll = document.createElement('button');
        btnClearAll.innerHTML = '🗑️ پاک کردن کل انبار و لیست';
        btnClearAll.style.cssText = `
            padding: 14px; background: #dc2626; color: white; border: none;
            border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: bold;
            font-family: inherit; -webkit-tap-highlight-color: transparent;
            touch-action: manipulation;
        `;

        var searchBox = document.createElement('input');
        searchBox.type = 'text';
        searchBox.placeholder = '🔎 جستجو (کد ملی یا نام)...';
        searchBox.style.cssText = `
            padding: 12px 14px; background: #0f172a; color: #e2e8f0;
            border: 1px solid #334155; border-radius: 8px; font-family: inherit;
            font-size: 15px; direction: rtl; outline: none;
        `;

        var storageList = document.createElement('div');
        storageList.id = 'cp-storage-list';
        storageList.style.cssText = `
            background: #0f172a; border-radius: 8px; padding: 12px;
            font-size: 14px; line-height: 2; color: #cbd5e1;
            max-height: 400px; min-height: 150px; overflow-y: auto;
            direction: rtl; text-align: right; border: 1px solid #334155;
        `;
        storageList.textContent = 'خالی';

        contentStorage.appendChild(searchBox);
        contentStorage.appendChild(btnView);
        contentStorage.appendChild(btnExport);
        contentStorage.appendChild(btnClearAll);
        contentStorage.appendChild(storageList);

        var logToolbar = document.createElement('div');
        logToolbar.style.cssText = 'display:flex;gap:6px;';

        var btnCopyLog = document.createElement('button');
        btnCopyLog.innerHTML = '📋 کپی';
        btnCopyLog.style.cssText = `
            flex: 1; padding: 12px; background: #3b82f6; color: white; border: none;
            border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: bold;
            font-family: inherit; -webkit-tap-highlight-color: transparent;
            touch-action: manipulation;
        `;

        var btnWordLog = document.createElement('button');
        btnWordLog.innerHTML = '📄 Word';
        btnWordLog.style.cssText = `
            flex: 1; padding: 12px; background: #059669; color: white; border: none;
            border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: bold;
            font-family: inherit; -webkit-tap-highlight-color: transparent;
            touch-action: manipulation;
        `;

        var btnClearLog = document.createElement('button');
        btnClearLog.innerHTML = '🗑️';
        btnClearLog.title = 'پاک کردن گزارش';
        btnClearLog.style.cssText = `
            padding: 12px 14px; background: #475569; color: white; border: none;
            border-radius: 8px; cursor: pointer; font-size: 13px; font-family: inherit;
            -webkit-tap-highlight-color: transparent; touch-action: manipulation;
        `;

        logToolbar.appendChild(btnCopyLog);
        logToolbar.appendChild(btnWordLog);
        logToolbar.appendChild(btnClearLog);

        var log = document.createElement('div');
        log.id = 'cp-log';
        log.style.cssText = `
            background: #0f172a; border-radius: 8px; padding: 12px;
            font-family: Consolas, monospace; font-size: 13px; line-height: 2;
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

        function switchTab(id){
            ['actions','storage','log'].forEach(function(t){
                var tab = document.getElementById('cp-tab-' + t);
                var content = document.getElementById('cp-content-' + t);
                if(t === id){
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

        tabActions.onclick = function(){ switchTab('actions'); };
        tabStorage.onclick = function(){ switchTab('storage'); };
        tabLog.onclick = function(){ switchTab('log'); };

        var logs = { collect: [] };

        function renderLog(){
            if(logs.collect.length === 0){
                log.innerHTML = '<span style="color:#64748b;">گزارشی نیست...</span>';
                return;
            }

            var html = '<div style="color:#cbd5e1;">📥 جمع‌آوری از بینا:</div>';
            html += '<div style="color:#94a3b8;">───────────────────────</div>';

            logs.collect.forEach(function(item){
                var color = '#cbd5e1';
                if(item.type === 'success') color = '#10b981';
                else if(item.type === 'error') color = '#ef4444';
                else if(item.type === 'warning') color = '#f59e0b';
                else if(item.type === 'info') color = '#3b82f6';

                html += '<div style="color:' + color + ';">[' + item.time + '] ' + escapeHtml(item.text) + '</div>';
            });

            log.innerHTML = html;
            log.scrollTop = log.scrollHeight;
        }

        function escapeHtml(str){
            return String(str)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');
        }

        function getLogText(){
            if(logs.collect.length === 0) return 'گزارشی نیست';

            var text = '📥 جمع‌آوری از بینا:\n───────────────────────\n';
            logs.collect.forEach(function(item){
                text += '[' + item.time + '] ' + item.text + '\n';
            });
            return text;
        }

        function logMsg(msg, type){
            type = type || 'default';
            var time = new Date().toLocaleTimeString('fa-IR').substring(0, 8);
            logs.collect.push({
                text: msg,
                type: type,
                time: time
            });
            renderLog();
        }

        function updateStatus(){
            var c = getStorageCount();
            var listCount = getStudentList().length;
            status.innerHTML = '🌐 <b style="color:#10b981;">بینا</b> — انبار: <b>' + c + '</b> | لیست: <b>' + listCount + '</b>';
        }
        updateStatus();

        function collectSingle(){
            try {
                var data = extractFromDoc(document);
                var nationalId = data.student.nationalId;
                if(!nationalId){
                    logMsg('❌ کد ملی پیدا نشد', 'error');
                    showToast('کد ملی پیدا نشد!', 'error');
                    return;
                }
                logMsg('👤 ' + (data.student.firstName || '?') + ' ' + (data.student.lastName || '?') + ' | ' + nationalId, 'info');
                var total = saveToStorage(nationalId, data);
                logMsg('✅ ذخیره شد (کل: ' + total + ')', 'success');
                updateStatus();
                showToast('انجام شد', 'success');
            } catch(e){
                logMsg('❌ خطا: ' + e.message, 'error');
                showToast('خطا: ' + e.message, 'error');
            }
        }

        var autoRunning = false;
        var shouldStop = false;

        function startAutoCollect(){
            var list = getStudentList();
            if(list.length === 0){
                showToast('اول لیست رو دریافت کن!', 'warning');
                logMsg('❌ لیست خالیه. اول «دریافت لیست» رو بزن', 'error');
                return;
            }

            autoRunning = true;
            shouldStop = false;
            btnAutoCollect.style.display = 'none';
            btnStop.style.display = 'block';

            logMsg('🚀 شروع استخراج خودکار برای ' + list.length + ' دانش‌آموز', 'info');
            logMsg('───────────────────────', 'default');

            var iframe = document.createElement('iframe');
            iframe.id = 'cp-iframe';
            iframe.style.cssText = 'position:fixed;width:1200px;height:800px;opacity:0;pointer-events:none;z-index:-1;top:0;left:0;';
            document.body.appendChild(iframe);

            var index = 0;
            var success = 0;
            var failed = 0;

            function processNext(){
                if(shouldStop){
                    logMsg('⏹️ متوقف شد', 'warning');
                    finishAuto();
                    return;
                }

                if(index >= list.length){
                    logMsg('🎉 همه تمام شد!', 'success');
                    finishAuto();
                    return;
                }

                var student = list[index];
                var currentNum = index + 1;

                var store = getStorage();
                if(store[student.nationalId]){
                    logMsg('⏭️ ' + currentNum + '. ' + student.firstName + ' ' + student.lastName + ' (قبلاً ذخیره)', 'default');
                    index++;
                    processNext();
                    return;
                }

                logMsg('🔄 ' + currentNum + '/' + list.length + '. ' + student.firstName + ' ' + student.lastName, 'info');

                var url = '/student-pre-registration/school/prereg-review?caseId=' + 
                          student.caseId + '&from=school-final-registrations';

                iframe.src = url;

                var checkCount = 0;
                var maxChecks = 120;

                function checkLoaded(){
                    checkCount++;

                    if(shouldStop){
                        finishAuto();
                        return;
                    }

                    try {
                        var doc = iframe.contentDocument || iframe.contentWindow.document;
                        var loaded = doc.getElementById('prereg-field-error--studentFirstName');

                        if(loaded){
                            setTimeout(function(){
                                if(shouldStop){
                                    finishAuto();
                                    return;
                                }
                                try {
                                    var data = extractFromDoc(doc);
                                    if(data.student.nationalId){
                                        var total = saveToStorage(data.student.nationalId, data);
                                        success++;
                                        logMsg('   ✅ ذخیره (' + total + ' در انبار)', 'success');
                                        updateStatus();
                                    } else {
                                        failed++;
                                        logMsg('   ❌ ناموفق — کد ملی پیدا نشد', 'error');
                                    }
                                } catch(e){
                                    failed++;
                                    logMsg('   ❌ ناموفق — ' + e.message, 'error');
                                }
                                index++;
                                setTimeout(processNext, 500);
                            }, 1500);
                            return;
                        }
                    } catch(e){
                        if(checkCount === 1){
                            logMsg('   ❌ ناموفق — خطای iframe', 'error');
                            failed++;
                            index++;
                            setTimeout(processNext, 500);
                            return;
                        }
                    }

                    if(checkCount >= maxChecks){
                        failed++;
                        logMsg('   ❌ ناموفق', 'error');
                        index++;
                        setTimeout(processNext, 500);
                        return;
                    }

                    setTimeout(checkLoaded, 500);
                }

                setTimeout(checkLoaded, 1000);
            }

            var isFinished = false;
            function finishAuto(){
                if(isFinished) return;
                isFinished = true;

                autoRunning = false;
                btnAutoCollect.style.display = 'block';
                btnStop.style.display = 'none';
                var ifr = document.getElementById('cp-iframe');
                if(ifr) ifr.remove();
                logMsg('═══════════════════════', 'default');
                logMsg('✅ موفق: ' + success + ' | ❌ ناموفق: ' + failed, success > 0 ? 'success' : 'default');
                updateStatus();
                showToast('🎉 ' + success + ' دانش‌آموز ذخیره شد!', 'success');
            }

            processNext();
        }

        function renderStorageList(filter){
            var s = getStorage();
            var keys = Object.keys(s);

            if(filter){
                filter = filter.trim().toLowerCase();
                keys = keys.filter(function(k){
                    var item = s[k];
                    var d = (item.data || item).student || {};
                    var name = ((d.firstName || '') + ' ' + (d.lastName || '')).toLowerCase();
                    return k.indexOf(filter) > -1 || name.indexOf(filter) > -1;
                });
            }

            if(keys.length === 0){
                storageList.innerHTML = '<div style="color:#64748b;text-align:center;padding:20px;font-size:14px;">خالی</div>';
                return;
            }

            var html = '';
            keys.forEach(function(k){
                var item = s[k];
                var d = (item.data || item).student || {};
                var name = (d.firstName || '?') + ' ' + (d.lastName || '?');

                html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:12px;margin-bottom:8px;background:#1e293b;border-radius:8px;border-right:4px solid #3b82f6;gap:8px;">';
                html += '<div style="flex:1;min-width:0;">';
                html += '<div style="font-size:14px;font-weight:bold;color:#e2e8f0;">' + name + '</div>';
                html += '<div style="font-size:12px;color:#94a3b8;">کد ملی: ' + k + '</div>';
                html += '</div>';
                html += '<button class="cp-delete-btn" data-key="' + k + '" style="background:#dc2626;color:white;border:none;border-radius:6px;padding:8px 12px;cursor:pointer;font-size:13px;font-family:inherit;flex-shrink:0;touch-action:manipulation;">🗑️</button>';
                html += '</div>';
            });

            storageList.innerHTML = html;

            storageList.querySelectorAll('.cp-delete-btn').forEach(function(b){
                b.onclick = function(){
                    var key = this.getAttribute('data-key');
                    if(confirm('حذف دانش‌آموز با کد ملی ' + key + '؟')){
                        deleteFromStorage(key);
                        updateStatus();
                        renderStorageList(searchBox.value);
                        showToast('حذف شد', 'success');
                    }
                };
            });
        }

        btnCollectSingle.onclick = collectSingle;

        btnFetchList.onclick = function(){
            btnFetchList.disabled = true;
            btnFetchList.innerHTML = '⏳ در حال دریافت...';
            logMsg('📋 دریافت لیست دانش‌آموزان...', 'info');

            fetchStudentList().then(function(result){
                logMsg('✅ ' + result.students.length + ' دانش‌آموز دریافت شد (total: ' + result.total + ')', 'success');
                updateStatus();
                btnFetchList.disabled = false;
                btnFetchList.innerHTML = '📋 دریافت لیست همه دانش‌آموزان';
                showToast('لیست دریافت شد: ' + result.students.length + ' نفر', 'success');
            }).catch(function(e){
                logMsg('❌ خطا: ' + e.message, 'error');
                btnFetchList.disabled = false;
                btnFetchList.innerHTML = '📋 دریافت لیست همه دانش‌آموزان';
                showToast('خطا در دریافت لیست', 'error');
            });
        };

        btnAutoCollect.onclick = startAutoCollect;
        btnStop.onclick = function(){ shouldStop = true; };

        btnCopyForSida.onclick = function(){
            try {
                var data = getStorage();
                var keys = Object.keys(data);

                if(keys.length === 0){
                    showToast('انبار خالیه!', 'warning');
                    logMsg('❌ انبار خالیه', 'error');
                    return;
                }

                var json = JSON.stringify(data);
                var sizeKB = Math.round(json.length / 1024);

                logMsg('📋 کپی ' + keys.length + ' نفر (' + sizeKB + ' KB)...', 'info');

                function doCopy(text) {
                    if (navigator.clipboard && navigator.clipboard.writeText) {
                        navigator.clipboard.writeText(text).then(function(){
                            showToast('✅ ' + keys.length + ' نفر کپی شد (' + sizeKB + ' KB)', 'success');
                            logMsg('✅ در کلیپ‌بورد کپی شد (' + sizeKB + ' KB)', 'success');
                            logMsg('👉 حالا برو سیدا و «📥 پیست از کلیپ‌بورد» رو بزن', 'info');
                        }).catch(function(err){
                            logMsg('⚠️ clipboard API خطا: ' + err.message, 'warning');
                            fallbackCopyClipboard(text);
                        });
                    } else {
                        fallbackCopyClipboard(text);
                    }
                }

                function fallbackCopyClipboard(text) {
                    var ta = document.createElement('textarea');
                    ta.value = text;
                    ta.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);width:90%;height:300px;z-index:99999999;direction:ltr;font-family:monospace;font-size:12px;padding:10px;border:3px solid #0ea5e9;border-radius:10px;';
                    document.body.appendChild(ta);
                    ta.select();
                    ta.focus();
                    try {
                        document.execCommand('copy');
                        showToast('✅ کپی شد! حالا Ctrl+V تو سیدا', 'success');
                        logMsg('✅ در کلیپ‌بورد کپی شد (' + sizeKB + ' KB)', 'success');
                    } catch(e) {
                        showToast('⚠️ Ctrl+C بزن و برو سیدا', 'warning');
                        logMsg('⚠️ لطفاً Ctrl+C بزن', 'warning');
                    }

                    setTimeout(function(){
                        if (ta.parentNode) ta.parentNode.removeChild(ta);
                    }, 30000);
                }

                doCopy(json);

            } catch(e){
                logMsg('❌ خطا: ' + e.message, 'error');
                showToast('خطا: ' + e.message, 'error');
            }
        };

        btnView.onclick = function(){
            renderStorageList('');
            searchBox.value = '';
        };

        btnExport.onclick = function(){ exportToExcel(); };

        btnClearAll.onclick = function(){
            if(confirm('⚠️ کل انبار و لیست دانش‌آموزان پاک بشه؟')){
                clearStorage();
                clearStudentList();
                updateStatus();
                renderStorageList('');
                showToast('انبار و لیست پاک شد', 'success');
                logMsg('🗑️ انبار و لیست پاک شد', 'warning');
            }
        };

        btnClearLog.onclick = function(){
            logs.collect = [];
            renderLog();
            showToast('گزارش پاک شد', 'info');
        };

        btnCopyLog.onclick = function(){ copyLogToClipboard(getLogText()); };

        btnWordLog.onclick = function(){
            exportLogToWord(logs.collect);
        };

        searchBox.oninput = function(){
            renderStorageList(this.value);
        };

        var isMinimized = false;

        document.getElementById('cp-min').onclick = function(e){
            e.stopPropagation();
            isMinimized = !isMinimized;
            if(isMinimized){
                body.style.display = 'none';
                status.style.display = 'none';
                panel.style.width = '280px';
                panel.style.right = 'auto';
                this.textContent = '➕';
            } else {
                body.style.display = 'flex';
                status.style.display = 'block';
                panel.style.width = '';
                panel.style.right = '10px';
                this.textContent = '➖';
            }
        };

        document.getElementById('cp-reset').onclick = function(e){
            e.stopPropagation();
            logs.collect = [];
            renderLog();
            switchTab('actions');
            if(isMinimized){
                body.style.display = 'flex';
                status.style.display = 'block';
                panel.style.width = '';
                panel.style.right = '10px';
                document.getElementById('cp-min').textContent = '➖';
                isMinimized = false;
            }
            panel.style.left = '10px';
            panel.style.top = '10px';
            panel.style.right = '10px';
            panel.style.bottom = 'auto';
            showToast('پنل ریست شد', 'info');
        };

        document.getElementById('cp-close').onclick = function(e){
            e.stopPropagation();
            if(autoRunning){
                if(!confirm('استخراج در حال اجراست. ببندی؟')) return;
                shouldStop = true;
            }
            panel.remove();
            var b = document.getElementById('collector-float-btn');
            if(b){
                b.style.display = 'block';
                b.style.visibility = 'visible';
                b.style.opacity = '1';
            }
        };

        // ===== درگ پنل (Mouse + Touch) =====
        var isDraggingPanel = false;
        var panelDragX = 0, panelDragY = 0;

        header.addEventListener('mousedown', function(e){
            if(e.target.id === 'cp-min' || e.target.id === 'cp-reset' || e.target.id === 'cp-close') return;
            if(e.button !== 0) return;
            isDraggingPanel = true;
            var rect = panel.getBoundingClientRect();
            panelDragX = e.clientX - rect.left;
            panelDragY = e.clientY - rect.top;
            panel.style.right = 'auto';
            panel.style.bottom = 'auto';
            panel.style.width = Math.min(rect.width, window.innerWidth - 20) + 'px';
            document.body.style.userSelect = 'none';
            e.preventDefault();
        });

        document.addEventListener('mousemove', function(e){
            if(!isDraggingPanel) return;
            var newLeft = e.clientX - panelDragX;
            var newTop = e.clientY - panelDragY;
            var maxX = window.innerWidth - panel.offsetWidth;
            var maxY = window.innerHeight - panel.offsetHeight;
            newLeft = Math.max(0, Math.min(newLeft, maxX));
            newTop = Math.max(0, Math.min(newTop, maxY));
            panel.style.left = newLeft + 'px';
            panel.style.top = newTop + 'px';
        });

        document.addEventListener('mouseup', function(){
            if(isDraggingPanel){
                isDraggingPanel = false;
                document.body.style.userSelect = '';
            }
        });

        // ✅ Touch Drag Panel
        var isTouchDraggingPanel = false;
        var touchPanelOffsetX = 0, touchPanelOffsetY = 0;

        header.addEventListener('touchstart', function(e){
            if(e.target.id === 'cp-min' || e.target.id === 'cp-reset' || e.target.id === 'cp-close') return;
            var touch = e.touches[0];
            isTouchDraggingPanel = true;
            var rect = panel.getBoundingClientRect();
            touchPanelOffsetX = touch.clientX - rect.left;
            touchPanelOffsetY = touch.clientY - rect.top;
            panel.style.right = 'auto';
            panel.style.bottom = 'auto';
            panel.style.width = Math.min(rect.width, window.innerWidth - 20) + 'px';
        }, { passive: true });

        header.addEventListener('touchmove', function(e){
            if(!isTouchDraggingPanel) return;
            e.preventDefault();
            var touch = e.touches[0];
            var newLeft = touch.clientX - touchPanelOffsetX;
            var newTop = touch.clientY - touchPanelOffsetY;
            var maxX = window.innerWidth - panel.offsetWidth;
            var maxY = window.innerHeight - panel.offsetHeight;
            newLeft = Math.max(0, Math.min(newLeft, maxX));
            newTop = Math.max(0, Math.min(newTop, maxY));
            panel.style.left = newLeft + 'px';
            panel.style.top = newTop + 'px';
        }, { passive: false });

        header.addEventListener('touchend', function(){
            isTouchDraggingPanel = false;
        }, { passive: true });

        switchTab('actions');
        logMsg('پنل آماده. اول «دریافت لیست» رو بزن', 'info');
        console.log('✅ پنل موبایل باز شد');
    }
})();

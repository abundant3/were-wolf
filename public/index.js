/* ══════════════════════════════════════
   § 全局配置
   ══════════════════════════════════════ */

var settingsKey = 'settings';
var backgroundAudioControl = null;
var backgroundAudioPath = '/static/audio/画音工作室-子鹤.mp3';

var settings = {
    backgroundAudio: 0,
    soundEffectAudio: 0,
    notificationAudio: 0,
    endpointAddress: '',
    endpointKey: '',
    defaultModel: ''
};

var roleList = [];

document.addEventListener('DOMContentLoaded', async function () {
    await configToastr();
    await loadSettings();
    bindGlobalEvents();
    window.addEventListener('hashchange', function () {
        switchView(getViewFromHash());
    });
    switchView(getViewFromHash());
});

document.addEventListener('click', async function () {
    await playBackgroundAudio();
});

async function configToastr() {
    toastr.options = {
        closeButton: false,
        debug: false,
        newestOnTop: false,
        progressBar: false,
        positionClass: "toast-top-center",
        preventDuplicates: false,
        onclick: null,
        showDuration: 300,
        hideDuration: 1000,
        timeOut: 2000,
        extendedTimeOut: 1000,
        showEasing: "swing",
        hideEasing: "linear",
        showMethod: "fadeIn",
        hideMethod: "fadeOut"
    };
}

async function loadSettings() {
    try {
        var raw = localStorage.getItem(settingsKey);
        if (!raw) return;
        var loadedSettings = JSON.parse(raw);
        settings.backgroundAudio = loadedSettings.backgroundAudio || 0;
        settings.soundEffectAudio = loadedSettings.soundEffectAudio || 0;
        settings.notificationAudio = loadedSettings.notificationAudio || 0;
        settings.endpointAddress = loadedSettings.endpointAddress || 'https://mixed.strai.life';
        settings.endpointKey = loadedSettings.endpointKey || 'sk-HALdMZeiRaLWhv2HoRZ1dhAnMNrE7Svz0wWg7kkCsJbzJsn9';
        settings.defaultModel = loadedSettings.defaultModel || '[ais]gemini-3.5-flash';
        return true;
    } catch (error) {
        return false;
    }
}

async function saveSettings() {
    try {
        localStorage.setItem(settingsKey, JSON.stringify(settings));
        return true;
    } catch (error) {
        return false;
    }
}

function ensureAudioElement() {
    if (backgroundAudioControl) return;
    backgroundAudioControl = document.createElement('audio');
    backgroundAudioControl.id = 'bg-audio-player';
    backgroundAudioControl.loop = true;
    backgroundAudioControl.preload = 'auto';
    backgroundAudioControl.setAttribute('playsinline', '');
    backgroundAudioControl.setAttribute('webkit-playsinline', '');
    backgroundAudioControl.src = encodeURI(backgroundAudioPath);
    document.body.appendChild(backgroundAudioControl);
}

async function setBackgroundAudioVolume(volume) {
    var vol = Math.max(0, Math.min(1, volume));
    settings.backgroundAudio = vol;
    ensureAudioElement();
    backgroundAudioControl.volume = vol;
    await saveSettings();
    if (vol > 0) {
        try {
            await backgroundAudioControl.play();
            if ('mediaSession' in navigator) {
                navigator.mediaSession.metadata = new MediaMetadata({
                    title: '狼人杀',
                    artist: '画音工作室-子鹤'
                });
                navigator.mediaSession.playbackState = 'playing';
            }
        } catch (e) {}
    } else {
        if (!backgroundAudioControl.paused) {
            backgroundAudioControl.pause();
            if ('mediaSession' in navigator) {
                navigator.mediaSession.playbackState = 'paused';
            }
        }
    }
}

async function playBackgroundAudio() {
    ensureAudioElement();
    if (settings.backgroundAudio > 0) {
        backgroundAudioControl.volume = Math.max(0, Math.min(1, settings.backgroundAudio));
        try {
            await backgroundAudioControl.play();
            if ('mediaSession' in navigator) {
                navigator.mediaSession.metadata = new MediaMetadata({
                    title: '狼人杀',
                    artist: '画音工作室-子鹤'
                });
                navigator.mediaSession.playbackState = 'playing';
            }
        } catch (e) {}
    } else {
        if (!backgroundAudioControl.paused) {
            backgroundAudioControl.pause();
            if ('mediaSession' in navigator) {
                navigator.mediaSession.playbackState = 'paused';
            }
        }
    }
}

/* ══════════════════════════════════════
   § 路由管理
   ══════════════════════════════════════ */

var VIEW_TITLES = {
    home: '',
    creating: '房间设置',
    rolepool: '角色管理',
    settings: '游戏设置',
    savepool: '会议管理',
    meeting: ''
};

var FOOTER_TPL_VIEWS = { creating: true, rolepool: true, meeting: true };

var currentView = null;
var headerTitle = document.querySelector('.header-banner-title');
var headerValue = document.getElementById('header-value');
var footerBanner = document.getElementById('footer-banner');
var allViews = document.querySelectorAll('[data-view]');

function getViewFromHash() {
    var hash = window.location.hash.replace('#/', '').replace('#', '');
    return hash && VIEW_TITLES.hasOwnProperty(hash) ? hash : 'home';
}

function navigate(view) {
    if (!VIEW_TITLES.hasOwnProperty(view)) return;
    window.location.hash = '#/' + view;
}

function switchView(view) {
    if (view === currentView) return;

    if (currentView && window['view' + capitalize(currentView)]) {
        var prev = window['view' + capitalize(currentView)];
        if (prev.destroy) prev.destroy();
    }

    allViews.forEach(function (el) { el.style.display = 'none'; });
    var target = document.querySelector('[data-view="' + view + '"]');
    if (target) target.style.display = '';

    var title = VIEW_TITLES[view] || '';
    headerValue.textContent = title;
    if (title) {
        headerTitle.classList.add('value-title');
    } else {
        headerTitle.classList.remove('value-title');
    }

    if (FOOTER_TPL_VIEWS[view]) {
        var tpl = document.querySelector('[data-footer-tpl="' + view + '"]');
        footerBanner.innerHTML = tpl ? tpl.innerHTML : '';
        footerBanner.classList.add('footer-actions');
    } else {
        footerBanner.innerHTML = '';
        footerBanner.classList.remove('footer-actions');
    }

    var module = window['view' + capitalize(view)];
    if (module && module.init) module.init();

    currentView = view;
}

function capitalize(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
}

function bindGlobalEvents() {
    document.querySelector('.content-container').addEventListener('click', function (e) {
        var btn = e.target.closest('.switch-control-button');
        if (btn) {
            navigate(btn.getAttribute('data-action'));
            return;
        }
    });

    footerBanner.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-footer]');
        if (!btn) return;
        var action = btn.getAttribute('data-footer');
        if (action === 'back') navigate('home');
    });
}


/* ══════════════════════════════════════
   § Creating - 房间设置
   ══════════════════════════════════════ */

var ROLES = [
    { id: 'werewolf', name: '狼人', camp: 'wolf', icon: '狼', desc: '每晚可以杀害一名玩家，与其他狼人共同行动。' },
    { id: 'wolfking', name: '狼王', camp: 'wolf', icon: '狼王', desc: '参与刀人环节。白天被动致死（投死、枪杀等，非女巫毒杀）时可被动带走一名玩家，被带走者无遗言。' },
    { id: 'whitewolfking', name: '白狼王', camp: 'wolf', icon: '白狼', desc: '参与刀人环节。白天可随时主动自爆并带走一名玩家，被带走者无遗言。但被动死亡不能发动技能。' },
    { id: 'villager', name: '村民', camp: 'good', icon: '村', desc: '没有特殊能力，依靠推理和投票找出狼人。' },
    { id: 'seer', name: '预言家', camp: 'good', icon: '预', desc: '每晚可以查验一名玩家的阵营。' },
    { id: 'witch', name: '女巫', camp: 'good', icon: '女', desc: '拥有一瓶解药和一瓶毒药，各限用一次。' },
    { id: 'hunter', name: '猎人', camp: 'good', icon: '猎', desc: '死亡时可以开枪带走一名玩家。' },
    { id: 'guard', name: '守卫', camp: 'good', icon: '守', desc: '每晚可以守护一名玩家免受狼人袭击，不能连续守同一人。' },
    { id: 'idiot', name: '白痴', camp: 'good', icon: '白', desc: '被投票出局时翻牌免死，之后失去投票权但可发言。' },
    { id: 'cupid', name: '丘比特', camp: 'good', icon: '丘', desc: '游戏开始时指定两名玩家为恋人，恋人一方死亡则另一方殉情。' }
];

var MODE_DESC = {
    beginner: '简化规则，适合初次体验狼人杀的玩家',
    expert: '完整规则，包含所有特殊能力与判定流程'
};

var _c = {
    playerCount: 12,
    selectedRoles: [
        { id: 'werewolf', qty: 4 },
        { id: 'seer', qty: 1 },
        { id: 'witch', qty: 1 },
        { id: 'guard', qty: 1 },
        { id: 'hunter', qty: 1 },
        { id: 'villager', qty: 4 }
    ],
    gameMode: 'beginner',
    modalQty: 1,
    bound: {}
};

function shuffleArray(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }
    return arr;
}

window.viewCreating = {
    init: function () {
        var els = getCreatingEls();
        if (!els.roleSelect.querySelector('option[value="werewolf"]')) {
            buildRoleSelect(els.roleSelect);
        }
        renderCreating();
        bindCreatingEvents();
    },
    destroy: function () {
        unbindCreatingEvents();
        var modal = document.getElementById('creating-modal');
        if (modal) modal.style.display = 'none';
    }
};

function getCreatingEls() {
    return {
        roomName: document.getElementById('room-name'),
        playerName: document.getElementById('player-name'),
        playerCount: document.getElementById('player-count'),
        assignedCount: document.getElementById('assigned-count'),
        totalCount: document.getElementById('total-count'),
        roleWarning: document.getElementById('role-warning'),
        roleList: document.getElementById('role-list'),
        modeDesc: document.getElementById('mode-desc'),
        modal: document.getElementById('creating-modal'),
        roleSelect: document.getElementById('role-select'),
        roleQty: document.getElementById('role-qty'),
        roleDesc: document.getElementById('role-desc'),
        modeBeginner: document.getElementById('mode-beginner'),
        modeExpert: document.getElementById('mode-expert')
    };
}

function buildRoleSelect(select) {
    ROLES.forEach(function (role) {
        var opt = document.createElement('option');
        opt.value = role.id;
        opt.textContent = role.name;
        select.appendChild(opt);
    });
}

function renderCreating() {
    var els = getCreatingEls();
    els.playerCount.textContent = _c.playerCount;
    els.totalCount.textContent = _c.playerCount;
    updateCreatingModeUI(els);
    renderCreatingRoleList(els);
    updateCreatingWarning(els);
}

function renderCreatingRoleList(els) {
    els.roleList.innerHTML = '';
    _c.selectedRoles.forEach(function (item, index) {
        var roleDef = ROLES.find(function (r) { return r.id === item.id; });
        if (!roleDef) return;
        var row = document.createElement('div');
        row.className = 'role-item-row';
        row.innerHTML =
            '<div class="role-item-info">' +
            '<span class="role-item-badge ' + roleDef.camp + '">' + roleDef.icon + '</span>' +
            '<span class="role-item-name">' + roleDef.name + '</span>' +
            '</div>' +
            '<div class="role-item-info">' +
            '<span class="role-item-qty">×' + item.qty + '</span>' +
            '<button class="role-item-remove" data-index="' + index + '">✕</button>' +
            '</div>';
        els.roleList.appendChild(row);
    });
}

function getAssignedCount() {
    var total = 0;
    _c.selectedRoles.forEach(function (item) { total += item.qty; });
    return total;
}

function getWolfCount() {
    var wolf = _c.selectedRoles.find(function (r) { return r.id === 'werewolf'; });
    return wolf ? wolf.qty : 0;
}

function updateCreatingWarning(els) {
    var assigned = getAssignedCount();
    els.assignedCount.textContent = assigned;
    var over = assigned > _c.playerCount;
    els.assignedCount.classList.toggle('over', over);

    var warnings = [];
    if (over) warnings.push('身份人数超出房间人数 ' + (assigned - _c.playerCount) + ' 人');
    if (assigned > 0 && getWolfCount() === 0) warnings.push('至少需要一只狼人');

    if (warnings.length > 0) {
        els.roleWarning.textContent = warnings.join('，');
        els.roleWarning.classList.add('visible');
    } else {
        els.roleWarning.textContent = '';
        els.roleWarning.classList.remove('visible');
    }
}

function updateCreatingModeUI(els) {
    els.modeBeginner.classList.toggle('active', _c.gameMode === 'beginner');
    els.modeExpert.classList.toggle('active', _c.gameMode === 'expert');
    els.modeDesc.textContent = MODE_DESC[_c.gameMode];
}

function bindCreatingEvents() {
    unbindCreatingEvents();

    _c.bound.playerMinus = function () { if (_c.playerCount > 4) { _c.playerCount--; renderCreating(); } };
    _c.bound.playerPlus = function () { if (_c.playerCount < 18) { _c.playerCount++; renderCreating(); } };
    _c.bound.addRole = function () {
        var els = getCreatingEls();
        els.roleSelect.value = '';
        _c.modalQty = 1;
        els.roleQty.textContent = 1;
        els.roleDesc.textContent = '请选择一个身份查看说明';
        els.modal.style.display = 'flex';
    };
    _c.bound.roleSelectChange = function () {
        var els = getCreatingEls();
        var role = ROLES.find(function (r) { return r.id === els.roleSelect.value; });
        if (role) {
            var campName = role.camp === 'wolf' ? '狼人阵营' : '好人阵营';
            els.roleDesc.innerHTML = '<span class="camp-label">' + campName + '</span><br>' + role.desc;
        } else {
            els.roleDesc.textContent = '请选择一个身份查看说明';
        }
    };
    _c.bound.roleQtyMinus = function () { if (_c.modalQty > 1) { _c.modalQty--; getCreatingEls().roleQty.textContent = _c.modalQty; } };
    _c.bound.roleQtyPlus = function () { if (_c.modalQty < 8) { _c.modalQty++; getCreatingEls().roleQty.textContent = _c.modalQty; } };
    _c.bound.modalConfirm = function () {
        var els = getCreatingEls();
        var roleId = els.roleSelect.value;
        if (!roleId) { toastr.warning('请选择一个身份'); return; }
        var existing = _c.selectedRoles.find(function (r) { return r.id === roleId; });
        if (existing) { existing.qty += _c.modalQty; }
        else { _c.selectedRoles.push({ id: roleId, qty: _c.modalQty }); }
        els.modal.style.display = 'none';
        renderCreating();
        toastr.success('身份已添加');
    };
    _c.bound.modalCancel = function () { getCreatingEls().modal.style.display = 'none'; };
    _c.bound.modalOverlayClick = function (e) { if (e.target.id === 'creating-modal') e.target.style.display = 'none'; };
    _c.bound.roleListClick = function (e) {
        var btn = e.target.closest('.role-item-remove');
        if (!btn) return;
        _c.selectedRoles.splice(parseInt(btn.getAttribute('data-index'), 10), 1);
        renderCreating();
    };
    _c.bound.modeBeginner = function () { _c.gameMode = 'beginner'; renderCreating(); };
    _c.bound.modeExpert = function () { _c.gameMode = 'expert'; renderCreating(); };
    _c.bound.start = function () {
        var els = getCreatingEls();
        var name = els.roomName.value.trim();
        if (!name) { toastr.warning('请输入房间名称'); return; }
        var playerName = els.playerName.value.trim() || '玩家';
        var assigned = getAssignedCount();
        if (assigned === 0) { toastr.warning('请至少添加一个身份'); return; }
        if (getWolfCount() === 0) { toastr.warning('至少需要一只狼人'); return; }
        if (assigned > _c.playerCount) { toastr.warning('身份人数超出房间人数，请调整'); return; }
        if (assigned < _c.playerCount) { toastr.warning('还有 ' + (_c.playerCount - assigned) + ' 人未分配身份'); return; }

        loadRoles().then(function () {
            var allChars = DEFAULT_ROLES.concat(roleList);
            if (allChars.length < _c.playerCount - 1) {
                toastr.warning('角色池不足，至少需要 ' + (_c.playerCount - 1) + ' 个角色（当前 ' + allChars.length + ' 个）');
                return;
            }

            var shuffled = shuffleArray(allChars.slice());
            var picked = shuffled.slice(0, _c.playerCount - 1);

            var identityPool = [];
            _c.selectedRoles.forEach(function (r) {
                for (var i = 0; i < r.qty; i++) identityPool.push(r.id);
            });
            identityPool = shuffleArray(identityPool);

            var players = [];
            for (var i = 0; i < picked.length; i++) {
                players.push({
                    id: picked[i].id,
                    name: picked[i].name,
                    character: picked[i],
                    identityId: identityPool[i]
                });
            }
            var userSeat = Math.floor(Math.random() * (picked.length + 1));
            players.splice(userSeat, 0, { id: 'player-user', name: playerName, isUser: true, identityId: identityPool[picked.length] });

            var config = {
                id: generateRoomId(),
                name: name,
                playerCount: _c.playerCount,
                roles: _c.selectedRoles.map(function (r) { return { id: r.id, qty: r.qty }; }),
                mode: _c.gameMode,
                players: players,
                createdAt: Date.now()
            };
            saveRoom(config).then(function () {
                currentRoomId = config.id;
                window.location.hash = '#/meeting';
                toastr.success('房间创建成功');
            });
        });
    };

    document.getElementById('player-minus').addEventListener('click', _c.bound.playerMinus);
    document.getElementById('player-plus').addEventListener('click', _c.bound.playerPlus);
    document.getElementById('btn-add-role').addEventListener('click', _c.bound.addRole);
    document.getElementById('role-select').addEventListener('change', _c.bound.roleSelectChange);
    document.getElementById('role-qty-minus').addEventListener('click', _c.bound.roleQtyMinus);
    document.getElementById('role-qty-plus').addEventListener('click', _c.bound.roleQtyPlus);
    document.getElementById('modal-confirm').addEventListener('click', _c.bound.modalConfirm);
    document.getElementById('modal-cancel').addEventListener('click', _c.bound.modalCancel);
    document.getElementById('creating-modal').addEventListener('click', _c.bound.modalOverlayClick);
    document.getElementById('role-list').addEventListener('click', _c.bound.roleListClick);
    document.getElementById('mode-beginner').addEventListener('click', _c.bound.modeBeginner);
    document.getElementById('mode-expert').addEventListener('click', _c.bound.modeExpert);
    var startBtn = document.querySelector('[data-footer="start"]');
    if (startBtn) startBtn.addEventListener('click', _c.bound.start);
}

function unbindCreatingEvents() {
    if (!_c.bound.playerMinus) return;
    document.getElementById('player-minus').removeEventListener('click', _c.bound.playerMinus);
    document.getElementById('player-plus').removeEventListener('click', _c.bound.playerPlus);
    document.getElementById('btn-add-role').removeEventListener('click', _c.bound.addRole);
    document.getElementById('role-select').removeEventListener('change', _c.bound.roleSelectChange);
    document.getElementById('role-qty-minus').removeEventListener('click', _c.bound.roleQtyMinus);
    document.getElementById('role-qty-plus').removeEventListener('click', _c.bound.roleQtyPlus);
    document.getElementById('modal-confirm').removeEventListener('click', _c.bound.modalConfirm);
    document.getElementById('modal-cancel').removeEventListener('click', _c.bound.modalCancel);
    document.getElementById('creating-modal').removeEventListener('click', _c.bound.modalOverlayClick);
    document.getElementById('role-list').removeEventListener('click', _c.bound.roleListClick);
    document.getElementById('mode-beginner').removeEventListener('click', _c.bound.modeBeginner);
    document.getElementById('mode-expert').removeEventListener('click', _c.bound.modeExpert);
    var startBtn = document.querySelector('[data-footer="start"]');
    if (startBtn) startBtn.removeEventListener('click', _c.bound.start);
    _c.bound = {};
}


/* ══════════════════════════════════════
   § Rolepool - 角色管理
   ══════════════════════════════════════ */

var DEFAULT_ROLES = [
    { id: 'default-01', name: '陈守正', sex: '男', age: '62', desc: '退休老刑警，逻辑缜密，善于从细节中发现矛盾。说话沉稳有力，不轻易表态，一旦开口便直击要害。', isDefault: true },
    { id: 'default-02', name: '林小溪', sex: '女', age: '21', desc: '大学心理系学生，擅长观察微表情和肢体语言。活泼话多，喜欢用反问引导他人思考，偶尔冒出惊人直觉。', isDefault: true },
    { id: 'default-03', name: '赵铁柱', sex: '男', age: '45', desc: '建筑工地包工头，性格豪爽直率，嗓门大。说话不经大脑但重情义，容易被激怒也容易相信人。', isDefault: true },
    { id: 'default-04', name: '王芷若', sex: '女', age: '34', desc: '社区诊所医生，温和细心。擅长在混乱中保持冷静，习惯用医学思维分析问题，对每个人都关怀备至。', isDefault: true },
    { id: 'default-05', name: '孙浩然', sex: '男', age: '28', desc: '互联网公司程序员，理性冷静，习惯用排除法和概率思维。社交略显笨拙，但逻辑推演能力极强。', isDefault: true },
    { id: 'default-06', name: '周桂芬', sex: '女', age: '58', desc: '菜市场卖菜大姐，精明泼辣，人情世故门儿清。喜欢八卦，消息灵通，擅长从闲言碎语中拼凑真相。', isDefault: true },
    { id: 'default-07', name: '吴铭', sex: '男', age: '31', desc: '律师事务所律师，口才了得，善于诡辩和引导话题方向。习惯从多角度论证同一件事，让人难以判断真假。', isDefault: true },
    { id: 'default-08', name: '刘婉清', sex: '女', age: '26', desc: '自由插画师，感性细腻，共情能力强。经常凭直觉做出判断，擅长感受他人情绪变化，但逻辑推理稍弱。', isDefault: true },
    { id: 'default-09', name: '黄大勇', sex: '男', age: '39', desc: '退伍军人，现任小区保安队长。正义感强，行动力十足，做事果断。喜欢正面硬刚，不擅长委婉和欺骗。', isDefault: true },
    { id: 'default-10', name: '杨雪', sex: '女', age: '42', desc: '高中数学教师，严谨认真，凡事讲求证据和推理。喜欢用板书式的方式逐条分析，不放过任何一个疑点。', isDefault: true },
    { id: 'default-11', name: '马飞', sex: '男', age: '24', desc: '外卖骑手，头脑灵活反应快，嘴贫话多。善于察言观色和见风使舵，总能站在多数人一边，让人觉得亲切。', isDefault: true },
    { id: 'default-12', name: '许明珠', sex: '女', age: '52', desc: '居委会主任，热心肠的"朝阳群众"。组织能力强，对每家每户情况了如指掌，善于协调矛盾和动员群众。', isDefault: true },
    { id: 'default-13', name: '郑凯文', sex: '男', age: '19', desc: '电竞主播，网络梗王，思维跳跃快。喜欢用类比和段子解释观点，看似嘻嘻哈哈实则观察力敏锐。', isDefault: true },
    { id: 'default-14', name: '沈玉兰', sex: '女', age: '67', desc: '退休京剧演员，气质优雅，言辞讲究。擅长用故事和隐喻表达观点，不动声色间就能影响他人判断。', isDefault: true },
    { id: 'default-15', name: '钱多多', sex: '男', age: '36', desc: '小超市老板，精打细算，人脉广泛。擅长权衡利弊，从不做亏本买卖。在游戏中总能找到最有利于自己的位置。', isDefault: true }
];

var editingRoleId = null;
var currentAvatarBase64 = '';

var DB_NAME_RP = 'werewolf';
var DB_VERSION_RP = 2;
var STORE_NAME_RP = 'roles';

var _rp = { bound: {} };

window.viewRolepool = {
    init: function () {
        loadRoles().then(function () { renderRoleList(); });
        bindRolepoolEvents();
        var createBtn = document.querySelector('[data-footer="create"]');
        if (createBtn) createBtn.addEventListener('click', _rp.bound.openCreate);
        var syncBtn = document.querySelector('[data-footer="sync"]');
        if (syncBtn) syncBtn.addEventListener('click', function () { /* TODO */ });
    },
    destroy: function () {
        unbindRolepoolEvents();
        var modal = document.getElementById('rolepool-modal');
        if (modal) modal.style.display = 'none';
    }
};

function openDB_rp() {
    return new Promise(function (resolve, reject) {
        var request = indexedDB.open(DB_NAME_RP, DB_VERSION_RP);
        request.onupgradeneeded = function (e) {
            var db = e.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME_RP)) {
                db.createObjectStore(STORE_NAME_RP, { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains('rooms')) {
                db.createObjectStore('rooms', { keyPath: 'id' });
            }
        };
        request.onsuccess = function (e) { resolve(e.target.result); };
        request.onerror = function (e) { reject(e.target.error); };
    });
}

function loadRoles() {
    return openDB_rp().then(function (db) {
        return new Promise(function (resolve, reject) {
            var tx = db.transaction(STORE_NAME_RP, 'readonly');
            var store = tx.objectStore(STORE_NAME_RP);
            var request = store.getAll();
            request.onsuccess = function () { roleList = request.result || []; resolve(roleList); };
            request.onerror = function () { roleList = []; reject(request.error); };
        });
    }).catch(function (err) { console.error('Failed to load roles:', err); roleList = []; });
}

function saveRole(roleData) {
    return openDB_rp().then(function (db) {
        return new Promise(function (resolve, reject) {
            var tx = db.transaction(STORE_NAME_RP, 'readwrite');
            var store = tx.objectStore(STORE_NAME_RP);
            var request = store.put(roleData);
            request.onsuccess = function () { resolve(); };
            request.onerror = function () { reject(request.error); };
        });
    });
}

function deleteRole_rp(id) {
    return openDB_rp().then(function (db) {
        return new Promise(function (resolve, reject) {
            var tx = db.transaction(STORE_NAME_RP, 'readwrite');
            var store = tx.objectStore(STORE_NAME_RP);
            var request = store.delete(id);
            request.onsuccess = function () { resolve(); };
            request.onerror = function () { reject(request.error); };
        });
    });
}

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0;
        var v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function resetRoleModal() {
    editingRoleId = null;
    currentAvatarBase64 = '';
    document.getElementById('modal-avatar-preview').src = '';
    document.querySelector('.modal-avatar-placeholder').style.display = 'block';
    document.getElementById('modal-avatar-input').value = '';
    document.getElementById('modal-name').value = '';
    document.getElementById('modal-sex').value = '';
    document.getElementById('modal-age').value = '';
    document.getElementById('modal-desc').value = '';
    document.getElementById('modal-endpoint').value = settings.endpointAddress || '';
    document.getElementById('modal-key').value = settings.endpointKey || '';
    document.getElementById('modal-model').value = settings.defaultModel || '';
    document.getElementById('modal-delete').disabled = true;
}

function renderRoleList() {
    var container = document.getElementById('role-list-container');
    var roleEmpty = document.getElementById('role-empty');
    var template = document.getElementById('role-item-template');

    container.querySelectorAll('.role-card-instance').forEach(function (el) { el.remove(); });

    var hasContent = DEFAULT_ROLES.length > 0 || roleList.length > 0;
    roleEmpty.style.display = hasContent ? 'none' : '';

    function createRoleCard(role, isDefault) {
        var el = document.createElement('div');
        el.className = 'role-card role-card-instance';
        if (isDefault) el.classList.add('role-card-default');
        el.innerHTML = template.innerHTML;
        el.querySelector('.role-card-avatar-img').src = role.avatar || 'https://c-ssl.dtstatic.com/uploads/blog/202303/20/20230320145706_07ca5.thumb.400_0.jpeg';
        el.querySelector('.role-card-name').textContent = role.name || '';
        el.querySelector('.role-card-sex').textContent = role.sex || '';
        el.querySelector('.role-card-age').textContent = role.age ? role.age + '岁' : '';
        el.querySelector('.role-card-desc').textContent = role.desc || '';
        if (isDefault) {
            el.querySelector('.role-card-tags').insertAdjacentHTML('beforeend', '<span class="role-card-tag role-card-default-tag">预设</span>');
        }
        container.appendChild(el);

        el.addEventListener('click', function () {
            if (isDefault) return;
            editingRoleId = role.id;
            currentAvatarBase64 = role.avatar || '';
            document.getElementById('modal-avatar-preview').src = role.avatar || '';
            document.querySelector('.modal-avatar-placeholder').style.display = role.avatar ? 'none' : 'block';
            document.getElementById('modal-name').value = role.name || '';
            document.getElementById('modal-sex').value = role.sex || '';
            document.getElementById('modal-age').value = role.age || '';
            document.getElementById('modal-desc').value = role.desc || '';
            document.getElementById('modal-endpoint').value = role.endpoint || '';
            document.getElementById('modal-key').value = role.key || '';
            document.getElementById('modal-model').value = role.model || '';
            document.getElementById('modal-delete').disabled = false;
            document.getElementById('rolepool-modal').style.display = 'flex';
        });
    }

    DEFAULT_ROLES.forEach(function (role) { createRoleCard(role, true); });
    roleList.forEach(function (role) { createRoleCard(role, false); });
}

function bindRolepoolEvents() {
    unbindRolepoolEvents();

    _rp.bound.openCreate = function () {
        resetRoleModal();
        document.getElementById('rolepool-modal').style.display = 'flex';
    };

    _rp.bound.avatarUpload = function () { document.getElementById('modal-avatar-input').click(); };
    _rp.bound.avatarChange = function () {
        var file = this.files && this.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function (e) {
            currentAvatarBase64 = e.target.result;
            document.getElementById('modal-avatar-preview').src = currentAvatarBase64;
            document.querySelector('.modal-avatar-placeholder').style.display = 'none';
        };
        reader.readAsDataURL(file);
    };

    _rp.bound.saveRoleAction = function () {
        var name = document.getElementById('modal-name').value.trim();
        if (!name) { toastr.warning('请输入角色姓名'); return; }
        var roleData = {
            id: editingRoleId || generateUUID(),
            avatar: currentAvatarBase64,
            name: name,
            sex: document.getElementById('modal-sex').value.trim(),
            age: document.getElementById('modal-age').value.trim(),
            desc: document.getElementById('modal-desc').value.trim(),
            endpoint: document.getElementById('modal-endpoint').value.trim() || settings.endpointAddress || '',
            key: document.getElementById('modal-key').value.trim() || settings.endpointKey || '',
            model: document.getElementById('modal-model').value.trim() || settings.defaultModel || ''
        };
        saveRole(roleData).then(function () {
            return loadRoles();
        }).then(function () {
            renderRoleList();
            document.getElementById('rolepool-modal').style.display = 'none';
            toastr.success('角色已保存');
        }).catch(function (err) {
            console.error('Failed to save role:', err);
            toastr.error('保存失败');
        });
    };

    _rp.bound.deleteRoleAction = function () {
        if (!editingRoleId) return;
        deleteRole_rp(editingRoleId).then(function () {
            return loadRoles();
        }).then(function () {
            renderRoleList();
            document.getElementById('rolepool-modal').style.display = 'none';
            toastr.success('角色已删除');
        }).catch(function (err) {
            console.error('Failed to delete role:', err);
            toastr.error('删除失败');
        });
    };

    _rp.bound.testModelAction = function () {
        var endpoint = document.getElementById('modal-endpoint').value.trim() || settings.endpointAddress || '';
        var key = document.getElementById('modal-key').value.trim() || settings.endpointKey || '';
        var model = document.getElementById('modal-model').value.trim() || settings.defaultModel || '';
        if (!endpoint || !key || !model) { toastr.warning('请先填写端点地址、密钥和模型名称'); return; }
        var btn = document.getElementById('modal-test-model');
        btn.disabled = true;
        btn.textContent = '测试中...';
        fetch(endpoint + '/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key },
            body: JSON.stringify({ model: model, messages: [{ role: 'user', content: '你好' }] })
        }).then(function (response) {
            if (response.ok) return response.json().then(function (data) {
                if (data.choices && data.choices.length > 0) toastr.success('模型连接成功');
                else toastr.warning('收到响应但格式异常');
            });
            toastr.error('请求失败 (' + response.status + ')');
        }).catch(function () {
            toastr.error('连接失败，请检查端点地址');
        }).finally(function () {
            btn.disabled = false;
            btn.textContent = '测试模型';
        });
    };

    _rp.bound.overlayClick = function (e) {
        if (e.target.id === 'rolepool-modal') e.target.style.display = 'none';
    };

    document.getElementById('modal-avatar-upload').addEventListener('click', _rp.bound.avatarUpload);
    document.getElementById('modal-avatar-input').addEventListener('change', _rp.bound.avatarChange);
    document.getElementById('modal-save').addEventListener('click', _rp.bound.saveRoleAction);
    document.getElementById('modal-delete').addEventListener('click', _rp.bound.deleteRoleAction);
    document.getElementById('modal-test-model').addEventListener('click', _rp.bound.testModelAction);
    document.getElementById('rolepool-modal').addEventListener('click', _rp.bound.overlayClick);
}

function unbindRolepoolEvents() {
    if (!_rp.bound.avatarUpload) return;
    document.getElementById('modal-avatar-upload').removeEventListener('click', _rp.bound.avatarUpload);
    document.getElementById('modal-avatar-input').removeEventListener('change', _rp.bound.avatarChange);
    document.getElementById('modal-save').removeEventListener('click', _rp.bound.saveRoleAction);
    document.getElementById('modal-delete').removeEventListener('click', _rp.bound.deleteRoleAction);
    document.getElementById('modal-test-model').removeEventListener('click', _rp.bound.testModelAction);
    document.getElementById('rolepool-modal').removeEventListener('click', _rp.bound.overlayClick);
}


/* ══════════════════════════════════════
   § Settings - 游戏设置
   ══════════════════════════════════════ */

var _st = { bound: {} };

window.viewSettings = {
    init: function () {
        configureSettings();
        bindSettingsEvents();
    },
    destroy: function () {
        unbindSettingsEvents();
    }
};

function configureSettings() {
    document.getElementById('endpoint-address').value = settings.endpointAddress;
    document.getElementById('endpoint-key').value = settings.endpointKey;
    document.getElementById('default-model').value = settings.defaultModel;
    document.getElementById('bg-audio-slider').value = settings.backgroundAudio * 100;
    document.getElementById('bg-audio-value').textContent = Math.round(settings.backgroundAudio * 100);
    document.getElementById('sfx-audio-slider').value = settings.soundEffectAudio * 100;
    document.getElementById('sfx-audio-value').textContent = Math.round(settings.soundEffectAudio * 100);
    document.getElementById('noti-audio-slider').value = settings.notificationAudio * 100;
    document.getElementById('noti-audio-value').textContent = Math.round(settings.notificationAudio * 100);

    var isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    document.getElementById('ios-volume-hint').style.display = isIOS ? '' : 'none';
}

function bindSettingsEvents() {
    unbindSettingsEvents();

    _st.bound.endpointChange = function () { settings.endpointAddress = this.value.trim(); saveSettings(); };
    _st.bound.keyChange = function () { settings.endpointKey = this.value.trim(); saveSettings(); };
    _st.bound.modelChange = function () { settings.defaultModel = this.value.trim(); saveSettings(); };
    _st.bound.bgAudio = function () {
        document.getElementById('bg-audio-value').textContent = this.value;
        setBackgroundAudioVolume(this.value / 100);
    };
    _st.bound.sfxAudio = function () {
        settings.soundEffectAudio = this.value / 100;
        document.getElementById('sfx-audio-value').textContent = this.value;
        saveSettings();
    };
    _st.bound.notiAudio = function () {
        settings.notificationAudio = this.value / 100;
        document.getElementById('noti-audio-value').textContent = this.value;
        saveSettings();
    };
    _st.bound.testModel = function () {
        try {
            var apiUrl = settings.endpointAddress + '/v1/chat/completions';
            fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + settings.endpointKey },
                body: JSON.stringify({
                    model: settings.defaultModel,
                    messages: [
                        { role: 'system', content: '现在需要对模型进行测试，无论用户输入什么内容，你都只需要回复"收到，已接受到测试请求"' },
                        { role: 'user', content: '你好啊' }
                    ]
                })
            }).then(function (response) {
                if (!response.ok) { toastr.error('请求失败，状态码：' + response.status); return; }
                return response.json();
            }).then(function (data) {
                if (!data) return;
                if (data.choices && data.choices.length > 0) {
                    var reply = data.choices[0].message.content;
                    if (reply.includes('收到，已接受到测试请求')) toastr.success('模型测试成功！');
                    else toastr.error('模型测试失败，回复内容不正确');
                } else {
                    toastr.error('模型响应格式异常');
                }
            }).catch(function (error) {
                toastr.error('请求出错：' + error.message);
            });
        } catch (error) {
            toastr.error('请求出错：' + error.message);
        }
    };

    document.getElementById('endpoint-address').addEventListener('change', _st.bound.endpointChange);
    document.getElementById('endpoint-key').addEventListener('change', _st.bound.keyChange);
    document.getElementById('default-model').addEventListener('change', _st.bound.modelChange);
    document.getElementById('bg-audio-slider').addEventListener('input', _st.bound.bgAudio);
    document.getElementById('sfx-audio-slider').addEventListener('input', _st.bound.sfxAudio);
    document.getElementById('noti-audio-slider').addEventListener('input', _st.bound.notiAudio);
    document.getElementById('test-model').addEventListener('click', _st.bound.testModel);
}

function unbindSettingsEvents() {
    if (!_st.bound.endpointChange) return;
    document.getElementById('endpoint-address').removeEventListener('change', _st.bound.endpointChange);
    document.getElementById('endpoint-key').removeEventListener('change', _st.bound.keyChange);
    document.getElementById('default-model').removeEventListener('change', _st.bound.modelChange);
    document.getElementById('bg-audio-slider').removeEventListener('input', _st.bound.bgAudio);
    document.getElementById('sfx-audio-slider').removeEventListener('input', _st.bound.sfxAudio);
    document.getElementById('noti-audio-slider').removeEventListener('input', _st.bound.notiAudio);
    document.getElementById('test-model').removeEventListener('click', _st.bound.testModel);
    _st.bound = {};
}


/* ══════════════════════════════════════
   § Room DB - 房间数据库
   ══════════════════════════════════════ */

var DB_NAME_RM = 'werewolf';
var DB_VERSION_RM = 2;
var STORE_NAME_RM = 'rooms';
var currentRoomId = null;

function openDB_rm() {
    return new Promise(function (resolve, reject) {
        var request = indexedDB.open(DB_NAME_RM, DB_VERSION_RM);
        request.onupgradeneeded = function (e) {
            var db = e.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME_RM)) {
                db.createObjectStore(STORE_NAME_RM, { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains(STORE_NAME_RP)) {
                db.createObjectStore(STORE_NAME_RP, { keyPath: 'id' });
            }
        };
        request.onsuccess = function (e) { resolve(e.target.result); };
        request.onerror = function (e) { reject(e.target.error); };
    });
}

function saveRoom(room) {
    return openDB_rm().then(function (db) {
        return new Promise(function (resolve, reject) {
            var tx = db.transaction(STORE_NAME_RM, 'readwrite');
            var store = tx.objectStore(STORE_NAME_RM);
            var request = store.put(room);
            request.onsuccess = function () { resolve(); };
            request.onerror = function () { reject(request.error); };
        });
    });
}

function getAllRooms() {
    return openDB_rm().then(function (db) {
        return new Promise(function (resolve, reject) {
            var tx = db.transaction(STORE_NAME_RM, 'readonly');
            var store = tx.objectStore(STORE_NAME_RM);
            var request = store.getAll();
            request.onsuccess = function () { resolve(request.result || []); };
            request.onerror = function () { reject(request.error); };
        });
    });
}

function getRoom(id) {
    return openDB_rm().then(function (db) {
        return new Promise(function (resolve, reject) {
            var tx = db.transaction(STORE_NAME_RM, 'readonly');
            var store = tx.objectStore(STORE_NAME_RM);
            var request = store.get(id);
            request.onsuccess = function () { resolve(request.result); };
            request.onerror = function () { reject(request.error); };
        });
    });
}

function deleteRoom(id) {
    return openDB_rm().then(function (db) {
        return new Promise(function (resolve, reject) {
            var tx = db.transaction(STORE_NAME_RM, 'readwrite');
            var store = tx.objectStore(STORE_NAME_RM);
            var request = store.delete(id);
            request.onsuccess = function () { resolve(); };
            request.onerror = function () { reject(request.error); };
        });
    });
}

function generateRoomId() {
    return 'room-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6);
}

function formatTime(ts) {
    var d = new Date(ts);
    var pad = function (n) { return n < 10 ? '0' + n : n; };
    return d.getFullYear() + '/' + pad(d.getMonth() + 1) + '/' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
}


/* ══════════════════════════════════════
   § Game Engine - 游戏引擎
   ══════════════════════════════════════ */

var WOLF_IDS = ['werewolf', 'wolfking', 'whitewolfking'];
var GOD_IDS = ['seer', 'witch', 'hunter', 'guard', 'idiot', 'cupid'];
var VILLAGER_ID = 'villager';

var pendingHumanAction = null;

function isWolf(identityId) { return WOLF_IDS.indexOf(identityId) >= 0; }
function isGod(identityId) { return GOD_IDS.indexOf(identityId) >= 0; }
function isVillager(identityId) { return identityId === VILLAGER_ID; }

function getPlayerById(room, id) {
    if (!room.players) return null;
    return room.players.find(function (p) { return p.id === id; });
}

function getAlivePlayers(room) {
    var gs = room.gameState;
    if (!gs) return [];
    return room.players.filter(function (p) { return gs.players[p.id] && gs.players[p.id].alive; });
}

function getAliveWolves(room) {
    return getAlivePlayers(room).filter(function (p) { return isWolf(p.identityId); });
}

function getAliveGods(room) {
    return getAlivePlayers(room).filter(function (p) { return isGod(p.identityId); });
}

function getAliveVillagers(room) {
    return getAlivePlayers(room).filter(function (p) { return isVillager(p.identityId); });
}

function findPlayerByIdentity(room, identityId) {
    return getAlivePlayers(room).find(function (p) { return p.identityId === identityId; });
}

function findPlayersByCamp(room, campCheck) {
    return getAlivePlayers(room).filter(function (p) { return campCheck(p.identityId); });
}

function initGameState(room) {
    var gs = { phase: 'idle', day: 0, subPhase: null, players: {} };
    room.players.forEach(function (p) {
        gs.players[p.id] = {
            alive: true, canVote: true,
            isIdiotRevealed: false,
            witchHealUsed: false, witchPoisonUsed: false,
            seerChecks: [],
            privateThoughts: [],
            lastWordsSpoken: false
        };
    });
    gs.night = { guardTarget: null, lastGuardTarget: null, wolfTarget: null, witchHeal: false, witchPoison: null, seerTarget: null, seerResult: null, cupidTargets: [] };
    gs.lovers = [];
    gs.dayVotes = {};
    gs.winner = null;
    room.gameState = gs;
}

function saveGameState(room) {
    return saveRoom(room);
}

var ACTION_TIMEOUT = 30000; // 30 seconds
var _timer = { interval: null, remaining: 0 };

function waitForHumanAction() {
    return new Promise(function (resolve) { pendingHumanAction = { resolve: resolve }; });
}

function withTimeout(promise, ms) {
    var timeout = new Promise(function (resolve) {
        setTimeout(function () { resolve('__timeout__'); }, ms);
    });
    return Promise.race([promise, timeout]);
}

function startCountdown(ms, $container) {
    clearCountdown();
    _timer.remaining = Math.ceil(ms / 1000);
    var $timer = $container.find('.action-timer');
    if (!$timer.length) {
        $container.prepend('<div class="action-timer"></div>');
        $timer = $container.find('.action-timer');
    }
    $timer.text(_timer.remaining + 's');
    _timer.interval = setInterval(function () {
        _timer.remaining--;
        if (_timer.remaining <= 0) {
            clearCountdown();
            $timer.text('0s');
            return;
        }
        $timer.text(_timer.remaining + 's');
    }, 1000);
}

function clearCountdown() {
    if (_timer.interval) { clearInterval(_timer.interval); _timer.interval = null; }
    $('.action-timer').remove();
}

function queryAI(character, systemPrompt, userPrompt) {
    var endpoint = (character && character.endpoint) || settings.endpointAddress;
    var key = (character && character.key) || settings.endpointKey;
    var model = (character && character.model) || settings.defaultModel;
    if (!endpoint || !key || !model) return Promise.resolve('');
    var controller = new AbortController();
    var timeout = setTimeout(function () { controller.abort(); }, ACTION_TIMEOUT);
    return fetch(endpoint + '/v1/chat/completions', {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key },
        body: JSON.stringify({
            model: model, temperature: 0.8,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ]
        })
    }).then(function (r) { return r.json(); }).then(function (d) {
        clearTimeout(timeout);
        return (d.choices && d.choices[0] && d.choices[0].message && d.choices[0].message.content) || '';
    }).catch(function () {
        clearTimeout(timeout);
        return '';
    });
}

function getRecentPublicMessages(room) {
    if (!room.messages || !room.messages.length) return '';
    return room.messages.map(function (m) {
        return m.name + '说：' + m.text;
    }).join('\n');
}

function getPrivateThoughtsText(room, playerId) {
    var ps = room.gameState.players[playerId];
    if (!ps || !ps.privateThoughts || !ps.privateThoughts.length) return '';
    return ps.privateThoughts.map(function (t) {
        return '[第' + t.day + '天' + (t.phase === 'night' ? '夜' : '日') + '·' + t.action + '] ' + t.text;
    }).join('\n');
}

function queryAIWithContext(room, player, systemPrompt, userPrompt) {
    var gs = room.gameState;
    var character = player.character;
    var endpoint = (character && character.endpoint) || settings.endpointAddress;
    var key = (character && character.key) || settings.endpointKey;
    var model = (character && character.model) || settings.defaultModel;
    if (!endpoint || !key || !model) return Promise.resolve('');

    var messages = [];
    messages.push({ role: 'system', content: systemPrompt });

    // Inject room info
    var roomInfo = '【房间信息】\n房间人数：' + room.players.length + '人\n';
    var identityCounts = {};
    room.players.forEach(function (p) {
        var def = ROLES.find(function (r) { return r.id === p.identityId; });
        var name = def ? def.name : p.identityId;
        identityCounts[name] = (identityCounts[name] || 0) + 1;
    });
    var identityList = Object.keys(identityCounts).map(function (k) { return k + '×' + identityCounts[k]; }).join('、');
    roomInfo += '身份配置：' + identityList;
    messages.push({ role: 'user', content: roomInfo });
    messages.push({ role: 'assistant', content: '我已了解房间配置。' });

    var thoughtsText = getPrivateThoughtsText(room, player.id);
    if (thoughtsText) {
        messages.push({ role: 'user', content: '【你的私密记忆】\n' + thoughtsText });
        messages.push({ role: 'assistant', content: '我已回忆起之前的想法，会在此基础上继续思考和行动。' });
    }

    var contextParts = [];
    var publicText = getRecentPublicMessages(room, 20);
    if (room.events && room.events.length) {
        var evts = room.events.slice(-10).map(function (e) {
            return '第' + e.day + '天' + (e.phase === 'night' ? '夜' : '日') + '：' + e.text;
        }).join('\n');
        if (evts) contextParts.push('【近期事件】\n' + evts);
    }
    if (publicText) contextParts.push('【公开聊天记录】\n' + publicText);
    if (contextParts.length > 0) {
        messages.push({ role: 'user', content: contextParts.join('\n\n') });
        messages.push({ role: 'assistant', content: '我已了解以上公开信息。' });
    }

    messages.push({ role: 'user', content: userPrompt });

    var controller = new AbortController();
    var timeout = setTimeout(function () { controller.abort(); }, ACTION_TIMEOUT);
    return fetch(endpoint + '/v1/chat/completions', {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key },
        body: JSON.stringify({ model: model, temperature: 0.8, messages: messages })
    }).then(function (r) { return r.json(); }).then(function (d) {
        clearTimeout(timeout);
        return (d.choices && d.choices[0] && d.choices[0].message && d.choices[0].message.content) || '';
    }).catch(function () {
        clearTimeout(timeout);
        return '';
    });
}

async function generateAndStoreThought(room, player, actionType, actionResult, phase) {
    if (player.isUser) return;
    var gs = room.gameState;
    var ps = gs.players[player.id];
    if (!ps) return;

    var roleDef = ROLES.find(function (r) { return r.id === player.identityId; });
    var roleName = roleDef ? roleDef.name : '未知';
    var character = player.character;
    var endpoint = (character && character.endpoint) || settings.endpointAddress;
    var key = (character && character.key) || settings.endpointKey;
    var model = (character && character.model) || settings.defaultModel;
    if (!endpoint || !key || !model) return;

    try {
        var resp = await fetch(endpoint + '/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key },
            body: JSON.stringify({
                model: model, temperature: 1.0,
                messages: [
                    { role: 'system', content: '你是' + player.name + '，在狼人杀游戏中身份是' + roleName + '。' + (character ? character.desc : '') + '\n请简短写下你此刻的真实内心想法（1-2句话），包括你的真实意图、是否打算欺骗他人、策略考虑。这段内心独白只有你能看到。' },
                    { role: 'user', content: '当前是第' + gs.day + '天的' + (phase === 'night' ? '夜晚' : '白天') + '。你刚完成了"' + actionType + '"行动。' + (actionResult ? '行动结果：' + actionResult + '。' : '') + '请用中文写下你此刻的真实内心想法。' }
                ]
            })
        }).then(function (r) { return r.json(); }).then(function (d) {
            return (d.choices && d.choices[0] && d.choices[0].message && d.choices[0].message.content) || '';
        });

        if (resp) {
            if (!ps.privateThoughts) ps.privateThoughts = [];
            ps.privateThoughts.push({ text: resp, day: gs.day, phase: phase || gs.phase, action: actionType, time: Date.now() });
        }
    } catch (e) { /* silently fail */ }
}

function parsePlayerName(response, candidates) {
    if (!response) return null;
    for (var i = 0; i < candidates.length; i++) {
        if (response.indexOf(candidates[i].name) >= 0) return candidates[i].id;
    }
    return null;
}

function checkWinCondition(room) {
    var gs = room.gameState;
    if (getAliveWolves(room).length === 0) return 'good';
    if (getAlivePlayers(room).filter(function (p) { return !isWolf(p.identityId); }).length === 0) return 'wolf';
    return null;
}

function killPlayer(room, playerId, cause) {
    var gs = room.gameState;
    var ps = gs.players[playerId];
    if (!ps || !ps.alive) return;
    ps.alive = false;
    ps.deathCause = cause;
    var player = getPlayerById(room, playerId);
    var day = gs.day;
    var phaseText = gs.phase === 'night' || gs.subPhase ? '夜晚' : '白天';
    if (cause === 'wolf') {
        addRoomEvent(day, 'night', (player ? player.name : playerId) + '被狼人杀害');
    } else if (cause === 'poison') {
        addRoomEvent(day, 'night', (player ? player.name : playerId) + '被女巫毒杀');
    } else if (cause === 'vote') {
        addRoomEvent(day, 'day', (player ? player.name : playerId) + '被投票出局');
    } else if (cause === 'shoot') {
        addRoomEvent(day, 'day', (player ? player.name : playerId) + '被枪杀');
    } else if (cause === 'lover') {
        addRoomEvent(day, gs.phase === 'night' ? 'night' : 'day', (player ? player.name : playerId) + '因恋人死亡而殉情');
    } else if (cause === 'selfdestruct') {
        addRoomEvent(day, 'day', (player ? player.name : playerId) + '自爆');
    }
    if (gs.lovers && gs.lovers.length === 2) {
        var otherIdx = gs.lovers.indexOf(playerId);
        if (otherIdx >= 0) {
            var otherId = gs.lovers[1 - otherIdx];
            var otherPs = gs.players[otherId];
            if (otherPs && otherPs.alive) {
                setTimeout(function () { killPlayer(room, otherId, 'lover'); }, 0);
            }
        }
    }
}

function resolveNight(room) {
    var gs = room.gameState;
    var night = gs.night;
    var deaths = [];
    var guarded = night.guardTarget;
    var wolfed = night.wolfTarget;
    var healed = night.witchHeal;
    var poisoned = night.witchPoison;
    if (wolfed) {
        var tripleCollision = guarded === wolfed && healed;
        if (guarded === wolfed && !healed) {
            // guarded, no death from wolf
        } else if (healed && guarded !== wolfed) {
            // healed, no death
        } else if (tripleCollision) {
            deaths.push({ id: wolfed, cause: 'wolf' });
        } else {
            deaths.push({ id: wolfed, cause: 'wolf' });
        }
    }
    if (poisoned) {
        var alreadyDead = deaths.some(function (d) { return d.id === poisoned; });
        if (!alreadyDead) {
            deaths.push({ id: poisoned, cause: 'poison' });
        }
    }
    night.lastGuardTarget = guarded || null;
    deaths.forEach(function (d) { killPlayer(room, d.id, d.cause); });
    if (deaths.length === 0) {
        addRoomEvent(gs.day, 'night', '平安夜，无人死亡');
    }
    gs.night = { guardTarget: null, lastGuardTarget: night.lastGuardTarget, wolfTarget: null, witchHeal: false, witchPoison: null, seerTarget: null, seerResult: null, cupidTargets: [] };
    return deaths;
}

/* ── Night Order (extensible) ── */
var NIGHT_ORDER = [
    { id: 'cupid', firstNightOnly: true, handler: 'runNightCupid', label: '丘比特', isCamp: false },
    { id: 'guard', handler: 'runNightGuard', label: '守卫', isCamp: false },
    { id: 'werewolf', handler: 'runNightWerewolf', label: '狼人', isCamp: 'wolf' },
    { id: 'witch', handler: 'runNightWitch', label: '女巫', isCamp: false },
    { id: 'seer', handler: 'runNightSeer', label: '预言家', isCamp: false },
    { id: 'hunter', handler: 'runNightHunter', label: '猎人', isCamp: false },
    { id: 'idiot', firstNightOnly: true, handler: 'runNightIdiot', label: '白痴', isCamp: false }
];

function isUserPhase(room) {
    var gs = room.gameState;
    var sub = gs.subPhase;
    var user = room.players.find(function (p) { return p.isUser; });
    if (!user || !gs.players[user.id] || !gs.players[user.id].alive) return false;
    var entry = NIGHT_ORDER.find(function (e) { return e.id === sub; });
    if (!entry) return false;
    if (entry.isCamp === 'wolf') return isWolf(user.identityId);
    return user.identityId === entry.id;
}

function updateContinueButton(room) {
    var gs = room.gameState;
    var $btn = $('[data-footer="continue"]');
    if (!$btn.length) return;
    $btn.prop('disabled', false);

    if (gs.phase === 'idle') {
        $btn.text('黑夜降临');
    } else if (gs.phase === 'day-announce') {
        $btn.text('轮流发言');
    } else if (gs.phase === 'day-speech') {
        $btn.text('开始发言');
    } else if (gs.phase === 'day-vote') {
        $btn.text('开始投票');
    } else {
        $btn.text('继续');
    }
}

function stopAndRender(room) {
    renderPhaseIndicator(room);
    updateContinueButton(room);
    rebindContinueButton(room);
}

function rebindContinueButton(room) {
    var $btn = $('[data-footer="continue"]');
    if (!$btn.length) return;
    $btn.off('click').on('click', function () {
        if (!room || !room.gameState) return;
        $btn.prop('disabled', true).text('进行中...');
        advancePhase(room).then(function () {
            updateContinueButton(room);
        });
    });
}

async function advancePhase(room) {
    var gs = room.gameState;
    if (!gs) return;
    var phase = gs.phase;
    var sub = gs.subPhase;

    if (phase === 'idle') return handleIdlePhase(room);
    if (phase === 'night') {
        if (sub === 'start') return handleNightStartPhase(room);
        if (sub === 'done') return handleNightDonePhase(room);
        return handleNightRolePhase(room);
    }
    if (phase === 'day-announce') return handleDayAnnouncePhase(room);
    if (phase === 'day-speech') return handleDaySpeechPhase(room);
    if (phase === 'day-vote') return handleDayVotePhase(room);
    if (phase === 'game-over') return handleGameOverPhase(room);
}

async function handleIdlePhase(room) {
    var gs = room.gameState;
    gs.phase = 'night';
    gs.day = 0;
    gs.subPhase = 'start';
    await advancePhase(room);
}

async function handleNightStartPhase(room) {
    var gs = room.gameState;
    addMessage('系统', '第' + gs.day + '天夜晚降临...');
    var nextIdx = findNextNightIndex(room);
    if (nextIdx < 0) {
        gs.subPhase = 'done';
        await advancePhase(room);
        return;
    }
    gs.nightIndex = nextIdx;
    gs.subPhase = NIGHT_ORDER[nextIdx].id;
    await saveGameState(room);
    await advancePhase(room);
}

async function handleNightRolePhase(room) {
    var gs = room.gameState;
    var entry = NIGHT_ORDER.find(function (e) { return e.id === gs.subPhase; });
    if (!entry) return;
    await executeNightAction(room, entry);
    var nextIdx = findNextNightIndexFrom(room, gs.nightIndex + 1);
    if (nextIdx < 0) {
        gs.subPhase = 'done';
        await saveGameState(room);
        await advancePhase(room);
        return;
    }
    gs.nightIndex = nextIdx;
    gs.subPhase = NIGHT_ORDER[nextIdx].id;
    await saveGameState(room);
    await advancePhase(room);
}

async function handleNightDonePhase(room) {
    var gs = room.gameState;
    resolveNight(room);
    await saveGameState(room);
    gs.phase = 'day-announce';
    gs.subPhase = null;
    await advancePhase(room);
}

async function handleDayAnnouncePhase(room) {
    var gs = room.gameState;
    if (!gs._announced) {
        renderDayAnnounce(room);
        var winner = checkWinCondition(room);
        if (winner) { gs.winner = winner; gs.phase = 'game-over'; await saveGameState(room); renderPhaseIndicator(room); renderGameOver(room); return; }
        await handleDeathTriggers(room);
        winner = checkWinCondition(room);
        if (winner) { gs.winner = winner; gs.phase = 'game-over'; await saveGameState(room); renderPhaseIndicator(room); renderGameOver(room); return; }
        await handleLastWords(room);
        gs._announced = true;
        await saveGameState(room);
        stopAndRender(room);
        return;
    }
    delete gs._announced;
    gs.phase = 'day-speech';
    gs.speechIndex = 0;
    await saveGameState(room);
    await advancePhase(room);
}

async function handleDaySpeechPhase(room) {
    var gs = room.gameState;
    await runDaySpeech(room);
    gs.phase = 'day-vote';
    await saveGameState(room);
    stopAndRender(room);
}

async function handleDayVotePhase(room) {
    var gs = room.gameState;
    await runDayVote(room);
    if (gs.phase === 'game-over') return;
    await handleNextNightPhase(room);
}

async function handleNextNightPhase(room) {
    var gs = room.gameState;
    gs.phase = 'night';
    gs.day++;
    gs.subPhase = 'start';
    await saveGameState(room);
    await advancePhase(room);
}

async function handleGameOverPhase(room) {
    renderGameOver(room);
}

function findNextNightIndex(room) {
    return findNextNightIndexFrom(room, 0);
}

function findNextNightIndexFrom(room, startIdx) {
    var gs = room.gameState;
    for (var i = startIdx; i < NIGHT_ORDER.length; i++) {
        var entry = NIGHT_ORDER[i];
        if (entry.firstNightOnly && gs.day !== 0) continue;
        if (entry.isCamp === 'wolf') {
            if (getAliveWolves(room).length > 0) return i;
        } else {
            if (findPlayerByIdentity(room, entry.id)) return i;
        }
    }
    return -1;
}

async function executeNightAction(room, entry) {
    if (entry.isCamp === 'wolf') {
        var wolves = getAliveWolves(room);
        if (wolves.length > 0) await window[entry.handler](room, wolves);
    } else {
        var player = findPlayerByIdentity(room, entry.id);
        if (player) await window[entry.handler](room, player);
    }
}

async function handleDeathTriggers(room) {
    var gs = room.gameState;
    var deadPlayers = room.players.filter(function (p) {
        var ps = gs.players[p.id];
        return ps && !ps.alive && ps.deathCause && ps.deathCause !== 'poison';
    });
    for (var i = 0; i < deadPlayers.length; i++) {
        var p = deadPlayers[i];
        if (p.identityId === 'hunter' || p.identityId === 'wolfking') {
            await runShootAbility(room, p);
            delete gs.players[p.id].deathCause;
        }
    }
}

async function handleLastWords(room) {
    var gs = room.gameState;
    var dead = room.players.filter(function (p) {
        var ps = gs.players[p.id];
        return ps && !ps.alive && !ps.lastWordsSpoken;
    });
    if (dead.length === 0) return;
    addMessage('系统', '— 遗言环节 —');
    for (var i = 0; i < dead.length; i++) {
        var p = dead[i];
        if (p.isUser) {
            addMessage('系统', p.name + '（已死亡），请发表遗言。');
            showChatInput();
            var $btn = $('[data-footer="continue"]');
            $btn.text('遗言完毕').prop('disabled', false).off('click').on('click', function () {
                hideChatInput();
                $btn.prop('disabled', true).text('进行中...');
                if (pendingHumanAction) {
                    pendingHumanAction.resolve();
                    pendingHumanAction = null;
                }
            });
            await waitForHumanAction();
        } else {
            var resp = await generateAISpeech(room, p);
            addMessage(p.name, '【遗言】' + (resp || '（沉默）'));
        }
        gs.players[p.id].lastWordsSpoken = true;
        await saveGameState(room);
    }
}

/* ── Night Action Handlers ── */

async function runNightGuard(room, guard) {
    var gs = room.gameState;
    var candidates = getAlivePlayers(room).filter(function (p) { return p.id !== gs.night.lastGuardTarget; });
    if (candidates.length === 0) return;
    if (guard.isUser) {
        renderNightAction(room, 'guard', candidates, null);
        var result = await withTimeout(waitForHumanAction(), ACTION_TIMEOUT);
        clearCountdown();
        if (result !== '__timeout__') gs.night.guardTarget = result;
        else addMessage('系统', '守卫超时，未守护任何人。');
    } else {
        renderNightWaiting(room, guard);
        var aliveNames = candidates.map(function (p) { return p.name; }).join('、');
        var lastInfo = gs.night.lastGuardTarget ? '（注意：不能连续守护' + getPlayerById(room, gs.night.lastGuardTarget).name + '）' : '';
        var resp = await withTimeout(queryAIWithContext(room, guard,
            '你是守卫。你的任务是每晚守护一名玩家使其免受狼人袭击。' + (guard.character ? guard.character.desc : ''),
            '当前是第' + gs.day + '天夜晚。存活玩家：' + aliveNames + lastInfo + '。请选择你要守护的玩家名字，只回复名字。'), ACTION_TIMEOUT);
        if (resp === '__timeout__' || !resp) {
            gs.night.guardTarget = candidates[Math.floor(Math.random() * candidates.length)].id;
        } else {
            var parsed = parsePlayerName(resp, candidates);
            gs.night.guardTarget = parsed || candidates[Math.floor(Math.random() * candidates.length)].id;
        }
        var guardTargetName = gs.night.guardTarget ? getPlayerById(room, gs.night.guardTarget).name : '无人';
        await generateAndStoreThought(room, guard, '守护', '守护了' + guardTargetName, 'night');
    }
    hideNightAction();
}

async function runNightCupid(room, cupid) {
    var gs = room.gameState;
    var candidates = getAlivePlayers(room);
    if (candidates.length < 2) return;
    if (cupid.isUser) {
        renderNightAction(room, 'cupid', candidates, null);
        var result = await withTimeout(waitForHumanAction(), ACTION_TIMEOUT);
        clearCountdown();
        if (result !== '__timeout__' && Array.isArray(result)) {
            gs.night.cupidTargets = result;
            gs.lovers = result.slice();
        } else {
            var ids = [];
            while (ids.length < 2) {
                var r = candidates[Math.floor(Math.random() * candidates.length)].id;
                if (ids.indexOf(r) < 0) ids.push(r);
            }
            gs.night.cupidTargets = ids;
            gs.lovers = ids.slice();
            addMessage('系统', '丘比特超时，系统随机分配恋人。');
        }
    } else {
        renderNightWaiting(room, cupid);
        var names = candidates.map(function (p) { return p.name; }).join('、');
        var resp = await withTimeout(queryAIWithContext(room, cupid,
            '你是丘比特。你在游戏开始时选择两名玩家成为恋人。恋人一方死亡时另一方也会殉情。' + (cupid.character ? cupid.character.desc : ''),
            '请选择两名玩家作为恋人，只回复两个名字用逗号分隔。存活玩家：' + names), ACTION_TIMEOUT);
        var ids = [];
        if (resp && resp !== '__timeout__') {
            candidates.forEach(function (p) { if (resp.indexOf(p.name) >= 0 && ids.length < 2) ids.push(p.id); });
        }
        while (ids.length < 2) {
            var r = candidates[Math.floor(Math.random() * candidates.length)].id;
            if (ids.indexOf(r) < 0) ids.push(r);
        }
        gs.night.cupidTargets = ids;
        gs.lovers = ids.slice();
        var loverNames = ids.map(function (id) { return getPlayerById(room, id).name; }).join('和');
        await generateAndStoreThought(room, cupid, '连结恋人', '连结了' + loverNames, 'night');
    }
    hideNightAction();
}

async function runNightWerewolf(room, wolves) {
    var gs = room.gameState;
    gs.wolfMessages = [];
    var targets = getAlivePlayers(room).filter(function (p) { return !isWolf(p.identityId); });
    if (targets.length === 0) return;
    var userWolf = wolves.find(function (w) { return w.isUser; });
    var targetNames = targets.map(function (p) { return p.name; }).join('、');

    // AI wolves discuss first (each generates a short tactic message)
    var aiWolves = wolves.filter(function (w) { return !w.isUser; });
    for (var i = 0; i < aiWolves.length; i++) {
        var others = wolves.filter(function (w) { return w.id !== aiWolves[i].id; }).map(function (w) { return w.name; }).join('、');
        var prevMsgs = gs.wolfMessages.map(function (m) { return m.name + '：' + m.text; }).join('\n');
        var discussion = await withTimeout(queryAIWithContext(room, aiWolves[i],
            '你是狼人，与' + others + '是队友。现在是夜间狼人密议环节，你们要讨论今晚的目标。' + (aiWolves[i].character ? '\n性格：' + aiWolves[i].character.desc : ''),
            '第' + gs.day + '天夜晚。可刀目标：' + targetNames + '。' + (prevMsgs ? '\n之前的讨论：\n' + prevMsgs + '\n' : '') + '请简短发表你的看法，30字以内。只回复讨论内容。'), ACTION_TIMEOUT);
        var msg = (discussion && discussion !== '__timeout__') ? discussion : '……';
        gs.wolfMessages.push({ name: aiWolves[i].name, text: msg });
    }

    var votes = {};
    if (userWolf) {
        // Show wolf discussion panel + chat input for user
        _mt.mentionFilter = 'wolf';
        refreshMentionList(room);
        renderWolfDiscussion(room, wolves, targets);
        showChatInput();
        // Wait for user to finish discussion
        await waitForHumanAction();
        hideChatInput();
        _mt.mentionFilter = null;
        refreshMentionList(room);
        // Now show wolf vote UI
        var wolfNames = wolves.filter(function (w) { return !w.isUser; }).map(function (w) { return w.name; }).join('、');
        renderWolfVote(room, targets, wolfNames);
        var result = await withTimeout(waitForHumanAction(), ACTION_TIMEOUT);
        clearCountdown();
        if (result !== '__timeout__' && result) votes[result] = 1;
        // AI wolves also vote (1s interval)
        var discussionText = gs.wolfMessages.map(function (m) { return m.name + '：' + m.text; }).join('\n');
        for (var i = 0; i < aiWolves.length; i++) {
            await new Promise(function (r) { setTimeout(r, 1000); });
            var others = wolves.filter(function (w) { return w.id !== aiWolves[i].id; }).map(function (w) { return w.name; }).join('、');
            var resp = await withTimeout(queryAIWithContext(room, aiWolves[i],
                '你是狼人，与' + others + '是队友。你们每晚选择一名非狼玩家杀害，也可以选择空刀。' + (aiWolves[i].character ? aiWolves[i].character.desc : ''),
                '第' + gs.day + '天夜晚。可刀目标：' + targetNames + '。\n狼人密议记录：\n' + discussionText + '\n请回复目标名字或"空刀"。'), ACTION_TIMEOUT);
            if (resp && resp !== '__timeout__') {
                var parsed = parsePlayerName(resp, targets);
                if (parsed) votes[parsed] = (votes[parsed] || 0) + 1;
            }
        }
    } else {
        // AI wolves vote with discussion context
        renderNightWaiting(room, wolves[0]);
        for (var i = 0; i < wolves.length; i++) {
            var others = wolves.filter(function (w) { return w.id !== wolves[i].id; }).map(function (w) { return w.name; }).join('、');
            var discussionText = gs.wolfMessages.map(function (m) { return m.name + '：' + m.text; }).join('\n');
            var resp = await withTimeout(queryAIWithContext(room, wolves[i],
                '你是狼人，与' + others + '是队友。你们每晚选择一名非狼玩家杀害，也可以选择空刀。' + (wolves[i].character ? wolves[i].character.desc : ''),
                '第' + gs.day + '天夜晚。可刀目标：' + targetNames + '。\n狼人密议记录：\n' + discussionText + '\n请回复目标名字或"空刀"。'), ACTION_TIMEOUT);
            if (resp && resp !== '__timeout__') {
                var parsed = parsePlayerName(resp, targets);
                if (parsed) votes[parsed] = (votes[parsed] || 0) + 1;
            }
        }
    }

    var maxVotes = 0; var maxId = null; var tied = false;
    Object.keys(votes).forEach(function (id) {
        if (votes[id] > maxVotes) { maxVotes = votes[id]; maxId = id; tied = false; }
        else if (votes[id] === maxVotes) { tied = true; }
    });
    gs.night.wolfTarget = tied ? null : maxId;

    var wolfTargetName = gs.night.wolfTarget ? getPlayerById(room, gs.night.wolfTarget).name : '空刀';
    for (var j = 0; j < wolves.length; j++) {
        await generateAndStoreThought(room, wolves[j], '狼人投票', '选择杀害' + wolfTargetName, 'night');
    }
    hideNightAction();
}

function renderWolfDiscussion(room, wolves, targets) {
    var gs = room.gameState;
    var $panel = $('#night-action-panel');
    var teammateNames = wolves.filter(function (w) { return !w.isUser; }).map(function (w) { return w.name; }).join('、');
    var html = '<div class="wolf-discussion-panel">';
    html += '<div class="wolf-discussion-header">狼人密议<span class="wolf-discussion-sub">你的狼队友：' + teammateNames + '</span></div>';
    html += '<div class="wolf-discussion-messages" id="wolf-discussion-messages">';
    gs.wolfMessages.forEach(function (m) {
        html += '<div class="wolf-discussion-msg"><b>' + m.name + '</b>：' + m.text + '</div>';
    });
    html += '</div>';
    html += '<button class="wolf-discussion-done" id="wolf-discussion-done">开始投票</button>';
    html += '</div>';
    showNightPanel(html);
    scrollWolfDiscussion();

    $('#wolf-discussion-done').off('click').on('click', function () {
        if (pendingHumanAction) {
            pendingHumanAction.resolve('done');
            pendingHumanAction = null;
        }
    });
}

function renderWolfVote(room, targets, wolfNames) {
    var $panel = $('#night-action-panel');
    var html = '<div class="wolf-vote-panel">';
    html += '<div class="wolf-vote-header">选择今晚的目标</div>';
    if (wolfNames) html += '<div class="wolf-vote-sub">狼队友：' + wolfNames + '</div>';
    html += '<div class="wolf-vote-grid">';
    targets.forEach(function (p) {
        html += '<button class="wolf-vote-target" data-target="' + p.id + '">' + p.name + '</button>';
    });
    html += '</div>';
    html += '<button class="wolf-vote-skip" data-target="empty">空刀（跳过）</button>';
    html += '</div>';
    showNightPanel(html);
    startCountdown(ACTION_TIMEOUT, $panel);

    $panel.off('click').on('click', '.wolf-vote-target, .wolf-vote-skip', function () {
        if (!pendingHumanAction) return;
        var target = $(this).data('target');
        clearCountdown();
        pendingHumanAction.resolve(target === 'empty' ? null : target);
        pendingHumanAction = null;
    });
}

function appendWolfMessage(name, text) {
    var gs = _mt.room.gameState;
    gs.wolfMessages.push({ name: name, text: text });
    var $msgs = $('#wolf-discussion-messages');
    if ($msgs.length) {
        $msgs.append('<div class="wolf-discussion-msg"><b>' + name + '</b>：' + text + '</div>');
        scrollWolfDiscussion();
    }
}

function scrollWolfDiscussion() {
    var el = document.getElementById('wolf-discussion-messages');
    if (el) el.scrollTop = el.scrollHeight;
}

function refreshMentionList(room) {
    var $footer = $('#footer-banner');
    var $old = $footer.find('.mention-list');
    if ($old.length) $old.remove();

    var gs = room.gameState;
    var others = room.players.filter(function (p) { return !p.isUser; });
    if (_mt.mentionFilter === 'wolf') {
        others = others.filter(function (p) { return isWolf(p.identityId) && gs.players[p.id] && gs.players[p.id].alive; });
    }

    var listHtml = '';
    others.forEach(function (p) {
        listHtml += '<span class="mention-tag" data-name="' + p.name + '">' + p.name + '</span>';
    });
    $footer.prepend($('<div class="mention-list">' + listHtml + '</div>'));
}

async function runNightWitch(room, witch) {
    var gs = room.gameState;
    var ps = gs.players[witch.id];
    var wolfTarget = gs.night.wolfTarget;
    var wolfVictim = wolfTarget ? getPlayerById(room, wolfTarget) : null;
    if (witch.isUser) {
        renderNightAction(room, 'witch', getAlivePlayers(room), wolfVictim ? wolfVictim.name : null);
        var result = await withTimeout(waitForHumanAction(), ACTION_TIMEOUT);
        clearCountdown();
        if (result !== '__timeout__' && result) {
            if (result.heal) { gs.night.witchHeal = true; ps.witchHealUsed = true; }
            if (result.poison) { gs.night.witchPoison = result.poison; ps.witchPoisonUsed = true; }
        } else {
            addMessage('系统', '女巫超时，未使用任何药水。');
        }
    } else {
        renderNightWaiting(room, witch);
        var healInfo = ps.witchHealUsed ? '你已经使用了解药。' : '你还有解药。';
        var poisonInfo = ps.witchPoisonUsed ? '你已经使用了毒药。' : '你还有毒药。';
        var killInfo = wolfVictim ? '今晚' + wolfVictim.name + '被狼人杀害了。' : '今晚没有人被狼人杀害。';
        var cantSelfHeal = (gs.day === 0 && wolfTarget === witch.id) ? '注意：第0天你不能自救。' : '';
        var aliveNames = getAlivePlayers(room).filter(function (p) { return p.id !== witch.id; }).map(function (p) { return p.name; }).join('、');
        var resp = await withTimeout(queryAIWithContext(room, witch,
            '你是女巫。你有一瓶解药（可以救被狼杀的人）和一瓶毒药（可以毒杀一人），各限用一次。不能在同一晚同时使用两瓶药。' + (witch.character ? witch.character.desc : ''),
            '第' + gs.day + '天夜晚。' + killInfo + healInfo + poisonInfo + cantSelfHeal + '存活其他玩家：' + aliveNames + '。请决定：回复"救{名字}"使用解药，"毒{名字}"使用毒药，或"跳过"不使用。'), ACTION_TIMEOUT);
        if (resp && resp !== '__timeout__') {
            if (resp.indexOf('救') >= 0 && !ps.witchHealUsed) {
                if (wolfTarget && !(gs.day === 0 && wolfTarget === witch.id)) {
                    gs.night.witchHeal = true; ps.witchHealUsed = true;
                }
            }
            if (resp.indexOf('毒') >= 0 && !ps.witchPoisonUsed) {
                var candidates = getAlivePlayers(room).filter(function (p) { return p.id !== witch.id; });
                var parsed = parsePlayerName(resp, candidates);
                if (parsed) { gs.night.witchPoison = parsed; ps.witchPoisonUsed = true; }
            }
        }
        var witchAction = [];
        if (gs.night.witchHeal) witchAction.push('使用了解药');
        if (gs.night.witchPoison) witchAction.push('毒杀了' + getPlayerById(room, gs.night.witchPoison).name);
        if (witchAction.length === 0) witchAction.push('跳过');
        await generateAndStoreThought(room, witch, '女巫行动', witchAction.join('，'), 'night');
    }
    hideNightAction();
}

async function runNightSeer(room, seer) {
    var gs = room.gameState;
    var candidates = getAlivePlayers(room).filter(function (p) { return p.id !== seer.id; });
    if (candidates.length === 0) return;
    if (seer.isUser) {
        renderNightAction(room, 'seer', candidates, null);
        var targetId = await withTimeout(waitForHumanAction(), ACTION_TIMEOUT);
        clearCountdown();
        if (targetId !== '__timeout__' && targetId) {
            var target = getPlayerById(room, targetId);
            var result = isWolf(target.identityId) ? 'wolf' : 'good';
            gs.night.seerTarget = targetId;
            gs.night.seerResult = result;
            gs.players[seer.id].seerChecks.push({ targetId: targetId, result: result });
            showSeerResult(target.name, result);
        } else {
            addMessage('系统', '预言家超时，未查验任何人。');
        }
    } else {
        renderNightWaiting(room, seer);
        var aliveNames = candidates.map(function (p) { return p.name; }).join('、');
        var checkedNames = gs.players[seer.id].seerChecks.map(function (c) {
            return getPlayerById(room, c.targetId).name + (c.result === 'good' ? '（好人）' : '（狼人）');
        }).join('、');
        var resp = await withTimeout(queryAIWithContext(room, seer,
            '你是预言家。每晚可以查验一名玩家的阵营（好人或狼人）。' + (seer.character ? seer.character.desc : ''),
            '第' + gs.day + '天夜晚。存活可查玩家：' + aliveNames + (checkedNames ? '。你之前查验过：' + checkedNames : '') + '。请回复你要查验的玩家名字。'), ACTION_TIMEOUT);
        var parsed = null;
        if (resp && resp !== '__timeout__') parsed = parsePlayerName(resp, candidates);
        if (!parsed) parsed = candidates[Math.floor(Math.random() * candidates.length)].id;
        var p = getPlayerById(room, parsed);
        var r = isWolf(p.identityId) ? 'wolf' : 'good';
        gs.night.seerTarget = parsed;
        gs.night.seerResult = r;
        gs.players[seer.id].seerChecks.push({ targetId: parsed, result: r });
        var seerTargetName = p.name;
        var seerResultText = r === 'wolf' ? '狼人' : '好人';
        await generateAndStoreThought(room, seer, '查验', '查验了' + seerTargetName + '，结果是' + seerResultText, 'night');
    }
    hideNightAction();
}

/* ── Placeholder Night Handlers (extensible) ── */

async function runNightHunter(room, hunter) {
    // Placeholder: 猎人夜间行动（可扩展）
    var gs = room.gameState;
    if (hunter.isUser) {
        renderNightAction(room, 'hunter', getAlivePlayers(room).filter(function (p) { return p.id !== hunter.id; }), null);
        var result = await withTimeout(waitForHumanAction(), ACTION_TIMEOUT);
        clearCountdown();
        // TODO: 猎人夜间技能
    } else {
        renderNightWaiting(room, hunter);
        // TODO: 猎人夜间AI决策
    }
    hideNightAction();
}

async function runNightIdiot(room, idiot) {
    // Placeholder: 白痴首夜行动（可扩展）
    var gs = room.gameState;
    if (idiot.isUser) {
        renderNightAction(room, 'idiot', getAlivePlayers(room), null);
        var result = await withTimeout(waitForHumanAction(), ACTION_TIMEOUT);
        clearCountdown();
        // TODO: 白痴首夜技能
    } else {
        renderNightWaiting(room, idiot);
        // TODO: 白痴首夜AI决策
    }
    hideNightAction();
}

/* ── Day Phase Handlers ── */

function renderDayAnnounce(room) {
    var gs = room.gameState;
    var dead = room.players.filter(function (p) {
        var ps = gs.players[p.id];
        return ps && !ps.alive && ps.deathCause;
    });
    if (dead.length === 0) {
        addMessage('系统', '天亮了。昨晚是平安夜，无人死亡。');
    } else {
        var text = '天亮了。昨晚';
        dead.forEach(function (p, i) {
            if (i > 0) text += '，';
            text += p.name + '死了';
        });
        text += '。';
        addMessage('系统', text);
    }
    room.players.forEach(function (p) {
        var ps = gs.players[p.id];
        if (ps) delete ps.deathCause;
    });
    renderPhaseIndicator(room);
}

async function runDaySpeech(room) {
    var gs = room.gameState;
    var alive = getAlivePlayers(room);
    if (alive.length === 0) return;

    // Fixed seat order: P1, P2, ..., PN
    var order = alive.sort(function (a, b) {
        return room.players.indexOf(a) - room.players.indexOf(b);
    });

    var $btn = $('[data-footer="continue"]');
    for (var i = 0; i < order.length; i++) {
        var speaker = order[i];
        if (speaker.isUser) {
            showChatInput();
            $btn.text('发言完毕').prop('disabled', false).off('click').on('click', function () {
                hideChatInput();
                $btn.prop('disabled', true).text('进行中...');
                if (pendingHumanAction) {
                    pendingHumanAction.resolve();
                    pendingHumanAction = null;
                }
            });
            await waitForHumanAction();
        } else {
            var $indicator = $('<div class="speech-indicator">' + speaker.name + '发言中...</div>');
            $('#day-selector').hide();
            $('#meeting-messages').before($indicator);
            $btn.prop('disabled', true).text('进行中...').addClass('breathing');
            var speech = await withTimeout(generateAISpeech(room, speaker), ACTION_TIMEOUT);
            $indicator.remove();
            $('#day-selector').show();
            $btn.removeClass('breathing');
            if (speech === '__timeout__' || !speech) {
                addMessage('系统', speaker.name + '超时无响应。');
            } else {
                addMessage(speaker.name, speech);
            }
            await saveGameState(room);
        }
    }
}

async function generateAISpeech(room, speaker) {
    var gs = room.gameState;
    var roleDef = ROLES.find(function (r) { return r.id === speaker.identityId; });
    var roleName = roleDef ? roleDef.name : '未知';
    var aliveNames = getAlivePlayers(room).map(function (p) { return p.name; }).join('、');
    var privateInfo = '';
    if (isWolf(speaker.identityId)) {
        var teammates = getAliveWolves(room).filter(function (w) { return w.id !== speaker.id; }).map(function (w) { return w.name; }).join('、');
        privateInfo = '你是狼人阵营。你的狼队友：' + (teammates || '无（你可能是唯一的狼）');
    }
    if (speaker.identityId === 'seer') {
        var checks = gs.players[speaker.id].seerChecks.map(function (c) {
            return getPlayerById(room, c.targetId).name + (c.result === 'good' ? '是好人' : '是狼人');
        }).join('；');
        privateInfo = '你是预言家。查验记录：' + (checks || '暂无');
    }
    var resp = await queryAIWithContext(room, speaker,
        '你是' + speaker.name + '，身份是' + roleName + '。当前是第' + gs.day + '天的白天讨论环节。存活玩家：' + aliveNames + '。' + privateInfo + (speaker.character ? '\n你的性格：' + speaker.character.desc : '') + '\n请发表你的观点和推理，用中文发言，语气符合角色性格，50-100字。只回复发言内容，不要加引号或前缀。',
        '请发表你的发言。');
    await generateAndStoreThought(room, speaker, '白天发言', '发表了公开演讲', 'day');
    return resp || '（沉默）';
}

async function runDayVote(room) {
    var gs = room.gameState;
    var voters = getAlivePlayers(room).filter(function (p) { return gs.players[p.id].canVote; });
    var targets = getAlivePlayers(room);
    gs.dayVotes = {};
    var userVoter = voters.find(function (v) { return v.isUser; });
    if (userVoter) {
        renderVoteUI(room, targets);
        var vote = await withTimeout(waitForHumanAction(), ACTION_TIMEOUT);
        clearCountdown();
        gs.dayVotes[userVoter.id] = (vote !== '__timeout__') ? vote : 'abstain';
        var votedName = gs.dayVotes[userVoter.id] === 'abstain' ? '弃权' : getPlayerById(room, gs.dayVotes[userVoter.id]).name;
        var $panel = $('#night-action-panel');
        $panel.html('<div class="night-action-title">投票</div><div class="vote-waiting">你投了 <b>' + votedName + '</b><br>等待其他玩家投票...</div>');
    }
    var aiVoters = voters.filter(function (v) { return !v.isUser; });
    var targetNames = targets.map(function (p) { return p.name; }).join('、');
    for (var i = 0; i < aiVoters.length; i++) {
        if (i > 0) await new Promise(function (r) { setTimeout(r, 1000); });
        var voter = aiVoters[i];
        var resp = await withTimeout(queryAIWithContext(room, voter,
            '你是' + voter.name + '。当前投票环节，请投出你认为的狼人。' + (voter.character ? voter.character.desc : ''),
            '可投票目标：' + targetNames + '。回复玩家名字或"弃权"。'), ACTION_TIMEOUT);
        var parsed = (resp && resp !== '__timeout__') ? parsePlayerName(resp, targets) : null;
        gs.dayVotes[voter.id] = parsed || 'abstain';
        var votedFor = gs.dayVotes[voter.id] === 'abstain' ? '弃权' : getPlayerById(room, gs.dayVotes[voter.id]).name;
        await generateAndStoreThought(room, voter, '投票', '投了' + votedFor, 'day');
    }
    hideVoteUI();
    var result = tallyVotes(room, gs.dayVotes, targets);
    addMessage('系统', '投票结果：' + result.summary);
    if (result.eliminated) {
        var elId = result.eliminated;
        var elPlayer = getPlayerById(room, elId);
        if (elPlayer.identityId === 'idiot') {
            var elPs = gs.players[elId];
            if (elPlayer.isUser) {
                renderIdiotChoice(room, elPlayer);
                var choice = await withTimeout(waitForHumanAction(), ACTION_TIMEOUT);
                clearCountdown();
                if (choice === 'reveal') {
                    elPs.isIdiotRevealed = true;
                    elPs.canVote = false;
                    addMessage('系统', elPlayer.name + '翻出白痴身份，免于被投出。');
                    await saveGameState(room);
                    return;
                }
            } else {
                elPs.isIdiotRevealed = true;
                elPs.canVote = false;
                addMessage('系统', elPlayer.name + '翻出白痴身份，免于被投出。');
                await saveGameState(room);
                return;
            }
        }
        killPlayer(room, elId, 'vote');
        await saveGameState(room);
        var winner = checkWinCondition(room);
        if (winner) { gs.winner = winner; gs.phase = 'game-over'; await saveGameState(room); renderPhaseIndicator(room); renderGameOver(room); return; }
        if (elPlayer.identityId === 'hunter' || elPlayer.identityId === 'wolfking') {
            await runShootAbility(room, elPlayer);
            winner = checkWinCondition(room);
            if (winner) { gs.winner = winner; gs.phase = 'game-over'; await saveGameState(room); renderPhaseIndicator(room); renderGameOver(room); return; }
        }
        // Last words for voted-out player
        addMessage('系统', '— ' + elPlayer.name + '的遗言 —');
        if (elPlayer.isUser) {
            showChatInput();
            var $btn = $('[data-footer="continue"]');
            $btn.text('遗言完毕').prop('disabled', false).off('click').on('click', function () {
                hideChatInput();
                $btn.prop('disabled', true).text('进行中...');
                if (pendingHumanAction) {
                    pendingHumanAction.resolve();
                    pendingHumanAction = null;
                }
            });
            await waitForHumanAction();
        } else {
            var lastWord = await generateAISpeech(room, elPlayer);
            addMessage(elPlayer.name, '【遗言】' + (lastWord || '（沉默）'));
        }
        gs.players[elId].lastWordsSpoken = true;
        await saveGameState(room);
    }
}

function tallyVotes(room, votes, targets) {
    var counts = {};
    targets.forEach(function (p) { counts[p.id] = 0; });
    var abstainCount = 0;
    Object.keys(votes).forEach(function (voterId) {
        var targetId = votes[voterId];
        if (targetId === 'abstain') {
            abstainCount++;
        } else {
            counts[targetId] = (counts[targetId] || 0) + 1;
        }
    });
    var summaryParts = [];
    Object.keys(counts).forEach(function (id) {
        if (counts[id] > 0) {
            summaryParts.push(getPlayerById(room, id).name + '：' + counts[id] + '票');
        }
    });
    if (abstainCount > 0) summaryParts.push('弃权：' + abstainCount + '票');
    var maxVotes = 0; var eliminated = null; var tied = false;
    Object.keys(counts).forEach(function (id) {
        if (counts[id] > maxVotes) { maxVotes = counts[id]; eliminated = id; tied = false; }
        else if (counts[id] === maxVotes && maxVotes > 0) { tied = true; }
    });
    return { summary: summaryParts.join('，'), eliminated: tied ? null : eliminated };
}

async function runShootAbility(room, shooter) {
    var gs = room.gameState;
    var targets = getAlivePlayers(room).filter(function (p) { return p.id !== shooter.id; });
    if (targets.length === 0) return;
    if (shooter.isUser) {
        renderShootUI(room, shooter, targets);
        var targetId = await withTimeout(waitForHumanAction(), ACTION_TIMEOUT);
        clearCountdown();
        if (targetId !== '__timeout__' && targetId && targetId !== 'skip') {
            killPlayer(room, targetId, 'shoot');
        } else if (targetId === '__timeout__') {
            addMessage('系统', shooter.name + '超时未开枪。');
        }
    } else {
        var names = targets.map(function (p) { return p.name; }).join('、');
        var resp = await withTimeout(queryAIWithContext(room, shooter,
            '你是' + shooter.name + '（' + ROLES.find(function (r) { return r.id === shooter.identityId; }).name + '），你死了。你可以开枪带走一名玩家，被带走者无遗言。' + (shooter.character ? shooter.character.desc : ''),
            '可射击目标：' + names + '。回复目标名字或"不开枪"。'), ACTION_TIMEOUT);
        if (resp && resp !== '__timeout__') {
            var parsed = parsePlayerName(resp, targets);
            if (parsed) killPlayer(room, parsed, 'shoot');
        }
        await generateAndStoreThought(room, shooter, '开枪', '使用了射击技能', 'day');
    }
    hideShootUI();
    await saveGameState(room);
}

/* ── Night/Day UI Renderers ── */

function renderPhaseIndicator(room) {
    var gs = room.gameState;
    var $indicator = $('#phase-indicator');
    if (!$indicator.length) return;
    var text = '';
    if (gs.phase === 'idle') text = '';
    else if (gs.phase === 'night') {
        var entry = NIGHT_ORDER.find(function (e) { return e.id === gs.subPhase; });
        text = '第' + gs.day + '天 · 夜晚' + (entry ? ' · ' + entry.label + '行动' : '');
    }
    else if (gs.phase === 'day-announce') text = '第' + gs.day + '天 · 白昼降临';
    else if (gs.phase === 'day-speech') text = '第' + gs.day + '天 · 固定发言';
    else if (gs.phase === 'day-vote') text = '第' + gs.day + '天 · 投票环节';
    else if (gs.phase === 'game-over') text = '游戏结束';
    $indicator.text(text);
}

function renderNightAction(room, type, candidates, extra) {
    var $panel = $('#night-action-panel');
    if (!$panel.length) return;
    var html = '<div class="night-action-title">';
    if (type === 'guard') html += '守卫 — 选择要守护的玩家';
    else if (type === 'cupid') html += '丘比特 — 选择两名玩家作为恋人（依次点击）';
    else if (type === 'werewolf') html += '狼人 — 选择要杀害的目标' + (extra ? '<br><span class="night-action-sub">你的狼队友：' + extra + '</span>' : '');
    else if (type === 'witch') html += '女巫 —' + (extra ? ' 今晚<b>' + extra + '</b>被狼人杀害' : ' 今晚无人被狼人杀害');
    else if (type === 'seer') html += '预言家 — 选择要查验的玩家';
    html += '</div><div class="night-action-list">';
    candidates.forEach(function (p) {
        html += '<button class="night-action-target" data-target="' + p.id + '">' + p.name + '</button>';
    });
    if (type === 'werewolf') html += '<button class="night-action-target night-action-skip" data-target="empty">空刀</button>';
    if (type === 'witch') {
        var gs = room.gameState;
        var ps = gs.players[room.players.find(function (p) { return p.isUser; }).id];
        if (extra && !ps.witchHealUsed && !(gs.day === 0 && gs.night.wolfTarget === room.players.find(function (p) { return p.isUser; }).id)) {
            html += '<button class="night-action-target night-action-heal" data-target="heal">使用解药救' + extra + '</button>';
        }
        if (!ps.witchPoisonUsed) {
            html += '<div class="night-action-sub">选择毒杀目标：</div>';
            getAlivePlayers(room).filter(function (p) { return !p.isUser; }).forEach(function (p) {
                html += '<button class="night-action-target night-action-poison" data-target="poison-' + p.id + '">毒杀' + p.name + '</button>';
            });
        }
        html += '<button class="night-action-target night-action-skip" data-target="skip">跳过</button>';
    }
    html += '</div>';
    showNightPanel(html);
    $('#meeting-chat-input').hide();
    startCountdown(ACTION_TIMEOUT, $panel);

    $panel.off('click').on('click', '.night-action-target', function () {
        var target = $(this).data('target');
        if (!pendingHumanAction) return;
        if (type === 'cupid') {
            if (!pendingHumanAction._cupidFirst) {
                pendingHumanAction._cupidFirst = target;
                $(this).addClass('selected').prop('disabled', true);
                return;
            }
            clearCountdown();
            pendingHumanAction.resolve([pendingHumanAction._cupidFirst, target]);
            pendingHumanAction = null;
            return;
        }
        if (type === 'witch') {
            var result = { heal: false, poison: null };
            if (target === 'heal') result.heal = true;
            else if (target && target.toString().indexOf('poison-') === 0) result.poison = target.replace('poison-', '');
            clearCountdown();
            pendingHumanAction.resolve(result);
            pendingHumanAction = null;
            return;
        }
        clearCountdown();
        pendingHumanAction.resolve(target === 'empty' ? null : target);
        pendingHumanAction = null;
    });
}

function renderNightWaiting(room, player) {
    var $panel = $('#night-action-panel');
    if (!$panel.length) return;
    var roleLabels = { guard: '守卫', cupid: '丘比特', werewolf: '狼人', witch: '女巫', seer: '预言家' };
    var label = roleLabels[player.identityId] || '其他玩家';
    showNightPanel('<div class="night-action-waiting">等待' + label + '行动...</div>');
}

function showNightPanel(html) {
    $('#night-action-panel').html(html).css('display', 'flex');
}

function hideNightAction() {
    $('#night-action-panel').hide();
}

function showSeerResult(name, result) {
    var text = result === 'wolf' ? name + ' 是狼人阵营！' : name + ' 是好人阵营。';
    toastr.success(text, '查验结果');
}

function showChatInput() {
    $('#meeting-chat-input').show();
    $('[data-footer="send"]').show();
}

function hideChatInput() {
    $('#meeting-chat-input').hide();
    $('[data-footer="send"]').hide();
}

function renderVoteUI(room, targets) {
    var $panel = $('#night-action-panel');
    var html = '<div class="night-action-title">投票 — 选择你要投出的玩家</div><div class="night-action-list">';
    targets.forEach(function (p) {
        html += '<button class="night-action-target" data-target="' + p.id + '">' + p.name + '</button>';
    });
    html += '<button class="night-action-target night-action-skip" data-target="abstain">弃权</button>';
    html += '</div>';
    showNightPanel(html);
    $('#meeting-chat-input').hide();
    startCountdown(ACTION_TIMEOUT, $panel);

    $panel.off('click').on('click', '.night-action-target', function () {
        if (!pendingHumanAction) return;
        clearCountdown();
        pendingHumanAction.resolve($(this).data('target'));
        pendingHumanAction = null;
    });
}

function hideVoteUI() {
    hideNightAction();
}

function renderShootUI(room, shooter, targets) {
    var roleName = ROLES.find(function (r) { return r.id === shooter.identityId; }).name;
    var $panel = $('#night-action-panel');
    var html = '<div class="night-action-title">' + roleName + '技能 — 选择要带走的玩家</div><div class="night-action-list">';
    targets.forEach(function (p) {
        html += '<button class="night-action-target" data-target="' + p.id + '">' + p.name + '</button>';
    });
    html += '<button class="night-action-target night-action-skip" data-target="skip">不开枪</button>';
    html += '</div>';
    showNightPanel(html);
    startCountdown(ACTION_TIMEOUT, $panel);

    $panel.off('click').on('click', '.night-action-target', function () {
        if (!pendingHumanAction) return;
        clearCountdown();
        pendingHumanAction.resolve($(this).data('target'));
        pendingHumanAction = null;
    });
}

function hideShootUI() {
    hideNightAction();
}

function renderIdiotChoice(room, player) {
    var $panel = $('#night-action-panel');
    showNightPanel('<div class="night-action-title">你被投票出局了</div><div class="night-action-list"><button class="night-action-target" data-target="reveal">翻牌免死（之后无法投票）</button><button class="night-action-target night-action-skip" data-target="accept">接受出局</button></div>');
    startCountdown(ACTION_TIMEOUT, $panel);

    $panel.off('click').on('click', '.night-action-target', function () {
        if (!pendingHumanAction) return;
        clearCountdown();
        pendingHumanAction.resolve($(this).data('target'));
        pendingHumanAction = null;
    });
}

function renderGameOver(room) {
    var gs = room.gameState;
    var winner = gs.winner;
    var text = winner === 'good' ? '好人阵营获胜！' : '狼人阵营获胜！';
    var $overlay = $('#game-over-overlay');
    if (!$overlay.length) return;
    $overlay.html('<div class="game-over-content"><div class="game-over-title">' + text + '</div><button class="game-over-btn" id="game-over-back">返回首页</button></div>').show();
    $('#game-over-back').on('click', function () {
        $overlay.hide();
        window.location.hash = '#/home';
    });
}


/* ══════════════════════════════════════
   § Meeting - 房间详情视图
   ══════════════════════════════════════ */

var _mt = { bound: {}, room: null, selectedDay: undefined };

window.viewMeeting = {
    init: function () {
        if (currentRoomId) {
            getRoom(currentRoomId).then(function (room) {
                if (room) {
                    if (!room.gameState) initGameState(room);
                    renderMeeting(room);
                    renderPhaseIndicator(room);
                    bindChatInput();
                    if (room.gameState.phase === 'idle') {
                        bindGameStart();
                    } else if (room.gameState.phase === 'game-over') {
                        renderGameOver(room);
                    }
                }
            });
        }
    },
    destroy: function () {
        var container = document.querySelector('[data-view="meeting"] .view-container');
        if (container) container.removeEventListener('click', _mt.bound.barClick);
        var msgs = document.getElementById('meeting-messages');
        if (msgs) {
            msgs.removeEventListener('touchstart', _mt.bound.touchStart);
            msgs.removeEventListener('touchmove', _mt.bound.touchMove);
            msgs.removeEventListener('touchend', _mt.bound.touchEnd);
            msgs.removeEventListener('click', _mt.bound.deleteClick);
        }
        $('#meeting-panel').off('click', _mt.bound.revealClick);
        $('#meeting-room-name').off('change', _mt.bound.nameChange);
        $('#meeting-player-name').off('change', _mt.bound.playerNameChange);
        $('#meeting-chat-input').off('keydown', _mt.bound.chatKeydown);
        $('[data-footer="send"]').off('click', _mt.bound.sendClick);
        $('[data-footer="continue"]').off('click', _mt.bound.continueClick);
        $('#night-action-panel').off('click');
        $('.mention-list').off('click', _mt.bound.mentionClick).remove();
        $('#game-over-overlay').hide();
        pendingHumanAction = null;
        _mt.bound = {};
        _mt.room = null;
    }
};

function renderMeeting(room) {
    _mt.room = room;
    headerValue.textContent = room.name;
    headerTitle.classList.add('value-title');

    var container = document.querySelector('[data-view="meeting"] .view-container');
    container.removeEventListener('click', _mt.bound.barClick);

    document.querySelectorAll('.meeting-bar-btn').forEach(function (b) { b.classList.remove('active'); });
    _mt.activePanel = null;

    var panel = $('#meeting-panel');
    panel.hide().empty();

    renderMessages(room);

    _mt.bound.barClick = function (e) {
        var btn = e.target.closest('.meeting-bar-btn');
        if (!btn) {
            if (panel.length && !panel[0].contains(e.target)) {
                closeMeetingPanel();
            }
            return;
        }
        var type = btn.getAttribute('data-panel');
        if (_mt.activePanel === type) {
            closeMeetingPanel();
        } else {
            document.querySelectorAll('.meeting-bar-btn').forEach(function (b) { b.classList.remove('active'); });
            btn.classList.add('active');
            showMeetingPanel(type, room);
        }
    };
    container.addEventListener('click', _mt.bound.barClick);
}

function closeMeetingPanel() {
    $('#meeting-panel').hide();
    document.querySelectorAll('.meeting-bar-btn').forEach(function (b) { b.classList.remove('active'); });
    _mt.activePanel = null;
    _mt.selectedDay = undefined;
    var room = _mt.room;
    if (room) {
        renderDaySelector(room);
        renderMessagesForDay(room, room.gameState ? room.gameState.day : 0);
    }
    $('#meeting-messages').show();
    $('#day-selector').show();
}

function showMeetingPanel(type, room) {
    var $panel = $('#meeting-panel');
    if (!$panel.length) return;
    _mt.activePanel = type;

    var html = '';
    if (type === 'characters') {
        html = buildCharactersPanel(room);
    } else if (type === 'identities') {
        html = buildIdentitiesPanel(room);
    } else if (type === 'detail') {
        html = buildDetailPanel(room);
    } else if (type === 'events') {
        html = buildEventsPanel(room);
    }

    if (html) {
        $panel.html(html).show();
    } else {
        $panel.hide();
    }

    $('#meeting-messages').hide();
    $('#day-selector').hide();

    if (type === 'characters') {
        $panel.off('click', _mt.bound.revealClick);
        _mt.bound.revealClick = function (e) {
            var btn = e.target.closest('.player-identity-reveal');
            if (!btn) return;
            var card = btn.closest('.player-card');
            $(card).find('.identity-mask').hide();
            $(card).find('.identity-real').show();
            $(btn).hide();
        };
        $panel.on('click', _mt.bound.revealClick);
    }

    if (type === 'detail') {
        var nameInput = document.getElementById('meeting-room-name');
        if (nameInput) {
            _mt.bound.nameChange = function () {
                var val = nameInput.value.trim();
                if (val) {
                    room.name = val;
                    headerValue.textContent = val;
                    saveRoom(room);
                }
            };
            $(nameInput).on('change', _mt.bound.nameChange);
        }
        var playerInput = document.getElementById('meeting-player-name');
        if (playerInput && room.players) {
            _mt.bound.playerNameChange = function () {
                var val = playerInput.value.trim();
                if (val) {
                    var user = room.players.find(function (p) { return p.isUser; });
                    if (user) user.name = val;
                    saveRoom(room);
                }
            };
            $(playerInput).on('change', _mt.bound.playerNameChange);
        }
    }
}

function buildCharactersPanel(room) {
    if (!room.players || room.players.length === 0) return '<div class="meeting-empty">暂无玩家</div>';
    var gs = room.gameState;
    var html = '<div class="player-list">';
    room.players.forEach(function (p, idx) {
        var def = ROLES.find(function (d) { return d.id === p.identityId; });
        var campClass = def ? def.camp : '';
        var userClass = p.isUser ? ' player-self' : '';
        var ps = gs ? gs.players[p.id] : null;
        var isDead = ps && !ps.alive;
        var deadClass = isDead ? ' dead' : '';
        var avatarHtml = '';
        if (p.isUser) {
            avatarHtml = '<div class="player-avatar-self">' + p.name.charAt(0) + '</div>';
        } else if (p.character && p.character.avatar) {
            avatarHtml = '<img src="' + p.character.avatar + '" alt="" class="player-avatar-img" onerror="this.style.display=\'none\'">';
        }
        if (!p.isUser && (!p.character || !p.character.avatar)) {
            avatarHtml = '<div class="player-avatar-placeholder">' + p.name.charAt(0) + '</div>';
        }
        var identityHtml = '';
        var user = room.players.find(function (u) { return u.isUser; });
        var userIsWolf = user && gs && gs.players[user.id] && gs.players[user.id].alive && isWolf(user.identityId);
        if (p.isUser) {
            identityHtml = '<span class="player-card-identity ' + campClass + '">' + (def ? def.name : '未知') + '</span>';
        } else if (userIsWolf && isWolf(p.identityId)) {
            identityHtml = '<span class="player-card-identity ' + campClass + '">' + (def ? def.name : '未知') + '</span>';
        } else {
            identityHtml = '<span class="identity-mask">***</span>' +
                '<span class="identity-real player-card-identity ' + campClass + '" style="display:none">' + (def ? def.name : '未知') + '</span>';
        }
        html += '<div class="player-card' + userClass + deadClass + '">' +
            '<span class="player-card-seat">P' + (idx + 1) + '</span>' +
            '<div class="player-card-avatar">' + avatarHtml + '</div>' +
            '<div class="player-card-info">' +
                '<span class="player-card-name">' + p.name + (p.isUser ? '（你）' : '') + (isDead ? ' <span class="player-card-dead">已死亡</span>' : '') + '</span>' +
                identityHtml +
            '</div>' +
            (p.isUser || (userIsWolf && isWolf(p.identityId)) ? '' : '<button class="player-identity-reveal">查看</button>') +
        '</div>';
    });
    html += '</div>';
    return html;
}

function buildIdentitiesPanel(room) {
    if (!room.roles || room.roles.length === 0) return '<div class="meeting-empty">暂无身份配置</div>';
    var html = '<div class="meeting-identity-list">';
    room.roles.forEach(function (r) {
        var def = ROLES.find(function (d) { return d.id === r.id; });
        if (!def) return;
        html += '<div class="meeting-identity-row">' +
            '<span class="meeting-identity-badge ' + def.camp + '">' + def.icon + '</span>' +
            '<span class="meeting-identity-name">' + def.name + '</span>' +
            '<span class="meeting-identity-qty">×' + r.qty + '</span>' +
        '</div>';
    });
    html += '</div>';
    return html;
}

function buildDetailPanel(room) {
    var rolesHtml = '';
    if (room.roles) {
        room.roles.forEach(function (r) {
            var def = ROLES.find(function (d) { return d.id === r.id; });
            if (def) {
                rolesHtml += '<span class="detail-role-tag ' + def.camp + '">' + def.name + ' ×' + r.qty + '</span>';
            }
        });
    }
    var user = room.players ? room.players.find(function (p) { return p.isUser; }) : null;
    var userName = user ? user.name : '玩家';
    return '<div class="meeting-detail">' +
        '<div class="meeting-detail-row">' +
            '<span class="meeting-detail-label">房间名称</span>' +
            '<input class="meeting-detail-input" id="meeting-room-name" type="text" value="' + room.name + '" maxlength="20">' +
        '</div>' +
        '<div class="meeting-detail-row">' +
            '<span class="meeting-detail-label">你的名字</span>' +
            '<input class="meeting-detail-input" id="meeting-player-name" type="text" value="' + userName + '" maxlength="10">' +
        '</div>' +
        '<div class="meeting-detail-row">' +
            '<span class="meeting-detail-label">房间人数</span>' +
            '<span class="meeting-detail-value">' + room.playerCount + ' 人</span>' +
        '</div>' +
        '<div class="meeting-detail-row">' +
            '<span class="meeting-detail-label">房间身份</span>' +
            '<div class="detail-role-tags">' + rolesHtml + '</div>' +
        '</div>' +
        '<div class="meeting-detail-row">' +
            '<span class="meeting-detail-label">创建时间</span>' +
            '<span class="meeting-detail-value">' + formatTime(room.createdAt) + '</span>' +
        '</div>' +
    '</div>';
}

function buildEventsPanel(room) {
    if (!room.events || room.events.length === 0) {
        return '<div class="events-panel"><div class="meeting-empty">暂无事件记录</div></div>';
    }
    var html = '<div class="events-panel"><div class="event-list">';
    room.events.forEach(function (ev) {
        var phaseText = ev.phase === 'night' ? '夜晚' : '白天';
        html += '<div class="event-msg">' +
            '<div class="event-msg-time">第' + ev.day + '天 ' + phaseText + '</div>' +
            '<div class="event-msg-body">' + ev.text + '</div>' +
        '</div>';
    });
    html += '</div></div>';
    return html;
}

function addRoomEvent(day, phase, text) {
    var room = _mt.room;
    if (!room) return;
    if (!room.events) room.events = [];
    room.events.push({ day: day, phase: phase, text: text, time: Date.now() });
    saveRoom(room).then(function () {
        if (_mt.activePanel === 'events') {
            var $panel = $('#meeting-panel');
            if ($panel.length) $panel.html(buildEventsPanel(room));
        }
    });
}

function renderMessages(room) {
    var gs = room.gameState;
    var day = (gs && gs.phase && gs.phase !== 'idle') ? gs.day : 0;
    renderDaySelector(room);
    renderMessagesForDay(room, day);
}

function renderDaySelector(room) {
    var $selector = $('#day-selector');
    if (!$selector.length) return;
    var gs = room.gameState;
    if (!gs || !gs.phase || gs.phase === 'idle') {
        $selector.hide();
        return;
    }
    var currentDay = gs.day;
    var html = '';
    for (var d = 0; d <= currentDay; d++) {
        var active = (_mt.selectedDay !== undefined ? _mt.selectedDay : currentDay) === d ? ' active' : '';
        html += '<button class="day-selector-btn' + active + '" data-day="' + d + '">第' + d + '天</button>';
    }
    $selector.html(html).show();
    $selector.off('click').on('click', '.day-selector-btn', function () {
        var day = parseInt($(this).data('day'));
        _mt.selectedDay = day;
        $selector.find('.day-selector-btn').removeClass('active');
        $(this).addClass('active');
        renderMessagesForDay(room, day);
    });
}

function renderMessagesForDay(room, day) {
    var $container = $('#meeting-messages');
    if (!$container.length) return;
    if (!room.messages || room.messages.length === 0) {
        $container.empty();
        return;
    }
    var html = '';
    var hasMessages = false;
    room.messages.forEach(function (msg, idx) {
        if (msg.day !== day) return;
        hasMessages = true;
        var lines = msg.text.split('\n');
        var textHtml = lines.join('<br>');
        html += '<div class="chat-msg-swipe" data-idx="' + idx + '">' +
            '<div class="chat-msg-content">' +
                '<span class="chat-msg-name">' + msg.name + '</span>' +
                '<span class="chat-msg-text">' + textHtml + '</span>' +
            '</div>' +
            '<div class="chat-msg-delete">删除</div>' +
        '</div>';
    });
    if (!hasMessages) {
        html = '<div class="day-empty-msg">该日暂无发言记录</div>';
    }
    $container.html(html);
    $container[0].scrollTop = $container[0].scrollHeight;
    bindSwipeDelete($container[0], room);
}

function addMessage(name, text) {
    var room = _mt.room;
    if (!room) return;
    if (!room.messages) room.messages = [];
    var day = room.gameState ? room.gameState.day : 0;
    var last = room.messages[room.messages.length - 1];
    if (last && last.name === name && last.day === day) {
        last.text += '\n' + text;
        last.time = Date.now();
    } else {
        room.messages.push({ name: name, text: text, time: Date.now(), day: day });
    }
    saveRoom(room).then(function () {
        renderDaySelector(room);
        renderMessagesForDay(room, _mt.selectedDay !== undefined ? _mt.selectedDay : day);
    });
}

var _swipe = { el: null, startX: 0, currentX: 0, open: false };

function bindSwipeDelete(container, room) {
    container.removeEventListener('touchstart', _mt.bound.touchStart);
    container.removeEventListener('touchmove', _mt.bound.touchMove);
    container.removeEventListener('touchend', _mt.bound.touchEnd);
    container.removeEventListener('click', _mt.bound.deleteClick);

    _mt.bound.touchStart = function (e) {
        var swipe = e.target.closest('.chat-msg-swipe');
        if (!swipe) return;
        if (_swipe.open && _swipe.el !== swipe) {
            resetSwipe();
        }
        _swipe.el = swipe;
        _swipe.startX = e.touches[0].clientX;
        _swipe.currentX = _swipe.startX;
        swipe.style.transition = 'none';
    };

    _mt.bound.touchMove = function (e) {
        if (!_swipe.el) return;
        _swipe.currentX = e.touches[0].clientX;
        var dx = _swipe.currentX - _swipe.startX;
        if (dx > 0) dx = 0;
        if (dx < -70) dx = -70;
        _swipe.el.querySelector('.chat-msg-content').style.transform = 'translateX(' + dx + 'px)';
    };

    _mt.bound.touchEnd = function () {
        if (!_swipe.el) return;
        var dx = _swipe.currentX - _swipe.startX;
        var content = _swipe.el.querySelector('.chat-msg-content');
        content.style.transition = 'transform 0.2s';
        if (dx < -35) {
            content.style.transform = 'translateX(-70px)';
            _swipe.open = true;
        } else {
            content.style.transform = 'translateX(0)';
            _swipe.open = false;
            _swipe.el = null;
        }
    };

    _mt.bound.deleteClick = function (e) {
        var btn = e.target.closest('.chat-msg-delete');
        if (!btn) {
            if (_swipe.open) resetSwipe();
            return;
        }
        var swipe = btn.closest('.chat-msg-swipe');
        if (!swipe) return;
        var idx = parseInt(swipe.getAttribute('data-idx'), 10);
        room.messages.splice(idx, 1);
        _swipe.open = false;
        _swipe.el = null;
        saveRoom(room).then(function () { renderMessages(room); });
    };

    function resetSwipe() {
        if (_swipe.el) {
            var c = _swipe.el.querySelector('.chat-msg-content');
            if (c) { c.style.transition = 'transform 0.2s'; c.style.transform = 'translateX(0)'; }
        }
        _swipe.open = false;
        _swipe.el = null;
    }

    container.addEventListener('touchstart', _mt.bound.touchStart, { passive: true });
    container.addEventListener('touchmove', _mt.bound.touchMove, { passive: true });
    container.addEventListener('touchend', _mt.bound.touchEnd);
    container.addEventListener('click', _mt.bound.deleteClick);
}

function bindChatInput() {
    var $input = $('#meeting-chat-input');
    var $sendBtn = $('[data-footer="send"]');
    var $footer = $('#footer-banner');
    if (!$input.length || !$sendBtn.length || !$footer.length) return;

    var room = _mt.room;
    if (!room || !room.players) return;

    refreshMentionList(room);

    $footer.off('click', '.mention-tag').on('click', '.mention-tag', function () {
        var name = $(this).data('name');
        var val = $input.val();
        var pos = $input[0].selectionStart || val.length;
        var before = val.substring(0, pos);
        var after = val.substring(pos);
        if (before.length > 0 && before.charAt(before.length - 1) !== ' ') before += ' ';
        $input.val(before + '@' + name + ' ' + after);
        $input.focus();
    });

    function sendMessage() {
        var text = $input.val().trim();
        if (!text) return;
        $input.val('');
        var user = room.players.find(function (p) { return p.isUser; });
        var gs = room.gameState;

        // Wolf night discussion: messages go to wolfMessages, not public chat
        if (gs && gs.phase === 'night' && user && isWolf(user.identityId) && gs.wolfMessages) {
            appendWolfMessage(user ? user.name : '玩家', text);
            return;
        }

        addMessage(user ? user.name : '玩家', text);

        // Day phase: mentioned players respond via AI
        if (gs && (gs.phase === 'day-speech' || gs.phase === 'day-vote')) {
            var others = room.players.filter(function (p) { return !p.isUser; });
            var mentioned = [];
            others.forEach(function (p) {
                if (text.indexOf('@' + p.name) >= 0 && gs.players[p.id] && gs.players[p.id].alive) {
                    mentioned.push(p);
                }
            });
            if (mentioned.length > 0) {
                triggerMentionResponses(room, mentioned, text);
            }
        }
    }

    _mt.bound.sendClick = sendMessage;
    $sendBtn.off('click').on('click', _mt.bound.sendClick);

    _mt.bound.chatKeydown = function (e) {
        if (e.key === 'Enter') sendMessage();
    };
    $input.off('keydown').on('keydown', _mt.bound.chatKeydown);
}

async function triggerMentionResponses(room, mentioned, userText) {
    var gs = room.gameState;
    var eventText = room.events ? room.events.slice(-5).map(function (e) { return e.text; }).join('；') : '';
    for (var i = 0; i < mentioned.length; i++) {
        var p = mentioned[i];
        var roleDef = ROLES.find(function (r) { return r.id === p.identityId; });
        var resp = await queryAIWithContext(room, p,
            '你是' + p.name + '，正在参与狼人杀的自由讨论。' + (p.character ? p.character.desc : '') + (roleDef ? '你的身份是' + roleDef.name + '。' : ''),
            '有人对大家说："' + userText + '"，其中@了你。请简短回应，50字以内，符合你的性格。');
        if (resp) addMessage(p.name, resp);
        await generateAndStoreThought(room, p, '自由讨论回应', '回应了@提及', 'day');
        await saveGameState(room);
    }
}

function bindGameStart() {
    hideChatInput();
    updateContinueButton(_mt.room);
    rebindContinueButton(_mt.room);
}


/* ══════════════════════════════════════
   § Savepool - 房间列表视图
   ══════════════════════════════════════ */

var _sp = { bound: {} };

window.viewSavepool = {
    init: function () {
        loadRoomList();
    },
    destroy: function () {
        var container = document.querySelector('[data-view="savepool"] .view-container');
        if (container) container.removeEventListener('click', _sp.bound.cardClick);
        _sp.bound = {};
    }
};

function loadRoomList() {
    getAllRooms().then(function (rooms) {
        renderRoomList(rooms);
    }).catch(function (err) {
        console.error('Failed to load rooms:', err);
    });
}

function renderRoomList(rooms) {
    var container = document.querySelector('[data-view="savepool"] .view-container');

    if (!rooms || rooms.length === 0) {
        container.innerHTML =
            '<div class="room-empty">' +
                '<div class="role-empty-icon"></div>' +
                '<p class="role-empty-text">暂无房间</p>' +
                '<p class="role-empty-hint">点击首页「开始游戏」创建第一个房间</p>' +
            '</div>';
        return;
    }

    var html = '<div class="room-card-list">';
    rooms.sort(function (a, b) { return b.createdAt - a.createdAt; });
    rooms.forEach(function (room) {
        var modeText = room.mode === 'beginner' ? '新手' : '专家';
        html +=
            '<div class="room-card" data-room-id="' + room.id + '">' +
                '<div class="room-card-main">' +
                    '<span class="room-card-name">' + room.name + '</span>' +
                    '<span class="room-card-mode">' + modeText + '</span>' +
                '</div>' +
                '<div class="room-card-info">' +
                    '<span class="room-card-count">' + room.playerCount + ' 人</span>' +
                    '<span class="room-card-time">' + formatTime(room.createdAt) + '</span>' +
                    '<button class="room-card-delete">删除</button>' +
                '</div>' +
            '</div>';
    });
    html += '</div>';
    container.innerHTML = html;

    _sp.bound.cardClick = function (e) {
        var delBtn = e.target.closest('.room-card-delete');
        if (delBtn) {
            var card = delBtn.closest('.room-card');
            if (!card) return;
            var roomId = card.getAttribute('data-room-id');
            deleteRoom(roomId).then(function () {
                loadRoomList();
                toastr.success('房间已删除');
            }).catch(function () {
                toastr.error('删除失败');
            });
            return;
        }
        var card = e.target.closest('.room-card');
        if (!card) return;
        currentRoomId = card.getAttribute('data-room-id');
        window.location.hash = '#/meeting';
    };
    container.addEventListener('click', _sp.bound.cardClick);
}

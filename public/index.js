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

var FOOTER_CONFIG = {
    home: null,
    creating: '<button class="footer-action-btn" data-footer="back">返回</button><button class="footer-action-btn" data-footer="start">开始游戏</button>',
    rolepool: '<button class="footer-action-btn" data-footer="sync">同步角色</button><button class="footer-action-btn" data-footer="create">创建角色</button>',
    settings: null,
    savepool: null,
    meeting: '<input class="footer-chat-input" id="meeting-chat-input" type="text" placeholder="输入消息..." maxlength="100"><button class="footer-chat-send" data-footer="send">发送</button><button class="footer-chat-send" data-footer="continue">继续</button>'
};

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

    if (FOOTER_CONFIG[view]) {
        footerBanner.innerHTML = FOOTER_CONFIG[view];
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

document.addEventListener('DOMContentLoaded', function () {
    bindGlobalEvents();
    window.addEventListener('hashchange', function () {
        switchView(getViewFromHash());
    });
    switchView(getViewFromHash());
});

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
    { id: 'villager', name: '村民', camp: 'good', icon: '村', desc: '没有特殊能力，依靠推理和投票找出狼人。' },
    { id: 'seer', name: '预言家', camp: 'good', icon: '预', desc: '每晚可以查验一名玩家的身份。' },
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
    playerCount: 9,
    selectedRoles: [],
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

            var players = [{ id: 'player-user', name: playerName, isUser: true, identityId: identityPool[0] }];
            for (var i = 0; i < picked.length; i++) {
                players.push({
                    id: picked[i].id,
                    name: picked[i].name,
                    character: picked[i],
                    identityId: identityPool[i + 1]
                });
            }

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
   § Meeting - 房间详情视图
   ══════════════════════════════════════ */

var _mt = { bound: {}, room: null };

window.viewMeeting = {
    init: function () {
        if (currentRoomId) {
            getRoom(currentRoomId).then(function (room) {
                if (room) {
                    renderMeeting(room);
                    bindChatInput();
                }
            });
        }
    },
    destroy: function () {
        _mt.bound = {};
        _mt.room = null;
    }
};

function renderMeeting(room) {
    _mt.room = room;
    headerValue.textContent = room.name;
    headerTitle.classList.add('value-title');

    var container = document.querySelector('[data-view="meeting"] .view-container');
    container.innerHTML =
        '<div class="meeting-bar">' +
            '<button class="meeting-bar-btn" data-panel="characters">会议角色</button>' +
            '<button class="meeting-bar-btn" data-panel="identities">会议身份</button>' +
            '<button class="meeting-bar-btn" data-panel="events">会议事件</button>' +
            '<button class="meeting-bar-btn" data-panel="detail">会议详情</button>' +
        '</div>' +
        '<div class="meeting-messages" id="meeting-messages"></div>' +
        '<div class="meeting-panel" id="meeting-panel" style="display:none"></div>';

    renderMessages(room);

    container.removeEventListener('click', _mt.bound.barClick);
    _mt.activePanel = null;
    _mt.bound.barClick = function (e) {
        var btn = e.target.closest('.meeting-bar-btn');
        if (!btn) {
            var panel = document.getElementById('meeting-panel');
            if (panel && !panel.contains(e.target)) {
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
    var panel = document.getElementById('meeting-panel');
    if (panel) panel.style.display = 'none';
    document.querySelectorAll('.meeting-bar-btn').forEach(function (b) { b.classList.remove('active'); });
    _mt.activePanel = null;
    var msgs = document.getElementById('meeting-messages');
    if (msgs) msgs.style.display = '';
}

function showMeetingPanel(type, room) {
    var panel = document.getElementById('meeting-panel');
    if (!panel) return;
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

    panel.innerHTML = html;
    panel.style.display = html ? '' : 'none';

    var msgs = document.getElementById('meeting-messages');
    if (msgs) msgs.style.display = 'none';

    if (type === 'characters') {
        panel.removeEventListener('click', _mt.bound.revealClick);
        _mt.bound.revealClick = function (e) {
            var btn = e.target.closest('.player-identity-reveal');
            if (!btn) return;
            var card = btn.closest('.player-card');
            var mask = card.querySelector('.identity-mask');
            var real = card.querySelector('.identity-real');
            if (mask && real) {
                mask.style.display = 'none';
                real.style.display = '';
                btn.style.display = 'none';
            }
        };
        panel.addEventListener('click', _mt.bound.revealClick);
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
            nameInput.addEventListener('change', _mt.bound.nameChange);
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
            playerInput.addEventListener('change', _mt.bound.playerNameChange);
        }
    }
}

function buildCharactersPanel(room) {
    if (!room.players || room.players.length === 0) return '<div class="meeting-empty">暂无玩家</div>';
    var html = '<div class="player-list">';
    room.players.forEach(function (p) {
        var def = ROLES.find(function (d) { return d.id === p.identityId; });
        var campClass = def ? def.camp : '';
        var userClass = p.isUser ? ' player-self' : '';
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
        if (p.isUser) {
            identityHtml = '<span class="player-card-identity ' + campClass + '">' + (def ? def.name : '未知') + '</span>';
        } else {
            identityHtml = '<span class="identity-mask">***</span>' +
                '<span class="identity-real player-card-identity ' + campClass + '" style="display:none">' + (def ? def.name : '未知') + '</span>';
        }
        html += '<div class="player-card' + userClass + '">' +
            '<div class="player-card-avatar">' + avatarHtml + '</div>' +
            '<div class="player-card-info">' +
                '<span class="player-card-name">' + p.name + (p.isUser ? '（你）' : '') + '</span>' +
                identityHtml +
            '</div>' +
            (p.isUser ? '' : '<button class="player-identity-reveal">查看</button>') +
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
            var panel = document.getElementById('meeting-panel');
            if (panel) panel.innerHTML = buildEventsPanel(room);
        }
    });
}

function renderMessages(room) {
    var container = document.getElementById('meeting-messages');
    if (!container) return;
    if (!room.messages || room.messages.length === 0) {
        container.innerHTML = '';
        return;
    }
    var html = '';
    room.messages.forEach(function (msg, idx) {
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
    container.innerHTML = html;
    container.scrollTop = container.scrollHeight;
    bindSwipeDelete(container, room);
}

function addMessage(name, text) {
    var room = _mt.room;
    if (!room) return;
    if (!room.messages) room.messages = [];
    var last = room.messages[room.messages.length - 1];
    if (last && last.name === name) {
        last.text += '\n' + text;
        last.time = Date.now();
    } else {
        room.messages.push({ name: name, text: text, time: Date.now() });
    }
    saveRoom(room).then(function () {
        renderMessages(room);
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
    var input = document.getElementById('meeting-chat-input');
    var sendBtn = document.querySelector('[data-footer="send"]');
    var footer = document.getElementById('footer-banner');
    if (!input || !sendBtn || !footer) return;

    var room = _mt.room;
    if (!room || !room.players) return;

    var others = room.players.filter(function (p) { return !p.isUser; });
    if (others.length === 0) return;

    var listHtml = '';
    others.forEach(function (p) {
        listHtml += '<span class="mention-tag" data-name="' + p.name + '">' + p.name + '</span>';
    });
    var mentionRow = document.createElement('div');
    mentionRow.className = 'mention-list';
    mentionRow.innerHTML = listHtml;
    footer.insertBefore(mentionRow, footer.firstChild);

    _mt.bound.mentionClick = function (e) {
        var tag = e.target.closest('.mention-tag');
        if (!tag) return;
        var name = tag.getAttribute('data-name');
        var val = input.value;
        var pos = input.selectionStart || val.length;
        var before = val.substring(0, pos);
        var after = val.substring(pos);
        if (before.length > 0 && before.charAt(before.length - 1) !== ' ') before += ' ';
        input.value = before + '@' + name + ' ' + after;
        input.focus();
    };
    mentionRow.addEventListener('click', _mt.bound.mentionClick);

    function sendMessage() {
        var text = input.value.trim();
        if (!text) return;
        input.value = '';
        var user = room.players.find(function (p) { return p.isUser; });
        addMessage(user ? user.name : '玩家', text);
    }

    _mt.bound.sendClick = sendMessage;
    sendBtn.addEventListener('click', _mt.bound.sendClick);

    _mt.bound.chatKeydown = function (e) {
        if (e.key === 'Enter') sendMessage();
    };
    input.addEventListener('keydown', _mt.bound.chatKeydown);
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

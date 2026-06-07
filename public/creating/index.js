// ── 身份数据 ──

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

// ── 状态 ──

var playerCount = 9;
var selectedRoles = [];
var gameMode = 'beginner';
var modalQty = 1;

// ── DOM ──

var roomNameInput = document.getElementById('room-name');
var playerCountEl = document.getElementById('player-count');
var assignedCountEl = document.getElementById('assigned-count');
var totalCountEl = document.getElementById('total-count');
var roleWarningEl = document.getElementById('role-warning');
var roleListEl = document.getElementById('role-list');
var modeDescEl = document.getElementById('mode-desc');
var modalOverlay = document.getElementById('modal-overlay');
var roleSelect = document.getElementById('role-select');
var roleQtyEl = document.getElementById('role-qty');
var roleDescEl = document.getElementById('role-desc');

// ── 初始化 ──

document.addEventListener('DOMContentLoaded', function () {
    buildRoleSelect();
    bindEvents();
    render();
});

function buildRoleSelect() {
    ROLES.forEach(function (role) {
        var opt = document.createElement('option');
        opt.value = role.id;
        opt.textContent = role.name;
        roleSelect.appendChild(opt);
    });
}

// ── 渲染 ──

function render() {
    playerCountEl.textContent = playerCount;
    totalCountEl.textContent = playerCount;
    renderRoleList();
    updateWarning();
}

function renderRoleList() {
    roleListEl.innerHTML = '';
    selectedRoles.forEach(function (item, index) {
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
        roleListEl.appendChild(row);
    });
}

function getAssignedCount() {
    var total = 0;
    selectedRoles.forEach(function (item) { total += item.qty; });
    return total;
}

function getWolfCount() {
    var wolf = selectedRoles.find(function (r) { return r.id === 'werewolf'; });
    return wolf ? wolf.qty : 0;
}

function updateWarning() {
    var assigned = getAssignedCount();
    assignedCountEl.textContent = assigned;

    var over = assigned > playerCount;
    assignedCountEl.classList.toggle('over', over);

    var warnings = [];
    if (over) {
        warnings.push('身份人数超出房间人数 ' + (assigned - playerCount) + ' 人');
    }
    if (assigned > 0 && getWolfCount() === 0) {
        warnings.push('至少需要一只狼人');
    }

    if (warnings.length > 0) {
        roleWarningEl.textContent = warnings.join('，');
        roleWarningEl.classList.add('visible');
    } else {
        roleWarningEl.textContent = '';
        roleWarningEl.classList.remove('visible');
    }
}

// ── 事件 ──

function bindEvents() {
    // 人数步进
    document.getElementById('player-minus').addEventListener('click', function () {
        if (playerCount > 4) {
            playerCount--;
            render();
        }
    });
    document.getElementById('player-plus').addEventListener('click', function () {
        if (playerCount < 18) {
            playerCount++;
            render();
        }
    });

    // 添加身份
    document.getElementById('btn-add-role').addEventListener('click', function () {
        roleSelect.value = '';
        modalQty = 1;
        roleQtyEl.textContent = modalQty;
        roleDescEl.textContent = '请选择一个身份查看说明';
        modalOverlay.style.display = 'flex';
    });

    // 弹窗 - 身份选择
    roleSelect.addEventListener('change', function () {
        var role = ROLES.find(function (r) { return r.id === roleSelect.value; });
        if (role) {
            var campName = role.camp === 'wolf' ? '狼人阵营' : role.camp === 'good' ? '好人阵营' : '第三方';
            roleDescEl.innerHTML = '<span class="camp-label">' + campName + '</span><br>' + role.desc;
        } else {
            roleDescEl.textContent = '请选择一个身份查看说明';
        }
    });

    // 弹窗 - 数量步进
    document.getElementById('role-qty-minus').addEventListener('click', function () {
        if (modalQty > 1) {
            modalQty--;
            roleQtyEl.textContent = modalQty;
        }
    });
    document.getElementById('role-qty-plus').addEventListener('click', function () {
        if (modalQty < 8) {
            modalQty++;
            roleQtyEl.textContent = modalQty;
        }
    });

    // 弹窗 - 确认
    document.getElementById('modal-confirm').addEventListener('click', function () {
        var roleId = roleSelect.value;
        if (!roleId) {
            toastr.warning('请选择一个身份');
            return;
        }
        var existing = selectedRoles.find(function (r) { return r.id === roleId; });
        if (existing) {
            existing.qty += modalQty;
        } else {
            selectedRoles.push({ id: roleId, qty: modalQty });
        }
        modalOverlay.style.display = 'none';
        render();
        toastr.success('身份已添加');
    });

    // 弹窗 - 取消 / 遮罩关闭
    document.getElementById('modal-cancel').addEventListener('click', function () {
        modalOverlay.style.display = 'none';
    });
    modalOverlay.addEventListener('click', function (e) {
        if (e.target === modalOverlay) {
            modalOverlay.style.display = 'none';
        }
    });

    // 删除身份
    roleListEl.addEventListener('click', function (e) {
        var btn = e.target.closest('.role-item-remove');
        if (!btn) return;
        var index = parseInt(btn.getAttribute('data-index'), 10);
        selectedRoles.splice(index, 1);
        render();
    });

    // 模式切换
    document.getElementById('mode-beginner').addEventListener('click', function () {
        gameMode = 'beginner';
        updateModeUI();
    });
    document.getElementById('mode-expert').addEventListener('click', function () {
        gameMode = 'expert';
        updateModeUI();
    });

    // 返回
    document.getElementById('btn-back').addEventListener('click', function () {
        window.location.href = '/';
    });

    // 开始游戏
    document.getElementById('btn-start').addEventListener('click', function () {
        var name = roomNameInput.value.trim();
        if (!name) {
            toastr.warning('请输入房间名称');
            return;
        }
        var assigned = getAssignedCount();
        if (assigned === 0) {
            toastr.warning('请至少添加一个身份');
            return;
        }
        if (getWolfCount() === 0) {
            toastr.warning('至少需要一只狼人');
            return;
        }
        if (assigned > playerCount) {
            toastr.warning('身份人数超出房间人数，请调整');
            return;
        }
        if (assigned < playerCount) {
            toastr.warning('还有 ' + (playerCount - assigned) + ' 人未分配身份');
            return;
        }
        var config = {
            name: name,
            playerCount: playerCount,
            roles: selectedRoles.map(function (r) { return { id: r.id, qty: r.qty }; }),
            mode: gameMode
        };
        console.log('Room config:', config);
        toastr.success('房间创建成功');
    });
}

function updateModeUI() {
    document.getElementById('mode-beginner').classList.toggle('active', gameMode === 'beginner');
    document.getElementById('mode-expert').classList.toggle('active', gameMode === 'expert');
    modeDescEl.textContent = MODE_DESC[gameMode];
}

let editingRoleId = null;
let currentAvatarBase64 = '';

const DB_NAME = 'werewolf';
const DB_VERSION = 1;
const STORE_NAME = 'roles';

const roleContainer = document.getElementById('role-list-container');
const roleTemplate = document.getElementById('role-item-template').innerHTML;
const roleEmpty = document.getElementById('role-empty');
const createRoleButton = document.getElementById('btn-create');
const syncRoleButton = document.getElementById('btn-sync');
const modalOverlay = document.getElementById('modal-overlay');
const modalSaveButton = document.getElementById('modal-save');
const modalDeleteButton = document.getElementById('modal-delete');
const modalAvatarUpload = document.getElementById('modal-avatar-upload');
const modalAvatarInput = document.getElementById('modal-avatar-input');
const modalAvatarPreview = document.getElementById('modal-avatar-preview');
const modalAvatarPlaceholder = document.querySelector('.modal-avatar-placeholder');
const modalNameInput = document.getElementById('modal-name');
const modalSexInput = document.getElementById('modal-sex');
const modalAgeInput = document.getElementById('modal-age');
const modalDescInput = document.getElementById('modal-desc');
const modalEndpointInput = document.getElementById('modal-endpoint');
const modalKeyInput = document.getElementById('modal-key');
const modalModelInput = document.getElementById('modal-model');
const modalCheckBalanceButton = document.getElementById('modal-check-balance');
const modalGetApiKeyButton = document.getElementById('modal-get-api-key');
const modalTestModelButton = document.getElementById('modal-test-model');

document.addEventListener('DOMContentLoaded', async function () {
    await loadRoles();
    await renderRoleList();
    bindButtonEvents();
});

// ── IndexedDB ──

function openDB() {
    return new Promise(function (resolve, reject) {
        var request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = function (e) {
            var db = e.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        };
        request.onsuccess = function (e) {
            resolve(e.target.result);
        };
        request.onerror = function (e) {
            reject(e.target.error);
        };
    });
}

async function loadRoles() {
    try {
        var db = await openDB();
        return new Promise(function (resolve, reject) {
            var tx = db.transaction(STORE_NAME, 'readonly');
            var store = tx.objectStore(STORE_NAME);
            var request = store.getAll();
            request.onsuccess = function () {
                roleList = request.result || [];
                resolve(roleList);
            };
            request.onerror = function () {
                roleList = [];
                reject(request.error);
            };
        });
    } catch (error) {
        console.error('Failed to load roles:', error);
        roleList = [];
    }
}

async function saveRole(roleData) {
    var db = await openDB();
    return new Promise(function (resolve, reject) {
        var tx = db.transaction(STORE_NAME, 'readwrite');
        var store = tx.objectStore(STORE_NAME);
        var request = store.put(roleData);
        request.onsuccess = function () {
            resolve();
        };
        request.onerror = function () {
            reject(request.error);
        };
    });
}

async function deleteRole(id) {
    var db = await openDB();
    return new Promise(function (resolve, reject) {
        var tx = db.transaction(STORE_NAME, 'readwrite');
        var store = tx.objectStore(STORE_NAME);
        var request = store.delete(id);
        request.onsuccess = function () {
            resolve();
        };
        request.onerror = function () {
            reject(request.error);
        };
    });
}

// ── 工具函数 ──

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0;
        var v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function resetModal() {
    editingRoleId = null;
    currentAvatarBase64 = '';
    modalAvatarPreview.src = '';
    modalAvatarPlaceholder.style.display = 'block';
    modalAvatarInput.value = '';
    modalNameInput.value = '';
    modalSexInput.value = '';
    modalAgeInput.value = '';
    modalDescInput.value = '';
    modalEndpointInput.value = settings.endpointAddress || '';
    modalKeyInput.value = settings.endpointKey || '';
    modalModelInput.value = settings.defaultModel || '';
    modalDeleteButton.disabled = true;
}

// ── 渲染 ──

async function renderRoleList() {
    try {
        roleContainer.innerHTML = '';
        if (roleList.length === 0) {
            return roleContainer.appendChild(roleEmpty);
        }
        for (const role of roleList) {
            var roleElement = document.createElement('div');
            roleElement.innerHTML = roleTemplate;
            roleElement.style.display = 'flex';
            roleElement.setAttribute('id', role.id);
            roleElement.querySelector('.role-item-name').textContent = role.name || '';
            roleElement.querySelector('.role-item-sex').textContent = role.sex || '';
            roleElement.querySelector('.role-item-age').textContent = role.age ? `${role.age}岁` : '';
            roleElement.querySelector('.role-item-desc').textContent = role.desc || '';
            roleElement.querySelector('.role-item-avatar-img').src = role.avatar ? role.avatar : 'https://c-ssl.dtstatic.com/uploads/blog/202303/20/20230320145706_07ca5.thumb.400_0.jpeg';
            roleContainer.appendChild(roleElement);
            roleElement.addEventListener('click', function () {
                editingRoleId = role.id;
                currentAvatarBase64 = role.avatar || '';
                modalAvatarPreview.src = role.avatar || '';
                modalAvatarPlaceholder.style.display = role.avatar ? 'none' : 'block';
                modalNameInput.value = role.name || '';
                modalSexInput.value = role.sex || '';
                modalAgeInput.value = role.age || '';
                modalDescInput.value = role.desc || '';
                modalEndpointInput.value = role.endpoint || '';
                modalKeyInput.value = role.key || '';
                modalModelInput.value = role.model || '';
                modalDeleteButton.disabled = false;
                modalOverlay.style.display = 'flex';
            });
        }
    } catch (error) {
        console.error('Failed to render role list:', error);
    }
}

// ── 事件绑定 ──

function bindButtonEvents() {
    // 创建角色
    createRoleButton.addEventListener('click', function () {
        resetModal();
        modalOverlay.style.display = 'flex';
    });

    // 同步角色
    syncRoleButton.addEventListener('click', function () {
        // TODO
    });

    // 头像上传
    modalAvatarUpload.addEventListener('click', function () {
        modalAvatarInput.click();
    });

    modalAvatarInput.addEventListener('change', function () {
        var file = this.files && this.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function (e) {
            currentAvatarBase64 = e.target.result;
            modalAvatarPreview.src = currentAvatarBase64;
            modalAvatarPlaceholder.style.display = 'none';
        };
        reader.readAsDataURL(file);
    });

    // 保存角色
    modalSaveButton.addEventListener('click', async function () {
        var name = modalNameInput.value.trim();
        if (!name) {
            toastr.warning('请输入角色姓名');
            return;
        }
        var roleData = {
            id: editingRoleId || generateUUID(),
            avatar: currentAvatarBase64,
            name: name,
            sex: modalSexInput.value.trim(),
            age: modalAgeInput.value.trim(),
            desc: modalDescInput.value.trim(),
            endpoint: modalEndpointInput.value.trim() || settings.endpointAddress || '',
            key: modalKeyInput.value.trim() || settings.endpointKey || '',
            model: modalModelInput.value.trim() || settings.defaultModel || ''
        };
        try {
            await saveRole(roleData);
            await loadRoles();
            await renderRoleList();
            modalOverlay.style.display = 'none';
            toastr.success('角色已保存');
        } catch (error) {
            console.error('Failed to save role:', error);
            toastr.error('保存失败');
        }
    });

    // 删除角色
    modalDeleteButton.addEventListener('click', async function () {
        if (!editingRoleId) return;
        try {
            await deleteRole(editingRoleId);
            await loadRoles();
            await renderRoleList();
            modalOverlay.style.display = 'none';
            toastr.success('角色已删除');
        } catch (error) {
            console.error('Failed to delete role:', error);
            toastr.error('删除失败');
        }
    });

    // 测试模型
    modalTestModelButton.addEventListener('click', async function () {
        var endpoint = modalEndpointInput.value.trim() || settings.endpointAddress || '';
        var key = modalKeyInput.value.trim() || settings.endpointKey || '';
        var model = modalModelInput.value.trim() || settings.defaultModel || '';

        if (!endpoint || !key || !model) {
            toastr.warning('请先填写端点地址、密钥和模型名称');
            return;
        }

        modalTestModelButton.disabled = true;
        modalTestModelButton.textContent = '测试中...';

        try {
            var response = await fetch(endpoint + '/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + key
                },
                body: JSON.stringify({
                    model: model,
                    messages: [{ role: 'user', content: '你好' }]
                })
            });

            if (response.ok) {
                var data = await response.json();
                if (data.choices && data.choices.length > 0) {
                    toastr.success('模型连接成功');
                } else {
                    toastr.warning('收到响应但格式异常');
                }
            } else {
                var errorText = await response.text().catch(function () { return ''; });
                toastr.error('请求失败 (' + response.status + ')');
                console.error('Test model error:', response.status, errorText);
            }
        } catch (error) {
            toastr.error('连接失败，请检查端点地址');
            console.error('Test model error:', error);
        } finally {
            modalTestModelButton.disabled = false;
            modalTestModelButton.textContent = '测试模型';
        }
    });

    // 点击遮罩关闭
    modalOverlay.addEventListener('click', function (e) {
        if (e.target === modalOverlay) {
            modalOverlay.style.display = 'none';
        }
    });



}

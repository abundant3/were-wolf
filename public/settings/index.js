const backgroundAudio = document.getElementById('background-audio');
const backgroundAudioValue = document.getElementById('background-audio-value');
const soundEffectAudio = document.getElementById('sound-effect-audio');
const soundEffectAudioValue = document.getElementById('sound-effect-audio-value');
const notificationAudio = document.getElementById('notification-audio');
const notificationAudioValue = document.getElementById('notification-audio-value');
const endpointAddress = document.getElementById('endpoint-address');
const endpointKey = document.getElementById('endpoint-key');
const defaultModel = document.getElementById('default-model');
const checkBalance = document.getElementById('check-balance');
const getAPIKey = document.getElementById('get-api-key');
const testModel = document.getElementById('test-model');

document.addEventListener('DOMContentLoaded', async function () {
    await loadSettings();
    await configureSettings();
    await bindSettingsEvents();
});

async function configureSettings() {
    endpointAddress.value = settings.endpointAddress;
    endpointKey.value = settings.endpointKey;
    defaultModel.value = settings.defaultModel;
    backgroundAudio.value = settings.backgroundAudio * 100;
    backgroundAudioValue.textContent = Math.round(settings.backgroundAudio * 100);
    soundEffectAudio.value = settings.soundEffectAudio * 100;
    soundEffectAudioValue.textContent = Math.round(settings.soundEffectAudio * 100);
    notificationAudio.value = settings.notificationAudio * 100;
    notificationAudioValue.textContent = Math.round(settings.notificationAudio * 100);

    endpointAddress.addEventListener('change', async function () {
        settings.endpointAddress = endpointAddress.value.trim();
        await saveSettings();
    });
    endpointKey.addEventListener('change', async function () {
        settings.endpointKey = endpointKey.value.trim();
        await saveSettings();
    });
    defaultModel.addEventListener('change', async function () {
        settings.defaultModel = defaultModel.value.trim();
        await saveSettings();
    });
    backgroundAudio.addEventListener('input', async function () {
        settings.backgroundAudio = backgroundAudio.value / 100;
        backgroundAudioValue.textContent = backgroundAudio.value;
        await saveSettings();
        await playBackgroundAudio();
    });
    soundEffectAudio.addEventListener('input', async function () {
        settings.soundEffectAudio = soundEffectAudio.value / 100;
        soundEffectAudioValue.textContent = soundEffectAudio.value;
        await saveSettings();
    });
    notificationAudio.addEventListener('input', async function () {
        settings.notificationAudio = notificationAudio.value / 100;
        notificationAudioValue.textContent = notificationAudio.value;
        await saveSettings();
    });

}

async function bindSettingsEvents() {
    checkBalance.addEventListener('click', async function () { });
    getAPIKey.addEventListener('click', async function () { });
    testModel.addEventListener('click', async function () {
        try {
            const apiUrl = settings.endpointAddress + '/v1/chat/completions';
            const headers = {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + settings.endpointKey
            };
            const request = {
                model: settings.defaultModel,
                messages: [
                    { role: 'system', content: '现在需要对模型进行测试，无论用户输入什么内容，你都只需要回复"收到，已接受到测试请求"' },
                    { role: 'user', content: '你好啊' }
                ]
            };
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(request)
            });
            if (!response.ok) {
                toastr.error('请求失败，状态码：' + response.status);
                return;
            }
            const data = await response.json();
            if (data.choices && data.choices.length > 0) {
                const reply = data.choices[0].message.content;
                if (reply.includes('收到，已接受到测试请求')) {
                    toastr.success('模型测试成功！');
                } else {
                    toastr.error('模型测试失败，回复内容不正确');
                }
            } else {
                toastr.error('模型响应格式异常');
            }
        } catch (error) {
            toastr.error('请求出错：' + error.message);
        }
    });
}
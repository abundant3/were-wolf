document.addEventListener('DOMContentLoaded', async function () {
    await loadSettings();
    await configureSettings();
});

async function configureSettings() {
    const backgroundAudio = document.getElementById('background-audio');
    const backgroundAudioValue = document.getElementById('background-audio-value');
    const soundEffectAudio = document.getElementById('sound-effect-audio');
    const soundEffectAudioValue = document.getElementById('sound-effect-audio-value');
    const notificationAudio = document.getElementById('notification-audio');
    const notificationAudioValue = document.getElementById('notification-audio-value');

    backgroundAudio.value = settings.backgroundAudio * 100;
    backgroundAudioValue.textContent = Math.round(settings.backgroundAudio * 100);
    soundEffectAudio.value = settings.soundEffectAudio * 100;
    soundEffectAudioValue.textContent = Math.round(settings.soundEffectAudio * 100);
    notificationAudio.value = settings.notificationAudio * 100;
    notificationAudioValue.textContent = Math.round(settings.notificationAudio * 100);

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
        await playBackgroundAudio();
    });
    notificationAudio.addEventListener('input', async function () {
        settings.notificationAudio = notificationAudio.value / 100;
        notificationAudioValue.textContent = notificationAudio.value;
        await saveSettings();
        await playBackgroundAudio();
    });

}
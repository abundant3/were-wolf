document.addEventListener('DOMContentLoaded', async function () {
    await bindEvents();
});

async function bindEvents() {
    const buttons = document.querySelectorAll('.switch-control-button');
    buttons.forEach(button => {
        button.addEventListener('click', async function () {
            window.location.href = `/${button.getAttribute('data-action')}`;
        });
    });
};
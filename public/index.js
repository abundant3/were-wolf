document.addEventListener('DOMContentLoaded', async function () {
    await bindButtons();
});

async function bindButtons() {
    const buttons = document.querySelectorAll('.switch-control-button');
    buttons.forEach(button => {
        button.addEventListener('click', () => {
            const action = button.getAttribute('data-action');
            window.location.href = `/${action}`;
        });
    });
}
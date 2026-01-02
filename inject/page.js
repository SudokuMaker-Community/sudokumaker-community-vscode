(function () {
    'use strict';

    window.addEventListener("message", e => {
        const msg = e.data;
        const event = new KeyboardEvent(msg.type, {
            ...msg.e,
            bubbles: true,
            // cancelable: true,
            // composed: true,
        });
        window.dispatchEvent(event);
    });
})();
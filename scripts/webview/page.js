(function () {
    'use strict';

    window.addEventListener("message", e => {
        const { type, data } = e.data;

        if (type === "key") {
            const event = new KeyboardEvent(
                data.eventType,
                {
                    ...data.event,
                    bubbles: true,
                }
            );
            window.dispatchEvent(event);
        }
    });

    window.addEventListener("DOMContentLoaded", () => {
        const frame = document.getElementById("sudokumaker-frame");

        window.addEventListener("message", e => {
            const { type, data } = e.data;

            if (e.source === frame.contentWindow) {
                if (type === "save") {
                    window.postMessage({
                        type, data
                    }, "*");
                }
            } else {
                if (type === "load") {
                    frame.contentWindow.postMessage({
                        type, data
                    }, "*");
                }
            }
        });
    });
})();
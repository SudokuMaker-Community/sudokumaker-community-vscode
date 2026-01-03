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
})();
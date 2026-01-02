(function () {
    'use strict';

    function serializeKeyboardEvent(e) {
        return {
            type: e.type,
            key: e.key,
            code: e.code,
            keyCode: e.keyCode,
            location: e.location,

            ctrlKey: e.ctrlKey,
            shiftKey: e.shiftKey,
            altKey: e.altKey,
            metaKey: e.metaKey,

            repeat: e.repeat,
            isComposing: e.isComposing,

            timeStamp: e.timeStamp,
        };
    }

    function isMappedKey(e) {
        const key = e.key?.toLowerCase();
        const ctrl = e.ctrlKey;
        const shift = e.shiftKey;
        const alt = e.altKey;
        const meta = e.metaKey;
        return (
            (!ctrl && !alt && !meta && !(key?.startsWith("f") && key !== "f"))
            || (!alt && !meta && (
                (ctrl && !shift && key === "a")
                || (ctrl && key === "z")
                || (ctrl && !shift && key === "y")
                || (ctrl && !shift && key === "x")
            ))
            || (key?.startsWith("arrow"))
            || (key === "escape")
        );
    }

    for (const eventType of ["keydown", "keyup", "keypress"]) {

        window.addEventListener(eventType, (e) => {
            if (isMappedKey(e)) {
                console.log("Key is Mapped: ", e);
                return;
            }
            console.log("Key not Mapped: ", e);
            window.parent.postMessage({ type: eventType, e: serializeKeyboardEvent(e) }, "*");
            e.stopPropagation();
        }, { capture: true, passive: false });

    }
})();
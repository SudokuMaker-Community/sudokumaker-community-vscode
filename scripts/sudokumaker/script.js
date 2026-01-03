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
                || (ctrl && key === " ")
                || (ctrl && !shift && key === "y")
                || (ctrl && !shift && key === "x")
            ))
            || (!meta && (
                (key?.startsWith("arrow"))
                || (key === "escape")
                || (key === "enter")
                || (key === "backspace")
                || (key === "delete")
                || (key === "insert")
                || (key === "home")
                || (key === "end")
                || (key === "pageup")
                || (key === "pagedown")
                || (key === "insert")
            ))
            || (key === "alt")
            || (key === "control")
            || (key === "shift")
            || (key === "altgraph")
        );
    }

    function registerKeyHandlers() {
        for (const eventType of ["keydown", "keyup", "keypress"]) {

            window.addEventListener(eventType, (e) => {
                if (isMappedKey(e)) {
                    console.log("Key is Mapped: ", e);
                    return;
                }
                console.log("Key not Mapped: ", e);
                window.parent.postMessage({
                    type: "key",
                    data: {
                        eventType: eventType,
                        event: serializeKeyboardEvent(e),
                    },
                }, "*");
                e.stopPropagation();
            }, { capture: true, passive: false });

        }
    }

    registerKeyHandlers();
})();
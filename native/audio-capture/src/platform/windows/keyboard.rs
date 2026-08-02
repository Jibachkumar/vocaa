use windows::Win32::UI::Input::KeyboardAndMouse::{
    SendInput, INPUT, INPUT_0, INPUT_KEYBOARD, KEYBDINPUT, KEYEVENTF_UNICODE,
    KEYEVENTF_KEYUP,
};

pub fn type_text(text: &str) {
    for ch in text.encode_utf16() {
        unsafe {
            // Key down
            let down = INPUT {
                r#type: INPUT_KEYBOARD,
                Anonymous: INPUT_0 {
                    ki: KEYBDINPUT {
                        wVk: Default::default(),
                        wScan: ch,
                        dwFlags: KEYEVENTF_UNICODE,
                        time: 0,
                        dwExtraInfo: 0,
                    },
                },
            };

            // Key up
            let up = INPUT {
                r#type: INPUT_KEYBOARD,
                Anonymous: INPUT_0 {
                    ki: KEYBDINPUT {
                        wVk: Default::default(),
                        wScan: ch,
                        dwFlags: KEYEVENTF_UNICODE | KEYEVENTF_KEYUP,
                        time: 0,
                        dwExtraInfo: 0,
                    },
                },
            };

            let inputs = [down, up];

            SendInput(
                &inputs,
                std::mem::size_of::<INPUT>() as i32,
            );
        }
    }
}
use windows::Win32::UI::Input::KeyboardAndMouse::{
    SendInput, INPUT, INPUT_0, INPUT_KEYBOARD, KEYBDINPUT, KEYEVENTF_UNICODE,
    KEYEVENTF_KEYUP,
};

use windows::Win32::UI::WindowsAndMessaging::{
    GetForegroundWindow,
    GetWindowTextW,
};

pub fn inject_text(text: &str) {

     unsafe {
        let hwnd = GetForegroundWindow();

        let mut buffer = [0u16; 256];

        let len = GetWindowTextW(hwnd, &mut buffer);

        let title = String::from_utf16_lossy(&buffer[..len as usize]);

        println!("Foreground Window: {}", title);
    }

    println!("Typing: {:?}", text);

    let mut inputs = Vec::with_capacity(text.encode_utf16().count() * 2);

    for ch in text.encode_utf16() {
        inputs.push(INPUT {
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
        });

        inputs.push(INPUT {
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
        });
    }

    unsafe {
        let sent = SendInput(
            &inputs,
            std::mem::size_of::<INPUT>() as i32,
        );

        println!(
            "Requested {} INPUTs, Windows accepted {}",
            inputs.len(),
            sent
        );
    }
}

use windows::Win32::Foundation::{
    HWND,
    LPARAM,
    WPARAM,
};

use windows::Win32::UI::Controls::{
    EM_REPLACESEL,
    EM_SETSEL,
};
use windows::Win32::UI::WindowsAndMessaging::SendMessageW;

pub fn replace_edit_text(
    hwnd: HWND,
    text: &str,
) {
    let append = format!("{}\r\n", text);

    let wide: Vec<u16> = append
        .encode_utf16()
        .chain(std::iter::once(0))
        .collect();

    unsafe {
        // Move caret to end
        SendMessageW(
            hwnd,
            EM_SETSEL,
            WPARAM(usize::MAX),
            LPARAM(-1),
        );

        // Insert text
        SendMessageW(
            hwnd,
            EM_REPLACESEL,
            WPARAM(1),
            LPARAM(wide.as_ptr() as isize),
        );
    }

    println!("EM_SETSEL + EM_REPLACESEL sent.");
}
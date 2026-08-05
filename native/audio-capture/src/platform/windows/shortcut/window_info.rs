use windows::Win32::Foundation::{
    HWND,
    LPARAM,
};
use windows::Win32::UI::WindowsAndMessaging::{
    GetForegroundWindow,
    GetClassNameW,
    GetWindowThreadProcessId,
};

use windows::Win32::System::ProcessStatus::K32GetModuleBaseNameW;
use windows::Win32::System::Threading::{
    OpenProcess,
    PROCESS_QUERY_INFORMATION,
    PROCESS_VM_READ,
};

use windows::Win32::UI::WindowsAndMessaging::{
    EnumChildWindows,
};

use std::sync::{Mutex, OnceLock};

static FOUND_EDIT: OnceLock<Mutex<Option<EditTarget>>> = OnceLock::new();

fn found_edit() -> &'static Mutex<Option<EditTarget>> {
    FOUND_EDIT.get_or_init(|| Mutex::new(None))
}

fn is_supported_edit(class: &str) -> bool {
    matches!(
        class,
        "Edit"
            | "RichEdit20W"
            | "RichEdit50W"
            | "RichEditD2DPT"
    )
}

#[derive(Clone)]
pub struct EditTarget {
    pub hwnd: HWND,
    pub class_name: String,
}

pub struct WindowInfo {
    pub process_name: String,
    pub class_name: String,
}

unsafe extern "system" fn enum_proc(
    hwnd: HWND,
    _: LPARAM,
) -> windows::Win32::Foundation::BOOL {

    let mut buffer = [0u16; 256];

    let len = unsafe {
        GetClassNameW(hwnd, &mut buffer)
    };

    let class_name =
        String::from_utf16_lossy(&buffer[..len as usize]);

    println!(
        "Child HWND: {:?}  Class: {}",
        hwnd,
        class_name
    );

    if is_supported_edit(&class_name) {
        println!("FOUND EDIT TARGET -> {:?}", hwnd);

        *found_edit().lock().unwrap() = Some(EditTarget {
            hwnd,
            class_name: class_name.clone(),
        });

        return false.into(); // stop enumeration
    }

    true.into()
}


pub fn get_foreground_window_info() -> WindowInfo {
    unsafe {
        let hwnd: HWND = GetForegroundWindow();

        // -----------------------
        // Window class
        // -----------------------
        let mut class_buf = [0u16; 256];

        let class_len = GetClassNameW(hwnd, &mut class_buf);

        let class_name =
            String::from_utf16_lossy(&class_buf[..class_len as usize]);

        // -----------------------
        // Process
        // -----------------------
        let mut pid = 0;

        GetWindowThreadProcessId(hwnd, Some(&mut pid));

        let process =
            OpenProcess(
                PROCESS_QUERY_INFORMATION | PROCESS_VM_READ,
                false,
                pid,
            );

        let mut process_buf = [0u16; 260];

        let process_name = if let Ok(handle) = process {
            let len = K32GetModuleBaseNameW(
                handle,
                None,
                &mut process_buf,
            );

            String::from_utf16_lossy(&process_buf[..len as usize])
        } else {
            String::new()
        };

        WindowInfo {
            process_name,
            class_name,
        }
    }
}

pub fn find_edit_target() -> Option<EditTarget> {

   *found_edit().lock().unwrap() = None;

    unsafe {
        let hwnd = GetForegroundWindow();

        EnumChildWindows(
            hwnd,
            Some(enum_proc),
            LPARAM(0),
        );
    }

    found_edit().lock().unwrap().clone()
}

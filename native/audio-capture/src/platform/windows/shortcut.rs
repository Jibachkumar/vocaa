use napi::Result;
use std::thread;

use windows::Win32::Foundation::{HINSTANCE, HWND, LPARAM, LRESULT, WPARAM};
use windows::Win32::System::LibraryLoader::GetModuleHandleW;

use windows::Win32::UI::WindowsAndMessaging::{
    CallNextHookEx,
    DispatchMessageW,
    GetMessageW,
    HHOOK,
    KBDLLHOOKSTRUCT,
    MSG,
    SetWindowsHookExW,
    TranslateMessage,
    WH_KEYBOARD_LL,
};

use std::sync::{Mutex, OnceLock};

static KEYBOARD_HOOK: OnceLock<Mutex<Option<HHOOK>>> = OnceLock::new();

use std::sync::atomic::{AtomicBool, AtomicI32, Ordering};

static CTRL_DOWN: AtomicBool = AtomicBool::new(false);
static SHIFT_DOWN: AtomicBool = AtomicBool::new(false);
static SPACE_DOWN: AtomicBool = AtomicBool::new(false);
static SHORTCUT_ACTIVE: AtomicBool = AtomicBool::new(false);

const EVENT_NONE: i32 = 0;
const EVENT_PRESSED: i32 = 1;
const EVENT_RELEASED: i32 = 2;

static LAST_EVENT: AtomicI32 = AtomicI32::new(EVENT_NONE);

static REGISTERED: AtomicBool = AtomicBool::new(false);


unsafe extern "system" fn keyboard_proc(
    code: i32,
    wparam: WPARAM,
    lparam: LPARAM,
) -> LRESULT {
    if code >= 0 {
        let keyboard = unsafe {
            *(lparam.0 as *const KBDLLHOOKSTRUCT)
        };

        let key_up = (keyboard.flags.0 & 0x80) != 0;

        match keyboard.vkCode {
            162 | 163 => {
                CTRL_DOWN.store(!key_up, Ordering::Relaxed);
            }
            160 | 161 => {
                SHIFT_DOWN.store(!key_up, Ordering::Relaxed);
            }
            32 => {
                SPACE_DOWN.store(!key_up, Ordering::Relaxed);
            }
            _ => {}
        }

        let pressed =
            CTRL_DOWN.load(Ordering::Relaxed)
                && SHIFT_DOWN.load(Ordering::Relaxed)
                && SPACE_DOWN.load(Ordering::Relaxed);

        if pressed && !SHORTCUT_ACTIVE.load(Ordering::Relaxed) {
            SHORTCUT_ACTIVE.store(true, Ordering::Relaxed);

            LAST_EVENT.store(EVENT_PRESSED, Ordering::Relaxed);

            println!("SHORTCUT PRESSED");
        }

        if !pressed && SHORTCUT_ACTIVE.load(Ordering::Relaxed) {
            SHORTCUT_ACTIVE.store(false, Ordering::Relaxed);

            LAST_EVENT.store(EVENT_RELEASED, Ordering::Relaxed);

            println!("SHORTCUT RELEASED");
        }
    }

    unsafe {
        CallNextHookEx(
            None,
            code,
            wparam,
            lparam,
        )
    }
}


fn install_hook() -> Result<()> {
    unsafe {
        let module = GetModuleHandleW(None)
            .map_err(|e| napi::Error::from_reason(e.to_string()))?;

        let hook = SetWindowsHookExW(
            WH_KEYBOARD_LL,
            Some(keyboard_proc),
            HINSTANCE(module.0),
            0,
        ).map_err(|e| napi::Error::from_reason(e.to_string()))?;


        KEYBOARD_HOOK
            .get_or_init(|| Mutex::new(None))
            .lock()
            .unwrap()
            .replace(hook);

        #[cfg(debug_assertions)]    
        println!("Keyboard hook installed.");
    }

    Ok(())
}

pub fn register_shortcut() -> Result<()> {
     if REGISTERED.swap(true, Ordering::Relaxed) {
        return Ok(());
    }

    thread::spawn(|| {
        println!("Shortcut thread started.");

        if let Err(err) = install_hook() {
            eprintln!("Hook installation failed: {}", err);
            return;
        }

        unsafe {
            let mut msg = MSG::default();

            println!("Message loop running...");

            while GetMessageW(&mut msg, HWND(0), 0, 0).into() {
                TranslateMessage(&msg);
                DispatchMessageW(&msg);
            }

            println!("Message loop exited.");
        }
    });

    println!("register_shortcut() returned.");

    Ok(())
}

pub fn take_shortcut_event() -> i32 {
    LAST_EVENT.swap(EVENT_NONE, Ordering::Relaxed)
}
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

static KEYBOARD_HOOK: OnceLock<Mutex<Option<HHOOK>>> = OnceLock::new();

use std::sync::atomic::{AtomicBool, Ordering};

static REGISTERED: AtomicBool = AtomicBool::new(false);

use std::sync::{Mutex, OnceLock};


#[derive(Clone, Copy, PartialEq, Eq)]
enum ShortcutEvent {
    None,
    Pressed,
    Released,
    Cancelled,
}

#[derive(Default)]
struct ShortcutState {
    ctrl: bool,
    shift: bool,
    space: bool,

    active: bool,

    last_event: ShortcutEvent,
}

static STATE: OnceLock<Mutex<ShortcutState>> = OnceLock::new();

impl Default for ShortcutEvent {
    fn default() -> Self {
        ShortcutEvent::None
    }
}


fn state() -> &'static Mutex<ShortcutState> {
    STATE.get_or_init(|| {
        Mutex::new(ShortcutState::default())
    })
}

unsafe extern "system" fn keyboard_proc(
    code: i32,
    wparam: WPARAM,
    lparam: LPARAM,
) -> LRESULT {
    if code >= 0 {
        let keyboard = unsafe { &*(lparam.0 as *const KBDLLHOOKSTRUCT) };

        let key_up = (keyboard.flags.0 & 0x80) != 0;

        let mut state = state().lock().unwrap();

        match keyboard.vkCode {
            162 | 163 => state.ctrl = !key_up,
            160 | 161 => state.shift = !key_up,
            32 => state.space = !key_up,
            27 => {
                if !key_up && state.active {
                    state.active = false;
                    state.last_event = ShortcutEvent::Cancelled;
                    println!("SHORTCUT CANCELLED");

                    return LRESULT(1);
                }
            }
            _ => {}
        }

        let pressed = state.ctrl && state.shift && state.space;

        if pressed && !state.active {
            state.active = true;
            state.last_event = ShortcutEvent::Pressed;

            println!("SHORTCUT PRESSED");
        }

        if !pressed && state.active {
            state.active = false;
            state.last_event = ShortcutEvent::Released;

            println!("SHORTCUT RELEASED");
        }

        let shortcut_key = matches!(
            keyboard.vkCode,
            32 | 160 | 161 | 162 | 163
        );

        if shortcut_key && (pressed || state.active) {
            return LRESULT(1);
        }
    }

    unsafe {
        CallNextHookEx(None, code, wparam, lparam)
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
        #[cfg(debug_assertions)]
        println!("Shortcut thread started.");

        if let Err(err) = install_hook() {
            println!("Hook installation failed: {}", err);
            return;
        }

        unsafe {
            let mut msg = MSG::default();

            #[cfg(debug_assertions)]
            println!("Message loop running...");

            while GetMessageW(&mut msg, HWND(0), 0, 0).into() {
                TranslateMessage(&msg);
                DispatchMessageW(&msg);
            }

            #[cfg(debug_assertions)]
            println!("Message loop exited.");
        }
    });

    #[cfg(debug_assertions)]
    println!("register_shortcut() returned.");

    Ok(())
}

pub fn take_shortcut_event() -> i32 {
    let mut state = state().lock().unwrap();

    let event = state.last_event;

    state.last_event = ShortcutEvent::None;

    match event {
        ShortcutEvent::None => 0,
        ShortcutEvent::Pressed => 1,
        ShortcutEvent::Released => 2,
        ShortcutEvent::Cancelled => 3,
    }
}
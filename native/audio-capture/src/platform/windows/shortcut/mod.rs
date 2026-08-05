mod shortcut_manager;
pub mod window_info;

pub use shortcut_manager::{
    register_shortcut,
    take_shortcut_event,
};

pub use window_info::{
    get_foreground_window_info,
    find_edit_target,
};
use std::sync::Arc;
use std::sync::atomic::AtomicBool;
use std::sync::mpsc::Sender;

/// Unified cross-platform installation and environment adaptation interface
pub trait PlatformAdapter {
    // Environment detection hooks
    fn detect_node(&self) -> Option<String>;
    fn detect_npm(&self) -> Option<String>;
    fn detect_git(&self) -> Option<String>;
    fn detect_powershell_or_shell(&self) -> Option<String>;
    fn get_execution_policy_or_status(&self) -> String;
    fn is_node_version_valid(&self) -> bool;

    // Node.js Setup
    fn install_node(
        &self,
        install_path: &str,
        progress_tx: Sender<f32>,
        log_tx: Sender<String>,
        cancel_flag: Arc<AtomicBool>,
    ) -> Result<String, String>; // Returns the node install directory

    // NPM and Claude CLI Setup
    fn set_npm_registry(&self, registry_url: &str) -> Result<(), String>;
    fn fix_execution_policy(&self) -> Result<(), String>;
    fn install_claude_code(
        &self,
        prefix_path: &str,
        log_tx: Sender<String>,
        cancel_flag: Arc<AtomicBool>,
    ) -> Result<(), String>;

    // Configuration, PATH and Shortcuts
    fn configure_claude_settings(
        &self,
        config_custom_api_url: &str,
        config_api_key: &str,
        target_base_url: &str,
    ) -> Result<(), String>;
    fn add_to_path(&self, target_path: &str) -> Result<(), String>;
    fn create_desktop_shortcut(&self) -> Result<(), String>;

    // Uninstallation and cleanup
    fn uninstall_node(&self, log_tx: Sender<String>) -> Result<(), String>;
    fn uninstall_claude_code(&self, log_tx: Sender<String>) -> Result<(), String>;
}

// Sub-modules declared for platform implementations
pub mod windows;
pub mod macos;
pub mod linux;

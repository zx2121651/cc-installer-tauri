use std::sync::Arc;
use std::sync::atomic::AtomicBool;
use std::sync::mpsc::Sender;
use crate::adapters::PlatformAdapter;
use crate::utils;

pub struct WindowsAdapter;

impl PlatformAdapter for WindowsAdapter {
    fn detect_node(&self) -> Option<String> {
        utils::detect_node()
    }

    fn detect_npm(&self) -> Option<String> {
        utils::detect_npm()
    }

    fn detect_git(&self) -> Option<String> {
        utils::detect_git()
    }

    fn detect_powershell_or_shell(&self) -> Option<String> {
        utils::detect_powershell()
    }

    fn get_execution_policy_or_status(&self) -> String {
        utils::get_powershell_execution_policy()
    }

    fn is_node_version_valid(&self) -> bool {
        utils::is_node_version_valid()
    }

    fn install_node(
        &self,
        install_path: &str,
        progress_tx: Sender<f32>,
        log_tx: Sender<String>,
        cancel_flag: Arc<AtomicBool>,
    ) -> Result<String, String> {
        let temp_dir = std::env::temp_dir();
        let msi_path = temp_dir.join("node-v20.18.0-x64.msi");

        let _ = log_tx.send("🔍 正在从快速镜像站下载 Node.js (约 30MB)...\n".to_string());
        utils::download_nodejs(&msi_path, progress_tx, cancel_flag.clone())?;

        // Determine custom installation directory for Node.js
        let node_install_dir = if install_path.len() >= 2 && &install_path[1..3] == ":\\" {
            let drive = &install_path[0..1];
            format!("{}:\\Program Files\\nodejs", drive)
        } else {
            "C:\\Program Files\\nodejs".to_string()
        };

        let _ = log_tx.send("🔧 正在执行 Node.js 静默安装 (默认路径 C:\\Program Files\\nodejs)...\n".to_string());
        utils::run_nodejs_installer(&msi_path, None)?;

        let _ = std::fs::remove_file(&msi_path);
        Ok("C:\\Program Files\\nodejs".to_string())
    }

    fn set_npm_registry(&self, registry_url: &str) -> Result<(), String> {
        utils::set_npm_registry(registry_url).map(|_| ())
    }

    fn fix_execution_policy(&self) -> Result<(), String> {
        if utils::fix_powershell_execution_policy() {
            Ok(())
        } else {
            Err("无法自动修改 PowerShell 执行策略，请尝试以管理员身份运行。".to_string())
        }
    }

    fn install_claude_code(
        &self,
        prefix_path: &str,
        log_tx: Sender<String>,
        cancel_flag: Arc<AtomicBool>,
    ) -> Result<(), String> {
        utils::install_claude_code_with_prefix(log_tx, cancel_flag, prefix_path)
    }

    fn configure_claude_settings(
        &self,
        _config_custom_api_url: &str,
        config_api_key: &str,
        target_base_url: &str,
    ) -> Result<(), String> {
        utils::configure_claude_settings(
            target_base_url,
            config_api_key,
            "",
            true, // always_thinking
            1024, // max_thinking_tokens
            false, // disable_auto_compact
            4096, // max_output_tokens
            8192, // max_context_length
            true, // enable_auto_updater
            "", // http_proxy
            "", // no_proxy
            true, // auto_accept_edits
            "light", // theme
        )
    }

    fn add_to_path(&self, target_path: &str) -> Result<(), String> {
        if utils::add_to_user_path(target_path) {
            Ok(())
        } else {
            Err("无法将路径写入系统/用户环境变量，请尝试手动配置。".to_string())
        }
    }

    fn create_desktop_shortcut(&self) -> Result<(), String> {
        if utils::create_desktop_shortcut() {
            Ok(())
        } else {
            Err("创建桌面快捷方式失败。".to_string())
        }
    }

    fn uninstall_node(&self, log_tx: Sender<String>) -> Result<(), String> {
        // Run the complex multi-layer Windows uninstallation logic in utils.rs
        utils::uninstall_nodejs(log_tx);
        Ok(())
    }

    fn uninstall_claude_code(&self, log_tx: Sender<String>) -> Result<(), String> {
        // Claude Code CLI is uninstalled globally via npm uninstall
        let mut cmd = std::process::Command::new("cmd");
        cmd.args(["/c", "npm uninstall -g @anthropic-ai/claude-code"]);
        #[cfg(target_os = "windows")]
        {
            use std::os::windows::process::CommandExt;
            cmd.creation_flags(0x08000000); // CREATE_NO_WINDOW
        }
        
        let _ = log_tx.send("🧹 正在通过 npm 卸载全局 Claude Code...\n".to_string());
        let status = cmd.status().map_err(|e| format!("启动 npm 卸载进程失败: {}", e))?;
        if status.success() {
            let _ = log_tx.send("✅ 已通过 npm 成功卸载 Claude Code CLI。\n".to_string());
            Ok(())
        } else {
            let _ = log_tx.send("⚠️ npm 卸载退出码异常，尝试物理强制清理目录...\n".to_string());
            // Physical fallback
            if let Ok(appdata) = std::env::var("APPDATA") {
                let node_modules = std::path::Path::new(&appdata).join("npm").join("node_modules").join("@anthropic-ai");
                if node_modules.exists() {
                    let _ = std::fs::remove_dir_all(node_modules);
                }
                let bin_file = std::path::Path::new(&appdata).join("npm").join("claude");
                let bin_cmd = std::path::Path::new(&appdata).join("npm").join("claude.cmd");
                let bin_ps1 = std::path::Path::new(&appdata).join("npm").join("claude.ps1");
                let _ = std::fs::remove_file(bin_file);
                let _ = std::fs::remove_file(bin_cmd);
                let _ = std::fs::remove_file(bin_ps1);
            }
            Ok(())
        }
    }
}

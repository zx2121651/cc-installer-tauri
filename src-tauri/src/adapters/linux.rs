use std::sync::Arc;
use std::sync::atomic::AtomicBool;
use std::sync::mpsc::Sender;
use crate::adapters::PlatformAdapter;

pub struct LinuxAdapter;

impl PlatformAdapter for LinuxAdapter {
    fn detect_node(&self) -> Option<String> {
        let output = std::process::Command::new("node").arg("-v").output().ok();
        output.and_then(|out| {
            if out.status.success() {
                let version = String::from_utf8_lossy(&out.stdout).trim().to_string();
                if !version.is_empty() { Some(version) } else { None }
            } else {
                None
            }
        })
    }

    fn detect_npm(&self) -> Option<String> {
        let output = std::process::Command::new("npm").arg("-v").output().ok();
        output.and_then(|out| {
            if out.status.success() {
                let version = String::from_utf8_lossy(&out.stdout).trim().to_string();
                if !version.is_empty() { Some(version) } else { None }
            } else {
                None
            }
        })
    }

    fn detect_git(&self) -> Option<String> {
        let output = std::process::Command::new("git").arg("--version").output().ok();
        output.and_then(|out| {
            if out.status.success() {
                let version = String::from_utf8_lossy(&out.stdout).trim().to_string();
                let version = version.strip_prefix("git version ").unwrap_or(&version).to_string();
                if !version.is_empty() { Some(version) } else { None }
            } else {
                None
            }
        })
    }

    fn detect_powershell_or_shell(&self) -> Option<String> {
        if let Ok(shell) = std::env::var("SHELL") {
            Some(shell)
        } else {
            Some("/bin/bash".to_string())
        }
    }

    fn get_execution_policy_or_status(&self) -> String {
        "N/A (Linux)".to_string()
    }

    fn is_node_version_valid(&self) -> bool {
        if let Some(v_str) = self.detect_node() {
            let cleaned = v_str.trim().trim_start_matches('v');
            if let Some(first_part) = cleaned.split('.').next() {
                if let Ok(major) = first_part.parse::<i32>() {
                    return major >= 18;
                }
            }
        }
        false
    }

    fn install_node(
        &self,
        install_path: &str,
        _progress_tx: Sender<f32>,
        log_tx: Sender<String>,
        _cancel_flag: Arc<AtomicBool>,
    ) -> Result<String, String> {
        let _ = log_tx.send("🐧 检测到 Linux 平台。正在准备安装 Node.js...\n".to_string());
        
        let target_dir = if install_path.is_empty() {
            format!("{}/.local/share/nodejs", std::env::var("HOME").unwrap_or_default())
        } else {
            install_path.to_string()
        };
        Ok(target_dir)
    }

    fn set_npm_registry(&self, registry_url: &str) -> Result<(), String> {
        let mut cmd = std::process::Command::new("npm");
        cmd.args(["config", "set", "registry", registry_url]);
        let status = cmd.status().map_err(|e| format!("配置镜像源失败: {}", e))?;
        if status.success() { Ok(()) } else { Err("NPM registry config returned non-zero code".to_string()) }
    }

    fn fix_execution_policy(&self) -> Result<(), String> {
        Ok(())
    }

    fn install_claude_code(
        &self,
        prefix_path: &str,
        log_tx: Sender<String>,
        _cancel_flag: Arc<AtomicBool>,
    ) -> Result<(), String> {
        let _ = log_tx.send("⏳ 正在通过 npm 全局安装 @anthropic-ai/claude-code...\n".to_string());
        let mut cmd = std::process::Command::new("npm");
        if prefix_path.is_empty() {
            cmd.args(["install", "-g", "@anthropic-ai/claude-code", "--allow-scripts"]);
        } else {
            cmd.args(["install", "-g", "@anthropic-ai/claude-code", "--prefix", prefix_path, "--allow-scripts"]);
        }
        let status = cmd.status().map_err(|e| format!("启动 npm 进程失败: {}", e))?;
        if status.success() {
            let _ = log_tx.send("✅ Claude Code CLI 安装完成！\n".to_string());
            Ok(())
        } else {
            Err("npm install 退出码异常".to_string())
        }
    }

    fn configure_claude_settings(
        &self,
        _config_custom_api_url: &str,
        config_api_key: &str,
        target_base_url: &str,
    ) -> Result<(), String> {
        let home = std::env::var("HOME").map_err(|_| "无法获取主目录".to_string())?;
        let settings_dir = std::path::PathBuf::from(home).join(".claude");
        if !settings_dir.exists() {
            std::fs::create_dir_all(&settings_dir).map_err(|e| format!("无法创建目录: {}", e))?;
        }
        let file_path = settings_dir.join("settings.json");
        let config_val = serde_json::json!({
            "primaryApiKey": config_api_key,
            "theme": "light",
            "alwaysThinking": true,
            "maxThinkingTokens": 1024,
            "autoAcceptEdits": true,
            "enableAutoUpdater": true,
            "maxOutputTokens": 4096,
            "maxContextLength": 8192,
            "webThrottleIntervalMs": 1000,
            "customApiUrl": target_base_url
        });
        std::fs::write(&file_path, serde_json::to_string_pretty(&config_val).unwrap())
            .map_err(|e| format!("写入配置失败: {}", e))?;
        Ok(())
    }

    fn add_to_path(&self, target_path: &str) -> Result<(), String> {
        let home = std::env::var("HOME").map_err(|_| "无法获取主目录".to_string())?;
        let profile = std::path::PathBuf::from(&home).join(".bashrc");

        let path_line = format!("\nexport PATH=\"$PATH:{}\"\n", target_path);
        let mut file = std::fs::OpenOptions::new()
            .create(true)
            .append(true)
            .open(&profile)
            .map_err(|e| format!("无法打开 .bashrc 配置文件: {}", e))?;
        
        use std::io::Write;
        file.write_all(path_line.as_bytes()).map_err(|e| format!("写入 shell 配置失败: {}", e))?;
        Ok(())
    }

    fn create_desktop_shortcut(&self) -> Result<(), String> {
        let home = std::env::var("HOME").map_err(|_| "无法获取主目录".to_string())?;
        let desktop = std::path::PathBuf::from(&home).join("Desktop");
        if desktop.exists() {
            let shortcut_file = desktop.join("Claude-Code.desktop");
            let content = format!(
                "[Desktop Entry]\nType=Application\nName=Claude Code\nComment=Run Claude Code CLI\nExec=x-terminal-emulator -e claude\nIcon=utilities-terminal\nTerminal=true\nCategories=Development;\n"
            );
            std::fs::write(&shortcut_file, content).map_err(|e| format!("创建 Linux 桌面快捷方式失败: {}", e))?;
            
            // chmod +x
            #[cfg(unix)]
            {
                use std::os::unix::fs::PermissionsExt;
                let _ = std::fs::set_permissions(&shortcut_file, std::fs::Permissions::from_mode(0o755));
            }
        }
        Ok(())
    }

    fn uninstall_node(&self, log_tx: Sender<String>) -> Result<(), String> {
        let _ = log_tx.send("🧹 Linux: 正在清理本地绿色 Node.js 目录...\n".to_string());
        if let Ok(home) = std::env::var("HOME") {
            let local_node = std::path::PathBuf::from(&home).join(".local").join("share").join("nodejs");
            if local_node.exists() {
                let _ = std::fs::remove_dir_all(local_node);
                let _ = log_tx.send("🗑️ 已清理本地 Node.js 二进制包。\n".to_string());
            }
        }
        Ok(())
    }

    fn uninstall_claude_code(&self, log_tx: Sender<String>) -> Result<(), String> {
        let _ = log_tx.send("🧹 Linux: 正在通过 npm 卸载 Claude Code...\n".to_string());
        let _ = std::process::Command::new("npm")
            .args(["uninstall", "-g", "@anthropic-ai/claude-code"])
            .status();
        Ok(())
    }
}

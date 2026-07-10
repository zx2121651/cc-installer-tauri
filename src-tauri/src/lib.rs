// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod utils;
mod adapters;

use std::sync::atomic::{AtomicBool};
use std::sync::Arc;
use std::sync::mpsc::channel;
use std::thread;
use std::process::Command;
use tauri::Emitter;
use crate::adapters::PlatformAdapter;

fn get_platform_adapter() -> Box<dyn PlatformAdapter + Send + Sync> {
    #[cfg(target_os = "windows")]
    {
        Box::new(adapters::windows::WindowsAdapter)
    }
    #[cfg(target_os = "macos")]
    {
        Box::new(adapters::macos::MacosAdapter)
    }
    #[cfg(target_os = "linux")]
    {
        Box::new(adapters::linux::LinuxAdapter)
    }
    #[cfg(not(any(target_os = "windows", target_os = "macos", target_os = "linux")))]
    {
        Box::new(adapters::windows::WindowsAdapter)
    }
}

#[derive(serde::Serialize)]
pub struct SystemEnv {
    node_version: Option<String>,
    npm_version: Option<String>,
    git_version: Option<String>,
    powershell_version: Option<String>,
    powershell_policy: String,
}

#[derive(serde::Deserialize)]
pub struct InstallConfig {
    install_path: String,
    auto_config_env: bool,
    add_to_path: bool,
    set_alias: bool,
    create_desktop_shortcut: bool,
    custom_api_url: String,
    api_key: String,
}

#[tauri::command]
fn check_system_env() -> SystemEnv {
    let adapter = get_platform_adapter();
    SystemEnv {
        node_version: adapter.detect_node(),
        npm_version: adapter.detect_npm(),
        git_version: adapter.detect_git(),
        powershell_version: adapter.detect_powershell_or_shell(),
        powershell_policy: adapter.get_execution_policy_or_status(),
    }
}

#[tauri::command]
fn start_installation(app: tauri::AppHandle, config: InstallConfig) {
    thread::spawn(move || {
        let (log_tx, log_rx) = channel::<String>();
        let cancel_flag = Arc::new(AtomicBool::new(false));
        let path = config.install_path.clone();

        let adapter = get_platform_adapter();
        let mut final_node_dir = String::new();

        // ── Check if Node.js (>= 18) & npm are installed ──
        let has_node = adapter.is_node_version_valid() && adapter.detect_npm().is_some();
        if !has_node {
            let _ = app.emit("install-status", "⚠️ 未检测到满足要求的 Node.js (>=18) 环境，启动全自动静默部署 Node.js...");
            let _ = app.emit("install-progress", 5);

            let (prog_tx, prog_rx) = channel::<f32>();
            let app_progress = app.clone();
            thread::spawn(move || {
                while let Ok(progress) = prog_rx.recv() {
                    let scaled = 5 + (progress * 20.0) as i32;
                    let _ = app_progress.emit("install-progress", scaled);
                }
            });

            match adapter.install_node(&path, prog_tx, log_tx.clone(), cancel_flag.clone()) {
                Ok(dir) => {
                    final_node_dir = dir;
                    let _ = app.emit("install-status", "✅ Node.js 基础环境安装完成，正在配置环境变量...");
                    let _ = app.emit("install-progress", 30);
                }
                Err(e) => {
                    let _ = app.emit("install-status", format!("❌ 安装 Node.js 失败: {}", e));
                    let _ = app.emit("install-progress", 100);
                    let _ = app.emit("install-finished", false);
                    return;
                }
            }

            // Hot-reload PATH variable for the current process
            #[cfg(target_os = "windows")]
            {
                if let Ok(current_path) = std::env::var("PATH") {
                    let mut extra_paths = vec![final_node_dir.clone()];
                    if let Ok(appdata) = std::env::var("APPDATA") {
                        extra_paths.push(format!("{}\\npm", appdata));
                    }
                    let new_path = format!("{};{}", extra_paths.join(";"), current_path);
                    std::env::set_var("PATH", new_path);
                }
            }
            #[cfg(not(target_os = "windows"))]
            {
                if let Ok(current_path) = std::env::var("PATH") {
                    let new_path = format!("{}:{}", final_node_dir, current_path);
                    std::env::set_var("PATH", new_path);
                }
            }

            // Sleep briefly to let environment settle
            thread::sleep(std::time::Duration::from_secs(3));
        }
        
        let _ = app.emit("install-status", "步骤 1/5: 正在进行网络代理及镜像源加速配置...");
        let _ = app.emit("install-progress", 45);
        let _ = adapter.set_npm_registry("https://registry.npmmirror.com");
        
        let _ = app.emit("install-status", "正在修复 PowerShell 执行策略...");
        let _ = adapter.fix_execution_policy();
        
        let _ = app.emit("install-status", "步骤 2/5: 正在下载 Claude CLI 安装包...");
        let _ = app.emit("install-progress", 55);
        
        let _ = app.emit("install-status", "步骤 3/5: 正在全局安装 Claude CLI 并配置依赖...");
        let _ = app.emit("install-progress", 70);
        
        // Forward installation logs to React client
        let app_log = app.clone();
        thread::spawn(move || {
            while let Ok(line) = log_rx.recv() {
                let _ = app_log.emit("install-log", line);
            }
        });
        
        if let Err(e) = adapter.install_claude_code(&path, log_tx, cancel_flag.clone()) {
            let _ = app.emit("install-status", format!("安装失败: {}", e));
            let _ = app.emit("install-progress", 100);
            let _ = app.emit("install-finished", false);
            return;
        }
        
        let _ = app.emit("install-status", "步骤 4/5: 正在进行高级环境配置及别名注入...");
        let _ = app.emit("install-progress", 90);
        
        if config.auto_config_env {
            let _ = app.emit("install-status", "正在写入 Claude Code 加速中转配置...");
            let mut target_base_url = config.custom_api_url.trim().to_string();
            let mut sync_cc = false;
            let mut cc_backend_url = String::new();

            // CC-Switch integration (runs primarily on Windows)
            #[cfg(target_os = "windows")]
            {
                let is_anthropic = target_base_url.is_empty() || target_base_url.contains("api.anthropic.com");
                let is_ccswitch = target_base_url.contains(":9090");
                let needs_cc_switch = !is_anthropic && !is_ccswitch;

                if needs_cc_switch {
                    let has_cc = utils::is_ccswitch_installed_anywhere();
                    let mut install_success = has_cc;

                    if !has_cc {
                        let _ = app.emit("install-status", "⚠️ 检测到配置了本地模型或第三方代理，正在自动部署 CC-Switch 协议转换网关...");
                        let version = utils::fetch_latest_ccswitch_version("").unwrap_or_else(|_| "1.0.6".to_string());
                        let temp_dir = std::env::temp_dir();
                        let msi_path = temp_dir.join("CC-Switch-Installer.msi");

                        let _ = app.emit("install-status", format!("⏳ 正在下载 CC-Switch v{} 中转网关...", version));
                        let (p_tx, _p_rx) = channel::<f32>();
                        if utils::download_ccswitch(&version, "", &msi_path, p_tx, cancel_flag.clone(), None).is_ok() {
                            let _ = app.emit("install-status", "🔧 正在静默安装 CC-Switch...");
                            if utils::run_ccswitch_msi(&msi_path).is_ok() {
                                install_success = true;
                                let _ = app.emit("install-status", "✅ CC-Switch 中转网关安装成功！");
                            }
                            let _ = std::fs::remove_file(msi_path);
                        }
                    }

                    if install_success {
                        sync_cc = true;
                        cc_backend_url = target_base_url.clone();
                        target_base_url = format!("http://localhost:{}", utils::get_ccswitch_proxy_port());

                        // Launch CC-Switch in backend
                        if let Some(exe_path) = utils::find_ccswitch_path() {
                            let mut cmd = std::process::Command::new(exe_path);
                            #[cfg(target_os = "windows")]
                            {
                                use std::os::windows::process::CommandExt;
                                cmd.creation_flags(0x08000000); // CREATE_NO_WINDOW
                            }
                            let _ = cmd.spawn();
                        }
                    }
                }
            }

            let _ = adapter.configure_claude_settings(
                &config.custom_api_url,
                &config.api_key,
                &target_base_url,
            );

            #[cfg(target_os = "windows")]
            {
                if sync_cc {
                    let _ = app.emit("install-status", "正在向本地网关注入模型绑定配置...");
                    let _ = utils::sync_to_ccswitch(&cc_backend_url, &config.api_key, "");
                }
            }
        }
        
        if config.add_to_path {
            let _ = app.emit("install-status", "正在将 Claude Code 添加到用户 PATH 环境变量...");
            if !path.is_empty() && path != "C:\\Program Files\\Claude Code" {
                let _ = adapter.add_to_path(&path);
            } else {
                #[cfg(target_os = "windows")]
                {
                    if let Ok(appdata) = std::env::var("APPDATA") {
                        let npm_path = std::path::Path::new(&appdata).join("npm");
                        let _ = adapter.add_to_path(&npm_path.to_string_lossy());
                    }
                }
                #[cfg(not(target_os = "windows"))]
                {
                    if let Ok(home) = std::env::var("HOME") {
                        let npm_path = std::path::Path::new(&home).join(".local").join("share").join("nodejs").join("bin");
                        let _ = adapter.add_to_path(&npm_path.to_string_lossy());
                    }
                }
            }
        }
        
        if config.create_desktop_shortcut {
            let _ = app.emit("install-status", "正在创建桌面快捷方式...");
            let _ = adapter.create_desktop_shortcut();
        }
        
        let _ = app.emit("install-status", "步骤 5/5: Claude Code 一键安装配置已成功完成！");
        let _ = app.emit("install-progress", 100);
        let _ = app.emit("install-finished", true);
    });
}

#[tauri::command]
fn run_utility_tool(tool_id: &str) -> Result<String, String> {
    match tool_id {
        "open_claude" => {
            Command::new("cmd")
                .args(&["/c", "start", "powershell", "-NoExit", "claude"])
                .spawn()
                .map_err(|e| e.to_string())?;
            Ok("成功打开 Claude Code".to_string())
        }
        "edit_config" => {
            if let Ok(path) = utils::get_claude_settings_path() {
                let file_path = path.join("settings.json");
                Command::new("cmd")
                    .args(&["/c", "start", "notepad.exe", &file_path.to_string_lossy()])
                    .spawn()
                    .map_err(|e| e.to_string())?;
                Ok("已启动记事本".to_string())
            } else {
                Err("无法找到配置文件路径".to_string())
            }
        }
        "env_vars" => {
            Command::new("cmd")
                .args(&["/c", "rundll32.exe", "sysdm.cpl,EditEnvironmentVariables"])
                .spawn()
                .map_err(|e| e.to_string())?;
            Ok("已打开环境变量管理".to_string())
        }
        "clean_cache" => {
            let output = Command::new("cmd")
                .args(&["/c", "npm", "cache", "clean", "--force"])
                .output()
                .map_err(|e| e.to_string())?;
            if output.status.success() {
                Ok("成功清理缓存".to_string())
            } else {
                Err("清理缓存失败".to_string())
            }
        }
        "fix_env" => {
            Command::new("cmd")
                .args(&["/c", "npm", "cache", "clean", "--force"])
                .output()
                .map_err(|e| e.to_string())?;
            Ok("系统环境修复已执行".to_string())
        }
        "uninstall" => {
            let (log_tx, _log_rx) = channel();
            utils::uninstall_claude_code(log_tx).map_err(|e| e.to_string())?;
            Ok("Claude Code 卸载完成".to_string())
        }
        _ => Err("未知工具".to_string()),
    }
}

#[derive(serde::Serialize, serde::Deserialize, Clone)]
pub struct ClaudeConfig {
    base_url: String,
    api_key: String,
    model: String,
    always_thinking: bool,
    max_thinking_tokens: i32,
    disable_auto_compact: bool,
    max_output_tokens: i32,
    max_context_length: i32,
    enable_auto_updater: bool,
    http_proxy: String,
    no_proxy: String,
    auto_accept_edits: bool,
    theme: String,
}

#[tauri::command]
fn get_claude_config() -> ClaudeConfig {
    ClaudeConfig {
        base_url: utils::get_current_base_url().unwrap_or_else(|| "https://api.anthropic.com".to_string()),
        api_key: utils::get_current_api_key().unwrap_or_default(),
        model: utils::get_current_model().unwrap_or_else(|| "claude-sonnet-5".to_string()),
        always_thinking: utils::get_current_always_thinking(),
        max_thinking_tokens: utils::get_current_max_thinking_tokens(),
        disable_auto_compact: utils::get_current_disable_auto_compact(),
        max_output_tokens: utils::get_current_max_output_tokens(),
        max_context_length: utils::get_current_max_context_length(),
        enable_auto_updater: utils::get_current_enable_auto_updater(),
        http_proxy: utils::get_current_http_proxy(),
        no_proxy: utils::get_current_no_proxy(),
        auto_accept_edits: utils::get_current_auto_accept_edits(),
        theme: utils::get_current_theme(),
    }
}

#[tauri::command]
fn save_claude_config(config: ClaudeConfig) -> Result<(), String> {
    let mut target_base_url = config.base_url.trim().to_string();
    let mut sync_cc = false;
    let mut cc_backend_url = String::new();

    let is_anthropic = target_base_url.is_empty() || target_base_url.contains("api.anthropic.com");
    let is_ccswitch = target_base_url.contains(":9090");
    let is_local_engine = target_base_url.contains(":11434") || target_base_url.contains(":8080") || target_base_url.contains(":1234");

    if !is_anthropic && !is_ccswitch && !is_local_engine {
        let user_profile = std::env::var("USERPROFILE")
            .unwrap_or_else(|_| r"C:\Users\Administrator".to_string());
        let db_path = std::path::PathBuf::from(&user_profile)
            .join(".cc-switch")
            .join("cc-switch.db");
        if db_path.exists() {
            sync_cc = true;
            cc_backend_url = target_base_url.clone();
            target_base_url = format!("http://localhost:{}", utils::get_ccswitch_proxy_port());
        }
    }

    utils::configure_claude_settings(
        &target_base_url,
        &config.api_key,
        &config.model,
        config.always_thinking,
        config.max_thinking_tokens,
        config.disable_auto_compact,
        config.max_output_tokens,
        config.max_context_length,
        config.enable_auto_updater,
        &config.http_proxy,
        &config.no_proxy,
        config.auto_accept_edits,
        &config.theme,
    )?;

    if sync_cc {
        let _ = utils::sync_to_ccswitch(&cc_backend_url, &config.api_key, &config.model);
    }

    Ok(())
}

#[tauri::command]
fn scan_local_models(local_service_url: String) -> Vec<String> {
    let mut models = Vec::new();
    models.push("当前运行模型 (由 Claude Code 自动管理)".to_string());

    let url = local_service_url.trim().to_string();
    if !url.is_empty() {
        let formatted_url = if !url.starts_with("http://") && !url.starts_with("https://") {
            format!("http://{}", url)
        } else {
            url.clone()
        };

        let is_ollama_port = formatted_url.contains(":11434");
        let is_llamacpp_port = formatted_url.contains(":8080");
        let is_lmstudio_port = formatted_url.contains(":1234");

        if is_ollama_port {
            let ollama = utils::fetch_ollama_models_at(&formatted_url);
            for m in ollama {
                models.push(format!("Ollama: {}", m));
            }
            let compat = utils::fetch_openai_compat_models_at(&formatted_url);
            for m in compat {
                if !models.iter().any(|x: &String| x.ends_with(&m)) {
                    models.push(format!("Ollama: {}", m));
                }
            }
        } else if is_llamacpp_port {
            let v1_url = if formatted_url.ends_with("/v1") {
                formatted_url.clone()
            } else {
                format!("{}/v1", formatted_url.trim_end_matches('/'))
            };
            let llama_v1 = utils::fetch_openai_compat_models_at(&v1_url);
            for m in &llama_v1 {
                models.push(format!("llama.cpp: {}", m));
            }
            if llama_v1.is_empty() {
                let llama_root = utils::fetch_openai_compat_models_at(&formatted_url);
                for m in llama_root {
                    models.push(format!("llama.cpp: {}", m));
                }
            }
        } else if is_lmstudio_port {
            let compat = utils::fetch_openai_compat_models_at(&formatted_url);
            for m in compat {
                models.push(format!("LM Studio: {}", m));
            }
        } else {
            let ollama = utils::fetch_ollama_models_at(&formatted_url);
            for m in ollama {
                models.push(format!("Ollama: {}", m));
            }
            let compat = utils::fetch_openai_compat_models_at(&formatted_url);
            for m in compat {
                models.push(format!("vLLM/OpenAI: {}", m));
            }
        }
    }

    // ── Secondary probes: always scan well-known ports unless already covered ──
    if !local_service_url.contains("11434") {
        let ollama = utils::fetch_ollama_models_at("http://localhost:11434");
        for m in ollama {
            models.push(format!("Ollama: {}", m));
        }
    }
    if !local_service_url.contains("8080") {
        let v1_probe = utils::fetch_openai_compat_models_at("http://localhost:8080/v1");
        for m in &v1_probe {
            models.push(format!("llama.cpp: {}", m));
        }
        if v1_probe.is_empty() {
            let root_probe = utils::fetch_openai_compat_models_at("http://localhost:8080");
            for m in root_probe {
                models.push(format!("llama.cpp: {}", m));
            }
        }
    }
    if !local_service_url.contains("1234") {
        let compat = utils::fetch_openai_compat_models_at("http://localhost:1234/v1");
        for m in compat {
            models.push(format!("LM Studio: {}", m));
        }
    }

    models
}

#[tauri::command]
fn start_uninstallation(app: tauri::AppHandle, uninstall_node: bool, uninstall_claude: bool) {
    thread::spawn(move || {
        let (log_tx, log_rx) = channel::<String>();
        
        let _ = app.emit("install-status", "正在启动环境卸载清理程序...");
        let _ = app.emit("install-progress", 10);
        
        let app_log = app.clone();
        thread::spawn(move || {
            while let Ok(line) = log_rx.recv() {
                let _ = app_log.emit("install-log", line);
            }
        });

        let adapter = get_platform_adapter();
        
        if uninstall_claude {
            let _ = app.emit("install-status", "正在卸载 Claude CLI 全局包...");
            let _ = app.emit("install-progress", 40);
            if let Err(e) = adapter.uninstall_claude_code(log_tx.clone()) {
                let _ = app.emit("install-status", format!("Claude CLI 卸载失败: {}", e));
            } else {
                let _ = log_tx.send("✅ Claude CLI 全局包卸载完成。\n".to_string());
            }
        }
        
        if uninstall_node {
            let _ = app.emit("install-status", "正在静默卸载 Node.js 运行时...");
            let _ = app.emit("install-progress", 70);
            if let Err(e) = adapter.uninstall_node(log_tx.clone()) {
                let _ = app.emit("install-status", format!("Node.js 卸载失败: {}", e));
            } else {
                let _ = log_tx.send("✅ Node.js 卸载逻辑处理完成。\n".to_string());
            }
        }
        
        let _ = app.emit("install-status", "环境卸载清理任务已全部成功完成！");
        let _ = app.emit("install-progress", 100);
        let _ = app.emit("install-finished", true);
    });
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            check_system_env,
            start_installation,
            run_utility_tool,
            get_claude_config,
            save_claude_config,
            scan_local_models,
            start_uninstallation
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

use std::fs::{self, File};
use std::io::{self, Read, Write};
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;

#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;

// Windows: CREATE_NO_WINDOW suppresses black cmd popup windows
#[cfg(target_os = "windows")]
const CREATE_NO_WINDOW: u32 = 0x08000000;

/// Get the path to ~/.claude/settings.json
pub fn get_claude_settings_path() -> Result<PathBuf, String> {
    let home = std::env::var("USERPROFILE")
        .or_else(|_| std::env::var("HOME"))
        .map_err(|_| "无法获取用户主目录(HOME/USERPROFILE)".to_string())?;

    let mut path = PathBuf::from(home);
    path.push(".claude");
    Ok(path)
}

/// Detect if Node.js is installed, return version if found
pub fn detect_node() -> Option<String> {
    let output = if cfg!(target_os = "windows") {
        let mut c = Command::new("cmd");
        c.args(["/c", "node -v"]);
        #[cfg(target_os = "windows")]
        c.creation_flags(CREATE_NO_WINDOW);
        c.output().ok()
    } else {
        Command::new("node").arg("-v").output().ok()
    };

    output.and_then(|out| {
        if out.status.success() {
            let version = String::from_utf8_lossy(&out.stdout).trim().to_string();
            if !version.is_empty() {
                Some(version)
            } else {
                None
            }
        } else {
            None
        }
    })
}

/// Detect if npm is installed, return version if found
pub fn detect_npm() -> Option<String> {
    let output = if cfg!(target_os = "windows") {
        let mut c = Command::new("cmd");
        c.args(["/c", "npm -v"]);
        #[cfg(target_os = "windows")]
        c.creation_flags(CREATE_NO_WINDOW);
        c.output().ok()
    } else {
        Command::new("npm").arg("-v").output().ok()
    };

    output.and_then(|out| {
        if out.status.success() {
            let version = String::from_utf8_lossy(&out.stdout).trim().to_string();
            if !version.is_empty() {
                Some(version)
            } else {
                None
            }
        } else {
            None
        }
    })
}

/// Check if the installed Node.js version is valid (>= 18)
pub fn is_node_version_valid() -> bool {
    if let Some(v_str) = detect_node() {
        let cleaned = v_str.trim().trim_start_matches('v');
        if let Some(first_part) = cleaned.split('.').next() {
            if let Ok(major) = first_part.parse::<i32>() {
                return major >= 18;
            }
        }
    }
    false
}


/// Detect if git is installed, return version if found
pub fn detect_git() -> Option<String> {
    let output = if cfg!(target_os = "windows") {
        let mut c = Command::new("cmd");
        c.args(["/c", "git --version"]);
        #[cfg(target_os = "windows")]
        c.creation_flags(CREATE_NO_WINDOW);
        c.output().ok()
    } else {
        Command::new("git").arg("--version").output().ok()
    };

    output.and_then(|out| {
        if out.status.success() {
            let version = String::from_utf8_lossy(&out.stdout).trim().to_string();
            // Git version output is usually: git version 2.45.2.windows.1
            // Let's strip the prefix "git version " if it exists
            let version = version
                .strip_prefix("git version ")
                .unwrap_or(&version)
                .to_string();
            if !version.is_empty() {
                Some(version)
            } else {
                None
            }
        } else {
            None
        }
    })
}

/// Detect if powershell is installed, return version if found
pub fn detect_powershell() -> Option<String> {
    let output = if cfg!(target_os = "windows") {
        let mut c = Command::new("powershell");
        c.args(["-Command", "$PSVersionTable.PSVersion.ToString()"]);
        #[cfg(target_os = "windows")]
        c.creation_flags(CREATE_NO_WINDOW);
        c.output().ok()
    } else {
        Command::new("powershell")
            .args(["-Command", "$PSVersionTable.PSVersion.ToString()"])
            .output()
            .ok()
    };

    output.and_then(|out| {
        if out.status.success() {
            let version = String::from_utf8_lossy(&out.stdout).trim().to_string();
            if !version.is_empty() {
                Some(version)
            } else {
                None
            }
        } else {
            None
        }
    })
}

/// Detect if @anthropic-ai/claude-code CLI is globally installed
pub fn is_claude_code_installed() -> bool {
    let output = if cfg!(target_os = "windows") {
        let mut c = Command::new("cmd");
        c.args(["/c", "claude -v"]);
        #[cfg(target_os = "windows")]
        c.creation_flags(CREATE_NO_WINDOW);
        c.output().ok()
    } else {
        Command::new("claude").arg("-v").output().ok()
    };

    output.map(|out| out.status.success()).unwrap_or(false)
}

/// Helper to search for CC-Switch.exe across C, D and other active local drives
pub fn find_ccswitch_path() -> Option<std::path::PathBuf> {
    use std::path::PathBuf;

    let possible_paths = [
        r"Program Files\CC-Switch\CC-Switch.exe",
        r"Program Files\CCSwitch\CCSwitch.exe",
        r"Program Files (x86)\CC-Switch\CC-Switch.exe",
        r"Program Files (x86)\CCSwitch\CCSwitch.exe",
    ];

    let local_appdata = std::env::var("LOCALAPPDATA").unwrap_or_default();
    let appdata = std::env::var("APPDATA").unwrap_or_default();

    // Smart local drive extraction (only query online local drives to avoid network mount timeouts)
    let mut drives = vec!["C:".to_string(), "D:".to_string()];

    // Add current executable's drive
    if let Ok(current_exe) = std::env::current_exe() {
        if let Some(drive) = current_exe.to_str().and_then(|s| s.get(0..2)) {
            if drive.ends_with(':') && !drives.contains(&drive.to_string()) {
                drives.push(drive.to_string());
            }
        }
    }

    // Add USERPROFILE drive
    if let Ok(user_profile) = std::env::var("USERPROFILE") {
        if let Some(drive) = user_profile.get(0..2) {
            if drive.ends_with(':') && !drives.contains(&drive.to_string()) {
                drives.push(drive.to_string());
            }
        }
    }

    // Add LOCALAPPDATA drive
    if !local_appdata.is_empty() {
        if let Some(drive) = local_appdata.get(0..2) {
            if drive.ends_with(':') && !drives.contains(&drive.to_string()) {
                drives.push(drive.to_string());
            }
        }
    }

    let mut paths = Vec::new();

    for drive in &drives {
        // 1. Check Program Files on this drive
        for p in &possible_paths {
            paths.push(PathBuf::from(drive).join(p));
        }

        // 2. Check AppData Local on this drive (strip potential C: prefix first)
        if !local_appdata.is_empty() {
            let relative = if local_appdata.len() >= 2 && &local_appdata[1..2] == ":" {
                &local_appdata[2..]
            } else {
                &local_appdata
            };
            let relative = relative.trim_start_matches('\\').trim_start_matches('/');

            paths.push(
                PathBuf::from(drive)
                    .join(relative)
                    .join(r"Programs\CC Switch\cc-switch.exe"),
            );
            paths.push(
                PathBuf::from(drive)
                    .join(relative)
                    .join(r"Programs\CC-Switch\CC-Switch.exe"),
            );
            paths.push(
                PathBuf::from(drive)
                    .join(relative)
                    .join(r"Programs\CC-Switch\cc-switch.exe"),
            );
            paths.push(
                PathBuf::from(drive)
                    .join(relative)
                    .join(r"Programs\CCSwitch\CCSwitch.exe"),
            );
            paths.push(
                PathBuf::from(drive)
                    .join(relative)
                    .join(r"Programs\CCSwitch\cc-switch.exe"),
            );
            paths.push(
                PathBuf::from(drive)
                    .join(relative)
                    .join(r"cc-switch-updater\pending\CC-Switch.exe"),
            );
        }

        // 3. Check AppData Roaming on this drive
        if !appdata.is_empty() {
            let relative = if appdata.len() >= 2 && &appdata[1..2] == ":" {
                &appdata[2..]
            } else {
                &appdata
            };
            let relative = relative.trim_start_matches('\\').trim_start_matches('/');

            paths.push(
                PathBuf::from(drive)
                    .join(relative)
                    .join(r"Local\Programs\CC Switch\cc-switch.exe"),
            );
            paths.push(
                PathBuf::from(drive)
                    .join(relative)
                    .join(r"Local\Programs\CC-Switch\CC-Switch.exe"),
            );
            paths.push(
                PathBuf::from(drive)
                    .join(relative)
                    .join(r"Local\Programs\CC-Switch\cc-switch.exe"),
            );
            paths.push(
                PathBuf::from(drive)
                    .join(relative)
                    .join(r"Local\Programs\CCSwitch\CCSwitch.exe"),
            );
            paths.push(
                PathBuf::from(drive)
                    .join(relative)
                    .join(r"Local\Programs\CCSwitch\cc-switch.exe"),
            );
        }
    }

    for path in paths {
        if path.exists() {
            return Some(path);
        }
    }
    None
}

/// Detect if CC-Switch is installed anywhere on the machine
pub fn is_ccswitch_installed_anywhere() -> bool {
    find_ccswitch_path().is_some()
}

/// Uninstall Node.js on Windows - env-var-aware detection, supports nvm/scoop/volta/fnm/MSI
/// Sends log lines through sender, ends with __NODE_DONE__
pub fn uninstall_nodejs(log_sender: std::sync::mpsc::Sender<String>) {
    let _ = log_sender.send("🔍 正在检测 Node.js 实际安装方式...\n".to_string());

    // ── Step 1: Comprehensive detection via PowerShell ──
    // Priority: NVM_HOME env var > path keywords > registry
    let detect_ps = r#"
$ErrorActionPreference = 'SilentlyContinue'
$nodePath = (Get-Command node -ErrorAction SilentlyContinue).Source

# Check for nvm by environment variables first (most reliable)
$nvmHome = [System.Environment]::GetEnvironmentVariable('NVM_HOME', 'User')
if (-not $nvmHome) { $nvmHome = [System.Environment]::GetEnvironmentVariable('NVM_HOME', 'Machine') }
$nvmSymlink = [System.Environment]::GetEnvironmentVariable('NVM_SYMLINK', 'User')
if (-not $nvmSymlink) { $nvmSymlink = [System.Environment]::GetEnvironmentVariable('NVM_SYMLINK', 'Machine') }

# Determine install type
if ($nvmHome -or $nvmSymlink) {
    "TYPE:NVM|PATH:$nodePath|NVM_HOME:$nvmHome|NVM_SYMLINK:$nvmSymlink"
} elseif ($nodePath -like '*nvm*') {
    "TYPE:NVM|PATH:$nodePath|NVM_HOME:|NVM_SYMLINK:"
} elseif ($nodePath -like '*scoop*') {
    "TYPE:SCOOP|PATH:$nodePath"
} elseif ($nodePath -like '*volta*') {
    "TYPE:VOLTA|PATH:$nodePath"
} elseif ($nodePath -like '*fnm*') {
    "TYPE:FNM|PATH:$nodePath"
} elseif ($nodePath) {
    "TYPE:MSI|PATH:$nodePath"
} else {
    "TYPE:NOT_FOUND"
}
"#;

    let detect_out = {
        let mut c = Command::new("powershell");
        c.args(["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command", detect_ps]);
        #[cfg(target_os = "windows")]
        c.creation_flags(CREATE_NO_WINDOW);
        c.output().ok()
            .map(|o| String::from_utf8_lossy(&o.stdout).trim().to_string())
            .unwrap_or_else(|| "TYPE:NOT_FOUND".to_string())
    };

    // Parse detection result
    let get_field = |key: &str| -> String {
        detect_out.split('|')
            .find(|seg| seg.starts_with(key))
            .map(|seg| seg[key.len()..].to_string())
            .unwrap_or_default()
    };

    let install_type = get_field("TYPE:");
    let node_path    = get_field("PATH:");
    let nvm_home     = get_field("NVM_HOME:");
    let nvm_symlink  = get_field("NVM_SYMLINK:");

    if install_type == "NOT_FOUND" || install_type.is_empty() {
        let _ = log_sender.send("ℹ️ 当前系统未检测到 node 命令，Node.js 可能已经卸载。\n".to_string());
        let _ = log_sender.send("__NODE_DONE__".to_string());
        return;
    }

    let _ = log_sender.send(format!("📍 检测到 Node.js 路径: {}\n", node_path));
    if !nvm_home.is_empty() {
        let _ = log_sender.send(format!("📍 检测到 NVM_HOME 环境变量: {}\n", nvm_home));
    }

    // ── Step 2: Dispatch the correct uninstall method ──
    let mut uninstall_success = false;

    if install_type == "NVM" {
        // nvm for Windows: directory-deletion approach (most reliable per nvm-windows GitHub)
        // Step A: enumerate all installed versions and batch-uninstall via nvm list
        let _ = log_sender.send("📦 检测到通过 nvm for Windows 安装，执行完整清理流程...\n".to_string());

        let list_ps = r#"
$ErrorActionPreference = 'SilentlyContinue'
$out = cmd /c "chcp 65001 >nul 2>&1 && nvm list" 2>&1
$out -split "`n" | Where-Object { $_ -match '\d+\.\d+\.\d+' } |
    ForEach-Object { ($_ -replace '.*?(\d+\.\d+\.\d+).*', '$1').Trim() }
"#;
        let list_out = {
            let mut c = Command::new("powershell");
            c.args(["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command", list_ps]);
            #[cfg(target_os = "windows")]
            c.creation_flags(CREATE_NO_WINDOW);
            c.output().ok()
                .map(|o| String::from_utf8_lossy(&o.stdout).trim().to_string())
                .unwrap_or_default()
        };

        let versions: Vec<&str> = list_out.lines()
            .map(|l| l.trim())
            .filter(|l| !l.is_empty())
            .collect();

        if versions.is_empty() {
            let _ = log_sender.send("ℹ️ nvm list 未返回已安装版本，跳过逐版本卸载步骤。\n".to_string());
        } else {
            let _ = log_sender.send(format!("📋 找到 {} 个已安装版本，逐一卸载...\n", versions.len()));
            for ver in &versions {
                let _ = log_sender.send(format!("  🔧 nvm uninstall {}...\n", ver));
                let mut c = Command::new("cmd");
                c.args(["/c", &format!("chcp 65001 >nul 2>&1 && nvm uninstall {}", ver)]);
                #[cfg(target_os = "windows")]
                c.creation_flags(CREATE_NO_WINDOW);
                let _ = c.status();
            }
        }

        // Step B: forcibly remove NVM_HOME directory (contains all node versions)
        let _ = log_sender.send("🗑️ 正在强制删除 nvm 根目录及所有 Node 版本文件...\n".to_string());

        // Inject the already-detected paths directly into the PS script
        let fallback_home = format!("{}\\AppData\\Roaming\\nvm",
            std::env::var("USERPROFILE").unwrap_or_else(|_| "C:\\Users\\Administrator".to_string()));
        let effective_nvm_home = if nvm_home.is_empty() { fallback_home.clone() } else { nvm_home.clone() };
        let effective_nvm_symlink = if nvm_symlink.is_empty() { "C:\\Program Files\\nodejs".to_string() } else { nvm_symlink.clone() };

        let cleanup_ps = format!(r#"
$ErrorActionPreference = 'SilentlyContinue'

# Paths injected from Rust detection (most reliable)
$nvmHome    = '{}'
$nvmSymlink = '{}'
"#, effective_nvm_home.replace('\'', "''"),
    effective_nvm_symlink.replace('\'', "''")) + r#"

# Delete the nvm directory (contains all node installs)
if (Test-Path $nvmHome) {
    Remove-Item -Recurse -Force $nvmHome -ErrorAction SilentlyContinue
    "DELETED_NVM_HOME:$nvmHome"
}

# Delete the nodejs symlink/junction
if (Test-Path $nvmSymlink) {
    # Use cmd rmdir for junctions (Remove-Item may fail on junctions)
    cmd /c "rmdir /s /q `"$nvmSymlink`"" 2>$null
    if (Test-Path $nvmSymlink) {
        Remove-Item -Recurse -Force $nvmSymlink -ErrorAction SilentlyContinue
    }
    "DELETED_SYMLINK:$nvmSymlink"
}

# Delete common leftover paths
$extras = @(
    "$env:ProgramFiles\nodejs",
    "$env:APPDATA\npm",
    "$env:APPDATA\npm-cache"
)
foreach ($p in $extras) {
    if (Test-Path $p) {
        Remove-Item -Recurse -Force $p -ErrorAction SilentlyContinue
        "DELETED_EXTRA:$p"
    }
}

# Clean environment variables
foreach ($scope in @('User', 'Machine')) {
    [System.Environment]::SetEnvironmentVariable('NVM_HOME', $null, $scope)
    [System.Environment]::SetEnvironmentVariable('NVM_SYMLINK', $null, $scope)
    $path = [System.Environment]::GetEnvironmentVariable('PATH', $scope)
    if ($path) {
        $newPath = ($path -split ';' | Where-Object {
            $_ -notmatch '(?i)nvm' -and $_ -notmatch '(?i)\\nodejs($|\\)'
        }) -join ';'
        [System.Environment]::SetEnvironmentVariable('PATH', $newPath, $scope)
    }
}
"ENV_CLEANED"
"#;

        let cleanup_out = {
            let mut c = Command::new("powershell");
            c.args(["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command", &cleanup_ps]);
            #[cfg(target_os = "windows")]
            c.creation_flags(CREATE_NO_WINDOW);
            c.output().ok()
                .map(|o| String::from_utf8_lossy(&o.stdout).trim().to_string())
                .unwrap_or_default()
        };

        for line in cleanup_out.lines() {
            let l = line.trim();
            if l.starts_with("DELETED_NVM_HOME:") {
                let _ = log_sender.send(format!("✅ 已删除 nvm 目录: {}\n", &l["DELETED_NVM_HOME:".len()..]));
            } else if l.starts_with("DELETED_SYMLINK:") {
                let _ = log_sender.send(format!("✅ 已删除 nodejs 软链接: {}\n", &l["DELETED_SYMLINK:".len()..]));
            } else if l.starts_with("DELETED_EXTRA:") {
                let _ = log_sender.send(format!("✅ 已删除残留目录: {}\n", &l["DELETED_EXTRA:".len()..]));
            } else if l == "ENV_CLEANED" {
                let _ = log_sender.send("✅ PATH 环境变量 nvm/nodejs 条目已清除。\n".to_string());
            }
        }
        let _ = log_sender.send("ℹ️ 注意：当前终端的 PATH 需重启后才能完全刷新。\n".to_string());
        uninstall_success = true;

    } else if install_type == "SCOOP" {
        let _ = log_sender.send("📦 检测到通过 Scoop 安装，正在执行 scoop uninstall nodejs...\n".to_string());
        let status = {
            let mut c = Command::new("cmd");
            c.args(["/c", "chcp 65001 >nul 2>&1 && scoop uninstall nodejs"]);
            #[cfg(target_os = "windows")]
            c.creation_flags(CREATE_NO_WINDOW);
            c.status().ok()
        };
        uninstall_success = status.map(|s| s.success()).unwrap_or(false);

    } else if install_type == "VOLTA" {
        let _ = log_sender.send("📦 检测到通过 Volta 安装，正在执行 volta uninstall node...\n".to_string());
        let status = {
            let mut c = Command::new("cmd");
            c.args(["/c", "chcp 65001 >nul 2>&1 && volta uninstall node"]);
            #[cfg(target_os = "windows")]
            c.creation_flags(CREATE_NO_WINDOW);
            c.status().ok()
        };
        uninstall_success = status.map(|s| s.success()).unwrap_or(false);

    } else if install_type == "FNM" {
        let _ = log_sender.send("📦 检测到通过 fnm 安装，正在执行 fnm uninstall...\n".to_string());
        let ver_out = {
            let mut c = Command::new("powershell");
            c.args(["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command",
                "(node --version 2>$null).TrimStart('v')"]);
            #[cfg(target_os = "windows")]
            c.creation_flags(CREATE_NO_WINDOW);
            c.output().ok()
                .map(|o| String::from_utf8_lossy(&o.stdout).trim().to_string())
                .unwrap_or_default()
        };
        if !ver_out.is_empty() {
            let fnm_cmd = format!("fnm uninstall {}", ver_out);
            let _ = log_sender.send(format!("🔧 执行: {}\n", fnm_cmd));
            let status = {
                let mut c = Command::new("cmd");
                c.args(["/c", &format!("chcp 65001 >nul 2>&1 && {}", fnm_cmd)]);
                #[cfg(target_os = "windows")]
                c.creation_flags(CREATE_NO_WINDOW);
                c.status().ok()
            };
            uninstall_success = status.map(|s| s.success()).unwrap_or(false);
        }

    } else {
        // Standard MSI/installer: use registry-based uninstall
        let _ = log_sender.send("📦 检测到标准安装（MSI 安装包），通过注册表执行静默卸载...\n".to_string());

        let ps_script = r#"
$ErrorActionPreference = 'SilentlyContinue'
$regPaths = @(
    'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\*',
    'HKLM:\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\*',
    'HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\*'
)
$found = Get-ItemProperty $regPaths -ErrorAction SilentlyContinue |
    Where-Object { $_.DisplayName -like '*Node.js*' -or $_.DisplayName -like '*Node JS*' }
if ($found) {
    $entry = $found | Select-Object -First 1
    $quiet = $entry.QuietUninstallString
    $normal = $entry.UninstallString
    "$($entry.DisplayName)|||$quiet|||$normal"
} else { 'NOT_FOUND' }
"#;

        let reg_out = {
            let mut c = Command::new("powershell");
            c.args(["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command", ps_script]);
            #[cfg(target_os = "windows")]
            c.creation_flags(CREATE_NO_WINDOW);
            c.output().ok()
                .map(|o| String::from_utf8_lossy(&o.stdout).trim().to_string())
                .unwrap_or_default()
        };

        if !reg_out.is_empty() && reg_out != "NOT_FOUND" {
            let parts: Vec<&str> = reg_out.splitn(3, "|||").collect();
            let display_name = parts.first().copied().unwrap_or("Node.js");
            let quiet_str = parts.get(1).copied().unwrap_or("").trim();
            let normal_str = parts.get(2).copied().unwrap_or("").trim();

            let _ = log_sender.send(format!("✅ 注册表找到: {}\n", display_name));
            let _ = log_sender.send("🔧 正在执行静默卸载（约 10~30 秒）...\n".to_string());

            let uninstall_cmd = if !quiet_str.is_empty() {
                quiet_str.to_string()
            } else if !normal_str.is_empty() {
                if normal_str.to_lowercase().contains("msiexec") {
                    // Replace /I or /i with /X to force silent uninstall instead of repair
                    let mut cmd = normal_str.to_string();
                    if cmd.contains(" /I") {
                        cmd = cmd.replace(" /I", " /X");
                    } else if cmd.contains(" /i") {
                        cmd = cmd.replace(" /i", " /X");
                    } else if !cmd.to_lowercase().contains("/x") {
                        cmd = cmd.replace("msiexec.exe /I", "msiexec.exe /X");
                        cmd = cmd.replace("MsiExec.exe /I", "MsiExec.exe /X");
                        cmd = cmd.replace("msiexec /I", "msiexec /X");
                        cmd = cmd.replace("msiexec.exe /i", "msiexec.exe /X");
                        cmd = cmd.replace("MsiExec.exe /i", "MsiExec.exe /X");
                        cmd = cmd.replace("msiexec /i", "msiexec /X");
                    }
                    format!("{} /qn /norestart", cmd)
                } else {
                    format!("{} /S /silent", normal_str)
                }
            } else {
                String::new()
            };

            if !uninstall_cmd.is_empty() {
                let ps_uninstall = format!(
                    "Start-Process -FilePath 'cmd.exe' -ArgumentList '/c {}' -Wait -WindowStyle Hidden",
                    uninstall_cmd.replace('\'', "''")
                );
                let status = {
                    let mut c = Command::new("powershell");
                    c.args(["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command", &ps_uninstall]);
                    #[cfg(target_os = "windows")]
                    c.creation_flags(CREATE_NO_WINDOW);
                    c.status().ok()
                };
                uninstall_success = status.map(|s| s.success() || s.code() == Some(3010)).unwrap_or(false);
            }
        }

        // Fallback: winget
        if !uninstall_success {
            let _ = log_sender.send("⚠️ 注册表卸载未成功，尝试 winget 卸载...\n".to_string());
            let wg_out = {
                let mut c = Command::new("powershell");
                c.args(["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command",
                    "winget uninstall --id OpenJS.NodeJS --silent --accept-source-agreements 2>&1; winget uninstall --id OpenJS.NodeJS.LTS --silent --accept-source-agreements 2>&1"]);
                #[cfg(target_os = "windows")]
                c.creation_flags(CREATE_NO_WINDOW);
                c.output().ok()
                    .map(|o| String::from_utf8_lossy(&o.stdout).trim().to_string())
                    .unwrap_or_default()
            };
            uninstall_success = wg_out.contains("Successfully uninstalled") || wg_out.contains("成功");
            if uninstall_success {
                let _ = log_sender.send("✅ 已通过 winget 成功卸载 Node.js。\n".to_string());
            }
        }
    }

    // ── Step 3: Verify and nuclear-fallback cleanup ──
    std::thread::sleep(std::time::Duration::from_millis(1500));
    let verify_node_path = {
        let mut c = Command::new("powershell");
        c.args(["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass",
            "-Command", "(Get-Command node -ErrorAction SilentlyContinue).Source"]);
        #[cfg(target_os = "windows")]
        c.creation_flags(CREATE_NO_WINDOW);
        c.output().ok()
            .map(|o| String::from_utf8_lossy(&o.stdout).trim().to_string())
            .unwrap_or_default()
    };

    if verify_node_path.is_empty() {
        let _ = log_sender.send("✅ 已验证：Node.js 已完全从系统中移除！\n".to_string());
    } else {
        // ── Nuclear fallback: direct directory deletion + PATH cleanup ──
        let _ = log_sender.send(format!(
            "⚠️ 标准卸载后 node 命令仍存在 ({})，启动物理强制清理模式...\n",
            verify_node_path
        ));

        // Build a PowerShell script that:
        //   1. Resolves node.exe actual path (follows symlinks)
        //   2. Deletes parent dir and siblings (npm, node_modules, etc.)
        //   3. Deletes any remaining nodejs junction/symlink dir
        //   4. Scrubs PATH in both User and Machine scope
        let node_path_escaped = verify_node_path.replace('\'', "''");
        let nuclear_ps = format!(r#"
$ErrorActionPreference = 'SilentlyContinue'
$nodePath = '{}'

# Resolve real path through any symlinks/junctions
$realPath = $nodePath
try {{
    $item = Get-Item $nodePath -Force
    if ($item.LinkType) {{
        $realPath = (Resolve-Path $item.Target -ErrorAction SilentlyContinue)
        if (-not $realPath) {{ $realPath = $nodePath }}
    }}
}} catch {{}}

$nodeDir   = [System.IO.Path]::GetDirectoryName($realPath)
$parentDir = [System.IO.Path]::GetDirectoryName($nodeDir)

"NODEDIR:$nodeDir"

# Delete the node directory itself (real location)
if (Test-Path $nodeDir) {{
    cmd /c "rmdir /s /q `"$nodeDir`"" 2>$null
    if (Test-Path $nodeDir) {{
        Remove-Item -Recurse -Force $nodeDir -ErrorAction SilentlyContinue
    }}
    "DELETED_DIR:$nodeDir"
}}

# Also delete the original symlink path (if different from real path)
$symlinkDir = [System.IO.Path]::GetDirectoryName($nodePath)
if ($symlinkDir -ne $nodeDir -and (Test-Path $symlinkDir)) {{
    cmd /c "rmdir /s /q `"$symlinkDir`"" 2>$null
    Remove-Item -Recurse -Force $symlinkDir -ErrorAction SilentlyContinue
    "DELETED_SYMLINK:$symlinkDir"
}}

# Delete npm and npm-cache in APPDATA (common leftover regardless of install method)
$npmDirs = @(
    "$env:APPDATA\npm",
    "$env:APPDATA\npm-cache",
    "$env:LOCALAPPDATA\npm-cache"
)
foreach ($d in $npmDirs) {{
    if (Test-Path $d) {{
        Remove-Item -Recurse -Force $d -ErrorAction SilentlyContinue
        "DELETED_NPM:$d"
    }}
}}

# Scrub PATH: remove any entry that resolves to nodeDir, symlinkDir, or contains 'nodejs'
foreach ($scope in @('User', 'Machine')) {{
    $rawPath = [System.Environment]::GetEnvironmentVariable('PATH', $scope)
    if ($rawPath) {{
        $cleaned = ($rawPath -split ';' | Where-Object {{
            $entry = $_.Trim()
            $keep = $true
            if ($entry -eq $nodeDir)     {{ $keep = $false }}
            if ($entry -eq $symlinkDir)  {{ $keep = $false }}
            if ($entry -match '(?i)\\nodejs\\?' -or $entry -match '(?i)/nodejs/?') {{ $keep = $false }}
            $keep
        }}) -join ';'
        [System.Environment]::SetEnvironmentVariable('PATH', $cleaned, $scope)
    }}
}}
"PATH_CLEANED"

# Clean NVM env vars just in case they remained
foreach ($scope in @('User', 'Machine')) {{
    [System.Environment]::SetEnvironmentVariable('NVM_HOME',    $null, $scope)
    [System.Environment]::SetEnvironmentVariable('NVM_SYMLINK', $null, $scope)
}}
"#, node_path_escaped);

        let nuclear_out = {
            let mut c = Command::new("powershell");
            c.args(["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command", &nuclear_ps]);
            #[cfg(target_os = "windows")]
            c.creation_flags(CREATE_NO_WINDOW);
            c.output().ok()
                .map(|o| String::from_utf8_lossy(&o.stdout).trim().to_string())
                .unwrap_or_default()
        };

        for line in nuclear_out.lines() {
            let l = line.trim();
            if l.starts_with("NODEDIR:") {
                let _ = log_sender.send(format!("🔍 Node.js 实际安装目录: {}\n", &l["NODEDIR:".len()..]));
            } else if l.starts_with("DELETED_DIR:") {
                let _ = log_sender.send(format!("🗑️ 已物理删除目录: {}\n", &l["DELETED_DIR:".len()..]));
            } else if l.starts_with("DELETED_SYMLINK:") {
                let _ = log_sender.send(format!("🗑️ 已删除软链接目录: {}\n", &l["DELETED_SYMLINK:".len()..]));
            } else if l.starts_with("DELETED_NPM:") {
                let _ = log_sender.send(format!("🗑️ 已删除 npm 残留目录: {}\n", &l["DELETED_NPM:".len()..]));
            } else if l == "PATH_CLEANED" {
                let _ = log_sender.send("✅ 已从 PATH 环境变量中清除所有 nodejs 路径。\n".to_string());
            }
        }

        // Final re-verification
        std::thread::sleep(std::time::Duration::from_millis(1000));
        let final_check = {
            let mut c = Command::new("powershell");
            c.args(["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass",
                "-Command", "(Get-Command node -ErrorAction SilentlyContinue).Source"]);
            #[cfg(target_os = "windows")]
            c.creation_flags(CREATE_NO_WINDOW);
            c.output().ok()
                .map(|o| String::from_utf8_lossy(&o.stdout).trim().to_string())
                .unwrap_or_default()
        };

        if final_check.is_empty() {
            let _ = log_sender.send("✅ 强制清理成功：Node.js 已完全从系统中移除！\n".to_string());
        } else {
            let _ = log_sender.send(format!(
                "⚠️ 注意：仍然检测到 node 命令 ({})。\n   这可能是其他软件内嵌的 Node.js（如 HBuilderX、Cursor等），不影响使用，可忽略。\n   如需彻底清理，请重启终端后再次卸载。\n",
                final_check
            ));
        }
    }

    let _ = log_sender.send("__NODE_DONE__\n".to_string());
}

/// Update NPM to latest version globally (sends log, ends with __NPM_DONE__)

pub fn update_npm(log_sender: std::sync::mpsc::Sender<String>) {
    let _ = log_sender.send("正在执行 npm install -g npm@latest ...\n".to_string());

    let mut cmd = if cfg!(target_os = "windows") {
        let mut c = Command::new("cmd");
        c.args(["/c", "npm install -g npm@latest"]);
        #[cfg(target_os = "windows")]
        c.creation_flags(CREATE_NO_WINDOW);
        c
    } else {
        let mut c = Command::new("npm");
        c.args(["install", "-g", "npm@latest"]);
        c
    };

    cmd.stdout(Stdio::piped()).stderr(Stdio::piped());
    if let Ok(mut child) = cmd.spawn() {
        if let Some(stdout) = child.stdout.take() {
            let log = log_sender.clone();
            std::thread::spawn(move || {
                let mut reader = io::BufReader::new(stdout);
                let mut buf = [0u8; 256];
                while let Ok(n) = reader.read(&mut buf) {
                    if n == 0 {
                        break;
                    }
                    let _ = log.send(String::from_utf8_lossy(&buf[..n]).to_string());
                }
            });
        }
        match child.wait() {
            Ok(s) if s.success() => {
                let _ = log_sender.send("✅ NPM 已成功更新到最新版！\n".to_string());
            }
            _ => {
                let _ = log_sender.send(
                    "❌ NPM 更新失败，请检查网络连接或手动运行 npm install -g npm@latest\n"
                        .to_string(),
                );
            }
        }
    } else {
        let _ = log_sender.send("❌ 无法启动 npm 进程，请确认 Node.js 已正确安装。\n".to_string());
    }
    let _ = log_sender.send("__NPM_DONE__".to_string());
}

/// Test connection latency to a URL in milliseconds
pub fn test_url_latency(url: &str) -> Option<u128> {
    let client = reqwest::blocking::Client::builder()
        .timeout(std::time::Duration::from_secs(3))
        .build()
        .ok()?;

    let start = std::time::Instant::now();
    let resp = client.get(url).send().ok()?;
    if resp.status().is_success() || resp.status().is_redirection() {
        Some(start.elapsed().as_millis())
    } else {
        None
    }
}

/// Switch npm registry to any custom registry URL
pub fn set_npm_registry(registry: &str) -> Result<String, String> {
    let status = if cfg!(target_os = "windows") {
        let mut c = Command::new("cmd");
        c.args(["/c", &format!("npm config set registry {}", registry)]);
        #[cfg(target_os = "windows")]
        c.creation_flags(CREATE_NO_WINDOW);
        c.status()
    } else {
        Command::new("npm")
            .args(["config", "set", "registry", registry])
            .status()
    }
    .map_err(|e| format!("执行 npm 命令失败: {}", e))?;

    if status.success() {
        Ok(registry.to_string())
    } else {
        Err("npm config 命令执行返回值非零".to_string())
    }
}

/// Get current npm registry
pub fn get_npm_registry() -> Result<String, String> {
    let output = if cfg!(target_os = "windows") {
        let mut c = Command::new("cmd");
        c.args(["/c", "npm config get registry"]);
        #[cfg(target_os = "windows")]
        c.creation_flags(CREATE_NO_WINDOW);
        c.output()
    } else {
        Command::new("npm")
            .args(["config", "get", "registry"])
            .output()
    }
    .map_err(|e| format!("执行 npm 命令失败: {}", e))?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
    } else {
        Err("获取 npm 注册源失败".to_string())
    }
}

/// Fix PowerShell ExecutionPolicy so npm global scripts (like claude.ps1) can run.
/// Sets RemoteSigned for CurrentUser scope — safe and non-invasive.
pub fn fix_powershell_execution_policy() -> bool {
    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x08000000;
        let result = Command::new("powershell")
            .args([
                "-NoProfile",
                "-NonInteractive",
                "-Command",
                "Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force",
            ])
            .creation_flags(CREATE_NO_WINDOW)
            .output();
        return result.map(|o| o.status.success()).unwrap_or(false);
    }
    #[cfg(not(target_os = "windows"))]
    true
}

/// Check current PowerShell ExecutionPolicy
pub fn get_powershell_execution_policy() -> String {
    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x08000000;
        let result = Command::new("powershell")
            .args([
                "-NoProfile",
                "-NonInteractive",
                "-Command",
                "Get-ExecutionPolicy -Scope CurrentUser",
            ])
            .creation_flags(CREATE_NO_WINDOW)
            .output();
        if let Ok(output) = result {
            return String::from_utf8_lossy(&output.stdout).trim().to_string();
        }
    }
    "Unknown".to_string()
}

/// Install Claude Code globally
pub fn install_claude_code(
    log_sender: std::sync::mpsc::Sender<String>,
    cancel_flag: Arc<AtomicBool>,
) -> Result<(), String> {
    // Fix PowerShell execution policy FIRST to avoid "running scripts is disabled" error
    #[cfg(target_os = "windows")]
    {
        let _ = log_sender.send("🔧 正在检查 PowerShell 执行策略...\n".to_string());
        if fix_powershell_execution_policy() {
            let _ = log_sender.send(
                "✅ PowerShell 执行策略已设置为 RemoteSigned（允许运行 npm 全局脚本）\n"
                    .to_string(),
            );
        } else {
            let _ = log_sender.send("⚠️ 无法修改执行策略，若之后出现 'cannot be loaded' 错误，请手动以管理员身份运行：\n   Set-ExecutionPolicy RemoteSigned -Scope CurrentUser\n".to_string());
        }
    }

    let mut cmd = if cfg!(target_os = "windows") {
        let mut c = Command::new("cmd");
        c.args(["/c", "npm install -g @anthropic-ai/claude-code"]);
        #[cfg(target_os = "windows")]
        c.creation_flags(CREATE_NO_WINDOW);
        c
    } else {
        let mut c = Command::new("npm");
        c.args(["install", "-g", "@anthropic-ai/claude-code"]);
        c
    };

    cmd.stdout(Stdio::piped()).stderr(Stdio::piped());

    let mut child = cmd
        .spawn()
        .map_err(|e| format!("启动 npm 安装进程失败: {}", e))?;

    let stdout = child.stdout.take().ok_or("无法获取进程 stdout 句柄")?;
    let stderr = child.stderr.take().ok_or("无法获取进程 stderr 句柄")?;

    let log_sender_out = log_sender.clone();
    let log_sender_err = log_sender;

    // Read stdout
    let out_thread = std::thread::spawn(move || {
        let mut reader = io::BufReader::new(stdout);
        let mut buffer = [0; 512];
        while let Ok(n) = reader.read(&mut buffer) {
            if n == 0 {
                break;
            }
            let text = String::from_utf8_lossy(&buffer[..n]).to_string();
            let _ = log_sender_out.send(text);
        }
    });

    // Read stderr
    let err_thread = std::thread::spawn(move || {
        let mut reader = io::BufReader::new(stderr);
        let mut buffer = [0; 512];
        while let Ok(n) = reader.read(&mut buffer) {
            if n == 0 {
                break;
            }
            let text = String::from_utf8_lossy(&buffer[..n]).to_string();
            let _ = log_sender_err.send(text);
        }
    });

    // Wait loop with cancel check
    loop {
        if cancel_flag.load(Ordering::Relaxed) {
            let _ = child.kill();
            return Err("安装已被用户取消。".to_string());
        }
        match child.try_wait() {
            Ok(Some(status)) => {
                let _ = out_thread.join();
                let _ = err_thread.join();
                if status.success() {
                    return Ok(());
                } else {
                    return Err(format!("安装失败，错误代码: {:?}", status.code()));
                }
            }
            Ok(None) => {
                std::thread::sleep(std::time::Duration::from_millis(100));
            }
            Err(e) => {
                return Err(format!("等待安装进程结束时出错: {}", e));
            }
        }
    }
}

/// Install Claude Code globally with custom prefix
pub fn install_claude_code_with_prefix(
    log_sender: std::sync::mpsc::Sender<String>,
    cancel_flag: Arc<AtomicBool>,
    prefix_path: &str,
) -> Result<(), String> {
    // Fix PowerShell execution policy FIRST to avoid "running scripts is disabled" error
    #[cfg(target_os = "windows")]
    {
        let _ = log_sender.send("🔧 正在检查 PowerShell 执行策略...\n".to_string());
        if fix_powershell_execution_policy() {
            let _ = log_sender.send(
                "✅ PowerShell 执行策略已设置为 RemoteSigned（允许运行 npm 全局脚本）\n"
                    .to_string(),
            );
        } else {
            let _ = log_sender.send("⚠️ 无法修改执行策略，若之后出现 'cannot be loaded' 错误，请手动以管理员身份运行：\n   Set-ExecutionPolicy RemoteSigned -Scope CurrentUser\n".to_string());
        }
    }

    let mut cmd = if cfg!(target_os = "windows") {
        let mut c = Command::new("cmd");
        if prefix_path.is_empty() || prefix_path == "C:\\Program Files\\Claude Code" {
            c.args(["/c", "chcp 65001 >nul 2>&1 && npm install -g @anthropic-ai/claude-code --allow-scripts"]);
        } else {
            c.args([
                "/c",
                &format!(
                    "chcp 65001 >nul 2>&1 && npm install -g @anthropic-ai/claude-code --prefix \"{}\" --allow-scripts",
                    prefix_path
                ),
            ]);
        }
        #[cfg(target_os = "windows")]
        c.creation_flags(CREATE_NO_WINDOW);
        c
    } else {
        let mut c = Command::new("npm");
        if prefix_path.is_empty() || prefix_path == "C:\\Program Files\\Claude Code" {
            c.args(["install", "-g", "@anthropic-ai/claude-code", "--allow-scripts"]);
        } else {
            c.args([
                "install",
                "-g",
                "@anthropic-ai/claude-code",
                "--prefix",
                prefix_path,
                "--allow-scripts",
            ]);
        }
        c
    };

    cmd.stdout(Stdio::piped()).stderr(Stdio::piped());

    let mut child = cmd
        .spawn()
        .map_err(|e| format!("启动 npm 安装进程失败: {}", e))?;

    let stdout = child.stdout.take().ok_or("无法获取进程 stdout 句柄")?;
    let stderr = child.stderr.take().ok_or("无法获取进程 stderr 句柄")?;

    let log_sender_out = log_sender.clone();
    let log_sender_err = log_sender;

    // Read stdout
    let out_thread = std::thread::spawn(move || {
        let mut reader = io::BufReader::new(stdout);
        let mut buffer = [0; 512];
        while let Ok(n) = reader.read(&mut buffer) {
            if n == 0 {
                break;
            }
            let text = String::from_utf8_lossy(&buffer[..n]).to_string();
            let _ = log_sender_out.send(text);
        }
    });

    // Read stderr
    let err_thread = std::thread::spawn(move || {
        let mut reader = io::BufReader::new(stderr);
        let mut buffer = [0; 512];
        while let Ok(n) = reader.read(&mut buffer) {
            if n == 0 {
                break;
            }
            let text = String::from_utf8_lossy(&buffer[..n]).to_string();
            let _ = log_sender_err.send(text);
        }
    });

    // Wait loop with cancel check
    loop {
        if cancel_flag.load(Ordering::Relaxed) {
            let _ = child.kill();
            return Err("安装已被用户取消。".to_string());
        }
        match child.try_wait() {
            Ok(Some(status)) => {
                let _ = out_thread.join();
                let _ = err_thread.join();
                if status.success() {
                    return Ok(());
                } else {
                    return Err(format!("安装失败，错误代码: {:?}", status.code()));
                }
            }
            Ok(None) => {
                std::thread::sleep(std::time::Duration::from_millis(100));
            }
            Err(e) => {
                return Err(format!("等待安装进程结束时出错: {}", e));
            }
        }
    }
}

/// Add directory to user PATH persistently on Windows
pub fn add_to_user_path(path: &str) -> bool {
    #[cfg(target_os = "windows")]
    {
        let script = format!(
            r#"
            $target = "{}"
            $oldPath = [Environment]::GetEnvironmentVariable("PATH", "User")
            if ($oldPath -split ';' -contains $target) {{
                exit 0
            }}
            $newPath = "$oldPath;$target"
            [Environment]::SetEnvironmentVariable("PATH", $newPath, "User")
            "#,
            path
        );
        let mut c = Command::new("powershell");
        c.args(["-NoProfile", "-Command", &script]);
        c.creation_flags(0x08000000); // CREATE_NO_WINDOW
        c.status().map(|s| s.success()).unwrap_or(false)
    }
    #[cfg(not(target_os = "windows"))]
    {
        true
    }
}

/// Create desktop shortcut to open Claude Code on Windows
pub fn create_desktop_shortcut() -> bool {
    #[cfg(target_os = "windows")]
    {
        let script = r#"
        $WshShell = New-Object -ComObject WScript.Shell
        $desktop = [System.Environment]::GetFolderPath([System.Environment+SpecialFolder]::Desktop)
        $Shortcut = $WshShell.CreateShortcut("$desktop\Claude Code.lnk")
        $Shortcut.TargetPath = "cmd.exe"
        $Shortcut.Arguments = "/c start powershell -NoExit claude"
        $Shortcut.IconLocation = "powershell.exe,0"
        $Shortcut.Save()
        "#;
        let mut c = Command::new("powershell");
        c.args(["-NoProfile", "-Command", script]);
        c.creation_flags(0x08000000); // CREATE_NO_WINDOW
        c.status().map(|s| s.success()).unwrap_or(false)
    }
    #[cfg(not(target_os = "windows"))]
    {
        true
    }
}

/// Detect installed Claude Code version (returns None if not installed)
pub fn detect_claude_version() -> Option<String> {
    let output = if cfg!(target_os = "windows") {
        let mut c = Command::new("cmd");
        c.args(["/c", "claude --version"]);
        #[cfg(target_os = "windows")]
        c.creation_flags(CREATE_NO_WINDOW);
        c.output().ok()
    } else {
        Command::new("claude").arg("--version").output().ok()
    };

    output
        .and_then(|out| {
            let raw = String::from_utf8_lossy(&out.stdout).trim().to_string();
            if raw.is_empty() {
                // Some versions print to stderr
                None
            } else {
                Some(raw)
            }
        })
        .or_else(|| {
            // Try npm ls to check if the package is globally installed
            let output = if cfg!(target_os = "windows") {
                let mut c = Command::new("cmd");
                c.args(["/c", "npm ls -g @anthropic-ai/claude-code --depth=0"]);
                #[cfg(target_os = "windows")]
                c.creation_flags(CREATE_NO_WINDOW);
                c.output().ok()
            } else {
                Command::new("npm")
                    .args(["ls", "-g", "@anthropic-ai/claude-code", "--depth=0"])
                    .output()
                    .ok()
            };
            output.and_then(|out| {
                let text = String::from_utf8_lossy(&out.stdout).to_string();
                // Look for "@anthropic-ai/claude-code@x.x.x" in output
                text.lines()
                    .find(|l| l.contains("@anthropic-ai/claude-code"))
                    .and_then(|l| l.split('@').last())
                    .map(|v| v.trim().to_string())
            })
        })
}

/// Uninstall Claude Code globally via npm
pub fn uninstall_claude_code(log_sender: std::sync::mpsc::Sender<String>) -> Result<(), String> {
    let mut cmd = if cfg!(target_os = "windows") {
        let mut c = Command::new("cmd");
        c.args(["/c", "npm uninstall -g @anthropic-ai/claude-code"]);
        #[cfg(target_os = "windows")]
        c.creation_flags(CREATE_NO_WINDOW);
        c
    } else {
        let mut c = Command::new("npm");
        c.args(["uninstall", "-g", "@anthropic-ai/claude-code"]);
        c
    };

    cmd.stdout(Stdio::piped()).stderr(Stdio::piped());

    let mut child = cmd
        .spawn()
        .map_err(|e| format!("启动 npm 卸载进程失败: {}", e))?;

    let stdout = child.stdout.take().ok_or("无法获取进程 stdout 句柄")?;
    let stderr = child.stderr.take().ok_or("无法获取进程 stderr 句柄")?;

    let log_out = log_sender.clone();
    let log_local = log_sender.clone();
    let log_err = log_sender;

    let out_thread = std::thread::spawn(move || {
        let mut reader = io::BufReader::new(stdout);
        let mut buffer = [0; 512];
        while let Ok(n) = reader.read(&mut buffer) {
            if n == 0 {
                break;
            }
            let _ = log_out.send(String::from_utf8_lossy(&buffer[..n]).to_string());
        }
    });

    let err_thread = std::thread::spawn(move || {
        let mut reader = io::BufReader::new(stderr);
        let mut buffer = [0; 512];
        while let Ok(n) = reader.read(&mut buffer) {
            if n == 0 {
                break;
            }
            let _ = log_err.send(String::from_utf8_lossy(&buffer[..n]).to_string());
        }
    });

    match child.wait() {
        Ok(status) => {
            let _ = out_thread.join();
            let _ = err_thread.join();
            if status.success() {
                // Check and physically wipe standalone precompiled binary if exists under .local/bin/claude.exe
                if let Ok(home) = std::env::var("USERPROFILE") {
                    let local_bin_claude = std::path::Path::new(&home)
                        .join(".local")
                        .join("bin")
                        .join("claude.exe");
                    if local_bin_claude.exists() {
                        let _ = log_local.send("🗑️ 检测到系统 PATH 包含本地独立预编译二进制 `.local/bin/claude.exe`，正在物理清除...\n".to_string());
                        if let Err(e) = std::fs::remove_file(&local_bin_claude) {
                            let _ = log_local.send(format!("⚠️ 物理删除本地二进制文件失败: {}\n", e));
                        } else {
                            let _ = log_local.send("✅ 本地独立预编译二进制已被成功物理擦除，环境已彻底净化！\n".to_string());
                        }
                    }
                }
                Ok(())
            } else {
                Err(format!("卸载失败，错误代码: {:?}", status.code()))
            }
        }
        Err(e) => Err(format!("等待卸载进程结束时出错: {}", e)),
    }
}

/// Get latest release version of cc-switch from Github
pub fn fetch_latest_ccswitch_version(github_mirror: &str) -> Result<String, String> {
    // If mirror is set, try fetching through mirror or fall back to direct api if mirror fails
    let url = if github_mirror.is_empty() {
        "https://api.github.com/repos/farion1231/cc-switch/releases/latest".to_string()
    } else {
        // Many Github mirrors do not proxy api.github.com directly, so we try querying a fallback or using a stable direct query.
        // Usually api.github.com is accessible, but if it is blocked, we can parse the latest release version using fallback logic or default to a safe known version.
        "https://api.github.com/repos/farion1231/cc-switch/releases/latest".to_string()
    };

    let client = reqwest::blocking::Client::builder()
        .user_agent("cc-installer-agent")
        .timeout(std::time::Duration::from_secs(5))
        .build()
        .map_err(|e| format!("构建 HTTP 客户端失败: {}", e))?;

    let resp = client
        .get(&url)
        .send()
        .map_err(|e| format!("请求 GitHub API 失败: {}", e))?;

    if resp.status().is_success() {
        let json: serde_json::Value = resp
            .json()
            .map_err(|e| format!("解析 JSON 响应失败: {}", e))?;

        let tag_name = json["tag_name"]
            .as_str()
            .ok_or("JSON 响应中未找到 tag_name")?;

        // Remove 'v' prefix if present
        let version = if let Some(stripped) = tag_name.strip_prefix('v') {
            stripped
        } else {
            &tag_name
        };
        Ok(version.to_string())
    } else {
        Err(format!("GitHub API 返回了错误状态码: {}", resp.status()))
    }
}

/// Download cc-switch installer with progress updates and automatic mirror fallback
pub fn download_ccswitch(
    version: &str,
    preferred_mirror: &str,
    dest_path: &Path,
    progress_sender: std::sync::mpsc::Sender<f32>,
    cancel_flag: Arc<AtomicBool>,
    log_sender: Option<std::sync::mpsc::Sender<String>>,
) -> Result<(), String> {
    let raw_path = format!(
        "https://github.com/farion1231/cc-switch/releases/download/v{}/CC-Switch-v{}-Windows.msi",
        version, version
    );

    // Build the list of mirrors to try: preferred first, then fallbacks, then direct
    let mut mirrors: Vec<&str> = Vec::new();
    if !preferred_mirror.is_empty() {
        mirrors.push(preferred_mirror);
    }
    // Fallback mirrors (excluding the already-added preferred one)
    let fallbacks: &[&str] = &[
        "https://ghfast.top/",
        "https://github.moeyy.xyz/",
        "https://521github.com/",
        "https://gh-proxy.com/",
        "", // direct GitHub as last resort
    ];
    for &fb in fallbacks {
        if fb != preferred_mirror {
            mirrors.push(fb);
        }
    }

    let client = reqwest::blocking::Client::builder()
        .timeout(std::time::Duration::from_secs(60))
        .build()
        .map_err(|e| format!("构建 HTTP 客户端失败: {}", e))?;

    let mut last_err = String::new();

    for mirror in &mirrors {
        if cancel_flag.load(Ordering::Relaxed) {
            return Err("下载已被用户取消。".to_string());
        }

        let url = if mirror.is_empty() {
            raw_path.clone()
        } else {
            format!("{}{}", mirror, raw_path)
        };

        let mirror_name = if mirror.is_empty() {
            "GitHub 官方直连"
        } else {
            mirror
        };
        if let Some(ref tx) = log_sender {
            let _ = tx.send(format!("⏳ 正在尝试镜像: {} ...\n", mirror_name));
        }

        let response = client.get(&url).send();
        match response {
            Err(e) => {
                last_err = format!("镜像 {} 连接失败: {}", mirror_name, e);
                if let Some(ref tx) = log_sender {
                    let _ = tx.send(format!("❌ {} — 切换下一个镜像\n", last_err));
                }
                continue;
            }
            Ok(resp) if !resp.status().is_success() => {
                last_err = format!("镜像 {} 返回错误状态码 {}", mirror_name, resp.status());
                if let Some(ref tx) = log_sender {
                    let _ = tx.send(format!("❌ {} — 切换下一个镜像\n", last_err));
                }
                continue;
            }
            Ok(mut response) => {
                if let Some(ref tx) = log_sender {
                    let _ = tx.send(format!("✅ 镜像可用，开始下载...\n"));
                }

                let total_size = response
                    .headers()
                    .get(reqwest::header::CONTENT_LENGTH)
                    .and_then(|ct_len| ct_len.to_str().ok())
                    .and_then(|s| s.parse::<u64>().ok())
                    .unwrap_or(0);

                let mut file =
                    File::create(dest_path).map_err(|e| format!("无法创建本地目标文件: {}", e))?;

                let mut buffer = vec![0; 8192];
                let mut downloaded: u64 = 0;

                loop {
                    if cancel_flag.load(Ordering::Relaxed) {
                        drop(file);
                        let _ = fs::remove_file(dest_path);
                        return Err("下载已被用户取消。".to_string());
                    }

                    let n = response
                        .read(&mut buffer)
                        .map_err(|e| format!("读取网络数据流失败: {}", e))?;

                    if n == 0 {
                        break;
                    }

                    file.write_all(&buffer[..n])
                        .map_err(|e| format!("写入本地磁盘失败: {}", e))?;

                    downloaded += n as u64;
                    if total_size > 0 {
                        let _ = progress_sender.send(downloaded as f32 / total_size as f32);
                    }
                }

                // Sanity Check: Verify if the file is a valid MSI
                drop(file); // Close file handle first so we can read it

                let mut checker = File::open(dest_path).map_err(|e| format!("校验时无法打开文件: {}", e))?;
                let mut header = [0u8; 4];
                let _ = checker.read_exact(&mut header);
                let file_len = checker.metadata().map(|m| m.len()).unwrap_or(0);

                // OLE Compound Document magic header (MSI files) is: D0 CF 11 E0
                let is_valid_msi = header == [0xD0, 0xCF, 0x11, 0xE0] && file_len > 1_000_000;

                if !is_valid_msi {
                    let _ = fs::remove_file(dest_path);
                    last_err = format!("镜像 {} 下载的文件并非有效的 MSI 文件包 (大小: {} 字节)", mirror_name, file_len);
                    if let Some(ref tx) = log_sender {
                        let _ = tx.send(format!("❌ {} — 切换下一个镜像\n", last_err));
                    }
                    continue;
                }

                return Ok(());
            }
        }
    }

    Err(format!("所有镜像均无法访问，最后错误: {}", last_err))
}

/// Run the downloaded MSI file to install CC-Switch
pub fn run_ccswitch_msi(msi_path: &Path) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x08000000;

        let msi_path_str = msi_path.to_string_lossy().to_string();
        let status = Command::new("msiexec")
            .args(&["/i", &msi_path_str, "/passive", "/norestart"])
            .creation_flags(CREATE_NO_WINDOW)
            .status()
            .map_err(|e| format!("运行 msiexec 进程失败: {}", e))?;

        if status.success() || status.code() == Some(0) || status.code() == Some(3010) {
            Ok(())
        } else {
            Err(format!("msiexec 返回错误代码: {:?}", status.code()))
        }
    }
    #[cfg(not(target_os = "windows"))]
    {
        let _ = msi_path;
        Ok(())
    }
}

/// Download Node.js MSI from a fast domestic mirror with progress reporting
pub fn download_nodejs(
    dest_path: &Path,
    progress_sender: std::sync::mpsc::Sender<f32>,
    cancel_flag: Arc<AtomicBool>,
) -> Result<(), String> {
    let url = "https://npmmirror.com/mirrors/node/v20.18.0/node-v20.18.0-x64.msi";

    let client = reqwest::blocking::Client::builder()
        .timeout(std::time::Duration::from_secs(600))
        .build()
        .map_err(|e| format!("构建 HTTP 客户端失败: {}", e))?;

    let mut response = client
        .get(url)
        .send()
        .map_err(|e| format!("连接镜像站失败: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("镜像站返回错误状态码: {}", response.status()));
    }

    let total_size = response
        .headers()
        .get(reqwest::header::CONTENT_LENGTH)
        .and_then(|ct_len| ct_len.to_str().ok())
        .and_then(|s| s.parse::<u64>().ok())
        .unwrap_or(0);

    let mut file = File::create(dest_path).map_err(|e| format!("无法创建本地临时文件: {}", e))?;

    let mut buffer = vec![0; 8192];
    let mut downloaded: u64 = 0;

    loop {
        if cancel_flag.load(Ordering::Relaxed) {
            drop(file);
            let _ = fs::remove_file(dest_path);
            return Err("下载已被用户取消。".to_string());
        }

        let n = response
            .read(&mut buffer)
            .map_err(|e| format!("读取网络数据流失败: {}", e))?;

        if n == 0 {
            break;
        }

        file.write_all(&buffer[..n])
            .map_err(|e| format!("写入本地磁盘失败: {}", e))?;

        downloaded += n as u64;
    }

    // Sanity Check: Verify if the file is a valid MSI
    drop(file); // Close file handle first so we can read it

    let mut checker = File::open(dest_path).map_err(|e| format!("校验时无法打开文件: {}", e))?;
    let mut header = [0u8; 4];
    let _ = checker.read_exact(&mut header);
    let file_len = checker.metadata().map(|m| m.len()).unwrap_or(0);

    // OLE Compound Document magic header (MSI files) is: D0 CF 11 E0
    let is_valid_msi = header == [0xD0, 0xCF, 0x11, 0xE0] && file_len > 10_000_000;

    if !is_valid_msi {
        let _ = fs::remove_file(dest_path);
        return Err(format!("下载的 Node.js 安装包并非有效的 MSI 文件 (大小: {} 字节)", file_len));
    }

    Ok(())
}

/// Install Node.js from the downloaded MSI silently/passively.
pub fn run_nodejs_installer(msi_path: &Path, custom_dir: Option<&str>) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x08000000;

        let mut args = vec!["/i".to_string(), msi_path.to_string_lossy().to_string()];
        if let Some(dir) = custom_dir {
            if !dir.is_empty() {
                args.push(format!("INSTALLDIR={}", dir));
            }
        }
        args.push("/passive".to_string());
        args.push("/norestart".to_string());

        let status = Command::new("msiexec")
            .args(&args)
            .creation_flags(CREATE_NO_WINDOW)
            .status()
            .map_err(|e| format!("启动 Node.js 安装程序失败: {}", e))?;

        if status.success() || status.code() == Some(0) || status.code() == Some(3010) {
            Ok(())
        } else {
            Err(format!("Node.js 安装失败，退出码: {:?}", status.code()))
        }
    }
    #[cfg(not(target_os = "windows"))]
    {
        let _ = msi_path;
        let _ = custom_dir;
        Ok(())
    }
}

/// Write all configurations to ~/.claude/settings.json
pub fn configure_claude_settings(
    base_url: &str,
    api_key: &str,
    model: &str,
    always_thinking: bool,
    max_thinking_tokens: i32,
    disable_auto_compact: bool,
    max_output_tokens: i32,
    max_context_length: i32,
    enable_auto_updater: bool,
    http_proxy: &str,
    no_proxy: &str,
    auto_accept_edits: bool,
    theme: &str,
) -> Result<(), String> {
    let settings_dir = get_claude_settings_path()?;
    if !settings_dir.exists() {
        fs::create_dir_all(&settings_dir).map_err(|e| format!("无法创建 .claude 目录: {}", e))?;
    }

    let file_path = settings_dir.join("settings.json");
    let mut config: serde_json::Value = if file_path.exists() {
        let content =
            fs::read_to_string(&file_path).map_err(|e| format!("无法读取 settings.json: {}", e))?;
        serde_json::from_str(&content).unwrap_or(serde_json::json!({}))
    } else {
        serde_json::json!({})
    };

    if !config.is_object() {
        config = serde_json::json!({});
    }

    // Set model
    if model.is_empty() {
        config.as_object_mut().unwrap().remove("model");
    } else {
        config
            .as_object_mut()
            .unwrap()
            .insert("model".to_string(), serde_json::json!(model));
    }

    // Set alwaysThinkingEnabled
    config.as_object_mut().unwrap().insert(
        "alwaysThinkingEnabled".to_string(),
        serde_json::json!(always_thinking),
    );

    // Set theme
    if theme.is_empty() || theme == "auto" {
        config.as_object_mut().unwrap().remove("theme");
    } else {
        config
            .as_object_mut()
            .unwrap()
            .insert("theme".to_string(), serde_json::json!(theme));
    }

    // Set permissions.defaultMode
    if auto_accept_edits {
        let has_perm = config
            .get("permissions")
            .map(|p| p.is_object())
            .unwrap_or(false);
        if !has_perm {
            config
                .as_object_mut()
                .unwrap()
                .insert("permissions".to_string(), serde_json::json!({}));
        }
        config
            .get_mut("permissions")
            .unwrap()
            .as_object_mut()
            .unwrap()
            .insert("defaultMode".to_string(), serde_json::json!("acceptEdits"));
    } else {
        if let Some(permissions) = config.get_mut("permissions") {
            if let Some(permissions_obj) = permissions.as_object_mut() {
                permissions_obj.remove("defaultMode");
            }
        }
    }

    // Ensure "env" object exists
    let has_env = config.get("env").map(|e| e.is_object()).unwrap_or(false);
    if !has_env {
        config
            .as_object_mut()
            .unwrap()
            .insert("env".to_string(), serde_json::json!({}));
    }

    // Insert keys inside env
    let env_obj = config.get_mut("env").unwrap().as_object_mut().unwrap();

    // Set base URL
    if base_url.is_empty() {
        env_obj.remove("ANTHROPIC_BASE_URL");
    } else {
        env_obj.insert(
            "ANTHROPIC_BASE_URL".to_string(),
            serde_json::json!(base_url),
        );
    }

    // Set API key — write both field names for maximum compatibility
    // ANTHROPIC_API_KEY: Claude Code native field
    // ANTHROPIC_AUTH_TOKEN: CCSwitch-injected field (also accepted by some providers)
    if api_key.is_empty() {
        env_obj.remove("ANTHROPIC_API_KEY");
        env_obj.remove("ANTHROPIC_AUTH_TOKEN");
    } else {
        env_obj.insert("ANTHROPIC_API_KEY".to_string(), serde_json::json!(api_key));
        env_obj.insert(
            "ANTHROPIC_AUTH_TOKEN".to_string(),
            serde_json::json!(api_key),
        );
    }

    // Set ANTHROPIC_MODEL env var
    if model.is_empty() {
        env_obj.remove("ANTHROPIC_MODEL");
    } else {
        env_obj.insert("ANTHROPIC_MODEL".to_string(), serde_json::json!(model));
    }

    // Set MAX_THINKING_TOKENS
    if max_thinking_tokens == 0 {
        env_obj.remove("MAX_THINKING_TOKENS");
    } else {
        env_obj.insert(
            "MAX_THINKING_TOKENS".to_string(),
            serde_json::json!(max_thinking_tokens.to_string()),
        );
    }

    // Set MAX_OUTPUT_TOKENS
    if max_output_tokens == 0 {
        env_obj.remove("MAX_OUTPUT_TOKENS");
    } else {
        env_obj.insert(
            "MAX_OUTPUT_TOKENS".to_string(),
            serde_json::json!(max_output_tokens),
        );
    }

    // Set DISABLE_AUTO_COMPACT
    if disable_auto_compact {
        env_obj.insert(
            "DISABLE_AUTO_COMPACT".to_string(),
            serde_json::json!("true"),
        );
    } else {
        env_obj.remove("DISABLE_AUTO_COMPACT");
    }

    // Set HTTP_PROXY & HTTPS_PROXY
    if http_proxy.is_empty() {
        env_obj.remove("HTTP_PROXY");
        env_obj.remove("HTTPS_PROXY");
    } else {
        env_obj.insert("HTTP_PROXY".to_string(), serde_json::json!(http_proxy));
        env_obj.insert("HTTPS_PROXY".to_string(), serde_json::json!(http_proxy));
    }

    // Set NO_PROXY
    if no_proxy.is_empty() {
        env_obj.remove("NO_PROXY");
    } else {
        env_obj.insert("NO_PROXY".to_string(), serde_json::json!(no_proxy));
    }

    // Skip introduction
    config
        .as_object_mut()
        .unwrap()
        .insert("skipIntroduction".to_string(), serde_json::json!(true));

    // Set claudeCodeMaxContextLength (0 = use default)
    if max_context_length == 0 {
        config
            .as_object_mut()
            .unwrap()
            .remove("claudeCodeMaxContextLength");
    } else {
        config.as_object_mut().unwrap().insert(
            "claudeCodeMaxContextLength".to_string(),
            serde_json::json!(max_context_length),
        );
    }

    // Set enableAutoUpdater
    config.as_object_mut().unwrap().insert(
        "enableAutoUpdater".to_string(),
        serde_json::json!(enable_auto_updater),
    );

    let updated_content =
        serde_json::to_string_pretty(&config).map_err(|e| format!("序列化 JSON 失败: {}", e))?;

    fs::write(&file_path, updated_content)
        .map_err(|e| format!("写入 settings.json 失败: {}", e))?;

    Ok(())
}

/// Get current alwaysThinkingEnabled configuration
pub fn get_current_always_thinking() -> bool {
    let settings_dir = get_claude_settings_path().ok();
    let file_path = settings_dir.map(|d| d.join("settings.json"));
    if let Some(ref path) = file_path {
        if path.exists() {
            if let Ok(content) = fs::read_to_string(path) {
                if let Ok(config) = serde_json::from_str::<serde_json::Value>(&content) {
                    return config
                        .get("alwaysThinkingEnabled")
                        .and_then(|v| v.as_bool())
                        .unwrap_or(false);
                }
            }
        }
    }
    false
}

/// Get current MAX_THINKING_TOKENS configuration (returns 0 if not set)
pub fn get_current_max_thinking_tokens() -> i32 {
    let settings_dir = get_claude_settings_path().ok();
    let file_path = settings_dir.map(|d| d.join("settings.json"));
    if let Some(ref path) = file_path {
        if path.exists() {
            if let Ok(content) = fs::read_to_string(path) {
                if let Ok(config) = serde_json::from_str::<serde_json::Value>(&content) {
                    let raw = config
                        .get("env")
                        .and_then(|env| env.get("MAX_THINKING_TOKENS"))
                        .and_then(|v| v.as_str())
                        .unwrap_or("");
                    return raw.parse::<i32>().unwrap_or(0);
                }
            }
        }
    }
    0
}

/// Get current MAX_OUTPUT_TOKENS configuration (returns 0 if not set)
pub fn get_current_max_output_tokens() -> i32 {
    let settings_dir = get_claude_settings_path().ok();
    let file_path = settings_dir.map(|d| d.join("settings.json"));
    if let Some(ref path) = file_path {
        if path.exists() {
            if let Ok(content) = fs::read_to_string(path) {
                if let Ok(config) = serde_json::from_str::<serde_json::Value>(&content) {
                    // Try int first then string
                    if let Some(v) = config
                        .get("env")
                        .and_then(|env| env.get("MAX_OUTPUT_TOKENS"))
                    {
                        if let Some(n) = v.as_i64() {
                            return n as i32;
                        }
                        if let Some(s) = v.as_str() {
                            return s.parse::<i32>().unwrap_or(0);
                        }
                    }
                }
            }
        }
    }
    0
}

/// Get current claudeCodeMaxContextLength configuration (returns 0 if not set)
pub fn get_current_max_context_length() -> i32 {
    let settings_dir = get_claude_settings_path().ok();
    let file_path = settings_dir.map(|d| d.join("settings.json"));
    if let Some(ref path) = file_path {
        if path.exists() {
            if let Ok(content) = fs::read_to_string(path) {
                if let Ok(config) = serde_json::from_str::<serde_json::Value>(&content) {
                    if let Some(v) = config.get("claudeCodeMaxContextLength") {
                        if let Some(n) = v.as_i64() {
                            return n as i32;
                        }
                    }
                }
            }
        }
    }
    0
}

/// Get current enableAutoUpdater configuration (returns true if not set)
pub fn get_current_enable_auto_updater() -> bool {
    let settings_dir = get_claude_settings_path().ok();
    let file_path = settings_dir.map(|d| d.join("settings.json"));
    if let Some(ref path) = file_path {
        if path.exists() {
            if let Ok(content) = fs::read_to_string(path) {
                if let Ok(config) = serde_json::from_str::<serde_json::Value>(&content) {
                    return config
                        .get("enableAutoUpdater")
                        .and_then(|v| v.as_bool())
                        .unwrap_or(true);
                }
            }
        }
    }
    true
}

/// Get current DISABLE_AUTO_COMPACT configuration
pub fn get_current_disable_auto_compact() -> bool {
    let settings_dir = get_claude_settings_path().ok();
    let file_path = settings_dir.map(|d| d.join("settings.json"));
    if let Some(ref path) = file_path {
        if path.exists() {
            if let Ok(content) = fs::read_to_string(path) {
                if let Ok(config) = serde_json::from_str::<serde_json::Value>(&content) {
                    let val = config
                        .get("env")
                        .and_then(|env| env.get("DISABLE_AUTO_COMPACT"))
                        .and_then(|v| v.as_str())
                        .unwrap_or("false");
                    return val == "true";
                }
            }
        }
    }
    false
}

/// Get current HTTP_PROXY/HTTPS_PROXY configuration
pub fn get_current_http_proxy() -> String {
    let settings_dir = get_claude_settings_path().ok();
    let file_path = settings_dir.map(|d| d.join("settings.json"));
    if let Some(ref path) = file_path {
        if path.exists() {
            if let Ok(content) = fs::read_to_string(path) {
                if let Ok(config) = serde_json::from_str::<serde_json::Value>(&content) {
                    return config
                        .get("env")
                        .and_then(|env| env.get("HTTPS_PROXY").or_else(|| env.get("HTTP_PROXY")))
                        .and_then(|v| v.as_str())
                        .unwrap_or("")
                        .to_string();
                }
            }
        }
    }
    String::new()
}

/// Get current NO_PROXY configuration
pub fn get_current_no_proxy() -> String {
    let settings_dir = get_claude_settings_path().ok();
    let file_path = settings_dir.map(|d| d.join("settings.json"));
    if let Some(ref path) = file_path {
        if path.exists() {
            if let Ok(content) = fs::read_to_string(path) {
                if let Ok(config) = serde_json::from_str::<serde_json::Value>(&content) {
                    return config
                        .get("env")
                        .and_then(|env| env.get("NO_PROXY"))
                        .and_then(|v| v.as_str())
                        .unwrap_or("")
                        .to_string();
                }
            }
        }
    }
    String::new()
}

/// Get current auto-accept edits configuration
pub fn get_current_auto_accept_edits() -> bool {
    let settings_dir = get_claude_settings_path().ok();
    let file_path = settings_dir.map(|d| d.join("settings.json"));
    if let Some(ref path) = file_path {
        if path.exists() {
            if let Ok(content) = fs::read_to_string(path) {
                if let Ok(config) = serde_json::from_str::<serde_json::Value>(&content) {
                    return config
                        .get("permissions")
                        .and_then(|p| p.get("defaultMode"))
                        .and_then(|m| m.as_str())
                        .map(|m| m == "acceptEdits")
                        .unwrap_or(false);
                }
            }
        }
    }
    false
}

/// Get current theme configuration
pub fn get_current_theme() -> String {
    let settings_dir = get_claude_settings_path().ok();
    let file_path = settings_dir.map(|d| d.join("settings.json"));
    if let Some(ref path) = file_path {
        if path.exists() {
            if let Ok(content) = fs::read_to_string(path) {
                if let Ok(config) = serde_json::from_str::<serde_json::Value>(&content) {
                    return config
                        .get("theme")
                        .and_then(|v| v.as_str())
                        .unwrap_or("auto")
                        .to_string();
                }
            }
        }
    }
    "auto".to_string()
}

/// Get current ANTHROPIC_BASE_URL configuration
pub fn get_current_base_url() -> Option<String> {
    let settings_dir = get_claude_settings_path().ok()?;
    let file_path = settings_dir.join("settings.json");
    if !file_path.exists() {
        return None;
    }

    let content = fs::read_to_string(file_path).ok()?;
    let config: serde_json::Value = serde_json::from_str(&content).ok()?;

    config
        .get("env")
        .and_then(|env| env.get("ANTHROPIC_BASE_URL"))
        .and_then(|url| url.as_str())
        .map(|s| s.to_string())
}

/// Get current ANTHROPIC_API_KEY configuration (also falls back to ANTHROPIC_AUTH_TOKEN)
pub fn get_current_api_key() -> Option<String> {
    let settings_dir = get_claude_settings_path().ok()?;
    let file_path = settings_dir.join("settings.json");
    if !file_path.exists() {
        return None;
    }

    let content = fs::read_to_string(file_path).ok()?;
    let config: serde_json::Value = serde_json::from_str(&content).ok()?;

    // Try ANTHROPIC_API_KEY first, then fall back to ANTHROPIC_AUTH_TOKEN
    // (CCSwitch may have written only ANTHROPIC_AUTH_TOKEN)
    let env = config.get("env")?;
    if let Some(key) = env
        .get("ANTHROPIC_API_KEY")
        .and_then(|v| v.as_str())
        .filter(|s| !s.is_empty())
    {
        return Some(key.to_string());
    }
    env.get("ANTHROPIC_AUTH_TOKEN")
        .and_then(|v| v.as_str())
        .filter(|s| !s.is_empty())
        .map(|s| s.to_string())
}

/// Fetch Ollama models list from a custom address (e.g. http://localhost:11434)
pub fn fetch_ollama_models_at(base_url: &str) -> Vec<String> {
    let clean_url = format!("{}/api/tags", base_url.trim_end_matches('/'));

    let client = reqwest::blocking::Client::builder()
        .timeout(std::time::Duration::from_millis(600)) // 600ms timeout
        .build();

    let client = match client {
        Ok(c) => c,
        Err(_) => return Vec::new(),
    };

    let resp = client.get(&clean_url).send();
    let resp = match resp {
        Ok(r) => r,
        Err(_) => return Vec::new(),
    };

    if resp.status().is_success() {
        let json: serde_json::Value = match resp.json() {
            Ok(j) => j,
            Err(_) => return Vec::new(),
        };

        let mut models = Vec::new();
        if let Some(models_array) = json["models"].as_array() {
            for m in models_array {
                if let Some(name) = m["name"].as_str() {
                    models.push(name.to_string());
                }
            }
        }
        models
    } else {
        Vec::new()
    }
}

/// Fetch OpenAI-compatible models list (vLLM, Unsloth, LM Studio, Llama.cpp) from a custom address (e.g. http://localhost:8000)
pub fn fetch_openai_compat_models_at(base_url: &str) -> Vec<String> {
    let base_trimmed = base_url.trim_end_matches('/');
    let urls = vec![
        format!("{}/v1/models", base_trimmed),
        format!("{}/models", base_trimmed),
    ];

    let client = reqwest::blocking::Client::builder()
        .timeout(std::time::Duration::from_millis(600))
        .build();

    let client = match client {
        Ok(c) => c,
        Err(_) => return Vec::new(),
    };

    for url in urls {
        let resp = client.get(&url).send();
        let resp = match resp {
            Ok(r) => r,
            Err(_) => continue,
        };

        if resp.status().is_success() {
            let json: serde_json::Value = match resp.json() {
                Ok(j) => j,
                Err(_) => continue,
            };

            let mut models = Vec::new();
            if let Some(data_array) = json["data"].as_array() {
                for m in data_array {
                    if let Some(id) = m["id"].as_str() {
                        models.push(id.to_string());
                    }
                }
            }
            if !models.is_empty() {
                return models;
            }
        }
    }
    Vec::new()
}

/// Get current default model configuration
pub fn get_current_model() -> Option<String> {
    let settings_dir = get_claude_settings_path().ok()?;
    let file_path = settings_dir.join("settings.json");
    if !file_path.exists() {
        return None;
    }

    let content = fs::read_to_string(file_path).ok()?;
    let config: serde_json::Value = serde_json::from_str(&content).ok()?;

    config
        .get("model")
        .and_then(|m| m.as_str())
        .map(|s| s.to_string())
}

/// Try to detect and launch CC-Switch desktop application
pub fn launch_ccswitch() -> Result<(), String> {
    use std::process::Command;

    if let Some(path) = find_ccswitch_path() {
        let _ = Command::new(path)
            .spawn()
            .map_err(|e| format!("无法启动 CC-Switch: {}", e))?;
        Ok(())
    } else {
        // Fail cleanly rather than spawning cmd start which throws Windows OS popups
        Err("未在您的任何本地磁盘分区上检测到 CC-Switch。请检查安装路径。".to_string())
    }
}

/// Query the real listening port configured for Claude Code proxy inside CC-Switch SQLite DB.
pub fn get_ccswitch_proxy_port() -> u16 {
    let user_profile =
        std::env::var("USERPROFILE").unwrap_or_else(|_| r"C:\Users\Administrator".to_string());
    let db_path = std::path::PathBuf::from(&user_profile)
        .join(".cc-switch")
        .join("cc-switch.db");

    if !db_path.exists() {
        return 9090; // Default fallback
    }

    if let Ok(conn) = rusqlite::Connection::open(&db_path) {
        if let Ok(port) = conn.query_row(
            "SELECT listen_port FROM proxy_config WHERE app_type = 'claude'",
            [],
            |row: &rusqlite::Row| row.get::<_, u16>(0),
        ) {
            return port;
        }
    }
    9090
}

/// Automatically configure active provider inside CC-Switch's local SQLite database and settings.json
pub fn sync_to_ccswitch(base_url: &str, api_key: &str, model_name: &str) -> Result<(), String> {
    use std::fs;
    use std::path::PathBuf;
    use std::process::Command;

    let user_profile =
        std::env::var("USERPROFILE").unwrap_or_else(|_| r"C:\Users\Administrator".to_string());
    let db_path = PathBuf::from(&user_profile)
        .join(".cc-switch")
        .join("cc-switch.db");
    let settings_path = PathBuf::from(&user_profile)
        .join(".cc-switch")
        .join("settings.json");

    if !db_path.exists() {
        // If CC-Switch is not installed, skip silently
        return Ok(());
    }

    // 1. Force stop running CC-Switch process to release database lock
    let _ = Command::new("powershell")
        .args([
            "-Command",
            "Stop-Process -Name 'cc-switch' -Force -ErrorAction SilentlyContinue",
        ])
        .status();

    // Give it a brief moment to release file handles
    std::thread::sleep(std::time::Duration::from_millis(500));

    // 2. Insert or update custom provider in SQLite
    let conn = rusqlite::Connection::open(&db_path)
        .map_err(|e| format!("无法打开 CC-Switch 数据库: {}", e))?;

    let provider_id = "cc-installer-auto";
    let app_type = "claude";
    let provider_name = "本地一键导入 (CC-Installer)";

    let settings_config = serde_json::json!({
        "env": {
            "ANTHROPIC_AUTH_TOKEN": api_key,
            "ANTHROPIC_BASE_URL": base_url,
            "ANTHROPIC_MODEL": model_name
        }
    })
    .to_string();

    let exists: bool = conn
        .query_row(
            "SELECT EXISTS(SELECT 1 FROM providers WHERE id=?1 AND app_type=?2)",
            rusqlite::params![provider_id, app_type],
            |row| row.get(0),
        )
        .unwrap_or(false);

    if exists {
        conn.execute(
            "UPDATE providers SET name=?1, settings_config=?2, is_current=1 WHERE id=?3 AND app_type=?4",
            rusqlite::params![provider_name, &settings_config, provider_id, app_type]
        ).map_err(|e| format!("更新 CC-Switch 渠道失败: {}", e))?;
    } else {
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_millis() as i64;

        conn.execute(
            "INSERT INTO providers (id, app_type, name, settings_config, is_current, category, provider_type, meta, created_at) VALUES (?1, ?2, ?3, ?4, 1, 'custom', 'custom', '{}', ?5)",
            rusqlite::params![provider_id, app_type, provider_name, &settings_config, now]
        ).map_err(|e| format!("新增 CC-Switch 渠道失败: {}", e))?;
    }

    // 3. Deactivate other Claude providers inside CC-Switch
    conn.execute(
        "UPDATE providers SET is_current=0 WHERE id != ?1 AND app_type=?2",
        rusqlite::params![provider_id, app_type],
    )
    .map_err(|e| format!("停用其他 CC-Switch 渠道失败: {}", e))?;

    // Enable local proxy takeover inside CCSwitch database to turn the GUI switch ON
    let _ = conn.execute(
        "UPDATE proxy_config SET enabled = 1, proxy_enabled = 1 WHERE app_type = 'claude'",
        [],
    );

    // 4. Update currentProviderClaude in settings.json to match our ID
    if settings_path.exists() {
        if let Ok(content) = fs::read_to_string(&settings_path) {
            if let Ok(mut settings) = serde_json::from_str::<serde_json::Value>(&content) {
                if let Some(obj) = settings.as_object_mut() {
                    obj.insert(
                        "currentProviderClaude".to_string(),
                        serde_json::Value::String(provider_id.to_string()),
                    );
                    obj.insert(
                        "enableLocalProxy".to_string(),
                        serde_json::Value::Bool(true),
                    );
                    if let Ok(new_content) = serde_json::to_string_pretty(&settings) {
                        let _ = fs::write(&settings_path, new_content);
                    }
                }
            }
        }
    }

    // 5. Restart CC-Switch in background
    let _ = launch_ccswitch();

    Ok(())
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct UpdateInfo {
    pub version: String,
    pub download_url: String,
    pub changelog: String,
}

/// Helper function to parse semantic version parts (major, minor, patch)
fn parse_version(v: &str) -> (u32, u32, u32) {
    let cleaned = v.trim().trim_start_matches('v');
    let parts: Vec<u32> = cleaned
        .split('.')
        .filter_map(|s| s.parse::<u32>().ok())
        .collect();
    (
        parts.get(0).copied().unwrap_or(0),
        parts.get(1).copied().unwrap_or(0),
        parts.get(2).copied().unwrap_or(0),
    )
}

/// Compare semantic version numbers. Returns true if remote is newer than current.
pub fn is_newer_version(remote: &str, current: &str) -> bool {
    parse_version(remote) > parse_version(current)
}

/// Fetch version information from Gitee/GitHub mirror raw URL
pub fn check_for_update(url: &str) -> Result<Option<UpdateInfo>, String> {
    let client = reqwest::blocking::Client::builder()
        .timeout(std::time::Duration::from_secs(10))
        .build()
        .map_err(|e| format!("构建 HTTP 客户端失败: {}", e))?;

    let response = client
        .get(url)
        .send()
        .map_err(|e| format!("无法连接更新服务器: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("更新服务器返回错误状态码: {}", response.status()));
    }

    let text = response
        .text()
        .map_err(|e| format!("读取更新信息失败: {}", e))?;

    // Strip UTF-8 BOM if present
    let cleaned = text.trim_start_matches('\u{FEFF}');

    let info: UpdateInfo =
        serde_json::from_str(cleaned).map_err(|e| format!("解析版本 JSON 失败: {}", e))?;

    let current = env!("CARGO_PKG_VERSION");
    if is_newer_version(&info.version, current) {
        Ok(Some(info))
    } else {
        Ok(None)
    }
}

/// Downloads the new binary to a temp directory, and writes a self-replace batch script to execute it.
pub fn apply_update(
    download_url: &str,
    progress_sender: std::sync::mpsc::Sender<f32>,
    cancel_flag: Arc<AtomicBool>,
) -> Result<(), String> {
    let temp_dir = std::env::temp_dir();
    let new_exe_path = temp_dir.join("cc-installer-update.exe");

    // 1. Download the new binary
    let client = reqwest::blocking::Client::builder()
        .timeout(std::time::Duration::from_secs(600))
        .build()
        .map_err(|e| format!("构建 HTTP 客户端失败: {}", e))?;

    let mut response = client
        .get(download_url)
        .send()
        .map_err(|e| format!("连接下载地址失败: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("下载服务器返回错误状态码: {}", response.status()));
    }

    let total_size = response
        .headers()
        .get(reqwest::header::CONTENT_LENGTH)
        .and_then(|ct_len| ct_len.to_str().ok())
        .and_then(|s| s.parse::<u64>().ok())
        .unwrap_or(0);

    let mut file =
        File::create(&new_exe_path).map_err(|e| format!("无法创建本地临时文件: {}", e))?;

    let mut buffer = vec![0; 8192];
    let mut downloaded: u64 = 0;

    loop {
        if cancel_flag.load(Ordering::Relaxed) {
            drop(file);
            let _ = fs::remove_file(&new_exe_path);
            return Err("下载已被用户取消。".to_string());
        }

        let n = response
            .read(&mut buffer)
            .map_err(|e| format!("读取网络数据流失败: {}", e))?;

        if n == 0 {
            break;
        }

        file.write_all(&buffer[..n])
            .map_err(|e| format!("写入本地磁盘失败: {}", e))?;

        downloaded += n as u64;
        if total_size > 0 {
            let _ = progress_sender.send(downloaded as f32 / total_size as f32);
        }
    }

    drop(file);

    // 2. Perform self-replacement and restart using batch script
    #[cfg(target_os = "windows")]
    {
        let current_exe =
            std::env::current_exe().map_err(|e| format!("获取当前可执行文件路径失败: {}", e))?;

        let bat_content = format!(
            r#"@echo off
timeout /t 1 /nobreak >nul
move /y "{tmp}" "{cur}"
start "" "{cur}"
del "%~f0""#,
            tmp = new_exe_path.to_string_lossy(),
            cur = current_exe.to_string_lossy(),
        );

        let bat_path = temp_dir.join("cc-installer-self-update.bat");
        fs::write(&bat_path, bat_content).map_err(|e| format!("写入自我更新批处理失败: {}", e))?;

        // Launch the batch script silently in background
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x08000000;

        Command::new("cmd")
            .args(["/c", &bat_path.to_string_lossy()])
            .creation_flags(CREATE_NO_WINDOW)
            .spawn()
            .map_err(|e| format!("启动自我更新程序失败: {}", e))?;

        // Exit this process immediately
        std::process::exit(0);
    }

    #[cfg(not(target_os = "windows"))]
    {
        Ok(())
    }
}

/// Open folder dialog using PowerShell FolderBrowserDialog on Windows
pub fn select_folder() -> Option<String> {
    #[cfg(target_os = "windows")]
    {
        let script = r#"
        Add-Type -AssemblyName System.Windows.Forms
        $dialog = New-Object System.Windows.Forms.FolderBrowserDialog
        $dialog.Description = '请选择 Claude Code 安装路径'
        $dialog.ShowNewFolderButton = $true
        if ($dialog.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) {
            Write-Output $dialog.SelectedPath
        }
        "#;
        let mut c = Command::new("powershell");
        c.args(["-NoProfile", "-Command", script]);
        c.creation_flags(0x08000000); // CREATE_NO_WINDOW
        let output = c.output().ok()?;
        if output.status.success() {
            let path = String::from_utf8_lossy(&output.stdout).trim().to_string();
            if !path.is_empty() {
                return Some(path);
            }
        }
        None
    }
    #[cfg(not(target_os = "windows"))]
    {
        None
    }
}

/// Dynamically query Windows Registry for the latest User and Machine PATH variables,
/// and refresh the current process's PATH environment variable.
pub fn refresh_process_path() {
    #[cfg(target_os = "windows")]
    {
        use std::process::Command;
        // Query combined Path from both Machine and User environments
        let script = "[System.Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' + [System.Environment]::GetEnvironmentVariable('Path', 'User')";
        let mut c = Command::new("powershell");
        c.args(["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command", script]);
        c.creation_flags(0x08000000); // CREATE_NO_WINDOW
        if let Ok(output) = c.output() {
            let combined_path = String::from_utf8_lossy(&output.stdout).trim().to_string();
            if !combined_path.is_empty() {
                // Update the current process's PATH
                std::env::set_var("PATH", combined_path);
            }
        }
    }
}

#[cfg(test)]
mod tests {
    #[test]
    fn test_update() {
        let url =
            "https://gitee.com/zxcv2121651/cc-installer-releases/raw/master/installer_version.json";
        match super::check_for_update(url) {
            Ok(info) => println!("Success: {:?}", info),
            Err(e) => println!("Failed: {}", e),
        }
    }
}

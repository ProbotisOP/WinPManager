const { exec } = require('child_process');
const portEngine = require('../electron/portEngine.cjs');

/**
 * Show a native Windows dark-themed popup dialog asking the user to kill the blocked port
 */
function showConflictPopup(port, processInfo = null) {
  return new Promise((resolve) => {
    const procName = processInfo?.processName || 'Unknown Process';
    const pid = processInfo?.pid || 'Unknown';
    const project = processInfo?.projectName ? `Project: ${processInfo.projectName}` : '';

    const psScript = `
Add-Type -AssemblyName PresentationFramework, PresentationCore, WindowsBase

$window = New-Object Windows.Window
$window.Title = "WinPManager - Port Conflict"
$window.Width = 420
$window.Height = 260
$window.WindowStartupLocation = "CenterScreen"
$window.ResizeMode = "NoResize"
$window.Topmost = $true
$window.Background = [Windows.Media.BrushConverter]::new().ConvertFromString("#0f1118")

# Root Grid
$grid = New-Object Windows.Controls.Grid
$grid.Margin = New-Object Windows.Thickness(20)

# Rows
$r1 = New-Object Windows.Controls.RowDefinition; $r1.Height = New-Object Windows.GridLength(1, [Windows.GridUnitType]::Auto)
$r2 = New-Object Windows.Controls.RowDefinition; $r2.Height = New-Object Windows.GridLength(1, [Windows.GridUnitType]::Star)
$r3 = New-Object Windows.Controls.RowDefinition; $r3.Height = New-Object Windows.GridLength(1, [Windows.GridUnitType]::Auto)
$grid.RowDefinitions.Add($r1)
$grid.RowDefinitions.Add($r2)
$grid.RowDefinitions.Add($r3)

# Title & Badge
$titlePanel = New-Object Windows.Controls.StackPanel
$titlePanel.Orientation = "Horizontal"

$badge = New-Object Windows.Controls.Border
$badge.Background = [Windows.Media.BrushConverter]::new().ConvertFromString("#7f1d1d")
$badge.CornerRadius = New-Object Windows.CornerRadius(4)
$badge.Padding = New-Object Windows.Thickness(6, 2, 6, 2)
$badge.Margin = New-Object Windows.Thickness(0, 0, 10, 0)
$badgeText = New-Object Windows.Controls.TextBlock
$badgeText.Text = "EADDRINUSE"
$badgeText.Foreground = [Windows.Media.BrushConverter]::new().ConvertFromString("#fca5a5")
$badgeText.FontWeight = "Bold"
$badgeText.FontSize = 11
$badge.Child = $badgeText

$title = New-Object Windows.Controls.TextBlock
$title.Text = "Port ${port} is Already in Use"
$title.Foreground = [Windows.Media.BrushConverter]::new().ConvertFromString("#f4f4f5")
$title.FontWeight = "Bold"
$title.FontSize = 15
$titlePanel.Children.Add($badge)
$titlePanel.Children.Add($title)
[Windows.Controls.Grid]::SetRow($titlePanel, 0)
$grid.Children.Add($titlePanel)

# Description Box
$descBox = New-Object Windows.Controls.Border
$descBox.Background = [Windows.Media.BrushConverter]::new().ConvertFromString("#181a26")
$descBox.BorderBrush = [Windows.Media.BrushConverter]::new().ConvertFromString("#27293a")
$descBox.BorderThickness = New-Object Windows.Thickness(1)
$descBox.CornerRadius = New-Object Windows.CornerRadius(6)
$descBox.Padding = New-Object Windows.Thickness(12)
$descBox.Margin = New-Object Windows.Thickness(0, 14, 0, 14)

$descPanel = New-Object Windows.Controls.StackPanel

$line1 = New-Object Windows.Controls.TextBlock
$line1.Text = "Blocked by: ${procName} (PID: ${pid})"
$line1.Foreground = [Windows.Media.BrushConverter]::new().ConvertFromString("#e4e4e7")
$line1.FontFamily = New-Object Windows.Media.FontFamily("Consolas")
$line1.FontSize = 13
$descPanel.Children.Add($line1)

if ("${project}") {
    $line2 = New-Object Windows.Controls.TextBlock
    $line2.Text = "${project}"
    $line2.Foreground = [Windows.Media.BrushConverter]::new().ConvertFromString("#a1a1aa")
    $line2.FontSize = 12
    $line2.Margin = New-Object Windows.Thickness(0, 4, 0, 0)
    $descPanel.Children.Add($line2)
}

$line3 = New-Object Windows.Controls.TextBlock
$line3.Text = "Would you like to terminate the process tree now?"
$line3.Foreground = [Windows.Media.BrushConverter]::new().ConvertFromString("#71717a")
$line3.FontSize = 11
$line3.Margin = New-Object Windows.Thickness(0, 6, 0, 0)
$descPanel.Children.Add($line3)

$descBox.Child = $descPanel
[Windows.Controls.Grid]::SetRow($descBox, 1)
$grid.Children.Add($descBox)

# Buttons Panel
$btnPanel = New-Object Windows.Controls.StackPanel
$btnPanel.Orientation = "Horizontal"
$btnPanel.HorizontalAlignment = "Right"

# Cancel Button
$btnCancel = New-Object Windows.Controls.Button
$btnCancel.Content = "Ignore"
$btnCancel.Width = 80
$btnCancel.Height = 32
$btnCancel.Margin = New-Object Windows.Thickness(0, 0, 8, 0)
$btnCancel.Background = [Windows.Media.BrushConverter]::new().ConvertFromString("#27272a")
$btnCancel.Foreground = [Windows.Media.BrushConverter]::new().ConvertFromString("#d4d4d8")
$btnCancel.BorderThickness = New-Object Windows.Thickness(0)
$btnCancel.Add_Click({
    $window.Tag = "ignore"
    $window.Close()
})
$btnPanel.Children.Add($btnCancel)

# Kill Button
$btnKill = New-Object Windows.Controls.Button
$btnKill.Content = "Kill Port ${port}"
$btnKill.Width = 120
$btnKill.Height = 32
$btnKill.Background = [Windows.Media.BrushConverter]::new().ConvertFromString("#dc2626")
$btnKill.Foreground = [Windows.Media.BrushConverter]::new().ConvertFromString("#ffffff")
$btnKill.FontWeight = "Bold"
$btnKill.BorderThickness = New-Object Windows.Thickness(0)
$btnKill.Add_Click({
    $window.Tag = "kill"
    $window.Close()
})
$btnPanel.Children.Add($btnKill)

[Windows.Controls.Grid]::SetRow($btnPanel, 2)
$grid.Children.Add($btnPanel)

$window.Content = $grid
$window.ShowDialog() | Out-Null
Write-Output $window.Tag
`;

    exec(`powershell -NoProfile -NonInteractive -Command "${psScript.replace(/"/g, '\\"')}"`, (err, stdout) => {
      const action = stdout.trim();
      resolve(action === 'kill');
    });
  });
}

module.exports = { showConflictPopup };

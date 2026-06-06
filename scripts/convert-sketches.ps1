Add-Type -AssemblyName System.Drawing

function Convert-ToLineArt {
    param(
        [string]$InputPath,
        [string]$OutputPath,
        [int]$Threshold = 35,
        [double]$Gain = 2.2
    )

    $src = [System.Drawing.Bitmap]::FromFile($InputPath)
    $w = $src.Width
    $h = $src.Height
    $dst = New-Object System.Drawing.Bitmap $w, $h, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $rect = New-Object System.Drawing.Rectangle 0, 0, $w, $h
    $srcData = $src.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::ReadOnly, $src.PixelFormat)
    $dstData = $dst.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::WriteOnly, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb))

    $srcBytes = New-Object byte[] ($srcData.Stride * $h)
    $dstBytes = New-Object byte[] ($dstData.Stride * $h)
    [Runtime.InteropServices.Marshal]::Copy($srcData.Scan0, $srcBytes, 0, $srcBytes.Length)

    for ($y = 0; $y -lt $h; $y++) {
        for ($x = 0; $x -lt $w; $x++) {
            $i = $y * $srcData.Stride + $x * 4
            $b = $srcBytes[$i]
            $g = $srcBytes[$i + 1]
            $r = $srcBytes[$i + 2]
            $gray = [int](0.299 * $r + 0.587 * $g + 0.114 * $b)
            $line = 255 - $gray
            $oi = $y * $dstData.Stride + $x * 4

            if ($line -lt $Threshold) {
                $dstBytes[$oi] = 0
                $dstBytes[$oi + 1] = 0
                $dstBytes[$oi + 2] = 0
                $dstBytes[$oi + 3] = 0
            } else {
                $alpha = [Math]::Min(255, [int](($line - $Threshold) * $Gain))
                $dstBytes[$oi] = 255
                $dstBytes[$oi + 1] = 248
                $dstBytes[$oi + 2] = 255
                $dstBytes[$oi + 3] = $alpha
            }
        }
    }

    [Runtime.InteropServices.Marshal]::Copy($dstBytes, 0, $dstData.Scan0, $dstBytes.Length)
    $src.UnlockBits($srcData)
    $dst.UnlockBits($dstData)
    $dst.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $src.Dispose()
    $dst.Dispose()
}

$srcDir = "C:\Users\Alice\.cursor\projects\d-eco-clean-map-eco-clean-map\assets"
$outDir = "d:\eco_clean_map\eco_clean_map\assets\sketches"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

$map = @{
    "c__Users_Alice_AppData_Roaming_Cursor_User_workspaceStorage_cfc785182f48ff1e0133066f1f8fff21_images_photo_2026-06-06_01-06-47-b59cc618-bcc1-44f7-9cd2-f1b319f01652.png" = "line-village.png"
    "c__Users_Alice_AppData_Roaming_Cursor_User_workspaceStorage_cfc785182f48ff1e0133066f1f8fff21_images_photo_2026-06-06_01-37-34-8a15bfff-1edf-4095-9669-6578f5e534b5.png" = "line-sprout.png"
    "c__Users_Alice_AppData_Roaming_Cursor_User_workspaceStorage_cfc785182f48ff1e0133066f1f8fff21_images_photo_2026-06-06_01-37-39-dd4ea090-27a1-46e5-b32c-cc43d7ff2b89.png" = "line-horse.png"
    "c__Users_Alice_AppData_Roaming_Cursor_User_workspaceStorage_cfc785182f48ff1e0133066f1f8fff21_images_photo_2026-06-06_01-37-44-d649f851-fac5-4f3e-a0d5-716d891abf50.png" = "line-gazelles.png"
    "c__Users_Alice_AppData_Roaming_Cursor_User_workspaceStorage_cfc785182f48ff1e0133066f1f8fff21_images_photo_2026-06-06_01-17-04-04600516-f4dc-48a0-88ba-1171a7ca67bd.png" = "line-tree.png"
    "c__Users_Alice_AppData_Roaming_Cursor_User_workspaceStorage_cfc785182f48ff1e0133066f1f8fff21_images_photo_2026-06-06_01-17-03__5_-e98e1a5a-f0e6-4c9e-9bde-e3c6392effbc.png" = "line-spear.png"
}

foreach ($entry in $map.GetEnumerator()) {
    $input = Join-Path $srcDir $entry.Key
    $output = Join-Path $outDir $entry.Value
    if (Test-Path $input) {
        Convert-ToLineArt -InputPath $input -OutputPath $output
        Write-Output "OK $($entry.Value)"
    } else {
        Write-Output "MISSING $($entry.Key)"
    }
}

Get-ChildItem $outDir -Filter "sketch-*.png" | Remove-Item -Force
Get-ChildItem $outDir -Filter "line-*.png" | Select-Object Name, Length

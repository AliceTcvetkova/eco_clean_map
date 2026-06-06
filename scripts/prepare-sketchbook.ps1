Add-Type -AssemblyName System.Drawing

function Get-TrimBounds {
    param([System.Drawing.Bitmap]$Bmp, [int]$WhiteThreshold = 235)
    $w = $Bmp.Width
    $h = $Bmp.Height
    $minX = $w; $minY = $h; $maxX = 0; $maxY = 0

    for ($y = 0; $y -lt $h; $y++) {
        for ($x = 0; $x -lt $w; $x++) {
            $p = $Bmp.GetPixel($x, $y)
            if ($p.R -lt $WhiteThreshold -or $p.G -lt $WhiteThreshold -or $p.B -lt $WhiteThreshold) {
                if ($x -lt $minX) { $minX = $x }
                if ($y -lt $minY) { $minY = $y }
                if ($x -gt $maxX) { $maxX = $x }
                if ($y -gt $maxY) { $maxY = $y }
            }
        }
    }

    if ($maxX -le $minX) { return $null }

    $pad = [Math]::Min(24, [Math]::Min($w, $h) / 20)
    $minX = [Math]::Max(0, $minX - $pad)
    $minY = [Math]::Max(0, $minY - $pad)
    $maxX = [Math]::Min($w - 1, $maxX + $pad)
    $maxY = [Math]::Min($h - 1, $maxY + $pad)

    return @{
        X = $minX
        Y = $minY
        W = $maxX - $minX + 1
        H = $maxY - $minY + 1
    }
}

function Save-SketchbookImage {
    param(
        [string]$InputPath,
        [string]$OutputPath,
        [int]$MaxSize = 900
    )

    $src = [System.Drawing.Bitmap]::FromFile($InputPath)
    $bounds = Get-TrimBounds -Bmp $src

    if ($null -eq $bounds) {
        $bounds = @{ X = 0; Y = 0; W = $src.Width; H = $src.Height }
    }

    $crop = New-Object System.Drawing.Bitmap $bounds.W, $bounds.H
    $g = [System.Drawing.Graphics]::FromImage($crop)
    $g.DrawImage($src, 0, 0, (New-Object System.Drawing.Rectangle $bounds.X, $bounds.Y, $bounds.W, $bounds.H), [System.Drawing.GraphicsUnit]::Pixel)
    $g.Dispose()
    $src.Dispose()

    $scale = 1.0
    if ($crop.Width -gt $MaxSize -or $crop.Height -gt $MaxSize) {
        $scale = $MaxSize / [Math]::Max($crop.Width, $crop.Height)
    }

    $nw = [int]($crop.Width * $scale)
    $nh = [int]($crop.Height * $scale)
    $out = New-Object System.Drawing.Bitmap $nw, $nh
    $g2 = [System.Drawing.Graphics]::FromImage($out)
    $g2.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g2.DrawImage($crop, 0, 0, $nw, $nh)
    $g2.Dispose()
    $crop.Dispose()

    $out.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $out.Dispose()
    Write-Output "OK $OutputPath (${nw}x${nh})"
}

$srcDir = "C:\Users\Alice\.cursor\projects\d-eco-clean-map-eco-clean-map\assets"
$outDir = "d:\eco_clean_map\eco_clean_map\assets\sketchbook"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

$map = [ordered]@{
    "c__Users_Alice_AppData_Roaming_Cursor_User_workspaceStorage_cfc785182f48ff1e0133066f1f8fff21_images_photo_2026-06-06_01-38-33-59362957-92b9-4667-8c87-058e522e6e97.png" = "sb-bear.png"
    "c__Users_Alice_AppData_Roaming_Cursor_User_workspaceStorage_cfc785182f48ff1e0133066f1f8fff21_images_photo_2026-06-06_01-42-05-bbef1970-0b95-4dea-933f-fc18b69e39fb.png" = "sb-werewolf.png"
    "c__Users_Alice_AppData_Roaming_Cursor_User_workspaceStorage_cfc785182f48ff1e0133066f1f8fff21_images_photo_2026-06-06_01-17-03__2_-2d923090-2950-44ba-a7d9-90b5d188f8a1.png" = "sb-bulldog.png"
    "c__Users_Alice_AppData_Roaming_Cursor_User_workspaceStorage_cfc785182f48ff1e0133066f1f8fff21_images_photo_2026-06-06_01-38-00-4ff70b40-8a44-4c71-8cb6-0cfaca884fdc.png" = "sb-beagle.png"
    "c__Users_Alice_AppData_Roaming_Cursor_User_workspaceStorage_cfc785182f48ff1e0133066f1f8fff21_images_photo_2026-06-06_01-37-55-a5f8acb5-3eb4-443c-b26d-7205d521c2cf.png" = "sb-house.png"
    "c__Users_Alice_AppData_Roaming_Cursor_User_workspaceStorage_cfc785182f48ff1e0133066f1f8fff21_images_photo_2026-06-06_01-17-04__2_-3aa1ab66-3cad-46e4-bbf3-a7260c5b3ada.png" = "sb-lynx.png"
    "c__Users_Alice_AppData_Roaming_Cursor_User_workspaceStorage_cfc785182f48ff1e0133066f1f8fff21_images_photo_2026-06-06_01-17-03__4_-99fd7ee9-f905-485f-be5a-b87a9e340dff.png" = "sb-pterosaur.png"
    "c__Users_Alice_AppData_Roaming_Cursor_User_workspaceStorage_cfc785182f48ff1e0133066f1f8fff21_images_photo_2026-06-06_01-37-51-c626f8bc-ace7-48c3-a195-68fb4d7dfe57.png" = "sb-medieval.png"
    "c__Users_Alice_AppData_Roaming_Cursor_User_workspaceStorage_cfc785182f48ff1e0133066f1f8fff21_images_photo_2026-06-06_01-17-03__3_-926f1982-7d8d-488a-b367-60d263f2617b.png" = "sb-hippo.png"
    "c__Users_Alice_AppData_Roaming_Cursor_User_workspaceStorage_cfc785182f48ff1e0133066f1f8fff21_images_photo_2026-06-06_01-17-03-4df96804-0d85-4ac4-8a98-00ff6d2f74b6.png" = "sb-alpaca.png"
}

foreach ($entry in $map.GetEnumerator()) {
    $input = Join-Path $srcDir $entry.Key
    $output = Join-Path $outDir $entry.Value
    if (Test-Path $input) {
        Save-SketchbookImage -InputPath $input -OutputPath $output
    } else {
        Write-Output "MISSING $($entry.Key)"
    }
}

Get-ChildItem $outDir | Select-Object Name, Length

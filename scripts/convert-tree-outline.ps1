Add-Type -AssemblyName System.Drawing

function Convert-ToOutline {
    param(
        [string]$InputPath,
        [string]$OutputPath,
        [double]$EdgeThreshold = 55,
        [int]$Padding = 20
    )

    $src = [System.Drawing.Bitmap]::FromFile($InputPath)
    $w = $src.Width
    $h = $src.Height
    $gray = New-Object double[] ($w * $h)

    for ($y = 0; $y -lt $h; $y++) {
        for ($x = 0; $x -lt $w; $x++) {
            $p = $src.GetPixel($x, $y)
            $gray[$y * $w + $x] = 0.299 * $p.R + 0.587 * $p.G + 0.114 * $p.B
        }
    }

    $edges = New-Object double[] ($w * $h)
    for ($y = 1; $y -lt ($h - 1); $y++) {
        for ($x = 1; $x -lt ($w - 1); $x++) {
            $i = $y * $w + $x
            $gx = -$gray[$i - $w - 1] - 2 * $gray[$i - $w] - $gray[$i - $w + 1] + $gray[$i + $w - 1] + 2 * $gray[$i + $w] + $gray[$i + $w + 1]
            $gy = -$gray[$i - $w - 1] - 2 * $gray[$i - 1] - $gray[$i + $w - 1] + $gray[$i - $w + 1] + 2 * $gray[$i + 1] + $gray[$i + $w + 1]
            $edges[$i] = [Math]::Sqrt($gx * $gx + $gy * $gy)
        }
    }

    $minX = $w; $minY = $h; $maxX = 0; $maxY = 0
    for ($y = 1; $y -lt ($h - 1); $y++) {
        for ($x = 1; $x -lt ($w - 1); $x++) {
            if ($edges[$y * $w + $x] -ge $EdgeThreshold) {
                if ($x -lt $minX) { $minX = $x }
                if ($y -lt $minY) { $minY = $y }
                if ($x -gt $maxX) { $maxX = $x }
                if ($y -gt $maxY) { $maxY = $y }
            }
        }
    }

    if ($maxX -le $minX) {
        Write-Output "No edges found"
        $src.Dispose()
        return
    }

    $minX = [Math]::Max(0, $minX - $Padding)
    $minY = [Math]::Max(0, $minY - $Padding)
    $maxX = [Math]::Min($w - 1, $maxX + $Padding)
    $maxY = [Math]::Min($h - 1, $maxY + $Padding)
    $cw = $maxX - $minX + 1
    $ch = $maxY - $minY + 1

    $dst = New-Object System.Drawing.Bitmap $cw, $ch, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    for ($y = 0; $y -lt $ch; $y++) {
        for ($x = 0; $x -lt $cw; $x++) {
            $mag = $edges[($minY + $y) * $w + ($minX + $x)]
            if ($mag -ge $EdgeThreshold) {
                $alpha = [Math]::Min(220, [int](($mag - $EdgeThreshold) * 1.2))
                $dst.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($alpha, 255, 248, 255))
            } else {
                $dst.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
            }
        }
    }

    $dst.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $src.Dispose()
    $dst.Dispose()
    Write-Output "Saved $OutputPath (${cw}x${ch})"
}

$srcDir = "C:\Users\Alice\.cursor\projects\d-eco-clean-map-eco-clean-map\assets"
$outDir = "d:\eco_clean_map\eco_clean_map\assets\sketches"
$treeSrc = Join-Path $srcDir "c__Users_Alice_AppData_Roaming_Cursor_User_workspaceStorage_cfc785182f48ff1e0133066f1f8fff21_images_photo_2026-06-06_01-17-04-04600516-f4dc-48a0-88ba-1171a7ca67bd.png"
$treeOut = Join-Path $outDir "line-tree.png"

Convert-ToOutline -InputPath $treeSrc -OutputPath $treeOut -EdgeThreshold 58

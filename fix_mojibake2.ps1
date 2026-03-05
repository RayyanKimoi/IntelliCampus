$fp = "f:\IntelliCampus-main\IntelliCampus\frontend\src\app\student\practice\page.tsx"
$bytes = [System.IO.File]::ReadAllBytes($fp)

function ReplaceBytes([byte[]]$src, [byte[]]$find, [byte[]]$rep) {
    $out = New-Object System.Collections.Generic.List[byte]
    $i = 0
    while ($i -lt $src.Length) {
        if ($i + $find.Length -le $src.Length) {
            $m = $true
            for ($j = 0; $j -lt $find.Length; $j++) {
                if ($src[$i+$j] -ne $find[$j]) { $m = $false; break }
            }
            if ($m) { foreach ($b in $rep) { $out.Add($b) }; $i += $find.Length; continue }
        }
        $out.Add($src[$i]); $i++
    }
    return [byte[]]$out.ToArray()
}

# en dash U+2013 (E2 80 93) double-encoded as: C3A2 E282AC E2809C
$bytes = ReplaceBytes $bytes @(0xC3,0xA2,0xE2,0x82,0xAC,0xE2,0x80,0x9C) @(0xE2,0x80,0x93)

# right single quote U+2019 (E2 80 99) double-encoded as: C3A2 E282AC E284A2
$bytes = ReplaceBytes $bytes @(0xC3,0xA2,0xE2,0x82,0xAC,0xE2,0x84,0xA2) @(0xE2,0x80,0x99)

# ellipsis U+2026 (E2 80 A6) double-encoded as: C3A2 E282AC C2A6
$bytes = ReplaceBytes $bytes @(0xC3,0xA2,0xE2,0x82,0xAC,0xC2,0xA6) @(0xE2,0x80,0xA6)

# middle dot U+00B7 (C2 B7) double-encoded as: C382 C2B7
$bytes = ReplaceBytes $bytes @(0xC3,0x82,0xC2,0xB7) @(0xC2,0xB7)

# trophy U+1F3C6 (F0 9F 8F 86) double-encoded as: C3B0 C5B8 C28F E280A0
$bytes = ReplaceBytes $bytes @(0xC3,0xB0,0xC5,0xB8,0xC2,0x8F,0xE2,0x80,0xA0) @(0xF0,0x9F,0x8F,0x86)

# glowing star U+1F31F (F0 9F 8C 9F) double-encoded as: C3B0 C5B8 C592 C5B8
$bytes = ReplaceBytes $bytes @(0xC3,0xB0,0xC5,0xB8,0xC5,0x92,0xC5,0xB8) @(0xF0,0x9F,0x8C,0x9F)

# books U+1F4DA (F0 9F 93 9A) double-encoded as: C3B0 C5B8 E2809C C5A1
$bytes = ReplaceBytes $bytes @(0xC3,0xB0,0xC5,0xB8,0xE2,0x80,0x9C,0xC5,0xA1) @(0xF0,0x9F,0x93,0x9A)

# lightbulb U+1F4A1 (F0 9F 92 A1) double-encoded as: C3B0 C5B8 E28098 C2A1
$bytes = ReplaceBytes $bytes @(0xC3,0xB0,0xC5,0xB8,0xE2,0x80,0x98,0xC2,0xA1) @(0xF0,0x9F,0x92,0xA1)

[System.IO.File]::WriteAllBytes($fp, $bytes)

# Verify
$verify = [System.IO.File]::ReadAllText($fp, [System.Text.Encoding]::UTF8)
$bad = @("C3A2E282AC", "C38AC2B7")  # just check in hex won't work, check strings
$lines = $verify -split "`n"
$mojibake_lines = $lines | Where-Object { $_ -match "C3A2|[xE2x82xAC]" }
Write-Output "File bytes: $($bytes.Length)"
Write-Output "Lines with potential mojibake:"
($lines | Where-Object { $_ -match "(?i)acirc|euro|201C" }).Count
Write-Output "Done."

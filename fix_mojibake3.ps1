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

# em dash (—, U+2014, E2 80 94) - double encoded as: C3A2 E282AC E2809D
$bytes = ReplaceBytes $bytes @(0xC3,0xA2,0xE2,0x82,0xAC,0xE2,0x80,0x9D) @(0xE2,0x80,0x94)

# lightbulb (U+1F4A1, F0 9F 92 A1) - double encoded as: C3B0 C5B8 E28099 C2A1
$bytes = ReplaceBytes $bytes @(0xC3,0xB0,0xC5,0xB8,0xE2,0x80,0x99,0xC2,0xA1) @(0xF0,0x9F,0x92,0xA1)

[System.IO.File]::WriteAllBytes($fp, $bytes)

$remaining = (Select-String -Path $fp -Pattern "â€|Â·|ðŸ" -Encoding UTF8 | Measure-Object).Count
Write-Output "Remaining mojibake lines: $remaining"

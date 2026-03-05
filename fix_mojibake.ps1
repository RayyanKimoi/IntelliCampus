$fp = "f:\IntelliCampus-main\IntelliCampus\frontend\src\app\student\practice\page.tsx"
$bytes = [System.IO.File]::ReadAllBytes($fp)

# These are UTF-8 bytes that were double-encoded (originally valid UTF-8, then
# misread as Windows-1252, then re-encoded as UTF-8).
#
# Original char -> UTF-8 bytes -> misread as CP1252 -> re-encoded as UTF-8 bytes
#
# en dash U+2013: E2 80 93 -> a-hat(U+00E2, C3 A2) + euro(U+20AC, E2 82 AC) + ldquote(U+201C, E2 80 9C)
# ellipsis U+2026: E2 80 A6 -> a-hat(C3 A2) + euro(E2 82 AC) + dagger(U+2020 CP1252 0x86, E2 80 A0)
# rsquo U+2019: E2 80 99 -> a-hat(C3 A2) + euro(E2 82 AC) + trademark(U+2122 CP1252 0x99, E2 84 A2)
# ldquo U+201C: E2 80 9C -> a-hat(C3 A2) + euro(E2 82 AC) + CP1252 0x9C -> U+0153 (oe ligature C5 93)
# middle dot U+00B7: C2 B7 -> a-tilde(U+00C2, C3 82) + middle-dot(U+00B7, C2 B7)

# Helper function
function ReplaceBytes([byte[]]$source, [byte[]]$find, [byte[]]$replace) {
    $result = New-Object System.Collections.Generic.List[byte]
    $i = 0
    while ($i -lt $source.Length) {
        $match = $true
        if ($i + $find.Length -le $source.Length) {
            for ($j = 0; $j -lt $find.Length; $j++) {
                if ($source[$i + $j] -ne $find[$j]) { $match = $false; break }
            }
        } else { $match = $false }

        if ($match) {
            foreach ($b in $replace) { $result.Add($b) }
            $i += $find.Length
        } else {
            $result.Add($source[$i])
            $i++
        }
    }
    return $result.ToArray()
}

# en dash (–, U+2013 -> UTF-8: E2 80 93)
# Double-encoded: C3 A2   E2 82 AC   E2 80 9C
$bytes = ReplaceBytes $bytes @(0xC3,0xA2, 0xE2,0x82,0xAC, 0xE2,0x80,0x9C) @(0xE2,0x80,0x93)

# right single quote (', U+2019 -> UTF-8: E2 80 99)
# Double-encoded: C3 A2   E2 82 AC   E2 84 A2
$bytes = ReplaceBytes $bytes @(0xC3,0xA2, 0xE2,0x82,0xAC, 0xE2,0x84,0xA2) @(0xE2,0x80,0x99)

# ellipsis (…, U+2026 -> UTF-8: E2 80 A6)
# Double-encoded: C3 A2   E2 82 AC   E2 80 A0
$bytes = ReplaceBytes $bytes @(0xC3,0xA2, 0xE2,0x82,0xAC, 0xE2,0x80,0xA0) @(0xE2,0x80,0xA6)

# middle dot (·, U+00B7 -> UTF-8: C2 B7)
# Double-encoded: C3 82   C2 B7
$bytes = ReplaceBytes $bytes @(0xC3,0x82, 0xC2,0xB7) @(0xC2,0xB7)

# emoji: 🏆 (U+1F3C6 -> F0 9F 8F 86)
# Double-encoded as 4 chars - complex, handle via string after
$c = [System.Text.Encoding]::UTF8.GetString($bytes)
$c = $c.Replace([char]0x00F0 + [char]0x0178 + [char]0x201A, [System.Text.Encoding]::UTF8.GetString([byte[]]@(0xF0,0x9F)))
$c = $c.Replace("ðŸ†", "🏆")
$c = $c.Replace("ðŸŒŸ", "🌟")
$c = $c.Replace("ðŸ"š", "📚")
$c = $c.Replace("ðŸ'¡", "💡")
$bytes = [System.Text.Encoding]::UTF8.GetBytes($c)

[System.IO.File]::WriteAllBytes($fp, $bytes)

# Verify by reading back as string
$verify = [System.IO.File]::ReadAllText($fp, [System.Text.Encoding]::UTF8)
$patterns = @("â€","Â·","ðŸ")
foreach ($p in $patterns) {
    $count = ($verify.Split($p).Length - 1)
    Write-Output "Pattern '$p' remaining: $count"
}
Write-Output "Done."

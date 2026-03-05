$fp = "f:\IntelliCampus-main\IntelliCampus\frontend\src\app\student\practice\page.tsx"
$bytes = [System.IO.File]::ReadAllBytes($fp)
$c = [System.Text.Encoding]::UTF8.GetString($bytes)

# en dash: U+E2 U+80 U+93 read as windows-1252 = â€"
$c = $c.Replace([System.Text.Encoding]::UTF8.GetString([byte[]]@(0xE2, 0x80, 0x93)), [char]0x2013)
# right single quote: U+E2 U+80 U+99 = â€™
$c = $c.Replace([System.Text.Encoding]::UTF8.GetString([byte[]]@(0xE2, 0x80, 0x99)), [char]0x2019)
# ellipsis: U+E2 U+80 U+A6 = â€¦
$c = $c.Replace([System.Text.Encoding]::UTF8.GetString([byte[]]@(0xE2, 0x80, 0xA6)), [char]0x2026)
# middle dot / Â· = U+C2 U+B7
$c = $c.Replace([System.Text.Encoding]::UTF8.GetString([byte[]]@(0xC2, 0xB7)), [char]0x00B7)
# emoji 🏆 = F0 9F 8F 86 double-encoded as C3 B0 C5 B8 E2 80 9A coming out as ðŸ†
# These 4-byte emoji get triple-encoded - handle by hex pattern

# ðŸ† = 🏆 (U+1F3C6)
$trophy = [System.Text.Encoding]::UTF8.GetString([byte[]]@(0xC3, 0xB0, 0xC5, 0xB8, 0xE2, 0x80, 0xA0))
# Actually let's just do string-level replacement of what we see:
# The mojibake sequences we need to replace:
# Using character codes directly

# â€" (3 chars: U+00E2, U+0080, U+0093) -> U+2013 (en dash)
$c = $c -replace [char]0xE2 + [char]0x80 + [char]0x93, [char]0x2013

Write-Output "Checking for remaining mojibake..."
$remaining = ($c | Select-String -Pattern "â€|Â·|ðŸ").Matches.Count
Write-Output "Remaining: $remaining"

[System.IO.File]::WriteAllText($fp, $c, [System.Text.UTF8Encoding]::new($false))
Write-Output "Done"

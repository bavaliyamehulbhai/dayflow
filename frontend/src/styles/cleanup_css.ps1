$path = "c:\Users\Mehul\Desktop\c\3.REACT PROJECTS\dayflow-mern-stack\dayflow\frontend\src\styles\globals.css"
$lines = Get-Content $path
$newLines = @()
foreach ($line in $lines) {
    if ($line -match "adow\(0 0 40px currentColor\)") {
        continue
    }
    # Add other corrupted fragments to skip
    if ($line -match "`n/\* --- MOBILE PREMIUM OVERRIDES --- \*/`n") {
        continue
    }
    $newLines += $line
}
$newLines | Set-Content $path

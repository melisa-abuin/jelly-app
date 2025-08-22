# Get root directory
$ROOT_DIR = git rev-parse --show-toplevel
Set-Location $ROOT_DIR

# Run yarn install and build desktop with verbose
yarn
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
yarn build:desktop -v
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

# Make release directory
New-Item -ItemType Directory -Force -Path ./release | Out-Null

# Copy .msi files from the MSI bundle directory
Copy-Item -Path "$ROOT_DIR/src-tauri/target/release/bundle/msi/*.msi" -Destination ./release -Force

# Copy .exe files from the EXE bundle directory
Copy-Item -Path "$ROOT_DIR/src-tauri/target/release/bundle/nsis/*.exe" -Destination ./release -Force

# Prepend 'desktop-' to all .msi and .exe files in ./release
Get-ChildItem -Path ./release/*.msi,./release/*.exe -File | ForEach-Object {
    $newName = "desktop-$($_.Name)"
    Rename-Item -Path $_.FullName -NewName $newName
}

Write-Output "Done!"

# create-icon.ps1
Add-Type -AssemblyName System.Drawing

Write-Host "Création de l'icône..."

# Créer une image de 256x256
$bmp = New-Object System.Drawing.Bitmap(256,256)
$g = [System.Drawing.Graphics]::FromImage($bmp)

# Fond orange
$g.Clear([System.Drawing.Color]::Orange)

# Texte "KL" en blanc
$font = New-Object System.Drawing.Font('Arial', 48)
$brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
$g.DrawString('KL', $font, $brush, 50, 80)

# Sauvegarder
$bmp.Save('icon.png')

# Nettoyer
$g.Dispose()
$bmp.Dispose()
$brush.Dispose()
$font.Dispose()

Write-Host "✅ Icône créée: icon.png"
Write-Host "Taille du fichier: $((Get-Item 'icon.png').Length) octets"
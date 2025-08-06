@echo off
echo Cache temizleniyor...
cd /d "d:\Plantly"
del /q /s node_modules\.cache\* 2>nul
rmdir /s /q .expo 2>nul
rmdir /s /q node_modules\.cache 2>nul
echo Expo development server baslatiliyor...
npx expo start --clear

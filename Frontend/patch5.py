import os

app_path = r"c:\Users\kisha\Downloads\Projects\Exam Hall Allocator project\frontend\src\App.jsx"
with open(app_path, "r", encoding="utf-8") as f:
    content = f.read()

# Replace all occurrences of `/download-` with `/download/`
content = content.replace("/download-room-range", "/download/room-range")
content = content.replace("/download-staff", "/download/staff")
content = content.replace("/download-seat-map", "/download/seat-map")

with open(app_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Fixed download links")

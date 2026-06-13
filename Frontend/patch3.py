import os

app_path = r"c:\Users\kisha\Downloads\Projects\Exam Hall Allocator project\frontend\src\App.jsx"
with open(app_path, "r", encoding="utf-8") as f:
    content = f.read()

step2_next_old = """            <button 
              onClick={async () => {
                if (wizState.csv1 && wizState.csv3) {
                  // Count students and subjects
                  const sText = await wizState.csv1.text();
                  const sLines = sText.split('\\n').filter(l => l.trim() !== '');
                  const studentsCount = Math.max(0, sLines.length - 1);
                  const headersS = sLines[0].split(',');
                  const subjIdx = headersS.findIndex(h => h.trim().toLowerCase() === 'subject_code');
                  const subjectCounts = {};
                  for(let i=1; i<sLines.length; i++) {
                    const cols = sLines[i].split(',');
                    if (cols[subjIdx]) {
                      const code = cols[subjIdx].trim();
                      subjectCounts[code] = (subjectCounts[code] || 0) + 1;
                    }
                  }
                  
                  // Parse rooms
                  const rText = await wizState.csv3.text();
                  const rLines = rText.split('\\n').filter(l => l.trim() !== '');
                  const headers = rLines[0].split(',');
                  const roomIdx = headers.findIndex(h => h.trim().toLowerCase().includes('room'));
                  const roomsData = [];
                  for(let i=1; i<rLines.length; i++) {
                    const cols = rLines[i].split(',');
                    if (cols[roomIdx]) roomsData.push(cols[roomIdx].trim());
                  }
                  
                  setWizState(s => ({...s, studentsCount, subjectCounts, roomsData, roomLayouts: {}}));
                  setStep(3);
                }
              }} 
              disabled={!wizState.csv1 || !wizState.csv2 || !wizState.csv3}"""

step2_next_new = """            <button 
              onClick={async () => {
                if (wizState.csv1 && wizState.csv2 && wizState.csv3) {
                  try {
                    // Check Students CSV headers
                    const sText = await wizState.csv1.text();
                    const sLines = sText.split('\\n').filter(l => l.trim() !== '');
                    const sHeaders = sLines[0].toLowerCase().split(',').map(h=>h.trim());
                    const reqS = ['name', 'roll_no', 'dept', 'year', 'degree', 'subject_code'];
                    // allow rollno or roll_no
                    const missingS = reqS.filter(req => {
                      if (req === 'roll_no') return !sHeaders.includes('roll_no') && !sHeaders.includes('rollno');
                      return !sHeaders.includes(req);
                    });
                    if (missingS.length > 0) return alert(`Students CSV missing columns: ${missingS.join(', ')}`);

                    // Check Teachers CSV headers
                    const tText = await wizState.csv2.text();
                    const tLines = tText.split('\\n').filter(l => l.trim() !== '');
                    const tHeaders = tLines[0].toLowerCase().split(',').map(h=>h.trim());
                    const reqT = ['teacher_name', 'teacher_id'];
                    const missingT = reqT.filter(req => !tHeaders.includes(req) && !tHeaders.includes(req.replace('_','')));
                    if (missingT.length > 0) return alert(`Teachers CSV missing columns: ${missingT.join(', ')}`);

                    // Check Rooms CSV headers
                    const rText = await wizState.csv3.text();
                    const rLines = rText.split('\\n').filter(l => l.trim() !== '');
                    const rHeaders = rLines[0].toLowerCase().split(',').map(h=>h.trim());
                    const roomIdx = rHeaders.findIndex(h => h.includes('room'));
                    if (roomIdx === -1) return alert(`Rooms CSV missing 'room_no' column`);

                    // Process Data if valid
                    const studentsCount = Math.max(0, sLines.length - 1);
                    const subjIdx = sHeaders.findIndex(h => h === 'subject_code');
                    const subjectCounts = {};
                    for(let i=1; i<sLines.length; i++) {
                      const cols = sLines[i].split(',');
                      if (cols[subjIdx]) {
                        const code = cols[subjIdx].trim();
                        subjectCounts[code] = (subjectCounts[code] || 0) + 1;
                      }
                    }
                    
                    const roomsData = [];
                    for(let i=1; i<rLines.length; i++) {
                      const cols = rLines[i].split(',');
                      if (cols[roomIdx]) roomsData.push(cols[roomIdx].trim());
                    }
                    
                    if (roomsData.length === 0) return alert("Rooms CSV contains no valid rooms!");
                    
                    setWizState(s => ({...s, studentsCount, subjectCounts, roomsData, roomLayouts: {}}));
                    setStep(3);
                  } catch (err) {
                    alert("Error parsing CSV files. Please check the formats.");
                  }
                }
              }} 
              disabled={!wizState.csv1 || !wizState.csv2 || !wizState.csv3}"""

if step2_next_old in content:
    content = content.replace(step2_next_old, step2_next_new)
    with open(app_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Done patching CSV validation")
else:
    print("Could not find the target string to replace.")
